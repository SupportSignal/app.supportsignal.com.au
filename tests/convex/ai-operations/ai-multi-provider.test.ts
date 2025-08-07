// @ts-nocheck
/**
 * Unit tests for multi-provider AI functionality
 * Tests OpenRouterProvider, AnthropicProvider, and MultiProviderAIManager
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  OpenRouterProvider,
  AnthropicProvider,
  MultiProviderAIManager,
  ProviderConfig,
} from '@/ai-multi-provider';
import { AIRequest, AIResponse } from '@/ai-service';
import {
  MOCK_PROVIDER_CONFIGS,
  MOCK_AI_REQUESTS,
  MOCK_AI_RESPONSES,
  createMockFetchResponse,
  setupMockAIProvider,
} from './fixtures';

describe('Multi-Provider AI System', () => {
  beforeEach(() => {
    // Reset environment variables for each test
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('OpenRouterProvider', () => {
    let provider: OpenRouterProvider;
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      provider = new OpenRouterProvider(MOCK_PROVIDER_CONFIGS.OPENROUTER);
    });

    it('should initialize with correct configuration', () => {
      expect(provider.getName()).toBe('OpenRouter');
      expect(provider.getPriority()).toBe(1);
      expect(provider.isEnabled()).toBe(true);
      expect(provider.supportsModel('openai/gpt-4.1-nano')).toBe(true);
      expect(provider.supportsModel('unsupported-model')).toBe(false);
    });

    it('should send successful request', async () => {
      const mockResponseData = {
        choices: [
          {
            message: {
              content: 'Test AI response content',
            },
          },
        ],
        usage: {
          total_tokens: 150,
        },
      };

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponseData));

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await provider.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Test AI response content');
      expect(response.tokensUsed).toBe(150);
      expect(response.cost).toBeCloseTo(0.0003, 6); // 150 tokens * 0.002 per 1k
      expect(response.processingTimeMs).toBeGreaterThan(0);
      expect(response.correlationId).toBe(request.correlationId);
    });

    it('should handle API errors correctly', async () => {
      const errorMessage = 'API key is invalid';
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse(errorMessage, 401, 'Unauthorized')
      );

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await provider.sendRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('OpenRouter API error: 401');
      expect(response.content).toBe('');
      expect(response.processingTimeMs).toBeGreaterThan(0);
    });

    it('should handle invalid response format', async () => {
      const invalidResponseData = {
        invalid: 'response structure',
      };

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(invalidResponseData));

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await provider.sendRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid response format from OpenRouter API');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await provider.sendRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toBe('Network connection failed');
    });

    it('should calculate costs for different models', async () => {
      const mockResponseData = {
        choices: [{ message: { content: 'Test' } }],
        usage: { total_tokens: 1000 },
      };

      mockFetch.mockResolvedValue(createMockFetchResponse(mockResponseData));

      // Test GPT-4 model (higher cost)
      const gpt4Request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'openai/gpt-4',
        prompt: 'Test',
      } as AIRequest;

      const gpt4Response = await provider.sendRequest(gpt4Request);
      expect(gpt4Response.cost).toBe(0.03); // 1000 tokens * 0.03 per 1k

      // Test GPT-4o-mini model (lower cost)
      const miniRequest: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'openai/gpt-4o-mini',
        prompt: 'Test',
      } as AIRequest;

      const miniResponse = await provider.sendRequest(miniRequest);
      expect(miniResponse.cost).toBe(0.00015); // 1000 tokens * 0.00015 per 1k
    });

    it('should send correct headers and payload', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          choices: [{ message: { content: 'Test' } }],
          usage: { total_tokens: 100 },
        })
      );

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
        temperature: 0.8,
        maxTokens: 1500,
      } as AIRequest;

      await provider.sendRequest(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-openrouter-key',
            'HTTP-Referer': 'https://supportsignal.com.au',
            'X-Title': 'SupportSignal AI Integration',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4.1-nano',
            messages: [
              {
                role: 'user',
                content: 'Test prompt',
              },
            ],
            temperature: 0.8,
            max_tokens: 1500,
          }),
        })
      );
    });
  });

  describe('AnthropicProvider', () => {
    let provider: AnthropicProvider;
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      provider = new AnthropicProvider(MOCK_PROVIDER_CONFIGS.ANTHROPIC);
    });

    it('should initialize with correct configuration', () => {
      expect(provider.getName()).toBe('Anthropic');
      expect(provider.getPriority()).toBe(2);
      expect(provider.isEnabled()).toBe(true);
      expect(provider.supportsModel('claude-3-sonnet')).toBe(true);
      expect(provider.supportsModel('openai/gpt-4')).toBe(false);
    });

    it('should send successful request with model mapping', async () => {
      const mockResponseData = {
        content: [
          {
            text: 'Test Anthropic response',
          },
        ],
        usage: {
          input_tokens: 50,
          output_tokens: 100,
        },
      };

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponseData));

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-sonnet', // Should map to claude-3-sonnet-20240229
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await provider.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Test Anthropic response');
      expect(response.tokensUsed).toBe(150); // input + output tokens
      expect(response.cost).toBeCloseTo(0.0015 + 0.0015, 6); // input cost + output cost
    });

    it('should handle different Claude models correctly', async () => {
      const mockResponseData = {
        content: [{ text: 'Test response' }],
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      mockFetch.mockResolvedValue(createMockFetchResponse(mockResponseData));

      // Test Claude 3 Haiku (cheaper)
      const haikuRequest: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-haiku',
        prompt: 'Test',
      } as AIRequest;

      const haikuResponse = await provider.sendRequest(haikuRequest);
      expect(haikuResponse.cost).toBeCloseTo(0.00025 + 0.00025, 6); // Haiku rates

      // Test Claude 3 Opus (more expensive)
      const opusRequest: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-opus',
        prompt: 'Test',
      } as AIRequest;

      const opusResponse = await provider.sendRequest(opusRequest);
      expect(opusResponse.cost).toBeCloseTo(0.015 + 0.075, 6); // Opus rates
    });

    it('should send correct Anthropic API format', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          content: [{ text: 'Test' }],
          usage: { input_tokens: 10, output_tokens: 20 },
        })
      );

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-haiku',
        prompt: 'Test prompt',
        temperature: 0.9,
        maxTokens: 2000,
      } as AIRequest;

      await provider.sendRequest(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307', // Mapped model name
            max_tokens: 2000,
            temperature: 0.9,
            messages: [
              {
                role: 'user',
                content: 'Test prompt',
              },
            ],
          }),
        })
      );
    });

    it('should handle Anthropic API errors', async () => {
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse('Rate limit exceeded', 429, 'Too Many Requests')
      );

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-sonnet',
        prompt: 'Test',
      } as AIRequest;

      const response = await provider.sendRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Anthropic API error: 429');
    });

    it('should handle invalid Anthropic response format', async () => {
      const invalidResponse = {
        invalid: 'structure without content array',
      };

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(invalidResponse));

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-sonnet',
        prompt: 'Test',
      } as AIRequest;

      const response = await provider.sendRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid response format from Anthropic API');
    });
  });

  describe('MultiProviderAIManager', () => {
    let manager: MultiProviderAIManager;

    beforeEach(() => {
      manager = new MultiProviderAIManager();
    });

    it('should initialize with available providers based on environment variables', () => {
      const status = manager.getProviderStatus();
      
      // Should have both providers when both API keys are present
      expect(status).toHaveLength(2);
      expect(status.find(p => p.name === 'OpenRouter')).toBeTruthy();
      expect(status.find(p => p.name === 'Anthropic')).toBeTruthy();
      
      // Should be sorted by priority
      expect(status[0].priority).toBeLessThan(status[1].priority);
    });

    it('should return available models from all providers', () => {
      const models = manager.getAvailableModels();
      
      expect(models).toContain('openai/gpt-4.1-nano');
      expect(models).toContain('openai/gpt-4');
      expect(models).toContain('claude-3-sonnet');
      expect(models).toContain('claude-3-haiku');
      expect(models.length).toBeGreaterThan(4);
    });

    it('should try providers in priority order', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // First provider (OpenRouter) fails
      mockFetch
        .mockResolvedValueOnce(createMockFetchResponse('Invalid API key', 401))
        // Second provider (Anthropic) succeeds
        .mockResolvedValueOnce(
          createMockFetchResponse({
            content: [{ text: 'Anthropic fallback response' }],
            usage: { input_tokens: 20, output_tokens: 30 },
          })
        );

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-sonnet', // Supported by both, but should fallback to Anthropic
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await manager.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Anthropic fallback response');
      
      // Should have tried both providers
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should skip providers that do not support the requested model', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // Only Anthropic supports claude-3-opus
      mockFetch.mockResolvedValueOnce(
        createMockFetchResponse({
          content: [{ text: 'Claude Opus response' }],
          usage: { input_tokens: 25, output_tokens: 35 },
        })
      );

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-opus', // Only supported by Anthropic
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await manager.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Claude Opus response');
      
      // Should only call Anthropic API, skip OpenRouter
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com'),
        expect.any(Object)
      );
    });

    it('should return error when no providers are available', () => {
      // Test with no API keys
      process.env.OPENROUTER_API_KEY = '';
      process.env.ANTHROPIC_API_KEY = '';
      
      const managerNoProviders = new MultiProviderAIManager();
      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        prompt: 'Test prompt',
      } as AIRequest;

      return managerNoProviders.sendRequest(request).then(response => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('No AI providers available');
        expect(response.processingTimeMs).toBe(0);
      });
    });

    it('should return error when all providers fail', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // Both providers fail
      mockFetch
        .mockResolvedValueOnce(createMockFetchResponse('API Error', 500))
        .mockResolvedValueOnce(createMockFetchResponse('API Error', 503));

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'openai/gpt-4.1-nano', // Supported by OpenRouter
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await manager.sendRequest(request);

      expect(response.success).toBe(false);
      expect(response.error).toContain('All AI providers failed');
      expect(response.error).toContain('Last error:');
    });

    it('should handle provider exceptions gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      // First provider throws exception
      mockFetch
        .mockRejectedValueOnce(new Error('Network timeout'))
        // Second provider succeeds
        .mockResolvedValueOnce(
          createMockFetchResponse({
            content: [{ text: 'Recovery response' }],
            usage: { input_tokens: 10, output_tokens: 15 },
          })
        );

      const request: AIRequest = {
        ...MOCK_AI_REQUESTS.CLARIFICATION,
        model: 'claude-3-sonnet',
        prompt: 'Test prompt',
      } as AIRequest;

      const response = await manager.sendRequest(request);

      expect(response.success).toBe(true);
      expect(response.content).toBe('Recovery response');
    });

    it('should work with only one provider available', () => {
      // Test with only OpenRouter
      process.env.ANTHROPIC_API_KEY = '';
      
      const singleProviderManager = new MultiProviderAIManager();
      const status = singleProviderManager.getProviderStatus();
      
      expect(status).toHaveLength(1);
      expect(status[0].name).toBe('OpenRouter');
    });

    it('should respect provider enabled/disabled state', () => {
      const status = manager.getProviderStatus();
      
      // All providers should be enabled by default
      status.forEach(provider => {
        expect(provider.enabled).toBe(true);
      });
      
      // Models should only come from enabled providers
      const models = manager.getAvailableModels();
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('Provider Base Class Functionality', () => {
    it('should correctly identify supported models', () => {
      const provider = new OpenRouterProvider(MOCK_PROVIDER_CONFIGS.OPENROUTER);
      
      // Exact matches
      expect(provider.supportsModel('openai/gpt-4.1-nano')).toBe(true);
      expect(provider.supportsModel('openai/gpt-4')).toBe(true);
      
      // Partial matches (model contains supported model)
      expect(provider.supportsModel('openai/gpt-4-latest')).toBe(true);
      
      // No matches
      expect(provider.supportsModel('claude-3-sonnet')).toBe(false);
      expect(provider.supportsModel('completely-different-model')).toBe(false);
    });

    it('should provide correct provider metadata', () => {
      const openrouterProvider = new OpenRouterProvider(MOCK_PROVIDER_CONFIGS.OPENROUTER);
      const anthropicProvider = new AnthropicProvider(MOCK_PROVIDER_CONFIGS.ANTHROPIC);
      
      expect(openrouterProvider.getName()).toBe('OpenRouter');
      expect(openrouterProvider.getPriority()).toBe(1);
      expect(openrouterProvider.isEnabled()).toBe(true);
      
      expect(anthropicProvider.getName()).toBe('Anthropic');
      expect(anthropicProvider.getPriority()).toBe(2);
      expect(anthropicProvider.isEnabled()).toBe(true);
    });
  });
});