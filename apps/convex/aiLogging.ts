/**
 * AI Logging - Track AI operations for monitoring and debugging
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log AI request for monitoring and debugging
 */
export const logAIRequest = mutation({
  args: {
    correlationId: v.string(),
    operation: v.string(),
    model: v.string(),
    promptTemplate: v.string(),
    inputData: v.optional(v.any()),
    outputData: v.optional(v.any()),
    processingTimeMs: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
    cost: v.optional(v.number()),
    success: v.boolean(),
    error: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    incidentId: v.optional(v.id("incidents")),
  },
  handler: async (ctx, args) => {
    // For now, just log to console - in production this would go to a monitoring system
    console.log(`[AI Operation] ${args.operation}:`, {
      correlationId: args.correlationId,
      model: args.model,
      success: args.success,
      processingTimeMs: args.processingTimeMs,
      error: args.error,
    });
    
    // TODO: In future story, implement persistent AI logging to database table
    // This would create records in an ai_operations_log table for monitoring
    
    return { logged: true };
  },
});