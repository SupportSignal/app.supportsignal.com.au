/**
 * AI Provider Monitoring
 * Tracks provider health and usage statistics
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { aiManager } from "./aiMultiProvider";

/**
 * Get current provider status and configuration
 */
export const getProviderStatus = query({
  args: {},
  handler: async (ctx, args) => {
    const providers = aiManager.getProviderStatus();
    const availableModels = aiManager.getAvailableModels();
    
    return {
      providers,
      availableModels,
      timestamp: Date.now(),
      environment: {
        has_openrouter_key: !!process.env.OPENROUTER_API_KEY,
        has_anthropic_key: !!process.env.ANTHROPIC_API_KEY,
      },
    };
  },
});

/**
 * Test provider connectivity
 */
export const testProviderConnectivity = query({
  args: {
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const testModel = args.model || 'openai/gpt-4.1-nano';
    
    try {
      const testRequest = {
        correlationId: `test-${Date.now()}`,
        model: testModel,
        prompt: 'Test message - respond with "OK"',
        temperature: 0.1,
        maxTokens: 10,
        metadata: { test: true },
      };

      const response = await aiManager.sendRequest(testRequest);
      
      return {
        success: response.success,
        model: testModel,
        response_preview: response.success ? response.content.substring(0, 100) : null,
        error: response.error,
        processing_time_ms: response.processingTimeMs,
        tokens_used: response.tokensUsed,
        cost: response.cost,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        model: testModel,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  },
});

/**
 * Get AI operations health status
 */
export const getAIOperationsHealth = query({
  args: {},
  handler: async (ctx, args) => {
    const providers = aiManager.getProviderStatus();
    const enabledProviders = providers.filter(p => p.enabled);
    
    return {
      overall_status: enabledProviders.length > 0 ? 'healthy' : 'no_providers',
      provider_count: providers.length,
      enabled_provider_count: enabledProviders.length,
      providers: providers.map(provider => ({
        name: provider.name,
        enabled: provider.enabled,
        priority: provider.priority,
        model_count: provider.models.length,
        primary_models: provider.models.slice(0, 3), // First 3 models
      })),
      recommended_test: {
        suggested_model: 'openai/gpt-4.1-nano',
        test_endpoint: 'testProviderConnectivity',
      },
      timestamp: Date.now(),
    };
  },
});