// Comprehensive unit tests for LogProcessor
// Tests validation, sensitive data redaction, noise suppression, and system detection
// @ts-nocheck

import { LogProcessor } from '../../../../apps/workers/log-ingestion/src/log-processor';
import { WorkerLogRequest } from '../../../../apps/workers/log-ingestion/src/types';
import { TestUtils } from '../integration/setup';

describe('LogProcessor', () => {
  describe('validateRequest', () => {
    it('should accept valid log requests', () => {
      const validRequest: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'info',
        system: 'browser',
      };

      const result = LogProcessor.validateRequest(validRequest);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject request without trace_id', () => {
      const invalidRequest = {
        message: 'Test message',
        level: 'info',
      } as WorkerLogRequest;

      const result = LogProcessor.validateRequest(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('trace_id is required');
    });

    it('should reject request without message', () => {
      const invalidRequest = {
        trace_id: 'test-trace-123',
        level: 'info',
      } as WorkerLogRequest;

      const result = LogProcessor.validateRequest(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('message is required');
    });

    it('should reject invalid log levels', () => {
      const invalidRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'invalid',
      } as WorkerLogRequest;

      const result = LogProcessor.validateRequest(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('level must be one of: log, info, warn, error');
    });

    it('should accept valid log levels', () => {
      const levels = ['log', 'info', 'warn', 'error'];

      levels.forEach(level => {
        const request: WorkerLogRequest = {
          trace_id: 'test-trace-123',
          message: 'Test message',
          level: level as any,
        };

        const result = LogProcessor.validateRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid system values', () => {
      const invalidRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'info',
        system: 'invalid',
      } as WorkerLogRequest;

      const result = LogProcessor.validateRequest(invalidRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'system must be one of: browser, convex, worker, manual'
      );
    });

    it('should accept valid system values', () => {
      const systems = ['browser', 'convex', 'worker', 'manual'];

      systems.forEach(system => {
        const request: WorkerLogRequest = {
          trace_id: 'test-trace-123',
          message: 'Test message',
          level: 'info',
          system: system as any,
        };

        const result = LogProcessor.validateRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    it('should accept requests without system (auto-detection)', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'info',
      };

      const result = LogProcessor.validateRequest(request);
      expect(result.valid).toBe(true);
    });
  });

  describe('shouldSuppressMessage', () => {
    it('should suppress HMR messages', () => {
      const hmrMessages = [
        '[HMR] Updated modules',
        'unexpected require in production',
        'disposed module: ./src/component.js',
      ];

      hmrMessages.forEach(message => {
        expect(LogProcessor.shouldSuppressMessage(message)).toBe(true);
      });
    });

    it('should suppress webpack development noise', () => {
      const webpackMessages = [
        'webpack-internal:///./src/index.js',
        'webpack-hot-middleware connected',
        'hot-update.js loaded',
        '[Fast Refresh] rebuilding',
      ];

      webpackMessages.forEach(message => {
        expect(LogProcessor.shouldSuppressMessage(message)).toBe(true);
      });
    });

    it('should suppress React DevTools messages', () => {
      const devToolsMessages = [
        'React DevTools: Connected',
        'DevTools detected tab change',
      ];

      devToolsMessages.forEach(message => {
        expect(LogProcessor.shouldSuppressMessage(message)).toBe(true);
      });
    });

    it('should suppress common browser noise', () => {
      const browserMessages = [
        'Received an error from server',
        'Non-Error promise rejection captured',
      ];

      browserMessages.forEach(message => {
        expect(LogProcessor.shouldSuppressMessage(message)).toBe(true);
      });
    });

    it('should suppress Worker-specific noise', () => {
      const workerMessages = [
        'Script will terminate due to timeout',
        'Worker script error detected',
      ];

      workerMessages.forEach(message => {
        expect(LogProcessor.shouldSuppressMessage(message)).toBe(true);
      });
    });

    it('should not suppress legitimate messages', () => {
      const legitimateMessages = [
        'User authentication successful',
        'Database connection established',
        'API request completed',
        'Error: Invalid user input',
      ];

      legitimateMessages.forEach(message => {
        expect(LogProcessor.shouldSuppressMessage(message)).toBe(false);
      });
    });

    it('should handle case-insensitive suppression', () => {
      expect(LogProcessor.shouldSuppressMessage('[hmr] updated')).toBe(true);
      expect(LogProcessor.shouldSuppressMessage('WEBPACK-INTERNAL')).toBe(true);
      expect(LogProcessor.shouldSuppressMessage('React DevTools')).toBe(true);
    });
  });

  describe('redactSensitiveData', () => {
    it('should redact access tokens', () => {
      const sensitiveText =
        'User data: {"access_token": "secret-token-123", "user": "john"}';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('secret-token-123');
      expect(redacted).toContain('john'); // Non-sensitive data preserved
    });

    it('should redact client secrets', () => {
      const sensitiveText =
        'Config: {"client_secret": "super-secret", "app_id": "123"}';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('super-secret');
      expect(redacted).toContain('123');
    });

    it('should redact refresh tokens', () => {
      const sensitiveText =
        'Tokens: {"refresh_token": "refresh-xyz", "expires_in": 3600}';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('refresh-xyz');
      expect(redacted).toContain('3600');
    });

    it('should redact generic tokens', () => {
      const sensitiveText =
        'Auth: {"token": "generic-token", "type": "bearer"}';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('generic-token');
      expect(redacted).toContain('bearer');
    });

    it('should redact passwords', () => {
      const sensitiveText =
        'Login: {"username": "user", "password": "secret123"}';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('secret123');
      expect(redacted).toContain('user');
    });

    it('should redact generic secrets', () => {
      const sensitiveText =
        'Config: {"secret": "my-secret", "public": "safe-data"}';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('my-secret');
      expect(redacted).toContain('safe-data');
    });

    it('should redact API keys', () => {
      const sensitiveText =
        'API config: {"api_key": "key-123", "endpoint": "https://api.example.com"}';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('key-123');
      expect(redacted).toContain('https://api.example.com');
    });

    it('should redact Bearer tokens', () => {
      const sensitiveText =
        'Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature'
      );
    });

    it('should handle multiple sensitive patterns in one text', () => {
      const sensitiveText = `
        {
          "access_token": "token-123",
          "client_secret": "secret-456",
          "password": "pass789",
          "normal_field": "safe-value"
        }
      `;

      const redacted = LogProcessor.redactSensitiveData(sensitiveText);

      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('token-123');
      expect(redacted).not.toContain('secret-456');
      expect(redacted).not.toContain('pass789');
      expect(redacted).toContain('safe-value');
    });

    it('should preserve non-sensitive data', () => {
      const nonSensitiveText =
        'User profile: {"name": "John", "email": "john@example.com", "age": 30}';
      const redacted = LogProcessor.redactSensitiveData(nonSensitiveText);

      expect(redacted).toBe(nonSensitiveText); // Should be unchanged
    });

    it('should handle empty and undefined inputs', () => {
      expect(LogProcessor.redactSensitiveData('')).toBe('');
      expect(LogProcessor.redactSensitiveData('   ')).toBe('   ');
    });
  });

  describe('detectSystemFromHeaders', () => {
    it('should detect browser from localhost origin', () => {
      const headers = TestUtils.mockHeaders({
        origin: 'http://localhost:3000',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('browser');
    });

    it('should detect browser from 127.0.0.1 origin', () => {
      const headers = TestUtils.mockHeaders({
        origin: 'http://127.0.0.1:3000',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('browser');
    });

    it('should detect browser from localhost referer', () => {
      const headers = TestUtils.mockHeaders({
        origin: '',
        referer: 'http://localhost:3000/dashboard',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('browser');
    });

    it('should detect worker from user-agent', () => {
      const headers = TestUtils.mockHeaders({
        'user-agent': 'CloudFlare-Workers-Runtime/1.0',
        origin: '',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('worker');
    });

    it('should detect worker from cloudflare user-agent', () => {
      const headers = TestUtils.mockHeaders({
        'user-agent': 'Cloudflare Edge Runtime',
        origin: '',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('worker');
    });

    it('should detect convex from user-agent', () => {
      const headers = TestUtils.mockHeaders({
        'user-agent': 'Convex-Internal-Logger/1.0',
        origin: '',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('convex');
    });

    it('should detect convex from origin', () => {
      const headers = TestUtils.mockHeaders({
        origin: 'https://my-app.convex.cloud',
        'user-agent': 'Node.js',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('convex');
    });

    it('should default to manual for unknown sources', () => {
      const headers = TestUtils.mockHeaders({
        origin: 'https://unknown-domain.com',
        'user-agent': 'Unknown-Client/1.0',
      });
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('manual');
    });

    it('should handle missing headers gracefully', () => {
      const headers = new Headers();
      const system = LogProcessor.detectSystemFromHeaders(headers);

      expect(system).toBe('manual');
    });
  });

  describe('processLogRequest', () => {
    it('should process valid log request successfully', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test log message',
        level: 'info',
        system: 'browser',
        user_id: 'user-456',
        context: { component: 'auth' },
      };

      const headers = TestUtils.mockHeaders();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(result.processedEntry.trace_id).toBe('test-trace-123');
      expect(result.processedEntry.message).toBe('Test log message');
      expect(result.processedEntry.level).toBe('info');
      expect(result.processedEntry.system).toBe('browser');
      expect(result.processedEntry.user_id).toBe('user-456');
      expect(result.processedEntry.context).toEqual({ component: 'auth' });
      expect(result.processedEntry.id).toMatch(/^\d+_[a-z0-9]{9}$/);
      expect(result.processedEntry.timestamp).toBeGreaterThan(
        Date.now() - 1000
      );
    });

    it('should auto-detect system when not provided', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'info',
        // system not provided
      };

      const headers = TestUtils.mockHeaders({
        origin: 'http://localhost:3000',
      });
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(result.processedEntry.system).toBe('browser'); // Auto-detected
    });

    it('should suppress messages that match suppression patterns', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: '[HMR] Updated modules',
        level: 'info',
      };

      const headers = TestUtils.mockHeaders();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(false);
    });

    it('should redact sensitive data in messages', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message:
          'Login successful: {"access_token": "secret-123", "user": "john"}',
        level: 'info',
      };

      const headers = TestUtils.mockHeaders();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(result.processedEntry.message).toContain('[REDACTED]');
      expect(result.processedEntry.message).not.toContain('secret-123');
      expect(result.processedEntry.message).toContain('john');
    });

    it('should redact sensitive data in stack traces', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Authentication error',
        level: 'error',
        stack:
          'Error: Auth failed\n  at login({"password": "secret123"})\n  at handler',
      };

      const headers = TestUtils.mockHeaders();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(result.processedEntry.stack).toContain('[REDACTED]');
      expect(result.processedEntry.stack).not.toContain('secret123');
    });

    it('should redact sensitive data in context', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'API call made',
        level: 'info',
        context: {
          api_key: 'key-123',
          endpoint: '/users',
          method: 'GET',
        },
      };

      const headers = TestUtils.mockHeaders();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(JSON.stringify(result.processedEntry.context)).toContain(
        '[REDACTED]'
      );
      expect(JSON.stringify(result.processedEntry.context)).not.toContain(
        'key-123'
      );
      expect(JSON.stringify(result.processedEntry.context)).toContain('/users');
    });

    it('should handle context redaction parse failures gracefully', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'info',
        context: {
          // This will create a circular reference that can't be JSON.stringify'd
          circular: {} as any,
        },
      };

      // Create circular reference
      request.context!.circular.self = request.context!.circular;

      const headers = TestUtils.mockHeaders();

      // Should handle the circular reference gracefully
      expect(() => {
        const result = LogProcessor.processLogRequest(request, headers);
        expect(result.shouldProcess).toBe(true);
        expect(result.processedEntry.context).toEqual({
          error: 'Failed to parse context after redaction',
        });
      }).not.toThrow();
    });

    it('should generate unique IDs for each processed entry', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'info',
      };

      const headers = TestUtils.mockHeaders();

      const result1 = LogProcessor.processLogRequest(request, headers);
      const result2 = LogProcessor.processLogRequest(request, headers);

      expect(result1.processedEntry.id).not.toBe(result2.processedEntry.id);
      expect(result1.processedEntry.id).toMatch(/^\d+_[a-z0-9]{9}$/);
      expect(result2.processedEntry.id).toMatch(/^\d+_[a-z0-9]{9}$/);
    });
  });

  describe('generateHealthReport', () => {
    it('should generate comprehensive health report', () => {
      const healthReport = LogProcessor.generateHealthReport();

      expect(healthReport).toEqual({
        processor_status: 'healthy',
        redaction_patterns: expect.any(Number),
        suppression_patterns: expect.any(Number),
        supported_levels: ['log', 'info', 'warn', 'error'],
        supported_systems: ['browser', 'convex', 'worker', 'manual'],
        timestamp: expect.any(Number),
      });

      expect(healthReport.redaction_patterns).toBeGreaterThan(0);
      expect(healthReport.suppression_patterns).toBeGreaterThan(0);
      expect(healthReport.timestamp).toBeGreaterThan(Date.now() - 1000);
    });

    it('should report current pattern counts', () => {
      const healthReport = LogProcessor.generateHealthReport();

      // Based on the patterns defined in log-processor.ts
      expect(healthReport.redaction_patterns).toBeGreaterThan(5); // Number of SENSITIVE_PATTERNS
      expect(healthReport.suppression_patterns).toBeGreaterThan(10); // Number of SUPPRESSED_PATTERNS
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined headers gracefully', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: 'Test message',
        level: 'info',
      };

      // Create headers with minimal content
      const headers = new Headers();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(result.processedEntry.system).toBe('manual'); // Default fallback
    });

    it('should handle empty message strings', () => {
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: '',
        level: 'info',
      };

      const result = LogProcessor.validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('message is required');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000); // 10KB message
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: longMessage,
        level: 'info',
      };

      const headers = TestUtils.mockHeaders();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(result.processedEntry.message).toBe(longMessage);
    });

    it('should handle special characters in messages', () => {
      const specialMessage =
        'Test with emojis 🚀 and unicode ñáéíóú and symbols @#$%^&*()';
      const request: WorkerLogRequest = {
        trace_id: 'test-trace-123',
        message: specialMessage,
        level: 'info',
      };

      const headers = TestUtils.mockHeaders();
      const result = LogProcessor.processLogRequest(request, headers);

      expect(result.shouldProcess).toBe(true);
      expect(result.processedEntry.message).toBe(specialMessage);
    });
  });
});
