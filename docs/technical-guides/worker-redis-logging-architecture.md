# Worker + Redis Logging Architecture

## Overview

This document defines the new logging architecture using **Cloudflare Workers + Upstash Redis** to replace the broken Convex-based logging system. The new architecture addresses race conditions, cost issues, and reliability problems while preserving trace correlation capabilities.

## Architecture Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │    │   Convex    │    │Other Workers│
│             │    │  Functions  │    │ (email/pdf) │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │ POST /log        │ Internal log     │ POST /log
       ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│      Cloudflare Worker (apps/workers/log-ingestion) │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │Rate Limiting│  │   Batching  │  │System Detection│
│  │per trace_id │  │& Buffering  │  │  (auto/manual) │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      ▼
              ┌───────────────┐
              │ Upstash Redis │ ← 1hr TTL buffer
              │Key: logs:{tid}│   ~$2/month cost
              └───────┬───────┘
                      │
                      │ On-demand fetch by trace_id
                      ▼
              ┌───────────────┐
              │ Convex Action │ ← Debugging queries only
              │(fetch & temp) │
              └───────┬───────┘
                      ▼
              ┌───────────────┐
              │ New Admin UI  │ ← Clean debugging interface
              │ (on-demand)   │
              └───────────────┘
```

## Core Components

### 1. Cloudflare Worker (`apps/workers/log-ingestion/`)

**Purpose**: High-performance log ingestion with rate limiting and buffering

**Key Features**:

- **Rate Limiting**: Per trace_id and global quotas (prevents DB race conditions)
- **System Detection**: Auto-detect browser/convex/worker based on headers
- **Batch Buffering**: Group logs before Redis writes for efficiency
- **Cost Control**: Built-in limits to prevent Redis cost explosions
- **Multi-origin CORS**: Handle logs from all system sources

**File Structure**:

```
apps/workers/log-ingestion/
├── src/
│   ├── index.ts           # Main worker entry point
│   ├── rate-limiter.ts    # Worker-based rate limiting
│   ├── redis-client.ts    # Upstash Redis integration
│   ├── log-processor.ts   # Log validation and processing
│   └── types.ts           # Shared type definitions
├── wrangler.toml          # Cloudflare Worker configuration
├── package.json           # Worker dependencies
└── tsconfig.json          # TypeScript configuration
```

### 2. Upstash Redis Storage

**Purpose**: Cost-effective short-term log buffering with automatic expiry

**Data Structure**:

```typescript
// Redis Key Pattern: logs:{trace_id}
// Value: JSON array of log entries
interface RedisLogEntry {
  id: string; // Unique log entry ID
  trace_id: string; // Correlation identifier
  user_id?: string; // User context
  system: 'browser' | 'convex' | 'worker' | 'manual';
  level: 'log' | 'info' | 'warn' | 'error';
  message: string; // Log message content
  stack?: string; // Stack trace if error
  timestamp: number; // Unix timestamp
  context?: Record<string, any>; // Additional metadata
}

// Example Redis operations:
// LPUSH logs:trace_123 '{"id":"log_1","message":"User clicked","timestamp":1640995200}'
// EXPIRE logs:trace_123 3600  // 1 hour TTL
// LRANGE logs:trace_123 0 -1  // Fetch all logs for trace
```

**Cost Analysis**:

- **Upstash Pricing**: $0.2 per 100K requests
- **Expected Usage**: ~50K logs/month in development
- **Monthly Cost**: ~$2 (vs $10 with current Convex writes)
- **Storage**: Negligible with 1-hour TTL

### 3. Convex Integration (On-Demand Only)

**Purpose**: Fetch logs from Redis for debugging sessions only

**New Convex Functions**:

```typescript
// apps/convex/loggingV2.ts (new file)
export const fetchTraceLogsFromRedis = httpAction(async (ctx, request) => {
  const { trace_id } = await request.json();

  // Fetch from Redis
  const response = await fetch(
    `${UPSTASH_REDIS_REST_URL}/lrange/logs:${trace_id}/0/-1`,
    {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    }
  );

  const logs = await response.json();

  // Optional: Store temporarily in Convex for complex correlation
  // Only during active debugging sessions

  return { trace_id, logs: logs.result || [] };
});

export const correlateTraceLogs = action(async (ctx, { trace_id, logs }) => {
  // Existing correlation logic adapted for fetched data
  // Timeline reconstruction, error chain analysis, etc.
  return analyzeLogCorrelation(logs);
});
```

### 4. New Admin Interface

**Purpose**: Clean, focused debugging interface for trace analysis

**Key Features**:

- **Trace ID Search**: Enter trace_id to fetch logs from Redis
- **Timeline View**: Chronological log display across systems
- **Error Highlighting**: Automatic error detection and highlighting
- **System Filtering**: Filter by browser/convex/worker logs
- **Export**: JSON export for Claude Code consumption

**Component Structure**:

```
apps/web/app/debug/                    # New debug section
├── page.tsx                          # Main debug interface
└── components/
    ├── trace-search.tsx              # Trace ID input
    ├── log-timeline.tsx              # Chronological display
    ├── system-filter.tsx             # System type filtering
    └── log-export.tsx                # Claude Code integration
```

## Implementation Specifications

### Worker Deployment Integration

**Monorepo Integration**:

```json
// Root package.json additions
{
  "scripts": {
    "worker:logs:dev": "cd apps/workers/log-ingestion && wrangler dev",
    "worker:logs:deploy": "cd apps/workers/log-ingestion && wrangler deploy",
    "workers:dev": "turbo workers:dev",
    "workers:deploy": "turbo workers:deploy"
  }
}

// turbo.json additions
{
  "tasks": {
    "workers:dev": {
      "dependsOn": ["^build"],
      "persistent": true
    },
    "workers:deploy": {
      "dependsOn": ["^build"]
    }
  }
}
```

**Worker Configuration**:

```toml
# apps/workers/log-ingestion/wrangler.toml
name = "log-ingestion"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.development]
vars = { ENVIRONMENT = "development" }

# Environment variables (set via Cloudflare dashboard):
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN
```

### Multi-System Integration

**Browser Client Update**:

```typescript
// apps/web/lib/console-override.ts (minimal changes)
const WORKER_LOG_ENDPOINT =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8787/log' // Local worker dev
    : 'https://log-ingestion.your-domain.workers.dev/log';

// Change only the endpoint, keep all existing logic:
// - Trace ID generation
// - Rate limiting
// - Noise suppression
// - Sensitive data redaction
```

**Convex Integration**:

```typescript
// apps/convex/internalLogging.ts (new pattern)
export const logFromConvex = internalAction(async (ctx, logData) => {
  // Send logs to Worker instead of direct DB writes
  await fetch('https://log-ingestion.your-domain.workers.dev/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...logData,
      system: 'convex',
      source: 'internal',
    }),
  });
});
```

### Rate Limiting Strategy

**Worker-Based Rate Limiting** (eliminates Convex race conditions):

```typescript
// apps/workers/log-ingestion/src/rate-limiter.ts
interface RateLimitConfig {
  globalLimit: number; // 1000 logs/hour total
  perTraceLimit: number; // 100 logs/hour per trace
  systemQuotas: {
    browser: number; // 40% of global
    convex: number; // 30% of global
    worker: number; // 30% of global
  };
}

// Use Cloudflare Durable Objects for distributed rate limiting
// Or simple in-memory limits for cost efficiency
```

### Data Migration (Destruction Strategy)

**Complete Clean Slate**:

1. **Delete Convex Tables**: Remove `log_queue`, `recent_log_entries`, `rate_limit_state`, `message_fingerprints`
2. **Remove Files**: Delete all broken Convex logging files
3. **Clean Schema**: Update `apps/convex/schema.ts` to remove logging tables
4. **Fresh Start**: No data migration - all existing log data destroyed

## Benefits Analysis

### Problem Resolution

- ✅ **Race Conditions Fixed**: Worker handles concurrency better than Convex
- ✅ **Cost Reduction**: $2/month Redis vs $10/month Convex writes
- ✅ **Reliability Improved**: Redis designed for high-frequency writes
- ✅ **Burst Handling**: Worker + Redis scales better than database writes

### Preserved Capabilities

- ✅ **Trace Correlation**: Same trace_id system across all sources
- ✅ **Console Override**: Minimal changes to excellent browser capture
- ✅ **Multi-System Support**: Browser + Convex + Worker logging
- ✅ **Development Focus**: Still optimized for debugging workflows

### New Capabilities

- ✅ **True Multi-System**: Easy to add new worker types
- ✅ **Better Performance**: Worker ingestion, on-demand fetching
- ✅ **Cleaner Architecture**: Separation of ingestion from visualization
- ✅ **Cost Scalability**: Redis pricing scales better than database writes

## Development Workflow

### Local Development

```bash
# Start all services
bun dev                    # Next.js + Convex
bun worker:logs:dev        # Log ingestion worker (localhost:8787)

# Test logging flow
curl -X POST localhost:8787/log -d '{"trace_id":"test_123","message":"test"}'
```

### Production Deployment

```bash
# Deploy worker
bun worker:logs:deploy

# Update browser client environment variables
# Deploy Next.js app as normal
```

### Debugging Workflow

1. **Trigger Issue**: Use application normally or reproduce bug
2. **Get Trace ID**: From browser console widget or logs
3. **Debug Interface**: Go to `/debug` page, enter trace_id
4. **Fetch Logs**: System queries Redis for all logs in trace
5. **Analyze**: Timeline view, correlation analysis, export for Claude

This architecture provides a robust, cost-effective, and scalable foundation for multi-system logging while maintaining the excellent debugging capabilities already built.
