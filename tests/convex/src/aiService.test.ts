// @ts-nocheck - Test file with mocked OpenRouter API responses
/**
 * Unit tests for aiService.ts - finish_reason extraction
 * Story 6.9: Adaptive Token Management with Self-Healing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OpenRouterClient } from '@/aiService';

// Mock fetch globally
global.fetch = jest.fn();

describe('AIService - finish_reason Extraction (Story 6.9)', () => {
  let client: OpenRouterClient;
  const mockApiKey = 'test-api-key-12345';

  beforeEach(() => {
    client = new OpenRouterClient(mockApiKey);
    jest.clearAllMocks();
  });

  describe('finish_reason extraction from OpenRouter API', () => {
    it('should extract finish_reason="stop" for normal completion', async () => {
      // Mock OpenRouter API response with finish_reason="stop"
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'This is a complete response.',
              },
              finish_reason: 'stop', // Normal completion
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request = {
        correlationId: 'test-correlation-id',
        model: 'openai/gpt-5-nano',
        prompt: 'Test prompt',
        maxTokens: 1000,
      };

      const response = await client.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.finishReason).toBe('stop');
      expect(response.content).toBe('This is a complete response.');
    });

    it('should extract finish_reason="length" for truncated response', async () => {
      // Mock OpenRouter API response with finish_reason="length" (truncation)
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'This response was truncated due to...',
              },
              finish_reason: 'length', // Truncated due to max_tokens limit
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 2000,
            total_tokens: 2010,
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request = {
        correlationId: 'test-correlation-id-truncated',
        model: 'openai/gpt-5-nano',
        prompt: 'Generate very long response',
        maxTokens: 2000,
      };

      const response = await client.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.finishReason).toBe('length');
      expect(response.content).toContain('truncated');
    });

    it('should extract finish_reason="content_filter" for policy violation', async () => {
      // Mock OpenRouter API response with finish_reason="content_filter"
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '',
              },
              finish_reason: 'content_filter', // Filtered by content policy
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 0,
            total_tokens: 10,
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request = {
        correlationId: 'test-correlation-id-filtered',
        model: 'openai/gpt-5-nano',
        prompt: 'Prompt that triggers content filter',
        maxTokens: 1000,
      };

      const response = await client.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.finishReason).toBe('content_filter');
      expect(response.content).toBe('');
    });

    it('should handle missing finish_reason gracefully (undefined)', async () => {
      // Mock OpenRouter API response without finish_reason field
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'Response without finish_reason',
              },
              // No finish_reason field
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request = {
        correlationId: 'test-correlation-id-missing',
        model: 'openai/gpt-5-nano',
        prompt: 'Test prompt',
        maxTokens: 1000,
      };

      const response = await client.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.finishReason).toBeUndefined();
      expect(response.content).toBe('Response without finish_reason');
    });
  });

  describe('finishReason in AIResponse interface', () => {
    it('should include finishReason in successful response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { content: 'Test content' },
              finish_reason: 'stop',
            },
          ],
          usage: { total_tokens: 30 },
        }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const request = {
        correlationId: 'test-id',
        model: 'openai/gpt-5-nano',
        prompt: 'Test',
        maxTokens: 1000,
      };

      const response = await client.sendRequest(request);

      // Verify response structure includes finishReason
      expect(response).toHaveProperty('correlationId');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('model');
      expect(response).toHaveProperty('tokensUsed');
      expect(response).toHaveProperty('processingTimeMs');
      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('finishReason');
      expect(response.finishReason).toBe('stop');
    });

    it('should NOT include finishReason in failed response', async () => {
      // Mock API error response (will be retried 3 times)
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      };

      // Mock for all 3 retry attempts
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const request = {
        correlationId: 'test-id-error',
        model: 'openai/gpt-5-nano',
        prompt: 'Test',
        maxTokens: 1000,
      };

      const response = await client.sendRequest(request);

      // Failed responses don't have finishReason
      expect(response.success).toBe(false);
      expect(response.error).toContain('OpenRouter API error');
      expect(response.finishReason).toBeUndefined();
    }, 10000); // Increase timeout to 10 seconds to account for retry backoff
  });
});
