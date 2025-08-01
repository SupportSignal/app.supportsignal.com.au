// Shared type definitions for log ingestion worker

export interface RedisLogEntry {
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

export interface WorkerLogRequest {
  trace_id: string;
  message: string;
  level: 'log' | 'info' | 'warn' | 'error';
  system?: 'browser' | 'convex' | 'worker'; // Auto-detected if not provided
  context?: Record<string, any>;
  user_id?: string;
  stack?: string;
}

export interface WorkerLogResponse {
  success: boolean;
  trace_id: string;
  remaining_quota?: number;
  error?: string;
}

export interface RateLimitConfig {
  global_limit: number; // 1000 logs/hour total
  system_quotas: {
    browser: number; // 40% of global
    convex: number; // 30% of global
    worker: number; // 30% of global
  };
  per_trace_limit: number; // 100 logs/hour per trace_id
  window_ms: number; // Rate limit window duration
}

export interface RateLimitState {
  global_current: number;
  system_current: {
    browser: number;
    convex: number;
    worker: number;
  };
  trace_counts: Record<string, number>;
  window_start: number;
}

export interface Environment {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  RATE_LIMIT_STATE: DurableObjectNamespace; // For rate limiting state
}