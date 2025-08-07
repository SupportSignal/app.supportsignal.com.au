// @ts-nocheck
/**
 * Comprehensive error scenario tests for AI providers
 * Tests various failure modes, network issues, and recovery patterns
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  OpenRouterProvider,
  AnthropicProvider,
  MultiProviderAIManager,
} from '@/ai-multi-provider';
import { AIRequest } from '@/ai-service';
import {
  MOCK_PROVIDER_CONFIGS,
  MOCK_AI_REQUESTS,
  createMockFetchResponse,
} from '../ai-operations/fixtures';

describe('AI Provider Error Scenarios', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  });

  describe('OpenRouter Provider Error Scenarios', () => {
    let provider: OpenRouterProvider;

    beforeEach(() => {
      provider = new OpenRouterProvider(MOCK_PROVIDER_CONFIGS.OPENROUTER);
    });

    describe('HTTP Error Responses', () => {
      it('should handle 401 Unauthorized errors', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse('{"error": "Invalid API key"}', 401, 'Unauthorized')
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('OpenRouter API error: 401');
        expect(response.error).toContain('Invalid API key');
        expect(response.processingTimeMs).toBeGreaterThan(0);
      });

      it('should handle 429 Rate Limit Exceeded', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse(
            '{"error": "Rate limit exceeded", "retry_after": 60}',
            429,
            'Too Many Requests'
          )
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('OpenRouter API error: 429');
        expect(response.error).toContain('Rate limit exceeded');
      });

      it('should handle 500 Internal Server Error', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse(
            '{"error": "Internal server error"}',
            500,
            'Internal Server Error'
          )
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('OpenRouter API error: 500');
      });

      it('should handle 502 Bad Gateway', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse('<html>502 Bad Gateway</html>', 502, 'Bad Gateway')
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('OpenRouter API error: 502');
      });

      it('should handle 503 Service Unavailable', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse(
            '{"error": "Service temporarily unavailable"}',
            503,
            'Service Unavailable'
          )
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('OpenRouter API error: 503');
      });
    });

    describe('Network and Connection Errors', () => {
      it('should handle network timeouts', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toBe('Request timeout');
        expect(response.content).toBe('');
        expect(response.processingTimeMs).toBeGreaterThan(0);
      });

      it('should handle DNS resolution failures', async () => {
        mockFetch.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND openrouter.ai'));

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('getaddrinfo ENOTFOUND');
      });

      it('should handle connection refused', async () => {
        mockFetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED 127.0.0.1:443'));

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('ECONNREFUSED');
      });

      it('should handle SSL certificate errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('certificate verify failed'));

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toBe('certificate verify failed');
      });
    });

    describe('Response Format Errors', () => {
      it('should handle malformed JSON responses', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse('This is not JSON', 200, 'OK')
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid response format from OpenRouter API');
      });

      it('should handle missing choices in response', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            usage: { total_tokens: 100 },
            // Missing choices array
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid response format from OpenRouter API');
      });

      it('should handle empty choices array', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            choices: [], // Empty array
            usage: { total_tokens: 100 },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid response format from OpenRouter API');
      });

      it('should handle missing message in choice', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            choices: [
              {
                // Missing message object
                finish_reason: 'stop',
              },
            ],
            usage: { total_tokens: 100 },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid response format from OpenRouter API');
      });
    });

    describe('Edge Case Responses', () => {
      it('should handle response with null content', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            choices: [
              {
                message: {
                  content: null, // Null content
                },
              },
            ],
            usage: { total_tokens: 5 },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toBe('null'); // Converted to string
        expect(response.tokensUsed).toBe(5);
      });

      it('should handle very large responses', async () => {
        const largeContent = 'A'.repeat(50000); // 50KB response
        
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            choices: [
              {
                message: {
                  content: largeContent,
                },
              },
            ],
            usage: { total_tokens: 15000 },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toHaveLength(50000);
        expect(response.cost).toBeCloseTo(0.03, 2); // 15000 tokens * 0.002
      });

      it('should handle response with missing usage data', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            choices: [
              {
                message: {
                  content: 'Test response',
                },
              },
            ],
            // Missing usage object
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toBe('Test response');
        expect(response.tokensUsed).toBeUndefined();
        expect(response.cost).toBeUndefined();
      });
    });
  });

  describe('Anthropic Provider Error Scenarios', () => {
    let provider: AnthropicProvider;

    beforeEach(() => {
      provider = new AnthropicProvider(MOCK_PROVIDER_CONFIGS.ANTHROPIC);
    });

    describe('Anthropic-Specific Errors', () => {
      it('should handle API key validation errors', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse(
            '{"type": "error", "error": {"type": "authentication_error", "message": "invalid x-api-key"}}',
            401,
            'Unauthorized'
          )
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Anthropic API error: 401');
      });

      it('should handle content filtering errors', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse(
            '{"type": "error", "error": {"type": "invalid_request_error", "message": "Content filtered due to policy violations"}}',
            400,
            'Bad Request'
          )
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Inappropriate content here',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Anthropic API error: 400');
        expect(response.error).toContain('Content filtered');
      });

      it('should handle token limit exceeded', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse(
            '{"type": "error", "error": {"type": "invalid_request_error", "message": "Request too long"}}',
            400,
            'Bad Request'
          )
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Very long prompt...',
          maxTokens: 200000, // Exceeds limits
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Request too long');
      });

      it('should handle invalid model errors', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse(
            '{"type": "error", "error": {"type": "invalid_request_error", "message": "model: field required"}}',
            400,
            'Bad Request'
          )
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'invalid-model-name',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('model: field required');
      });
    });

    describe('Anthropic Response Format Errors', () => {
      it('should handle missing content array', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            // Missing content array
            usage: { input_tokens: 10, output_tokens: 20 },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid response format from Anthropic API');
      });

      it('should handle empty content array', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            content: [], // Empty array
            usage: { input_tokens: 10, output_tokens: 20 },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid response format from Anthropic API');
      });

      it('should handle content without text field', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            content: [
              {
                type: 'text',
                // Missing text field
              },
            ],
            usage: { input_tokens: 10, output_tokens: 20 },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid response format from Anthropic API');
      });
    });

    describe('Cost Calculation Edge Cases', () => {
      it('should handle missing usage data gracefully', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            content: [
              {
                text: 'Test response without usage data',
              },
            ],
            // Missing usage object
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toBe('Test response without usage data');
        expect(response.tokensUsed).toBeUndefined();
        expect(response.cost).toBeUndefined();
      });

      it('should handle partial usage data', async () => {
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse({
            content: [
              {
                text: 'Test response',
              },
            ],
            usage: {
              input_tokens: 50,
              // Missing output_tokens
            },
          })
        );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await provider.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.tokensUsed).toBe(50);
        expect(response.cost).toBeDefined();
        expect(response.cost).toBeCloseTo(0.00015, 6); // Only input tokens
      });
    });
  });

  describe('MultiProviderAIManager Error Recovery', () => {
    let manager: MultiProviderAIManager;

    beforeEach(() => {
      manager = new MultiProviderAIManager();
    });

    describe('Provider Cascading Failures', () => {
      it('should try all providers when primary fails', async () => {
        // OpenRouter fails with 500
        mockFetch
          .mockResolvedValueOnce(createMockFetchResponse('Server Error', 500))
          // Anthropic succeeds
          .mockResolvedValueOnce(
            createMockFetchResponse({
              content: [{ text: 'Fallback response from Anthropic' }],
              usage: { input_tokens: 20, output_tokens: 30 },
            })
          );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet', // Supported by both providers
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toBe('Fallback response from Anthropic');
        
        // Should have tried both providers
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      it('should handle all providers failing', async () => {
        // Both providers fail
        mockFetch
          .mockResolvedValueOnce(createMockFetchResponse('OpenRouter Error', 500))
          .mockResolvedValueOnce(createMockFetchResponse('Anthropic Error', 503));

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('All AI providers failed');
        expect(response.error).toContain('Last error:');
      });

      it('should handle provider network exceptions during fallback', async () => {
        // OpenRouter throws exception
        mockFetch
          .mockRejectedValueOnce(new Error('Network timeout'))
          // Anthropic succeeds
          .mockResolvedValueOnce(
            createMockFetchResponse({
              content: [{ text: 'Recovery after network error' }],
              usage: { input_tokens: 15, output_tokens: 25 },
            })
          );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toBe('Recovery after network error');
      });

      it('should skip providers that do not support the model', async () => {
        // Request OpenRouter-specific model
        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'openai/gpt-4.1-nano', // Only OpenRouter supports this
          prompt: 'Test prompt',
        } as AIRequest;

        // OpenRouter fails
        mockFetch.mockResolvedValueOnce(
          createMockFetchResponse('Rate Limited', 429)
        );

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('All AI providers failed');
        
        // Should only call OpenRouter (Anthropic doesn't support the model)
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    describe('Provider Selection Logic', () => {
      it('should maintain provider priority during failures', async () => {
        const callOrder = [];

        // Track which provider is called by URL
        mockFetch.mockImplementation((url) => {
          if (typeof url === 'string') {
            if (url.includes('openrouter.ai')) {
              callOrder.push('OpenRouter');
              return Promise.resolve(createMockFetchResponse('Error', 500));
            } else if (url.includes('anthropic.com')) {
              callOrder.push('Anthropic');
              return Promise.resolve(
                createMockFetchResponse({
                  content: [{ text: 'Success from Anthropic' }],
                  usage: { input_tokens: 10, output_tokens: 15 },
                })
              );
            }
          }
          return Promise.reject(new Error('Unknown URL'));
        });

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(true);
        expect(callOrder).toEqual(['OpenRouter', 'Anthropic']); // Priority order maintained
      });

      it('should handle providers with inconsistent response formats', async () => {
        // OpenRouter returns non-standard format
        mockFetch
          .mockResolvedValueOnce(
            createMockFetchResponse({
              // Missing expected structure
              data: 'Unexpected format',
            })
          )
          // Anthropic returns proper format
          .mockResolvedValueOnce(
            createMockFetchResponse({
              content: [{ text: 'Proper Anthropic response' }],
              usage: { input_tokens: 20, output_tokens: 30 },
            })
          );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toBe('Proper Anthropic response');
      });
    });

    describe('Error Message Aggregation', () => {
      it('should provide meaningful error messages for different failure types', async () => {
        // Different error types from different providers
        mockFetch
          .mockRejectedValueOnce(new Error('Connection timeout to OpenRouter'))
          .mockResolvedValueOnce(
            createMockFetchResponse('{"error": "API key invalid"}', 401)
          );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(false);
        expect(response.error).toContain('All AI providers failed');
        expect(response.error).toContain('Last error:');
        // Should contain the last provider's error details
        expect(response.error).toContain('Anthropic API error: 401');
      });

      it('should handle providers with partial success indicators', async () => {
        // Provider returns 200 OK but with error content
        mockFetch
          .mockResolvedValueOnce(
            createMockFetchResponse({
              error: 'Model overloaded',
              status: 'error',
            })
          )
          .mockResolvedValueOnce(
            createMockFetchResponse({
              content: [{ text: 'Success from second provider' }],
              usage: { input_tokens: 5, output_tokens: 10 },
            })
          );

        const request: AIRequest = {
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet',
          prompt: 'Test prompt',
        } as AIRequest;

        const response = await manager.sendRequest(request);

        expect(response.success).toBe(true);
        expect(response.content).toBe('Success from second provider');
      });
    });
  });

  describe('Resource Management Under Errors', () => {
    it('should track failed request metrics correctly', async () => {
      const provider = new OpenRouterProvider(MOCK_PROVIDER_CONFIGS.OPENROUTER);
      
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse('Server Error', 500)
      );

      const startTime = Date.now();
      const response = await provider.sendRequest({
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
      } as AIRequest);

      expect(response.success).toBe(false);
      expect(response.processingTimeMs).toBeGreaterThan(0);
      expect(response.processingTimeMs).toBeLessThan(Date.now() - startTime + 100);
      expect(response.tokensUsed).toBeUndefined();
      expect(response.cost).toBeUndefined();
    });

    it('should handle memory pressure during large error responses', async () => {
      const largeErrorMessage = 'E'.repeat(100000); // 100KB error
      
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse(largeErrorMessage, 500)
      );

      const provider = new OpenRouterProvider(MOCK_PROVIDER_CONFIGS.OPENROUTER);
      const response = await provider.sendRequest({
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
      } as AIRequest);

      expect(response.success).toBe(false);
      expect(response.error).toContain('OpenRouter API error: 500');
      expect(response.error.length).toBeGreaterThan(100000);
    });
  });
});