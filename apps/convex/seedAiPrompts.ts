// @ts-nocheck
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Seed AI prompt templates for the clarification system
 * This should be run once during deployment setup
 */
export const seedAiPrompts = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await ctx.runMutation(internal.promptManager.seedPromptTemplatesInternal, {});

    console.log("AI Prompt Templates Seeded:", result);

    return result;
  },
});

export default seedAiPrompts;