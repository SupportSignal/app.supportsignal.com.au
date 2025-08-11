// @ts-nocheck
import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Retry configuration for preventing infinite loops
const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 8000,  // 8 seconds
  BACKOFF_MULTIPLIER: 2
};

// Helper function to implement exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  context: string,
  maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      console.warn(`🔄 RETRY ATTEMPT ${attempt}/${maxAttempts}`, {
        context,
        error: lastError.message,
        timestamp: new Date().toISOString()
      });
      
      // Don't wait on the last attempt
      if (attempt < maxAttempts) {
        const delay = Math.min(
          RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
          RETRY_CONFIG.MAX_DELAY
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries exhausted
  console.error(`❌ ALL RETRIES EXHAUSTED`, {
    context,
    maxAttempts,
    finalError: lastError?.message,
    timestamp: new Date().toISOString()
  });
  
  throw new Error(`Operation failed after ${maxAttempts} attempts: ${lastError?.message}`);
};

// Generate clarification questions for an incident phase
export const generateClarificationQuestions = action({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
    narrative_content: v.string(),
  },
  handler: async (ctx, args) => {
    // Authenticate user with retry
    const user = await retryWithBackoff(
      async () => await ctx.runQuery(internal.auth.verifySession, {
        sessionToken: args.sessionToken,
      }),
      `auth.verifySession for ${args.sessionToken.slice(0, 8)}...`
    );

    if (!user) {
      throw new Error("Authentication required");
    }

    // Get incident details for context with retry
    const incident = await retryWithBackoff(
      async () => await ctx.runQuery(internal.incidents.getIncidentById, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
      }),
      `incidents.getIncidentById for ${args.incident_id}`
    );

    if (!incident) {
      throw new Error("Incident not found");
    }

    // Check for existing questions to avoid duplicates with retry
    const existingQuestions = await retryWithBackoff(
      async () => await ctx.runQuery(internal.aiClarification.getClarificationQuestions, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
        phase: args.phase,
      }),
      `aiClarification.getClarificationQuestions for ${args.incident_id}/${args.phase}`
    );

    // Create narrative hash for caching with retry
    const narrativeHash = await retryWithBackoff(
      async () => await ctx.runMutation(internal.incidents.createNarrativeHash, {
        content: args.narrative_content,
      }),
      `incidents.createNarrativeHash`
    );

    // If questions exist and narrative hasn't changed, return cached questions
    if (existingQuestions.length > 0) {
      const incident_narrative = await ctx.runQuery(internal.incidents.getIncidentNarrativeByIncidentId, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
      });

      if (incident_narrative?.narrative_hash === narrativeHash) {
        return {
          questions: existingQuestions,
          cached: true,
          correlation_id: null,
        };
      }
    }

    // Generate new questions using AI service
    const generation_result = await ctx.runAction(internal.lib.ai.questionGenerator.generateQuestionsForPhase, {
      participant_name: incident.participant_name,
      reporter_name: incident.reporter_name,
      location: incident.location,
      event_date_time: incident.event_date_time,
      phase: args.phase,
      narrative_content: args.narrative_content,
      user_id: user._id,
      incident_id: args.incident_id,
    });

    // Store generated questions in database
    const storedQuestions = [];
    for (const question of generation_result.questions) {
      const questionId = await ctx.runMutation(internal.aiClarification.storeClarificationQuestion, {
        incident_id: args.incident_id,
        question_id: question.question_id,
        phase: args.phase,
        question_text: question.question_text,
        question_order: question.question_order,
        ai_model: generation_result.ai_model_used,
        prompt_version: "v1.0.0",
        correlation_id: generation_result.correlation_id,
      });

      storedQuestions.push({
        _id: questionId,
        question_id: question.question_id,
        question_text: question.question_text,
        question_order: question.question_order,
        phase: args.phase,
        is_active: true,
        answered: false,
      });
    }

    // Update incident narrative hash
    await ctx.runMutation(internal.incidents.updateIncidentNarrativeHash, {
      incident_id: args.incident_id,
      narrative_hash: narrativeHash,
    });

    return {
      questions: storedQuestions,
      cached: false,
      correlation_id: generation_result.correlation_id,
    };
  },
});

// Get clarification questions for an incident and phase
export const getClarificationQuestions = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    phase: v.optional(v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    )),
  },
  handler: async (ctx, args) => {
    // Authenticate user with retry
    const user = await retryWithBackoff(
      async () => await ctx.runQuery(internal.auth.verifySession, {
        sessionToken: args.sessionToken,
      }),
      `auth.verifySession for getClarificationQuestions`
    );

    if (!user) {
      throw new Error("Authentication required");
    }

    // Build query
    let questionsQuery = ctx.db
      .query("clarification_questions")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .filter((q) => q.eq(q.field("is_active"), true));

    // Filter by phase if specified
    if (args.phase) {
      questionsQuery = ctx.db
        .query("clarification_questions") 
        .withIndex("by_incident_phase", (q) => 
          q.eq("incident_id", args.incident_id).eq("phase", args.phase)
        )
        .filter((q) => q.eq(q.field("is_active"), true));
    }

    const questions = await questionsQuery.order("asc").collect();

    // Get answers for each question
    const questionsWithAnswers = await Promise.all(
      questions.map(async (question) => {
        const answer = await ctx.db
          .query("clarification_answers")
          .withIndex("by_question", (q) => q.eq("question_id", question.question_id))
          .first();

        return {
          ...question,
          answered: !!answer,
          answer_text: answer?.answer_text || "",
          answer_id: answer?._id || null,
          updated_at: answer?.updated_at || null,
        };
      })
    );

    return questionsWithAnswers.sort((a, b) => a.question_order - b.question_order);
  },
});

// Submit answer to clarification question
export const submitClarificationAnswer = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    question_id: v.string(),
    answer_text: v.string(),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const user = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken: args.sessionToken,
    });

    if (!user) {
      throw new Error("Authentication required");
    }

    // Calculate answer metrics
    const characterCount = args.answer_text.length;
    const wordCount = args.answer_text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const isComplete = characterCount > 10; // Basic completeness check

    const now = Date.now();

    // Check if answer already exists
    const existingAnswer = await ctx.db
      .query("clarification_answers")
      .withIndex("by_question", (q) => q.eq("question_id", args.question_id))
      .first();

    let answerId: Id<"clarification_answers">;

    if (existingAnswer) {
      // Update existing answer
      await ctx.db.patch(existingAnswer._id, {
        answer_text: args.answer_text,
        updated_at: now,
        is_complete: isComplete,
        character_count: characterCount,
        word_count: wordCount,
      });
      answerId = existingAnswer._id;
    } else {
      // Create new answer
      answerId = await ctx.db.insert("clarification_answers", {
        incident_id: args.incident_id,
        question_id: args.question_id,
        answer_text: args.answer_text,
        phase: args.phase,
        answered_at: now,
        answered_by: user._id,
        updated_at: now,
        is_complete: isComplete,
        character_count: characterCount,
        word_count: wordCount,
      });
    }

    // Update incident workflow status if needed
    await ctx.runMutation(internal.incidents.updateIncidentProgressStatus, {
      incident_id: args.incident_id,
      phase: args.phase,
      questions_completed: true,
    });

    return {
      success: true,
      answer_id: answerId,
      metrics: {
        character_count: characterCount,
        word_count: wordCount,
        is_complete: isComplete,
      },
    };
  },
});

// Internal helper to store clarification questions
export const storeClarificationQuestion = mutation({
  args: {
    incident_id: v.id("incidents"),
    question_id: v.string(),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
    question_text: v.string(),
    question_order: v.number(),
    ai_model: v.optional(v.string()),
    prompt_version: v.optional(v.string()),
    correlation_id: v.string(),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("clarification_questions", {
      incident_id: args.incident_id,
      question_id: args.question_id,
      phase: args.phase,
      question_text: args.question_text,
      question_order: args.question_order,
      generated_at: Date.now(),
      ai_model: args.ai_model,
      prompt_version: args.prompt_version,
      is_active: true,
    });

    return questionId;
  },
});

// Get clarification answers for an incident
export const getClarificationAnswers = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    phase: v.optional(v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    )),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const user = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken: args.sessionToken,
    });

    if (!user) {
      throw new Error("Authentication required");
    }

    // Build query
    let answersQuery = ctx.db
      .query("clarification_answers")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id));

    // Filter by phase if specified  
    if (args.phase) {
      answersQuery = ctx.db
        .query("clarification_answers")
        .withIndex("by_incident_phase", (q) => 
          q.eq("incident_id", args.incident_id).eq("phase", args.phase)
        );
    }

    const answers = await answersQuery.collect();

    return answers.sort((a, b) => a.answered_at - b.answered_at);
  },
});