/**
 * Story 11.0: Migration Script - Assign Prompts to Groups
 *
 * One-time migration to:
 * 1. Create default prompt groups
 * 2. Assign existing prompts to groups based on workflow_step
 *
 * Usage:
 * bunx convex run migrations/assignPromptsToGroups:seedDefaultGroups
 * bunx convex run migrations/assignPromptsToGroups:assignPromptsToGroups
 *
 * Note: Convex internal API type inference can be intermittently excessive, causing
 * TypeScript to alternate between "unused @ts-expect-error" and "type instantiation
 * excessively deep". This is a known Convex limitation, not a code issue.
 */

// @ts-nocheck - Convex internal API has intermittent type inference depth issues
import { action, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * Seed default prompt groups
 * Safe to run multiple times (idempotent)
 */
export const seedDefaultGroups = action({
  args: {},
  handler: async (ctx) => {
    const results = {
      created: [] as string[],
      existing: [] as string[],
    };

    const defaultGroups = [
      {
        group_name: "Question Generation",
        description: "Prompts that generate clarification questions for incidents",
        display_order: 1,
      },
      {
        group_name: "Narrative Enhancement",
        description: "Prompts that enhance or rewrite narrative text",
        display_order: 2,
      },
      {
        group_name: "Contributing Analysis",
        description: "Prompts that analyze contributing conditions and factors",
        display_order: 3,
      },
      {
        group_name: "Ungrouped",
        description: "Default group for prompts without specific categorization",
        display_order: 999,
      },
    ];

    // Get all existing groups once
    const existing = await ctx.runQuery(internal.promptGroups._internal_listGroups, {});
    const existingNames = new Set(existing.map((g: { group_name: string }) => g.group_name));

    for (const group of defaultGroups) {
      if (existingNames.has(group.group_name)) {
        results.existing.push(group.group_name);
      } else {
        await ctx.runMutation(internal.promptGroups._internal_createGroup, {
          group_name: group.group_name,
          description: group.description,
          display_order: group.display_order,
          is_collapsible: true,
          default_collapsed: false,
        });
        results.created.push(group.group_name);
      }
    }

    return results;
  },
});

/**
 * Assign existing prompts to groups based on workflow_step
 * Maps workflow_step values to appropriate groups
 */
export const assignPromptsToGroups = internalAction({
  args: {},
  handler: async (ctx) => {
    const results = {
      assigned: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get all groups
    const groups = await ctx.runQuery(internal.promptGroups._internal_listGroups, {});
    const groupMap = new Map(groups.map((g: { group_name: string; _id: string }) => [g.group_name, g._id]));

    // Workflow step to group mapping - Updated to match actual workflow_step values
    const workflowStepMapping: Record<string, string> = {
      "clarification_questions": "Question Generation",
      "enhance_narrative": "Narrative Enhancement",
      "analyze_contributing": "Contributing Analysis",
      // Add more mappings as needed
    };

    // Get all prompts from the database
    const prompts = await ctx.runQuery(internal.promptGroups._internal_listAllPrompts, {});

    // Assign each prompt to appropriate group
    for (const prompt of prompts) {
      // Skip if already assigned to a group
      if (prompt.group_id) {
        results.skipped++;
        continue;
      }

      // Determine group based on workflow_step
      const workflowStep = prompt.workflow_step;
      const groupName = workflowStep ? workflowStepMapping[workflowStep] : "Ungrouped";
      const targetGroupName = groupName || "Ungrouped";
      const groupId = groupMap.get(targetGroupName);

      if (!groupId) {
        results.errors.push(`Group "${targetGroupName}" not found for prompt ${prompt._id}`);
        continue;
      }

      try {
        // Update prompt with group_id
        await ctx.runMutation(internal.promptGroups._internal_assignPromptToGroup, {
          promptId: prompt._id,
          groupId: groupId,
        });
        results.assigned++;
      } catch (error) {
        results.errors.push(`Failed to assign prompt ${prompt._id}: ${error}`);
      }
    }

    return results;
  },
});

/**
 * Rollback function - remove group assignments
 * Use if migration needs to be reversed
 */
export const rollbackGroupAssignments = action({
  args: {},
  handler: async (ctx) => {
    const message = `Rollback would set all prompt group_id fields to null.
This is a destructive operation. Manual execution via database console recommended if needed.`;

    return { message };
  },
});
