/**
 * Multi-Provider AI Service
 * Supports OpenRouter (primary) and Anthropic Claude (fallback) integrations
 */

import { ConvexError } from "convex/values";
import { AIRequest, AIResponse, generateCorrelationId } from "./aiService";

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
      const payload = {
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
      'openai/gpt-4.1-nano': 0.002,
      'openai/gpt-4': 0.03,
      'openai/gpt-4o-mini': 0.00015,
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
        models: ['openai/gpt-4.1-nano', 'openai/gpt-4', 'openai/gpt-4o-mini'],
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
   * Send request with provider fallback logic
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const enabledProviders = this.providers.filter(p => p.isEnabled());
    
    if (enabledProviders.length === 0) {
      return {
        correlationId: request.correlationId,
        content: '',
        model: request.model,
        processingTimeMs: 0,
        success: false,
        error: 'No AI providers available',
      };
    }

    let lastError: string = '';

    // Try each provider in priority order
    for (const provider of enabledProviders) {
      try {
        console.log(`Attempting request with provider: ${provider.getName()}`);
        
        // Check if provider supports the requested model
        if (!provider.supportsModel(request.model)) {
          console.log(`Provider ${provider.getName()} does not support model ${request.model}`);
          continue;
        }

        const response = await provider.sendRequest(request);
        
        if (response.success) {
          console.log(`Request successful with provider: ${provider.getName()}`);
          return response;
        } else {
          lastError = response.error || 'Unknown error';
          console.warn(`Provider ${provider.getName()} failed:`, lastError);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        lastError = errorMessage;
        console.error(`Provider ${provider.getName()} threw error:`, errorMessage);
      }
    }

    // All providers failed
    return {
      correlationId: request.correlationId,
      content: '',
      model: request.model,
      processingTimeMs: 0,
      success: false,
      error: `All AI providers failed. Last error: ${lastError}`,
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