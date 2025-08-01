import { ConvexError } from 'convex/values';

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

/**
 * Fetches logs from Redis via the log ingestion Worker API
 */
export async function fetchLogsFromRedis(
  traceId: string,
  systemFilter?: string[]
): Promise<RedisLogEntry[]> {
  // Get Worker endpoint from environment
  const workerEndpoint = process.env.LOG_WORKER_URL;
  if (!workerEndpoint) {
    throw new ConvexError('Log worker URL not configured');
  }

  // Construct fetch URL - worker expects trace_id as query parameter
  const url = `${workerEndpoint}/logs?trace_id=${encodeURIComponent(traceId)}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Convex-Debug-Interface/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return []; // No logs found for this trace ID
      }
      
      // Get detailed error information for debugging
      let errorDetails = `${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorDetails += ` - ${errorBody}`;
        }
      } catch {
        // Ignore parsing errors
      }
      
      throw new ConvexError(`Request to ${url} forbidden - ${errorDetails}`);
    }

    const responseData = await response.json();
    
    // Worker returns { trace_id, logs, count, retrieved_at }
    const logs: RedisLogEntry[] = responseData.logs || [];
    
    // Apply system filtering if provided
    const filteredLogs = systemFilter && systemFilter.length > 0
      ? logs.filter(log => systemFilter.includes(log.system))
      : logs;

    // Sort by timestamp (worker already sorts, but double-check)
    return filteredLogs.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    if (error instanceof ConvexError) {
      throw error;
    }
    throw new ConvexError(`Redis log fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyzes logs for correlation patterns
 */
export function analyzeLogCorrelation(logs: RedisLogEntry[]): CorrelationAnalysis {
  const errorChains = analyzeErrorChains(logs);
  const performanceInsights = analyzePerformance(logs);
  const systemFlow = analyzeSystemFlow(logs);

  return {
    errorChains,
    performanceInsights,
    systemFlow
  };
}

/**
 * Identifies error chains across system boundaries
 */
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

/**
 * Detects error patterns based on error messages and systems
 */
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

/**
 * Analyzes performance insights from log timing
 */
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

/**
 * Analyzes system flow and interaction patterns
 */
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