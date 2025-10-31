/**
 * Story 11.0: Prompt Groups Management
 *
 * Convex functions for CRUD operations on prompt_groups table.
 * Supports grouping, ordering, and organizing AI prompts.
 */

import { v } from 'convex/values';
import { mutation, query, internalMutation, internalQuery } from './_generated/server';
import { Id } from './_generated/dataModel';

/**
 * Create a new prompt group
 */
export const createGroup = mutation({
  args: {
    group_name: v.string(),
    description: v.optional(v.string()),
    display_order: v.number(),
    is_collapsible: v.optional(v.boolean()),
    default_collapsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get current user for attribution
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject as Id<"users"> | undefined;

    const groupId = await ctx.db.insert("prompt_groups", {
      group_name: args.group_name,
      description: args.description,
      display_order: args.display_order,
      is_collapsible: args.is_collapsible ?? true,
      default_collapsed: args.default_collapsed ?? false,
      created_at: Date.now(),
      created_by: userId,
    });

    return groupId;
  },
});

/**
 * Update an existing prompt group
 */
export const updateGroup = mutation({
  args: {
    id: v.id("prompt_groups"),
    group_name: v.optional(v.string()),
    description: v.optional(v.string()),
    display_order: v.optional(v.number()),
    is_collapsible: v.optional(v.boolean()),
    default_collapsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Only update fields that were provided
    const fieldsToUpdate: Record<string, unknown> = {};
    if (updates.group_name !== undefined) fieldsToUpdate.group_name = updates.group_name;
    if (updates.description !== undefined) fieldsToUpdate.description = updates.description;
    if (updates.display_order !== undefined) fieldsToUpdate.display_order = updates.display_order;
    if (updates.is_collapsible !== undefined) fieldsToUpdate.is_collapsible = updates.is_collapsible;
    if (updates.default_collapsed !== undefined) fieldsToUpdate.default_collapsed = updates.default_collapsed;

    await ctx.db.patch(id, fieldsToUpdate);
    return id;
  },
});

/**
 * Delete a prompt group
 * Validates that no active prompts are assigned to this group
 */
export const deleteGroup = mutation({
  args: {
    id: v.id("prompt_groups"),
  },
  handler: async (ctx, args) => {
    // Check if any active prompts are assigned to this group
    const promptsInGroup = await ctx.db
      .query("ai_prompts")
      .withIndex("by_group", (q) => q.eq("group_id", args.id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    if (promptsInGroup.length > 0) {
      throw new Error(
        `Cannot delete group: ${promptsInGroup.length} active prompts are assigned to this group. ` +
        `Please reassign or deactivate these prompts first.`
      );
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * List all prompt groups ordered by display_order
 */
export const listGroups = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db
      .query("prompt_groups")
      .withIndex("by_display_order")
      .collect();

    return groups;
  },
});

/**
 * Get a single prompt group by ID
 */
export const getGroupById = query({
  args: {
    id: v.id("prompt_groups"),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    return group;
  },
});

/**
 * Reorder multiple prompts (bulk display_order update)
 */
export const reorderPrompts = mutation({
  args: {
    promptIds: v.array(v.id("ai_prompts")),
    newOrders: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.promptIds.length !== args.newOrders.length) {
      throw new Error("promptIds and newOrders arrays must have the same length");
    }

    // Update each prompt's display_order
    const updates = args.promptIds.map(async (promptId, index) => {
      await ctx.db.patch(promptId, {
        display_order: args.newOrders[index],
      });
    });

    await Promise.all(updates);
    return { success: true, count: args.promptIds.length };
  },
});

/**
 * Move a prompt to a different group
 */
export const movePromptToGroup = mutation({
  args: {
    promptId: v.id("ai_prompts"),
    newGroupId: v.union(v.id("prompt_groups"), v.null()),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.promptId, {
      group_id: args.newGroupId ?? undefined,
      display_order: args.displayOrder,
    });

    return { success: true };
  },
});

// Internal versions for use by migrations and other backend functions
export const _internal_createGroup = internalMutation({
  args: {
    group_name: v.string(),
    description: v.optional(v.string()),
    display_order: v.number(),
    is_collapsible: v.optional(v.boolean()),
    default_collapsed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const groupId = await ctx.db.insert("prompt_groups", {
      group_name: args.group_name,
      description: args.description,
      display_order: args.display_order,
      is_collapsible: args.is_collapsible ?? true,
      default_collapsed: args.default_collapsed ?? false,
      created_at: Date.now(),
      created_by: undefined, // No user context in internal calls
    });

    return groupId;
  },
});

export const _internal_listGroups = internalQuery({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db
      .query("prompt_groups")
      .withIndex("by_display_order")
      .collect();

    return groups;
  },
});

export const _internal_listAllPrompts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const prompts = await ctx.db.query("ai_prompts").collect();
    return prompts;
  },
});

export const _internal_assignPromptToGroup = internalMutation({
  args: {
    promptId: v.id("ai_prompts"),
    groupId: v.id("prompt_groups"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.promptId, {
      group_id: args.groupId,
    });
    return { success: true };
  },
});
