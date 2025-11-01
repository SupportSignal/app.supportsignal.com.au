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
