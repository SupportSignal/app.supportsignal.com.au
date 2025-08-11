import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";

// Get active prompt template by name
export const getActivePrompt = query({
  args: {
    prompt_name: v.string(),
    subsystem: v.optional(v.string()),
  },
  handler: async (ctx, { prompt_name, subsystem }) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", prompt_name))
      .filter((q) =>
        q.and(
          q.eq(q.field("is_active"), true),
          subsystem ? q.eq(q.field("subsystem"), subsystem) : true
        )
      )
      .order("desc")
      .first();

    return prompt;
  },
});

// Seed initial prompt templates for clarification questions
export const seedPromptTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if templates already exist
    const existingPrompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => 
        q.eq("prompt_name", "generate_clarification_questions")
      )
      .first();

    if (existingPrompt) {
      return { message: "Prompt templates already exist" };
    }

    // Generate clarification questions prompt template
    const clarificationPromptId = await ctx.db.insert("ai_prompts", {
      prompt_name: "generate_clarification_questions",
      prompt_version: "v1.0.0",
      prompt_template: `You are analyzing an incident narrative to generate clarification questions.

Context:
- Participant: {{participant_name}}
- Reporter: {{reporter_name}}
- Location: {{location}}
- Event Date: {{event_date_time}}

Current Phase: {{phase}}
Narrative Content: {{narrative_content}}

Generate 2-4 specific, open-ended clarification questions for the "{{phase}}" phase that would help gather additional details about:
- Environmental factors and conditions
- People involved and their actions
- Timeline and sequence of events
- Communication and responses
- Safety measures and interventions

Guidelines:
- Questions should be supportive and non-judgmental
- Focus on gathering facts, not assigning blame
- Use clear, simple language appropriate for post-incident stress
- Each question should elicit specific, actionable information
- Avoid leading questions

Return response as JSON:
{
  "questions": [
    {
      "question_id": "{{phase}}_q1",
      "question_text": "Specific question here?",
      "question_order": 1
    },
    {
      "question_id": "{{phase}}_q2", 
      "question_text": "Another specific question?",
      "question_order": 2
    }
  ]
}`,
      description: "Generate phase-specific clarification questions for incident narratives",
      input_schema: JSON.stringify({
        type: "object",
        properties: {
          participant_name: { type: "string" },
          reporter_name: { type: "string" },
          location: { type: "string" },
          event_date_time: { type: "string" },
          phase: { 
            type: "string",
            enum: ["before_event", "during_event", "end_event", "post_event"]
          },
          narrative_content: { type: "string" }
        },
        required: ["participant_name", "reporter_name", "phase", "narrative_content"]
      }),
      output_schema: JSON.stringify({
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question_id: { type: "string" },
                question_text: { type: "string" },
                question_order: { type: "number" }
              },
              required: ["question_id", "question_text", "question_order"]
            }
          }
        },
        required: ["questions"]
      }),
      workflow_step: "clarification_questions",
      subsystem: "incidents",
      ai_model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.3,
      is_active: true,
      created_at: Date.now(),
    });

    // Narrative enhancement prompt template (for future use)
    const enhancePromptId = await ctx.db.insert("ai_prompts", {
      prompt_name: "enhance_narrative_content",
      prompt_version: "v1.0.0", 
      prompt_template: `You are enhancing an incident narrative by incorporating clarification answers.

Original {{phase}} narrative:
{{original_narrative}}

Clarification Questions & Answers:
{{clarification_qa}}

Instructions:
- Combine the original narrative with clarification answers
- Maintain the original tone and perspective
- Add clarification details seamlessly
- Do not summarize or change the meaning
- Keep all factual information from both sources
- Use clear, professional language suitable for incident reports

Enhanced {{phase}} narrative:`,
      description: "Enhance incident narratives by incorporating clarification question answers",
      workflow_step: "narrative_enhancement",
      subsystem: "incidents",
      ai_model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      temperature: 0.1,
      is_active: true,
      created_at: Date.now(),
    });

    return { 
      message: "Successfully seeded prompt templates",
      promptIds: [clarificationPromptId, enhancePromptId]
    };
  },
});

// Update prompt usage statistics
export const updatePromptUsage = mutation({
  args: {
    prompt_name: v.string(),
    response_time_ms: v.number(),
    success: v.boolean(),
  },
  handler: async (ctx, { prompt_name, response_time_ms, success }) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", prompt_name))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!prompt) return null;

    const currentUsage = prompt.usage_count || 0;
    const currentAverage = prompt.average_response_time || 0;
    const currentSuccessRate = prompt.success_rate || 1;

    // Calculate new running averages
    const newUsageCount = currentUsage + 1;
    const newAverageResponseTime = 
      (currentAverage * currentUsage + response_time_ms) / newUsageCount;
    
    const successCount = Math.round(currentSuccessRate * currentUsage) + (success ? 1 : 0);
    const newSuccessRate = successCount / newUsageCount;

    await ctx.db.patch(prompt._id, {
      usage_count: newUsageCount,
      average_response_time: newAverageResponseTime,
      success_rate: newSuccessRate,
    });

    return { updated: true };
  },
});