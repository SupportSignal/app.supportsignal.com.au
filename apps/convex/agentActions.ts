// @ts-nocheck
"use node";

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import { getConfig } from './lib/config';
// withAuthAction removed - actions now handle authentication manually
import crypto from 'crypto';

/**
 * OpenRouter LLM integration for generating AI responses
 * Implements AC 6: OpenRouter API integration for actual LLM responses
 */
export const generateResponse = action({
  args: {
    sessionId: v.id('chat_sessions'),
    message: v.string(),
    model: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<{
    response: string;
    model: string;
    tokensUsed: number;
  }> => {
    // Verify authentication using API functions for actions
    const session = await ctx.runQuery(api.auth.findSessionByToken, { sessionToken: args.sessionToken }) as any;
    if (!session || session.expires < Date.now()) {
      throw new Error("Invalid session token");
    }
    
    const user = await ctx.runQuery(api.auth.getUserById, { id: session.userId }) as any;
    if (!user) {
      throw new Error("User not found");
    }
    const correlationId = crypto.randomUUID();
    
    try {
      // Load configuration
      const config = getConfig();
      
      // Select model (use provided model or default)
      const selectedModel = args.model || config.llm.defaultModel;
      
      // eslint-disable-next-line no-console
      console.log(`Generating response with model: ${selectedModel} (correlation: ${correlationId})`);

      // Call OpenRouter API
      const response = await callOpenRouterAPI(
        args.message,
        config.llm.openRouterApiKey,
        selectedModel,
        config.llm.fallbackModel,
        config
      );

      // Store response in database
      await ctx.runMutation(internal.agent.createChatMessage, {
        sessionId: args.sessionId,
        userId: user._id,
        role: 'assistant',
        content: response.content,
        correlationId,
        modelUsed: response.model,
        tokensUsed: response.tokensUsed,
      });

      return {
        response: response.content,
        model: response.model,
        tokensUsed: response.tokensUsed,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error generating response (correlation: ${correlationId}):`, error);
      
      // In case of error, return fallback response
      const fallbackResponse = 'I apologize, but I encountered an issue processing your request. Please try again.';
      
      await ctx.runMutation(internal.agent.createChatMessage, {
        sessionId: args.sessionId,
        userId: user._id,
        role: 'assistant',
        content: fallbackResponse,
        correlationId,
      });

      return {
        response: fallbackResponse,
        model: 'error_fallback',
        tokensUsed: 0,
      };
    }
  },
});

/**
 * Call OpenRouter API with retry logic and fallback
 */
async function callOpenRouterAPI(
  message: string,
  apiKey: string,
  primaryModel: string,
  fallbackModel: string,
  config: any,
  maxRetries: number = 2
): Promise<{ content: string; model: string; tokensUsed: number }> {
  const models = [primaryModel, fallbackModel];
  
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': config.app.url,
            'X-Title': 'Starter NextJS Convex AI',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.',
              },
              {
                role: 'user',
                content: message,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          throw new Error('No response choices returned from OpenRouter API');
        }

        const content = data.choices[0].message?.content;
        if (!content) {
          throw new Error('Empty response content from OpenRouter API');
        }

        const tokensUsed = data.usage?.total_tokens || 0;

        return {
          content,
          model,
          tokensUsed,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`Attempt ${attempt + 1} failed for model ${model}:`, (error as Error).message);
        
        if (attempt === maxRetries - 1 && modelIndex === models.length - 1) {
          // Last attempt with last model - throw error
          throw error;
        }
        
        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise<void>(resolve => {
            setTimeout(resolve, delay);
          });
        }
      }
    }
  }

  throw new Error('All models and retries exhausted');
}


/**
 * Create or get chat session for user
 */
export const createOrGetChatSession = action({
  args: {
    title: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<{
    _id: string;
    userId: string;
    title?: string;
    created_at: number;
    updated_at: number;
  }> => {
    // Verify authentication using API functions for actions
    const session = await ctx.runQuery(api.auth.findSessionByToken, { sessionToken: args.sessionToken }) as any;
    if (!session || session.expires < Date.now()) {
      throw new Error("Invalid session token");
    }
    
    const user = await ctx.runQuery(api.auth.getUserById, { id: session.userId }) as any;
    if (!user) {
      throw new Error("User not found");
    }
    
    const correlationId = crypto.randomUUID();
    
    // Look for existing session for user (most recent)
    const existingSessions: Array<{
      _id: string;
      userId: string;
      title?: string;
      created_at: number;
      updated_at: number;
    }> = await ctx.runQuery(api.agent.getUserChatSessions, {
      userId: user._id,
      limit: 1,
    });

    if (existingSessions.length > 0) {
      return existingSessions[0];
    }

    // Create new session
    const sessionId: string = await ctx.runMutation(internal.agent.createChatSession, {
      userId: user._id,
      title: args.title || 'New Chat',
      correlationId,
    });

    return {
      _id: sessionId,
      userId: user._id,
      title: args.title || 'New Chat',
      created_at: Date.now(),
      updated_at: Date.now(),
    };
  },
});