// @ts-nocheck
import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal, api } from "../../_generated/api";
import {
  generateCorrelationId,
  AIRequest,
  AIResponse
} from "../../aiService";
import { aiManager } from "../../aiMultiProvider";
import { retryWithAdaptiveTokens } from "../../aiClarification";

// Common output format for all question generation functions
interface GeneratedQuestion {
  question_id: string;
  question_text: string;
  question_order: number;
}

interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
  cached?: boolean;
  success: boolean;
}

// Common function to validate and format question generation output
const validateQuestionOutput = (rawOutput: any, phase: string): QuestionGenerationResponse => {
  try {
    // Parse AI response if it's a string
    const parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;

    if (!Array.isArray(parsed)) {
      console.error(`❌ ${phase.toUpperCase()}: AI response is not an array`, {
        phase,
        type: typeof parsed,
        value: JSON.stringify(parsed).substring(0, 200),
      });
      throw new Error("AI response must be an array of questions");
    }

    if (parsed.length === 0) {
      console.warn(`⚠️ ${phase.toUpperCase()}: AI returned EMPTY array - no questions generated`, {
        phase,
        rawOutput: JSON.stringify(rawOutput).substring(0, 500),
      });
    }

    const questions: GeneratedQuestion[] = parsed.map((item: any, index: number) => ({
      question_id: `${phase}_q${index + 1}`,
      question_text: item.question || item.question_text || String(item),
      question_order: index + 1
    }));

    console.log(`✅ ${phase.toUpperCase()}: Validated ${questions.length} questions`, {
      phase,
      questionCount: questions.length,
      questionIds: questions.map(q => q.question_id),
    });

    return {
      questions,
      success: true
    };
  } catch (error) {
    console.error(`❌ ${phase.toUpperCase()}: Failed to parse question generation output`, {
      phase,
      error: error.message,
      rawOutput: JSON.stringify(rawOutput).substring(0, 500),
    });
    return {
      questions: [],
      success: false
    };
  }
};

// Common function to call AI with template and variables
const generateQuestionsWithTemplate = async (
  ctx: any, 
  templateName: string, 
  variables: Record<string, any>,
  sessionToken: string,
  phase: string
): Promise<QuestionGenerationResponse> => {
  const correlationId = generateCorrelationId();
  
  try {
    console.log(`🚀 GENERATING ${phase.toUpperCase()} QUESTIONS`, {
      templateName,
      variables: Object.keys(variables),
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // Get the prompt template
    const prompt = await ctx.runQuery(internal.promptManager.getActivePrompt, {
      prompt_name: templateName,
      subsystem: "incidents",
    });

    if (!prompt) {
      throw new Error(`Template not found: ${templateName}`);
    }


    // Process template with variables
    const templateResult = await ctx.runQuery(internal.promptManager.processTemplateWithValidationQuery, {
      template: prompt.prompt_template,
      variables: variables,
    });

    const interpolatedPrompt = templateResult.processedTemplate;

    console.log("📝 TEMPLATE PROCESSED", {
      templateName,
      promptLength: interpolatedPrompt.length,
      substitutions: Object.keys(templateResult.substitutions).length,
      missingPlaceholders: templateResult.missingPlaceholders.length,
      correlationId,
    });

    // Call AI service with adaptive token management (Story 6.9)
    const baselineMaxTokens = prompt.max_tokens || 1000;

    console.log("🤖 CALLING AI SERVICE WITH ADAPTIVE TOKENS", {
      promptLength: interpolatedPrompt.length,
      model: prompt.ai_model || 'openai/gpt-5',
      temperature: prompt.temperature || 0.7,
      baseline_max_tokens: baselineMaxTokens,
      correlationId,
    });

    // Define the AI operation with adaptive token management
    const aiOperation = async (maxTokens: number) => {
      // Prepare AI request with dynamic maxTokens
      const aiRequest: AIRequest = {
        correlationId,
        model: prompt.ai_model || 'openai/gpt-5',
        prompt: interpolatedPrompt,
        temperature: prompt.temperature || 0.7,
        maxTokens: maxTokens,
        metadata: {
          operation: `generate_${phase}_questions`,
          templateName,
          phase,
          variables: Object.keys(variables),
        },
      };

      // Send request through multi-provider manager
      const aiResponse = await aiManager.sendRequest(aiRequest);

      console.log("🤖 AI RESPONSE RECEIVED", {
        success: aiResponse.success,
        contentLength: aiResponse.content?.length || 0,
        processingTime: aiResponse.processingTimeMs,
        tokensUsed: aiResponse.tokensUsed,
        cost: aiResponse.cost,
        finishReason: aiResponse.finishReason,
        maxTokens: maxTokens,
        correlationId,
      });

      // Log the AI request
      await ctx.runMutation(api.aiLogging.logAIRequest, {
        correlationId: aiRequest.correlationId,
        operation: `generate_${phase}_questions`,
        model: aiRequest.model,
        promptTemplate: templateName,
        inputData: { ...aiRequest.metadata, maxTokens },
        outputData: aiResponse.success ? { content: aiResponse.content } : null,
        processingTimeMs: aiResponse.processingTimeMs,
        tokensUsed: aiResponse.tokensUsed,
        cost: aiResponse.cost,
        success: aiResponse.success,
        error: aiResponse.error,
      });

      if (!aiResponse.success) {
        throw new Error(`AI request failed: ${aiResponse.error}`);
      }

      // Parse AI response (should be JSON) - parsing errors will trigger escalation
      let aiQuestions;
      try {
        // Extract JSON from response if wrapped in markdown
        const jsonMatch = aiResponse.content.match(/```json\s*([\s\S]*?)\s*```/) ||
                         aiResponse.content.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, aiResponse.content];

        const jsonContent = jsonMatch[1] || aiResponse.content;
        aiQuestions = JSON.parse(jsonContent.trim());
      } catch (parseError) {
        console.error("❌ JSON PARSE ERROR (potential truncation)", {
          error: parseError.message,
          rawContent: aiResponse.content?.substring(0, 200) + '...',
          maxTokens: maxTokens,
          correlationId,
        });
        // Throw parse error - retryWithAdaptiveTokens will detect this and escalate
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
      }

      // Return parsed questions with finishReason for truncation detection
      return {
        result: aiQuestions,
        finishReason: aiResponse.finishReason,
      };
    };

    // Execute with adaptive token escalation (Story 6.9 - Task 6: Database updates)
    const escalationResult = await retryWithAdaptiveTokens(
      ctx, // Pass Convex context for database updates
      aiOperation,
      {
        prompt_name: templateName,
        baseline_max_tokens: baselineMaxTokens,
        correlation_id: correlationId,
      }
    );

    console.log("✅ ADAPTIVE TOKEN ESCALATION COMPLETE", {
      final_max_tokens: escalationResult.final_max_tokens,
      baseline_max_tokens: baselineMaxTokens,
      escalations_used: escalationResult.escalations_used,
      finish_reason: escalationResult.finishReason,
      phase,
      correlationId,
    });

    // Record final prompt usage with escalated tokens
    await ctx.runMutation(api.promptManager.updatePromptUsage, {
      prompt_name: prompt.prompt_name,
      response_time_ms: 0, // Already logged in aiOperation
      success: true,
    });

    // Validate and return questions
    return validateQuestionOutput(escalationResult.result, phase);

  } catch (error) {
    console.error(`❌ FAILED TO GENERATE ${phase.toUpperCase()} QUESTIONS`, {
      error: error.message,
      correlationId,
    });

    return {
      questions: [],
      success: false
    };
  }
};

// BEFORE EVENT QUESTIONS
export const generateBeforeEventQuestions = action({
  args: {
    sessionToken: v.string(),
    variables: v.any(), // Flexible key-value pairs matching template placeholders
  },
  handler: async (ctx, args): Promise<QuestionGenerationResponse> => {
    return await generateQuestionsWithTemplate(
      ctx,
      "generate_clarification_questions_before_event",
      args.variables,
      args.sessionToken,
      "before_event"
    );
  },
});

// DURING EVENT QUESTIONS  
export const generateDuringEventQuestions = action({
  args: {
    sessionToken: v.string(),
    variables: v.any(), // Flexible key-value pairs matching template placeholders
  },
  handler: async (ctx, args): Promise<QuestionGenerationResponse> => {
    return await generateQuestionsWithTemplate(
      ctx,
      "generate_clarification_questions_during_event", 
      args.variables,
      args.sessionToken,
      "during_event"
    );
  },
});

// END EVENT QUESTIONS
export const generateEndEventQuestions = action({
  args: {
    sessionToken: v.string(),
    variables: v.any(), // Flexible key-value pairs matching template placeholders
  },
  handler: async (ctx, args): Promise<QuestionGenerationResponse> => {
    return await generateQuestionsWithTemplate(
      ctx,
      "generate_clarification_questions_end_event",
      args.variables, 
      args.sessionToken,
      "end_event"
    );
  },
});

// POST EVENT QUESTIONS
export const generatePostEventQuestions = action({
  args: {
    sessionToken: v.string(),
    variables: v.any(), // Flexible key-value pairs matching template placeholders
  },
  handler: async (ctx, args): Promise<QuestionGenerationResponse> => {
    return await generateQuestionsWithTemplate(
      ctx,
      "generate_clarification_questions_post_event",
      args.variables,
      args.sessionToken, 
      "post_event"
    );
  },
});

// Legacy function for backward compatibility (will be removed)
export const generateQuestionsForPhase = action({
  args: {
    incident_id: v.id("incidents"),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
    narrative_content: v.string(),
    user_id: v.optional(v.id("users")),
    sessionToken: v.string(),
    incident_variables: v.optional(v.any()),
    developer_session_id: v.optional(v.string()),
    custom_variables: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    console.warn("⚠️ DEPRECATED: generateQuestionsForPhase called - use phase-specific functions instead");
    
    // Temporarily redirect to appropriate function
    const functionMap = {
      "before_event": generateBeforeEventQuestions,
      "during_event": generateDuringEventQuestions, 
      "end_event": generateEndEventQuestions,
      "post_event": generatePostEventQuestions,
    };

    const targetFunction = functionMap[args.phase];
    if (!targetFunction) {
      throw new Error(`Invalid phase: ${args.phase}`);
    }

    // Build variables from legacy arguments
    const variables = {
      participantName: args.incident_variables?.participantName || "Unknown",
      reporterName: args.incident_variables?.reporterName || "Unknown", 
      location: args.incident_variables?.location || "Unknown",
      eventDateTime: args.incident_variables?.eventDateTime || "Unknown",
      [args.phase.replace('_event', 'Event')]: args.narrative_content,
      ...args.custom_variables
    };

    return await targetFunction.handler(ctx, {
      sessionToken: args.sessionToken,
      variables
    });
  },
});