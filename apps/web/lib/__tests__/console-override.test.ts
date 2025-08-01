/**
 * @jest-environment jsdom
 */

import { ConsoleLogger } from '../console-override';

// Mock fetch
global.fetch = jest.fn();

describe('Console Override', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock window environment
    Object.defineProperty(window, 'CLAUDE_LOGGING_ENABLED', {
      writable: true,
      value: 'true',
    });

    // Reset console to original methods
    ConsoleLogger.reset();

    // Mock fetch to resolve successfully
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    ConsoleLogger.reset();
  });

  describe('ConsoleLogger API', () => {
    test('should generate trace ID', () => {
      const traceId = ConsoleLogger.getTraceId();
      expect(traceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });

    test('should set and get trace ID', () => {
      const newTraceId = 'test_trace_123';
      ConsoleLogger.setTraceId(newTraceId);
      expect(ConsoleLogger.getTraceId()).toBe(newTraceId);
    });

    test('should set and get user ID', () => {
      const userId = 'user_123';
      ConsoleLogger.setUserId(userId);
      expect(ConsoleLogger.getUserId()).toBe(userId);
    });

    test('should create new trace', () => {
      const originalTraceId = ConsoleLogger.getTraceId();
      const newTraceId = ConsoleLogger.newTrace();

      expect(newTraceId).not.toBe(originalTraceId);
      expect(newTraceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
      expect(ConsoleLogger.getTraceId()).toBe(newTraceId);
    });

    test('should check if enabled', () => {
      expect(ConsoleLogger.isEnabled()).toBe(true);

      window.CLAUDE_LOGGING_ENABLED = false;
      expect(ConsoleLogger.isEnabled()).toBe(false);
    });

    test('should get status', () => {
      ConsoleLogger.setUserId('test_user');
      const status = ConsoleLogger.getStatus();

      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('traceId');
      expect(status).toHaveProperty('userId');
      expect(status.userId).toBe('test_user');
    });
  });

  describe('Trace ID Generation', () => {
    test('should generate unique trace IDs', () => {
      const traceId1 = ConsoleLogger.newTrace();
      const traceId2 = ConsoleLogger.newTrace();

      expect(traceId1).not.toBe(traceId2);
    });

    test('should generate trace IDs with correct format', () => {
      const traceId = ConsoleLogger.newTrace();
      expect(traceId).toMatch(/^trace_\d+_[a-z0-9]+$/);
    });
  });

  describe('Environment Detection', () => {
    test('should handle undefined window', () => {
      // Mock the typeof window check
      const originalWindow = global.window;
      delete (global as any).window;

      expect(ConsoleLogger.isEnabled()).toBe(false);

      // Restore window
      global.window = originalWindow;
    });

    test('should detect enabled state correctly', () => {
      window.CLAUDE_LOGGING_ENABLED = 'true';
      expect(ConsoleLogger.isEnabled()).toBe(true);

      window.CLAUDE_LOGGING_ENABLED = 'false';
      expect(ConsoleLogger.isEnabled()).toBe(false);

      delete (window as any).CLAUDE_LOGGING_ENABLED;
      expect(ConsoleLogger.isEnabled()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      // This should not throw
      expect(() => {
        console.log('test message');
      }).not.toThrow();
    });

    test('should handle fetch response errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      // This should not throw
      expect(() => {
        console.log('test message');
      }).not.toThrow();
    });
  });

  describe('Development Mode Toggle', () => {
    test('should not initialize when logging disabled', () => {
      window.CLAUDE_LOGGING_ENABLED = 'false';

      const status = ConsoleLogger.getStatus();
      expect(status.enabled).toBe(false);
    });

    test('should respect enabled flag', () => {
      window.CLAUDE_LOGGING_ENABLED = 'true';
      expect(ConsoleLogger.isEnabled()).toBe(true);

      window.CLAUDE_LOGGING_ENABLED = 'false';
      expect(ConsoleLogger.isEnabled()).toBe(false);
    });
  });
});
