import { action } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { 
  fetchLogsFromRedis, 
  analyzeLogCorrelation,
  type RedisLogEntry,
  type CorrelationAnalysis 
} from './lib/redisLogFetcher';

export interface ExportData {
  structured: object;
  markdown: string;
}

export interface DebugSession {
  traceId: string;
  logs: RedisLogEntry[];
  correlationAnalysis: CorrelationAnalysis;
  exportData: ExportData;
  fetchTime: number;
}

export interface ClaudeDebugExport {
  metadata: {
    traceId: string;
    exportTime: string;
    logCount: number;
    systems: string[];
    timeRange: { start: number; end: number };
  };
  timeline: Array<{
    timestamp: string;
    system: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
  }>;
  analysis: {
    errorChains: Array<{
      description: string;
      entries: Array<{ timestamp: string; system: string; message: string }>;
    }>;
    performanceIssues: Array<{
      issue: string;
      evidence: string;
      recommendation: string;
    }>;
    systemFlow: Array<{
      system: string;
      actions: string[];
      duration: string;
    }>;
  };
  summary: string;
}

// Session-based caching to reduce Redis calls
const debugSessionCache = new Map<string, DebugSession>();
const CACHE_TTL = 300_000; // 5 minutes

/**
 * Fetches logs from Redis for debugging with correlation analysis
 */
export const fetchLogsForTrace = action({
  args: {
    traceId: v.string(),
    includeContext: v.optional(v.boolean()),
    systemFilter: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args): Promise<DebugSession> => {
    // Check cache first
    const cached = debugSessionCache.get(args.traceId);
    if (cached && Date.now() - cached.fetchTime < CACHE_TTL) {
      return cached;
    }

    try {
      // Fetch logs from Redis
      const logs = await fetchLogsFromRedis(args.traceId, args.systemFilter);
      
      // Perform correlation analysis
      const correlationAnalysis = analyzeLogCorrelation(logs);
      
      // Generate export data
      const exportData = await generateExportData(logs, correlationAnalysis, args.traceId);
      
      const session: DebugSession = {
        traceId: args.traceId,
        logs,
        correlationAnalysis,
        exportData,
        fetchTime: Date.now()
      };

      // Cache the session
      debugSessionCache.set(args.traceId, session);
      
      return session;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Debug session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

/**
 * Exports debug session in various formats
 */
export const exportSession = action({
  args: {
    traceId: v.string(),
    format: v.union(v.literal('json'), v.literal('markdown'), v.literal('claude-format')),
    includeAnalysis: v.optional(v.boolean())
  },
  handler: async (ctx, args): Promise<{ exportContent: string; metadata: Record<string, unknown> }> => {
    // Get session from cache or fetch fresh
    let session = debugSessionCache.get(args.traceId);
    if (!session) {
      // Fetch fresh session
      const logs = await fetchLogsFromRedis(args.traceId);
      const correlationAnalysis = analyzeLogCorrelation(logs);
      const exportData = await generateExportData(logs, correlationAnalysis, args.traceId);
      
      session = {
        traceId: args.traceId,
        logs,
        correlationAnalysis,
        exportData,
        fetchTime: Date.now()
      };
      
      // Cache the session
      debugSessionCache.set(args.traceId, session);
    }

    const exportTime = Date.now();
    
    try {
      let exportContent: string;
      
      switch (args.format) {
        case 'json':
          exportContent = JSON.stringify({
            ...session,
            exportTime
          }, null, 2);
          break;
          
        case 'markdown':
          exportContent = generateMarkdownExport(session);
          break;
          
        case 'claude-format': {
          const claudeExport = generateClaudeExport(session);
          exportContent = `# Debug Analysis for Trace: ${args.traceId}

${claudeExport.summary}

## Metadata
- **Trace ID**: ${claudeExport.metadata.traceId}
- **Export Time**: ${claudeExport.metadata.exportTime}
- **Log Count**: ${claudeExport.metadata.logCount}
- **Systems**: ${claudeExport.metadata.systems.join(', ')}
- **Time Range**: ${new Date(claudeExport.metadata.timeRange.start).toISOString()} to ${new Date(claudeExport.metadata.timeRange.end).toISOString()}

## Timeline
${claudeExport.timeline.map(entry => 
  `**${entry.timestamp}** [${entry.system.toUpperCase()}] ${entry.level.toUpperCase()}: ${entry.message}`
).join('\n')}

## Analysis

### Error Chains (${claudeExport.analysis.errorChains.length})
${claudeExport.analysis.errorChains.map((chain, i) =>
  `${i + 1}. **${chain.description}**\n${chain.entries.map(entry => 
    `   - ${entry.timestamp} [${entry.system}]: ${entry.message}`
  ).join('\n')}`
).join('\n\n')}

### Performance Issues (${claudeExport.analysis.performanceIssues.length})
${claudeExport.analysis.performanceIssues.map((issue, i) =>
  `${i + 1}. **${issue.issue}**\n   - Evidence: ${issue.evidence}\n   - Recommendation: ${issue.recommendation}`
).join('\n\n')}

### System Flow (${claudeExport.analysis.systemFlow.length})
${claudeExport.analysis.systemFlow.map((flow, i) =>
  `${i + 1}. **${flow.system}** (${flow.duration})\n   - Actions: ${flow.actions.join(', ')}`
).join('\n\n')}`;
          break;
        }
          
        default:
          throw new ConvexError(`Unsupported export format: ${args.format as string}`);
      }

      return {
        exportContent,
        metadata: {
          traceId: args.traceId,
          exportTime,
          logCount: session.logs.length,
          systems: [...new Set(session.logs.map(log => log.system))]
        }
      };
    } catch (error) {
      throw new ConvexError(`Export generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});

/**
 * Clears the debug session cache
 */
export const clearDebugCache = action({
  args: {
    traceId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    if (args.traceId) {
      debugSessionCache.delete(args.traceId);
    } else {
      debugSessionCache.clear();
    }
    
    return {
      success: true,
      message: args.traceId 
        ? `Cache cleared for trace: ${args.traceId}`
        : 'All debug session cache cleared'
    };
  }
});

// Helper functions

async function generateExportData(
  logs: RedisLogEntry[],
  correlationAnalysis: CorrelationAnalysis,
  traceId: string
): Promise<ExportData> {
  const structured = {
    traceId,
    logCount: logs.length,
    systems: [...new Set(logs.map(log => log.system))],
    timeRange: logs.length > 0 ? {
      start: Math.min(...logs.map(l => l.timestamp)),
      end: Math.max(...logs.map(l => l.timestamp))
    } : null,
    logs,
    analysis: correlationAnalysis
  };

  const markdown = generateMarkdownExport({
    traceId,
    logs,
    correlationAnalysis,
    exportData: { structured: {}, markdown: '' },
    fetchTime: Date.now()
  });

  return { structured, markdown };
}

function generateMarkdownExport(session: DebugSession): string {
  const { logs, correlationAnalysis, traceId } = session;
  
  return `# Debug Log Export

**Trace ID**: ${traceId}
**Export Time**: ${new Date().toISOString()}
**Log Count**: ${logs.length}
**Systems**: ${[...new Set(logs.map(log => log.system))].join(', ')}

## Timeline

${logs.map(log => 
  `- **${new Date(log.timestamp).toISOString()}** [${log.system.toUpperCase()}] ${log.level.toUpperCase()}: ${log.message}`
).join('\n')}

## Error Analysis

### Error Chains (${correlationAnalysis.errorChains.length})
${correlationAnalysis.errorChains.map((chain, i) =>
  `${i + 1}. ${chain.pattern}\n${chain.entries.map(entry => 
    `   - ${new Date(entry.timestamp).toISOString()} [${entry.system}]: ${entry.message}`
  ).join('\n')}`
).join('\n\n')}

### Performance Insights (${correlationAnalysis.performanceInsights.length})
${correlationAnalysis.performanceInsights.map((insight, i) =>
  `${i + 1}. **${insight.metric}**: ${insight.value}ms\n   ${insight.context}`
).join('\n\n')}

## System Flow
${correlationAnalysis.systemFlow.map((flow, i) =>
  `${i + 1}. ${flow.system} (${flow.duration ? `${flow.duration}ms` : 'instant'})`
).join('\n')}`;
}

function generateClaudeExport(session: DebugSession): ClaudeDebugExport {
  const { logs, correlationAnalysis, traceId } = session;
  const systems = [...new Set(logs.map(log => log.system))];
  const timeRange = logs.length > 0 ? {
    start: Math.min(...logs.map(l => l.timestamp)),
    end: Math.max(...logs.map(l => l.timestamp))
  } : { start: 0, end: 0 };

  return {
    metadata: {
      traceId,
      exportTime: new Date().toISOString(),
      logCount: logs.length,
      systems,
      timeRange
    },
    timeline: logs.map(log => ({
      timestamp: new Date(log.timestamp).toISOString(),
      system: log.system,
      level: log.level,
      message: log.message,
      context: log.context
    })),
    analysis: {
      errorChains: correlationAnalysis.errorChains.map(chain => ({
        description: chain.pattern,
        entries: chain.entries.map(entry => ({
          timestamp: new Date(entry.timestamp).toISOString(),
          system: entry.system,
          message: entry.message
        }))
      })),
      performanceIssues: correlationAnalysis.performanceInsights.map(insight => ({
        issue: insight.metric,
        evidence: `${insight.value}ms`,
        recommendation: insight.context
      })),
      systemFlow: correlationAnalysis.systemFlow.map(flow => ({
        system: flow.system,
        actions: [`Started at ${new Date(flow.timestamp).toISOString()}`],
        duration: flow.duration ? `${flow.duration}ms` : 'instant'
      }))
    },
    summary: generateSummary(logs, correlationAnalysis)
  };
}

function generateSummary(logs: RedisLogEntry[], analysis: CorrelationAnalysis): string {
  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;
  const systems = [...new Set(logs.map(l => l.system))];
  const duration = logs.length > 0 
    ? Math.max(...logs.map(l => l.timestamp)) - Math.min(...logs.map(l => l.timestamp))
    : 0;

  return `This trace contains ${logs.length} log entries across ${systems.length} systems (${systems.join(', ')}) over ${duration}ms. ` +
         `Found ${errorCount} errors, ${warnCount} warnings, ${analysis.errorChains.length} error chains, and ${analysis.performanceInsights.length} performance issues.`;
}