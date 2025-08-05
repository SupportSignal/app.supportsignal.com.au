// Worker-based rate limiting using Durable Objects for state management

import type { RateLimitConfig, RateLimitState } from './types';

// Rate limiting configuration based on cost constraints
const RATE_LIMIT_CONFIG: RateLimitConfig = {
  global_limit: 1000, // 1000 logs/hour total
  system_quotas: {
    browser: 400, // 40% = 400 logs/hour
    convex: 300, // 30% = 300 logs/hour
    worker: 300, // 30% = 300 logs/hour
  },
  per_trace_limit: 100, // 100 logs/hour per trace_id
  window_ms: 60 * 60 * 1000, // 1 hour window
};

export class RateLimiterDO {
  private state: DurableObjectState;
  private rateLimitState: RateLimitState | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/check' && request.method === 'POST') {
      return this.handleRateLimitCheck(request);
    }

    if (url.pathname === '/reset' && request.method === 'POST') {
      return this.handleReset();
    }

    if (url.pathname === '/status' && request.method === 'GET') {
      return this.handleStatus();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleRateLimitCheck(request: Request): Promise<Response> {
    const { system, trace_id } = (await request.json()) as any;

    // Initialize or get current state
    await this.initializeState();

    const now = Date.now();
    const windowStart = this.rateLimitState!.window_start;

    // Reset window if expired
    if (now - windowStart >= RATE_LIMIT_CONFIG.window_ms) {
      await this.resetWindow(now);
    }

    // Check global limit
    if (this.rateLimitState!.global_current >= RATE_LIMIT_CONFIG.global_limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: 'Global rate limit exceeded',
          remaining_quota: 0,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // Check system-specific limit
    const systemCurrent =
      (this.rateLimitState!.system_current as any)[system] || 0;
    const systemLimit = (RATE_LIMIT_CONFIG.system_quotas as any)[system];

    if (systemCurrent >= systemLimit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: `${system} system rate limit exceeded`,
          remaining_quota: systemLimit - systemCurrent,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // Check per-trace limit
    const traceCurrent = this.rateLimitState!.trace_counts[trace_id] || 0;
    if (traceCurrent >= RATE_LIMIT_CONFIG.per_trace_limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: `Per-trace rate limit exceeded for ${trace_id}`,
          remaining_quota: RATE_LIMIT_CONFIG.per_trace_limit - traceCurrent,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // Allow the request and update counters
    this.rateLimitState!.global_current++;
    (this.rateLimitState!.system_current as any)[system] = systemCurrent + 1;
    this.rateLimitState!.trace_counts[trace_id] = traceCurrent + 1;

    // Persist state
    await this.state.storage.put('rateLimitState', this.rateLimitState);

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining_quota: systemLimit - (systemCurrent + 1),
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  private async handleReset(): Promise<Response> {
    await this.resetWindow(Date.now());
    return new Response(
      JSON.stringify({ success: true, message: 'Rate limits reset' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  private async handleStatus(): Promise<Response> {
    await this.initializeState();

    return new Response(
      JSON.stringify({
        config: RATE_LIMIT_CONFIG,
        current_state: this.rateLimitState,
        window_remaining_ms: Math.max(
          0,
          RATE_LIMIT_CONFIG.window_ms -
            (Date.now() - this.rateLimitState!.window_start)
        ),
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  private async initializeState(): Promise<void> {
    if (!this.rateLimitState) {
      this.rateLimitState = (await this.state.storage.get(
        'rateLimitState'
      )) || {
        global_current: 0,
        system_current: {
          browser: 0,
          convex: 0,
          worker: 0,
        },
        trace_counts: {},
        window_start: Date.now(),
      };
    }
  }

  private async resetWindow(now: number): Promise<void> {
    this.rateLimitState = {
      global_current: 0,
      system_current: {
        browser: 0,
        convex: 0,
        worker: 0,
      },
      trace_counts: {},
      window_start: now,
    };

    await this.state.storage.put('rateLimitState', this.rateLimitState);
  }
}

// Helper function to check rate limits from the main worker
export async function checkRateLimit(
  rateLimiterDO: DurableObjectStub,
  system: string,
  traceId: string
): Promise<{ allowed: boolean; reason?: string; remaining_quota?: number }> {
  const response = await rateLimiterDO.fetch('http://localhost/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, trace_id: traceId }),
  });

  return await response.json();
}
