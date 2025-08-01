// @ts-nocheck
import { query, mutation, QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';

// Types for log correlation
export interface CorrelatedLogEntry {
  id: string;
  level: string;
  message: string;
  trace_id: string;
  user_id: string;
  system_area: string;
  timestamp: number;
  raw_args: string[];
  stack_trace?: string;
}

export interface LogCorrelationResult {
  trace_id: string;
  total_logs: number;
  systems: string[];
  time_span: {
    start: number;
    end: number;
    duration_ms: number;
  };
  logs: CorrelatedLogEntry[];
  summary: {
    by_system: Record<string, number>;
    by_level: Record<string, number>;
    error_count: number;
    warning_count: number;
  };
}

// Get correlated logs by trace ID across all systems
export const getCorrelatedLogs = query({
  args: {
    trace_id: v.string(),
    include_recent: v.optional(v.boolean()), // Include recent_log_entries table
    limit: v.optional(v.number()), // Limit number of results
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      trace_id: string;
      include_recent?: boolean;
      limit?: number;
    }
  ): Promise<LogCorrelationResult | null> => {
    const limit = args.limit || 1000;

    // Query both log_queue and recent_log_entries for comprehensive results
    const queueLogs = await ctx.db
      .query('log_queue')
      .withIndex('by_trace_id', (q) => q.eq('trace_id', args.trace_id))
      .order('desc')
      .take(limit);

    const recentLogs = args.include_recent !== false ? await ctx.db
      .query('recent_log_entries')
      .withIndex('by_trace_id', (q) => q.eq('trace_id', args.trace_id))
      .order('desc')
      .take(limit) : [];

    // Combine and deduplicate logs based on timestamp and message
    const allLogs = [...queueLogs, ...recentLogs];
    const uniqueLogs = deduplicateLogs(allLogs);

    if (uniqueLogs.length === 0) {
      return null;
    }

    // Sort by timestamp for chronological order
    uniqueLogs.sort((a, b) => a.timestamp - b.timestamp);

    // Convert to CorrelatedLogEntry format
    const correlatedLogs: CorrelatedLogEntry[] = uniqueLogs.map(log => ({
      id: log._id.toString(),
      level: log.level,
      message: log.message,
      trace_id: log.trace_id,
      user_id: log.user_id,
      system_area: log.system_area,
      timestamp: log.timestamp,
      raw_args: log.raw_args,
      stack_trace: log.stack_trace,
    }));

    // Calculate correlation statistics
    const systems = [...new Set(correlatedLogs.map(log => log.system_area))];
    const timeSpan = {
      start: correlatedLogs[0].timestamp,
      end: correlatedLogs[correlatedLogs.length - 1].timestamp,
      duration_ms: correlatedLogs[correlatedLogs.length - 1].timestamp - correlatedLogs[0].timestamp,
    };

    const summary = {
      by_system: correlatedLogs.reduce((acc, log) => {
        acc[log.system_area] = (acc[log.system_area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_level: correlatedLogs.reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      error_count: correlatedLogs.filter(log => log.level === 'error').length,
      warning_count: correlatedLogs.filter(log => log.level === 'warn').length,
    };

    return {
      trace_id: args.trace_id,
      total_logs: correlatedLogs.length,
      systems,
      time_span: timeSpan,
      logs: correlatedLogs,
      summary,
    };
  },
});

// Get recent traces across all systems
export const getRecentTraces = query({
  args: {
    limit: v.optional(v.number()),
    system_filter: v.optional(v.string()), // Filter by specific system
    since_timestamp: v.optional(v.number()), // Only traces since this timestamp
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      limit?: number;
      system_filter?: string;
      since_timestamp?: number;
    }
  ): Promise<Array<{
    trace_id: string;
    systems: string[];
    log_count: number;
    first_seen: number;
    last_seen: number;
    has_errors: boolean;
    user_id: string;
  }>> => {
    const limit = args.limit || 50;
    const since = args.since_timestamp || Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours

    // Get recent logs to build trace summary
    let logsQuery = ctx.db
      .query('recent_log_entries')
      .withIndex('by_timestamp')
      .order('desc')
      .filter(q => q.gt(q.field('timestamp'), since));

    if (args.system_filter) {
      logsQuery = logsQuery.filter(q => q.eq(q.field('system_area'), args.system_filter));
    }

    const recentLogs = await logsQuery.take(limit * 10); // Get more logs to aggregate

    // Group by trace_id
    const traceMap = new Map<string, {
      trace_id: string;
      systems: Set<string>;
      log_count: number;
      first_seen: number;
      last_seen: number;
      has_errors: boolean;
      user_id: string;
    }>();

    for (const log of recentLogs) {
      const existing = traceMap.get(log.trace_id);
      
      if (existing) {
        existing.systems.add(log.system_area);
        existing.log_count++;
        existing.first_seen = Math.min(existing.first_seen, log.timestamp);
        existing.last_seen = Math.max(existing.last_seen, log.timestamp);
        existing.has_errors = existing.has_errors || log.level === 'error';
      } else {
        traceMap.set(log.trace_id, {
          trace_id: log.trace_id,
          systems: new Set([log.system_area]),
          log_count: 1,
          first_seen: log.timestamp,
          last_seen: log.timestamp,
          has_errors: log.level === 'error',
          user_id: log.user_id,
        });
      }
    }

    // Convert to result format and sort by most recent
    const traces = Array.from(traceMap.values())
      .map(trace => ({
        ...trace,
        systems: Array.from(trace.systems),
      }))
      .sort((a, b) => b.last_seen - a.last_seen)
      .slice(0, limit);

    return traces;
  },
});

// Search logs across systems by various criteria
export const searchLogs = query({
  args: {
    query: v.optional(v.string()), // Text search in messages
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    system_area: v.optional(v.string()),
    level: v.optional(v.string()),
    since_timestamp: v.optional(v.number()),
    until_timestamp: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      query?: string;
      trace_id?: string;
      user_id?: string;
      system_area?: string;
      level?: string;
      since_timestamp?: number;
      until_timestamp?: number;
      limit?: number;
    }
  ): Promise<CorrelatedLogEntry[]> => {
    const limit = args.limit || 100;
    const since = args.since_timestamp || Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
    const until = args.until_timestamp || Date.now();

    // Build query filters
    let logsQuery = ctx.db
      .query('recent_log_entries')
      .withIndex('by_timestamp')
      .order('desc')
      .filter(q => q.and(
        q.gt(q.field('timestamp'), since),
        q.lt(q.field('timestamp'), until)
      ));

    // Apply filters
    if (args.trace_id) {
      logsQuery = logsQuery.filter(q => q.eq(q.field('trace_id'), args.trace_id));
    }
    if (args.user_id) {
      logsQuery = logsQuery.filter(q => q.eq(q.field('user_id'), args.user_id));
    }
    if (args.system_area) {
      logsQuery = logsQuery.filter(q => q.eq(q.field('system_area'), args.system_area));
    }
    if (args.level) {
      logsQuery = logsQuery.filter(q => q.eq(q.field('level'), args.level));
    }

    const logs = await logsQuery.take(limit * 2); // Get more for text filtering

    // Apply text search if provided
    let filteredLogs = logs;
    if (args.query) {
      const searchQuery = args.query.toLowerCase();
      filteredLogs = logs.filter(log =>
        log.message.toLowerCase().includes(searchQuery) ||
        log.raw_args.some(arg => arg.toLowerCase().includes(searchQuery))
      );
    }

    // Convert to result format
    return filteredLogs
      .slice(0, limit)
      .map(log => ({
        id: log._id.toString(),
        level: log.level,
        message: log.message,
        trace_id: log.trace_id,
        user_id: log.user_id,
        system_area: log.system_area,
        timestamp: log.timestamp,
        raw_args: log.raw_args,
        stack_trace: log.stack_trace,
      }));
  },
});

// Create correlation insights for trace analysis
export const getTraceInsights = query({
  args: {
    trace_id: v.string(),
  },
  handler: async (
    ctx: QueryCtx,
    args: { trace_id: string }
  ): Promise<{
    trace_id: string;
    insights: {
      system_flow: string[];
      timing_analysis: Array<{
        system: string;
        first_log: number;
        last_log: number;
        duration_ms: number;
        log_count: number;
      }>;
      error_chain: Array<{
        timestamp: number;
        system: string;
        message: string;
        level: string;
      }>;
      performance_issues: Array<{
        issue: string;
        severity: 'low' | 'medium' | 'high';
        description: string;
      }>;
    };
  } | null> => {
    // Get correlated logs directly (cannot call query from within query)
    const limit = 1000;
    const queueLogs = await ctx.db
      .query('log_queue')
      .withIndex('by_trace_id', (q) => q.eq('trace_id', args.trace_id))
      .order('desc')
      .take(limit);

    const recentLogs = await ctx.db
      .query('recent_log_entries')
      .withIndex('by_trace_id', (q) => q.eq('trace_id', args.trace_id))
      .order('desc')
      .take(limit);

    // Combine and deduplicate logs
    const allLogs = [...queueLogs, ...recentLogs];
    const uniqueLogs = deduplicateLogs(allLogs);

    if (uniqueLogs.length === 0) {
      return null;
    }

    // Sort by timestamp for chronological order
    uniqueLogs.sort((a, b) => a.timestamp - b.timestamp);

    // Convert to CorrelatedLogEntry format
    const correlatedLogs: CorrelatedLogEntry[] = uniqueLogs.map(log => ({
      id: log._id.toString(),
      level: log.level,
      message: log.message,
      trace_id: log.trace_id,
      user_id: log.user_id,
      system_area: log.system_area,
      timestamp: log.timestamp,
      raw_args: log.raw_args,
      stack_trace: log.stack_trace,
    }));

    const correlationResult = {
      trace_id: args.trace_id,
      total_logs: correlatedLogs.length,
      systems: [...new Set(correlatedLogs.map(log => log.system_area))],
      time_span: {
        start: correlatedLogs[0].timestamp,
        end: correlatedLogs[correlatedLogs.length - 1].timestamp,
        duration_ms: correlatedLogs[correlatedLogs.length - 1].timestamp - correlatedLogs[0].timestamp,
      },
      logs: correlatedLogs,
      summary: {
        by_system: correlatedLogs.reduce((acc, log) => {
          acc[log.system_area] = (acc[log.system_area] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_level: correlatedLogs.reduce((acc, log) => {
          acc[log.level] = (acc[log.level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        error_count: correlatedLogs.filter(log => log.level === 'error').length,
        warning_count: correlatedLogs.filter(log => log.level === 'warn').length,
      },
    };

    if (!correlationResult) {
      return null;
    }

    // Analyze system flow (order of systems involved)
    const systemFlow = [];
    const seenSystems = new Set<string>();
    
    for (const log of correlationResult.logs) {
      if (!seenSystems.has(log.system_area)) {
        systemFlow.push(log.system_area);
        seenSystems.add(log.system_area);
      }
    }

    // Timing analysis per system
    const systemTimings = new Map<string, { first: number; last: number; count: number }>();
    
    for (const log of correlationResult.logs) {
      const existing = systemTimings.get(log.system_area);
      if (existing) {
        existing.last = Math.max(existing.last, log.timestamp);
        existing.first = Math.min(existing.first, log.timestamp);
        existing.count++;
      } else {
        systemTimings.set(log.system_area, {
          first: log.timestamp,
          last: log.timestamp,
          count: 1,
        });
      }
    }

    const timingAnalysis = Array.from(systemTimings.entries()).map(([system, timing]) => ({
      system,
      first_log: timing.first,
      last_log: timing.last,
      duration_ms: timing.last - timing.first,
      log_count: timing.count,
    }));

    // Error chain analysis
    const errorChain = correlationResult.logs
      .filter(log => log.level === 'error' || log.level === 'warn')
      .map(log => ({
        timestamp: log.timestamp,
        system: log.system_area,
        message: log.message,
        level: log.level,
      }));

    // Performance issue detection
    const performanceIssues = [];
    
    // Check for slow cross-system operations
    if (correlationResult.time_span.duration_ms > 30000) { // > 30 seconds
      performanceIssues.push({
        issue: 'slow_trace_duration',
        severity: 'high' as const,
        description: `Trace duration of ${Math.round(correlationResult.time_span.duration_ms / 1000)}s exceeds expected performance`,
      });
    }

    // Check for high error rates
    const errorRate = errorChain.length / correlationResult.total_logs;
    if (errorRate > 0.3) { // > 30% errors
      performanceIssues.push({
        issue: 'high_error_rate',
        severity: 'high' as const,
        description: `High error rate: ${Math.round(errorRate * 100)}% of logs are errors or warnings`,
      });
    }

    // Check for system bottlenecks
    for (const timing of timingAnalysis) {
      if (timing.duration_ms > 10000 && timing.log_count > 20) {
        performanceIssues.push({
          issue: 'system_bottleneck',
          severity: 'medium' as const,
          description: `${timing.system} shows potential bottleneck: ${timing.log_count} logs over ${Math.round(timing.duration_ms / 1000)}s`,
        });
      }
    }

    return {
      trace_id: args.trace_id,
      insights: {
        system_flow: systemFlow,
        timing_analysis: timingAnalysis,
        error_chain: errorChain,
        performance_issues: performanceIssues,
      },
    };
  },
});

// Helper function to deduplicate logs
function deduplicateLogs(logs: any[]) {
  const seen = new Set<string>();
  return logs.filter(log => {
    const key = `${log.timestamp}-${log.message}-${log.system_area}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Get correlation statistics across all systems
export const getCorrelationStats = query({
  args: {
    since_timestamp: v.optional(v.number()),
  },
  handler: async (
    ctx: QueryCtx,
    args: { since_timestamp?: number }
  ): Promise<{
    total_traces: number;
    multi_system_traces: number;
    system_breakdown: Record<string, number>;
    average_trace_duration: number;
    most_active_traces: Array<{
      trace_id: string;
      log_count: number;
      systems: string[];
    }>;
  }> => {
    const since = args.since_timestamp || Date.now() - (24 * 60 * 60 * 1000); // Last 24 hours

    const recentLogs = await ctx.db
      .query('recent_log_entries')
      .withIndex('by_timestamp')
      .filter(q => q.gt(q.field('timestamp'), since))
      .collect();

    // Group by trace_id
    const traceStats = new Map<string, {
      systems: Set<string>;
      count: number;
      first_timestamp: number;
      last_timestamp: number;
    }>();

    for (const log of recentLogs) {
      const existing = traceStats.get(log.trace_id);
      if (existing) {
        existing.systems.add(log.system_area);
        existing.count++;
        existing.first_timestamp = Math.min(existing.first_timestamp, log.timestamp);
        existing.last_timestamp = Math.max(existing.last_timestamp, log.timestamp);
      } else {
        traceStats.set(log.trace_id, {
          systems: new Set([log.system_area]),
          count: 1,
          first_timestamp: log.timestamp,
          last_timestamp: log.timestamp,
        });
      }
    }

    const traces = Array.from(traceStats.entries());
    const multiSystemTraces = traces.filter(([, stats]) => stats.systems.size > 1);
    
    // System breakdown
    const systemBreakdown: Record<string, number> = {};
    for (const log of recentLogs) {
      systemBreakdown[log.system_area] = (systemBreakdown[log.system_area] || 0) + 1;
    }

    // Average trace duration
    const durations = traces.map(([, stats]) => stats.last_timestamp - stats.first_timestamp);
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;

    // Most active traces
    const mostActiveTraces = traces
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([trace_id, stats]) => ({
        trace_id,
        log_count: stats.count,
        systems: Array.from(stats.systems),
      }));

    return {
      total_traces: traces.length,
      multi_system_traces: multiSystemTraces.length,
      system_breakdown: systemBreakdown,
      average_trace_duration: averageDuration,
      most_active_traces: mostActiveTraces,
    };
  },
});