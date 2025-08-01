// @ts-nocheck
import { mutation, query, MutationCtx, QueryCtx } from './_generated/server';
import { v } from 'convex/values';

type LogEntry = {
  _id: string;
  trace_id: string;
  level: string;
  message: string;
  expires_at?: number;
  timestamp?: number;
};

// Check cleanup status - what needs cleaning and patterns
export const status = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    // Sample approach to estimate counts (avoid memory limits)
    const logQueueSample = await ctx.db.query('log_queue').take(1000);
    const recentLogsSample = await ctx.db
      .query('recent_log_entries')
      .take(1000);
    const users = await ctx.db.query('users').collect();
    const sessions = await ctx.db.query('sessions').collect();

    // Get recent logs for pattern analysis
    const recentSample = await ctx.db
      .query('recent_log_entries')
      .order('desc')
      .take(100);

    // Analyze patterns in recent logs
    const traceCounts: Record<string, number> = {};
    const levelCounts: Record<string, number> = {};
    const messageCounts: Record<string, number> = {};

    recentSample.forEach((log: LogEntry) => {
      traceCounts[log.trace_id] = (traceCounts[log.trace_id] || 0) + 1;
      levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;

      // Group similar messages (first 100 chars for grouping)
      const messageKey = log.message.substring(0, 100);
      messageCounts[messageKey] = (messageCounts[messageKey] || 0) + 1;
    });

    // Sort by frequency
    const topTraces = Object.entries(traceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topMessages = Object.entries(messageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return {
      counts: {
        log_queue_sample: logQueueSample.length,
        recent_log_entries_sample: recentLogsSample.length,
        users: users.length,
        sessions: sessions.length,
        note:
          logQueueSample.length >= 1000 || recentLogsSample.length >= 1000
            ? 'Samples maxed out - actual counts likely higher'
            : 'Showing actual counts',
      },
      recentActivity: {
        levelBreakdown: levelCounts,
        topTraces: topTraces,
        topMessages: topMessages,
        totalRecentSample: recentSample.length,
      },
      recommendation: {
        action:
          logQueueSample.length > 500 || recentLogsSample.length > 500
            ? 'Consider cleanup:safe for maintenance or cleanup:force for testing'
            : 'Database size looks manageable',
        hasData: logQueueSample.length > 0 || recentLogsSample.length > 0,
      },
    };
  },
});

// Safe cleanup - normal maintenance (expired logs and older entries)
export const safe = mutation({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Delete expired recent_log_entries
    const expiredRecentLogs = await ctx.db
      .query('recent_log_entries')
      .filter(q => q.lt(q.field('expires_at'), now))
      .take(300);

    // Delete log_queue entries older than 1 hour
    const oldQueueLogs = await ctx.db
      .query('log_queue')
      .filter(q => q.lt(q.field('timestamp'), oneHourAgo))
      .take(300);

    let deletedCount = 0;

    // Delete expired recent logs
    for (const log of expiredRecentLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }

    // Delete old queue logs
    for (const log of oldQueueLogs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }

    return {
      deletedCount,
      message:
        'Safe cleanup complete. Run multiple times if needed for large datasets.',
      strategy:
        'Deleted expired recent logs and queue entries older than 1 hour',
    };
  },
});

// Force cleanup - delete ALL logs regardless of age (testing/emergency only)
export const force = mutation({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx) => {
    // Delete ALL recent_log_entries regardless of expiry
    const allRecent = await ctx.db.query('recent_log_entries').take(100);
    let deletedRecent = 0;
    for (const log of allRecent) {
      await ctx.db.delete(log._id);
      deletedRecent++;
    }

    // Delete ALL log_queue entries regardless of age
    const allQueue = await ctx.db.query('log_queue').take(100);
    let deletedQueue = 0;
    for (const log of allQueue) {
      await ctx.db.delete(log._id);
      deletedQueue++;
    }

    return {
      deletedRecent,
      deletedQueue,
      totalDeleted: deletedRecent + deletedQueue,
      message:
        '🚨 FORCE cleanup - deleted ALL logs regardless of age. Run multiple times if more exist.',
      strategy:
        'Deleted everything - use only for testing or emergency situations',
    };
  },
});
