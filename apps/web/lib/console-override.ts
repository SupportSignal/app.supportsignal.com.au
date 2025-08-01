/* eslint-disable no-console, no-restricted-syntax */
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

// Rate limiting window management (now mostly for client-side cleanup)
const BASE_LIMIT = 50; // Starting limit
let rateLimitResetTime = Date.now() + 60000; // 1 minute from now

// Loop detection - track recent identical messages
const recentMessages = new Map<string, { count: number; lastSeen: number }>();
const DUPLICATE_WINDOW = 1000; // 1 second
const MAX_DUPLICATES = 5; // Max identical messages in window

// Message suppression - client-side filtering
const suppressedPatterns = new Set([
  // Hot Module Reload noise
  '[HMR]',
  'unexpected require',
  'disposed module',

  // Development-only noise
  'webpack-internal',
  'webpack-hot-middleware',
  'hot-update',
  '[Fast Refresh]',

  // React DevTools noise
  'React DevTools',
  'DevTools detected',

  // Common browser noise
  'Received an error',
  'Non-Error promise rejection',

  // Add more patterns as discovered
]);

// Sensitive data patterns for redaction
const sensitivePatterns = [
  {
    pattern: /access_token["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'access_token": "[REDACTED]"',
  },
  {
    pattern: /client_secret["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'client_secret": "[REDACTED]"',
  },
  {
    pattern: /refresh_token["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'refresh_token": "[REDACTED]"',
  },
  {
    pattern: /token["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'token": "[REDACTED]"',
  },
  {
    pattern: /password["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'password": "[REDACTED]"',
  },
  {
    pattern: /secret["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'secret": "[REDACTED]"',
  },
];

function redactSensitiveData(args: unknown[]): unknown[] {
  return args.map(arg => {
    let stringArg = typeof arg === 'object' ? JSON.stringify(arg) : String(arg);

    // Apply all redaction patterns
    sensitivePatterns.forEach(({ pattern, replacement }) => {
      stringArg = stringArg.replace(pattern, replacement);
    });

    // Try to parse back to object if it was originally an object
    if (typeof arg === 'object') {
      try {
        return JSON.parse(stringArg);
      } catch {
        return stringArg; // Return as string if parsing fails
      }
    }

    return stringArg;
  });
}

function shouldSuppressMessage(level: string, args: unknown[]): boolean {
  const message = args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');

  // Check against suppression patterns
  for (const pattern of suppressedPatterns) {
    if (message.includes(pattern)) {
      // Log suppression locally for debugging
      originalConsole.log(
        `🔇 Suppressed log: ${pattern} in "${message.substring(0, 100)}..."`
      );
      return true;
    }
  }

  return false;
}

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
  (window as unknown as Record<string, unknown>).ConsoleLogger = ConsoleLogger;

  // Override each console method
  ['log', 'error', 'warn', 'info'].forEach(level => {
    (console as unknown as Record<string, (...args: unknown[]) => void>)[
      level
    ] = (...args: unknown[]) => {
      // Call original console method first (always preserve local console)
      (
        originalConsole as unknown as Record<
          string,
          (...args: unknown[]) => void
        >
      )[level](...args);

      // Check if message should be suppressed
      if (shouldSuppressMessage(level, args)) {
        return; // Skip sending to Convex, but keep local console output
      }

      // Redact sensitive data before sending to Convex
      const redactedArgs = redactSensitiveData(args);

      // Send redacted data to Worker (async, non-blocking)
      sendToWorker(level, redactedArgs).catch(err => {
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

// Legacy function kept for backward compatibility in status reporting
function getAdaptiveLimit(): number {
  return BASE_LIMIT; // Now uses centralized rate limiting
}

async function sendToWorker(level: string, args: unknown[]) {
  // Client-side pre-filtering for obvious issues, but rely on Worker rate limiting for protection
  const now = Date.now();

  // Basic client-side duplicate prevention (lightweight check)
  const messageKey = `${level}:${args
    .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ')}`;

  const existing = recentMessages.get(messageKey);
  if (existing && now - existing.lastSeen < DUPLICATE_WINDOW) {
    existing.count++;
    existing.lastSeen = now;

    if (existing.count > MAX_DUPLICATES) {
      originalConsole.warn(
        `Client-side duplicate detection: dropping message (${existing.count} times)`
      );
      return;
    }
  } else {
    recentMessages.set(messageKey, { count: 1, lastSeen: now });
  }

  // Clean up old message tracking
  if (now > rateLimitResetTime) {
    recentMessages.clear();
    rateLimitResetTime = now + 60000;
  }

  const payload = {
    trace_id: currentTraceId,
    message: args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '),
    level: level as 'log' | 'info' | 'warn' | 'error',
    system: 'browser' as const,
    user_id: currentUserId,
    stack: new Error().stack,
    context: {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    },
  };

  try {
    // Get Worker URL from environment
    const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL || 'https://log-ingestion.your-worker-domain.workers.dev';
    
    const response = await fetch(`${workerUrl}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': typeof window !== 'undefined' ? window.location.origin : 'unknown',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    // Handle rate limiting responses
    if (!result.success && response.status === 429) {
      originalConsole.warn('Worker rate limit exceeded:', result.error);
      
      // Update local tracking to reflect server-side limits
      if (result.remaining_quota !== undefined) {
        originalConsole.log('Remaining quota:', result.remaining_quota);
      }
      return; // Don't retry rate-limited requests
    }

    if (!result.success) {
      originalConsole.warn('Worker logging failed:', result.error);
    }
  } catch (error) {
    // Log to original console only
    originalConsole.error('Failed to send log to Worker:', error);
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
    rateLimiting: {
      note: 'Now using Worker-based rate limiting with Redis backend',
      currentLimit: getAdaptiveLimit(),
      baseLimit: BASE_LIMIT,
      timeUntilReset: Math.max(0, rateLimitResetTime - Date.now()),
    },
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

  // Suppression management
  getSuppressedPatterns: () => Array.from(suppressedPatterns),

  addSuppressionPattern: (pattern: string) => {
    suppressedPatterns.add(pattern);
    originalConsole.log(`Added suppression pattern: ${pattern}`);
  },

  removeSuppressionPattern: (pattern: string) => {
    suppressedPatterns.delete(pattern);
    originalConsole.log(`Removed suppression pattern: ${pattern}`);
  },

  // Redaction management
  getSensitivePatterns: () => sensitivePatterns.map(p => p.pattern.source),

  addRedactionPattern: (pattern: string, replacement = '[REDACTED]') => {
    sensitivePatterns.push({
      pattern: new RegExp(pattern, 'gi'),
      replacement,
    });
    originalConsole.log(
      `Added redaction pattern: ${pattern} -> ${replacement}`
    );
  },

  testRedaction: (testString: string) => {
    const result = redactSensitiveData([testString]);
    originalConsole.log('Redaction test:', {
      original: testString,
      redacted: result[0],
    });
    return result[0];
  },
};
