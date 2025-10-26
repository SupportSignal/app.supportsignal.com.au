/**
 * Multi-Provider AI Service
 * Supports OpenRouter (primary) and Anthropic Claude (fallback) integrations
 */

import { ConvexError } from "convex/values";
import { AIRequest, AIResponse, generateCorrelationId } from "./aiService";
import { getConfig } from "./lib/config";

// Provider configuration
export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
  priority: number; // Lower number = higher priority
  enabled: boolean;
}

// Abstract AI Provider
export abstract class AIProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract sendRequest(request: AIRequest): Promise<AIResponse>;
  
  getName(): string {
    return this.config.name;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getPriority(): number {
    return this.config.priority;
  }

  supportsModel(model: string): boolean {
    return this.config.models.some(supportedModel => 
      supportedModel === model || model.includes(supportedModel)
    );
  }
}

/**
 * OpenRouter Provider
 */
export class OpenRouterProvider extends AIProvider {
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const payload: Record<string, any> = {
        model: request.model,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
      };

      // Add structured outputs if schema provided (Story 6.5)
      if (request.outputSchema) {
        payload.response_format = {
          type: 'json_schema',
          json_schema: request.outputSchema,
        };
      }

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://supportsignal.com.au',
          'X-Title': 'SupportSignal AI Integration',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        correlationId: request.correlationId,
        content: data.choices[0].message.content,
        model: request.model,
        tokensUsed: data.usage?.total_tokens,
        processingTimeMs,
        cost: this.calculateCost(data.usage?.total_tokens, request.model),
        success: true,
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      return {
        correlationId: request.correlationId,
        content: '',
        model: request.model,
        processingTimeMs,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OpenRouter error',
      };
    }
  }

  private calculateCost(tokens?: number, model?: string): number | undefined {
    if (!tokens) return undefined;
    
    const ratesPer1KTokens: Record<string, number> = {
      'openai/gpt-5-nano': 0.00005,  // $0.05/M input tokens
      'openai/gpt-5-mini': 0.00025,  // $0.25/M input tokens  
      'openai/gpt-5-chat': 0.00125,  // $1.25/M input tokens
      'openai/gpt-5': 0.00125,       // $1.25/M input tokens
      'openai/gpt-4.1-nano': 0.002,
      'openai/gpt-4': 0.03,
      'openai/gpt-4o-mini': 0.00015,
      'openai/gpt-4o': 0.005,
      'anthropic/claude-3-haiku': 0.00025,
      'anthropic/claude-3-sonnet': 0.003,
    };
    
    const rate = ratesPer1KTokens[model || ''] || 0.002;
    return (tokens / 1000) * rate;
  }
}

/**
 * Anthropic Claude Provider
 */
export class AnthropicProvider extends AIProvider {
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Map model names for Anthropic
      const modelMap: Record<string, string> = {
        'claude-3-sonnet': 'claude-3-sonnet-20240229',
        'claude-3-haiku': 'claude-3-haiku-20240307',
        'claude-3-opus': 'claude-3-opus-20240229',
      };

      const anthropicModel = modelMap[request.model] || 'claude-3-sonnet-20240229';

      const payload = {
        model: anthropicModel,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      };

      const response = await fetch(`${this.config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Anthropic API');
      }

      const processingTimeMs = Date.now() - startTime;

      return {
        correlationId: request.correlationId,
        content: data.content[0].text,
        model: request.model,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
        processingTimeMs,
        cost: this.calculateCost(
          data.usage?.input_tokens, 
          data.usage?.output_tokens, 
          anthropicModel
        ),
        success: true,
      };

    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      return {
        correlationId: request.correlationId,
        content: '',
        model: request.model,
        processingTimeMs,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Anthropic error',
      };
    }
  }

  private calculateCost(inputTokens?: number, outputTokens?: number, model?: string): number | undefined {
    if (!inputTokens && !outputTokens) return undefined;
    
    const rates: Record<string, { input: number; output: number }> = {
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    };
    
    const rate = rates[model || ''] || rates['claude-3-sonnet-20240229'];
    const inputCost = ((inputTokens || 0) / 1000) * rate.input;
    const outputCost = ((outputTokens || 0) / 1000) * rate.output;
    
    return inputCost + outputCost;
  }
}

/**
 * Multi-Provider AI Manager
 */
export class MultiProviderAIManager {
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenRouter provider (primary)
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (openrouterApiKey) {
      this.providers.push(new OpenRouterProvider({
        name: 'OpenRouter',
        apiKey: openrouterApiKey,
        baseUrl: 'https://openrouter.ai/api/v1',
        models: [
          // OpenAI models
          'openai/gpt-5-nano', 'openai/gpt-5-mini', 'openai/gpt-5-chat', 'openai/gpt-5',
          'openai/gpt-4.1-nano', 'openai/gpt-4', 'openai/gpt-4o-mini', 'openai/gpt-4o',
          // Anthropic models - using actual OpenRouter model IDs
          'anthropic/claude-3-haiku', 'anthropic/claude-3.5-haiku',
          'anthropic/claude-3.5-sonnet', 'anthropic/claude-sonnet-4', 'anthropic/claude-sonnet-4.5',
          'anthropic/claude-haiku-4.5',
        ],
        priority: 1,
        enabled: true,
      }));
    }

    // Initialize Anthropic provider (fallback)
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicApiKey) {
      this.providers.push(new AnthropicProvider({
        name: 'Anthropic',
        apiKey: anthropicApiKey,
        baseUrl: 'https://api.anthropic.com/v1',
        models: ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus'],
        priority: 2,
        enabled: true,
      }));
    }

    // Sort providers by priority
    this.providers.sort((a, b) => a.getPriority() - b.getPriority());
  }

  /**
   * Send request with smart fallback logic using configured models
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const enabledProviders = this.providers.filter(p => p.isEnabled());
    
    if (enabledProviders.length === 0) {
      console.error("🚨 AI CONFIGURATION ERROR: No AI providers available", {
        correlationId: request.correlationId,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      });
      
      return {
        correlationId: request.correlationId,
        content: '',
        model: request.model,
        processingTimeMs: 0,
        success: false,
        error: 'CONFIGURATION ERROR: No AI providers configured. Please verify OPENROUTER_API_KEY is set.',
      };
    }

    const config = getConfig();
    let lastError: string = '';
    let modelsToTry: string[] = [];

    // Build fallback model chain: requested model → fallback model
    modelsToTry.push(request.model);
    if (request.model !== config.llm.fallbackModel) {
      modelsToTry.push(config.llm.fallbackModel);
    }

    console.log("🔧 AI FALLBACK CHAIN", {
      requestedModel: request.model,
      fallbackModel: config.llm.fallbackModel,
      modelsToTry,
      correlationId: request.correlationId,
    });

    // Try each model in the fallback chain
    for (let modelIndex = 0; modelIndex < modelsToTry.length; modelIndex++) {
      const modelToTry = modelsToTry[modelIndex];
      const isMainModel = modelIndex === 0;
      const isFallbackModel = !isMainModel;

      console.log(`🚀 Attempting ${isMainModel ? 'primary' : 'fallback'} model: ${modelToTry}`, {
        correlationId: request.correlationId,
        attemptNumber: modelIndex + 1,
        totalAttempts: modelsToTry.length,
      });

      // Try each provider for this model
      for (const provider of enabledProviders) {
        try {
          // Check if provider supports the model
          if (!provider.supportsModel(modelToTry)) {
            console.log(`Provider ${provider.getName()} does not support model ${modelToTry}`);
            continue;
          }

          // Create request with current model
          const modelRequest: AIRequest = {
            ...request,
            model: modelToTry,
          };

          const response = await provider.sendRequest(modelRequest);
          
          if (response.success) {
            console.log(`✅ Request successful with provider: ${provider.getName()}, model: ${modelToTry}`, {
              correlationId: request.correlationId,
              usedFallback: isFallbackModel,
              processingTimeMs: response.processingTimeMs,
            });
            return response;
          } else {
            lastError = response.error || 'Unknown error';
            console.warn(`❌ Provider ${provider.getName()} failed for model ${modelToTry}:`, lastError);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          lastError = errorMessage;
          console.error(`💥 Provider ${provider.getName()} threw error for model ${modelToTry}:`, errorMessage);
        }
      }

      // Log fallback transition
      if (isMainModel) {
        console.warn(`🔄 Primary model ${modelToTry} failed across all providers, trying fallback model: ${config.llm.fallbackModel}`);
      }
    }

    // All models and providers failed
    const errorMessage = `SYSTEM ERROR: Both primary model (${request.model}) and fallback model (${config.llm.fallbackModel}) failed across all providers. Last error: ${lastError}`;
    
    console.error("🚨 COMPLETE AI SYSTEM FAILURE", {
      correlationId: request.correlationId,
      requestedModel: request.model,
      fallbackModel: config.llm.fallbackModel,
      availableProviders: enabledProviders.map(p => p.getName()),
      lastError,
    });

    return {
      correlationId: request.correlationId,
      content: '',
      model: request.model,
      processingTimeMs: 0,
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Get provider status for monitoring
   */
  getProviderStatus(): Array<{
    name: string;
    enabled: boolean;
    priority: number;
    models: string[];
  }> {
    return this.providers.map(provider => ({
      name: provider.getName(),
      enabled: provider.isEnabled(),
      priority: provider.getPriority(),
      models: provider['config'].models,
    }));
  }

  /**
   * Get available models across all providers
   */
  getAvailableModels(): string[] {
    const models = new Set<string>();
    
    this.providers
      .filter(p => p.isEnabled())
      .forEach(provider => {
        provider['config'].models.forEach(model => models.add(model));
      });
    
    return Array.from(models);
  }
}

// Export singleton instance
export const aiManager = new MultiProviderAIManager();