import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Get active prompt by name (latest version)
export const getActivePrompt = query({
  args: { promptName: v.string() },
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!prompt) {
      throw new ConvexError(`No active prompt found for: ${args.promptName}`);
    }

    return prompt;
  },
});

// Get specific prompt version
export const getPromptVersion = query({
  args: {
    promptName: v.string(),
    promptVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name_version", (q) => 
        q.eq("prompt_name", args.promptName).eq("prompt_version", args.promptVersion)
      )
      .first();

    if (!prompt) {
      throw new ConvexError(`Prompt not found: ${args.promptName} v${args.promptVersion}`);
    }

    return prompt;
  },
});

// List all prompts for a subsystem
export const getPromptsBySubsystem = query({
  args: { subsystem: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ai_prompts")
      .withIndex("by_subsystem", (q) => q.eq("subsystem", args.subsystem))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

// List all prompts for a workflow step
export const getPromptsByWorkflow = query({
  args: { workflowStep: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ai_prompts")
      .withIndex("by_workflow", (q) => q.eq("workflow_step", args.workflowStep))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

// Create new prompt version
export const createPrompt = mutation({
  args: {
    promptName: v.string(),
    promptVersion: v.string(),
    promptTemplate: v.string(),
    description: v.string(),
    inputSchema: v.string(),
    outputSchema: v.string(),
    workflowStep: v.string(),
    subsystem: v.string(),
    aiModel: v.string(),
    maxTokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
    replacesPrevious: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication check for admin roles
    
    // Check if this exact version already exists
    const existingVersion = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name_version", (q) => 
        q.eq("prompt_name", args.promptName).eq("prompt_version", args.promptVersion)
      )
      .first();

    if (existingVersion) {
      throw new ConvexError(`Prompt version already exists: ${args.promptName} v${args.promptVersion}`);
    }

    const now = Date.now();

    // If this should replace the previous active version
    if (args.replacesPrevious) {
      const currentActive = await ctx.db
        .query("ai_prompts")
        .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();

      if (currentActive) {
        // Deactivate current version
        await ctx.db.patch(currentActive._id, {
          is_active: false,
          replaced_at: now,
          replaced_by: args.promptVersion,
        });
      }
    }

    // Create new prompt version
    return await ctx.db.insert("ai_prompts", {
      prompt_name: args.promptName,
      prompt_version: args.promptVersion,
      prompt_template: args.promptTemplate,
      description: args.description,
      input_schema: args.inputSchema,
      output_schema: args.outputSchema,
      workflow_step: args.workflowStep,
      subsystem: args.subsystem,
      ai_model: args.aiModel,
      max_tokens: args.maxTokens,
      temperature: args.temperature,
      is_active: args.replacesPrevious ?? true,
      created_at: now,
      created_by: "temp-user-id" as any, // TODO: Set when auth is implemented
      usage_count: 0,
    });
  },
});

// Update prompt metadata (not template content)
export const updatePromptMetadata = mutation({
  args: {
    promptId: v.id("ai_prompts"),
    description: v.optional(v.string()),
    workflowStep: v.optional(v.string()),
    aiModel: v.optional(v.string()),
    maxTokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication check for admin roles
    
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      throw new ConvexError("Prompt not found");
    }

    const updates: any = {};
    if (args.description !== undefined) updates.description = args.description;
    if (args.workflowStep !== undefined) updates.workflow_step = args.workflowStep;
    if (args.aiModel !== undefined) updates.ai_model = args.aiModel;
    if (args.maxTokens !== undefined) updates.max_tokens = args.maxTokens;
    if (args.temperature !== undefined) updates.temperature = args.temperature;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.promptId, updates);
    }

    return { success: true };
  },
});

// Activate a specific prompt version
export const activatePromptVersion = mutation({
  args: {
    promptName: v.string(),
    promptVersion: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication check for admin roles
    
    const targetPrompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name_version", (q) => 
        q.eq("prompt_name", args.promptName).eq("prompt_version", args.promptVersion)
      )
      .first();

    if (!targetPrompt) {
      throw new ConvexError(`Prompt not found: ${args.promptName} v${args.promptVersion}`);
    }

    if (targetPrompt.is_active) {
      return { success: true, message: "Prompt is already active" };
    }

    const now = Date.now();

    // Deactivate current active version
    const currentActive = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, {
        is_active: false,
        replaced_at: now,
        replaced_by: args.promptVersion,
      });
    }

    // Activate target version
    await ctx.db.patch(targetPrompt._id, {
      is_active: true,
    });

    return { success: true };
  },
});

// Record prompt usage for analytics
export const recordPromptUsage = mutation({
  args: {
    promptName: v.string(),
    promptVersion: v.string(),
    responseTime: v.optional(v.number()),
    successful: v.boolean(),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("ai_prompts")
      .withIndex("by_name_version", (q) => 
        q.eq("prompt_name", args.promptName).eq("prompt_version", args.promptVersion)
      )
      .first();

    if (!prompt) {
      // Don't error on missing prompt - just log usage
      return { success: false, message: "Prompt not found for usage recording" };
    }

    // Update usage statistics
    const currentUsageCount = prompt.usage_count || 0;
    const updates: any = {
      usage_count: currentUsageCount + 1,
    };

    // Calculate running average response time
    if (args.responseTime && prompt.average_response_time) {
      const totalPreviousTime = prompt.average_response_time * currentUsageCount;
      updates.average_response_time = (totalPreviousTime + args.responseTime) / (currentUsageCount + 1);
    } else if (args.responseTime) {
      updates.average_response_time = args.responseTime;
    }

    // Calculate success rate
    if (prompt.success_rate !== undefined && currentUsageCount > 0) {
      const previousSuccesses = Math.round(prompt.success_rate * currentUsageCount);
      const newSuccesses = previousSuccesses + (args.successful ? 1 : 0);
      updates.success_rate = newSuccesses / (currentUsageCount + 1);
    } else {
      updates.success_rate = args.successful ? 1 : 0;
    }

    await ctx.db.patch(prompt._id, updates);
    return { success: true };
  },
});

// Get prompt usage analytics
export const getPromptAnalytics = query({
  args: {
    promptName: v.optional(v.string()),
    subsystem: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication check for admin roles
    
    let prompts;
    
    if (args.promptName) {
      prompts = await ctx.db
        .query("ai_prompts")
        .withIndex("by_name", (q) => q.eq("prompt_name", args.promptName!))
        .collect();
    } else if (args.subsystem) {
      prompts = await ctx.db
        .query("ai_prompts")
        .withIndex("by_subsystem", (q) => q.eq("subsystem", args.subsystem!))
        .collect();
    } else {
      prompts = await ctx.db.query("ai_prompts").collect();
    }

    return prompts.map(p => ({
      promptName: p.prompt_name,
      promptVersion: p.prompt_version,
      subsystem: p.subsystem,
      workflowStep: p.workflow_step,
      isActive: p.is_active,
      usageCount: p.usage_count || 0,
      averageResponseTime: p.average_response_time,
      successRate: p.success_rate,
      created_at: p.created_at,
      replaced_at: p.replaced_at,
    }));
  },
});

// List all active prompts (alias for backward compatibility)
export const listActivePrompts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("ai_prompts")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

// Get prompt performance summary
export const getPromptPerformanceSummary = query({
  args: { subsystem: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // TODO: Add authentication check for admin roles
    
    let prompts;
    
    if (args.subsystem) {
      prompts = await ctx.db
        .query("ai_prompts")
        .withIndex("by_subsystem", (q) => q.eq("subsystem", args.subsystem!))
        .collect();
    } else {
      prompts = await ctx.db.query("ai_prompts").collect();
    }
    
    const activePrompts = prompts.filter(p => p.is_active);
    const totalUsage = prompts.reduce((sum, p) => sum + (p.usage_count || 0), 0);
    const averageSuccessRate = prompts.length > 0 ? 
      prompts.filter(p => p.success_rate !== undefined).reduce((sum, p) => sum + (p.success_rate || 0), 0) / 
      prompts.filter(p => p.success_rate !== undefined).length : 0;

    const averageResponseTime = prompts.length > 0 ?
      prompts.filter(p => p.average_response_time !== undefined).reduce((sum, p) => sum + (p.average_response_time || 0), 0) /
      prompts.filter(p => p.average_response_time !== undefined).length : 0;

    return {
      totalPrompts: prompts.length,
      activePrompts: activePrompts.length,
      totalUsage,
      averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      
      // Breakdown by subsystem
      subsystemBreakdown: args.subsystem ? null : prompts.reduce((acc, p) => {
        const subsystem = p.subsystem || 'unknown';
        if (!acc[subsystem]) {
          acc[subsystem] = { count: 0, usage: 0, active: 0 };
        }
        acc[subsystem].count++;
        acc[subsystem].usage += (p.usage_count || 0);
        if (p.is_active) acc[subsystem].active++;
        return acc;
      }, {} as Record<string, { count: number; usage: number; active: number }>),

      // Top performing prompts
      topPrompts: prompts
        .filter(p => (p.usage_count || 0) > 0)
        .sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))
        .slice(0, 10)
        .map(p => ({
          promptName: p.prompt_name,
          promptVersion: p.prompt_version,
          usageCount: p.usage_count || 0,
          successRate: p.success_rate,
        })),
    };
  },
});