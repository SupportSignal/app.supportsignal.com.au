// @ts-nocheck
import { v } from "convex/values";
import { z } from "zod";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { 
  generateCorrelationId, 
  RateLimiter, 
  CostTracker,
  CircuitBreaker,
  AIRequest,
  AIResponse 
} from "../../aiService";
import { aiManager } from "../../aiMultiProvider";
import { getConfig } from "../config";

// Initialize rate limiter and cost tracker - TEMPORARILY DISABLED FOR DEBUGGING
// const rateLimiter = new RateLimiter(60000, 20); // 20 requests per minute
// const costTracker = new CostTracker(100); // $100 daily limit
// const circuitBreaker = new CircuitBreaker(5, 3, 60000); // 5 failures, 3 successes, 1 minute timeout

// Interface for question generation
interface GenerateQuestionsRequest {
  participant_name: string;
  reporter_name: string;
  location: string;
  event_date_time: string;
  phase: "before_event" | "during_event" | "end_event" | "post_event";
  narrative_content: string;
}

interface GeneratedQuestion {
  question_id: string;
  question_text: string;
  question_order: number;
}

interface QuestionGenerationResponse {
  questions: GeneratedQuestion[];
}

// Zod transformation schema for template variable mapping
// Maps database field names to actual template variable names used in prompt templates
const templateVariableTransformer = z.object({
  participant_name: z.string(),
  reporter_name: z.string(),
  location: z.string(),
  event_date_time: z.string(),
  phase: z.union([
    z.literal("before_event"),
    z.literal("during_event"),
    z.literal("end_event"),
    z.literal("post_event")
  ]),
  narrative_content: z.string(),
}).transform(data => ({
  // Map database fields to actual template variables (must match prompt template exactly)
  participantName: data.participant_name,      // {{participantName}}
  reporterName: data.reporter_name,            // {{reporterName}}  
  location: data.location,                     // {{location}}
  eventDateTime: data.event_date_time,         // {{eventDateTime}}
  phase: data.phase,                           // {{phase}}
  narrativeText: data.narrative_content,       // {{narrativeText}}
}));

// Template interpolation helper
function interpolateTemplate(template: string, variables: Record<string, string>): string {
  let interpolated = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    interpolated = interpolated.replace(regex, value || '');
  }
  
  return interpolated;
}

// Mock AI service for development (fallback when external AI unavailable)
function generateMockQuestions(phase: string, narrative: string): QuestionGenerationResponse {
  const mockQuestions: Record<string, GeneratedQuestion[]> = {
    before_event: [
      {
        question_id: `${phase}_q1`,
        question_text: "What was the participant's mood or demeanor in the hours leading up to the incident?",
        question_order: 1
      },
      {
        question_id: `${phase}_q2`,
        question_text: "Were there any environmental factors (noise, crowding, schedule changes) that might have contributed to the situation?",
        question_order: 2
      },
      {
        question_id: `${phase}_q3`,
        question_text: "What support strategies were in place, and how were they being implemented?",
        question_order: 3
      }
    ],
    during_event: [
      {
        question_id: `${phase}_q1`,
        question_text: "What specific actions did staff members take during the incident?",
        question_order: 1
      },
      {
        question_id: `${phase}_q2`,
        question_text: "How did the participant respond to different intervention attempts?",
        question_order: 2
      },
      {
        question_id: `${phase}_q3`,
        question_text: "What safety measures were implemented to protect everyone involved?",
        question_order: 3
      }
    ],
    end_event: [
      {
        question_id: `${phase}_q1`,
        question_text: "What specific action or intervention helped bring the incident to a close?",
        question_order: 1
      },
      {
        question_id: `${phase}_q2`,
        question_text: "How did the participant's demeanor change as the incident concluded?",
        question_order: 2
      },
      {
        question_id: `${phase}_q3`,
        question_text: "Were there any immediate safety concerns that needed to be addressed?",
        question_order: 3
      }
    ],
    post_event: [
      {
        question_id: `${phase}_q1`,
        question_text: "What immediate support was provided to the participant after the incident?",
        question_order: 1
      },
      {
        question_id: `${phase}_q2`,
        question_text: "How was the participant's physical and emotional wellbeing monitored?",
        question_order: 2
      },
      {
        question_id: `${phase}_q3`,
        question_text: "Were any modifications made to the participant's support plan as a result of this incident?",
        question_order: 3
      }
    ]
  };

  return {
    questions: mockQuestions[phase] || []
  };
}

// Note: Using generateCorrelationId from aiService instead of local implementation

// Main question generation action
export const generateQuestionsForPhase = action({
  args: {
    participant_name: v.string(),
    reporter_name: v.string(),
    location: v.string(),
    event_date_time: v.string(),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
    narrative_content: v.string(),
    user_id: v.optional(v.id("users")),
    incident_id: v.optional(v.id("incidents")),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const correlationId = generateCorrelationId("clarification_questions");

    console.log("🚀 QUESTION GENERATOR START", {
      phase: args.phase,
      incident_id: args.incident_id,
      participant_name: args.participant_name,
      narrative_length: args.narrative_content.length,
      narrative_preview: args.narrative_content.substring(0, 100) + "...",
      correlationId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Get model from environment configuration (move to top of try block)
      const config = getConfig();
      const modelToUse = config.llm.defaultModel;
      
      // Get active prompt template
      console.log("🔍 Getting active prompt template for clarification questions...");
      const prompt = await ctx.runQuery(internal.promptManager.getActivePrompt, {
        prompt_name: "generate_clarification_questions",
        subsystem: "incidents",
      });

      console.log("📋 PROMPT TEMPLATE RESULT", {
        found: !!prompt,
        prompt_name: prompt?.prompt_name,
        ai_model: prompt?.ai_model,
        template_length: prompt?.prompt_template?.length,
        correlationId,
      });

      if (!prompt) {
        console.error("❌ NO PROMPT TEMPLATE FOUND", { correlationId });
        throw new Error("No active prompt template found for clarification questions");
      }

      // Transform database fields to template variable names using Zod
      console.log("🔄 Mapping database fields to template variable names...");
      const templateVariables = templateVariableTransformer.parse({
        participant_name: args.participant_name,
        reporter_name: args.reporter_name,
        location: args.location,
        event_date_time: args.event_date_time,
        phase: args.phase,
        narrative_content: args.narrative_content,
      });

      console.log("✅ TEMPLATE VARIABLES MAPPED", {
        original_keys: Object.keys(args),
        template_variable_keys: Object.keys(templateVariables),
        narrative_preview: templateVariables.narrativeText.substring(0, 100),
        participant_name: templateVariables.participantName,
        location: templateVariables.location,
        phase: templateVariables.phase,
        correlationId,
      });

      // Interpolate template with correctly mapped template variables
      console.log("🔄 Interpolating prompt template with mapped variables...");
      const interpolatedPrompt = interpolateTemplate(prompt.prompt_template, templateVariables);

      console.log("📝 INTERPOLATED PROMPT", {
        prompt_length: interpolatedPrompt.length,
        contains_narrative: interpolatedPrompt.includes(templateVariables.narrativeText.substring(0, 50)),
        contains_watermelon: interpolatedPrompt.toLowerCase().includes('watermelon'),
        contains_participant_name: interpolatedPrompt.includes(templateVariables.participantName),
        template_vars_found: {
          participantName: interpolatedPrompt.includes(templateVariables.participantName),
          narrativeText: interpolatedPrompt.includes(templateVariables.narrativeText.substring(0, 20)),
          location: interpolatedPrompt.includes(templateVariables.location),
          phase: interpolatedPrompt.includes(templateVariables.phase),
        },
        unfilled_placeholders: {
          has_unfilled: /\{\{[^}]+\}\}/.test(interpolatedPrompt),
          placeholders: interpolatedPrompt.match(/\{\{[^}]+\}\}/g) || [],
        },
        prompt_preview: interpolatedPrompt.substring(0, 300) + "...",
        correlationId,
      });

      let response: QuestionGenerationResponse;
      let aiSuccess = true;
      let errorMessage: string | undefined;

      try {
        console.log("🚦 RATE LIMITING TEMPORARILY DISABLED FOR DEBUGGING");
        
        // Check rate limits and cost limits - TEMPORARILY DISABLED
        // if (!rateLimiter.isAllowed(correlationId)) {
        //   console.error("🚫 RATE LIMIT EXCEEDED", { correlationId });
        //   throw new Error("Rate limit exceeded for AI question generation");
        // }
        // 
        // if (!costTracker.isWithinDailyLimit()) {
        //   console.error("💰 COST LIMIT EXCEEDED", { correlationId });
        //   throw new Error("Daily cost limit exceeded for AI operations");
        // }

        console.log("🔧 MODEL SELECTION", {
          database_model: prompt.ai_model,
          environment_model: modelToUse,
          using: "environment_configuration",
          correlationId,
        });

        // Create AI request for question generation
        const aiRequest: AIRequest = {
          correlationId,
          model: modelToUse, // Use environment configuration instead of database
          prompt: interpolatedPrompt,
          temperature: 0.7,
          maxTokens: 1000,
          metadata: {
            operation: "generateClarificationQuestions",
            phase: args.phase,
            incident_id: args.incident_id,
          },
        };

        console.log("🤖 AI REQUEST PREPARED", {
          model: aiRequest.model,
          prompt_length: aiRequest.prompt.length,
          temperature: aiRequest.temperature,
          maxTokens: aiRequest.maxTokens,
          correlationId,
        });

        console.log(`🚀 Calling aiManager.sendRequest for ${args.phase} question generation...`);
        console.log("🔧 AI MANAGER DEBUG", {
          providers: aiManager.getProviderStatus(),
          availableModels: aiManager.getAvailableModels(),
          requestModel: aiRequest.model,
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
          hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        });
        
        const aiResponse: AIResponse = await aiManager.sendRequest(aiRequest);

        console.log("📡 AI RESPONSE RECEIVED", {
          success: aiResponse.success,
          content_length: aiResponse.content?.length,
          model: aiResponse.model,
          tokensUsed: aiResponse.tokensUsed,
          processingTimeMs: aiResponse.processingTimeMs,
          cost: aiResponse.cost,
          error: aiResponse.error,
          correlationId,
        });
        
        // Track cost - TEMPORARILY DISABLED
        // if (aiResponse.cost) {
        //   costTracker.trackRequest(aiResponse.cost);
        // }
        
        if (!aiResponse.success) {
          throw new Error(aiResponse.error || "AI service returned unsuccessful response");
        }

        // Parse AI response to extract questions
        try {
          console.log("🔍 Parsing AI response content...");
          
          // Validate AI response has content
          if (!aiResponse.content || aiResponse.content.trim().length === 0) {
            throw new Error("AI response is empty - no content returned");
          }
          
          const aiContent = aiResponse.content.trim();
          
          // 🚨 CRITICAL LOGGING: Show exactly what the AI returned - BYPASS RATE LIMITING
          console.error("🚨 BYPASS RATE LIMIT - RAW AI RESPONSE", {
            correlationId,
            content_length: aiContent.length,
            content_is_empty: aiContent === "",
            first_100_chars: aiContent.substring(0, 100),
            last_100_chars: aiContent.substring(Math.max(0, aiContent.length - 100)),
          });
          
          console.error("🚨 BYPASS RATE LIMIT - FULL AI CONTENT:", aiContent);
          
          console.log("📄 AI CONTENT TO PARSE", {
            content_preview: aiContent.substring(0, 500),
            content_length: aiContent.length,
            has_json_array: /\[[\s\S]*\]/.test(aiContent),
            full_content: aiContent, // Add full content for debugging
            correlationId,
          });
          
          // Try to extract JSON from the response (handle various AI response formats)
          let questionsArray: any[];
          try {
            // First try to find JSON array in the response
            const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              console.error("🚨 BYPASS RATE LIMIT - JSON REGEX MATCH FOUND:", {
                matched_content: jsonMatch[0],
                correlationId,
              });
              questionsArray = JSON.parse(jsonMatch[0]);
              console.error("🚨 BYPASS RATE LIMIT - PARSED FROM REGEX:", questionsArray);
              console.log("📋 Successfully parsed JSON from regex match", { correlationId });
            } else {
              console.error("🚨 BYPASS RATE LIMIT - NO JSON ARRAY FOUND, TRYING FULL PARSE");
              // Try parsing entire content as JSON
              questionsArray = JSON.parse(aiContent);
              console.error("🚨 BYPASS RATE LIMIT - PARSED FULL CONTENT:", questionsArray);
              console.log("📋 Successfully parsed entire content as JSON", { correlationId });
            }
          } catch (jsonError) {
            console.error("❌ JSON PARSING FAILED", { 
              error: jsonError instanceof Error ? jsonError.message : jsonError,
              content: aiContent.substring(0, 200),
              correlationId,
            });
            throw new Error(`Failed to parse AI response as JSON: ${jsonError instanceof Error ? jsonError.message : jsonError}`);
          }
          
          // Validate questions array
          if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
            throw new Error(`AI response is not a valid questions array. Got: ${typeof questionsArray}, length: ${Array.isArray(questionsArray) ? questionsArray.length : 'N/A'}`);
          }
          
          console.log("📋 PARSED QUESTIONS ARRAY", {
            array_length: questionsArray.length,
            questions_preview: questionsArray.map((q: any) => ({ 
              question: q.question || q.question_text || q.questionText || String(q),
              type: typeof q,
              keys: Object.keys(q || {})
            })),
            correlationId,
          });
          
          // Map questions and validate content
          const generatedQuestions: GeneratedQuestion[] = questionsArray.map((q: any, index: number) => {
            // Extract question text with proper priority for expected format
            const questionText = q.question || q.question_text || q.questionText || String(q).trim();
            
            // Validate question has actual content
            if (!questionText || questionText.trim().length === 0 || questionText.trim() === '[object Object]') {
              console.warn("⚠️ Empty or invalid question detected", {
                index,
                question: q,
                extracted_text: questionText,
                correlationId,
              });
              throw new Error(`Question ${index + 1} has empty or invalid content. Original: ${JSON.stringify(q)}`);
            }

            return {
              question_id: `${args.phase}_q${index + 1}`,
              question_text: questionText.trim(),
              question_order: index + 1
            };
          });

          // Final validation - ensure all questions have content
          const emptyQuestions = generatedQuestions.filter(q => !q.question_text || q.question_text.trim().length === 0);
          if (emptyQuestions.length > 0) {
            throw new Error(`${emptyQuestions.length} questions have empty content after processing`);
          }

          response = { questions: generatedQuestions };
          
          // 🚨 CRITICAL LOGGING: Show exactly what questions were generated - BYPASS RATE LIMITING
          console.error(`🚨 BYPASS RATE LIMIT - FINAL GENERATED QUESTIONS`, {
            phase: args.phase,
            questions_count: generatedQuestions.length,
            correlationId,
          });
          
          generatedQuestions.forEach((q, index) => {
            console.error(`🚨 BYPASS RATE LIMIT - QUESTION ${index + 1} DETAILS:`, {
              question_id: q.question_id,
              question_text: q.question_text,
              question_text_length: q.question_text.length,
              question_text_empty: q.question_text === "",
              question_text_preview: q.question_text.substring(0, 100),
              correlationId,
            });
          });
          
          console.log(`✅ SUCCESSFULLY GENERATED AI QUESTIONS`, {
            phase: args.phase,
            questions_count: generatedQuestions.length,
            questions_text: generatedQuestions.map(q => q.question_text),
            questions_lengths: generatedQuestions.map(q => q.question_text.length),
            correlationId,
          });
          
        } catch (parseError) {
          console.error("❌ FAILED TO PARSE AI RESPONSE", { 
            error: parseError instanceof Error ? parseError.message : parseError,
            content_preview: aiResponse.content.substring(0, 200),
            correlationId,
          });
          // Fallback: treat entire response as a single question
          response = {
            questions: [{
              question_id: `${args.phase}_q1`,
              question_text: aiResponse.content,
              question_order: 1
            }]
          };
          console.log("🔄 Using fallback: single question from AI content", { correlationId });
        }
        
      } catch (aiError) {
        console.error("❌ AI SERVICE FAILED", {
          error: aiError instanceof Error ? aiError.message : aiError,
          phase: args.phase,
          correlationId,
          hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
          hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
          aiManager_providers: aiManager.getProviderStatus(),
          aiManager_models: aiManager.getAvailableModels(),
        });
        console.log("🔄 Falling back to mock questions...");
        aiSuccess = false;
        errorMessage = aiError instanceof Error ? aiError.message : "AI service unavailable";
        response = generateMockQuestions(args.phase, args.narrative_content);
        
        console.log("📋 MOCK QUESTIONS GENERATED", {
          questions_count: response.questions.length,
          questions_text: response.questions.map(q => q.question_text),
          correlationId,
        });
      }

      const processingTime = Date.now() - startTime;

      // Log the AI request for monitoring
      await ctx.runMutation(internal.incidents.logAiRequest, {
        correlation_id: correlationId,
        operation: "generateClarificationQuestions",
        model: prompt.ai_model || "mock-service",
        prompt_template: prompt.prompt_name,
        input_data: {
          phase: args.phase,
          narrative_length: args.narrative_content.length,
          participant_name: args.participant_name,
        },
        output_data: {
          questions_generated: response.questions.length,
          question_ids: response.questions.map(q => q.question_id),
        },
        processing_time_ms: processingTime,
        success: aiSuccess,
        error_message: errorMessage,
        user_id: args.user_id,
        incident_id: args.incident_id,
        created_at: Date.now(),
      });

      // Update prompt usage statistics
      await ctx.runMutation(internal.promptManager.updatePromptUsage, {
        prompt_name: prompt.prompt_name,
        response_time_ms: processingTime,
        success: aiSuccess,
      });

      return {
        questions: response.questions,
        correlation_id: correlationId,
        processing_time_ms: processingTime,
        ai_model_used: modelToUse || "mock-service", // Use actual model from config
        success: aiSuccess,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log failed request
      await ctx.runMutation(internal.incidents.logAiRequest, {
        correlation_id: correlationId,
        operation: "generateClarificationQuestions",
        model: "unknown",
        prompt_template: "generate_clarification_questions",
        input_data: { phase: args.phase },
        processing_time_ms: processingTime,
        success: false,
        error_message: errorMessage,
        user_id: args.user_id,
        incident_id: args.incident_id,
        created_at: Date.now(),
      });

      throw error;
    }
  },
});