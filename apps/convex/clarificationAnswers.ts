import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

// Backward compatibility module for clarificationAnswers
// This module provides compatibility for components expecting clarificationAnswers:listByIncident

export const listByIncident = query({
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
    // @ts-ignore - Bypass TypeScript deep instantiation issue
    return await ctx.runQuery(internal.aiClarification.getClarificationAnswers, args);
  },
});