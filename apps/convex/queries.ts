import { query, QueryCtx } from './_generated/server';

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
