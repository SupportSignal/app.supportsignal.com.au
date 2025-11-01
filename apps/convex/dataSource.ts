/**
 * Story 11.1: Data Source Profile Management
 *
 * Manages data source profiles for batch analysis configuration.
 * Data sources define what entities (incidents, narratives, moments) can be analyzed.
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requirePermission, PERMISSIONS } from "./permissions";
import { ConvexError } from "convex/values";

/**
 * Task 5: Create a new data source profile (system admin only)
 */
export const createDataSourceProfile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    entity_type: v.union(
      v.literal("incident"),
      v.literal("narrative"),
      v.literal("moment")
    ),
    config: v.any(), // JSON configuration
  },
  handler: async (ctx, args) => {
    // Verify system admin permission
    await requirePermission(ctx, args.sessionToken, PERMISSIONS.MANAGE_USERS);

    // Check for duplicate name
    const existing = await ctx.db
      .query("data_source_profiles")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existing) {
      throw new ConvexError({
        message: `Data source profile with name "${args.name}" already exists`,
        code: "DUPLICATE_DATA_SOURCE",
      });
    }

    // Get current user from session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (!session) {
      throw new ConvexError({
        message: "Invalid session",
        code: "INVALID_SESSION",
      });
    }

    // Create data source profile
    const dataSourceId = await ctx.db.insert("data_source_profiles", {
      name: args.name,
      description: args.description,
      entity_type: args.entity_type,
      config: args.config,
      status: "active",
      created_at: Date.now(),
      created_by: session.userId,
      last_run_at: undefined,
    });

    return dataSourceId;
  },
});

/**
 * Task 6: List all data source profiles with optional filters
 */
export const listDataSourceProfiles = query({
  args: {
    entity_type: v.optional(v.union(
      v.literal("incident"),
      v.literal("narrative"),
      v.literal("moment")
    )),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("error")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("data_source_profiles");

    // Apply filters
    if (args.entity_type && args.status) {
      query = query.withIndex("by_entity_status", (q) =>
        q.eq("entity_type", args.entity_type).eq("status", args.status)
      );
    } else if (args.entity_type) {
      query = query.withIndex("by_entity_type", (q) =>
        q.eq("entity_type", args.entity_type)
      );
    } else if (args.status) {
      query = query.withIndex("by_status", (q) =>
        q.eq("status", args.status)
      );
    }

    const profiles = await query.collect();

    // For each profile, count linked prompts
    const profilesWithCounts = await Promise.all(
      profiles.map(async (profile) => {
        const promptCount = await ctx.db
          .query("ai_prompts")
          .withIndex("by_data_source", (q) => q.eq("data_source_id", profile._id))
          .collect()
          .then((prompts) => prompts.length);

        return {
          ...profile,
          prompt_count: promptCount,
        };
      })
    );

    // Order by creation date descending
    return profilesWithCounts.sort((a, b) => b.created_at - a.created_at);
  },
});

/**
 * Task 7: Create a new analysis prompt for batch processing
 */
export const createAnalysisPrompt = mutation({
  args: {
    sessionToken: v.string(),
    prompt_name: v.string(),
    prompt_template: v.string(),
    workflow_step: v.string(),
    execution_mode: v.optional(v.union(
      v.literal("single"),
      v.literal("batch_analysis")
    )),
    prompt_type: v.optional(v.union(
      v.literal("generation"),
      v.literal("predicate"),
      v.literal("classification"),
      v.literal("observation")
    )),
    data_source_id: v.optional(v.id("data_source_profiles")),
    output_format: v.optional(v.any()),
    display_order: v.optional(v.number()),
    group_id: v.optional(v.id("prompt_groups")),
    ai_model: v.optional(v.string()),
    max_tokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user has permission to create prompts
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA
    );

    // Validate data source exists if provided
    if (args.data_source_id) {
      const dataSource = await ctx.db.get(args.data_source_id);
      if (!dataSource) {
        throw new ConvexError({
          message: "Data source profile not found",
          code: "DATA_SOURCE_NOT_FOUND",
        });
      }
    }

    // Set defaults
    const execution_mode = args.execution_mode || "single";
    const prompt_type = args.prompt_type || "generation";

    // Create the prompt
    const promptId = await ctx.db.insert("ai_prompts", {
      prompt_name: args.prompt_name,
      prompt_template: args.prompt_template,
      workflow_step: args.workflow_step,
      execution_mode,
      prompt_type,
      data_source_id: args.data_source_id,
      output_format: args.output_format,
      display_order: args.display_order,
      group_id: args.group_id,
      ai_model: args.ai_model || "gpt-4o-mini",
      max_tokens: args.max_tokens || 2000,
      temperature: args.temperature || 0.3,
      prompt_version: "v1.0.0",
      is_active: true,
      usage_count: 0,
      created_at: Date.now(),
      created_by: user._id,
    });

    return promptId;
  },
});

/**
 * Task 8: Update an existing analysis prompt
 */
export const updateAnalysisPrompt = mutation({
  args: {
    sessionToken: v.string(),
    promptId: v.id("ai_prompts"),
    prompt_name: v.optional(v.string()),
    prompt_template: v.optional(v.string()),
    workflow_step: v.optional(v.string()),
    execution_mode: v.optional(v.union(
      v.literal("single"),
      v.literal("batch_analysis")
    )),
    prompt_type: v.optional(v.union(
      v.literal("generation"),
      v.literal("predicate"),
      v.literal("classification"),
      v.literal("observation")
    )),
    data_source_id: v.optional(v.id("data_source_profiles")),
    output_format: v.optional(v.any()),
    display_order: v.optional(v.number()),
    group_id: v.optional(v.id("prompt_groups")),
    ai_model: v.optional(v.string()),
    max_tokens: v.optional(v.number()),
    temperature: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify user has permission to update prompts
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.SAMPLE_DATA
    );

    // Get existing prompt
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      throw new ConvexError({
        message: "Prompt not found",
        code: "PROMPT_NOT_FOUND",
      });
    }

    // Validate data source exists if being changed
    if (args.data_source_id !== undefined) {
      if (args.data_source_id) {
        const dataSource = await ctx.db.get(args.data_source_id);
        if (!dataSource) {
          throw new ConvexError({
            message: "Data source profile not found",
            code: "DATA_SOURCE_NOT_FOUND",
          });
        }
      }

      // Check if prompt has linked executions
      const linkedExecutions = await ctx.db
        .query("analysis_results")
        .withIndex("by_prompt_id", (q) => q.eq("prompt_id", args.promptId))
        .first();

      if (linkedExecutions) {
        throw new ConvexError({
          message: "Cannot change data source for prompt with existing execution results",
          code: "PROMPT_HAS_EXECUTIONS",
        });
      }
    }

    // Build update object with only provided fields
    const updates: any = {};
    if (args.prompt_name !== undefined) updates.prompt_name = args.prompt_name;
    if (args.prompt_template !== undefined) updates.prompt_template = args.prompt_template;
    if (args.workflow_step !== undefined) updates.workflow_step = args.workflow_step;
    if (args.execution_mode !== undefined) updates.execution_mode = args.execution_mode;
    if (args.prompt_type !== undefined) updates.prompt_type = args.prompt_type;
    if (args.data_source_id !== undefined) updates.data_source_id = args.data_source_id;
    if (args.output_format !== undefined) updates.output_format = args.output_format;
    if (args.display_order !== undefined) updates.display_order = args.display_order;
    if (args.group_id !== undefined) updates.group_id = args.group_id;
    if (args.ai_model !== undefined) updates.ai_model = args.ai_model;
    if (args.max_tokens !== undefined) updates.max_tokens = args.max_tokens;
    if (args.temperature !== undefined) updates.temperature = args.temperature;
    if (args.is_active !== undefined) updates.is_active = args.is_active;

    // Update the prompt
    await ctx.db.patch(args.promptId, updates);

    return { success: true };
  },
});
