// @ts-nocheck
/**
 * Comprehensive tests for lib/config.ts
 * Tests: environment validation, API key validation, model selection, caching
 */

import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { mockConfigurations } from '../fixtures/testData';

// Import functions to test
import {
  loadConfig,
  getConfig,
  resetConfig,
  validateConfig,
  getModelInfo,
  selectModel,
  SUPPORTED_MODELS,
  type AppConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type LLMConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type VectorizeConfig,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type ModelInfo,
} from '@convex/lib/config';

describe('Configuration Management', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Reset config cache
    resetConfig();

    // Clear console mocks
    jest.clearAllMocks();

    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.OPENROUTER_API_KEY = 'test-openrouter-key-1234567890';
    process.env.OPENAI_API_KEY = 'test-openai-key-sk-1234567890';
    process.env.CLOUDFLARE_ACCOUNT_ID = 'test-cloudflare-account-123';
    process.env.CLOUDFLARE_API_TOKEN = 'test-cloudflare-token-456';
    process.env.VECTORIZE_DATABASE_ID = 'test-vectorize-db-789';
    process.env.LLM_MODEL = 'anthropic/claude-3-haiku';
    process.env.LLM_FALLBACK_MODEL = 'openai/gpt-4o-mini';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    resetConfig();
    jest.restoreAllMocks();
  });

  describe('loadConfig', () => {
    describe('Successful Configuration Loading', () => {
      it('should load complete configuration from environment', () => {
        const config = loadConfig();

        expect(config).toMatchObject({
          llm: {
            openRouterApiKey: 'test-openrouter-key-1234567890',
            defaultModel: 'anthropic/claude-3-haiku',
            fallbackModel: 'openai/gpt-4o-mini',
            openAiApiKey: 'test-openai-key-sk-1234567890',
          },
          vectorize: {
            accountId: 'test-cloudflare-account-123',
            apiToken: 'test-cloudflare-token-456',
            databaseId: 'test-vectorize-db-789',
          },
          environment: 'test',
        });
      });

      it('should handle missing optional OpenAI key', () => {
        delete process.env.OPENAI_API_KEY;

        const config = loadConfig();

        expect(config.llm.openAiApiKey).toBe('');
        expect(config.llm.openRouterApiKey).toBe(
          'test-openrouter-key-1234567890'
        );
      });

      it('should handle missing optional Vectorize config', () => {
        delete process.env.CLOUDFLARE_ACCOUNT_ID;
        delete process.env.CLOUDFLARE_API_TOKEN;
        delete process.env.VECTORIZE_DATABASE_ID;

        const config = loadConfig();

        expect(config.vectorize).toEqual({
          accountId: '',
          apiToken: '',
          databaseId: '',
        });
      });

      it('should use default models when not specified', () => {
        delete process.env.LLM_MODEL;
        delete process.env.LLM_FALLBACK_MODEL;

        const config = loadConfig();

        expect(config.llm.defaultModel).toBe('anthropic/claude-3-haiku');
        expect(config.llm.fallbackModel).toBe('openai/gpt-4o-mini');
      });

      it('should handle different environments', () => {
        const environments = ['development', 'production', 'test'];

        environments.forEach(env => {
          process.env.NODE_ENV = env;
          resetConfig();

          const config = loadConfig();
          expect(config.environment).toBe(env);
        });
      });

      it('should default to development environment', () => {
        delete process.env.NODE_ENV;
        resetConfig();

        const config = loadConfig();
        expect(config.environment).toBe('development');
      });
    });

    describe('Required Environment Variable Validation', () => {
      it('should throw error for missing OPENROUTER_API_KEY', () => {
        delete process.env.OPENROUTER_API_KEY;

        expect(() => loadConfig()).toThrow(
          'Required environment variable OPENROUTER_API_KEY is not set'
        );
      });

      it('should throw error for empty OPENROUTER_API_KEY', () => {
        process.env.OPENROUTER_API_KEY = '';

        expect(() => loadConfig()).toThrow(
          'Required environment variable OPENROUTER_API_KEY is not set'
        );
      });

      it('should throw error for whitespace-only OPENROUTER_API_KEY', () => {
        process.env.OPENROUTER_API_KEY = '   ';

        expect(() => loadConfig()).toThrow(
          'Required environment variable OPENROUTER_API_KEY is not set'
        );
      });
    });

    describe('API Key Validation', () => {
      it('should validate OpenRouter API key format', () => {
        // Valid key should not throw
        expect(() => loadConfig()).not.toThrow();
      });

      it('should reject too short OpenRouter API key', () => {
        process.env.OPENROUTER_API_KEY = 'short';

        expect(() => loadConfig()).toThrow(
          'OPENROUTER_API_KEY appears to be invalid (too short)'
        );
      });

      it('should reject placeholder OpenRouter API key', () => {
        const placeholders = [
          'your_api_key_here',
          'placeholder',
          'test',
          'dummy',
          'YOUR_API_KEY_HERE',
        ];

        placeholders.forEach(placeholder => {
          process.env.OPENROUTER_API_KEY = placeholder;
          resetConfig();

          expect(() => loadConfig()).toThrow(
            'OPENROUTER_API_KEY appears to be a placeholder value'
          );
        });
      });

      it('should validate OpenAI API key when present', () => {
        process.env.OPENAI_API_KEY = 'sk-valid-openai-key-1234567890';

        expect(() => loadConfig()).not.toThrow();
      });

      it('should reject invalid OpenAI API key format', () => {
        process.env.OPENAI_API_KEY = 'invalid';

        expect(() => loadConfig()).toThrow(
          'OPENAI_API_KEY appears to be invalid (too short)'
        );
      });

      it('should reject placeholder OpenAI API key', () => {
        process.env.OPENAI_API_KEY = 'your_api_key_here';

        expect(() => loadConfig()).toThrow(
          'OPENAI_API_KEY appears to be a placeholder value'
        );
      });
    });

    describe('Configuration Logging', () => {
      it('should log configuration without sensitive data', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        loadConfig();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Configuration loaded:',
          expect.objectContaining({
            environment: 'test',
            defaultModel: 'anthropic/claude-3-haiku',
            fallbackModel: 'openai/gpt-4o-mini',
            hasOpenRouterKey: true,
            hasOpenAiKey: true,
            hasVectorizeConfig: true,
          })
        );

        // Should not log actual API keys
        const logCalls = consoleSpy.mock.calls;
        const loggedData = JSON.stringify(logCalls);
        expect(loggedData).not.toContain('test-openrouter-key');
        expect(loggedData).not.toContain('test-openai-key');
        expect(loggedData).not.toContain('test-cloudflare-token');
      });
    });
  });

  describe('getConfig (Caching)', () => {
    it('should cache configuration after first load', () => {
      // Reset cache first
      resetConfig();

      // First call should load
      const config1 = getConfig();
      expect(config1).toBeTruthy();

      // Second call should use cache (same object)
      const config2 = getConfig();
      expect(config1).toBe(config2); // Same object reference
    });

    it('should reload after cache reset', () => {
      const loadConfigSpy = jest.spyOn(
        require('@convex/lib/config'),
        'loadConfig'
      );

      // First load
      getConfig();
      expect(loadConfigSpy).toHaveBeenCalledTimes(1);

      // Reset cache
      resetConfig();

      // Should reload
      getConfig();
      expect(loadConfigSpy).toHaveBeenCalledTimes(2);
    });

    it('should validate config on first load', () => {
      const validateConfigSpy = jest.spyOn(
        require('@convex/lib/config'),
        'validateConfig'
      );

      getConfig();

      expect(validateConfigSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateConfig', () => {
    describe('Valid Configurations', () => {
      it('should validate complete configuration', () => {
        const config = mockConfigurations.complete;

        expect(() => validateConfig(config)).not.toThrow();
      });

      it('should validate configuration with missing optional OpenAI key', () => {
        const config = mockConfigurations.missingOpenAI;

        expect(() => validateConfig(config)).not.toThrow();
      });

      it('should validate configuration with missing Vectorize config', () => {
        const config = mockConfigurations.missingVectorize;

        expect(() => validateConfig(config)).not.toThrow();
      });
    });

    describe('Invalid Configurations', () => {
      it('should reject configuration without OpenRouter API key', () => {
        const config: AppConfig = {
          ...mockConfigurations.complete,
          llm: {
            ...mockConfigurations.complete.llm,
            openRouterApiKey: '',
          },
        };

        expect(() => validateConfig(config)).toThrow(
          'OpenRouter API key is required'
        );
      });
    });

    describe('Warning Messages', () => {
      it('should warn about unknown default model', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const config: AppConfig = {
          ...mockConfigurations.complete,
          llm: {
            ...mockConfigurations.complete.llm,
            defaultModel: 'unknown/model',
          },
        };

        validateConfig(config);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Unknown default model: unknown/model'
        );
      });

      it('should warn about unknown fallback model', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const config: AppConfig = {
          ...mockConfigurations.complete,
          llm: {
            ...mockConfigurations.complete.llm,
            fallbackModel: 'unknown/fallback',
          },
        };

        validateConfig(config);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Unknown fallback model: unknown/fallback'
        );
      });

      it('should warn about missing OpenAI API key', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const config = mockConfigurations.missingOpenAI;

        validateConfig(config);

        expect(consoleSpy).toHaveBeenCalledWith(
          'OpenAI API key not configured - embedding generation will be skipped'
        );
      });

      it('should warn about incomplete Vectorize configuration', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const config = mockConfigurations.missingVectorize;

        validateConfig(config);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Vectorize configuration incomplete - vector storage will use placeholders'
        );
      });
    });
  });

  describe('Model Information and Selection', () => {
    describe('getModelInfo', () => {
      it('should return model info for valid model IDs', () => {
        const claudeInfo = getModelInfo('anthropic/claude-3-haiku');

        expect(claudeInfo).toMatchObject({
          id: 'anthropic/claude-3-haiku',
          name: 'Claude 3 Haiku',
          provider: 'Anthropic',
          recommended: true,
        });
        expect(typeof claudeInfo!.costPer1kTokens).toBe('number');
        expect(typeof claudeInfo!.contextWindow).toBe('number');
      });

      it('should return null for unknown model IDs', () => {
        const unknownInfo = getModelInfo('unknown/model');
        expect(unknownInfo).toBeNull();
      });

      it('should handle empty or invalid model IDs', () => {
        expect(getModelInfo('')).toBeNull();
        expect(getModelInfo('invalid')).toBeNull();
        expect(getModelInfo('provider/')).toBeNull();
      });
    });

    describe('selectModel', () => {
      it('should select cost-effective model by default', () => {
        const selectedModel = selectModel();

        // Should select a recommended model within cost limits
        const modelInfo = getModelInfo(selectedModel);
        expect(modelInfo).toBeTruthy();
        expect(modelInfo!.recommended).toBe(true);
        expect(modelInfo!.costPer1kTokens).toBeLessThanOrEqual(0.001);
      });

      it('should prefer Claude for high-quality requirements', () => {
        const selectedModel = selectModel(true, 0.01); // High quality, higher budget

        const modelInfo = getModelInfo(selectedModel);
        expect(modelInfo).toBeTruthy();
        expect(modelInfo!.provider).toBe('Anthropic');
      });

      it('should respect cost constraints', () => {
        const lowBudgetModel = selectModel(false, 0.0001); // Very low budget

        const modelInfo = getModelInfo(lowBudgetModel);
        expect(modelInfo).toBeTruthy();
        expect(modelInfo!.costPer1kTokens).toBeLessThanOrEqual(0.0001);
      });

      it('should fall back to default when no models meet criteria', () => {
        const impossibleModel = selectModel(true, 0.00001); // Impossible budget

        // Should fall back to default
        expect(impossibleModel).toBe('anthropic/claude-3-haiku');
      });

      it('should handle edge case parameters', () => {
        // Zero budget
        const zeroBudget = selectModel(false, 0);
        expect(typeof zeroBudget).toBe('string');

        // Negative budget (should still work)
        const negativeBudget = selectModel(false, -1);
        expect(typeof negativeBudget).toBe('string');

        // Very high budget
        const highBudget = selectModel(true, 1000);
        const modelInfo = getModelInfo(highBudget);
        expect(modelInfo).toBeTruthy();
      });
    });

    describe('SUPPORTED_MODELS', () => {
      it('should contain expected models', () => {
        expect(SUPPORTED_MODELS.length).toBeGreaterThan(0);

        const modelIds = SUPPORTED_MODELS.map(m => m.id);
        expect(modelIds).toContain('anthropic/claude-3-haiku');
        expect(modelIds).toContain('openai/gpt-4o-mini');
      });

      it('should have consistent model structure', () => {
        SUPPORTED_MODELS.forEach(model => {
          expect(model).toHaveProperty('id');
          expect(model).toHaveProperty('name');
          expect(model).toHaveProperty('provider');
          expect(model).toHaveProperty('costPer1kTokens');
          expect(model).toHaveProperty('contextWindow');
          expect(model).toHaveProperty('recommended');

          expect(typeof model.id).toBe('string');
          expect(typeof model.name).toBe('string');
          expect(typeof model.provider).toBe('string');
          expect(typeof model.costPer1kTokens).toBe('number');
          expect(typeof model.contextWindow).toBe('number');
          expect(typeof model.recommended).toBe('boolean');

          expect(model.id.length).toBeGreaterThan(0);
          expect(model.name.length).toBeGreaterThan(0);
          expect(model.provider.length).toBeGreaterThan(0);
          expect(model.costPer1kTokens).toBeGreaterThan(0);
          expect(model.contextWindow).toBeGreaterThan(0);
        });
      });

      it('should have at least one recommended model', () => {
        const recommendedModels = SUPPORTED_MODELS.filter(m => m.recommended);
        expect(recommendedModels.length).toBeGreaterThan(0);
      });

      it('should include both Anthropic and OpenAI providers', () => {
        const providers = new Set(SUPPORTED_MODELS.map(m => m.provider));
        expect(providers.has('Anthropic')).toBe(true);
        expect(providers.has('OpenAI')).toBe(true);
      });
    });
  });

  describe('resetConfig', () => {
    it('should clear the configuration cache', () => {
      // Load config first
      getConfig();

      // Reset should clear cache
      resetConfig();

      // Next call should reload (tested indirectly through caching tests)
      const config = getConfig();
      expect(config).toBeTruthy();
    });

    it('should allow fresh configuration loading', () => {
      // Load with initial environment
      const config1 = getConfig();

      // Change environment
      process.env.LLM_MODEL = 'openai/gpt-4o';

      // Reset and reload
      resetConfig();
      const config2 = getConfig();

      expect(config2.llm.defaultModel).toBe('openai/gpt-4o');
      expect(config2.llm.defaultModel).not.toBe(config1.llm.defaultModel);
    });
  });

  describe('Global State Management', () => {
    it('should maintain global config as singleton within module', () => {
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2); // Same object reference
    });

    it('should isolate test environments', () => {
      // Each test should start with fresh config due to beforeEach reset
      const config = getConfig();

      expect(config.environment).toBe('test');
      expect(config.llm.openRouterApiKey).toBe(
        'test-openrouter-key-1234567890'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted environment variables gracefully', () => {
      // Test with binary data that might cause issues
      process.env.OPENROUTER_API_KEY =
        '\x00\x01\x02binary-data-test-key-1234567890';

      expect(() => loadConfig()).not.toThrow();
    });

    it('should handle very long environment variable values', () => {
      const longKey = 'test-key-' + 'a'.repeat(10000);
      process.env.OPENROUTER_API_KEY = longKey;

      const config = loadConfig();
      expect(config.llm.openRouterApiKey).toBe(longKey);
    });

    it('should handle special characters in environment variables', () => {
      const specialKey =
        'test-key-with-special-chars-@#$%^&*()_+-=[]{}|;:,.<>?~`';
      process.env.OPENROUTER_API_KEY = specialKey;

      const config = loadConfig();
      expect(config.llm.openRouterApiKey).toBe(specialKey);
    });

    it('should handle undefined process.env gracefully', () => {
      // Save original process.env
      const originalProcessEnv = process.env;

      try {
        // Set process.env to undefined (extreme edge case)
        (process as any).env = undefined;

        expect(() => loadConfig()).toThrow();
      } finally {
        // Restore process.env
        (process as any).env = originalProcessEnv;
      }
    });
  });

  describe('Integration with Knowledge Ingestion Service', () => {
    it('should provide complete configuration for document processing', () => {
      const config = getConfig();

      // Should have all necessary configuration for knowledge ingestion
      expect(config.llm.openRouterApiKey).toBeTruthy();
      expect(config.llm.defaultModel).toBeTruthy();
      expect(config.llm.fallbackModel).toBeTruthy();
      expect(config.environment).toBeTruthy();

      // Should be able to determine feature availability
      const hasEmbeddings = !!config.llm.openAiApiKey;
      const hasVectorStorage = !!(
        config.vectorize.accountId && config.vectorize.apiToken
      );

      expect(typeof hasEmbeddings).toBe('boolean');
      expect(typeof hasVectorStorage).toBe('boolean');
    });

    it('should support graceful degradation scenarios', () => {
      // Test configuration for different feature availability scenarios
      const scenarios = [
        mockConfigurations.complete,
        mockConfigurations.missingOpenAI,
        mockConfigurations.missingVectorize,
      ];

      scenarios.forEach(config => {
        expect(() => validateConfig(config)).not.toThrow();

        // Each scenario should still be usable for some level of processing
        expect(config.llm.openRouterApiKey).toBeTruthy();
        expect(config.llm.defaultModel).toBeTruthy();
      });
    });
  });
});
