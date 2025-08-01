// Upstash Redis client for log storage with TTL management

import type { RedisLogEntry } from './types';

export class RedisClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    // Validate required configuration
    if (!baseUrl || baseUrl.trim() === '') {
      throw new Error('Redis base URL is required and cannot be empty');
    }
    if (!token || token.trim() === '') {
      throw new Error('Redis token is required and cannot be empty');
    }
    
    // Validate URL format
    try {
      new URL(baseUrl);
    } catch {
      throw new Error('Redis base URL must be a valid URL');
    }
    
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = token;
  }

  private async request(command: string[]): Promise<any> {
    let response: Response | undefined;
    
    try {
      response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
    } catch (error) {
      throw new Error(`Redis request failed: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!response) {
      throw new Error('Redis request failed: No response received');
    }

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    if (data.error) {
      throw new Error(`Redis error: ${data.error}`);
    }

    return data.result;
  }

  async storeLogEntry(entry: RedisLogEntry): Promise<void> {
    const key = `logs:${entry.trace_id}`;
    const serializedEntry = JSON.stringify(entry);
    
    // Use pipeline for atomic operations
    await this.pipeline([
      ['LPUSH', key, serializedEntry],
      ['EXPIRE', key, '3600'], // 1 hour TTL
    ]);
  }

  async getLogsByTraceId(traceId: string): Promise<RedisLogEntry[]> {
    const key = `logs:${traceId}`;
    const entries = await this.request(['LRANGE', key, '0', '-1']);
    
    return entries.map((entry: string) => JSON.parse(entry));
  }

  async getTraceCount(traceId: string): Promise<number> {
    const key = `logs:${traceId}`;
    return await this.request(['LLEN', key]);
  }

  async pipeline(commands: string[][]): Promise<any[]> {
    let response: Response | undefined;
    
    try {
      response = await fetch(`${this.baseUrl}/pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      });
    } catch (error) {
      throw new Error(`Redis pipeline failed: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!response) {
      throw new Error('Redis pipeline failed: No response received');
    }

    if (!response.ok) {
      throw new Error(`Redis pipeline failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Check for errors in pipeline results
    (data as any).forEach((result: any, index: number) => {
      if (result.error) {
        throw new Error(`Redis pipeline command ${index} failed: ${result.error}`);
      }
    });

    return (data as any).map((result: any) => result.result);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.request(['PING']);
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  // Cleanup expired keys (not needed with TTL, but useful for monitoring)
  async getActiveTraces(): Promise<string[]> {
    const keys = await this.request(['KEYS', 'logs:*']);
    return keys
      .filter((key: string) => key.startsWith('logs:'))
      .map((key: string) => key.replace('logs:', ''));
  }

  async clearAllLogs(): Promise<{ deleted: number; message: string }> {
    try {
      // Get all log keys
      const keys = await this.request(['KEYS', 'logs:*']);
      
      if (!keys || keys.length === 0) {
        return { deleted: 0, message: 'No logs found to delete' };
      }

      // Delete all log keys in batch
      const deleteCommands = keys.map((key: string) => ['DEL', key]);
      const results = await this.pipeline(deleteCommands);
      
      // Count successful deletions
      const deleted = results.reduce((sum: number, result: number) => sum + result, 0);
      
      return { 
        deleted, 
        message: `Successfully deleted ${deleted} log collections` 
      };
    } catch (error) {
      throw new Error(`Failed to clear logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearLogsByTraceId(traceId: string): Promise<{ deleted: boolean; message: string }> {
    try {
      const key = `logs:${traceId}`;
      const result = await this.request(['DEL', key]);
      
      if (result === 1) {
        return { deleted: true, message: `Deleted logs for trace: ${traceId}` };
      } else {
        return { deleted: false, message: `No logs found for trace: ${traceId}` };
      }
    } catch (error) {
      throw new Error(`Failed to clear trace logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentTraces(limit: number = 10): Promise<Array<{
    id: string;
    timestamp: number;
    logCount: number;
    systems: string[];
    hasErrors: boolean;
  }>> {
    try {
      // Get all active trace IDs
      const traceIds = await this.getActiveTraces();
      
      if (traceIds.length === 0) {
        return [];
      }

      // Get metadata for each trace in parallel
      const tracePromises = traceIds.slice(0, Math.min(limit * 2, 50)) // Get more than needed, then filter
        .map(async (traceId) => {
          try {
            const key = `logs:${traceId}`;
            // Get the most recent log entry and total count
            const [firstEntry, logCount] = await Promise.all([
              this.request(['LINDEX', key, '0']), // Most recent (LPUSH adds to front)
              this.request(['LLEN', key])
            ]);

            if (!firstEntry || logCount === 0) {
              return null;
            }

            const parsed: RedisLogEntry = JSON.parse(firstEntry);
            
            // Get a sample of logs to determine systems and errors
            const sampleLogs = await this.request(['LRANGE', key, '0', Math.min(9, logCount - 1).toString()]);
            const parsedLogs: RedisLogEntry[] = sampleLogs.map((log: string) => JSON.parse(log));
            
            const systems = [...new Set(parsedLogs.map(log => log.system))];
            const hasErrors = parsedLogs.some(log => log.level === 'error');

            return {
              id: traceId,
              timestamp: parsed.timestamp,
              logCount,
              systems,
              hasErrors
            };
          } catch (error) {
            // Skip traces that can't be processed
            return null;
          }
        });

      const traces = (await Promise.all(tracePromises))
        .filter((trace): trace is NonNullable<typeof trace> => trace !== null)
        .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
        .slice(0, limit);

      return traces;
    } catch (error) {
      throw new Error(`Failed to get recent traces: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}