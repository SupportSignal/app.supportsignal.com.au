// Jest global type definitions for Cloudflare Workers testing environment
// Based on testing infrastructure patterns from docs/testing/technical/

// Cloudflare Workers global types
declare global {
  class ExecutionContext {
    waitUntil(promise: Promise<any>): void;
    passThroughOnException(): void;
  }

  interface DurableObjectState {
    storage: {
      get<T = any>(key: string): Promise<T | undefined>;
      put<T = any>(key: string, value: T): Promise<void>;
      delete(key: string): Promise<boolean>;
      list<T = any>(options?: any): Promise<Map<string, T>>;
    };
    id: {
      toString(): string;
      equals(other: any): boolean;
    };
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  }

  interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
  }
}

// Mock ExecutionContext for tests
(global as any).ExecutionContext = class MockExecutionContext {
  waitUntil(promise: Promise<any>): void {
    // Mock implementation
  }

  passThroughOnException(): void {
    // Mock implementation
  }
};

export {};
