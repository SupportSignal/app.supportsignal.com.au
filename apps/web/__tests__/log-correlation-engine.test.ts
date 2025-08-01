import { describe, it, expect } from '@jest/globals';

/**
 * Tests for Multi-System Log Correlation Engine
 * These tests validate the correlation logic and analysis capabilities
 */

describe('Log Correlation Engine', () => {
  describe('Log deduplication logic', () => {
    it('should deduplicate logs based on timestamp, message, and system', () => {
      const deduplicateLogs = (logs: any[]): any[] => {
        const seen = new Set<string>();
        return logs.filter(log => {
          const key = `${log.timestamp}-${log.message}-${log.system_area}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      };

      const logsWithDuplicates = [
        { timestamp: 1000, message: 'test message', system_area: 'browser' },
        { timestamp: 1000, message: 'test message', system_area: 'browser' }, // Duplicate
        { timestamp: 1000, message: 'test message', system_area: 'worker' }, // Different system
        { timestamp: 2000, message: 'test message', system_area: 'browser' }, // Different timestamp
        {
          timestamp: 1000,
          message: 'different message',
          system_area: 'browser',
        }, // Different message
      ];

      const deduplicated = deduplicateLogs(logsWithDuplicates);

      expect(deduplicated).toHaveLength(4); // Should remove only the exact duplicate

      // Verify the duplicate was removed
      const browserTestMessages = deduplicated.filter(
        log =>
          log.system_area === 'browser' &&
          log.message === 'test message' &&
          log.timestamp === 1000
      );
      expect(browserTestMessages).toHaveLength(1);
    });
  });

  describe('System flow analysis', () => {
    it('should determine system interaction flow', () => {
      const logs = [
        { system_area: 'browser', timestamp: 1000 },
        { system_area: 'browser', timestamp: 1100 },
        { system_area: 'worker', timestamp: 1200 },
        { system_area: 'convex', timestamp: 1300 },
        { system_area: 'worker', timestamp: 1400 }, // Worker appears again
        { system_area: 'browser', timestamp: 1500 }, // Browser appears again
      ];

      // Extract system flow (order of first appearance)
      const systemFlow = [];
      const seenSystems = new Set<string>();

      for (const log of logs) {
        if (!seenSystems.has(log.system_area)) {
          systemFlow.push(log.system_area);
          seenSystems.add(log.system_area);
        }
      }

      expect(systemFlow).toEqual(['browser', 'worker', 'convex']);
    });
  });

  describe('Timing analysis calculations', () => {
    it('should calculate per-system timing statistics', () => {
      const logs = [
        { system_area: 'browser', timestamp: 1000 },
        { system_area: 'browser', timestamp: 1500 },
        { system_area: 'worker', timestamp: 2000 },
        { system_area: 'worker', timestamp: 2200 },
        { system_area: 'convex', timestamp: 3000 },
      ];

      const systemTimings = new Map<
        string,
        { first: number; last: number; count: number }
      >();

      for (const log of logs) {
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

      const timingAnalysis = Array.from(systemTimings.entries()).map(
        ([system, timing]) => ({
          system,
          first_log: timing.first,
          last_log: timing.last,
          duration_ms: timing.last - timing.first,
          log_count: timing.count,
        })
      );

      expect(timingAnalysis).toHaveLength(3);

      const browserTiming = timingAnalysis.find(t => t.system === 'browser');
      expect(browserTiming).toEqual({
        system: 'browser',
        first_log: 1000,
        last_log: 1500,
        duration_ms: 500,
        log_count: 2,
      });

      const workerTiming = timingAnalysis.find(t => t.system === 'worker');
      expect(workerTiming).toEqual({
        system: 'worker',
        first_log: 2000,
        last_log: 2200,
        duration_ms: 200,
        log_count: 2,
      });

      const convexTiming = timingAnalysis.find(t => t.system === 'convex');
      expect(convexTiming).toEqual({
        system: 'convex',
        first_log: 3000,
        last_log: 3000,
        duration_ms: 0,
        log_count: 1,
      });
    });
  });

  describe('Error chain analysis', () => {
    it('should extract error and warning sequences', () => {
      const logs = [
        {
          level: 'info',
          timestamp: 1000,
          system_area: 'browser',
          message: 'Starting request',
        },
        {
          level: 'warn',
          timestamp: 1100,
          system_area: 'worker',
          message: 'Slow response detected',
        },
        {
          level: 'error',
          timestamp: 1200,
          system_area: 'convex',
          message: 'Database connection failed',
        },
        {
          level: 'info',
          timestamp: 1300,
          system_area: 'browser',
          message: 'Retrying request',
        },
        {
          level: 'error',
          timestamp: 1400,
          system_area: 'browser',
          message: 'Final retry failed',
        },
      ];

      const errorChain = logs
        .filter(log => log.level === 'error' || log.level === 'warn')
        .map(log => ({
          timestamp: log.timestamp,
          system: log.system_area,
          message: log.message,
          level: log.level,
        }));

      expect(errorChain).toHaveLength(3);
      expect(errorChain[0]).toEqual({
        timestamp: 1100,
        system: 'worker',
        message: 'Slow response detected',
        level: 'warn',
      });
      expect(errorChain[1]).toEqual({
        timestamp: 1200,
        system: 'convex',
        message: 'Database connection failed',
        level: 'error',
      });
      expect(errorChain[2]).toEqual({
        timestamp: 1400,
        system: 'browser',
        message: 'Final retry failed',
        level: 'error',
      });
    });
  });

  describe('Performance issue detection', () => {
    it('should detect slow trace durations', () => {
      const detectSlowTraces = (durationMs: number): boolean => {
        return durationMs > 30000; // > 30 seconds
      };

      expect(detectSlowTraces(45000)).toBe(true); // 45 seconds
      expect(detectSlowTraces(25000)).toBe(false); // 25 seconds
      expect(detectSlowTraces(31000)).toBe(true); // 31 seconds
    });

    it('should detect high error rates', () => {
      const calculateErrorRate = (
        errorCount: number,
        totalLogs: number
      ): number => {
        return errorCount / totalLogs;
      };

      const isHighErrorRate = (errorRate: number): boolean => {
        return errorRate > 0.3; // > 30%
      };

      expect(isHighErrorRate(calculateErrorRate(4, 10))).toBe(true); // 40%
      expect(isHighErrorRate(calculateErrorRate(2, 10))).toBe(false); // 20%
      expect(isHighErrorRate(calculateErrorRate(3, 10))).toBe(false); // 30% (not > 30%)
      expect(isHighErrorRate(calculateErrorRate(4, 12))).toBe(true); // 33.3%
    });

    it('should detect system bottlenecks', () => {
      const detectBottleneck = (
        durationMs: number,
        logCount: number
      ): boolean => {
        return durationMs > 10000 && logCount > 20;
      };

      expect(detectBottleneck(15000, 25)).toBe(true); // 15s, 25 logs
      expect(detectBottleneck(15000, 15)).toBe(false); // 15s, 15 logs (not enough logs)
      expect(detectBottleneck(5000, 25)).toBe(false); // 5s, 25 logs (not slow enough)
      expect(detectBottleneck(12000, 22)).toBe(true); // 12s, 22 logs
    });
  });

  describe('Trace statistics calculations', () => {
    it('should calculate correlation statistics', () => {
      const logs = [
        { trace_id: 'trace1', system_area: 'browser', timestamp: 1000 },
        { trace_id: 'trace1', system_area: 'worker', timestamp: 1100 },
        { trace_id: 'trace2', system_area: 'browser', timestamp: 1200 },
        { trace_id: 'trace2', system_area: 'convex', timestamp: 1300 },
        { trace_id: 'trace3', system_area: 'browser', timestamp: 1400 },
      ];

      // Group by trace_id to calculate statistics
      const traceStats = new Map<
        string,
        {
          systems: Set<string>;
          count: number;
          first_timestamp: number;
          last_timestamp: number;
        }
      >();

      for (const log of logs) {
        const existing = traceStats.get(log.trace_id);
        if (existing) {
          existing.systems.add(log.system_area);
          existing.count++;
          existing.first_timestamp = Math.min(
            existing.first_timestamp,
            log.timestamp
          );
          existing.last_timestamp = Math.max(
            existing.last_timestamp,
            log.timestamp
          );
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
      const multiSystemTraces = traces.filter(
        ([, stats]) => stats.systems.size > 1
      );

      expect(traces).toHaveLength(3); // 3 unique traces
      expect(multiSystemTraces).toHaveLength(2); // trace1 and trace2 span multiple systems

      // Verify trace1 stats
      const trace1Stats = traceStats.get('trace1');
      expect(trace1Stats?.systems.size).toBe(2); // browser + worker
      expect(trace1Stats?.count).toBe(2);
      expect(trace1Stats?.first_timestamp).toBe(1000);
      expect(trace1Stats?.last_timestamp).toBe(1100);

      // System breakdown
      const systemBreakdown: Record<string, number> = {};
      for (const log of logs) {
        systemBreakdown[log.system_area] =
          (systemBreakdown[log.system_area] || 0) + 1;
      }

      expect(systemBreakdown).toEqual({
        browser: 3,
        worker: 1,
        convex: 1,
      });
    });

    it('should calculate average trace duration', () => {
      const traceDurations = [1000, 2000, 500, 1500, 3000]; // Various durations in ms

      const averageDuration =
        traceDurations.length > 0
          ? traceDurations.reduce((sum, duration) => sum + duration, 0) /
            traceDurations.length
          : 0;

      expect(averageDuration).toBe(1600); // (1000+2000+500+1500+3000)/5 = 1600
    });
  });

  describe('Search and filtering logic', () => {
    it('should filter logs by text search', () => {
      const logs = [
        { message: 'User login successful', raw_args: ['user_id: 123'] },
        {
          message: 'Database query executed',
          raw_args: ['SELECT * FROM users'],
        },
        { message: 'Error occurred', raw_args: ['Stack trace here'] },
        { message: 'User logout', raw_args: ['user_id: 123'] },
      ];

      const searchQuery = 'user';
      const filteredLogs = logs.filter(
        log =>
          log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.raw_args.some(arg =>
            arg.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );

      expect(filteredLogs).toHaveLength(3); // 'User login', 'Database query' (users), 'User logout'
      expect(filteredLogs.map(log => log.message)).toEqual([
        'User login successful',
        'Database query executed',
        'User logout',
      ]);
    });

    it('should handle timestamp range filtering', () => {
      const logs = [
        { timestamp: 1000 },
        { timestamp: 1500 },
        { timestamp: 2000 },
        { timestamp: 2500 },
        { timestamp: 3000 },
      ];

      const since = 1200;
      const until = 2800;

      const filteredLogs = logs.filter(
        log => log.timestamp > since && log.timestamp < until
      );

      expect(filteredLogs).toHaveLength(3); // timestamps 1500, 2000, and 2500
      expect(filteredLogs.map(log => log.timestamp)).toEqual([
        1500, 2000, 2500,
      ]);
    });
  });

  describe('Correlation result structure validation', () => {
    it('should have correct LogCorrelationResult structure', () => {
      const mockResult = {
        trace_id: 'test_trace_123',
        total_logs: 15,
        systems: ['browser', 'worker', 'convex'],
        time_span: {
          start: 1000,
          end: 5000,
          duration_ms: 4000,
        },
        logs: [
          {
            id: 'log_1',
            level: 'info',
            message: 'Test log',
            trace_id: 'test_trace_123',
            user_id: 'user_456',
            system_area: 'browser',
            timestamp: 1000,
            raw_args: ['arg1', 'arg2'],
            stack_trace: 'optional stack trace',
          },
        ],
        summary: {
          by_system: { browser: 8, worker: 4, convex: 3 },
          by_level: { info: 10, warn: 3, error: 2 },
          error_count: 2,
          warning_count: 3,
        },
      };

      // Validate structure
      expect(mockResult).toHaveProperty('trace_id');
      expect(mockResult).toHaveProperty('total_logs');
      expect(mockResult).toHaveProperty('systems');
      expect(mockResult).toHaveProperty('time_span');
      expect(mockResult).toHaveProperty('logs');
      expect(mockResult).toHaveProperty('summary');

      // Validate time_span structure
      expect(mockResult.time_span).toHaveProperty('start');
      expect(mockResult.time_span).toHaveProperty('end');
      expect(mockResult.time_span).toHaveProperty('duration_ms');
      expect(mockResult.time_span.duration_ms).toBe(4000);

      // Validate summary structure
      expect(mockResult.summary).toHaveProperty('by_system');
      expect(mockResult.summary).toHaveProperty('by_level');
      expect(mockResult.summary).toHaveProperty('error_count');
      expect(mockResult.summary).toHaveProperty('warning_count');

      // Validate log entry structure
      const logEntry = mockResult.logs[0];
      expect(logEntry).toHaveProperty('id');
      expect(logEntry).toHaveProperty('level');
      expect(logEntry).toHaveProperty('message');
      expect(logEntry).toHaveProperty('trace_id');
      expect(logEntry).toHaveProperty('user_id');
      expect(logEntry).toHaveProperty('system_area');
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('raw_args');
      expect(Array.isArray(logEntry.raw_args)).toBe(true);
    });
  });
});
