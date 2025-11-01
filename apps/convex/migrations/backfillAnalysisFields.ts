/**
 * Story 11.1: Migration Script - Backfill Analysis Fields
 *
 * One-time migration to:
 * 1. Set execution_mode='single' for all existing prompts
 * 2. Map existing workflow_step values to prompt_type enum
 *
 * Usage:
 * bunx convex run migrations/backfillAnalysisFields:backfillExecutionMode
 * bunx convex run migrations/backfillAnalysisFields:backfillPromptType
 * bunx convex run migrations/backfillAnalysisFields:rollback (if needed)
 *
 * Safety:
 * - Idempotent (safe to run multiple times)
 * - Only updates prompts where fields are undefined
 * - Rollback function available for testing
 */

// @ts-nocheck - Convex internal API has intermittent type inference depth issues
import { action, internalAction } from '../_generated/server';
import { internal } from '../_generated/api';

/**
 * Backfill execution_mode='single' for all existing prompts
 * Safe to run multiple times (only updates undefined values)
 */
export const backfillExecutionMode = action({
  args: {},
  handler: async (ctx) => {
    const results = {
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get all prompts
    const prompts = await ctx.runQuery(internal.promptManager._internal_listAllPrompts, {});

    for (const prompt of prompts) {
      try {
        // Only update if execution_mode is undefined
        if (prompt.execution_mode === undefined) {
          await ctx.runMutation(internal.promptManager._internal_updatePrompt, {
            promptId: prompt._id,
            execution_mode: 'single',
          });
          results.updated++;
        } else {
          results.skipped++;
        }
      } catch (error) {
        results.errors.push(`Failed to update prompt ${prompt._id}: ${error}`);
      }
    }

    return results;
  },
});

/**
 * Backfill prompt_type based on workflow_step mapping
 * Safe to run multiple times (only updates undefined values)
 *
 * Mapping logic:
 * - Question-related steps → "generation"
 * - Enhancement/rewrite steps → "generation"
 * - Analysis steps → "observation"
 * - Default → "generation"
 */
export const backfillPromptType = action({
  args: {},
  handler: async (ctx) => {
    const results = {
      updated: 0,
      skipped: 0,
      errors: [] as string[],
      mapping: {} as Record<string, number>,
    };

    // Workflow step to prompt_type mapping
    const workflowStepToPromptType: Record<string, "generation" | "predicate" | "classification" | "observation"> = {
      // Question generation → generation
      "incident_clarification": "generation",
      "generate_follow_up": "generation",

      // Narrative enhancement → generation
      "narrative_enhancement": "generation",
      "narrative_rewrite": "generation",
      "enhance_narrative": "generation",

      // Contributing analysis → observation
      "contributing_conditions": "observation",
      "contributing_factor": "observation",
      "analyze_contributing": "observation",

      // Default for any unmatched
    };

    // Get all prompts
    const prompts = await ctx.runQuery(internal.promptManager._internal_listAllPrompts, {});

    for (const prompt of prompts) {
      try {
        // Only update if prompt_type is undefined
        if (prompt.prompt_type === undefined) {
          // Map workflow_step to prompt_type (default to "generation")
          const prompt_type = workflowStepToPromptType[prompt.workflow_step] || "generation";

          await ctx.runMutation(internal.promptManager._internal_updatePrompt, {
            promptId: prompt._id,
            prompt_type,
          });

          results.updated++;
          results.mapping[prompt_type] = (results.mapping[prompt_type] || 0) + 1;
        } else {
          results.skipped++;
        }
      } catch (error) {
        results.errors.push(`Failed to update prompt ${prompt._id}: ${error}`);
      }
    }

    return results;
  },
});

/**
 * Rollback function - removes execution_mode and prompt_type from all prompts
 * Use for testing or if migration needs to be reversed
 *
 * DANGER: This removes data. Only use in development/testing.
 */
export const rollback = action({
  args: {},
  handler: async (ctx) => {
    const results = {
      updated: 0,
      errors: [] as string[],
    };

    // Get all prompts
    const prompts = await ctx.runQuery(internal.promptManager._internal_listAllPrompts, {});

    for (const prompt of prompts) {
      try {
        await ctx.runMutation(internal.promptManager._internal_updatePrompt, {
          promptId: prompt._id,
          execution_mode: undefined,
          prompt_type: undefined,
        });
        results.updated++;
      } catch (error) {
        results.errors.push(`Failed to rollback prompt ${prompt._id}: ${error}`);
      }
    }

    return results;
  },
});

/**
 * Run full migration (execution_mode + prompt_type)
 * Convenience function to run both migrations in sequence
 */
export const runFullMigration = action({
  args: {},
  handler: async (ctx) => {
    const executionModeResults = await ctx.runAction(internal.migrations.backfillAnalysisFields.backfillExecutionMode, {});
    const promptTypeResults = await ctx.runAction(internal.migrations.backfillAnalysisFields.backfillPromptType, {});

    return {
      execution_mode: executionModeResults,
      prompt_type: promptTypeResults,
    };
  },
});
