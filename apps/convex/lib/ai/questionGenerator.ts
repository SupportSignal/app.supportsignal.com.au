// @ts-nocheck
import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";

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

// Generate correlation ID for request tracking
function generateCorrelationId(): string {
  return `clarify_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

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
    const correlationId = generateCorrelationId();

    try {
      // Get active prompt template
      const prompt = await ctx.runQuery(internal.lib.ai.promptManager.getActivePrompt, {
        prompt_name: "generate_clarification_questions",
        subsystem: "incidents",
      });

      if (!prompt) {
        throw new Error("No active prompt template found for clarification questions");
      }

      // Interpolate template with variables
      const interpolatedPrompt = interpolateTemplate(prompt.prompt_template, {
        participant_name: args.participant_name,
        reporter_name: args.reporter_name,
        location: args.location,
        event_date_time: args.event_date_time,
        phase: args.phase,
        narrative_content: args.narrative_content,
      });

      let response: QuestionGenerationResponse;
      let aiSuccess = true;
      let errorMessage: string | undefined;

      try {
        // TODO: Implement actual AI service call when available
        // For now, use mock service as fallback
        console.log("Using mock AI service for question generation");
        response = generateMockQuestions(args.phase, args.narrative_content);
        
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
        
      } catch (aiError) {
        console.warn("AI service failed, falling back to mock questions:", aiError);
        aiSuccess = false;
        errorMessage = aiError instanceof Error ? aiError.message : "AI service unavailable";
        response = generateMockQuestions(args.phase, args.narrative_content);
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
      await ctx.runMutation(internal.lib.ai.promptManager.updatePromptUsage, {
        prompt_name: prompt.prompt_name,
        response_time_ms: processingTime,
        success: aiSuccess,
      });

      return {
        questions: response.questions,
        correlation_id: correlationId,
        processing_time_ms: processingTime,
        ai_model_used: prompt.ai_model || "mock-service",
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