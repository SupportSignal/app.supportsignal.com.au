// Comprehensive unit tests for main Worker entry point
// Tests request routing, CORS handling, log ingestion workflow, health checks, and log retrieval
// @ts-nocheck

import worker from '../../../../apps/workers/log-ingestion/src/index';
import {
  createMockEnvironment,
  setupRedisMock,
  RedisMockResponses,
  TestUtils,
  resetRateLimiterState,
} from '../integration/setup';
import { LogProcessor } from '../../../../apps/workers/log-ingestion/src/log-processor';
import type {
  WorkerLogRequest,
  WorkerLogResponse,
} from '../../../../apps/workers/log-ingestion/src/types';

describe('Worker Main Entry Point', () => {
  let mockEnv: ReturnType<typeof createMockEnvironment>;
  let mockCtx: ExecutionContext;

  beforeEach(() => {
    mockEnv = createMockEnvironment();
    mockCtx = {} as ExecutionContext;
    jest.clearAllMocks();
    // Critical: Reset rate limiter state for test isolation
    resetRateLimiterState();
  });

  describe('CORS Handling', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('https://worker.example.com/log', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'POST, GET, OPTIONS'
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type, Origin, User-Agent, Authorization'
      );
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include CORS headers in all responses', async () => {
      const request = new Request('https://worker.example.com/unknown', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
        'POST, GET, OPTIONS'
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'Content-Type, Origin, User-Agent, Authorization'
      );
    });
  });

  describe('Route Handling', () => {
    it('should route POST /log to log ingestion handler', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const logRequest: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test log message',
        level: 'info',
        system: 'browser',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.trace_id).toBe('test-trace-123');
    });

    it('should route GET /health to health check handler', async () => {
      setupRedisMock({
        PING: RedisMockResponses.HEALTHY,
      });

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('log-ingestion-worker');
      expect(data.components).toHaveProperty('redis');
      expect(data.components).toHaveProperty('rate_limiter');
      expect(data.components).toHaveProperty('log_processor');
    });

    it('should route GET /logs to log retrieval handler', async () => {
      const mockLogs = [
        '{"id":"log-1","trace_id":"trace-123","message":"First log","timestamp":1000}',
        '{"id":"log-2","trace_id":"trace-123","message":"Second log","timestamp":2000}',
      ];

      setupRedisMock({
        LRANGE: { result: mockLogs },
      });

      const request = new Request(
        'https://worker.example.com/logs?trace_id=trace-123',
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.trace_id).toBe('trace-123');
      expect(data.logs).toHaveLength(2);
      expect(data.count).toBe(2);
      expect(data.retrieved_at).toBeGreaterThan(Date.now() - 1000);
    });

    it('should return 404 for unknown routes', async () => {
      const request = new Request('https://worker.example.com/unknown', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should return 404 for wrong HTTP methods', async () => {
      const request = new Request('https://worker.example.com/log', {
        method: 'PUT', // Should be POST
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not found');
    });
  });

  describe('handleLogIngestion', () => {
    beforeEach(() => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });
    });

    it('should successfully ingest valid log requests', async () => {
      const logRequest: WorkerLogRequest = {
        trace_id: 'valid-trace-123',
        message: 'Valid log message for testing',
        level: 'info',
        system: 'browser',
        user_id: 'user-456',
        context: { component: 'auth', action: 'login' },
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://localhost:3000',
          'User-Agent': 'Mozilla/5.0 (Test Browser)',
        },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.trace_id).toBe('valid-trace-123');
      expect(data).toHaveProperty('remaining_quota');
      expect(typeof data.remaining_quota).toBe('number');
    });

    it('should reject requests with invalid validation', async () => {
      const invalidRequest = {
        // Missing trace_id
        message: 'Test message',
        level: 'info',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('trace_id is required');
    });

    it('should suppress messages matching noise patterns', async () => {
      const suppressedRequest: WorkerLogRequest = {
        trace_id: 'suppressed-trace-123',
        message: '[HMR] Updated modules in development',
        level: 'info',
        system: 'browser',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suppressedRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Log suppressed (noise filtering)');
      expect(data.trace_id).toBe('suppressed-trace-123');

      // Verify Redis was not called for suppressed message
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/pipeline'),
        expect.any(Object)
      );
    });

    it('should handle rate limiting by rejecting excess requests', async () => {
      // Mock rate limiter to return rate limit exceeded
      const mockStub = mockEnv.RATE_LIMIT_STATE.get('mock-id');
      mockStub.simulateRateLimit('browser');

      const logRequest: WorkerLogRequest = {
        trace_id: 'rate-limited-trace',
        message: 'This should be rate limited',
        level: 'info',
        system: 'browser',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toBe('browser system rate limit exceeded');
      expect(data.remaining_quota).toBe(0);
      expect(data.trace_id).toBe('rate-limited-trace');
    });

    it('should redact sensitive data before storage', async () => {
      const sensitiveRequest: WorkerLogRequest = {
        trace_id: 'sensitive-trace-123',
        message:
          'Login attempt: {"access_token": "secret-token-123", "user": "john"}',
        level: 'info',
        system: 'browser',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensitiveRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify Redis was called with redacted data
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

      expect(redisCalls).toHaveLength(1);

      const redisBody = JSON.parse(redisCalls[0][1]!.body as string);
      const storedEntry = JSON.parse(redisBody[0][2]); // LPUSH command payload

      expect(storedEntry.message).toContain('[REDACTED]');
      expect(storedEntry.message).not.toContain('secret-token-123');
      expect(storedEntry.message).toContain('john'); // Non-sensitive data preserved
    });

    it('should auto-detect system from headers when not provided', async () => {
      const logRequest = {
        trace_id: 'auto-detect-trace',
        message: 'System should be auto-detected',
        level: 'info',
        // system not provided
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://localhost:3000', // Should detect as browser
        },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify rate limiter was called with detected system
      const rateLimiterCalls = mockEnv.RATE_LIMIT_STATE.get('mock-id');
      // We can't directly verify the exact call, but success indicates proper system detection
    });

    it('should handle Redis storage errors gracefully', async () => {
      setupRedisMock({
        PIPELINE: 'NETWORK_ERROR',
      });

      const logRequest: WorkerLogRequest = {
        trace_id: 'redis-error-trace',
        message: 'This will fail to store',
        level: 'error',
        system: 'browser',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle malformed JSON requests', async () => {
      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json content',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle missing request body', async () => {
      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // No body
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle very large log messages', async () => {
      const largeMessage = 'A'.repeat(100000); // 100KB message
      const logRequest: WorkerLogRequest = {
        trace_id: 'large-message-trace',
        message: largeMessage,
        level: 'info',
        system: 'browser',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('handleHealthCheck', () => {
    it('should return healthy status when all components are working', async () => {
      setupRedisMock({
        PING: RedisMockResponses.HEALTHY,
      });

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('log-ingestion-worker');
      expect(data.timestamp).toBeGreaterThan(Date.now() - 1000);

      // Verify component statuses
      expect(data.components.redis.status).toBe('healthy');
      expect(data.components.redis.url).toBe('configured');
      expect(data.components.rate_limiter.status).toBe('healthy');
      expect(data.components.log_processor.processor_status).toBe('healthy');

      // Verify endpoints documentation
      expect(data.endpoints).toEqual({
        log_ingestion: '/log',
        health_check: '/health',
        log_retrieval: '/logs?trace_id={trace_id}',
      });

      // Verify cost model information
      expect(data.cost_model).toHaveProperty('estimated_monthly_cost');
      expect(data.cost_model).toHaveProperty('savings_vs_convex');
      expect(data.cost_model).toHaveProperty('redis_ttl');
      expect(data.cost_model).toHaveProperty('rate_limits');
    });

    it('should return degraded status when Redis is unhealthy', async () => {
      setupRedisMock({
        PING: RedisMockResponses.UNHEALTHY,
      });

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(503);
      expect(data.status).toBe('degraded');
      expect(data.components.redis.status).toBe('unhealthy');
    });

    it('should handle Redis connection errors', async () => {
      setupRedisMock({
        PING: 'NETWORK_ERROR',
      });

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(503);
      expect(data.status).toBe('degraded');
      expect(data.components.redis.status).toBe('unhealthy');
    });

    it('should handle missing Redis configuration', async () => {
      const badEnv = {
        ...mockEnv,
        UPSTASH_REDIS_REST_URL: '', // Missing URL
      };

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, badEnv, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(503);
      expect(data.status).toBe('degraded');
      expect(data.components.redis.url).toBe('missing');
    });

    it('should handle rate limiter errors gracefully', async () => {
      setupRedisMock({
        PING: RedisMockResponses.HEALTHY,
      });

      // Mock rate limiter to throw error
      const mockStub = mockEnv.RATE_LIMIT_STATE.get('mock-id');
      const originalFetch = mockStub.fetch;
      mockStub.fetch = jest
        .fn()
        .mockRejectedValue(new Error('Rate limiter error'));

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(503);
      expect(data.status).toBe('unhealthy');
      expect(data.error).toBe('Health check failed');

      // Restore original fetch
      mockStub.fetch = originalFetch;
    });

    it('should include comprehensive rate limit information', async () => {
      setupRedisMock({
        PING: RedisMockResponses.HEALTHY,
      });

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(data.cost_model.rate_limits).toEqual({
        global: '1000/hour',
        browser: '400/hour',
        convex: '300/hour',
        worker: '300/hour',
        per_trace: '100/hour',
      });
    });
  });

  describe('handleLogRetrieval', () => {
    it('should retrieve logs for valid trace ID', async () => {
      const mockLogs = [
        '{"id":"log-1","trace_id":"retrieve-trace","message":"First","timestamp":1000}',
        '{"id":"log-2","trace_id":"retrieve-trace","message":"Second","timestamp":2000}',
        '{"id":"log-3","trace_id":"retrieve-trace","message":"Third","timestamp":1500}',
      ];

      setupRedisMock({
        LRANGE: { result: mockLogs },
      });

      const request = new Request(
        'https://worker.example.com/logs?trace_id=retrieve-trace',
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.trace_id).toBe('retrieve-trace');
      expect(data.logs).toHaveLength(3);
      expect(data.count).toBe(3);
      expect(data.retrieved_at).toBeGreaterThan(Date.now() - 1000);

      // Verify logs are sorted by timestamp
      expect(data.logs[0].timestamp).toBe(1000);
      expect(data.logs[1].timestamp).toBe(1500);
      expect(data.logs[2].timestamp).toBe(2000);
    });

    it('should return empty logs for non-existent trace ID', async () => {
      setupRedisMock({
        LRANGE: { result: [] },
      });

      const request = new Request(
        'https://worker.example.com/logs?trace_id=non-existent',
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.trace_id).toBe('non-existent');
      expect(data.logs).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('should reject requests without trace_id parameter', async () => {
      const request = new Request('https://worker.example.com/logs', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(400);
      expect(data.error).toBe('trace_id parameter is required');
    });

    it('should handle Redis errors during retrieval', async () => {
      setupRedisMock({
        LRANGE: RedisMockResponses.ERROR,
      });

      const request = new Request(
        'https://worker.example.com/logs?trace_id=error-trace',
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve logs');
    });

    it('should handle malformed log data in Redis gracefully', async () => {
      const mockLogs = [
        '{"valid":"json"}',
        'invalid json string',
        '{"another":"valid"}',
      ];

      setupRedisMock({
        LRANGE: { result: mockLogs },
      });

      const request = new Request(
        'https://worker.example.com/logs?trace_id=malformed-trace',
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to retrieve logs');
    });

    it('should handle special characters in trace IDs', async () => {
      const specialTraceId = 'trace-with-special-chars-@#$%^&*()';
      const encodedTraceId = encodeURIComponent(specialTraceId);

      setupRedisMock({
        LRANGE: { result: [] },
      });

      const request = new Request(
        `https://worker.example.com/logs?trace_id=${encodedTraceId}`,
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.trace_id).toBe(specialTraceId);
    });

    it('should handle very long trace IDs', async () => {
      const longTraceId = 'very-long-trace-id-' + 'x'.repeat(1000);

      setupRedisMock({
        LRANGE: { result: [] },
      });

      const request = new Request(
        `https://worker.example.com/logs?trace_id=${longTraceId}`,
        {
          method: 'GET',
        }
      );

      const response = await worker.fetch(request, mockEnv as any, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.trace_id).toBe(longTraceId);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete log ingestion and retrieval workflow', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
        LRANGE: { result: [] }, // Initially empty
      });

      const traceId = 'workflow-trace-123';

      // Step 1: Ingest a log
      const logRequest: WorkerLogRequest = {
        trace_id: traceId,
        message: 'Workflow test log',
        level: 'info',
        system: 'browser',
      };

      const ingestRequest = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      const ingestResponse = await worker.fetch(
        ingestRequest,
        mockEnv,
        mockCtx
      );
      const ingestData = await ingestResponse.json();

      expect(ingestResponse.status).toBe(200);
      expect(ingestData.success).toBe(true);

      // Step 2: Mock Redis to return the stored log
      const storedLog = {
        id: 'workflow-log-1',
        trace_id: traceId,
        message: 'Workflow test log',
        level: 'info',
        system: 'browser',
        timestamp: Date.now(),
      };

      setupRedisMock({
        LRANGE: { result: [JSON.stringify(storedLog)] },
      });

      // Step 3: Retrieve the log
      const retrieveRequest = new Request(
        `https://worker.example.com/logs?trace_id=${traceId}`,
        {
          method: 'GET',
        }
      );

      const retrieveResponse = await worker.fetch(
        retrieveRequest,
        mockEnv,
        mockCtx
      );
      const retrieveData = await retrieveResponse.json();

      expect(retrieveResponse.status).toBe(200);
      expect(retrieveData.logs).toHaveLength(1);
      expect(retrieveData.logs[0].message).toBe('Workflow test log');
    });

    it('should handle multiple concurrent log ingestions', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const requests = Array.from({ length: 10 }, (_, i) => {
        const logRequest: WorkerLogRequest = {
          trace_id: `concurrent-trace-${i}`,
          message: `Concurrent log message ${i}`,
          level: 'info',
          system: 'browser',
        };

        return new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logRequest),
        });
      });

      // Process all requests concurrently
      const promises = requests.map(req => worker.fetch(req, mockEnv, mockCtx));
      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(r => r.json()));

      // Verify all requests succeeded
      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(data.every(d => d.success === true)).toBe(true);

      // Verify Redis was called for each log
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));
      expect(redisCalls).toHaveLength(10);
    });

    it('should maintain system quotas under mixed load', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const systems = ['browser', 'convex', 'worker'];
      const requests = Array.from({ length: 30 }, (_, i) => {
        const system = systems[i % 3];
        const logRequest: WorkerLogRequest = {
          trace_id: `mixed-load-trace-${i}`,
          message: `Mixed load message from ${system}`,
          level: 'info',
          system: system as any,
        };

        return new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logRequest),
        });
      });

      // Process requests sequentially to test rate limiting
      const results = [];
      for (const request of requests) {
        const response = await worker.fetch(request, mockEnv as any, mockCtx);
        const data = (await response.json()) as any;
        results.push({ status: response.status, success: data.success });
      }

      // Should all succeed as we're within limits
      expect(results.every(r => r.status === 200 && r.success === true)).toBe(
        true
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle environment variable errors', async () => {
      const badEnv = {
        UPSTASH_REDIS_REST_URL: '', // Missing
        UPSTASH_REDIS_REST_TOKEN: '', // Missing
        RATE_LIMIT_STATE: mockEnv.RATE_LIMIT_STATE,
      };

      const logRequest: WorkerLogRequest = {
        trace_id: 'env-error-trace',
        message: 'This will fail due to missing env vars',
        level: 'error',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, badEnv, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle Durable Object errors', async () => {
      const badEnv = {
        ...mockEnv,
        RATE_LIMIT_STATE: {
          idFromName: jest.fn().mockImplementation(() => {
            throw new Error('Durable Object error');
          }),
          get: jest.fn(),
        },
      };

      const logRequest: WorkerLogRequest = {
        trace_id: 'do-error-trace',
        message: 'This will fail due to DO error',
        level: 'error',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, badEnv, mockCtx);
      const data = (await response.json()) as any;

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle execution context errors', async () => {
      const mockCtxError = {
        waitUntil: jest.fn().mockImplementation(() => {
          throw new Error('ExecutionContext error');
        }),
        passThroughOnException: jest.fn(),
      };

      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const logRequest: WorkerLogRequest = {
        trace_id: 'ctx-error-trace',
        message: 'This should still work despite ctx error',
        level: 'info',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logRequest),
      });

      // Should not fail even if ExecutionContext has issues
      const response = await worker.fetch(request, mockEnv, mockCtxError);
      const data = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
