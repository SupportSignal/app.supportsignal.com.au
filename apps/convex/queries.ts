import { query, mutation, QueryCtx, MutationCtx } from './_generated/server';
import { v } from 'convex/values';

export const getTestMessage = query({
  args: {},
  handler: async () => {
    return {
      message: 'Hello from Convex!',
      timestamp: Date.now(),
      status: 'connected',
    };
  },
});

export const getTestMessages = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query('test_messages').collect();
  },
});

export const createTestMessage = mutation({
  args: {
    message: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx: MutationCtx, args) => {
    return await ctx.db.insert('test_messages', {
      message: args.message,
      timestamp: args.timestamp,
    });
  },
});
