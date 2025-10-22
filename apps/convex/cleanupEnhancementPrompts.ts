// Temporary script to cleanup old enhancement prompts for Story 6.4
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export default mutation({
  args: {},
  handler: async (ctx) => {
    return ctx.runMutation(internal.cleanupEnhancementPrompts.internalCleanup);
  },
});

export const internalCleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find all enhancement prompts
    const promptsToDeactivate = await ctx.db
      .query("ai_prompts")
      .filter((q) =>
        q.or(
          q.eq(q.field("prompt_name"), "enhance_narrative"),
          q.eq(q.field("prompt_name"), "enhance_narrative_before_event"),
          q.eq(q.field("prompt_name"), "enhance_narrative_during_event"),
          q.eq(q.field("prompt_name"), "enhance_narrative_end_event"),
          q.eq(q.field("prompt_name"), "enhance_narrative_post_event")
        )
      )
      .collect();

    console.log(`Found ${promptsToDeactivate.length} enhancement prompts to deactivate`);

    for (const prompt of promptsToDeactivate) {
      await ctx.db.patch(prompt._id, {
        is_active: false,
        replaced_at: Date.now(),
      });
      console.log(`Deactivated: ${prompt.prompt_name} (${prompt._id})`);
    }

    return {
      deactivated: promptsToDeactivate.length,
      prompts: promptsToDeactivate.map(p => p.prompt_name)
    };
  },
});
