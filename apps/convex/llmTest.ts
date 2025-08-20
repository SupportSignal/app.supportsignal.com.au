import { v } from "convex/values";
import { action } from "./_generated/server";
import { getConfig } from "./lib/config";
import { aiManager } from "./aiMultiProvider";
import { generateCorrelationId, AIRequest } from "./aiService";

/**
 * Test LLM connectivity and configuration
 * Returns current model configuration and tests actual AI communication
 */
export const testLLMCommunication = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();
    
    console.log("🧪 LLM TEST START", {
      correlationId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Get current configuration
      const config = getConfig();
      
      console.log("📋 LLM Configuration", {
        defaultModel: config.llm.defaultModel,
        fallbackModel: config.llm.fallbackModel,
        hasOpenRouterKey: !!config.llm.openRouterApiKey,
        environment: config.environment,
        correlationId,
      });

      // Test both primary and fallback models
      const testPrompt = "Hello! Please respond with a brief confirmation that you are working correctly. Keep your response under 50 words.";
      
      const results = {
        primary: null,
        fallback: null,
        processingTime: 0,
      };

      // Test primary model
      console.log("🚀 Testing PRIMARY model...", {
        model: config.llm.defaultModel,
        correlationId,
      });

      const primaryStartTime = Date.now();
      const primaryRequest: AIRequest = {
        correlationId: `${correlationId}_primary`,
        model: config.llm.defaultModel,
        prompt: testPrompt,
        temperature: 0.3,
        maxTokens: 100,
        metadata: {
          operation: "llm_connectivity_test_primary",
          testMode: true,
        },
      };

      const primaryResponse = await aiManager.sendRequest(primaryRequest);
      const primaryResponseTime = (Date.now() - primaryStartTime) / 1000;
      results.primary = {
        success: primaryResponse.success,
        model: primaryResponse.model,
        response: primaryResponse.content,
        error: primaryResponse.error,
        tokensUsed: primaryResponse.tokensUsed,
        cost: primaryResponse.cost,
        responseTime: primaryResponseTime,
      };

      console.log("📊 PRIMARY MODEL RESULT", {
        success: primaryResponse.success,
        model: primaryResponse.model,
        error: primaryResponse.error,
        correlationId,
      });

      // Test fallback model
      console.log("🚀 Testing FALLBACK model...", {
        model: config.llm.fallbackModel,
        correlationId,
      });

      const fallbackStartTime = Date.now();
      const fallbackRequest: AIRequest = {
        correlationId: `${correlationId}_fallback`,
        model: config.llm.fallbackModel,
        prompt: testPrompt,
        temperature: 0.3,
        maxTokens: 100,
        metadata: {
          operation: "llm_connectivity_test_fallback",
          testMode: true,
        },
      };

      const fallbackResponse = await aiManager.sendRequest(fallbackRequest);
      const fallbackResponseTime = (Date.now() - fallbackStartTime) / 1000;
      results.fallback = {
        success: fallbackResponse.success,
        model: fallbackResponse.model,
        response: fallbackResponse.content,
        error: fallbackResponse.error,
        tokensUsed: fallbackResponse.tokensUsed,
        cost: fallbackResponse.cost,
        responseTime: fallbackResponseTime,
      };

      console.log("📊 FALLBACK MODEL RESULT", {
        success: fallbackResponse.success,
        model: fallbackResponse.model,
        error: fallbackResponse.error,
        correlationId,
      });

      const processingTime = Date.now() - startTime;
      results.processingTime = processingTime;

      // Determine overall success
      const bothSuccessful = results.primary.success && results.fallback.success;
      const anySuccessful = results.primary.success || results.fallback.success;

      if (bothSuccessful) {
        console.log("✅ BOTH MODELS TEST SUCCESS", {
          primary: { model: results.primary.model, tokensUsed: results.primary.tokensUsed },
          fallback: { model: results.fallback.model, tokensUsed: results.fallback.tokensUsed },
          totalProcessingTimeMs: processingTime,
          correlationId,
        });

        return {
          success: true,
          responseTime: processingTime / 1000,
          testResults: {
            primary: results.primary,
            fallback: results.fallback,
            bothWorking: true,
          },
          configuration: {
            currentModel: config.llm.defaultModel,
            fallbackModel: config.llm.fallbackModel,
            source: "environment",
            environmentModel: config.llm.defaultModel,
            databaseModel: "N/A",
          },
          metadata: {
            totalTokensUsed: (results.primary.tokensUsed || 0) + (results.fallback.tokensUsed || 0),
            totalCost: (results.primary.cost || 0) + (results.fallback.cost || 0),
            correlationId,
          },
        };
      } else if (anySuccessful) {
        console.warn("⚠️ PARTIAL LLM TEST SUCCESS", {
          primary: { success: results.primary.success, error: results.primary.error },
          fallback: { success: results.fallback.success, error: results.fallback.error },
          processingTimeMs: processingTime,
          correlationId,
        });

        return {
          success: false, // Mark as failed since not both working
          responseTime: processingTime / 1000,
          testResults: {
            primary: results.primary,
            fallback: results.fallback,
            bothWorking: false,
          },
          error: `Partial failure: Primary ${results.primary.success ? 'OK' : 'FAILED'}, Fallback ${results.fallback.success ? 'OK' : 'FAILED'}`,
          configuration: {
            currentModel: config.llm.defaultModel,
            fallbackModel: config.llm.fallbackModel,
            source: "environment",
            environmentModel: config.llm.defaultModel,
            databaseModel: "N/A",
          },
          metadata: {
            correlationId,
            configurationStatus: "partial_failure",
            providerStatus: aiManager.getProviderStatus(),
          },
        };
      } else {
        console.error("❌ BOTH MODELS TEST FAILED", {
          primary: { error: results.primary.error },
          fallback: { error: results.fallback.error },
          processingTimeMs: processingTime,
          correlationId,
        });

        return {
          success: false,
          responseTime: processingTime / 1000,
          testResults: {
            primary: results.primary,
            fallback: results.fallback,
            bothWorking: false,
          },
          error: `Both models failed: Primary: ${results.primary.error}, Fallback: ${results.fallback.error}`,
          configuration: {
            currentModel: config.llm.defaultModel,
            fallbackModel: config.llm.fallbackModel,
            source: "environment",
            environmentModel: config.llm.defaultModel,
            databaseModel: "N/A",
          },
          metadata: {
            correlationId,
            configurationStatus: "total_failure",
            providerStatus: aiManager.getProviderStatus(),
          },
        };
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      console.error("💥 LLM TEST EXCEPTION", {
        error: errorMessage,
        processingTimeMs: processingTime,
        correlationId,
      });

      return {
        success: false,
        responseTime: processingTime / 1000,
        modelUsed: "unknown",
        error: `Configuration Error: ${errorMessage}`,
        configuration: null,
        metadata: {
          correlationId,
          configurationStatus: "failed",
        },
      };
    }
  },
});

/**
 * Speed test - Simple 30-second timeout diagnosis
 */
export const llmSpeedTest = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();
    
    console.log("⏱️ LLM SPEED TEST START", {
      timestamp: new Date().toISOString(),
      correlationId,
    });

    try {
      const config = getConfig();
      console.log("🔧 SPEED TEST CONFIG", {
        model: config.llm.defaultModel,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        openRouterKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
        providers: aiManager.getProviderStatus(),
        correlationId,
      });

      // Test with actual question generation prompt
      const testPrompt = `You are an expert in NDIS incident analysis. Generate 1 clarification question for the before_event phase.

Incident Details:
- Reporter: John Smith
- Participant: Jane Doe
- Location: Activity Room
- Date/Time: 2024-01-15 14:30:00

Phase: before_event
Narrative: The participant was showing signs of agitation before lunch service began.

Return the question in this JSON format:
{
  "questions": [
    {
      "questionId": "before_event_q1",
      "questionText": "What specific behaviors indicated the participant was agitated?",
      "questionOrder": 1
    }
  ]
}`;

      const aiRequest: AIRequest = {
        correlationId,
        model: config.llm.defaultModel,
        prompt: testPrompt,
        temperature: 0.7,
        maxTokens: 200,
        metadata: { operation: "speedTest" },
      };

      console.log("🚀 STARTING TIMER - LLM REQUEST", {
        startTime: Date.now(),
        model: aiRequest.model,
        correlationId,
      });

      const response = await aiManager.sendRequest(aiRequest);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log every second during the call to track where time is spent
      console.log("⏱️ SPEED TEST RESULT", {
        duration_ms: duration,
        duration_seconds: (duration / 1000).toFixed(2),
        success: response.success,
        content: response.content,
        model: response.model,
        error: response.error,
        is_sub_second: duration < 1000,
        is_slow: duration > 5000,
        is_timeout_territory: duration > 25000,
        correlationId,
      });

      return {
        duration_ms: duration,
        duration_seconds: parseFloat((duration / 1000).toFixed(2)),
        success: response.success,
        response_content: response.content,
        model_used: response.model,
        error: response.error,
        performance_analysis: {
          rating: duration < 1000 ? "EXCELLENT" : 
                  duration < 3000 ? "GOOD" : 
                  duration < 10000 ? "SLOW" : 
                  duration < 25000 ? "VERY_SLOW" : "TIMEOUT_RISK",
          is_normal_speed: duration < 3000,
          likely_issue: duration > 10000 ? "Network/API connectivity issue" : "Normal",
        },
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error("❌ SPEED TEST FAILED", {
        duration_ms: duration,
        error: error instanceof Error ? error.message : error,
        correlationId,
      });

      return {
        duration_ms: duration,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        performance_analysis: {
          rating: "FAILED",
          likely_issue: "Configuration or network error",
        },
      };
    }
  },
});