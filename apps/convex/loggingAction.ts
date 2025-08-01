// @ts-nocheck
// DEPRECATED - Logging migrated to Cloudflare Worker + Redis
// This file provides backward compatibility redirects to the new internalLogging system

import { action, httpAction, ActionCtx } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';

// Backward compatibility: redirect to new Worker-based logging
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
  ) => {
    // Redirect to the new Worker-based logging with compatibility wrapper
    return await ctx.runAction(api.internalLogging.processLogs, args);
  },
});

// Deprecated - old database-based log storage is no longer supported
export const createLogEntry = action({
  args: {
    level: v.string(),
    message: v.string(),
    trace_id: v.string(),
    user_id: v.string(),
    system_area: v.string(),
    timestamp: v.number(),
    raw_args: v.array(v.string()),
    stack_trace: v.optional(v.string()),
  },
  handler: async (
    ctx: ActionCtx, 
    args: {
      level: string;
      message: string;
      trace_id: string;
      user_id: string;
      system_area: string;
      timestamp: number;
      raw_args: string[];
      stack_trace?: string;
    }
  ) => {
    // Convert to new format and send to Worker
    const workerResult = await ctx.runAction(api.internalLogging.sendToWorker, {
      level: args.level,
      args: [args.message],
      trace_id: args.trace_id,
      user_id: args.user_id,
      system_area: args.system_area,
      timestamp: args.timestamp,
      stack_trace: args.stack_trace,
    });

    // Return compatible format
    return {
      logQueueId: `worker_${workerResult.trace_id}`,
      recentLogId: `worker_${workerResult.trace_id}`,
      worker_success: workerResult.success,
      worker_error: workerResult.error,
    };
  },
});

// HTTP Action with deprecation notice
export const processLogsHttp = httpAction(async (ctx, request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Origin, User-Agent',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Return deprecation notice
  return new Response(JSON.stringify({
    success: false,
    error: 'DEPRECATED: Use Cloudflare Worker endpoint instead',
    migration_info: {
      old_endpoint: 'Convex HTTP Action',
      new_endpoint: 'https://log-ingestion.your-worker-domain.workers.dev/log',
      migration_date: '2025-01-29',
      breaking_change: true,
    },
  }), {
    status: 410, // Gone
    headers: corsHeaders,
  });
});

// Health check with migration status
export const loggingHealthCheck = httpAction(async (ctx, request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Check Worker health via bridge
  const workerHealth = await ctx.runAction(api.internalLogging.checkWorkerHealth);

  return new Response(JSON.stringify({
    status: 'migrated',
    service: 'logging-migration-bridge',
    timestamp: Date.now(),
    migration_status: {
      convex_logging: 'deprecated',
      worker_logging: workerHealth.worker_healthy ? 'healthy' : 'unhealthy',
      migration_complete: workerHealth.worker_healthy,
    },
    new_endpoints: {
      worker_log_ingestion: 'https://log-ingestion.your-worker-domain.workers.dev/log',
      worker_health_check: 'https://log-ingestion.your-worker-domain.workers.dev/health',
      worker_log_retrieval: 'https://log-ingestion.your-worker-domain.workers.dev/logs?trace_id={trace_id}',
    },
    worker_health: workerHealth,
  }), {
    status: 200,
    headers: corsHeaders,
  });
});
