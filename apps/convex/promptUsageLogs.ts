// Prompt usage logging utilities
import { mutation } from './_generated/server';
import { v } from 'convex/values';

// Log prompt template usage
export const logPromptUsage = mutation({
  args: {
    prompt_template_id: v.id("ai_prompt_templates"),
    user_id: v.optional(v.id("users")),
    company_id: v.id("companies"),
    usage_context: v.string(),
    variables_used: v.any(),
    resolved_prompt: v.string(),
    ai_model_used: v.optional(v.string()),
    error_message: v.optional(v.string()),
    processing_time_ms: v.number(),
    created_at: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("prompt_usage_logs", args);
    return { success: true };
  }
});