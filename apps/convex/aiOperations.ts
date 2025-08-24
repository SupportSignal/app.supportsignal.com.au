// @ts-nocheck
/**
 * AI Operations - Core AI Actions for Incident Management
 * Implements the four core AI operations with exact specifications from n8n workflows
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { 
  generateCorrelationId, 
  RateLimiter, 
  CostTracker,
  CircuitBreaker,
  FallbackHandler,
  AIRequest,
  AIResponse 
} from "./aiService";
import { aiManager } from "./aiMultiProvider";
import { processTemplate } from "./aiPromptTemplates";

// Initialize rate limiter, cost tracker, and circuit breaker
const rateLimiter = new RateLimiter(60000, 20); // 20 requests per minute
const costTracker = new CostTracker(100); // $100 daily limit
const circuitBreaker = new CircuitBreaker(5, 3, 60000); // 5 failures, 3 successes, 1 minute timeout

/**
 * Log AI request for monitoring and debugging
 */
async function logAIOperation(
  ctx: any,
  operation: string,
  request: AIRequest,
  response: AIResponse,
  userId?: string,
  incidentId?: string
) {
  await ctx.runMutation(api.aiLogging.logAIRequest, {
    correlationId: request.correlationId,
    operation,
    model: request.model,
    promptTemplate: operation,
    inputData: request.metadata,
    outputData: response.success ? { content: response.content } : null,
    processingTimeMs: response.processingTimeMs,
    tokensUsed: response.tokensUsed,
    cost: response.cost,
    success: response.success,
    error: response.error,
    userId: userId as any,
    incidentId: incidentId as any,
  });
}

/**
 * 1. Generate Clarification Questions Action
 * Generates 2-4 clarification questions per narrative phase
 */
export const generateClarificationQuestions = action({
  args: {
    participant_name: v.string(),
    reporter_name: v.string(),
    location: v.string(),
    event_datetime: v.string(),
    before_event: v.string(),
    during_event: v.string(),
    end_of_event: v.string(),
    post_event_support: v.string(),
    incident_id: v.optional(v.id("incidents")),
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<any> => {
    const correlationId = generateCorrelationId();
    const operation = "generateClarificationQuestions";
    
    try {
      // Rate limiting check
      const rateLimitKey = args.user_id || 'anonymous';
      if (!rateLimiter.isAllowed(rateLimitKey)) {
        throw new ConvexError("Rate limit exceeded. Please try again later.");
      }

      // Cost tracking check
      if (!costTracker.isWithinDailyLimit()) {
        throw new ConvexError("Daily AI cost limit exceeded. Please try again tomorrow.");
      }

      // Circuit breaker check
      if (!circuitBreaker.canExecute()) {
        console.warn('Circuit breaker open, using fallback response');
        return FallbackHandler.generateClarificationQuestionsFallback({
          participant_name: args.participant_name,
          reporter_name: args.reporter_name,
          event_datetime: args.event_datetime,
          location: args.location,
        });
      }

      // Get processed prompt template
      const processedPrompt = await ctx.runQuery(api.promptManager.getProcessedPrompt, {
        prompt_name: "generate_clarification_questions",
        variables: {
          participant_name: args.participant_name,
          reporter_name: args.reporter_name,
          location: args.location,
          event_datetime: args.event_datetime,
          before_event: args.before_event,
          during_event: args.during_event,
          end_of_event: args.end_of_event,
          post_event_support: args.post_event_support,
        },
      });

      // Prepare AI request
      const aiRequest: AIRequest = {
        correlationId,
        model: processedPrompt.model,
        prompt: processedPrompt.processedTemplate,
        temperature: processedPrompt.temperature || 0.7,
        maxTokens: processedPrompt.maxTokens || 1000,
        metadata: {
          operation,
          incident_id: args.incident_id,
          user_id: args.user_id,
          input_params: args,
        },
      };

      // Send request through multi-provider manager
      const aiResponse = await aiManager.sendRequest(aiRequest);

      // Track cost
      if (aiResponse.cost) {
        costTracker.trackRequest(aiResponse.cost);
      }

      // Log the request
      await logAIOperation(
        ctx,
        operation,
        aiRequest,
        aiResponse,
        args.user_id,
        args.incident_id
      );

      // Record prompt usage
      await ctx.runMutation(api.prompts.recordPromptUsage, {
        promptName: processedPrompt.name,
        promptVersion: processedPrompt.version,
        responseTime: aiResponse.processingTimeMs,
        successful: aiResponse.success,
      });

      if (!aiResponse.success) {
        circuitBreaker.recordFailure();
        throw new ConvexError(`AI request failed: ${aiResponse.error}`);
      }

      // Record circuit breaker success
      circuitBreaker.recordSuccess();

      // Parse AI response (should be JSON)
      let clarificationQuestions;
      try {
        // Extract JSON from response if wrapped in markdown
        const jsonMatch = aiResponse.content.match(/```json\s*([\s\S]*?)\s*```/) || 
                         aiResponse.content.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, aiResponse.content];
        
        const jsonContent = jsonMatch[1] || aiResponse.content;
        clarificationQuestions = JSON.parse(jsonContent.trim());
      } catch (parseError) {
        throw new ConvexError(`Failed to parse AI response as JSON: ${parseError}`);
      }

      // Format response according to n8n workflow specification
      const response = {
        clarification_questions: clarificationQuestions,
        metadata: {
          processed_at: new Date().toISOString(),
          status: 'success',
          report_context: {
            participant_name: args.participant_name,
            reporter_name: args.reporter_name,
            event_datetime: args.event_datetime,
            location: args.location,
          },
          correlation_id: correlationId,
          processing_time_ms: aiResponse.processingTimeMs,
          tokens_used: aiResponse.tokensUsed,
          cost: aiResponse.cost,
        },
      };

      return response;

    } catch (error) {
      // Record circuit breaker failure
      circuitBreaker.recordFailure();
      
      // Log failed request
      const failedResponse: AIResponse = {
        correlationId,
        content: '',
        model: 'openai/gpt-4.1-nano',
        processingTimeMs: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await logAIOperation(
        ctx,
        operation,
        {
          correlationId,
          model: 'openai/gpt-4.1-nano',
          prompt: '',
          metadata: { error: failedResponse.error },
        },
        failedResponse,
        args.user_id,
        args.incident_id
      );

      throw error;
    }
  },
});

/**
 * 2. Enhance Narrative Content Action
 * Incorporates clarification answers into narrative content with grammar cleanup
 */
export const enhanceNarrativeContent = action({
  args: {
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"), 
      v.literal("end_of_event"),
      v.literal("post_event_support")
    ),
    instruction: v.string(),
    answers: v.array(v.object({
      question: v.string(),
      answer: v.string(),
    })),
    incident_id: v.optional(v.id("incidents")),
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<any> => {
    const correlationId = generateCorrelationId();
    const operation = "enhanceNarrativeContent";
    
    console.log('🔥 STARTING AI ENHANCEMENT - Full Request:', {
      correlationId,
      phase: args.phase,
      hasAnswers: args.answers?.length || 0,
      instructionLength: args.instruction?.length || 0,
      timestamp: new Date().toISOString(),
    });
    
    try {
      // Rate limiting check
      const rateLimitKey = args.user_id || 'anonymous';
      console.log('🔄 Rate limit check:', { rateLimitKey, remaining: rateLimiter.getRemainingRequests(rateLimitKey) });
      
      if (!rateLimiter.isAllowed(rateLimitKey)) {
        console.error('🚫 RATE LIMIT EXCEEDED:', { rateLimitKey });
        throw new ConvexError("Rate limit exceeded. Please try again later.");
      }

      // Filter valid Q&A pairs and format as specified in n8n workflow
      const validAnswers = args.answers.filter(item =>
        item.question && item.question.trim() !== "" &&
        item.answer && item.answer.trim() !== ""
      );

      const narrativeFacts = validAnswers
        .map(item => `Q: ${item.question.trim()}\nA: ${item.answer.trim()}`)
        .join('\n\n');

      console.log('📝 Processed Q&A pairs:', { 
        validAnswersCount: validAnswers.length,
        narrativeFactsLength: narrativeFacts.length,
        sampleFacts: narrativeFacts.substring(0, 200) + '...'
      });

      // Get incident context for template variables via direct database access
      let incidentData = null;
      if (args.incident_id) {
        try {
          // Direct database access in action context - no permissions needed since this is for AI enhancement
          const dbIncident = await ctx.db.get(args.incident_id);
          
          if (dbIncident) {
            incidentData = dbIncident;
            console.log('🏢 Incident data retrieved from database:', {
              incident_id: args.incident_id,
              participant: incidentData?.participant_name,
              location: incidentData?.location,
              reporter: incidentData?.reporter_name,
              eventDateTime: incidentData?.event_date_time,
              raw_event_date_time_field: JSON.stringify(incidentData?.event_date_time),
              event_date_time_type: typeof incidentData?.event_date_time,
              all_incident_fields: Object.keys(incidentData || {})
            });
          } else {
            console.warn('⚠️ Incident not found for ID:', args.incident_id);
          }
        } catch (error) {
          console.error('❌ Error retrieving incident data:', error);
        }
      }

      // Prepare template variables with detailed logging
      const templateVariables = {
        // Template expects these exact variable names:
        participantName: incidentData?.participant_name || 'Unknown Participant',
        location: incidentData?.location || 'Unknown Location',
        eventDateTime: incidentData?.event_date_time || 'Unknown Date/Time',
        reporterName: incidentData?.reporter_name || 'Unknown Reporter',
        phase: args.phase,
        originalNarrative: args.instruction,
        investigationQA: narrativeFacts,
      };

      console.log('📝 Template variables prepared:', {
        participantName: templateVariables.participantName,
        location: templateVariables.location,
        eventDateTime: templateVariables.eventDateTime,
        eventDateTime_raw: incidentData?.event_date_time,
        eventDateTime_fallback: templateVariables.eventDateTime === 'Unknown Date/Time' ? 'USING FALLBACK' : 'USING INCIDENT DATA',
        reporterName: templateVariables.reporterName,
        phase: templateVariables.phase,
        originalNarrativeLength: templateVariables.originalNarrative?.length || 0,
        investigationQALength: templateVariables.investigationQA?.length || 0,
      });

      // Get processed prompt template
      console.log('🔍 Requesting prompt template:', { prompt_name: "enhance_narrative", phase: args.phase });
      
      const processedPrompt = await ctx.runQuery(api.promptManager.getProcessedPrompt, {
        prompt_name: "enhance_narrative",
        variables: templateVariables,
      });

      console.log('✅ Prompt template processed:', {
        name: processedPrompt.name,
        model: processedPrompt.model,
        templateLength: processedPrompt.processedTemplate?.length || 0,
        temperature: processedPrompt.temperature,
        maxTokens: processedPrompt.maxTokens,
        substitutions: processedPrompt.substitutions,
      });

      // Log the actual processed template that AI will receive (truncated for readability)
      console.log('🎯 FINAL TEMPLATE SENT TO AI (first 500 chars):', {
        processedTemplatePreview: processedPrompt.processedTemplate?.substring(0, 500) + '...',
        hasEventDateTimeSubstitution: processedPrompt.processedTemplate?.includes(incidentData?.event_date_time || 'Unknown Date/Time'),
        eventDateTimeValueInTemplate: incidentData?.event_date_time || 'FALLBACK_USED',
      });

      // Prepare AI request
      const aiRequest: AIRequest = {
        correlationId,
        model: processedPrompt.model,
        prompt: processedPrompt.processedTemplate,
        temperature: processedPrompt.temperature || 0.3, // Lower temperature for consistent formatting
        maxTokens: processedPrompt.maxTokens || 800,
        metadata: {
          operation,
          incident_id: args.incident_id,
          user_id: args.user_id,
          phase: args.phase,
          answers_count: validAnswers.length,
        },
      };

      // Send request through multi-provider manager
      console.log('🤖 Sending request to AI Manager:', {
        correlationId,
        model: aiRequest.model,
        promptLength: aiRequest.prompt?.length || 0,
        temperature: aiRequest.temperature,
        maxTokens: aiRequest.maxTokens,
      });
      
      const aiResponse = await aiManager.sendRequest(aiRequest);

      console.log('🎯 AI Manager Response:', {
        correlationId,
        success: aiResponse.success,
        contentLength: aiResponse.content?.length || 0,
        processingTimeMs: aiResponse.processingTimeMs,
        tokensUsed: aiResponse.tokensUsed,
        cost: aiResponse.cost,
        error: aiResponse.error || 'none',
      });

      // Track cost
      if (aiResponse.cost) {
        costTracker.trackRequest(aiResponse.cost);
        console.log('💰 Cost tracked:', { cost: aiResponse.cost, totalCost: costTracker.getMetrics().totalCost });
      }

      // Log the request
      await logAIOperation(
        ctx,
        operation,
        aiRequest,
        aiResponse,
        args.user_id,
        args.incident_id
      );

      // Record prompt usage
      await ctx.runMutation(api.prompts.recordPromptUsage, {
        promptName: processedPrompt.name,
        promptVersion: processedPrompt.version,
        responseTime: aiResponse.processingTimeMs,
        successful: aiResponse.success,
      });

      if (!aiResponse.success) {
        throw new ConvexError(`AI request failed: ${aiResponse.error}`);
      }

      // Format response according to n8n workflow specification
      const response = {
        output: aiResponse.content.trim(),
        narrative: aiResponse.content.trim(), // Same as output for compatibility
        metadata: {
          processed_at: new Date().toISOString(),
          status: 'success',
          phase: args.phase,
          answers_processed: validAnswers.length,
          correlation_id: correlationId,
          processing_time_ms: aiResponse.processingTimeMs,
          tokens_used: aiResponse.tokensUsed,
          cost: aiResponse.cost,
        },
      };

      return response;

    } catch (error) {
      // Enhanced error logging with full context
      const errorDetails = {
        errorType: error?.constructor?.name || typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        operation: 'enhanceNarrativeContent',
        phase: args.phase,
        correlationId,
        timestamp: new Date().toISOString(),
        // Include original error object for debugging
        originalError: error,
      };
      
      console.error('🚨 AI ENHANCEMENT ERROR - Full Details:', errorDetails);
      
      // Create detailed error message for response
      const detailedErrorMessage = `AI Enhancement Failed in ${operation}:
        Phase: ${args.phase}
        Error Type: ${errorDetails.errorType}
        Message: ${errorDetails.errorMessage}
        Correlation ID: ${correlationId}`;

      const failedResponse: AIResponse = {
        correlationId,
        content: '',
        model: 'openai/gpt-4.1-nano',
        processingTimeMs: Date.now() - Date.now(), // Will be 0, but keeping structure
        success: false,
        error: detailedErrorMessage,
      };

      await logAIOperation(
        ctx,
        operation,
        {
          correlationId,
          model: 'openai/gpt-4.1-nano',
          prompt: '',
          metadata: { 
            error: detailedErrorMessage,
            errorDetails: errorDetails 
          },
        },
        failedResponse,
        args.user_id,
        args.incident_id
      );

      // Throw enhanced error with context
      throw new ConvexError(detailedErrorMessage);
    }
  },
});

/**
 * 3. Analyze Contributing Conditions Action
 * Analyzes incident narratives to identify contributing conditions
 */
export const analyzeContributingConditions = action({
  args: {
    reporter_name: v.string(),
    participant_name: v.string(),
    event_datetime: v.string(),
    location: v.string(),
    before_event: v.string(),
    before_event_extra: v.optional(v.string()),
    during_event: v.string(),
    during_event_extra: v.optional(v.string()),
    end_of_event: v.string(),
    end_of_event_extra: v.optional(v.string()),
    post_event_support: v.string(),
    post_event_support_extra: v.optional(v.string()),
    incident_id: v.optional(v.id("incidents")),
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<any> => {
    const correlationId = generateCorrelationId();
    const operation = "analyzeContributingConditions";
    
    try {
      // Rate limiting check
      const rateLimitKey = args.user_id || 'anonymous';
      if (!rateLimiter.isAllowed(rateLimitKey)) {
        throw new ConvexError("Rate limit exceeded. Please try again later.");
      }

      // Get processed prompt template
      const processedPrompt = await ctx.runQuery(api.promptManager.getProcessedPrompt, {
        prompt_name: "analyze_contributing_conditions",
        variables: {
          reporter_name: args.reporter_name,
          participant_name: args.participant_name,
          event_datetime: args.event_datetime,
          location: args.location,
          before_event: args.before_event,
          before_event_extra: args.before_event_extra || '',
          during_event: args.during_event,
          during_event_extra: args.during_event_extra || '',
          end_of_event: args.end_of_event,
          end_of_event_extra: args.end_of_event_extra || '',
          post_event_support: args.post_event_support,
          post_event_support_extra: args.post_event_support_extra || '',
        },
      });

      // Prepare AI request
      const aiRequest: AIRequest = {
        correlationId,
        model: processedPrompt.model,
        prompt: processedPrompt.processedTemplate,
        temperature: processedPrompt.temperature || 0.5,
        maxTokens: processedPrompt.maxTokens || 1200,
        metadata: {
          operation,
          incident_id: args.incident_id,
          user_id: args.user_id,
          input_params: args,
        },
      };

      // Send request through multi-provider manager
      const aiResponse = await aiManager.sendRequest(aiRequest);

      // Track cost
      if (aiResponse.cost) {
        costTracker.trackRequest(aiResponse.cost);
      }

      // Log the request
      await logAIOperation(
        ctx,
        operation,
        aiRequest,
        aiResponse,
        args.user_id,
        args.incident_id
      );

      // Record prompt usage
      await ctx.runMutation(api.prompts.recordPromptUsage, {
        promptName: processedPrompt.name,
        promptVersion: processedPrompt.version,
        responseTime: aiResponse.processingTimeMs,
        successful: aiResponse.success,
      });

      if (!aiResponse.success) {
        throw new ConvexError(`AI request failed: ${aiResponse.error}`);
      }

      // Format response (markdown analysis from AI)
      const response = {
        analysis: aiResponse.content.trim(),
        metadata: {
          processed_at: new Date().toISOString(),
          status: 'success',
          incident_context: {
            participant_name: args.participant_name,
            reporter_name: args.reporter_name,
            event_datetime: args.event_datetime,
            location: args.location,
          },
          correlation_id: correlationId,
          processing_time_ms: aiResponse.processingTimeMs,
          tokens_used: aiResponse.tokensUsed,
          cost: aiResponse.cost,
        },
      };

      return response;

    } catch (error) {
      // Log failed request
      const failedResponse: AIResponse = {
        correlationId,
        content: '',
        model: 'openai/gpt-4.1-nano',
        processingTimeMs: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await logAIOperation(
        ctx,
        operation,
        {
          correlationId,
          model: 'openai/gpt-4.1-nano',
          prompt: '',
          metadata: { error: failedResponse.error },
        },
        failedResponse,
        args.user_id,
        args.incident_id
      );

      throw error;
    }
  },
});

/**
 * 4. Generate Mock Answers Action (Testing Utility)
 * Generates realistic mock answers for testing and demo purposes
 */
export const generateMockAnswers = action({
  args: {
    participant_name: v.string(),
    reporter_name: v.string(),
    location: v.string(),
    phase: v.union(
      v.literal("beforeEvent"),
      v.literal("duringEvent"), 
      v.literal("endOfEvent"),
      v.literal("postEventSupport")
    ),
    phase_narrative: v.string(),
    questions: v.string(), // JSON string of questions array
    incident_id: v.optional(v.id("incidents")),
    user_id: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<any> => {
    const correlationId = generateCorrelationId();
    const operation = "generateMockAnswers";
    
    try {
      // Rate limiting check
      const rateLimitKey = args.user_id || 'anonymous';
      if (!rateLimiter.isAllowed(rateLimitKey)) {
        throw new ConvexError("Rate limit exceeded. Please try again later.");
      }

      // Get processed prompt template
      const processedPrompt = await ctx.runQuery(api.promptManager.getProcessedPrompt, {
        prompt_name: "generate_mock_answers",
        variables: {
          participant_name: args.participant_name,
          reporter_name: args.reporter_name,
          location: args.location,
          phase: args.phase,
          phase_narrative: args.phase_narrative,
          questions: args.questions,
        },
      });

      // Prepare AI request
      const aiRequest: AIRequest = {
        correlationId,
        model: processedPrompt.model,
        prompt: processedPrompt.processedTemplate,
        temperature: processedPrompt.temperature || 0.8, // Higher temperature for varied mock content
        maxTokens: processedPrompt.maxTokens || 1000,
        metadata: {
          operation,
          incident_id: args.incident_id,
          user_id: args.user_id,
          phase: args.phase,
        },
      };

      // Send request through multi-provider manager
      const aiResponse = await aiManager.sendRequest(aiRequest);

      // Track cost
      if (aiResponse.cost) {
        costTracker.trackRequest(aiResponse.cost);
      }

      // Log the request
      await logAIOperation(
        ctx,
        operation,
        aiRequest,
        aiResponse,
        args.user_id,
        args.incident_id
      );

      // Record prompt usage
      await ctx.runMutation(api.prompts.recordPromptUsage, {
        promptName: processedPrompt.name,
        promptVersion: processedPrompt.version,
        responseTime: aiResponse.processingTimeMs,
        successful: aiResponse.success,
      });

      if (!aiResponse.success) {
        throw new ConvexError(`AI request failed: ${aiResponse.error}`);
      }

      // Parse questions count for metadata
      let questionsAnswered = 0;
      try {
        const questionsData = JSON.parse(args.questions);
        questionsAnswered = Array.isArray(questionsData) ? questionsData.length : 0;
      } catch {
        // Questions count unknown
      }

      // Format response according to n8n workflow specification  
      const response = {
        mock_answers: {
          output: aiResponse.content.trim(),
        },
        metadata: {
          processed_at: new Date().toISOString(),
          status: 'success',
          phase: args.phase,
          questions_answered: questionsAnswered,
          correlation_id: correlationId,
          processing_time_ms: aiResponse.processingTimeMs,
          tokens_used: aiResponse.tokensUsed,
          cost: aiResponse.cost,
        },
      };

      return response;

    } catch (error) {
      // Log failed request
      const failedResponse: AIResponse = {
        correlationId,
        content: '',
        model: 'openai/gpt-4.1-nano',
        processingTimeMs: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await logAIOperation(
        ctx,
        operation,
        {
          correlationId,
          model: 'openai/gpt-4.1-nano',
          prompt: '',
          metadata: { error: failedResponse.error },
        },
        failedResponse,
        args.user_id,
        args.incident_id
      );

      throw error;
    }
  },
});