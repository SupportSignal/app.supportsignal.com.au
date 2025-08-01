// @ts-nocheck
/**
 * Jest test setup for Convex backend testing
 * Comprehensive mocking and environment setup for Knowledge Ingestion Service tests
 */

// Import Jest globals to ensure they're available
import { jest, beforeEach, afterEach } from '@jest/globals';

// Make Jest available globally for all test files
(global as any).jest = jest;

// Global test environment setup
beforeEach(() => {
  // Clear all mocks between tests
  jest.clearAllMocks();

  // Reset environment variables for test isolation
  process.env.NODE_ENV = 'test';

  // Mock console methods to prevent test output noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  // Reset global state for config caching
  if (global.__resetConfig) {
    global.__resetConfig();
  }
});

afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Global mock for crypto.randomUUID (Node.js 14 compatibility)
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '12345678-1234-4000-8000-123456789abc'),
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mockedhash123456789abcdef'),
    })),
  },
  writable: true,
});

// Global fetch mock for external API calls
global.fetch = jest.fn();

// Mock process.env with test values
process.env.OPENROUTER_API_KEY = 'test-openrouter-key-1234567890';
process.env.OPENAI_API_KEY = 'test-openai-key-sk-1234567890';
process.env.CLOUDFLARE_ACCOUNT_ID = 'test-cloudflare-account-123';
process.env.CLOUDFLARE_API_TOKEN = 'test-cloudflare-token-456';
process.env.VECTORIZE_DATABASE_ID = 'test-vectorize-db-789';
process.env.LLM_MODEL = 'anthropic/claude-3-haiku';
process.env.LLM_FALLBACK_MODEL = 'openai/gpt-4o-mini';

// Type definitions for test globals
declare global {
  var __resetConfig: (() => void) | undefined;
}
