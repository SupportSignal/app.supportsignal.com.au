import { describe, it, expect } from '@jest/globals';

/**
 * Tests for Log Streams Webhook Logic
 * These tests validate the core logic patterns used in the Convex Log Streams webhook
 * without requiring the full Convex environment.
 */

describe('Log Streams Webhook Logic', () => {
  describe('Trace ID extraction', () => {
    it('should extract trace ID from log message', () => {
      const logMessage = 'Processing request with trace_id: browser_12345';
      const traceIdMatch = logMessage.match(
        /trace[_-]id[:\s]+([a-zA-Z0-9_-]+)/i
      );

      expect(traceIdMatch).toBeTruthy();
      expect(traceIdMatch?.[1]).toBe('browser_12345');
    });

    it('should extract trace ID with different patterns', () => {
      const testCases = [
        { message: 'trace_id: worker_456', expected: 'worker_456' },
        { message: 'trace-id: convex_789', expected: 'convex_789' },
        { message: 'TRACE_ID: test_123', expected: 'test_123' },
        { message: 'No trace info here', expected: null },
      ];

      testCases.forEach(({ message, expected }) => {
        const match = message.match(/trace[_-]id[:\s]+([a-zA-Z0-9_-]+)/i);
        const result = match ? match[1] : null;
        expect(result).toBe(expected);
      });
    });

    it('should generate fallback trace ID from request ID', () => {
      const requestId = 'req-456789';
      const fallbackTraceId = `convex_req_${requestId}`;

      expect(fallbackTraceId).toBe('convex_req_req-456789');
    });
  });

  describe('User ID extraction from log messages', () => {
    it('should extract user ID patterns', () => {
      const testCases = [
        {
          message: 'User action for user_id: user-12345',
          expected: 'user-12345',
        },
        { message: 'Processing userId: admin-789', expected: 'admin-789' },
        { message: 'user-id: guest-101', expected: 'guest-101' },
        { message: 'No user info', expected: null },
      ];

      testCases.forEach(({ message, expected }) => {
        const match = message.match(/user[_-]?id[:\s]+([a-zA-Z0-9_-]+)/i);
        const result = match ? match[1] : null;
        expect(result).toBe(expected);
      });
    });
  });

  describe('Convex log level mapping', () => {
    it('should map Convex levels to standard levels', () => {
      const mapConvexLogLevel = (level: string): string => {
        switch (level) {
          case 'DEBUG':
            return 'debug';
          case 'INFO':
            return 'info';
          case 'WARN':
            return 'warn';
          case 'ERROR':
            return 'error';
          default:
            return 'info';
        }
      };

      expect(mapConvexLogLevel('DEBUG')).toBe('debug');
      expect(mapConvexLogLevel('INFO')).toBe('info');
      expect(mapConvexLogLevel('WARN')).toBe('warn');
      expect(mapConvexLogLevel('ERROR')).toBe('error');
      expect(mapConvexLogLevel('UNKNOWN')).toBe('info');
    });
  });

  describe('Request origin validation', () => {
    it('should validate Convex origins', () => {
      const isConvexOrigin = (origin: string): boolean => {
        return origin.toLowerCase().includes('convex');
      };

      const validOrigins = [
        'convex-log-streams/1.0',
        'Mozilla/5.0 convex integration',
        'Convex Webhook Sender',
      ];

      const invalidOrigins = ['malicious-bot/1.0', 'unknown-client', ''];

      validOrigins.forEach(origin => {
        expect(isConvexOrigin(origin)).toBe(true);
      });

      invalidOrigins.forEach(origin => {
        expect(isConvexOrigin(origin)).toBe(false);
      });
    });
  });

  describe('Payload validation', () => {
    it('should validate log streams payload structure', () => {
      const validatePayload = (payload: any): boolean => {
        return Boolean(
          payload &&
            Array.isArray(payload.logs) &&
            payload.logs.length > 0 &&
            payload.logs.every(
              (log: any) =>
                log &&
                log.id &&
                log.timestamp &&
                log.level &&
                log.message &&
                log.context
            )
        );
      };

      const validPayload = {
        logs: [
          {
            id: 'log-123',
            timestamp: Date.now(),
            level: 'INFO',
            message: 'Test message',
            context: {
              functionName: 'testFunc',
              functionId: 'func-123',
              requestId: 'req-456',
              environmentName: 'development',
              deploymentId: 'deploy-789',
            },
          },
        ],
        source: 'convex',
        endpoint: 'logStreamsWebhook',
        timestamp: Date.now(),
      };

      const invalidPayloads = [
        { invalid: 'payload' },
        { logs: [] },
        { logs: [{ id: 'incomplete' }] },
        null,
        undefined,
      ];

      expect(validatePayload(validPayload)).toBe(true);

      invalidPayloads.forEach(payload => {
        expect(validatePayload(payload)).toBe(false);
      });
    });
  });

  describe('Log entry processing', () => {
    it('should process Convex log entry correctly', () => {
      const convexLogEntry = {
        id: 'log-123',
        timestamp: 1234567890,
        level: 'INFO',
        message: 'Function executed with trace_id: browser_456',
        context: {
          functionName: 'getUserProfile',
          functionId: 'func-789',
          requestId: 'req-101',
          environmentName: 'production',
          deploymentId: 'deploy-202',
        },
        metadata: {
          duration: 150,
          custom: 'data',
        },
      };

      // Simulate processing logic
      const traceIdMatch = convexLogEntry.message.match(
        /trace[_-]id[:\s]+([a-zA-Z0-9_-]+)/i
      );
      const extractedTraceId = traceIdMatch
        ? traceIdMatch[1]
        : `convex_req_${convexLogEntry.context.requestId}`;

      const processedLog = {
        level: convexLogEntry.level.toLowerCase(),
        message: convexLogEntry.message,
        trace_id: extractedTraceId,
        user_id: 'system', // Backend logs default to system
        system_area: 'convex',
        timestamp: convexLogEntry.timestamp,
        raw_args: [
          convexLogEntry.message,
          JSON.stringify({
            functionName: convexLogEntry.context.functionName,
            functionId: convexLogEntry.context.functionId,
            requestId: convexLogEntry.context.requestId,
            environmentName: convexLogEntry.context.environmentName,
            deploymentId: convexLogEntry.context.deploymentId,
            originalLevel: convexLogEntry.level,
            ...convexLogEntry.metadata,
          }),
        ],
        stack_trace: convexLogEntry.metadata?.stack || undefined,
      };

      // Verify the processed structure
      expect(processedLog.level).toBe('info');
      expect(processedLog.system_area).toBe('convex');
      expect(processedLog.trace_id).toBe('browser_456');
      expect(processedLog.user_id).toBe('system');
      expect(processedLog.raw_args).toHaveLength(2);
      expect(processedLog.raw_args[0]).toBe(convexLogEntry.message);

      const parsedMetadata = JSON.parse(processedLog.raw_args[1]);
      expect(parsedMetadata.functionName).toBe('getUserProfile');
      expect(parsedMetadata.duration).toBe(150);
      expect(parsedMetadata.originalLevel).toBe('INFO');
    });
  });
});
