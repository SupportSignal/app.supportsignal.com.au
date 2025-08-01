export interface RedisLogEntry {
  id: string;
  trace_id: string;
  user_id?: string;
  system: 'browser' | 'convex' | 'worker' | 'manual';
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  stack?: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface ErrorChain {
  entries: RedisLogEntry[];
  pattern: string;
}

export interface PerformanceInsight {
  metric: string;
  value: number;
  context: string;
}

export interface SystemFlow {
  system: string;
  timestamp: number;
  duration?: number;
}

export interface CorrelationAnalysis {
  errorChains: ErrorChain[];
  performanceInsights: PerformanceInsight[];
  systemFlow: SystemFlow[];
}

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

// Session-based caching for debug interface
const DEBUG_CACHE_TTL = 300_000; // 5 minutes
const debugSessions = new Map<string, DebugSession>();

export const getCachedDebugSession = (traceId: string): DebugSession | null => {
  const cached = debugSessions.get(traceId);
  if (cached && Date.now() - cached.fetchTime < DEBUG_CACHE_TTL) {
    return cached;
  }
  return null;
};

export const setCachedDebugSession = (session: DebugSession): void => {
  debugSessions.set(session.traceId, session);
};

export const clearDebugSessionCache = (): void => {
  debugSessions.clear();
};

export const fetchLogsForTrace = async (
  traceId: string,
  systemFilter?: string[]
): Promise<DebugSession> => {
  // Check cache first
  const cached = getCachedDebugSession(traceId);
  if (cached) {
    return cached;
  }

  try {
    // Fetch logs directly from worker using client-side request
    const logs = await fetchLogsFromWorker(traceId, systemFilter);
    
    // Perform correlation analysis on client-side
    const correlationAnalysis = analyzeLogCorrelation(logs);
    
    // Generate export data
    const exportData = generateExportData(logs, correlationAnalysis, traceId);

    const session: DebugSession = {
      traceId,
      logs,
      correlationAnalysis,
      exportData,
      fetchTime: Date.now()
    };

    // Cache the session locally
    setCachedDebugSession(session);

    return session;
  } catch (error) {
    throw new Error(`Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const exportDebugSession = async (
  traceId: string,
  format: 'json' | 'markdown' | 'claude-format'
): Promise<{ exportContent: string; metadata: Record<string, unknown> }> => {
  // Import convex client dynamically to avoid SSR issues
  const { convex } = await import('@/lib/convex');
  const { api } = await import('@/lib/convex-api');
  
  try {
    const result = await convex.action(api.debugActions.exportSession, {
      traceId,
      format,
      includeAnalysis: true
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to export session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const clearDebugCache = async (traceId?: string): Promise<{ success: boolean; message: string }> => {
  // Clear local cache
  if (traceId) {
    debugSessions.delete(traceId);
  } else {
    debugSessions.clear();
  }

  return {
    success: true,
    message: traceId 
      ? `Cache cleared for trace: ${traceId}`
      : 'All debug session cache cleared'
  };
};

// Client-side log fetching function
async function fetchLogsFromWorker(traceId: string, systemFilter?: string[]): Promise<RedisLogEntry[]> {
  // Get worker URL from environment
  const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL;
  if (!workerUrl) {
    throw new Error('Log worker URL not configured. Set NEXT_PUBLIC_LOG_WORKER_URL in your environment.');
  }

  // Construct URL with trace ID
  const url = `${workerUrl}/logs?trace_id=${encodeURIComponent(traceId)}`;
  
  // Fetching logs from worker API

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Debug-Interface/1.0'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      // No logs found - return empty array
      // No logs found for this trace ID
      return [];
    }
    
    // Get error details
    let errorMessage = `${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += ` - ${errorBody}`;
      }
    } catch {
      // Ignore parsing errors
    }
    
    throw new Error(`Request to ${url} failed: ${errorMessage}`);
  }

  const result = await response.json();
  // Successfully fetched logs
  
  // Apply system filtering if provided
  const logs: RedisLogEntry[] = result.logs || [];
  const filteredLogs = systemFilter && systemFilter.length > 0
    ? logs.filter((log: RedisLogEntry) => systemFilter.includes(log.system))
    : logs;

  // Sort by timestamp (worker should already do this, but ensure)
  return filteredLogs.sort((a: RedisLogEntry, b: RedisLogEntry) => a.timestamp - b.timestamp);
}

// Client-side correlation analysis
function analyzeLogCorrelation(logs: RedisLogEntry[]): CorrelationAnalysis {
  const errorChains = analyzeErrorChains(logs);
  const performanceInsights = analyzePerformance(logs);
  const systemFlow = analyzeSystemFlow(logs);

  return {
    errorChains,
    performanceInsights,
    systemFlow
  };
}

function analyzeErrorChains(logs: RedisLogEntry[]): ErrorChain[] {
  const errorLogs = logs.filter(log => log.level === 'error');
  const chains: ErrorChain[] = [];

  if (errorLogs.length === 0) return chains;

  // Simple error chain detection - group errors by proximity in time
  let currentChain: RedisLogEntry[] = [];
  let lastErrorTime = 0;
  const CHAIN_TIME_WINDOW = 5000; // 5 seconds

  for (const errorLog of errorLogs) {
    if (currentChain.length === 0 || errorLog.timestamp - lastErrorTime < CHAIN_TIME_WINDOW) {
      currentChain.push(errorLog);
    } else {
      if (currentChain.length > 1) {
        chains.push({
          entries: [...currentChain],
          pattern: detectErrorPattern(currentChain)
        });
      }
      currentChain = [errorLog];
    }
    lastErrorTime = errorLog.timestamp;
  }

  // Add final chain if exists
  if (currentChain.length > 1) {
    chains.push({
      entries: currentChain,
      pattern: detectErrorPattern(currentChain)
    });
  }

  return chains;
}

function detectErrorPattern(errors: RedisLogEntry[]): string {
  const systems = [...new Set(errors.map(e => e.system))];
  const messages = errors.map(e => e.message);
  
  // Look for common error patterns
  if (messages.some(m => m.toLowerCase().includes('timeout'))) {
    return `Timeout cascade across ${systems.join(' → ')}`;
  }
  
  if (messages.some(m => m.toLowerCase().includes('connection'))) {
    return `Connection failure propagation in ${systems.join(', ')}`;
  }
  
  if (systems.length > 1) {
    return `Cross-system error chain: ${systems.join(' → ')}`;
  }
  
  return `${errors.length} related errors in ${systems[0]}`;
}

function analyzePerformance(logs: RedisLogEntry[]): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];
  
  if (logs.length < 2) return insights;

  // Calculate total trace duration
  const startTime = Math.min(...logs.map(l => l.timestamp));
  const endTime = Math.max(...logs.map(l => l.timestamp));
  const totalDuration = endTime - startTime;

  if (totalDuration > 5000) { // More than 5 seconds
    insights.push({
      metric: 'Total Trace Duration',
      value: totalDuration,
      context: 'Extended processing time may indicate performance bottleneck'
    });
  }

  // Analyze system-specific performance
  const systemTimes = logs.reduce((acc, log) => {
    if (!acc[log.system]) {
      acc[log.system] = { first: log.timestamp, last: log.timestamp, count: 0 };
    }
    acc[log.system].first = Math.min(acc[log.system].first, log.timestamp);
    acc[log.system].last = Math.max(acc[log.system].last, log.timestamp);
    acc[log.system].count++;
    return acc;
  }, {} as Record<string, { first: number, last: number, count: number }>);

  Object.entries(systemTimes).forEach(([system, times]) => {
    const systemDuration = times.last - times.first;
    if (systemDuration > 2000 && times.count > 1) { // System active for more than 2 seconds
      insights.push({
        metric: `${system} System Duration`,
        value: systemDuration,
        context: `${system} system was active for extended period (${times.count} log entries)`
      });
    }
  });

  return insights;
}

function analyzeSystemFlow(logs: RedisLogEntry[]): SystemFlow[] {
  const systemTimes = logs.reduce((acc, log) => {
    if (!acc[log.system]) {
      acc[log.system] = { first: log.timestamp, last: log.timestamp };
    }
    acc[log.system].first = Math.min(acc[log.system].first, log.timestamp);
    acc[log.system].last = Math.max(acc[log.system].last, log.timestamp);
    return acc;
  }, {} as Record<string, { first: number, last: number }>);

  return Object.entries(systemTimes)
    .map(([system, times]) => ({
      system,
      timestamp: times.first,
      duration: times.last - times.first
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function generateExportData(
  logs: RedisLogEntry[],
  correlationAnalysis: CorrelationAnalysis,
  traceId: string
): ExportData {
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