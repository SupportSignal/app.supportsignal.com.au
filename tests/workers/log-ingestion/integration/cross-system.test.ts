// @ts-nocheck
// Cross-system tests for browser, Convex, and Worker logging coordination
// Tests system detection, data consistency, and coordination between different log sources
// TypeScript interface issues don't affect test functionality

import worker from '../../../../apps/workers/log-ingestion/src/index';
import {
  createMockEnvironment,
  setupRedisMock,
  RedisMockResponses,
  TestUtils,
  setupGlobalTestCleanup,
} from './setup';
import {
  WorkerLogRequest,
  RedisLogEntry,
} from '../../../../apps/workers/log-ingestion/src/types';

describe('Cross-System Tests: Browser, Convex, and Worker Coordination', () => {
  let mockEnv: ReturnType<typeof createMockEnvironment>;
  let mockCtx: ExecutionContext;

  // Use global test cleanup for cross-file isolation
  setupGlobalTestCleanup();

  beforeEach(() => {
    mockEnv = createMockEnvironment();
    mockCtx = new ExecutionContext();
    // Note: setupGlobalTestCleanup() handles jest.clearAllMocks()
  });

  describe('System Auto-Detection and Classification', () => {
    it('should correctly detect browser requests from headers', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const browserScenarios = [
        {
          name: 'localhost development',
          headers: {
            Origin: 'http://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
          expectedSystem: 'browser',
        },
        {
          name: '127.0.0.1 development',
          headers: {
            Origin: 'http://127.0.0.1:3000',
            'User-Agent': 'Chrome/91.0',
          },
          expectedSystem: 'browser',
        },
        {
          name: 'localhost from referer',
          headers: {
            Referer: 'http://localhost:3000/dashboard',
            'User-Agent': 'Safari/14.0',
          },
          expectedSystem: 'browser',
        },
        {
          name: 'production browser',
          headers: {
            Origin: 'https://app.example.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          },
          expectedSystem: 'manual', // Production URLs default to manual unless localhost
        },
      ];

      for (const scenario of browserScenarios) {
        const logRequest: WorkerLogRequest = {
          trace_id: `browser-detection-${scenario.name.replace(/\s+/g, '-')}`,
          message: `Testing browser detection for ${scenario.name}`,
          level: 'info',
          // system not provided - should be auto-detected
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...scenario.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify system was detected correctly by checking Redis calls
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        expect(redisCalls.length).toBeGreaterThan(0);

        if (redisCalls.length > 0) {
          const lastCall = redisCalls[redisCalls.length - 1];
          const redisBody = JSON.parse(lastCall[1]!.body as string);
          const storedEntry = JSON.parse(redisBody[0][2]); // LPUSH command payload

          expect(storedEntry.system).toBe(scenario.expectedSystem);
        }

        console.info(
          `✓ ${scenario.name}: detected as ${scenario.expectedSystem}`
        );
      }
    });

    it('should correctly detect Convex requests from headers', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const convexScenarios = [
        {
          name: 'Convex internal logger',
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
        },
        {
          name: 'Convex health check',
          headers: { 'User-Agent': 'Convex-Health-Check/1.0' },
        },
        {
          name: 'Convex origin',
          headers: {
            Origin: 'https://my-app.convex.cloud',
            'User-Agent': 'Node.js',
          },
        },
        {
          name: 'Convex subdomain',
          headers: {
            Origin: 'https://subdomain.convex.site',
            'User-Agent': 'undici',
          },
        },
      ];

      for (const scenario of convexScenarios) {
        const logRequest: WorkerLogRequest = {
          trace_id: `convex-detection-${scenario.name.replace(/\s+/g, '-')}`,
          message: `Testing Convex detection for ${scenario.name}`,
          level: 'info',
          // system not provided - should be auto-detected
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...scenario.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify system was detected as Convex
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.system).toBe('convex');

        console.info(`✓ ${scenario.name}: detected as convex`);
      }
    });

    it('should correctly detect Worker requests from headers', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const workerScenarios = [
        {
          name: 'Cloudflare Workers Runtime',
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
        },
        {
          name: 'Cloudflare Edge Runtime',
          headers: { 'User-Agent': 'Cloudflare Edge Runtime' },
        },
        {
          name: 'Worker with cloudflare in UA',
          headers: { 'User-Agent': 'Custom-Worker cloudflare-workers/2.0' },
        },
        {
          name: 'Worker system keyword',
          headers: { 'User-Agent': 'worker-script/1.0' },
        },
      ];

      for (const scenario of workerScenarios) {
        const logRequest: WorkerLogRequest = {
          trace_id: `worker-detection-${scenario.name.replace(/\s+/g, '-')}`,
          message: `Testing Worker detection for ${scenario.name}`,
          level: 'info',
          // system not provided - should be auto-detected
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...scenario.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify system was detected as Worker
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.system).toBe('worker');

        console.info(`✓ ${scenario.name}: detected as worker`);
      }
    });

    it('should default to manual for unknown sources', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const unknownScenarios = [
        {
          name: 'curl request',
          headers: { 'User-Agent': 'curl/7.68.0' },
        },
        {
          name: 'postman request',
          headers: { 'User-Agent': 'PostmanRuntime/7.26.8' },
        },
        {
          name: 'unknown service',
          headers: {
            'User-Agent': 'MyCustomService/1.0',
            Origin: 'https://unknown.example.com',
          },
        },
        {
          name: 'minimal headers',
          headers: {},
        },
      ];

      for (const scenario of unknownScenarios) {
        const logRequest: WorkerLogRequest = {
          trace_id: `manual-detection-${scenario.name.replace(/\s+/g, '-')}`,
          message: `Testing manual detection for ${scenario.name}`,
          level: 'info',
          // system not provided - should default to manual
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...scenario.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify system was detected as manual
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.system).toBe('manual');

        console.info(`✓ ${scenario.name}: detected as manual`);
      }
    });

    it('should respect explicit system parameter over auto-detection', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const overrideScenarios = [
        {
          name: 'Browser headers with Convex system',
          headers: {
            Origin: 'http://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
          explicitSystem: 'convex',
        },
        {
          name: 'Convex headers with Worker system',
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
          explicitSystem: 'worker',
        },
        {
          name: 'Worker headers with Browser system',
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
          explicitSystem: 'browser',
        },
        {
          name: 'Unknown headers with explicit manual',
          headers: { 'User-Agent': 'curl/7.68.0' },
          explicitSystem: 'manual',
        },
      ];

      for (const scenario of overrideScenarios) {
        const logRequest: WorkerLogRequest = {
          trace_id: `override-${scenario.name.replace(/\s+/g, '-')}`,
          message: `Testing system override for ${scenario.name}`,
          level: 'info',
          system: scenario.explicitSystem as any, // Explicit system provided
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...scenario.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify explicit system was used
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.system).toBe(scenario.explicitSystem);

        console.info(
          `✓ ${scenario.name}: used explicit system ${scenario.explicitSystem}`
        );
      }
    });
  });

  describe('System-Specific Rate Limiting Coordination', () => {
    it('should enforce independent rate limits per system', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const systemConfigs = [
        {
          system: 'browser',
          limit: 400,
          headers: {
            Origin: 'http://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
        },
        {
          system: 'convex',
          limit: 300,
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
        },
        {
          system: 'worker',
          limit: 300,
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
        },
      ];

      const results: Record<string, any[]> = {};

      // Test each system's rate limiting independently
      for (const config of systemConfigs) {
        const systemResults = [];
        const requestCount = config.limit + 20; // Exceed limit by 20

        for (let i = 0; i < requestCount; i++) {
          const logRequest: WorkerLogRequest = {
            trace_id: `${config.system}-rate-test-${Math.floor(i / 25)}`, // Multiple traces
            message: `${config.system} rate limiting test ${i + 1}`,
            level: 'info',
            system: config.system as any,
          };

          const request = new Request('https://worker.example.com/log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...config.headers,
            },
            body: JSON.stringify(logRequest),
          });

          const response = await worker.fetch(request, mockEnv, mockCtx);
          const data = await response.json();

          systemResults.push({
            index: i,
            success: data.success,
            error: data.error,
            remaining_quota: data.remaining_quota,
          });
        }

        results[config.system] = systemResults;
      }

      // Analyze each system's rate limiting
      for (const config of systemConfigs) {
        const systemResults = results[config.system];
        const successful = systemResults.filter(r => r.success);
        const rateLimited = systemResults.filter(r => !r.success);

        console.info(`${config.system} system rate limiting:
          - Requests sent: ${systemResults.length}
          - Successful: ${successful.length}
          - Rate limited: ${rateLimited.length}
          - Expected limit: ${config.limit}`);

        // Verify system-specific limits are enforced
        expect(successful.length).toBeLessThanOrEqual(config.limit);
        expect(successful.length).toBeGreaterThan(config.limit * 0.9); // Should get most of quota

        // Verify rate-limited requests have correct error messages
        rateLimited.forEach(result => {
          expect(result.error).toContain(
            `${config.system} system rate limit exceeded`
          );
        });

        // Verify quota counting
        if (successful.length > 1) {
          expect(successful[0].remaining_quota).toBeGreaterThan(
            successful[successful.length - 1].remaining_quota
          );
        }
      }

      // Verify systems don't interfere with each other
      const browserSuccessful = results.browser.filter(r => r.success).length;
      const convexSuccessful = results.convex.filter(r => r.success).length;
      const workerSuccessful = results.worker.filter(r => r.success).length;

      expect(browserSuccessful).toBeGreaterThan(300); // Should get most of 400 limit
      expect(convexSuccessful).toBeGreaterThan(250); // Should get most of 300 limit
      expect(workerSuccessful).toBeGreaterThan(250); // Should get most of 300 limit
    });

    it('should coordinate global rate limiting across all systems', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const globalLimit = 1000;
      const systemDistribution = [
        {
          system: 'browser',
          requests: 450,
          headers: { Origin: 'http://localhost:3000' },
        },
        {
          system: 'convex',
          requests: 350,
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
        },
        {
          system: 'worker',
          requests: 350,
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
        },
      ]; // Total: 1150 requests (exceeds global limit)

      const allPromises: Promise<Response>[] = [];
      const requestMetadata: Array<{ system: string; index: number }> = [];

      // Create mixed requests from all systems
      systemDistribution.forEach(config => {
        for (let i = 0; i < config.requests; i++) {
          const logRequest: WorkerLogRequest = {
            trace_id: `global-coordination-${config.system}-${Math.floor(i / 30)}`,
            message: `Global coordination test from ${config.system} #${i + 1}`,
            level: 'info',
            system: config.system as any,
          };

          const request = new Request('https://worker.example.com/log', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...config.headers,
            },
            body: JSON.stringify(logRequest),
          });

          allPromises.push(worker.fetch(request, mockEnv, mockCtx));
          requestMetadata.push({ system: config.system, index: i });
        }
      });

      // Execute all requests concurrently
      const responses = await Promise.all(allPromises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Analyze global coordination
      const successful = results.filter(r => r.success);
      const globalLimited = results.filter(
        r => !r.success && r.error?.includes('Global rate limit')
      );
      const systemLimited = results.filter(
        r => !r.success && !r.error?.includes('Global rate limit')
      );

      console.info(`Global rate limiting coordination:
        - Total requests: ${allPromises.length}
        - Successful: ${successful.length}
        - Global limited: ${globalLimited.length}
        - System limited: ${systemLimited.length}
        - Global limit: ${globalLimit}`);

      // Verify global limit is enforced
      expect(successful.length).toBeLessThanOrEqual(globalLimit);

      // Verify mix of systems got through before global limit
      const systemBreakdown = successful.reduce(
        (acc, result, index) => {
          const system = requestMetadata[index].system;
          acc[system] = (acc[system] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      console.info('Successful requests by system:', systemBreakdown);

      // Each system should have gotten some requests through
      Object.values(systemBreakdown).forEach(count => {
        expect(count).toBeGreaterThan(0);
      });

      // Verify error messages for limited requests
      globalLimited.forEach(result => {
        expect(result.error).toBe('Global rate limit exceeded');
        expect(result.remaining_quota).toBe(0);
      });
    });

    it('should handle concurrent cross-system requests with trace correlation', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const traceId = 'cross-system-correlation-trace';
      const systemRequests = [
        {
          system: 'browser',
          message: 'User initiated action',
          headers: {
            Origin: 'http://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
        },
        {
          system: 'convex',
          message: 'Processing user request',
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
        },
        {
          system: 'worker',
          message: 'Background processing initiated',
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
        },
        {
          system: 'convex',
          message: 'Database operation completed',
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
        },
        {
          system: 'browser',
          message: 'UI updated with results',
          headers: {
            Origin: 'http://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
        },
      ];

      const promises = systemRequests.map((config, index) => {
        const logRequest: WorkerLogRequest = {
          trace_id: traceId,
          message: config.message,
          level: 'info',
          system: config.system as any,
          context: {
            step: index + 1,
            workflow: 'cross-system-coordination',
            timestamp: Date.now() + index * 100, // Stagger timestamps
          },
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify(logRequest),
        });

        return worker.fetch(request, mockEnv, mockCtx);
      });

      // Execute requests concurrently
      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map(r => r.json()));

      // Verify all requests succeeded
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.trace_id === traceId)).toBe(true);

      // Verify Redis received all requests with correct system attribution
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

      expect(redisCalls.length).toBe(systemRequests.length);

      // Check each stored entry has correct system and trace correlation
      redisCalls.forEach((call, index) => {
        const redisBody = JSON.parse(call[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.trace_id).toBe(traceId);
        expect(storedEntry.system).toBe(systemRequests[index].system);
        expect(storedEntry.message).toBe(systemRequests[index].message);
        expect(storedEntry.context.step).toBe(index + 1);
      });

      console.info(
        `✓ Cross-system trace correlation successful for ${systemRequests.length} requests`
      );
    });
  });

  describe('Data Consistency Across Systems', () => {
    it('should maintain consistent data formatting across all systems', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const systemTests = [
        {
          system: 'browser',
          headers: {
            Origin: 'http://localhost:3000',
            'User-Agent': 'Mozilla/5.0',
          },
          testData: {
            special_chars: 'Unicode test: ñáéíóú 🚀 @#$%^&*()',
            nested_object: { level1: { level2: { value: 'deep nested' } } },
            array_data: [1, 'string', { mixed: 'array' }],
            null_value: null,
            boolean_value: true,
          },
        },
        {
          system: 'convex',
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
          testData: {
            function_name: 'processUserAction',
            execution_time: 123.45,
            memory_usage: '50MB',
            stack_trace: 'Error\n  at function1()\n  at function2()',
          },
        },
        {
          system: 'worker',
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
          testData: {
            worker_id: 'worker-12345',
            region: 'us-east-1',
            cpu_time: 89.12,
            request_id: 'req-abcdef',
          },
        },
      ];

      for (const test of systemTests) {
        const logRequest: WorkerLogRequest = {
          trace_id: `data-consistency-${test.system}`,
          message: `Data consistency test for ${test.system}`,
          level: 'info',
          system: test.system as any,
          context: test.testData,
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...test.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify data was stored consistently
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        expect(storedEntry.system).toBe(test.system);
        expect(storedEntry.trace_id).toBe(`data-consistency-${test.system}`);
        expect(storedEntry.message).toBe(
          `Data consistency test for ${test.system}`
        );

        // Verify context data was preserved correctly
        expect(storedEntry.context).toEqual(test.testData);

        // Verify standard fields are present
        expect(storedEntry).toHaveProperty('id');
        expect(storedEntry).toHaveProperty('timestamp');
        expect(typeof storedEntry.timestamp).toBe('number');
        expect(storedEntry.id).toMatch(/^\d+_[a-z0-9]{9}$/);

        console.info(`✓ Data consistency verified for ${test.system} system`);
      }
    });

    it('should handle sensitive data redaction consistently across systems', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const sensitiveTestCases = [
        {
          system: 'browser',
          headers: { Origin: 'http://localhost:3000' },
          sensitiveData: {
            user_credentials: {
              access_token: 'browser-token-123',
              password: 'user-pass',
            },
            api_calls: { client_secret: 'browser-secret-456' },
          },
        },
        {
          system: 'convex',
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
          sensitiveData: {
            database_config: { api_key: 'convex-api-789', secret: 'db-secret' },
            auth_flow: { refresh_token: 'convex-refresh-abc' },
          },
        },
        {
          system: 'worker',
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
          sensitiveData: {
            worker_env: {
              token: 'worker-env-token-xyz',
              password: 'worker-pass',
            },
            external_api: { secret: 'external-secret-123' },
          },
        },
      ];

      for (const testCase of sensitiveTestCases) {
        const logRequest: WorkerLogRequest = {
          trace_id: `redaction-test-${testCase.system}`,
          message: `Sensitive data test: ${JSON.stringify(testCase.sensitiveData)}`,
          level: 'warn',
          system: testCase.system as any,
          context: testCase.sensitiveData,
        };

        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...testCase.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify sensitive data was redacted
        const redisCalls = (
          global.fetch as jest.MockedFunction<typeof fetch>
        ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

        const lastCall = redisCalls[redisCalls.length - 1];
        const redisBody = JSON.parse(lastCall[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        // Check message redaction
        expect(storedEntry.message).toContain('[REDACTED]');
        expect(storedEntry.message).not.toContain('browser-token-123');
        expect(storedEntry.message).not.toContain('user-pass');
        expect(storedEntry.message).not.toContain('convex-api-789');
        expect(storedEntry.message).not.toContain('worker-env-token-xyz');

        // Check context redaction
        const contextStr = JSON.stringify(storedEntry.context);
        expect(contextStr).toContain('[REDACTED]');
        expect(contextStr).not.toContain('browser-token-123');
        expect(contextStr).not.toContain('convex-refresh-abc');
        expect(contextStr).not.toContain('external-secret-123');

        console.info(
          `✓ Sensitive data redaction verified for ${testCase.system} system`
        );
      }
    });

    it('should maintain timestamp consistency across systems', async () => {
      setupRedisMock({
        PIPELINE: RedisMockResponses.PIPELINE_SUCCESS,
      });

      const baseTime = Date.now();
      const systemRequests = [
        {
          system: 'browser',
          delay: 0,
          headers: { Origin: 'http://localhost:3000' },
        },
        {
          system: 'convex',
          delay: 100,
          headers: { 'User-Agent': 'Convex-Internal-Logger/1.0' },
        },
        {
          system: 'worker',
          delay: 200,
          headers: { 'User-Agent': 'CloudFlare-Workers-Runtime/1.0' },
        },
      ];

      const results = [];

      for (const config of systemRequests) {
        // Wait for the specified delay
        if (config.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, config.delay));
        }

        const logRequest: WorkerLogRequest = {
          trace_id: 'timestamp-consistency-test',
          message: `Timestamp test from ${config.system}`,
          level: 'info',
          system: config.system as any,
          context: { expected_order: systemRequests.indexOf(config) },
        };

        const requestTime = Date.now();
        const request = new Request('https://worker.example.com/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify(logRequest),
        });

        const response = await worker.fetch(request, mockEnv, mockCtx);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        results.push({
          system: config.system,
          requestTime,
          response: data,
        });
      }

      // Verify Redis calls have appropriate timestamps
      const redisCalls = (
        global.fetch as jest.MockedFunction<typeof fetch>
      ).mock.calls.filter(call => call[0].toString().includes('/pipeline'));

      expect(redisCalls.length).toBe(systemRequests.length);

      const storedTimestamps = redisCalls.map((call, index) => {
        const redisBody = JSON.parse(call[1]!.body as string);
        const storedEntry = JSON.parse(redisBody[0][2]);

        return {
          system: systemRequests[index].system,
          storedTimestamp: storedEntry.timestamp,
          requestTime: results[index].requestTime,
        };
      });

      // Verify timestamps are in correct order
      for (let i = 1; i < storedTimestamps.length; i++) {
        expect(storedTimestamps[i].storedTimestamp).toBeGreaterThan(
          storedTimestamps[i - 1].storedTimestamp
        );
      }

      // Verify timestamps are reasonably close to request times
      storedTimestamps.forEach(({ system, storedTimestamp, requestTime }) => {
        const timeDiff = Math.abs(storedTimestamp - requestTime);
        expect(timeDiff).toBeLessThan(1000); // Within 1 second
        console.info(
          `✓ ${system} timestamp accuracy: ${timeDiff}ms difference`
        );
      });
    });
  });

  describe('System Health and Status Coordination', () => {
    it('should provide system-specific health information', async () => {
      setupRedisMock({
        PING: RedisMockResponses.HEALTHY,
      });

      const request = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const healthData = await response.json();

      expect(response.status).toBe(200);
      expect(healthData.status).toBe('healthy');

      // Verify system-specific rate limit information
      expect(healthData.cost_model.rate_limits).toEqual({
        global: '1000/hour',
        browser: '400/hour',
        convex: '300/hour',
        worker: '300/hour',
        per_trace: '100/hour',
      });

      // Verify component status includes all systems
      expect(healthData.components).toHaveProperty('redis');
      expect(healthData.components).toHaveProperty('rate_limiter');
      expect(healthData.components).toHaveProperty('log_processor');

      // Verify endpoint documentation
      expect(healthData.endpoints).toEqual({
        log_ingestion: '/log',
        health_check: '/health',
        log_retrieval: '/logs?trace_id={trace_id}',
      });

      console.info(
        '✓ Health endpoint provides comprehensive system information'
      );
    });

    it('should handle partial system failures gracefully', async () => {
      // Simulate Redis being unhealthy
      setupRedisMock({
        PING: RedisMockResponses.UNHEALTHY,
      });

      const healthRequest = new Request('https://worker.example.com/health', {
        method: 'GET',
      });

      const healthResponse = await worker.fetch(
        healthRequest,
        mockEnv,
        mockCtx
      );
      const healthData = await healthResponse.json();

      expect(healthResponse.status).toBe(503);
      expect(healthData.status).toBe('degraded');
      expect(healthData.components.redis.status).toBe('unhealthy');

      // Verify logging still attempts to work despite Redis issues
      const logRequest: WorkerLogRequest = {
        trace_id: 'partial-failure-test',
        message: 'Testing logging during Redis failure',
        level: 'error',
        system: 'browser',
      };

      const request = new Request('https://worker.example.com/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'http://localhost:3000',
        },
        body: JSON.stringify(logRequest),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      // Should fail gracefully
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');

      console.info('✓ System handles partial failures gracefully');
    });
  });
});
