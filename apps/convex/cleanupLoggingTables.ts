// @ts-nocheck
// Migration script to safely remove old logging tables after Worker migration
// Run this ONLY after confirming the Worker logging system is operational

import { mutation } from './_generated/server';
import { v } from 'convex/values';

// Step 1: Check what logging data exists before cleanup
export const checkLoggingDataStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Check each old logging table
    const tableStats = {
      log_queue: { count: 0, sample: null as any },
      recent_log_entries: { count: 0, sample: null as any },
      rate_limit_state: { count: 0, sample: null as any },
      message_fingerprints: { count: 0, sample: null as any },
    };

    try {
      // Count log_queue entries
      const logQueueSample = await ctx.db.query('log_queue').take(1000);
      tableStats.log_queue.count = logQueueSample.length;
      tableStats.log_queue.sample = logQueueSample.length > 0 ? logQueueSample[0] : null;
      
      // Count recent_log_entries
      const recentLogsSample = await ctx.db.query('recent_log_entries').take(1000);
      tableStats.recent_log_entries.count = recentLogsSample.length;
      tableStats.recent_log_entries.sample = recentLogsSample.length > 0 ? recentLogsSample[0] : null;
      
      // Count rate_limit_state (should be 0 or 1)
      const rateLimitState = await ctx.db.query('rate_limit_state').collect();
      tableStats.rate_limit_state.count = rateLimitState.length;
      tableStats.rate_limit_state.sample = rateLimitState.length > 0 ? rateLimitState[0] : null;
      
      // Count message_fingerprints
      const fingerprintsSample = await ctx.db.query('message_fingerprints').take(1000);
      tableStats.message_fingerprints.count = fingerprintsSample.length;
      tableStats.message_fingerprints.sample = fingerprintsSample.length > 0 ? fingerprintsSample[0] : null;
      
    } catch (error) {
      console.error('Error checking logging data:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: now,
      };
    }

    const totalLogEntries = tableStats.log_queue.count + tableStats.recent_log_entries.count;
    
    return {
      status: 'data_found',
      timestamp: now,
      total_log_entries: totalLogEntries,
      tables: tableStats,
      recommendations: {
        safe_to_delete: totalLogEntries === 0,
        worker_migration_required: totalLogEntries > 0,
        backup_recommended: totalLogEntries > 100,
      },
    };
  },
});

// Step 2: Safe cleanup in batches (run multiple times until empty)
export const cleanupLoggingDataBatch = mutation({
  args: {
    batch_size: v.optional(v.number()), // Default 100 per batch
    confirm_deletion: v.boolean(), // Safety flag - must be true
  },
  handler: async (ctx, args) => {
    if (!args.confirm_deletion) {
      throw new Error('confirm_deletion must be true to proceed with data deletion');
    }

    const batchSize = args.batch_size || 100;
    const now = Date.now();
    let totalDeleted = 0;
    const deletionSummary = {
      log_queue: 0,
      recent_log_entries: 0,
      rate_limit_state: 0,
      message_fingerprints: 0,
    };

    try {
      // Delete log_queue entries in batches
      const logQueueEntries = await ctx.db.query('log_queue').take(batchSize);
      for (const entry of logQueueEntries) {
        await ctx.db.delete(entry._id);
        deletionSummary.log_queue++;
        totalDeleted++;
      }

      // Delete recent_log_entries in batches
      const recentLogEntries = await ctx.db.query('recent_log_entries').take(batchSize);
      for (const entry of recentLogEntries) {
        await ctx.db.delete(entry._id);
        deletionSummary.recent_log_entries++;
        totalDeleted++;
      }

      // Delete rate_limit_state (should be 0 or 1 entry)
      const rateLimitEntries = await ctx.db.query('rate_limit_state').collect();
      for (const entry of rateLimitEntries) {
        await ctx.db.delete(entry._id);
        deletionSummary.rate_limit_state++;
        totalDeleted++;
      }

      // Delete message_fingerprints in batches
      const fingerprintEntries = await ctx.db.query('message_fingerprints').take(batchSize);
      for (const entry of fingerprintEntries) {
        await ctx.db.delete(entry._id);
        deletionSummary.message_fingerprints++;
        totalDeleted++;
      }

    } catch (error) {
      console.error('Error during batch cleanup:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        deleted_before_error: totalDeleted,
        timestamp: now,
      };
    }

    return {
      status: totalDeleted > 0 ? 'batch_completed' : 'all_clean',
      timestamp: now,
      total_deleted: totalDeleted,
      deletion_summary: deletionSummary,
      next_action: totalDeleted >= batchSize 
        ? 'Run again - more data may exist' 
        : 'Cleanup complete - run checkLoggingDataStatus to verify',
    };
  },
});

// Step 3: Complete cleanup (use with caution - deletes ALL logging data)
export const completeLoggingCleanup = mutation({
  args: {
    confirm_complete_deletion: v.string(), // Must be exactly "DELETE_ALL_LOGGING_DATA"
  },  
  handler: async (ctx, args) => {
    if (args.confirm_complete_deletion !== 'DELETE_ALL_LOGGING_DATA') {
      throw new Error('Must provide exact confirmation string: DELETE_ALL_LOGGING_DATA');
    }

    const now = Date.now();
    let totalDeleted = 0;
    const deletionSummary = {
      log_queue: 0,
      recent_log_entries: 0,
      rate_limit_state: 0,
      message_fingerprints: 0,
    };

    try {
      // Delete ALL log_queue entries
      const allLogQueue = await ctx.db.query('log_queue').collect();
      for (const entry of allLogQueue) {
        await ctx.db.delete(entry._id);
        deletionSummary.log_queue++;
        totalDeleted++;
      }

      // Delete ALL recent_log_entries
      const allRecentLogs = await ctx.db.query('recent_log_entries').collect();
      for (const entry of allRecentLogs) {
        await ctx.db.delete(entry._id);
        deletionSummary.recent_log_entries++;
        totalDeleted++;
      }

      // Delete ALL rate_limit_state
      const allRateLimits = await ctx.db.query('rate_limit_state').collect();
      for (const entry of allRateLimits) {
        await ctx.db.delete(entry._id);
        deletionSummary.rate_limit_state++;
        totalDeleted++;
      }

      // Delete ALL message_fingerprints
      const allFingerprints = await ctx.db.query('message_fingerprints').collect();
      for (const entry of allFingerprints) {
        await ctx.db.delete(entry._id);
        deletionSummary.message_fingerprints++;
        totalDeleted++;
      }

    } catch (error) {
      console.error('Error during complete cleanup:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        deleted_before_error: totalDeleted,
        timestamp: now,
      };
    }

    return {
      status: 'complete_cleanup_finished',
      timestamp: now,
      total_deleted: totalDeleted,
      deletion_summary: deletionSummary,
      message: 'All logging data has been permanently deleted. Worker logging system should now be the only active logging method.',
    };
  },
});

// Step 4: Verify cleanup completion
export const verifyCleanupComplete = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    try {
      // Check if any logging data remains
      const remainingData = {
        log_queue: (await ctx.db.query('log_queue').take(1)).length,
        recent_log_entries: (await ctx.db.query('recent_log_entries').take(1)).length,
        rate_limit_state: (await ctx.db.query('rate_limit_state').take(1)).length,
        message_fingerprints: (await ctx.db.query('message_fingerprints').take(1)).length,
      };

      const totalRemaining = Object.values(remainingData).reduce((sum, count) => sum + count, 0);
      
      return {
        status: totalRemaining === 0 ? 'cleanup_verified' : 'cleanup_incomplete',
        timestamp: now,
        remaining_data: remainingData,
        total_remaining: totalRemaining,
        cleanup_complete: totalRemaining === 0,
        next_steps: totalRemaining === 0 
          ? 'Migration complete! Worker logging is now the only active system.'
          : 'Run cleanupLoggingDataBatch again to remove remaining data.',
      };
      
    } catch (error) {
      console.error('Error during verification:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: now,
      };
    }
  },
});