// Log validation and processing logic

import type { WorkerLogRequest, RedisLogEntry } from './types';

// Sensitive data patterns for redaction
const SENSITIVE_PATTERNS = [
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
  // Add API keys and other common sensitive patterns
  {
    pattern: /api[_-]?key["']\s*:\s*["']([^"']+)["']/gi,
    replacement: 'api_key": "[REDACTED]"',
  },
  {
    pattern: /bearer\s+([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)/gi,
    replacement: 'bearer [REDACTED]',
  },
];

// Noise suppression patterns - these messages are ignored
const SUPPRESSED_PATTERNS = [
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

  // Worker-specific noise
  'Script will terminate',
  'Worker script error',
];

export class LogProcessor {
  static validateRequest(request: WorkerLogRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request.trace_id) {
      return { valid: false, error: 'trace_id is required' };
    }

    if (!request.message) {
      return { valid: false, error: 'message is required' };
    }

    if (!['log', 'info', 'warn', 'error'].includes(request.level)) {
      return {
        valid: false,
        error: 'level must be one of: log, info, warn, error',
      };
    }

    if (
      request.system &&
      !['browser', 'convex', 'worker', 'manual'].includes(request.system)
    ) {
      return {
        valid: false,
        error: 'system must be one of: browser, convex, worker, manual',
      };
    }

    return { valid: true };
  }

  static shouldSuppressMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    return SUPPRESSED_PATTERNS.some(pattern =>
      lowerMessage.includes(pattern.toLowerCase())
    );
  }

  static redactSensitiveData(text: string): string {
    let redactedText = text;

    SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
      redactedText = redactedText.replace(pattern, replacement);
    });

    return redactedText;
  }

  static detectSystemFromHeaders(
    headers: Headers
  ): 'browser' | 'convex' | 'worker' | 'manual' {
    const origin = headers.get('origin') || '';
    const userAgent = headers.get('user-agent') || '';
    const referer = headers.get('referer') || '';

    // Check for browser indicators
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      referer.includes('localhost') ||
      referer.includes('127.0.0.1')
    ) {
      return 'browser';
    }

    // Check for Cloudflare Worker indicators
    if (
      userAgent.toLowerCase().includes('worker') ||
      userAgent.toLowerCase().includes('cloudflare')
    ) {
      return 'worker';
    }

    // Check for Convex indicators
    if (
      userAgent.toLowerCase().includes('convex') ||
      origin.includes('convex')
    ) {
      return 'convex';
    }

    // Default fallback
    return 'manual';
  }

  static processLogRequest(
    request: WorkerLogRequest,
    headers: Headers
  ): { processedEntry: RedisLogEntry; shouldProcess: boolean } {
    // Check if message should be suppressed
    if (this.shouldSuppressMessage(request.message)) {
      return {
        processedEntry: {} as RedisLogEntry,
        shouldProcess: false,
      };
    }

    // Auto-detect system if not provided
    const system = request.system || this.detectSystemFromHeaders(headers);

    // Redact sensitive data
    const redactedMessage = this.redactSensitiveData(request.message);
    const redactedStack = request.stack
      ? this.redactSensitiveData(request.stack)
      : undefined;

    // Process context data
    let redactedContext: Record<string, any> | undefined;
    if (request.context) {
      try {
        const contextStr = JSON.stringify(request.context);
        const redactedContextStr = this.redactSensitiveData(contextStr);
        try {
          redactedContext = JSON.parse(redactedContextStr);
        } catch {
          redactedContext = {
            error: 'Failed to parse context after redaction',
          };
        }
      } catch {
        // Handle circular references or other JSON.stringify errors
        redactedContext = { error: 'Failed to parse context after redaction' };
      }
    }

    const processedEntry: RedisLogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trace_id: request.trace_id,
      user_id: request.user_id,
      system,
      level: request.level,
      message: redactedMessage,
      stack: redactedStack,
      timestamp: Date.now(),
      context: redactedContext,
    };

    return { processedEntry, shouldProcess: true };
  }

  static generateHealthReport(): Record<string, any> {
    return {
      processor_status: 'healthy',
      redaction_patterns: SENSITIVE_PATTERNS.length,
      suppression_patterns: SUPPRESSED_PATTERNS.length,
      supported_levels: ['log', 'info', 'warn', 'error'],
      supported_systems: ['browser', 'convex', 'worker', 'manual'],
      timestamp: Date.now(),
    };
  }
}
