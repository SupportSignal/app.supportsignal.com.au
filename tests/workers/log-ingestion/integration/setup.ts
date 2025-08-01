// Jest setup for Cloudflare Worker testing environment
// Sets up Worker globals, mocks, and test utilities
// @ts-nocheck

import { jest } from '@jest/globals';

// Mock Cloudflare Worker globals
global.Request = class MockRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  body: any;

  constructor(url: string, init?: RequestInit) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Map();
    this.body = init?.body;

    // Set headers from init
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string'
      ? this.body
      : JSON.stringify(this.body);
  }
} as any;

// Mock Headers class - must be defined before MockResponse
global.Headers = class MockHeaders {
  private headers: Map<string, string>;

  constructor(init?: HeadersInit) {
    this.headers = new Map();

    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
  }

  get(name: string) {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name: string) {
    return this.headers.has(name.toLowerCase());
  }

  delete(name: string) {
    this.headers.delete(name.toLowerCase());
  }

  forEach(callback: (value: string, key: string) => void) {
    this.headers.forEach(callback);
  }
} as any;

// Mock Response class - uses Headers (which is MockHeaders)
global.Response = class MockResponse {
  status: number;
  statusText: string;
  headers: Headers;
  body: any;
  ok: boolean;

  constructor(body?: any, init?: ResponseInit) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === 'string'
      ? this.body
      : JSON.stringify(this.body);
  }

  static json(body: any, init?: ResponseInit) {
    return new MockResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  }
} as any;

// Mock URLSearchParams for proper query parameter handling
class MockURLSearchParams {
  private params: Map<string, string>;

  constructor(search?: string) {
    this.params = new Map();

    if (search) {
      // Remove leading '?' if present
      const cleanSearch = search.startsWith('?') ? search.slice(1) : search;

      // Parse query parameters
      if (cleanSearch) {
        cleanSearch.split('&').forEach(pair => {
          const [key, value = ''] = pair.split('=');
          if (key) {
            this.params.set(decodeURIComponent(key), decodeURIComponent(value));
          }
        });
      }
    }
  }

  get(name: string): string | null {
    return this.params.get(name) || null;
  }

  set(name: string, value: string): void {
    this.params.set(name, value);
  }

  has(name: string): boolean {
    return this.params.has(name);
  }

  delete(name: string): void {
    this.params.delete(name);
  }

  append(name: string, value: string): void {
    const existing = this.params.get(name);
    if (existing) {
      this.params.set(name, `${existing},${value}`);
    } else {
      this.params.set(name, value);
    }
  }

  toString(): string {
    const pairs: string[] = [];
    this.params.forEach((value, key) => {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    return pairs.join('&');
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.params.forEach(callback);
  }
}

// Mock URL constructor for Worker environment - enhanced version with searchParams
global.URL = class MockURL {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  href: string;
  origin: string;
  searchParams: MockURLSearchParams;

  constructor(url: string, base?: string) {
    // Handle relative URLs with base
    let fullUrl = url;
    if (base && !url.startsWith('http')) {
      const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
      fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
    }

    // Simple but robust URL parsing
    this.href = fullUrl;

    // Extract protocol
    const protocolMatch = fullUrl.match(/^(https?:)/);
    this.protocol = protocolMatch ? protocolMatch[1] : 'http:';

    // Extract hostname and port
    const hostMatch = fullUrl.match(/https?:\/\/([^\/\?#]+)/);
    if (hostMatch) {
      const hostPart = hostMatch[1];
      const portMatch = hostPart.match(/^([^:]+):(\d+)$/);
      if (portMatch) {
        this.hostname = portMatch[1];
        this.port = portMatch[2];
      } else {
        this.hostname = hostPart;
        this.port = this.protocol === 'https:' ? '443' : '80';
      }
    } else {
      this.hostname = 'localhost';
      this.port = '3000';
    }

    this.origin = `${this.protocol}//${this.hostname}${this.port !== '80' && this.port !== '443' ? ':' + this.port : ''}`;

    // Extract pathname
    const pathMatch = fullUrl.match(/https?:\/\/[^\/]+(\/?[^?#]*)/);
    this.pathname = pathMatch ? pathMatch[1] || '/' : '/';

    // Extract search
    const searchMatch = fullUrl.match(/\?([^#]*)/);
    this.search = searchMatch ? `?${searchMatch[1]}` : '';

    // Extract hash
    const hashMatch = fullUrl.match(/#(.*)$/);
    this.hash = hashMatch ? `#${hashMatch[1]}` : '';

    // Initialize searchParams with parsed query string
    this.searchParams = new MockURLSearchParams(this.search);
  }
} as any;

// Mock fetch with comprehensive Redis simulation
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock ExecutionContext
global.ExecutionContext = class MockExecutionContext {
  waitUntil(promise: Promise<any>) {
    return promise;
  }

  passThroughOnException() {
    // No-op for testing
  }
} as any;

// Mock DurableObjectState for rate limiter testing
export class MockDurableObjectState {
  private storageMap: Map<string, any> = new Map();
  public storage: any;

  constructor() {
    this.storage = {
      get: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(this.storageMap.get(key));
      }),
      put: jest.fn().mockImplementation((key: string, value: any) => {
        this.storageMap.set(key, value);
        return Promise.resolve();
      }),
      delete: jest.fn().mockImplementation((key: string) => {
        this.storageMap.delete(key);
        return Promise.resolve();
      }),
      list: jest.fn().mockImplementation(() => {
        return Promise.resolve(this.storageMap);
      }),
    };
  }

  // Return storage interface for testing
  getStorage() {
    return this.storage;
  }

  // Reset storage between tests
  reset() {
    this.storageMap.clear();
  }
}

global.DurableObjectState = MockDurableObjectState as any;

// Mock DurableObjectStub for main worker testing with actual rate limiting simulation
export class MockDurableObjectStub {
  private config = {
    global_limit: 1000,
    system_quotas: { browser: 400, convex: 300, worker: 300 },
    per_trace_limit: 100,
    window_ms: 3600000,
  };

  private state = {
    global_current: 0,
    system_current: { browser: 0, convex: 0, worker: 0 },
    trace_counts: {} as Record<string, number>,
    window_start: Date.now(),
  };

  constructor() {
    this.resetState();
  }

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    if (pathname === '/status' && init?.method !== 'POST') {
      return new Response(
        JSON.stringify({
          config: this.config,
          current_state: { ...this.state },
          window_remaining_ms: Math.max(
            0,
            this.config.window_ms - (Date.now() - this.state.window_start)
          ),
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    if (pathname === '/check' && init?.method === 'POST') {
      return this.handleRateLimitCheck(init);
    }

    if (pathname === '/reset' && init?.method === 'POST') {
      this.resetState();
      return new Response(
        JSON.stringify({ success: true, message: 'Rate limits reset' }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  private async handleRateLimitCheck(init: RequestInit): Promise<Response> {
    const body = JSON.parse(init.body as string);
    const { system, trace_id } = body;

    // Check if window has expired
    const now = Date.now();
    if (now - this.state.window_start >= this.config.window_ms) {
      this.resetState(now);
    }

    // Check global limit
    if (this.state.global_current >= this.config.global_limit) {
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

    // Check system limit
    const systemCurrent = this.state.system_current[system] || 0;
    const systemLimit = this.config.system_quotas[system];

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
    const traceCurrent = this.state.trace_counts[trace_id] || 0;
    if (traceCurrent >= this.config.per_trace_limit) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: `Per-trace rate limit exceeded for ${trace_id}`,
          remaining_quota: this.config.per_trace_limit - traceCurrent,
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // Allow the request and update counters
    this.state.global_current++;
    this.state.system_current[system] = systemCurrent + 1;
    this.state.trace_counts[trace_id] = traceCurrent + 1;

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

  resetState(windowStart?: number) {
    this.state = {
      global_current: 0,
      system_current: { browser: 0, convex: 0, worker: 0 },
      trace_counts: {},
      window_start: windowStart || Date.now(),
    };
  }

  // For testing - set custom state
  setState(newState: Partial<typeof this.state>) {
    this.state = { ...this.state, ...newState };
  }

  // For testing - get current state
  getState() {
    return { ...this.state };
  }

  // Test helper methods for simulating different rate limit scenarios
  simulateRateLimit(system: string) {
    // Set system to be at or above its limit
    const systemLimit = this.config.system_quotas[system];
    if (systemLimit) {
      this.state.system_current[system] = systemLimit;
    }
  }

  simulateGlobalRateLimit() {
    // Set global to be at limit
    this.state.global_current = this.config.global_limit;
  }

  simulateTraceRateLimit(traceId: string) {
    // Set specific trace to be at limit
    this.state.trace_counts[traceId] = this.config.per_trace_limit;
  }

  // Test helper to check if a system is rate limited
  isSystemRateLimited(system: string): boolean {
    const systemCurrent = this.state.system_current[system] || 0;
    const systemLimit = this.config.system_quotas[system];
    return systemCurrent >= systemLimit;
  }

  // Test helper to check if global is rate limited
  isGlobalRateLimited(): boolean {
    return this.state.global_current >= this.config.global_limit;
  }
}

global.DurableObjectStub = MockDurableObjectStub as any;

// Mock Environment for testing
export interface MockEnvironment {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  RATE_LIMIT_STATE: any; // Simplified for testing
}

// Per-file instance management for complete test isolation
let currentRateLimiterStub: MockDurableObjectStub | null = null;

export function createMockEnvironment(): MockEnvironment {
  // Create fresh instance for each test file (managed by setupGlobalTestCleanup)
  if (!currentRateLimiterStub) {
    currentRateLimiterStub = new MockDurableObjectStub();
  }

  return {
    UPSTASH_REDIS_REST_URL: 'https://mock-redis.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'mock-token-123',
    RATE_LIMIT_STATE: {
      idFromName: jest.fn().mockReturnValue('mock-id'),
      get: jest.fn().mockReturnValue(currentRateLimiterStub),
      newUniqueId: jest.fn().mockReturnValue('mock-unique-id'),
      idFromString: jest.fn().mockReturnValue('mock-string-id'),
      jurisdiction: undefined,
    } as any,
  };
}

// Helper to reset rate limiter state between individual tests (within a file)
export function resetRateLimiterState() {
  if (currentRateLimiterStub) {
    currentRateLimiterStub.resetState();
  }
}

// Helper to create completely fresh instance (for cross-file isolation)
export function createFreshRateLimiterInstance() {
  currentRateLimiterStub = new MockDurableObjectStub();
  return currentRateLimiterStub;
}

// Helper to destroy current instance (for complete cleanup)
export function destroyRateLimiterInstance() {
  currentRateLimiterStub = null;
}

// Redis mock responses for different scenarios
export const RedisMockResponses = {
  // Successful operations
  PING: { result: 'PONG' },
  LPUSH: { result: 1 },
  EXPIRE: { result: 1 },
  LRANGE: { result: ['{"id":"test-1","message":"test"}'] },
  LLEN: { result: 1 },
  KEYS: { result: ['logs:trace-123', 'logs:trace-456'] },

  // Pipeline responses
  PIPELINE_SUCCESS: [
    { result: 1 }, // LPUSH
    { result: 1 }, // EXPIRE
  ],

  // Error responses
  ERROR: { error: 'ERR mock redis error' },
  NETWORK_ERROR: 'NETWORK_ERROR', // Special marker for network errors

  // Health check responses
  HEALTHY: { result: 'PONG' },
  UNHEALTHY: { error: 'Connection refused' },
};

// Setup Redis mock responses helper
export function setupRedisMock(scenarios: Record<string, any>) {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
    const urlString = url.toString();

    // Parse Redis command from request body
    let command = '';
    if (init?.body) {
      try {
        const body = JSON.parse(init.body as string);
        command = Array.isArray(body) ? body[0] : '';
      } catch {
        command = '';
      }
    }

    // Check for pipeline requests
    if (urlString.includes('/pipeline')) {
      return new Response(
        JSON.stringify(
          scenarios.PIPELINE || RedisMockResponses.PIPELINE_SUCCESS
        ),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    // Handle specific Redis commands
    const responseData = scenarios[command] || RedisMockResponses[command];

    if (responseData === 'NETWORK_ERROR') {
      throw new Error('Network error');
    }

    if (responseData?.error) {
      return new Response(JSON.stringify(responseData), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(responseData || { result: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
}

// Test utilities
export const TestUtils = {
  // Create mock log request
  mockLogRequest: (overrides = {}) => ({
    trace_id: 'test-trace-123',
    message: 'Test log message',
    level: 'info' as const,
    system: 'browser' as const,
    timestamp: Date.now(),
    ...overrides,
  }),

  // Create mock headers
  mockHeaders: (overrides = {}) =>
    new Headers({
      'content-type': 'application/json',
      origin: 'https://localhost:3000',
      'user-agent': 'Mozilla/5.0 (Test Browser)',
      ...overrides,
    }),

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Assert response structure
  assertSuccessResponse: (response: any) => {
    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('trace_id');
    expect(typeof response.trace_id).toBe('string');
  },

  assertErrorResponse: (response: any, expectedError?: string) => {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    if (expectedError) {
      expect(response.error).toContain(expectedError);
    }
  },
};

// Global test cleanup with cross-file isolation (to be called in test files)
export const setupGlobalTestCleanup = () => {
  // Per-file setup: Create fresh instance for complete cross-file isolation
  beforeAll(() => {
    createFreshRateLimiterInstance();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock environment state
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
    // Reset rate limiter state for test isolation (within file)
    resetRateLimiterState();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Per-file cleanup: Destroy instance to prevent cross-file contamination
  afterAll(() => {
    destroyRateLimiterInstance();
  });
};

console.log('Worker testing environment setup complete');
