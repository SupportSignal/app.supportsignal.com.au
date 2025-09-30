// @ts-nocheck
import { httpAction } from './_generated/server';
import { action } from './_generated/server';
import { api } from './_generated/api';
import { v } from 'convex/values';
import { generateWorkerUrl } from './lib/urlConfig';

// Get Redis statistics without importing data
export const getRedisStats = httpAction(async (ctx, request) => {
  try {
    const healthUrl = generateWorkerUrl('health');
    const healthResponse = await fetch(healthUrl);
    if (!healthResponse.ok) {
      throw new Error(`Worker health check failed: ${healthResponse.status}`);
    }

    const healthData = await healthResponse.json();
    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Failed to fetch Redis stats:', error);

    // Handle worker URL configuration errors specifically
    if (error instanceof Error && error.message.includes('Worker URL') && error.message.includes('not configured')) {
      return new Response(
        JSON.stringify({ error: 'NEXT_PUBLIC_LOG_WORKER_URL not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Redis statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Sync all logs from Redis to Convex
export const syncAllLogs = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (ctx, { sessionToken }): Promise<{ success: boolean; totalSynced: number; syncedAt: number; deletedCount: number }> => {
    try {
      // STEP 1: Clear all existing debug logs for true sync behavior
      console.log('Clearing existing debug logs for true sync...');
      const deletedCount = await ctx.runMutation(api.debugLogs.clearAll, {});
      console.log(`Cleared ${deletedCount} existing logs from Convex`);

      // STEP 2: Fetch current Redis traces
      const tracesUrl = generateWorkerUrl('traces/recent');
      const tracesResponse = await fetch(tracesUrl);
      if (!tracesResponse.ok) {
        throw new Error(`Failed to fetch traces: ${tracesResponse.status}`);
      }
      const tracesData = await tracesResponse.json();

      let totalSynced = 0;
      const syncedAt = Date.now();

      // STEP 3: Import all current Redis logs
      for (const trace of tracesData.traces) {
        const logsUrl = generateWorkerUrl(`logs?trace_id=${trace.trace_id || trace.id}`);
        const logsResponse = await fetch(logsUrl);
        if (!logsResponse.ok) {
          console.warn(`Failed to fetch logs for trace ${trace.trace_id || trace.id}: ${logsResponse.status}`);
          continue;
        }

        const logsData = await logsResponse.json();
        
        // Insert each log into debug_logs table
        for (const log of logsData.logs) {
          try {
            await ctx.runMutation(api.debugLogs.insertLog, {
              id: log.id || `${log.trace_id}-${log.timestamp}`,
              trace_id: log.trace_id,
              user_id: log.user_id || undefined,
              system: log.system || 'browser',
              level: log.level || 'log',
              message: log.message || '',
              timestamp: log.timestamp,
              context: log.context || undefined,
              stack: log.stack || undefined,
              raw_data: log,
              synced_at: syncedAt
            });
            totalSynced++;
          } catch (error) {
            console.warn(`Failed to insert log ${log.id || 'unknown'}:`, error);
          }
        }
      }

      return { success: true, totalSynced, syncedAt, deletedCount };
    } catch (error) {
      console.error('Failed to sync all logs:', error);
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Sync logs by specific trace ID
export const syncByTrace = action({
  args: { trace_id: v.string() },
  handler: async (ctx, { trace_id }): Promise<{ success: boolean; trace_id: string; totalSynced: number; syncedAt: number; deletedCount: number }> => {
    try {
      // STEP 1: Clear existing logs for this trace (true sync behavior)
      console.log(`Clearing existing logs for trace ${trace_id}...`);
      const deletedCount = await ctx.runMutation(api.debugLogs.clearByTrace, { trace_id });
      console.log(`Cleared ${deletedCount} existing logs for trace ${trace_id}`);

      // STEP 2: Fetch current Redis logs for this trace
      const logsUrl = generateWorkerUrl(`logs?trace_id=${trace_id}`);
      const logsResponse = await fetch(logsUrl);
      if (!logsResponse.ok) {
        throw new Error(`Failed to fetch logs for trace ${trace_id}: ${logsResponse.status}`);
      }

      // STEP 3: Import current Redis logs for this trace
      const logsData = await logsResponse.json();
      const syncedAt = Date.now();
      let totalSynced = 0;

      // Insert each log into debug_logs table
      for (const log of logsData.logs) {
        await ctx.runMutation(api.debugLogs.insertLog, {
          id: log.id,
          trace_id: log.trace_id,
          user_id: log.user_id,
          system: log.system,
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
          context: log.context,
          stack: log.stack,
          raw_data: log,
          synced_at: syncedAt
        });
        totalSynced++;
      }

      return { success: true, trace_id, totalSynced, syncedAt, deletedCount };
    } catch (error) {
      console.error(`Failed to sync logs for trace ${trace_id}:`, error);
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Sync logs by specific user ID
export const syncByUser = action({
  args: { user_id: v.string() },
  handler: async (ctx, { user_id }): Promise<{ success: boolean; user_id: string; totalSynced: number; syncedAt: number; deletedCount: number }> => {
    try {
      // STEP 1: Clear existing logs for this user (true sync behavior)
      console.log(`Clearing existing logs for user ${user_id}...`);
      const deletedCount = await ctx.runMutation(api.debugLogs.clearByUser, { user_id });
      console.log(`Cleared ${deletedCount} existing logs for user ${user_id}`);

      // STEP 2: Fetch all current Redis traces to find user logs
      // Note: Worker may not support user_id filtering directly
      // We'll fetch all logs and filter client-side for now
      const tracesUrl = generateWorkerUrl('traces/recent');
      const tracesResponse = await fetch(tracesUrl);
      if (!tracesResponse.ok) {
        throw new Error(`Failed to fetch traces: ${tracesResponse.status}`);
      }
      const tracesData = await tracesResponse.json();

      let totalSynced = 0;
      const syncedAt = Date.now();

      // Check each trace for user_id match
      for (const trace of tracesData.traces) {
        const logsUrl = generateWorkerUrl(`logs?trace_id=${trace.trace_id || trace.id}`);
        const logsResponse = await fetch(logsUrl);
        if (!logsResponse.ok) {
          console.warn(`Failed to fetch logs for trace ${trace.trace_id || trace.id}: ${logsResponse.status}`);
          continue;
        }

        const logsData = await logsResponse.json();
        
        // Filter and insert logs for specific user
        for (const log of logsData.logs) {
          if (log.user_id === user_id) {
            try {
              await ctx.runMutation(api.debugLogs.insertLog, {
                id: log.id || `${log.trace_id}-${log.timestamp}`,
                trace_id: log.trace_id,
                user_id: log.user_id || undefined,
                system: log.system || 'browser',
                level: log.level || 'log',
                message: log.message || '',
                timestamp: log.timestamp,
                context: log.context || undefined,
                stack: log.stack || undefined,
                raw_data: log,
                synced_at: syncedAt
              });
              totalSynced++;
            } catch (error) {
              console.warn(`Failed to insert log ${log.id || 'unknown'}:`, error);
            }
          }
        }
      }

      return { success: true, user_id, totalSynced, syncedAt, deletedCount };
    } catch (error) {
      console.error(`Failed to sync logs for user ${user_id}:`, error);
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Clear debug logs with optional filters
export const clearDebugLogs = action({
  args: { 
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    older_than_hours: v.optional(v.number())
  },
  handler: async (ctx, { trace_id, user_id, older_than_hours }): Promise<{ success: boolean; deletedCount: number }> => {
    const cutoffTime = older_than_hours ? Date.now() - (older_than_hours * 60 * 60 * 1000) : null;
    
    let deletedCount = 0;
    
    if (trace_id) {
      deletedCount = await ctx.runMutation(api.debugLogs.clearByTrace, { trace_id });
    } else if (user_id) {
      deletedCount = await ctx.runMutation(api.debugLogs.clearByUser, { user_id });
    } else if (cutoffTime) {
      deletedCount = await ctx.runMutation(api.debugLogs.clearByAge, { cutoff_time: cutoffTime });
    } else {
      deletedCount = await ctx.runMutation(api.debugLogs.clearAll, {});
    }

    return { success: true, deletedCount };
  }
});

// Clear Redis logs (calls worker DELETE endpoint)
export const clearRedisLogs = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (_ctx, { sessionToken }): Promise<{ success: boolean; cleared_logs: number; cleared_traces: number }> => {
    try {
      const clearUrl = generateWorkerUrl('logs/clear');
      const response = await fetch(clearUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear Redis logs: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        cleared_logs: result.cleared_logs || 0,
        cleared_traces: result.cleared_traces || 0
      };
    } catch (error) {
      console.error('Failed to clear Redis logs:', error);
      throw new Error(`Clear Redis logs failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

// Clear Redis and then sync (combined operation for fresh debugging)
export const clearRedisAndSync = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handler: async (ctx, { sessionToken }): Promise<{ success: boolean; cleared_logs: number; cleared_traces: number; totalSynced: number; deletedCount: number; syncedAt: number }> => {
    try {
      // Step 1: Clear Redis
      console.log('Clearing Redis logs...');
      const clearResult = await ctx.runAction(api.workerSync.clearRedisLogs, {});
      console.log(`Cleared ${clearResult.cleared_logs} logs and ${clearResult.cleared_traces} traces from Redis`);

      // Step 2: Clear Convex (since Redis is now empty, this ensures clean state)
      console.log('Clearing Convex logs...');
      const convexDeletedCount = await ctx.runMutation(api.debugLogs.clearAll, {});
      console.log(`Cleared ${convexDeletedCount} logs from Convex`);

      // Step 3: Sync (should sync nothing since Redis is cleared)
      console.log('Syncing current Redis state (should be empty)...');
      const syncResult = await ctx.runAction(api.workerSync.syncAllLogs, {});
      console.log(`Synced ${syncResult.totalSynced} logs from Redis to Convex`);

      return {
        success: true,
        cleared_logs: clearResult.cleared_logs,
        cleared_traces: clearResult.cleared_traces,
        totalSynced: syncResult.totalSynced,
        deletedCount: convexDeletedCount,
        syncedAt: syncResult.syncedAt
      };
    } catch (error) {
      console.error('Failed to clear Redis and sync:', error);
      throw new Error(`Clear Redis and sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});