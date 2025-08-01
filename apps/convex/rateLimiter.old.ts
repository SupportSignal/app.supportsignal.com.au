// @ts-nocheck
import { mutation, query, MutationCtx, QueryCtx } from './_generated/server';
import { v } from 'convex/values';

// Multi-system rate limiting configuration
export interface SystemRateLimits {
  browser: { current: number; limit: number; resetTime: number };
  worker: { current: number; limit: number; resetTime: number };
  backend: { current: number; limit: number; resetTime: number };
  global: { current: number; limit: number; budget: number };
}

// Budget allocation (based on $10/month = ~125K total writes)
const BUDGET_ALLOCATION = {
  browser: 0.40,  // 40% = 50K writes/month
  worker: 0.30,   // 30% = 37.5K writes/month
  backend: 0.30,  // 30% = 37.5K writes/month
};

const TOTAL_MONTHLY_BUDGET = 125000; // Total writes per month (~$10)
const RATE_WINDOW_MS = 60000; // 1 minute windows
const DUPLICATE_WINDOW_MS = 1000; // 1 second for duplicate detection
const MAX_DUPLICATES = 5;

// Calculate per-system limits - use reasonable development limits
const SYSTEM_LIMITS = {
  browser: Math.max(10, Math.floor(TOTAL_MONTHLY_BUDGET * BUDGET_ALLOCATION.browser / (30 * 24 * 60))), // Min 10/minute for development
  worker: Math.max(5, Math.floor(TOTAL_MONTHLY_BUDGET * BUDGET_ALLOCATION.worker / (30 * 24 * 60))), // Min 5/minute
  backend: Math.max(5, Math.floor(TOTAL_MONTHLY_BUDGET * BUDGET_ALLOCATION.backend / (30 * 24 * 60))), // Min 5/minute
  global: Math.max(20, Math.floor(TOTAL_MONTHLY_BUDGET / (30 * 24 * 60))), // Min 20/minute global
};

// Get current rate limiting state for all systems
export const getRateLimitState = query({
  args: {},
  handler: async (ctx: QueryCtx): Promise<SystemRateLimits | null> => {
    // Get rate limit state (read-only)
    const rateLimitState = await ctx.db
      .query('rate_limit_state')
      .unique();

    if (!rateLimitState) {
      return null; // Let the client handle initialization
    }

    return {
      browser: {
        current: rateLimitState.browser_current,
        limit: rateLimitState.browser_limit,
        resetTime: rateLimitState.browser_reset_time,
      },
      worker: {
        current: rateLimitState.worker_current,
        limit: rateLimitState.worker_limit,
        resetTime: rateLimitState.worker_reset_time,
      },
      backend: {
        current: rateLimitState.backend_current,
        limit: rateLimitState.backend_limit,
        resetTime: rateLimitState.backend_reset_time,
      },
      global: {
        current: rateLimitState.global_current,
        limit: rateLimitState.global_limit,
        budget: rateLimitState.global_budget,
      },
    };
  },
});

// Check if a log can be written and update counters if allowed
export const checkAndUpdateRateLimit = mutation({
  args: {
    system: v.union(v.literal('browser'), v.literal('worker'), v.literal('backend')),
    messageFingerprint: v.string(), // For duplicate detection
    traceId: v.optional(v.string()), // Critical traces may bypass rate limiting
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      system: 'browser' | 'worker' | 'backend';
      messageFingerprint: string;
      traceId?: string;
    }
  ): Promise<{
    allowed: boolean;
    reason?: string;
    rateLimitInfo: {
      systemCurrent: number;
      systemLimit: number;
      globalCurrent: number;
      globalLimit: number;
      monthlyRemaining: number;
    };
  }> => {
    const now = Date.now();
    
    // Get current rate limit state
    let rateLimitState = await ctx.db.query('rate_limit_state').unique();
    
    if (!rateLimitState) {
      throw new Error('Rate limit state not initialized');
    }

    // Check for monthly budget reset
    if (now > rateLimitState.monthly_reset_time) {
      await ctx.db.patch(rateLimitState._id, {
        monthly_writes_browser: 0,
        monthly_writes_worker: 0,
        monthly_writes_backend: 0,
        monthly_reset_time: now + (30 * 24 * 60 * 60 * 1000),
      });
      rateLimitState = await ctx.db.get(rateLimitState._id);
      if (!rateLimitState) throw new Error('Failed to reset monthly counters');
    }

    // Check for minute window resets
    const resetUpdates: Record<string, any> = {};
    
    if (now > rateLimitState.browser_reset_time) {
      resetUpdates.browser_current = 0;
      resetUpdates.browser_reset_time = now + RATE_WINDOW_MS;
    }
    
    if (now > rateLimitState.worker_reset_time) {
      resetUpdates.worker_current = 0;
      resetUpdates.worker_reset_time = now + RATE_WINDOW_MS;
    }
    
    if (now > rateLimitState.backend_reset_time) {
      resetUpdates.backend_current = 0;
      resetUpdates.backend_reset_time = now + RATE_WINDOW_MS;
    }
    
    if (now > rateLimitState.global_reset_time) {
      resetUpdates.global_current = 0;
      resetUpdates.global_reset_time = now + RATE_WINDOW_MS;
    }

    if (Object.keys(resetUpdates).length > 0) {
      await ctx.db.patch(rateLimitState._id, resetUpdates);
      rateLimitState = await ctx.db.get(rateLimitState._id);
      if (!rateLimitState) throw new Error('Failed to reset rate limits');
    }

    // Check for duplicate messages
    const isDuplicate = await checkDuplicate(ctx, args.messageFingerprint);
    if (isDuplicate) {
      return {
        allowed: false,
        reason: 'Duplicate message detected',
        rateLimitInfo: {
          systemCurrent: getSystemCurrent(rateLimitState, args.system),
          systemLimit: getSystemLimit(rateLimitState, args.system),
          globalCurrent: rateLimitState.global_current,
          globalLimit: rateLimitState.global_limit,
          monthlyRemaining: TOTAL_MONTHLY_BUDGET - getTotalMonthlyWrites(rateLimitState),
        },
      };
    }

    // Check monthly budget limits
    const totalMonthlyWrites = getTotalMonthlyWrites(rateLimitState);
    if (totalMonthlyWrites >= TOTAL_MONTHLY_BUDGET * 0.95) { // 95% of budget
      // Critical traces can still bypass budget limits
      if (!args.traceId?.includes('critical_')) {
        return {
          allowed: false,
          reason: 'Monthly budget limit reached (95%)',
          rateLimitInfo: {
            systemCurrent: getSystemCurrent(rateLimitState, args.system),
            systemLimit: getSystemLimit(rateLimitState, args.system),
            globalCurrent: rateLimitState.global_current,
            globalLimit: rateLimitState.global_limit,
            monthlyRemaining: TOTAL_MONTHLY_BUDGET - totalMonthlyWrites,
          },
        };
      }
    }

    // Check global rate limit
    if (rateLimitState.global_current >= rateLimitState.global_limit) {
      return {
        allowed: false,
        reason: 'Global rate limit exceeded',
        rateLimitInfo: {
          systemCurrent: getSystemCurrent(rateLimitState, args.system),
          systemLimit: getSystemLimit(rateLimitState, args.system),
          globalCurrent: rateLimitState.global_current,
          globalLimit: rateLimitState.global_limit,
          monthlyRemaining: TOTAL_MONTHLY_BUDGET - totalMonthlyWrites,
        },
      };
    }

    // Check system-specific rate limit
    const systemCurrent = getSystemCurrent(rateLimitState, args.system);
    const systemLimit = getSystemLimit(rateLimitState, args.system);
    
    if (systemCurrent >= systemLimit) {
      // Try to borrow from other systems if they have unused quota
      const canBorrow = await tryBorrowQuota(ctx, rateLimitState._id, args.system);
      if (!canBorrow) {
        return {
          allowed: false,
          reason: `${args.system} rate limit exceeded`,
          rateLimitInfo: {
            systemCurrent,
            systemLimit,
            globalCurrent: rateLimitState.global_current,
            globalLimit: rateLimitState.global_limit,
            monthlyRemaining: TOTAL_MONTHLY_BUDGET - totalMonthlyWrites,
          },
        };
      }
    }

    // Allow the log and update counters
    const systemUpdates: Record<string, number> = {
      global_current: rateLimitState.global_current + 1,
    };

    // Update system-specific counters
    switch (args.system) {
      case 'browser':
        systemUpdates.browser_current = rateLimitState.browser_current + 1;
        systemUpdates.monthly_writes_browser = rateLimitState.monthly_writes_browser + 1;
        break;
      case 'worker':
        systemUpdates.worker_current = rateLimitState.worker_current + 1;
        systemUpdates.monthly_writes_worker = rateLimitState.monthly_writes_worker + 1;
        break;
      case 'backend':
        systemUpdates.backend_current = rateLimitState.backend_current + 1;
        systemUpdates.monthly_writes_backend = rateLimitState.monthly_writes_backend + 1;
        break;
    }

    await ctx.db.patch(rateLimitState._id, systemUpdates);

    // Record message fingerprint to prevent duplicates
    await recordMessageFingerprint(ctx, args.messageFingerprint);

    return {
      allowed: true,
      rateLimitInfo: {
        systemCurrent: systemCurrent + 1,
        systemLimit,
        globalCurrent: rateLimitState.global_current + 1,
        globalLimit: rateLimitState.global_limit,
        monthlyRemaining: TOTAL_MONTHLY_BUDGET - totalMonthlyWrites - 1,
      },
    };
  },
});

// Helper functions
function getSystemCurrent(state: any, system: string): number {
  return state[`${system}_current`];
}

function getSystemLimit(state: any, system: string): number {
  return state[`${system}_limit`];
}

function getTotalMonthlyWrites(state: any): number {
  return state.monthly_writes_browser + state.monthly_writes_worker + state.monthly_writes_backend;
}

async function checkDuplicate(ctx: MutationCtx, fingerprint: string): Promise<boolean> {
  const now = Date.now();
  const cutoff = now - DUPLICATE_WINDOW_MS;

  try {
    const existingFingerprints = await ctx.db
      .query('message_fingerprints')
      .filter(q => q.and(
        q.eq(q.field('fingerprint'), fingerprint),
        q.gt(q.field('timestamp'), cutoff)
      ))
      .collect();

    return existingFingerprints.length >= MAX_DUPLICATES;
  } catch (error) {
    // If there's a race condition, err on the side of allowing the message
    // This prevents logging from completely failing due to duplicate detection conflicts
    console.warn('Duplicate check failed due to race condition, allowing message:', error);
    return false;
  }
}

async function recordMessageFingerprint(ctx: MutationCtx, fingerprint: string): Promise<void> {
  const now = Date.now();
  
  try {
    // Insert the new fingerprint
    await ctx.db.insert('message_fingerprints', {
      fingerprint,
      timestamp: now,
      expires_at: now + DUPLICATE_WINDOW_MS,
    });

    // Clean up old fingerprints (older than duplicate window)
    // Limit cleanup to prevent large batch operations that cause conflicts
    const oldFingerprints = await ctx.db
      .query('message_fingerprints')
      .filter(q => q.lt(q.field('expires_at'), now))
      .take(10); // Limit to 10 at a time to reduce contention

    for (const old of oldFingerprints) {
      try {
        await ctx.db.delete(old._id);
      } catch (deleteError) {
        // If another operation already deleted this record, continue
        // This is expected in high-concurrency scenarios
        continue;
      }
    }
  } catch (error) {
    // If fingerprint recording fails, log but don't throw
    // The duplicate detection is a nice-to-have, not critical
    console.warn('Failed to record message fingerprint:', error);
  }
}

async function tryBorrowQuota(ctx: MutationCtx, stateId: any, requestingSystem: string): Promise<boolean> {
  const state = await ctx.db.get(stateId);
  if (!state) return false;

  // Check if other systems have unused quota
  const systems = ['browser', 'worker', 'backend'].filter(s => s !== requestingSystem);
  
  for (const system of systems) {
    const current = getSystemCurrent(state, system);
    const limit = getSystemLimit(state, system);
    
    if (current < limit * 0.8) { // If system is using less than 80% of its quota
      // Allow borrowing by increasing the requesting system's limit temporarily
      const updates: Record<string, number> = {};
      updates[`${requestingSystem}_limit`] = getSystemLimit(state, requestingSystem) + 1;
      
      await ctx.db.patch(stateId, updates);
      return true;
    }
  }

  return false;
}

// Update rate limit state with current system limits
export const updateRateLimitState = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const existing = await ctx.db.query('rate_limit_state').unique();
    
    if (!existing) {
      throw new Error('Rate limit state not found. Run initializeRateLimitState first.');
    }

    const now = Date.now();
    await ctx.db.patch(existing._id, {
      browser_limit: SYSTEM_LIMITS.browser,
      worker_limit: SYSTEM_LIMITS.worker,  
      backend_limit: SYSTEM_LIMITS.backend,
      global_limit: SYSTEM_LIMITS.global,
      global_budget: TOTAL_MONTHLY_BUDGET,
    });

    return { 
      message: 'Rate limit state updated',
      limits: SYSTEM_LIMITS,
      id: existing._id 
    };
  },
});

// Initialize rate limit state if it doesn't exist
export const initializeRateLimitState = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const existing = await ctx.db.query('rate_limit_state').unique();
    
    if (existing) {
      return { message: 'Rate limit state already initialized', id: existing._id };
    }

    const now = Date.now();
    const rateLimitState = await ctx.db.insert('rate_limit_state', {
      // Browser quotas
      browser_current: 0,
      browser_limit: SYSTEM_LIMITS.browser,
      browser_reset_time: now + RATE_WINDOW_MS,
      
      // Worker quotas  
      worker_current: 0,
      worker_limit: SYSTEM_LIMITS.worker,
      worker_reset_time: now + RATE_WINDOW_MS,
      
      // Backend quotas
      backend_current: 0,
      backend_limit: SYSTEM_LIMITS.backend,
      backend_reset_time: now + RATE_WINDOW_MS,
      
      // Global quotas
      global_current: 0,
      global_limit: SYSTEM_LIMITS.global,
      global_reset_time: now + RATE_WINDOW_MS,
      global_budget: TOTAL_MONTHLY_BUDGET,
      
      // Monthly budget tracking
      monthly_writes_browser: 0,
      monthly_writes_worker: 0,
      monthly_writes_backend: 0,
      monthly_reset_time: now + (30 * 24 * 60 * 60 * 1000), // 30 days
    });

    return { message: 'Rate limit state initialized', id: rateLimitState };
  },
});

// Debug function to check calculated limits
export const getCalculatedLimits = query({
  args: {},
  handler: async () => {
    return {
      SYSTEM_LIMITS,
      TOTAL_MONTHLY_BUDGET,
      BUDGET_ALLOCATION,
      calculations: {
        browser_calculation: TOTAL_MONTHLY_BUDGET * BUDGET_ALLOCATION.browser / (30 * 24 * 60),
        browser_with_max: Math.max(10, Math.floor(TOTAL_MONTHLY_BUDGET * BUDGET_ALLOCATION.browser / (30 * 24 * 60))),
      }
    };
  },
});

// Get current cost estimates and budget usage
export const getCostMetrics = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const rateLimitState = await ctx.db.query('rate_limit_state').unique();
    
    if (!rateLimitState) {
      return {
        totalWrites: 0,
        estimatedCost: 0,
        budgetRemaining: TOTAL_MONTHLY_BUDGET,
        budgetUsedPercent: 0,
        breakdown: {
          browser: 0,
          worker: 0,
          backend: 0,
        },
      };
    }

    const totalWrites = getTotalMonthlyWrites(rateLimitState);
    const estimatedCost = (totalWrites / 1000000) * 2.00; // $2 per million writes
    const budgetUsedPercent = (totalWrites / TOTAL_MONTHLY_BUDGET) * 100;

    return {
      totalWrites,
      estimatedCost,
      budgetRemaining: TOTAL_MONTHLY_BUDGET - totalWrites,
      budgetUsedPercent,
      breakdown: {
        browser: rateLimitState.monthly_writes_browser,
        worker: rateLimitState.monthly_writes_worker,
        backend: rateLimitState.monthly_writes_backend,
      },
    };
  },
});