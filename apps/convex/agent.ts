import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { api } from './_generated/api';
import { Id } from './_generated/dataModel';

/**
 * Generate a simple unique ID without crypto dependency
 */
function generateSimpleId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Internal mutation to create chat session
 */
export const createChatSession = internalMutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
    correlationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = args.correlationId || generateSimpleId();
    
    return await ctx.db.insert('chat_sessions', {
      userId: args.userId,
      title: args.title,
      created_at: Date.now(),
      updated_at: Date.now(),
      correlation_id: correlationId,
    });
  },
});

/**
 * Internal mutation to create chat message
 */
export const createChatMessage = internalMutation({
  args: {
    sessionId: v.id('chat_sessions'),
    userId: v.id('users'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    correlationId: v.optional(v.string()),
    modelUsed: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    hasLLMAccess: v.boolean(),
  },
  handler: async (ctx, args) => {
    const correlationId = args.correlationId || generateSimpleId();
    
    return await ctx.db.insert('chat_messages', {
      sessionId: args.sessionId,
      userId: args.userId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      correlation_id: correlationId,
      model_used: args.modelUsed,
      tokens_used: args.tokensUsed,
      has_llm_access: args.hasLLMAccess,
    });
  },
});

/**
 * Query to get user's chat sessions
 */
export const getUserChatSessions = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    return await ctx.db
      .query('chat_sessions')
      .withIndex('by_user_id', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
  },
});

/**
 * Query to get messages for a chat session
 */
export const getChatMessages = query({
  args: {
    sessionId: v.id('chat_sessions'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    return await ctx.db
      .query('chat_messages')
      .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
      .order('asc')
      .take(limit);
  },
});