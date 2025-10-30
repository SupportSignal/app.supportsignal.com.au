/**
 * AI Service Integration Layer
 * Provides OpenRouter API client integration with correlation ID tracking,
 * logging, performance metrics, and cost tracking
 */

import { ConvexError } from "convex/values";

// AI Service Configuration
export interface AIServiceConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxRetries: number;
  timeoutMs: number;
}

// AI Request/Response Types
export interface AIRequest {
  correlationId: string;
  model: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
  // Structured outputs support (Story 6.5)
  outputSchema?: {
    name: string;
    strict: boolean;
    schema: Record<string, any>;
  };
}

export interface AIResponse {
  correlationId: string;
  content: string;
  model: string;
  tokensUsed?: number;
  processingTimeMs: number;
  cost?: number;
  success: boolean;
  error?: string;
  finishReason?: string; // OpenRouter finish_reason: "stop" (normal), "length" (truncated), "content_filter"
}

export interface AIMetrics {
  requestCount: number;
  totalCost: number;
  averageResponseTime: number;
  successRate: number;
  errorCount: number;
}

// Default OpenRouter configuration
const DEFAULT_AI_CONFIG: Omit<AIServiceConfig, 'apiKey'> = {
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'openai/gpt-5-nano', // Updated to match current config
  maxRetries: 3,
  timeoutMs: 30000,
};

/**
 * OpenRouter API Client
 * Handles all communication with OpenRouter API
 */
export class OpenRouterClient {
  private config: AIServiceConfig;
  
  constructor(apiKey: string, config?: Partial<AIServiceConfig>) {
    this.config = {
      ...DEFAULT_AI_CONFIG,
      apiKey,
      ...config,
    };
  }

  /**
   * Send request to OpenRouter API with retry logic
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.makeAPICall(request);
        const processingTimeMs = Date.now() - startTime;

        // Log finish_reason for debugging and truncation detection
        if (response.finishReason) {
          console.log(`[${request.correlationId}] OpenRouter finish_reason: ${response.finishReason}`);
        }

        return {
          correlationId: request.correlationId,
          content: response.content,
          model: request.model,
          tokensUsed: response.usage?.total_tokens,
          processingTimeMs,
          cost: this.calculateCost(response.usage?.total_tokens, request.model),
          success: true,
          finishReason: response.finishReason, // Pass through finish_reason for truncation detection
        };
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries) {
          await this.wait(Math.pow(2, attempt) * 1000);
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;
    return {
      correlationId: request.correlationId,
      content: '',
      model: request.model,
      processingTimeMs,
      success: false,
      error: lastError?.message || 'Unknown error',
    };
  }

  /**
   * Make actual API call to OpenRouter
   */
  private async makeAPICall(request: AIRequest): Promise<any> {
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

    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      finishReason: data.choices[0].finish_reason, // Extract finish_reason for truncation detection
    };
  }

  /**
   * Calculate estimated cost based on token usage
   * Uses current model pricing from config
   */
  private calculateCost(tokens?: number, model?: string): number | undefined {
    if (!tokens) return undefined;
    
    const ratesPer1KTokens: Record<string, number> = {
      'openai/gpt-5-nano': 0.00005,
      'openai/gpt-4o-mini': 0.00015,
      'openai/gpt-5-mini': 0.00025,
      'anthropic/claude-3-haiku': 0.00025,
      'openai/gpt-4.1-nano': 0.002, // Legacy model
      'openai/gpt-4': 0.03,
      'anthropic/claude-3-sonnet': 0.003,
    };
    
    const rate = ratesPer1KTokens[model || ''] || 0.00005; // Default to cheapest model rate
    return (tokens / 1000) * rate;
  }

  /**
   * Wait utility for retry logic
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is within rate limits
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  /**
   * Get remaining requests for key
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

/**
 * Cost tracking utility
 */
export class CostTracker {
  private totalCost: number = 0;
  private requestCount: number = 0;
  private dailyLimit: number;

  constructor(dailyLimitUSD: number = 50) {
    this.dailyLimit = dailyLimitUSD;
  }

  /**
   * Track AI request cost
   */
  trackRequest(cost?: number): void {
    this.requestCount++;
    if (cost) {
      this.totalCost += cost;
    }
  }

  /**
   * Check if within daily cost limit
   */
  isWithinDailyLimit(): boolean {
    return this.totalCost < this.dailyLimit;
  }

  /**
   * Get current metrics
   */
  getMetrics(): { totalCost: number; requestCount: number; remainingBudget: number } {
    return {
      totalCost: this.totalCost,
      requestCount: this.requestCount,
      remainingBudget: this.dailyLimit - this.totalCost,
    };
  }
}

/**
 * Circuit breaker states
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, requests blocked
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker for AI services
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeoutMs: number;

  constructor(
    failureThreshold: number = 5,    // Open after 5 failures
    successThreshold: number = 3,    // Close after 3 successes
    timeoutMs: number = 60000        // Wait 1 minute before half-open
  ) {
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Check if request should be allowed through
   */
  canExecute(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.timeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        return true;
      }
      return false;
    }

    // HALF_OPEN state - allow limited requests
    return true;
  }

  /**
   * Record successful execution
   */
  recordSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  /**
   * Record failed execution
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

/**
 * Fallback response generator
 */
export class FallbackHandler {
  /**
   * Generate fallback response for clarification questions
   */
  static generateClarificationQuestionsFallback(input: {
    participant_name: string;
    reporter_name: string;
    event_datetime: string;
    location: string;
  }) {
    return {
      clarification_questions: {
        before_event: [
          "What was the participant doing in the hour before the incident?",
          "Were there any unusual circumstances or changes to routine before the event?"
        ],
        during_event: [
          "Can you describe the sequence of events during the incident?",
          "Were there any witnesses present during the event?"
        ],
        end_of_event: [
          "How did the incident conclude?",
          "What immediate actions were taken to address the situation?"
        ],
        post_event_support: [
          "What support was provided to the participant after the incident?",
          "Were any follow-up actions or referrals made?"
        ]
      },
      metadata: {
        processed_at: new Date().toISOString(),
        status: 'fallback_response',
        report_context: {
          participant_name: input.participant_name,
          reporter_name: input.reporter_name,
          event_datetime: input.event_datetime,
          location: input.location,
        },
        correlation_id: generateCorrelationId(),
        processing_time_ms: 0,
        tokens_used: 0,
        cost: 0,
        fallback_reason: 'AI service unavailable - using predefined questions',
      },
    };
  }

  /**
   * Generate fallback response for narrative enhancement
   */
  static enhanceNarrativeContentFallback(input: {
    phase: string;
    instruction: string;
    answers: Array<{ question: string; answer: string }>;
  }) {
    const processedAnswers = input.answers
      .filter(item => item.question?.trim() && item.answer?.trim())
      .map(item => `Q: ${item.question.trim()}\nA: ${item.answer.trim()}`)
      .join('\n\n');

    return {
      output: processedAnswers || 'No valid question-answer pairs provided.',
      narrative: processedAnswers || 'No valid question-answer pairs provided.',
      metadata: {
        processed_at: new Date().toISOString(),
        status: 'fallback_response',
        phase: input.phase,
        answers_processed: input.answers.length,
        correlation_id: generateCorrelationId(),
        processing_time_ms: 0,
        tokens_used: 0,
        cost: 0,
        fallback_reason: 'AI service unavailable - returning formatted Q&A pairs',
      },
    };
  }

  /**
   * Generate fallback response for contributing conditions analysis
   */
  static analyzeContributingConditionsFallback(input: {
    participant_name: string;
    reporter_name: string;
    event_datetime: string;
    location: string;
  }) {
    return {
      analysis: `**Unable to Complete AI Analysis**

The AI service is currently unavailable. Please try again later or complete the analysis manually.

### Manual Analysis Required
- Review the incident narrative for patterns or contributing factors
- Consider environmental, procedural, or support-related conditions
- Document any immediate causes or escalating factors identified

*This is a fallback response generated when AI analysis is unavailable.*`,
      metadata: {
        processed_at: new Date().toISOString(),
        status: 'fallback_response',
        incident_context: {
          participant_name: input.participant_name,
          reporter_name: input.reporter_name,
          event_datetime: input.event_datetime,
          location: input.location,
        },
        correlation_id: generateCorrelationId(),
        processing_time_ms: 0,
        tokens_used: 0,
        cost: 0,
        fallback_reason: 'AI service unavailable - manual analysis required',
      },
    };
  }

  /**
   * Generate fallback response for mock answers
   */
  static generateMockAnswersFallback(input: {
    phase: string;
    questions: string;
  }) {
    return {
      mock_answers: {
        output: JSON.stringify({
          answers: [
            {
              question_id: "fallback-001",
              question: "Fallback question unavailable",
              answer: "AI service is currently unavailable. Mock answers cannot be generated at this time. Please try again later."
            }
          ]
        })
      },
      metadata: {
        processed_at: new Date().toISOString(),
        status: 'fallback_response',
        phase: input.phase,
        questions_answered: 0,
        correlation_id: generateCorrelationId(),
        processing_time_ms: 0,
        tokens_used: 0,
        cost: 0,
        fallback_reason: 'AI service unavailable - cannot generate mock content',
      },
    };
  }
}