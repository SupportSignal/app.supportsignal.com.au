// @ts-nocheck
// DEPRECATED - Rate limiting migrated to Cloudflare Worker Durable Objects
// This file is kept for reference but should not be used in production

// The old Convex-based rate limiting has been replaced with:
// - Cloudflare Worker Durable Objects for state management
// - Redis-based log storage with automatic TTL
// - Worker-level rate limiting for better performance and cost efficiency

// Migration completed: 2025-01-29
// New rate limiting location: apps/workers/log-ingestion/src/rate-limiter.ts

export const deprecated = true;

// If you need to access old rate limiting functions for migration purposes,
// they can be found in the git history before 2025-01-29