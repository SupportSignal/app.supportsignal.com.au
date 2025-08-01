// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock problematic modules that cause filename issues
jest.mock('@pkgr/core', () => ({}), { virtual: true });
jest.mock('synckit', () => ({}), { virtual: true });

// Mock the convex module early to prevent initialization issues
jest.mock(
  '@/lib/convex',
  () => ({
    convex: {
      query: jest.fn(),
      mutation: jest.fn(),
      action: jest.fn(),
      subscribe: jest.fn(),
    },
  }),
  { virtual: true }
);

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  },
}));

// Mock Convex provider and hooks
jest.mock('convex/react', () => ({
  ConvexProvider: ({ children }) => children,
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useConvexAuth: jest.fn(() => ({
    isAuthenticated: false,
    isLoading: false,
  })),
  ConvexReactClient: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    mutation: jest.fn(),
    subscribe: jest.fn(),
  })),
}));

// Mock convex-api module
jest.mock('@/lib/convex-api', () => ({
  api: {
    queries: {
      getTestMessage: jest.fn(),
      getTestMessages: jest.fn(),
    },
    auth: {
      registerUser: jest.fn(),
      loginUser: jest.fn(),
      logoutUser: jest.fn(),
      changePassword: jest.fn(),
      requestPasswordReset: jest.fn(),
      resetPassword: jest.fn(),
      getGitHubOAuthUrl: jest.fn(),
      githubOAuthLogin: jest.fn(),
      getGoogleOAuthUrl: jest.fn(),
      googleOAuthLogin: jest.fn(),
    },
    users: {
      getCurrentUser: jest.fn(),
    },
    loggingAction: {
      processLogs: jest.fn(),
    },
    rateLimiter: {
      getRateLimitState: jest.fn(),
      checkAndUpdateRateLimit: jest.fn(),
      updateRateLimitState: jest.fn(),
      initializeRateLimitState: jest.fn(),
      getCalculatedLimits: jest.fn(),
      getCostMetrics: jest.fn(),
    },
    monitoring: {
      usage: jest.fn(),
      traces: jest.fn(),
    },
    cleanup: {
      status: jest.fn(),
      safe: jest.fn(),
      force: jest.fn(),
    },
    logCorrelation: {
      getCorrelatedLogs: jest.fn(),
      getRecentTraces: jest.fn(),
      searchLogs: jest.fn(),
      getTraceInsights: jest.fn(),
      getCorrelationStats: jest.fn(),
    },
  },
}));

// Setup global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollIntoView for DOM elements
Element.prototype.scrollIntoView = jest.fn();

// Mock clipboard API - ensure navigator exists first
if (typeof navigator !== 'undefined') {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
    },
  });
} else {
  global.navigator = {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
      readText: jest.fn().mockResolvedValue(''),
    },
    userAgent: 'jest',
  };
}

// Mock window.alert
global.alert = jest.fn();

// Mock window.confirm
global.confirm = jest.fn().mockReturnValue(true);

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock crypto.randomUUID for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => `mock-uuid-${Date.now()}-${Math.random()}`),
  },
});

// Suppress console errors during tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Remove this mock to let auth tests use their real AuthProvider
// The custom render in test-utils.tsx provides the proper test context when needed
