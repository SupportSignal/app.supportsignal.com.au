// @ts-nocheck
// Convex to Worker bridge for internal logging
// Replaces the old loggingAction.ts to send logs to Worker instead of storing in Convex

import { action, ActionCtx } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Worker logging interface matching the Worker's expected format
interface WorkerLogRequest {
  trace_id: string;
  message: string;
  level: 'log' | 'info' | 'warn' | 'error';
  system: 'convex';
  user_id?: string;
  stack?: string;
  context?: Record<string, any>;
}

interface WorkerLogResponse {
  success: boolean;
  trace_id: string;
  remaining_quota?: number;
  error?: string;
}

// Main action to send logs to Worker (replaces processLogs)
export const sendToWorker = action({
  args: {
    level: v.string(),
    args: v.array(v.any()),
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    system_area: v.optional(v.string()),
    timestamp: v.number(),
    stack_trace: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      level: string;
      args: unknown[];
      trace_id?: string;
      user_id?: string;
      system_area?: string;
      timestamp: number;
      stack_trace?: string;
    }
  ): Promise<WorkerLogResponse> => {
    try {
      // Get Worker URL from environment variable
      const workerUrl = process.env.LOG_WORKER_URL;
      if (!workerUrl) {
        console.error('LOG_WORKER_URL environment variable not configured');
        return {
          success: false,
          trace_id: args.trace_id || 'unknown',
          error: 'Worker URL not configured',
        };
      }

      // Prepare the payload for the Worker
      const payload: WorkerLogRequest = {
        trace_id: args.trace_id || `convex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: Array.isArray(args.args)
          ? args.args.map(arg => String(arg)).join(' ')
          : String(args.args),
        level: args.level as 'log' | 'info' | 'warn' | 'error',
        system: 'convex',
        user_id: args.user_id,
        stack: args.stack_trace,
        context: {
          timestamp: args.timestamp,
          system_area: args.system_area,
          convex_function_name: ctx.runQuery?.name || ctx.runMutation?.name || 'unknown',
        },
      };

      // Send to Worker
      const response = await fetch(`${workerUrl}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Internal-Logger/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`Worker request failed: ${response.status} ${response.statusText}`);
        return {
          success: false,
          trace_id: payload.trace_id,
          error: `Worker responded with ${response.status}`,
        };
      }

      const result: WorkerLogResponse = await response.json();
      return result;

    } catch (error) {
      console.error('Failed to send log to Worker:', error);
      return {
        success: false,
        trace_id: args.trace_id || 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Backward compatibility wrapper for existing processLogs calls
export const processLogs = action({ 
  args: {
    level: v.string(),
    args: v.array(v.any()),
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    system_area: v.optional(v.string()),
    timestamp: v.number(),
    stack_trace: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx, 
    args: {
      level: string;
      args: unknown[];
      trace_id?: string;
      user_id?: string;
      system_area?: string;
      timestamp: number;
      stack_trace?: string;
    }
  ): Promise<{
    success: boolean;
    result?: { logQueueId: string; recentLogId: string };
    error?: string;
    rateLimitInfo?: { remaining: number; system: string };
  }> => {
    // Redirect to the new Worker-based logging
    const result = await ctx.runAction(api.internalLogging.sendToWorker, args);
    
    // Convert Worker response format to match old Convex format for compatibility
    return {
      success: result.success,
      result: result.success ? { 
        logQueueId: `worker_${result.trace_id}`, 
        recentLogId: `worker_${result.trace_id}` 
      } : undefined,
      error: result.error,
      rateLimitInfo: result.remaining_quota ? {
        remaining: result.remaining_quota,
        system: 'worker',
      } : undefined,
    };
  },
});

// Utility function for internal Convex logging
export const logInternal = action({
  args: {
    level: v.union(v.literal('log'), v.literal('info'), v.literal('warn'), v.literal('error')),
    message: v.string(),
    trace_id: v.optional(v.string()),
    context: v.optional(v.any()),
  },
  handler: async (
    ctx: ActionCtx,
    args: {
      level: 'log' | 'info' | 'warn' | 'error';
      message: string;
      trace_id?: string;
      context?: any;
    }
  ): Promise<WorkerLogResponse> => {
    return await ctx.runAction(api.internalLogging.sendToWorker, {
      level: args.level,
      args: [args.message],
      trace_id: args.trace_id,
      system_area: 'convex-internal',
      timestamp: Date.now(),
      context: args.context,
    });
  },
});

// Health check for Worker connectivity
export const checkWorkerHealth = action({
  args: {},
  handler: async (ctx: ActionCtx): Promise<{
    worker_healthy: boolean;
    worker_url_configured: boolean;
    last_check: number;
    error?: string;
    worker_status?: string;
    worker_components?: any;
  }> => {
    const workerUrl = process.env.LOG_WORKER_URL;
    
    if (!workerUrl) {
      return {
        worker_healthy: false,
        worker_url_configured: false,
        last_check: Date.now(),
        error: 'LOG_WORKER_URL environment variable not configured',
      };
    }

    try {
      const response = await fetch(`${workerUrl}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Convex-Health-Check/1.0',
        },
      });

      const healthy = response.ok;
      const healthData = healthy ? await response.json() : null;

      return {
        worker_healthy: healthy,
        worker_url_configured: true,
        last_check: Date.now(),
        worker_status: healthData?.status,
        worker_components: healthData?.components,
      };

    } catch (error) {
      return {
        worker_healthy: false,
        worker_url_configured: true,
        last_check: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Migration helper to test Worker connectivity
export const testWorkerConnection = action({
  args: {
    test_message: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx,
    args: { test_message?: string }
  ): Promise<{
    test_successful: boolean;
    trace_id: string;
    message: string;
    worker_response: WorkerLogResponse;
    timestamp: number;
  }> => {
    const testMessage = args.test_message || 'Convex to Worker bridge test message';
    
    const result = await ctx.runAction(api.internalLogging.sendToWorker, {
      level: 'info',
      args: [testMessage],
      trace_id: `test_${Date.now()}`,
      system_area: 'convex-bridge-test',
      timestamp: Date.now(),
    });

    return {
      test_successful: result.success,
      trace_id: result.trace_id,
      message: testMessage,
      worker_response: result,
      timestamp: Date.now(),
    };
  },
});