// @ts-nocheck
import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requirePermission, PERMISSIONS } from "./permissions";

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

// Generate clarification questions for all phases simultaneously (proactive generation)
export const generateAllClarificationQuestions = action({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    narrative: v.object({
      before_event: v.string(),
      during_event: v.string(),
      end_event: v.string(),
      post_event: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Authenticate user with retry
    const user = await retryWithBackoff(
      async () => await ctx.runQuery(internal.auth.verifySession, {
        sessionToken: args.sessionToken,
      }),
      `auth.verifySession for generateAllClarificationQuestions`
    );

    if (!user) {
      throw new Error("Authentication failed - invalid session token");
    }

    console.log("🚀 Starting proactive question generation for all phases", {
      incident_id: args.incident_id,
      user_id: user._id,
      timestamp: new Date().toISOString(),
    });

    // Define all phases to process
    const phases = ["before_event", "during_event", "end_event", "post_event"] as const;
    
    // Create individual generation promises for parallel processing
    const generationPromises = phases.map(async (phase) => {
      const narrative_content = args.narrative[phase];
      
      // Skip phases with no content
      if (!narrative_content?.trim()) {
        console.log(`⏭️ Skipping ${phase} - no narrative content`);
        return {
          phase,
          success: false,
          reason: "no_content",
          questions: [],
        };
      }

      try {
        console.log(`🔄 Generating questions for ${phase}...`);
        
        const result = await ctx.runAction(internal.aiClarification.generateClarificationQuestions, {
          sessionToken: args.sessionToken,
          incident_id: args.incident_id,
          phase,
          narrative_content,
        });

        console.log(`✅ Successfully generated ${result.questions?.length || 0} questions for ${phase}`);
        
        return {
          phase,
          success: true,
          questions: result.questions || [],
          cached: result.cached || false,
          correlation_id: result.correlation_id,
        };
      } catch (error) {
        console.error(`❌ Failed to generate questions for ${phase}:`, error);
        
        return {
          phase,
          success: false,
          reason: error instanceof Error ? error.message : "unknown_error",
          questions: [],
        };
      }
    });

    // Execute all generations in parallel
    const results = await Promise.allSettled(generationPromises);
    
    // Process results
    const successful_phases: string[] = [];
    const failed_phases: string[] = [];
    const total_questions_generated = results.reduce((count, result) => {
      if (result.status === "fulfilled" && result.value.success) {
        successful_phases.push(result.value.phase);
        return count + result.value.questions.length;
      } else {
        failed_phases.push(result.status === "fulfilled" ? result.value.phase : "unknown");
        return count;
      }
    }, 0);

    console.log("🎯 Batch generation completed", {
      incident_id: args.incident_id,
      successful_phases,
      failed_phases,
      total_questions_generated,
      duration_ms: Date.now(),
    });

    // Return comprehensive results
    return {
      success: successful_phases.length > 0,
      total_questions_generated,
      successful_phases,
      failed_phases,
      phase_results: results.map(result => 
        result.status === "fulfilled" ? result.value : { 
          phase: "unknown", 
          success: false, 
          reason: result.reason 
        }
      ),
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
          .withIndex("by_incident_phase", (q) => 
            q.eq("incident_id", args.incident_id).eq("phase", question.phase)
          )
          .filter((q) => q.eq(q.field("question_id"), question.question_id))
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
      .withIndex("by_incident_phase", (q) => 
        q.eq("incident_id", args.incident_id).eq("phase", args.phase)
      )
      .filter((q) => q.eq(q.field("question_id"), args.question_id))
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

// Generate mock answers for clarification questions (sample data feature)
export const generateMockAnswers = action({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const user = await retryWithBackoff(
      async () => await ctx.runQuery(internal.auth.verifySession, {
        sessionToken: args.sessionToken,
      }),
      `auth.verifySession for generateMockAnswers`
    );

    if (!user) {
      throw new Error("Authentication required");
    }

    // Check SAMPLE_DATA permission
    const permissionCheck = await ctx.runQuery(internal.permissions.checkPermission, {
      sessionToken: args.sessionToken,
      permission: PERMISSIONS.SAMPLE_DATA,
    });

    if (!permissionCheck.hasPermission) {
      throw new Error(`Sample data permission required to generate mock answers: ${permissionCheck.reason}`);
    }

    // Get incident details for context
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

    // Get existing questions for this phase
    const questions = await retryWithBackoff(
      async () => await ctx.runQuery(internal.aiClarification.getClarificationQuestions, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
        phase: args.phase,
      }),
      `getClarificationQuestions for ${args.incident_id}/${args.phase}`
    );

    if (!questions || questions.length === 0) {
      throw new Error(`No questions found for ${args.phase} phase. Please generate questions first.`);
    }

    // Get phase narrative from incident
    const getPhaseNarrative = (phase: string, narrative: any) => {
      if (!narrative) return "";
      switch (phase) {
        case "before_event": return narrative.before_event || "";
        case "during_event": return narrative.during_event || "";
        case "end_event": return narrative.end_event || "";
        case "post_event": return narrative.post_event || "";
        default: return "";
      }
    };

    // Debug: Log the incident structure to understand the narrative access
    console.log("🐛 INCIDENT DEBUG", {
      incident_id: args.incident_id,
      phase: args.phase,
      hasIncident: !!incident,
      incidentKeys: incident ? Object.keys(incident) : [],
      hasNarrative: !!incident?.narrative,
      narrativeKeys: incident?.narrative ? Object.keys(incident.narrative) : [],
      narrativeStructure: incident?.narrative,
    });

    const phaseNarrative = getPhaseNarrative(args.phase, incident.narrative);
    
    console.log("🐛 NARRATIVE DEBUG", {
      phase: args.phase,
      phaseNarrative,
      phaseNarrativeLength: phaseNarrative?.length || 0,
      hasContent: !!phaseNarrative?.trim(),
    });

    // For mock answers, we can work with minimal or no narrative content
    const narrativeForContext = phaseNarrative?.trim() || `No detailed narrative available for ${args.phase} phase.`;

    // Get the mock answers prompt template
    const prompt = await ctx.runQuery(internal.promptManager.getActivePrompt, {
      prompt_name: "generate_mock_answers",
      subsystem: "incidents",
    });

    if (!prompt) {
      throw new Error("Mock answers prompt template not found. Please seed prompt templates first.");
    }

    // Prepare questions array for the AI prompt
    const questionsForPrompt = questions.map(q => ({
      question_id: q.question_id,
      question: q.question_text,
    }));

    // Replace template variables
    let finalPrompt = prompt.prompt_template
      .replace(/\{\{participant_name\}\}/g, incident.participant_name || "")
      .replace(/\{\{reporter_name\}\}/g, incident.reporter_name || "")
      .replace(/\{\{location\}\}/g, incident.location || "")
      .replace(/\{\{phase\}\}/g, args.phase)
      .replace(/\{\{phase_narrative\}\}/g, narrativeForContext)
      .replace(/\{\{questions\}\}/g, JSON.stringify(questionsForPrompt, null, 2));

    // Generate mock answers (using mock data since AI service is not implemented)
    const startTime = Date.now();
    const mockAnswersCorrelationId = `mock-answers-${args.incident_id}-${args.phase}-${Date.now()}`;
    
    // Create realistic mock answers based on questions and narrative context
    const mockAnswers = questions.map((question, index) => {
      const mockResponses = {
        before_event: [
          "The participant seemed a bit agitated earlier in the morning, but nothing out of the ordinary. They had their usual breakfast and were engaged with activities.",
          "The environment was fairly calm with the regular daily routine. There were about 8 other participants in the common area at the time.",
          "We had their regular support strategies in place - the visual schedule was posted and their preferred staff member Sarah was on duty.",
          "The participant had slept well the night before according to their sleep log, and took their morning medication as scheduled."
        ],
        during_event: [
          "I immediately approached calmly and used their preferred de-escalation techniques. I maintained appropriate distance and spoke in a calm, low voice.",
          "The participant initially became more upset when others tried to help, but responded better when we cleared some space and I used their communication cards.",
          "We moved other participants to a safe distance and ensured there were no sharp objects nearby. The area was secured within about 2 minutes.",
          "The incident lasted approximately 15 minutes from start to finish. The participant gradually calmed down when we played their preferred music."
        ],
        end_event: [
          "Playing their favorite calming music and offering their comfort item (a soft blue blanket) helped bring the situation under control.",
          "The participant's breathing slowed down and they stopped the repetitive movements. They accepted a drink of water and sat down in their preferred chair.",
          "We did a quick visual check for any injuries - none were observed. The area was safe and all other participants were accounted for.",
          "It took about 5 minutes for the participant to fully return to baseline after the main incident ended."
        ],
        post_event: [
          "We offered their preferred comfort items and allowed them to rest in their room for about 30 minutes with soft music playing.",
          "I stayed nearby to monitor their mood and comfort level. They were able to communicate their needs clearly within an hour of the incident.",
          "We documented the incident immediately and will review their behavior support plan with the team tomorrow to see if any adjustments are needed.",
          "The participant was able to participate in afternoon activities as usual and seemed back to their normal self by dinner time."
        ]
      };

      const responses = mockResponses[args.phase as keyof typeof mockResponses] || ["This is a sample response to help demonstrate the system."];
      const answerText = responses[index % responses.length] || responses[0];

      return {
        question_id: question.question_id,
        question: question.question_text,
        answer: answerText
      };
    });

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    
    const processingTime = Date.now() - startTime;
    const parsedAnswers = mockAnswers;

    // Store the mock answers
    const storedAnswers = [];
    for (const mockAnswer of parsedAnswers) {
      if (!mockAnswer.question_id || !mockAnswer.answer) {
        console.warn("⚠️ Skipping incomplete mock answer:", mockAnswer);
        continue;
      }

      // Find matching question
      const question = questions.find(q => q.question_id === mockAnswer.question_id);
      if (!question) {
        console.warn("⚠️ No matching question found for:", mockAnswer.question_id);
        continue;
      }

      // Use the existing submitClarificationAnswer mutation to store the answer
      const answerResult = await ctx.runMutation(internal.aiClarification.submitClarificationAnswer, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
        question_id: mockAnswer.question_id,
        answer_text: mockAnswer.answer,
        phase: args.phase,
      });

      storedAnswers.push({
        question_id: mockAnswer.question_id,
        question_text: question.question_text,
        answer_text: mockAnswer.answer,
        answer_id: answerResult.answer_id,
      });
    }

    // Log the AI request for monitoring
    await ctx.runMutation(internal.incidents.logAiRequest, {
      correlation_id: mockAnswersCorrelationId,
      operation: "generateMockAnswers",
      model: prompt.ai_model || "mock-service",
      prompt_template: prompt.prompt_name,
      input_data: {
        phase: args.phase,
        questions_count: questions.length,
        incident_id: args.incident_id,
      },
      output_data: {
        answers_generated: storedAnswers.length,
        question_ids: storedAnswers.map(a => a.question_id),
      },
      processing_time_ms: processingTime,
      success: storedAnswers.length > 0,
      error_message: undefined,
      user_id: user._id,
      incident_id: args.incident_id,
      created_at: Date.now(),
    });

    // Update prompt usage statistics
    await ctx.runMutation(internal.promptManager.updatePromptUsage, {
      prompt_name: "generate_mock_answers",
      response_time_ms: processingTime,
      success: storedAnswers.length > 0,
    });

    console.log(`✅ Generated ${storedAnswers.length} mock answers for ${args.phase} phase`);

    return {
      success: true,
      phase: args.phase,
      generated_count: storedAnswers.length,
      answers: storedAnswers,
      correlation_id: mockAnswersCorrelationId,
      processing_time_ms: processingTime,
    };
  },
});