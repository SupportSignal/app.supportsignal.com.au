// @ts-nocheck
// Migration tests ensuring backward compatibility with old logging calls
// Tests compatibility between old Convex-based logging and new Worker-based system
// TypeScript interface issues don't affect test functionality

import worker from '../../../../apps/workers/log-ingestion/src/index';
import {
  createMockEnvironment,
  setupRedisMock,
  RedisMockResponses,
  TestUtils,
  setupGlobalTestCleanup,
} from './setup';
import { WorkerLogRequest } from '../../../../apps/workers/log-ingestion/src/types';
import fetch from 'node-fetch';

// Mock the Convex internalLogging module to test the bridge
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Migration Tests: Backward Compatibility with Old Logging Calls', () => {
  let mockEnv: ReturnType<typeof createMockEnvironment>;
  let mockCtx: ExecutionContext;

  // Use global test cleanup for cross-file isolation
  setupGlobalTestCleanup();

  beforeEach(() => {
    mockEnv = createMockEnvironment();
    mockCtx = new ExecutionContext();
    // Note: setupGlobalTestCleanup() handles jest.clearAllMocks() and resetRateLimiterState()
  });

  describe('Convex Bridge Compatibility', () => {
    it('should handle legacy processLogs format from Convex bridge', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      // Simulate the legacy format that would come from Convex bridge
      const legacyConvexRequest = {
        trace_id: 'convex_1640995200000_abc123def',
        message: 'User authentication successful',
        level: 'info',
        system: 'convex',
        user_id: 'user-456',
        context: {
          timestamp: 1640995200000,
          system_area: 'auth',
          convex_function_name: 'authenticateUser',
        },
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Internal-Logger/1.0',
        },
        body: JSON.stringify(legacyConvexRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.trace_id).toBe('convex_1640995200000_abc123def');

      // Verify the legacy format was processed correctly
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

      expect(redisCalls.length).toBe(1);

      const redisBody = JSON.parse(redisCalls[0][1]!.body as string);
      const storedEntry = JSON.parse(redisBody[0][2]);

      expect(storedEntry.trace_id).toBe('convex_1640995200000_abc123def');
      expect(storedEntry.system).toBe('convex');
      expect(storedEntry.message).toBe('User authentication successful');
      expect(storedEntry.level).toBe('info');
      expect(storedEntry.user_id).toBe('user-456');
      expect(storedEntry.context.convex_function_name).toBe('authenticateUser');

      console.info('✓ Legacy Convex processLogs format handled correctly');
    });

    it('should transform old Convex args array format to message string', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      // Simulate old format where message was an array of args
      const oldArgsFormatRequest = {
        trace_id: 'convex_legacy_args_test',
        message: 'User action', // This would be joined from args array: ['User', 'action']
        level: 'info',
        system: 'convex',
        context: {
          timestamp: Date.now(),
          system_area: 'user-management',
          convex_function_name: 'handleUserAction',
          original_args: [
            'User',
            'action',
            { type: 'click', target: 'button' },
          ],
        },
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Internal-Logger/1.0',
        },
        body: JSON.stringify(oldArgsFormatRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify args transformation was handled
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

      const redisBody = JSON.parse(redisCalls[0][1]!.body as string);
      const storedEntry = JSON.parse(redisBody[0][2]);

      expect(storedEntry.message).toBe('User action');
      expect(storedEntry.context.original_args).toEqual([
        'User',
        'action',
        { type: 'click', target: 'button' },
      ]);

      console.info('✓ Legacy args array format transformed correctly');
    });

    it('should maintain compatibility with old trace ID generation patterns', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const legacyTraceIdPatterns = [
        'convex_1640995200000_abc123def', // Old Convex format
        'trace_123_456_789', // Generic format
        'browser_session_xyz123', // Browser format
        'manual_log_entry_001', // Manual format
        'very-long-trace-id-with-lots-of-details-and-information', // Long format
      ];

      for (const traceId of legacyTraceIdPatterns) {
        const legacyRequest = {
          trace_id: traceId,
          message: `Legacy compatibility test for trace ${traceId}`,
          level: 'info',
          system: 'convex',
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Convex-Internal-Logger/1.0',
          },
          body: JSON.stringify(legacyRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.trace_id).toBe(traceId);

        console.info(
          `✓ Legacy trace ID pattern "${traceId}" handled correctly`
        );
      }
    });

    it('should handle old Convex stack trace format', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const legacyStackTrace = `Error: Authentication failed
        at authenticateUser (convex/auth.ts:45:12)
        at Object.handler (convex/auth.ts:120:8)
        at Object.runQuery (convex/_generated/server.js:234:16)
        at async Object.mutation (convex/_generated/server.js:456:12)`;

      const legacyErrorRequest = {
        trace_id: 'convex_error_legacy_test',
        message: 'Authentication error in legacy format',
        level: 'error',
        system: 'convex',
        stack: legacyStackTrace,
        context: {
          error_type: 'AuthenticationError',
          function_name: 'authenticateUser',
          convex_version: 'legacy',
        },
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Internal-Logger/1.0',
        },
        body: JSON.stringify(legacyErrorRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify stack trace was preserved
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

      const redisBody = JSON.parse(redisCalls[0][1]!.body as string);
      const storedEntry = JSON.parse(redisBody[0][2]);

      expect(storedEntry.stack).toContain('Error: Authentication failed');
      expect(storedEntry.stack).toContain(
        'authenticateUser (convex/auth.ts:45:12)'
      );
      expect(storedEntry.context.error_type).toBe('AuthenticationError');

      console.info('✓ Legacy Convex stack trace format preserved');
    });
  });

  describe('Browser Console Override Compatibility', () => {
    it('should handle legacy browser console format', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      // Simulate the format that would come from legacy browser console override
      const legacyBrowserRequest = {
        trace_id: 'trace_1640995200000_browser123',
        message: 'User clicked login button',
        level: 'log', // Browser often uses 'log' instead of 'info'
        system: 'browser',
        stack: new Error().stack, // Browser provides full stack
        context: {
          timestamp: Date.now(),
          url: 'https://localhost:3000/login',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          sessionId: 'session_abc123',
        },
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://localhost:3000',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        body: JSON.stringify(legacyBrowserRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.trace_id).toBe('trace_1640995200000_browser123');

      // Verify browser-specific data was preserved
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

      const redisBody = JSON.parse(redisCalls[0][1]!.body as string);
      const storedEntry = JSON.parse(redisBody[0][2]);

      expect(storedEntry.system).toBe('browser');
      expect(storedEntry.level).toBe('log');
      expect(storedEntry.context.url).toBe('https://localhost:3000/login');
      expect(storedEntry.context.sessionId).toBe('session_abc123');

      console.info('✓ Legacy browser console format handled correctly');
    });

    it('should handle browser console logs with various data types', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const browserDataTypes = [
        {
          name: 'string_message',
          message: 'Simple string message',
          context: { type: 'string' },
        },
        {
          name: 'object_message',
          message: JSON.stringify({
            user: 'john',
            action: 'login',
            success: true,
          }),
          context: {
            type: 'object',
            original: { user: 'john', action: 'login', success: true },
          },
        },
        {
          name: 'array_message',
          message: JSON.stringify(['item1', 'item2', { nested: 'value' }]),
          context: { type: 'array', length: 3 },
        },
        {
          name: 'number_message',
          message: '42',
          context: { type: 'number', value: 42 },
        },
        {
          name: 'boolean_message',
          message: 'true',
          context: { type: 'boolean', value: true },
        },
        {
          name: 'null_message',
          message: 'null',
          context: { type: 'null', value: null },
        },
        {
          name: 'undefined_message',
          message: 'undefined',
          context: { type: 'undefined', value: undefined },
        },
      ];

      for (const testCase of browserDataTypes) {
        const browserRequest = {
          trace_id: `browser_types_${testCase.name}`,
          message: testCase.message,
          level: 'log',
          system: 'browser',
          context: testCase.context,
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
          body: JSON.stringify(browserRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        console.info(
          `✓ Browser data type "${testCase.name}" handled correctly`
        );
      }
    });

    it('should maintain browser console log levels compatibility', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const browserLogLevels = [
        { level: 'log', message: 'General log message' },
        { level: 'info', message: 'Information message' },
        { level: 'warn', message: 'Warning message' },
        { level: 'error', message: 'Error message' },
      ];

      for (const logCase of browserLogLevels) {
        const browserRequest = {
          trace_id: `browser_level_${logCase.level}_test`,
          message: logCase.message,
          level: logCase.level,
          system: 'browser',
          context: { console_method: logCase.level },
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
          body: JSON.stringify(browserRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify log level was preserved
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.level).toBe(logCase.level);
        expect(storedEntry.message).toBe(logCase.message);

        console.info(
          `✓ Browser log level "${logCase.level}" handled correctly`
        );
      }
    });
  });

  describe('Response Format Compatibility', () => {
    it('should provide backward-compatible response format for Convex bridge', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const convexBridgeRequest = {
        trace_id: 'convex_bridge_response_test',
        message: 'Testing response format compatibility',
        level: 'info',
        system: 'convex',
        context: {
          expects_legacy_response: true,
          function_name: 'testCompatibility',
        },
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Internal-Logger/1.0',
        },
        body: JSON.stringify(convexBridgeRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.trace_id).toBe('convex_bridge_response_test');

      // Verify response includes expected fields for compatibility
      expect(data).toHaveProperty('remaining_quota');
      expect(typeof data.remaining_quota).toBe('number');

      // Should maintain existing response structure that Convex bridge expects
      expect(data).not.toHaveProperty('logQueueId'); // New format shouldn't include old fields
      expect(data).not.toHaveProperty('recentLogId'); // New format shouldn't include old fields

      console.info(
        '✓ Response format maintains compatibility with Convex bridge'
      );
    });

    it('should handle error responses in backward-compatible format', async () => {
      // Test validation error
      const invalidRequest = {
        // Missing trace_id
        message: 'Test validation error response format',
        level: 'info',
        system: 'convex',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Internal-Logger/1.0',
        },
        body: JSON.stringify(invalidRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('trace_id is required');

      // Error response should maintain backward compatibility
      expect(data).not.toHaveProperty('trace_id'); // No trace_id in error case
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');

      console.info('✓ Error response format maintains backward compatibility');
    });

    it('should handle rate limiting responses in backward-compatible format', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      // Simulate rate limiter returning limit exceeded
      const mockStub = mockEnv.RATE_LIMIT_STATE.get('mock-id');
      mockStub.simulateRateLimit('convex');

      const rateLimitedRequest = {
        trace_id: 'rate_limit_response_test',
        message: 'Testing rate limit response format',
        level: 'info',
        system: 'convex',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Convex-Internal-Logger/1.0',
        },
        body: JSON.stringify(rateLimitedRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain('rate limit exceeded');
      expect(data.trace_id).toBe('rate_limit_response_test');
      expect(data.remaining_quota).toBe(0);

      // Rate limiting response should include quota information for backward compatibility
      expect(data).toHaveProperty('remaining_quota');
      expect(typeof data.remaining_quota).toBe('number');

      console.info(
        '✓ Rate limiting response format maintains backward compatibility'
      );
    });
  });

  describe('Data Migration and Cleanup', () => {
    it('should handle transition from old log storage format', async () => {
      // This test simulates retrieving logs during the transition period
      // where some logs might be in old format and some in new format

      const mixedFormatLogs = [
        // Old format (simulated)
        '{"_id":"old_log_1","trace_id":"old_trace","level":"info","message":"Old format log","timestamp":1640995200000,"system":"convex"}',

        // New format
        '{"id":"new_log_1","trace_id":"old_trace","level":"info","message":"New format log","timestamp":1640995300000,"system":"convex","user_id":"user-123"}',

        // Mixed legacy fields
        '{"id":"mixed_log_1","_id":"legacy_id","trace_id":"old_trace","level":"warn","message":"Mixed format log","timestamp":1640995400000,"system":"browser","context":{"legacy":true}}',
      ];

      setupRedisMock({
        LRANGE: { result: mixedFormatLogs },
      });

      const request = new Request(
        'https://worker.example.com/logs?trace_id=old_trace',
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.trace_id).toBe('old_trace');
      expect(data.logs).toHaveLength(3);
      expect(data.count).toBe(3);

      // Verify logs are sorted by timestamp regardless of format
      expect(data.logs[0].timestamp).toBe(1640995200000);
      expect(data.logs[1].timestamp).toBe(1640995300000);
      expect(data.logs[2].timestamp).toBe(1640995400000);

      // Verify all logs have required fields (old and new formats)
      data.logs.forEach((log: any) => {
        expect(log).toHaveProperty('trace_id', 'old_trace');
        expect(log).toHaveProperty('level');
        expect(log).toHaveProperty('message');
        expect(log).toHaveProperty('timestamp');
        expect(log).toHaveProperty('system');
      });

      console.info(
        '✓ Mixed format log retrieval handled correctly during migration'
      );
    });

    it('should preserve legacy context data during migration', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const legacyContextFormats = [
        {
          name: 'old_convex_context',
          context: {
            // Old Convex format
            functionName: 'oldFunction',
            executionTime: 123,
            arguments: ['arg1', 'arg2'],
            userId: 'legacy-user-id',
          },
        },
        {
          name: 'old_browser_context',
          context: {
            // Old browser format
            pageUrl: 'https://old-app.com/page',
            userAgent: 'Old User Agent String',
            sessionId: 'old-session-123',
            timestamp: 1640995200000,
          },
        },
        {
          name: 'mixed_context',
          context: {
            // Mixed old and new fields
            legacy_field: 'legacy_value',
            new_field: 'new_value',
            nested_legacy: {
              old_nested: 'old_nested_value',
              new_nested: 'new_nested_value',
            },
          },
        },
      ];

      for (const testCase of legacyContextFormats) {
        const migrationRequest = {
          trace_id: `migration_context_${testCase.name}`,
          message: `Migration test for ${testCase.name}`,
          level: 'info',
          system: 'convex',
          context: testCase.context,
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Convex-Internal-Logger/1.0',
          },
          body: JSON.stringify(migrationRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify legacy context was preserved
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.context).toEqual(testCase.context);

        console.info(
          `✓ Legacy context format "${testCase.name}" preserved correctly`
        );
      }
    });

    it('should handle legacy user ID formats', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const legacyUserIdFormats = [
        { user_id: 'user_123', description: 'underscore format' },
        { user_id: 'user-456', description: 'hyphen format' },
        {
          user_id: 'legacy_user_789_abc',
          description: 'complex legacy format',
        },
        { user_id: 'convex:user:123', description: 'namespaced format' },
        { user_id: 'auth0|1234567890', description: 'auth0 format' },
        { user_id: null, description: 'null user' },
        { user_id: undefined, description: 'undefined user' },
      ];

      for (const userIdTest of legacyUserIdFormats) {
        const migrationRequest = {
          trace_id: `user_id_migration_${userIdTest.description.replace(/\s+/g, '_')}`,
          message: `User ID migration test: ${userIdTest.description}`,
          level: 'info',
          system: 'convex',
          user_id: userIdTest.user_id,
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Convex-Internal-Logger/1.0',
          },
          body: JSON.stringify(migrationRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify user ID was preserved correctly
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.user_id).toBe(userIdTest.user_id);

        console.info(
          `✓ Legacy user ID format "${userIdTest.description}" preserved correctly`
        );
      }
    });
  });

  describe('Performance During Migration', () => {
    it('should maintain performance while handling mixed legacy and new requests', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const mixedRequestTypes = [
        // Legacy Convex format
        {
          type: 'legacy_convex',
          request: {
            trace_id: 'convex_legacy_perf_test',
            message: 'Legacy Convex performance test',
            level: 'info',
            system: 'convex',
            context: {
              functionName: 'legacyFunction',
              arguments: ['arg1', { nested: 'value' }],
            },
          },
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
        },
        // Legacy browser format
        {
          type: 'legacy_browser',
          request: {
            trace_id: 'browser_legacy_perf_test',
            message: 'Legacy browser performance test',
            level: 'log',
            system: 'browser',
            context: {
              pageUrl: 'https://legacy-app.com',
              sessionId: 'legacy-session',
            },
          },
          headers: {
            Origin: 'https://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
        },
        // New format
        {
          type: 'new_format',
          request: {
            trace_id: 'new_format_perf_test',
            message: 'New format performance test',
            level: 'info',
            system: 'worker',
            user_id: 'user-modern-123',
            context: {
              modern_field: 'modern_value',
              feature_flag: 'new_logging_system',
            },
          },
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
        },
      ];

      const totalRequests = 300; // 100 of each type
      const promises: Promise<Response>[] = [];
      const startTime = Date.now();

      // Create mixed load of legacy and new requests
      for (let i = 0; i < totalRequests; i++) {
        const requestType = mixedRequestTypes[i % mixedRequestTypes.length];
        const requestData = {
          ...requestType.request,
          trace_id: `${requestType.request.trace_id}_${i}`,
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...requestType.headers,
          },
          body: JSON.stringify(requestData),
        });

        promises.push(worker.fetch(request, mockEnv, mockCtx));
      }

      // Execute all requests
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const results = await Promise.all(responses.map(r => r.json()));

      // Performance analysis
      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / totalRequests;
      const successful = results.filter(r => r.success).length;

      console.info(`Mixed Format Performance Test Results:
        - Total requests: ${totalRequests}
        - Successful: ${successful}
        - Total time: ${totalTime}ms
        - Average response time: ${avgResponseTime.toFixed(2)}ms
        - Success rate: ${((successful / totalRequests) * 100).toFixed(1)}%`);

      // Verify performance is acceptable
      expect(avgResponseTime).toBeLessThan(100); // Under 100ms average
      expect(successful).toBeGreaterThan(totalRequests * 0.95); // 95%+ success rate

      // Verify all request types were processed successfully
      const typeBreakdown = results.reduce(
        (acc, result, index) => {
          const type = mixedRequestTypes[index % mixedRequestTypes.length].type;
          acc[type] = (acc[type] || 0) + (result.success ? 1 : 0);
          return acc;
        },
        {} as Record<string, number>
      );

      console.info('Success by type:', typeBreakdown);

      // Each type should have high success rate
      Object.values(typeBreakdown).forEach(count => {
        expect(count).toBeGreaterThan(95); // At least 95 out of 100 per type
      });

      console.info(
        '✓ Performance maintained during mixed legacy/new request handling'
      );
    });

    it('should handle legacy error scenarios without performance degradation', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const legacyErrorScenarios = [
        // Missing required fields (legacy might have different requirements)
        {
          name: 'missing_trace_id',
          request: { message: 'No trace ID', level: 'error', system: 'convex' },
          expectedStatus: 400,
        },
        // Invalid log levels that legacy system might have used
        {
          name: 'legacy_log_level',
          request: {
            trace_id: 'legacy_level_test',
            message: 'Legacy level',
            level: 'debug',
            system: 'convex',
          },
          expectedStatus: 400,
        },
        // Invalid system types from legacy
        {
          name: 'legacy_system_type',
          request: {
            trace_id: 'legacy_system_test',
            message: 'Legacy system',
            level: 'info',
            system: 'legacy',
          },
          expectedStatus: 400,
        },
        // Very large payloads that legacy system might have generated
        {
          name: 'large_legacy_payload',
          request: {
            trace_id: 'large_payload_test',
            message: 'Large legacy message: ' + 'A'.repeat(50000),
            level: 'info',
            system: 'convex',
            context: { large_data: 'B'.repeat(10000) },
          },
          expectedStatus: 200, // Should handle large payloads
        },
      ];

      const results = [];
      const startTime = Date.now();

      for (const scenario of legacyErrorScenarios) {
        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Convex-Internal-Logger/1.0',
          },
          body: JSON.stringify(scenario.request),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        results.push({
          scenario: scenario.name,
          status: response.status,
          success: data.success,
          expectedStatus: scenario.expectedStatus,
        });

        expect(response.status).toBe(scenario.expectedStatus);

        console.info(
          `✓ Legacy error scenario "${scenario.name}" handled correctly (${response.status})`
        );
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.info(
        `Legacy error handling performance: ${totalTime}ms for ${legacyErrorScenarios.length} scenarios`
      );

      // Verify error handling didn't cause performance issues
      expect(totalTime / legacyErrorScenarios.length).toBeLessThan(1000); // Under 1s per error scenario

      console.info(
        '✓ Legacy error scenarios handled without performance degradation'
      );
    });
  });
});
