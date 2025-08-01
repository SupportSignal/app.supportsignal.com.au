# Browser Log Capture System Example

**Story Reference**: 3.1 - Browser Log Capture Foundation  
**Epic**: 3 - Resilient Real-time Logging  
**Implementation Date**: 2025-01-24

## Overview

This example demonstrates a complete browser log capture system that intercepts console output and sends it to a Convex backend for development debugging and monitoring.

## Architecture Components

```
Browser Console -> Console Override -> ConvexHttpClient -> Convex Action -> Database Storage
                                                       |
                                                       v
                                              ┌─ log_queue (processing)
                                              └─ recent_log_entries (real-time UI)
```

## Complete Implementation

### 1. Database Schema

**File**: `apps/convex/schema.ts`

```typescript
// Log queue for raw log ingestion
log_queue: defineTable({
  level: v.string(),
  message: v.string(),
  trace_id: v.string(),
  user_id: v.string(),
  system_area: v.string(),
  timestamp: v.number(),
  raw_args: v.array(v.string()),
  stack_trace: v.optional(v.string()),
  processed: v.optional(v.boolean()),
})
  .index('by_timestamp', ['timestamp'])
  .index('by_trace_id', ['trace_id'])
  .index('by_processed', ['processed']),

// Recent log entries for real-time UI (with TTL)
recent_log_entries: defineTable({
  level: v.string(),
  message: v.string(),
  trace_id: v.string(),
  user_id: v.string(),
  system_area: v.string(),
  timestamp: v.number(),
  raw_args: v.array(v.string()),
  stack_trace: v.optional(v.string()),
  expires_at: v.number(), // TTL field - entries expire after 1 hour
})
  .index('by_timestamp', ['timestamp'])
  .index('by_trace_id', ['trace_id'])
  .index('by_expires_at', ['expires_at']),
```

### 2. Convex Backend Action

**File**: `apps/convex/loggingAction.ts`

```typescript
import { action, mutation } from './_generated/server';
import { v } from 'convex/values';

// Internal mutation to store log entry
const createLogEntry = mutation({
  args: {
    level: v.string(),
    message: v.string(),
    trace_id: v.string(),
    user_id: v.string(),
    system_area: v.string(),
    timestamp: v.number(),
    raw_args: v.array(v.string()),
    stack_trace: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 1 hour from now

    // Store in log queue
    const logQueueId = await ctx.db.insert('log_queue', {
      level: args.level,
      message: args.message,
      trace_id: args.trace_id,
      user_id: args.user_id,
      system_area: args.system_area,
      timestamp: args.timestamp,
      raw_args: args.raw_args,
      stack_trace: args.stack_trace,
      processed: false,
    });

    // Also store in recent entries for real-time UI
    const recentLogId = await ctx.db.insert('recent_log_entries', {
      level: args.level,
      message: args.message,
      trace_id: args.trace_id,
      user_id: args.user_id,
      system_area: args.system_area,
      timestamp: args.timestamp,
      raw_args: args.raw_args,
      stack_trace: args.stack_trace,
      expires_at: expiresAt,
    });

    return { logQueueId, recentLogId };
  },
});

// Public action to process browser logs
export const processLogs = action({
  args: {
    level: v.string(),
    args: v.array(v.any()),
    trace_id: v.optional(v.string()),
    user_id: v.optional(v.string()),
    system_area: v.optional(v.string()),
    timestamp: v.number(),
    stack_trace: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Prepare log entry data
    const logEntry = {
      level: args.level,
      message: Array.isArray(args.args)
        ? args.args.join(' ')
        : String(args.args),
      trace_id: args.trace_id || 'unknown',
      user_id: args.user_id || 'anonymous',
      system_area: args.system_area || 'browser',
      timestamp: args.timestamp,
      raw_args: Array.isArray(args.args)
        ? args.args.map((arg: any) => String(arg))
        : [String(args.args)],
      stack_trace: args.stack_trace,
    };

    // Store the log entry
    const result = await ctx.runMutation(
      'loggingAction:createLogEntry',
      logEntry
    );

    return { success: true, result };
  },
});

// Export the internal mutation for other files to use
export { createLogEntry };
```

### 3. Frontend Console Override

**File**: `apps/web/lib/console-override.ts`

```typescript
'use client';

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

// Generate unique trace ID for session
const generateTraceId = () =>
  `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Current trace context
let currentTraceId = generateTraceId();
let currentUserId = 'anonymous';
let isInitialized = false;

// Declare global window interface for TypeScript
declare global {
  interface Window {
    CLAUDE_LOGGING_ENABLED?: string;
  }
}

export function initializeConsoleOverride() {
  // Prevent double initialization
  if (isInitialized) return;

  // Check if we're in browser environment
  if (typeof window === 'undefined') return;

  // Check if logging is enabled
  if (window.CLAUDE_LOGGING_ENABLED !== 'true') return;

  // Make ConsoleLogger globally available for UAT testing
  (window as any).ConsoleLogger = ConsoleLogger;

  // Override each console method
  ['log', 'error', 'warn', 'info'].forEach(level => {
    (console as any)[level] = (...args: any[]) => {
      // Call original console method first
      (originalConsole as any)[level](...args);

      // Send to Convex (async, non-blocking)
      sendToConvex(level, args).catch(err => {
        // Fail silently to avoid console loops
        originalConsole.error('Console override error:', err);
      });
    };
  });

  isInitialized = true;
  originalConsole.log(
    'Claude logging initialized with trace ID:',
    currentTraceId
  );
}

async function sendToConvex(level: string, args: any[]) {
  const payload = {
    level,
    args: args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ),
    trace_id: currentTraceId,
    user_id: currentUserId,
    system_area: 'browser',
    timestamp: Date.now(),
    stack_trace: new Error().stack,
  };

  try {
    // Import Convex client and API dynamically to avoid issues during server-side rendering
    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('../../convex/_generated/api');

    // Get Convex URL from environment
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      originalConsole.error('NEXT_PUBLIC_CONVEX_URL not configured');
      return;
    }

    const client = new ConvexHttpClient(convexUrl);

    // Call the processLogs action
    await client.action(api.loggingAction.processLogs, payload);
  } catch (error) {
    // Log to original console only
    originalConsole.error('Failed to send log to Convex:', error);
  }
}

// Public API for trace management
export const ConsoleLogger = {
  setTraceId: (traceId: string) => {
    currentTraceId = traceId;
    originalConsole.log('Trace ID updated to:', traceId);
  },

  setUserId: (userId: string) => {
    currentUserId = userId;
    originalConsole.log('User ID updated to:', userId);
  },

  newTrace: () => {
    currentTraceId = generateTraceId();
    originalConsole.log('New trace created:', currentTraceId);
    return currentTraceId;
  },

  getTraceId: () => currentTraceId,

  getUserId: () => currentUserId,

  isEnabled: () =>
    typeof window !== 'undefined' && window.CLAUDE_LOGGING_ENABLED === 'true',

  getStatus: () => ({
    initialized: isInitialized,
    enabled:
      typeof window !== 'undefined'
        ? window.CLAUDE_LOGGING_ENABLED === 'true'
        : false,
    traceId: currentTraceId,
    userId: currentUserId,
  }),

  // Reset console to original methods
  reset: () => {
    if (!isInitialized) return;

    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;

    isInitialized = false;
    originalConsole.log('Console override reset');
  },
};
```

### 4. Environment Configuration

**File**: `apps/web/next.config.js`

```javascript
env: {
  CLAUDE_LOGGING_ENABLED: String(
    process.env.NODE_ENV === 'development' &&
    process.env.CLAUDE_LOGGING !== 'false'
  ),
}
```

**File**: `apps/web/.env.local`

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 5. Integration with App Router

**File**: `apps/web/app/layout.tsx`

```typescript
import { initializeConsoleOverride } from '@/lib/console-override';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Initialize console override in development
  useEffect(() => {
    initializeConsoleOverride();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Usage Examples

### Basic Logging

```typescript
// These will be captured and sent to Convex in development mode
console.log('User clicked submit button');
console.error('Validation failed:', {
  field: 'email',
  message: 'Invalid format',
});
console.warn('API response took longer than expected');
```

### Trace Management

```typescript
// Set custom trace ID for correlation
ConsoleLogger.setTraceId('checkout-flow-2025-01-24');

// Set user context
ConsoleLogger.setUserId('user-12345');

// Start new trace session
const newTraceId = ConsoleLogger.newTrace();

// Check current status
const status = ConsoleLogger.getStatus();
console.log('Logging status:', status);
```

### Function-based Stack Traces

```typescript
function processOrder(orderId: string) {
  try {
    validateOrder(orderId);
  } catch (error) {
    console.error('Order validation failed:', error);
    // Stack trace automatically captured showing processOrder -> validateOrder call chain
  }
}
```

## Testing

### Manual UAT Testing

```typescript
// Test trace management
ConsoleLogger.getTraceId(); // Returns current trace ID
ConsoleLogger.newTrace(); // Generates new trace ID
ConsoleLogger.getTraceId(); // Returns new trace ID
ConsoleLogger.setTraceId('custom_123'); // Sets custom trace ID
ConsoleLogger.getUserId(); // Returns current user ID

// Test log capture
console.log('Test message'); // Captured and sent to Convex
console.error('Test error'); // Captured with stack trace
```

### Backend Action Testing

```bash
# Test the Convex action directly
npx convex run loggingAction:processLogs '{"level":"log","args":["test"],"timestamp":1737718705000}'

# Expected response:
{
  "result": {
    "logQueueId": "js7bq9kdp6v5pdsm3p0w3bxxb97mb667",
    "recentLogId": "jx72p3s5e5dqz627n3edvbjm197mavvh"
  },
  "success": true
}
```

## Key Design Decisions

### Why Convex Actions instead of HTTP Actions?

**Problem**: HTTP Actions had deployment reliability issues in our environment
**Solution**: Use regular Convex Actions with ConvexHttpClient for type-safe communication
**Benefit**: More reliable deployment, better TypeScript integration, consistent error handling

### Why Dual Table Storage?

**log_queue**: For batch processing and persistent storage
**recent_log_entries**: For real-time UI with TTL for automatic cleanup
**Benefit**: Optimizes for both processing workflows and real-time monitoring

### Why Preserve Original Console Behavior?

**Approach**: Call original console methods first, then capture asynchronously
**Benefit**: Zero impact on development workflow, transparent to developers

## Performance Considerations

- **Non-blocking**: Log capture happens asynchronously, no impact on console performance
- **Development only**: Controlled by environment variables, zero production overhead
- **Error isolation**: Capture failures don't affect normal console operation
- **Memory efficient**: TTL on recent_log_entries prevents unbounded growth

## Security Considerations

- **Environment controlled**: Only enabled in development environment
- **No sensitive data**: Logs are development debugging output, not production data
- **User consent**: Developers are aware logging is active via console output
- **Automatic cleanup**: Recent logs expire after 1 hour

## Quota Management & Emergency Cleanup

### Emergency Cleanup Functions

When database gets too large (16K+ entries), use these emergency functions:

```bash
# Check if cleanup is needed
bunx convex run cleanup:status

# Run safe cleanup (deletes expired/old entries)
bunx convex run cleanup:safe

# Repeat until deletedCount returns 0
bunx convex run cleanup:safe
```

### Monitoring Commands

```bash
# Check database usage stats
bunx convex run monitoring:usage

# Find traces generating lots of logs
bunx convex run monitoring:traces

# Regular cleanup
bunx convex run cleanup:safe
```

### Rate Limiting Protection

The system includes built-in protection:

- **Frontend**: 50 logs/minute + duplicate detection
- **Backend**: 100 logs/minute per trace_id
- **Auto-cleanup**: TTL expiration for recent_log_entries

### Convex Quota Monitoring

Monitor usage at: https://dashboard.convex.dev

- **Function bandwidth**: Requests per month
- **Database operations**: Read/write counts
- **Storage usage**: Total database size
- **Action runtime**: Execution time

**Warning Signs**:

- "Too many bytes read" errors
- Function timeouts
- Dashboard showing >80% of any limit

**Emergency Response**:

1. Run `cleanup:status` to assess situation
2. Execute `cleanup:safe` repeatedly for maintenance or `cleanup:force` for testing
3. Monitor dashboard until usage returns to normal
4. Investigate high-volume traces with `getHighVolumeTraces`

## Future Enhancements

- **Chrome DevTools integration**: Remote debugging via Chrome DevTools Protocol
- **Log filtering**: UI for filtering logs by level, trace, or user
- **Real-time dashboard**: Live view of captured logs
- **Export functionality**: Download logs for offline analysis
- **Performance metrics**: Track console usage patterns

## Related Documentation

- [Backend Patterns: Browser Log Capture with Convex Actions](../patterns/backend-patterns.md#browser-log-capture-with-convex-actions)
- [Frontend Patterns: Console Override](../patterns/frontend-patterns.md#console-override-for-development-logging)
- [UAT Plan 3.1](../testing/uat-plan-3.1.md)
