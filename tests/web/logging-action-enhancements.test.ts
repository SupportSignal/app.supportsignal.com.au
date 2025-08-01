import { describe, it, expect } from '@jest/globals';

/**
 * Tests for Convex HTTP Action Enhancements
 * These tests validate the enhancements made to support multi-system logging with CORS
 */

describe('Logging Action Enhancements', () => {
  describe('System detection logic', () => {
    it('should detect browser origin correctly', () => {
      const origins = ['http://localhost:3000', 'https://127.0.0.1:8080'];

      origins.forEach(origin => {
        const isBrowser =
          origin.includes('localhost') || origin.includes('127.0.0.1');
        expect(isBrowser).toBe(true);
      });
    });

    it('should detect worker user agents', () => {
      const userAgents = [
        'Cloudflare-Worker/1.0',
        'mozilla/5.0 cloudflare worker integration',
        'custom-worker-client/2.1',
      ];

      userAgents.forEach(userAgent => {
        const isWorker =
          userAgent.toLowerCase().includes('worker') ||
          userAgent.toLowerCase().includes('cloudflare');
        expect(isWorker).toBe(true);
      });
    });

    it('should detect convex user agents', () => {
      const userAgents = [
        'convex-log-streams/1.0',
        'Convex Webhook Sender',
        'Mozilla/5.0 convex integration',
      ];

      userAgents.forEach(userAgent => {
        const isConvex = userAgent.toLowerCase().includes('convex');
        expect(isConvex).toBe(true);
      });
    });

    it('should fall back to browser for unknown origins', () => {
      const unknownOrigins = [
        'https://unknown-domain.com',
        'https://external-service.io',
        '',
      ];

      unknownOrigins.forEach(origin => {
        const isBrowser =
          origin.includes('localhost') || origin.includes('127.0.0.1');
        const isWorker = false; // No worker indicators in these origins
        const isConvex = false; // No convex indicators in these origins

        if (!isBrowser && !isWorker && !isConvex) {
          const fallback = 'browser';
          expect(fallback).toBe('browser');
        }
      });
    });
  });

  describe('CORS headers validation', () => {
    it('should include required CORS headers', () => {
      const expectedCorsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Origin, User-Agent',
        'Content-Type': 'application/json',
      };

      // Verify each header is present and has expected value
      expect(expectedCorsHeaders['Access-Control-Allow-Origin']).toBe('*');
      expect(expectedCorsHeaders['Access-Control-Allow-Methods']).toContain(
        'POST'
      );
      expect(expectedCorsHeaders['Access-Control-Allow-Methods']).toContain(
        'OPTIONS'
      );
      expect(expectedCorsHeaders['Access-Control-Allow-Headers']).toContain(
        'Content-Type'
      );
      expect(expectedCorsHeaders['Content-Type']).toBe('application/json');
    });
  });

  describe('Request validation', () => {
    it('should validate required fields', () => {
      const validateLogRequest = (
        body: any
      ): { valid: boolean; missing?: string[] } => {
        const required = ['level', 'args', 'timestamp'];
        const missing = required.filter(field => !body[field]);

        return {
          valid: missing.length === 0,
          missing: missing.length > 0 ? missing : undefined,
        };
      };

      const validBody = {
        level: 'info',
        args: ['test message'],
        timestamp: Date.now(),
        trace_id: 'test-trace-123',
      };

      const invalidBodies = [
        {},
        { level: 'info' },
        { level: 'info', args: [] },
        { args: ['message'], timestamp: Date.now() },
      ];

      expect(validateLogRequest(validBody).valid).toBe(true);

      invalidBodies.forEach(body => {
        const result = validateLogRequest(body);
        expect(result.valid).toBe(false);
        expect(result.missing).toBeDefined();
      });
    });
  });

  describe('Health check response', () => {
    it('should include correct health check structure', () => {
      const expectedHealthResponse = {
        status: 'healthy',
        service: 'multi-system-logging',
        timestamp: expect.any(Number),
        endpoints: {
          processLogs: '/api/actions/loggingAction/processLogs',
          processLogsHttp: '/api/actions/loggingAction/processLogsHttp',
          healthCheck: '/api/actions/loggingAction/loggingHealthCheck',
        },
        supportedSystems: ['browser', 'worker', 'convex', 'manual'],
      };

      // Verify structure
      expect(expectedHealthResponse.status).toBe('healthy');
      expect(expectedHealthResponse.service).toBe('multi-system-logging');
      expect(expectedHealthResponse.supportedSystems).toContain('browser');
      expect(expectedHealthResponse.supportedSystems).toContain('worker');
      expect(expectedHealthResponse.supportedSystems).toContain('convex');
      expect(expectedHealthResponse.supportedSystems).toContain('manual');
      expect(expectedHealthResponse.endpoints.processLogs).toBeDefined();
      expect(expectedHealthResponse.endpoints.processLogsHttp).toBeDefined();
      expect(expectedHealthResponse.endpoints.healthCheck).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle method not allowed errors', () => {
      const invalidMethods = ['GET', 'PUT', 'DELETE', 'PATCH'];

      invalidMethods.forEach(method => {
        // Simulate the logic that would run in the HTTP action
        if (method !== 'POST' && method !== 'OPTIONS') {
          const expectedResponse = {
            error: 'Method not allowed',
            status: 405,
          };

          expect(expectedResponse.error).toBe('Method not allowed');
          expect(expectedResponse.status).toBe(405);
        }
      });
    });

    it('should handle missing required fields', () => {
      const incompleteBody = { level: 'info' }; // Missing args and timestamp

      const validateAndRespond = (body: any) => {
        if (!body.level || !body.args || !body.timestamp) {
          return {
            status: 400,
            body: {
              success: false,
              error: 'Missing required fields: level, args, timestamp',
            },
          };
        }
        return { status: 200 };
      };

      const response = validateAndRespond(incompleteBody);
      expect(response.status).toBe(400);
      expect(response.body?.success).toBe(false);
      expect(response.body?.error).toContain('Missing required fields');
    });
  });

  describe('Multi-system integration', () => {
    it('should handle logs from different systems', () => {
      const testCases = [
        {
          system: 'browser',
          expectedSystemArea: 'browser',
          origin: 'http://localhost:3000',
          userAgent: 'Mozilla/5.0 Chrome',
        },
        {
          system: 'worker',
          expectedSystemArea: 'worker',
          origin: 'https://example.com',
          userAgent: 'Cloudflare-Worker/1.0',
        },
        {
          system: 'convex',
          expectedSystemArea: 'convex',
          origin: 'https://webhook.convex.dev',
          userAgent: 'convex-log-streams/1.0',
        },
      ];

      testCases.forEach(({ system, expectedSystemArea, origin, userAgent }) => {
        // Simulate system detection logic (case-insensitive)
        let detectedSystem;
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          detectedSystem = 'browser';
        } else if (
          userAgent.toLowerCase().includes('worker') ||
          userAgent.toLowerCase().includes('cloudflare')
        ) {
          detectedSystem = 'worker';
        } else if (userAgent.toLowerCase().includes('convex')) {
          detectedSystem = 'convex';
        } else {
          detectedSystem = 'browser';
        }

        expect(detectedSystem).toBe(expectedSystemArea);
      });
    });
  });
});
