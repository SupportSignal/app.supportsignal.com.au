import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Insert a single log entry (called by sync actions)
export const insertLog = mutation({
  args: {
    id: v.string(),
    trace_id: v.string(),
    user_id: v.optional(v.string()),
    system: v.union(v.literal("browser"), v.literal("convex"), v.literal("worker"), v.literal("manual")),
    level: v.union(v.literal("log"), v.literal("info"), v.literal("warn"), v.literal("error")),
    message: v.string(),
    timestamp: v.number(),
    context: v.optional(v.any()),
    stack: v.optional(v.string()),
    raw_data: v.any(),
    synced_at: v.number()
  },
  handler: async (ctx, args) => {
    // Check if log already exists to prevent duplicates
    const existing = await ctx.db.query('debug_logs')
      .filter(q => q.eq(q.field('id'), args.id))
      .first();
    
    if (existing) {
      // Update synced_at timestamp for existing log
      await ctx.db.patch(existing._id, { synced_at: args.synced_at });
      return existing._id;
    }

    // Insert new log entry
    return await ctx.db.insert('debug_logs', args);
  }
});

// Query logs with filtering and pagination
export const listLogs = query({
  args: {
    limit: v.optional(v.number()),
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    system: v.optional(v.union(v.literal("browser"), v.literal("convex"), v.literal("worker"), v.literal("manual"))),
    level: v.optional(v.union(v.literal("log"), v.literal("info"), v.literal("warn"), v.literal("error"))),
    search: v.optional(v.string()),
    chronological: v.optional(v.boolean()) // true = oldest first, false/undefined = newest first
  },
  handler: async (ctx, { limit = 100, trace_id, user_id, system, level, search, chronological }) => {
    // Get logs based on primary filter
    let logs: Array<any>;
    const sortOrder = chronological ? 'asc' : 'desc';
    
    if (trace_id) {
      logs = await ctx.db.query('debug_logs')
        .withIndex('by_trace_id', (q) => q.eq('trace_id', trace_id))
        .order(sortOrder)
        .take(limit);
    } else if (user_id) {
      logs = await ctx.db.query('debug_logs')
        .withIndex('by_user_id', (q) => q.eq('user_id', user_id))
        .order(sortOrder)
        .take(limit);
    } else if (system) {
      logs = await ctx.db.query('debug_logs')
        .withIndex('by_system', (q) => q.eq('system', system))
        .order(sortOrder)
        .take(limit);
    } else {
      // Default to timestamp ordering for chronological view
      logs = await ctx.db.query('debug_logs')
        .withIndex('by_timestamp')
        .order(sortOrder)
        .take(limit);
    }

    // Apply additional filters
    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        (log.context && JSON.stringify(log.context).toLowerCase().includes(searchLower))
      );
    }

    return logs;
  }
});

// Get log statistics
export const getLogStats = query({
  args: {},
  handler: async (ctx) => {
    const totalLogs = await ctx.db.query('debug_logs').collect().then(logs => logs.length);
    const uniqueTraces = new Set();
    const uniqueUsers = new Set();
    const systemCounts = { browser: 0, convex: 0, worker: 0, manual: 0 };
    const levelCounts = { log: 0, info: 0, warn: 0, error: 0 };

    const logs = await ctx.db.query('debug_logs').collect();
    
    logs.forEach(log => {
      uniqueTraces.add(log.trace_id);
      if (log.user_id) uniqueUsers.add(log.user_id);
      systemCounts[log.system]++;
      levelCounts[log.level]++;
    });

    const oldestLog = logs.length > 0 ? Math.min(...logs.map(l => l.timestamp)) : null;
    const newestLog = logs.length > 0 ? Math.max(...logs.map(l => l.timestamp)) : null;

    return {
      totalLogs,
      uniqueTraces: uniqueTraces.size,
      uniqueUsers: uniqueUsers.size,
      systemCounts,
      levelCounts,
      dateRange: {
        oldest: oldestLog,
        newest: newestLog
      }
    };
  }
});

// Export logs in various formats for AI consumption
export const exportLogs = query({
  args: {
    format: v.optional(v.union(v.literal('json'), v.literal('csv'), v.literal('readable'))),
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    limit: v.optional(v.number()),
    chronological: v.optional(v.boolean()) // true = oldest first, false/undefined = newest first
  },
  handler: async (ctx, { format = 'readable', trace_id, user_id, limit = 1000, chronological }) => {
    // Get logs based on filter
    let logs: Array<any>;
    const sortOrder = chronological ? 'asc' : 'desc';
    
    if (trace_id) {
      logs = await ctx.db.query('debug_logs')
        .withIndex('by_trace_id', (q) => q.eq('trace_id', trace_id))
        .order(sortOrder)
        .take(limit);
    } else if (user_id) {
      logs = await ctx.db.query('debug_logs')
        .withIndex('by_user_id', (q) => q.eq('user_id', user_id))
        .order(sortOrder)
        .take(limit);
    } else {
      logs = await ctx.db.query('debug_logs')
        .withIndex('by_timestamp')
        .order(sortOrder)
        .take(limit);
    }

    switch (format) {
      case 'json':
        return {
          format: 'json',
          count: logs.length,
          data: logs.map(log => ({
            id: log.id,
            trace_id: log.trace_id,
            user_id: log.user_id,
            system: log.system,
            level: log.level,
            message: log.message,
            timestamp: log.timestamp,
            iso_timestamp: new Date(log.timestamp).toISOString(),
            context: log.context,
            stack: log.stack
          }))
        };

      case 'csv': {
        const csvHeaders = 'timestamp,iso_timestamp,system,level,trace_id,user_id,message,context';
        const csvRows = logs.map(log => [
          log.timestamp,
          new Date(log.timestamp).toISOString(),
          log.system,
          log.level,
          log.trace_id,
          log.user_id || '',
          `"${log.message.replace(/"/g, '""')}"`,
          log.context ? `"${JSON.stringify(log.context).replace(/"/g, '""')}"` : ''
        ].join(','));
        
        return {
          format: 'csv',
          count: logs.length,
          data: [csvHeaders, ...csvRows].join('\n')
        };
      }

      case 'readable': {
        const textLines = logs.map(log => {
          const timestamp = new Date(log.timestamp).toISOString();
          const context = log.context ? `\n  Context: ${JSON.stringify(log.context, null, 2)}` : '';
          const stack = log.stack ? `\n  Stack: ${log.stack}` : '';
          return `[${timestamp}] ${log.system.toUpperCase()} ${log.level.toUpperCase()} [${log.trace_id}] ${log.user_id ? `(${log.user_id}) ` : ''}${log.message}${context}${stack}`;
        });

        return {
          format: 'readable',
          count: logs.length,
          data: textLines.join('\n\n')
        };
      }

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
});

// Clear all logs
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query('debug_logs').collect();
    let deletedCount = 0;
    
    for (const log of logs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }
    
    return deletedCount;
  }
});

// Clear logs by trace ID
export const clearByTrace = mutation({
  args: { trace_id: v.string() },
  handler: async (ctx, { trace_id }) => {
    const logs = await ctx.db.query('debug_logs')
      .withIndex('by_trace_id', (q) => q.eq('trace_id', trace_id))
      .collect();
    
    let deletedCount = 0;
    for (const log of logs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }
    
    return deletedCount;
  }
});

// Clear logs by user ID
export const clearByUser = mutation({
  args: { user_id: v.string() },
  handler: async (ctx, { user_id }) => {
    const logs = await ctx.db.query('debug_logs')
      .withIndex('by_user_id', (q) => q.eq('user_id', user_id))
      .collect();
    
    let deletedCount = 0;
    for (const log of logs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }
    
    return deletedCount;
  }
});

// Clear logs older than specified time
export const clearByAge = mutation({
  args: { cutoff_time: v.number() },
  handler: async (ctx, { cutoff_time }) => {
    const logs = await ctx.db.query('debug_logs')
      .withIndex('by_timestamp')
      .filter(q => q.lt(q.field('timestamp'), cutoff_time))
      .collect();
    
    let deletedCount = 0;
    for (const log of logs) {
      await ctx.db.delete(log._id);
      deletedCount++;
    }
    
    return deletedCount;
  }
});