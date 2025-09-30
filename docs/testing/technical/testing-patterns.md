# Testing Patterns

## Overview

This document outlines established patterns for testing across all layers of the application, including unit tests, integration tests, and end-to-end testing.

## Unit Testing Patterns

### Component Testing with React Testing Library

**Context**: Testing React components in isolation
**Implementation**:

- Use `@testing-library/react` for component testing
- Test user interactions, not implementation details
- Use proper queries (getByRole, getByLabelText)
- Mock external dependencies

**Example**:

```typescript
// Custom render function with providers
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConvexProvider } from 'convex/react';
import { AuthProvider } from '../auth-provider';

function renderWithProviders(ui: React.ReactElement, options = {}) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <ConvexProvider client={mockConvexClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ConvexProvider>
  );

  return render(ui, { wrapper: AllProviders, ...options });
}

// Component test with user interactions
describe('LoginForm', () => {
  it('should submit form when valid credentials provided', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ success: true });
    jest.mocked(useAuth).mockReturnValue({ login: mockLogin });

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
```

**Rationale**: Ensures components work correctly from user perspective

### Hook Testing

**Context**: Testing custom React hooks
**Implementation**:

- Use `@testing-library/react-hooks` for hook testing
- Test hook behavior and state changes
- Mock dependencies appropriately
- Test error conditions

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Validates hook logic independently of components

### Utility Function Testing

**Context**: Testing pure functions and utilities
**Implementation**:

- Use Jest for utility function testing
- Test edge cases and error conditions
- Use descriptive test names
- Group related tests with describe blocks

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures utility functions behave correctly across all scenarios

## Integration Testing Patterns

### Convex Function Testing

**Context**: Testing Convex queries, mutations, and actions
**Implementation**:

- Use Convex testing utilities
- Test with realistic data scenarios
- Mock external API calls in actions
- Validate database state changes

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures backend functions work correctly with real data

### API Integration Testing

**Context**: Testing complete API workflows
**Implementation**:

- Test end-to-end API scenarios
- Use test database instances
- Validate real-time subscriptions
- Test error handling and recovery

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Validates complete backend workflows

### Authentication Testing

**Context**: Testing authentication and authorization
**Implementation**:

- Test authenticated and unauthenticated states
- Validate permission checks
- Test session management
- Mock authentication providers

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures security measures work correctly

## End-to-End Testing Patterns

### Playwright E2E Testing

**Context**: Testing complete user workflows
**Implementation**:

- Use Playwright for browser automation
- Test critical user journeys
- Handle async operations properly
- Use page object patterns for maintainability

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Validates application works correctly for real users

### Cross-Browser Testing

**Context**: Ensuring compatibility across browsers
**Implementation**:

- Test on Chrome, Firefox, and Safari
- Validate responsive design
- Test accessibility features
- Handle browser-specific behaviors

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures consistent user experience across platforms

## Test Data Management

### Test Data Fixtures

**Context**: Managing test data across tests
**Implementation**:

- Use consistent test data factories
- Create minimal, focused test data
- Clean up test data after tests
- Use realistic but not real data

**Example**:

```typescript
// Centralized test fixtures
export const mockUser = {
  _id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  profile_image_url: 'https://example.com/avatar.jpg',
  role: 'user',
  _creationTime: Date.now(),
};

export const createMockAuthResult = (overrides = {}) => ({
  success: true,
  user: mockUser,
  sessionToken: 'mock-session-token',
  ...overrides,
});

// Usage in tests
describe('Authentication', () => {
  it('should handle successful login', async () => {
    const expectedResult = createMockAuthResult();
    mockConvex.mutation.mockResolvedValue(expectedResult);

    const result = await authService.login('test@example.com', 'password');

    expect(result).toEqual(expectedResult);
  });

  it('should handle login failure', async () => {
    const failureResult = createMockAuthResult({
      success: false,
      user: null,
      error: 'Invalid credentials',
    });

    mockConvex.mutation.mockResolvedValue(failureResult);

    const result = await authService.login('wrong@example.com', 'wrong');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
```

**Rationale**: Provides reliable, predictable test environments

### Database Seeding

**Context**: Setting up test database state
**Implementation**:

- Use database seeding for integration tests
- Create isolated test environments
- Reset state between tests
- Use transactions for cleanup

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures tests run in predictable, isolated environments

## Mocking Patterns

### External API Mocking

**Context**: Mocking external service calls
**Implementation**:

- Mock external APIs consistently
- Use realistic response data
- Test both success and failure scenarios
- Mock network delays when relevant

**Example**:

```typescript
// Comprehensive service mocking pattern
jest.mock('../convex', () => ({
  convex: {
    mutation: jest.fn(),
    query: jest.fn(),
    action: jest.fn(),
  },
}));

jest.mock('../../convex/api', () => ({
  api: {
    auth: {
      registerUser: 'auth/registerUser',
      loginUser: 'auth/loginUser',
      // Map all API endpoints as strings
    },
  },
}));

// Service testing with comprehensive error scenarios
describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton for proper test isolation
    (AuthService as any).instance = undefined;
  });

  it('should handle service errors gracefully', async () => {
    mockConvex.mutation.mockRejectedValue(new Error('Network error'));

    const result = await authService.register('test', 'email', 'pass');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('should handle uncaught error format', async () => {
    const error = new Error('Uncaught Error: Database connection failed');
    mockConvex.mutation.mockRejectedValue(error);

    const result = await authService.register(
      'Test',
      'test@example.com',
      'pass'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database connection failed');
  });
});
```

**Rationale**: Provides reliable tests independent of external services

### Time and Date Mocking

**Context**: Testing time-dependent functionality
**Implementation**:

- Mock system time for predictable tests
- Test timezone handling
- Validate date calculations
- Test time-based business logic

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures time-dependent features work correctly

## Performance Testing Patterns

### Load Testing

**Context**: Testing application performance under load
**Implementation**:

- Use appropriate load testing tools
- Test database performance
- Validate API response times
- Monitor resource usage

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures application performs well under realistic load

### Bundle Size Testing

**Context**: Monitoring frontend bundle sizes
**Implementation**:

- Set bundle size budgets
- Monitor bundle size changes
- Identify large dependencies
- Test dynamic imports

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Maintains optimal application loading performance

## Accessibility Testing

### Automated A11y Testing

**Context**: Testing accessibility compliance
**Implementation**:

- Use jest-axe for automated accessibility testing
- Test keyboard navigation
- Validate screen reader compatibility
- Check color contrast compliance

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures application is usable by all users

### Manual A11y Testing

**Context**: Human validation of accessibility
**Implementation**:

- Test with screen readers
- Validate keyboard-only navigation
- Check focus management
- Test with users with disabilities

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Catches accessibility issues automated tools miss

## Test Organization Patterns

### Test File Structure

**Context**: Organizing test files and directories
**Implementation**:

- Co-locate tests with source files
- Use descriptive test file names
- Group related tests in directories
- Separate unit, integration, and e2e tests

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Makes tests easy to find and maintain

### Test Naming Conventions

**Context**: Naming tests and test suites
**Implementation**:

- Use descriptive test names
- Follow "should... when..." pattern
- Group tests with describe blocks
- Use consistent naming across project

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Makes test intent clear and results easy to understand

## Continuous Integration Testing

### CI Test Pipeline

**Context**: Running tests in CI/CD environment
**Implementation**:

- Run tests on every commit
- Separate fast and slow test suites
- Cache dependencies for speed
- Fail builds on test failures

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Catches issues early and maintains code quality

### Coverage Requirements

**Context**: Maintaining test coverage standards
**Implementation**:

- Set minimum coverage thresholds
- Monitor coverage trends
- Focus on critical code paths
- Use coverage reports for improvement

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures adequate testing without over-testing

## Coverage-Driven Development Patterns

### Strategic Coverage Improvement

**Context**: Systematically improving test coverage for maximum impact
**Implementation**:

1. **Baseline Measurement**: Establish current coverage baseline
2. **Gap Analysis**: Identify high-impact, low-coverage files
3. **Strategic Testing**: Target files with biggest coverage ROI
4. **Incremental Improvement**: Aim for 10-15% coverage increase per iteration
5. **Maintenance**: Regular coverage reviews and gap filling

**Example**:

```bash
# Measure current coverage
npx jest --coverage

# Identify high-impact files (services, utilities)
# Target files like lib/auth.ts, lib/email.ts first

# Systematic test implementation
# - Write comprehensive service tests (57 test cases for auth)
# - Focus on error paths and edge cases
# - Use coverage reports to identify remaining gaps

# Results achieved:
# lib/auth.ts: 99.31% statements, 87.09% branches (from ~25%)
# Overall: 86.7% statements, 79.49% branches (from ~60%)
```

**Rationale**: Maximizes coverage improvement impact with focused effort

### Error Path Testing Patterns

**Context**: Systematically testing error scenarios and edge cases
**Implementation**:

- Test all error branches systematically
- Cover different error message formats
- Test error recovery scenarios
- Validate error handling UI states

**Example**:

```typescript
// Comprehensive error testing pattern
describe('Error Handling', () => {
  it('should handle different error message formats', async () => {
    const testCases = [
      { error: new Error('Simple error'), expected: 'Simple error' },
      {
        error: new Error('Uncaught Error: Nested error'),
        expected: 'Nested error',
      },
      { error: { message: 'Object error' }, expected: 'Object error' },
      { error: 'String error', expected: 'String error' },
      { error: null, expected: 'An unexpected error occurred' },
    ];

    for (const { error, expected } of testCases) {
      mockConvex.mutation.mockRejectedValue(error);
      const result = await authService.register('test', 'email', 'pass');
      expect(result.error).toBe(expected);
    }
  });
});
```

**Rationale**: Ensures robust error handling across all scenarios

### Singleton and State Management Testing

**Context**: Testing singleton services and global state
**Implementation**:

- Reset singleton instances between tests
- Mock global dependencies properly
- Test state isolation between tests
- Handle async state updates correctly

**Example**:

```typescript
// Singleton testing pattern
describe('AuthService Singleton', () => {
  beforeEach(() => {
    // Critical: Reset singleton for test isolation
    (AuthService as any).instance = undefined;
    jest.clearAllMocks();

    // Mock global dependencies
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should maintain singleton pattern', () => {
    const instance1 = AuthService.getInstance();
    const instance2 = AuthService.getInstance();
    expect(instance1).toBe(instance2);
  });
});
```

**Rationale**: Ensures proper test isolation and predictable state

## State Management Testing Patterns

### Shared Mock Isolation Pattern

**Context**: Testing services that use shared mock instances (Durable Objects, singletons)  
**Problem**: State persistence across tests causes false failures and test interdependence  
**Solution**: Implement proper state reset between tests

**Example**:

```typescript
// Test setup - create shared mock with reset capability
export class MockDurableObjectStub {
  private state = {
    global_current: 0,
    system_current: { browser: 0, convex: 0, worker: 0 },
    trace_counts: {},
    window_start: Date.now(),
  };

  resetState(windowStart?: number) {
    this.state = {
      global_current: 0,
      system_current: { browser: 0, convex: 0, worker: 0 },
      trace_counts: {},
      window_start: windowStart || Date.now(),
    };
  }

  // Simulation methods for testing
  simulateRateLimit(system: string) {
    const systemLimit = this.config.system_quotas[system];
    if (systemLimit) {
      this.state.system_current[system] = systemLimit;
    }
  }
}

// Shared instance for test isolation
let sharedRateLimiterStub: MockDurableObjectStub;

export function createMockEnvironment() {
  if (!sharedRateLimiterStub) {
    sharedRateLimiterStub = new MockDurableObjectStub();
  }

  return {
    RATE_LIMIT_STATE: {
      idFromName: jest.fn().mockReturnValue('mock-id'),
      get: jest.fn().mockReturnValue(sharedRateLimiterStub),
    },
  };
}

// Critical: Reset function for test isolation
export function resetRateLimiterState() {
  if (sharedRateLimiterStub) {
    sharedRateLimiterStub.resetState();
  }
}

// Test file pattern - MANDATORY for shared state
describe('WorkerTests', () => {
  beforeEach(() => {
    mockEnv = createMockEnvironment();
    jest.clearAllMocks();
    // Critical: Reset shared state for test isolation
    resetRateLimiterState();
  });

  it('should handle rate limiting', async () => {
    const mockStub = mockEnv.RATE_LIMIT_STATE.get('mock-id');
    mockStub.simulateRateLimit('browser');

    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(429);
  });

  it('should process normal requests', async () => {
    // This test would fail without resetRateLimiterState()
    // because previous test left rate limiting in effect
    const response = await worker.fetch(request, mockEnv, mockCtx);
    expect(response.status).toBe(200);
  });
});
```

**Critical Requirements**:

- **Import reset function**: Include reset function in test imports
- **beforeEach hook**: Call reset function in every test suite's beforeEach
- **Shared instance management**: Use shared instances for realistic testing
- **State verification**: Test that reset function actually clears all state

**Rationale**: Prevents test interdependence and ensures reliable, repeatable test results

## Environment Variable Testing Patterns

### Context: Testing Environment-Aware Configuration Modules

Environment variable testing requires careful management of test isolation and realistic scenario simulation. These patterns ensure configuration modules work correctly across all deployment environments.

### Environment Mock Testing Pattern

**Context**: Testing environment-aware configuration modules
**Implementation**: Comprehensive environment variable mocking with proper cleanup

**Example**:
```typescript
describe('Environment Configuration', () => {
  const originalEnv = process.env;

  const mockEnvironments = {
    development: {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3200',
      NEXT_PUBLIC_LOG_WORKER_URL: 'https://worker.dev',
      NODE_ENV: 'development',
    },
    production: {
      NEXT_PUBLIC_APP_URL: 'https://app.example.com',
      NEXT_PUBLIC_LOG_WORKER_URL: 'https://worker.prod',
      NODE_ENV: 'production',
    },
    missingConfig: {
      NODE_ENV: 'development',
      // Missing NEXT_PUBLIC_APP_URL
    },
    testEnvironment: {
      NODE_ENV: 'test',
      CI: 'true',
    },
  };

  beforeEach(() => {
    resetConfigCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetConfigCache();
  });

  it('should handle missing configuration gracefully', () => {
    process.env = { ...mockEnvironments.missingConfig };

    expect(() => loadConfig()).toThrow('Required environment variable');
  });

  it('should provide test environment defaults', () => {
    process.env = { ...mockEnvironments.testEnvironment };

    const config = loadConfig();
    expect(config.baseUrl).toBe('http://localhost:3200');
  });
});
```

**Key Principles**:
- Mock complete environment scenarios, not individual variables
- Test graceful degradation in test/CI environments
- Always clean up environment state between tests
- Test both success and failure scenarios

**Rationale**: Ensures environment-aware configuration works correctly across all deployment scenarios

### Configuration Cache Testing Pattern

**Context**: Testing configuration modules with caching mechanisms
**Implementation**: Reset cache between tests to ensure isolation

**Example**:
```typescript
describe('Configuration Caching', () => {
  beforeEach(() => {
    resetUrlConfig(); // Reset configuration cache
  });

  it('should cache configuration on first load', () => {
    process.env = { ...mockEnvironments.development };

    const config1 = getUrlConfig();
    const config2 = getUrlConfig();

    // Should return same object reference (cached)
    expect(config1).toBe(config2);
  });

  it('should load fresh configuration after reset', () => {
    process.env = { ...mockEnvironments.development };
    const config1 = getUrlConfig();

    // Change environment and reset
    process.env = { ...mockEnvironments.production };
    resetUrlConfig();

    const config2 = getUrlConfig();
    expect(config1.baseUrl).not.toBe(config2.baseUrl);
  });
});
```

**Benefits**:
- Prevents test pollution from cached state
- Validates caching behavior works correctly
- Ensures configuration updates properly
- Tests cache invalidation scenarios

**Rationale**: Configuration caching improves performance but must not interfere with testing

### URL Generation Testing Pattern

**Context**: Testing URL generation functions across environments
**Implementation**: Test all URL generators with different environment configurations

**Example**:
```typescript
describe('URL Generation', () => {
  it('should generate correct OAuth URLs in development', () => {
    process.env = { ...mockEnvironments.development };
    resetUrlConfig();

    const githubUrl = generateOAuthCallbackUrl('github');
    const googleUrl = generateOAuthCallbackUrl('google');

    expect(githubUrl).toBe('http://localhost:3200/auth/github/callback');
    expect(googleUrl).toBe('http://localhost:3200/auth/google/callback');
  });

  it('should generate correct OAuth URLs in production', () => {
    process.env = { ...mockEnvironments.production };
    resetUrlConfig();

    const githubUrl = generateOAuthCallbackUrl('github');
    expect(githubUrl).toBe('https://app.example.com/auth/github/callback');
  });

  it('should validate URL parameters', () => {
    process.env = { ...mockEnvironments.development };
    resetUrlConfig();

    expect(() => generateOAuthCallbackUrl('invalid' as any)).toThrow('Provider must be either "github" or "google"');
    expect(() => generatePasswordResetUrl('')).toThrow('Token is required');
  });
});
```

**Benefits**:
- Validates URL format across environments
- Tests error handling for invalid inputs
- Ensures consistent URL generation
- Covers both success and error scenarios

**Rationale**: URL generation must be consistent and properly validated across all environments

## Rate Limiter Testing Patterns

### Context: Business Logic Systems with Cost Implications

Rate limiters are cost control mechanisms that require precise testing for business logic while maintaining flexibility for implementation details. These patterns ensure accurate cost control validation.

### 1. System Configuration Testing Pattern

**Context**: Rate limiters have specific quotas that must be enforced precisely  
**Implementation**: Test actual system quotas, not assumed values

**Example**:

```typescript
// System configuration testing
describe('Rate Limiter Configuration', () => {
  const SYSTEM_QUOTAS = {
    browser: 400, // Actual configured quota
    convex: 300, // Actual configured quota
    worker: 300, // Actual configured quota
  };

  it('should enforce browser system quota precisely', async () => {
    // Test actual quota, not assumed value
    for (let i = 0; i < SYSTEM_QUOTAS.browser; i++) {
      const result = await checkRateLimit('browser');
      expect(result.allowed).toBe(true);
      expect(result.remaining_quota).toBe(SYSTEM_QUOTAS.browser - (i + 1));
    }

    // Next request should be denied
    const result = await checkRateLimit('browser');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SYSTEM_RATE_LIMIT');
  });
});
```

**Key Principles**:

- **Know your quotas**: Check actual system configuration before writing tests
- **Test precise calculations**: Rate limiting = cost control = exact math matters
- **Verify limit enforcement**: Test that limits actually prevent overuse

### 2. Mock API Integration Pattern

**Context**: Working with existing mock capabilities instead of inventing non-existent methods  
**Implementation**: Use available simulation methods pragmatically

**Example**:

```typescript
// Mock Durable Object with proper simulation methods
export class MockDurableObjectStub {
  private state = {
    global_current: 0,
    system_current: { browser: 0, convex: 0, worker: 0 },
    trace_counts: {},
    window_start: Date.now(),
  };

  private config = {
    global_limit: 1000,
    system_quotas: { browser: 400, convex: 300, worker: 300 },
    per_trace_limit: 100,
  };

  // Available simulation methods (don't invent new ones)
  simulateGlobalRateLimit() {
    this.state.global_current = this.config.global_limit;
  }

  simulateSystemRateLimit(system: string) {
    if (this.config.system_quotas[system]) {
      this.state.system_current[system] = this.config.system_quotas[system];
    }
  }

  resetState() {
    this.state = {
      global_current: 0,
      system_current: { browser: 0, convex: 0, worker: 0 },
      trace_counts: {},
      window_start: Date.now(),
    };
  }
}

// Test using available methods
describe('Rate Limiter Mock Integration', () => {
  let mockStub: MockDurableObjectStub;

  beforeEach(() => {
    mockStub = new MockDurableObjectStub();
    mockStub.resetState(); // Use available reset method
  });

  it('should use existing simulation methods', async () => {
    // ✅ Use available API method
    mockStub.simulateGlobalRateLimit();

    const result = await checkRateLimit('browser');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('GLOBAL_RATE_LIMIT');
  });

  it('should not attempt non-existent methods', async () => {
    // ❌ Don't do this - method doesn't exist
    // mockStub.setResponse('/check', { allowed: false });

    // ✅ Use available simulation instead
    mockStub.simulateSystemRateLimit('browser');

    const result = await checkRateLimit('browser');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('SYSTEM_RATE_LIMIT');
  });
});
```

**Key Principles**:

- **Study mock API first**: Understand available methods before writing tests
- **Use existing capabilities**: Don't extend mocks unless absolutely necessary
- **Reset state properly**: Use provided reset methods for test isolation

### 3. Business Logic vs Implementation Detail Pattern

**Context**: Distinguishing between precise business rules and flexible implementation details  
**Implementation**: Be precise for cost control, flexible for technical details

**Example**:

```typescript
describe('Rate Limiter Business Rules vs Implementation', () => {
  it('should enforce business rules precisely', async () => {
    // ✅ PRECISE: Business logic - cost control
    const quotaUsed = 1;
    const remainingQuota = 400 - quotaUsed; // Exact calculation

    const result = await checkRateLimit('browser');

    expect(result.allowed).toBe(true);
    expect(result.remaining_quota).toBe(remainingQuota); // Exact quota math
    expect(result.system).toBe('browser'); // Specific system
  });

  it('should be flexible for implementation details', async () => {
    mockStub.simulateSystemRateLimit('browser');
    const response = await worker.fetch(request, mockEnv, mockCtx);

    // ✅ PRECISE: Business outcome
    expect(response.status).toBe(429); // Standard rate limit status

    // ✅ FLEXIBLE: Implementation details
    const body = await response.json();
    expect(body.error).toMatch(/(rate limit|quota exceeded)/i); // Message format flexible
    expect(body.timestamp).toBeDefined(); // Timing flexible
    expect(body.retry_after).toBeGreaterThan(0); // Positive retry time
  });
});
```

**Precision Guidelines for Rate Limiters**:

**BE PRECISE for**:

- Quota calculations (remaining counts)
- Rate limiting decisions (allowed/denied)
- Cost control limits (max requests per system)
- Business rule enforcement (which limits apply when)

**BE FLEXIBLE for**:

- Error message exact wording
- Response timing and metadata
- HTTP header details
- Internal implementation mechanisms

### 4. Test Isolation for Shared State Pattern

**Context**: Rate limiters often use shared objects that maintain state across requests  
**Implementation**: Proper state management for test isolation

**Example**:

```typescript
// Shared mock instance with reset capability
let sharedRateLimiterStub: MockDurableObjectStub;

export function createMockEnvironment() {
  if (!sharedRateLimiterStub) {
    sharedRateLimiterStub = new MockDurableObjectStub();
  }

  return {
    RATE_LIMIT_STATE: {
      idFromName: jest.fn().mockReturnValue('mock-id'),
      get: jest.fn().mockReturnValue(sharedRateLimiterStub),
    },
  };
}

export function resetRateLimiterState() {
  if (sharedRateLimiterStub) {
    sharedRateLimiterStub.resetState();
  }
}

// Test suite with proper isolation
describe('Rate Limiter Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRateLimiterState(); // Critical for test isolation
  });

  it('should handle first request correctly', async () => {
    const result = await checkRateLimit('browser');
    expect(result.allowed).toBe(true);
    expect(result.remaining_quota).toBe(399); // 400 - 1
  });

  it('should handle second request correctly', async () => {
    // This test would fail without resetRateLimiterState()
    // because previous test would have used 1 quota
    const result = await checkRateLimit('browser');
    expect(result.allowed).toBe(true);
    expect(result.remaining_quota).toBe(399); // Fresh state: 400 - 1
  });
});
```

**Key Principles**:

- **Reset shared state**: Always reset between tests for isolation
- **Use consistent reset methods**: Follow established reset patterns
- **Verify isolation**: Ensure tests don't depend on execution order

### 5. Cost Control Validation Pattern

**Context**: Rate limiters prevent cost overruns - tests must validate this protection  
**Implementation**: Focus on business outcomes, not technical implementation

**Example**:

```typescript
describe('Cost Control Validation', () => {
  it('should prevent browser system cost overrun', async () => {
    const MAX_REQUESTS = 400; // Business rule: browser gets 400 requests
    const responses = [];

    // Make requests up to limit
    for (let i = 0; i < MAX_REQUESTS + 5; i++) {
      responses.push(await checkRateLimit('browser'));
    }

    // Verify cost control enforcement
    const allowed = responses.filter(r => r.allowed);
    const denied = responses.filter(r => !r.allowed);

    expect(allowed.length).toBe(MAX_REQUESTS); // Exactly the quota
    expect(denied.length).toBe(5); // All excess requests denied

    // Verify denial reasons
    denied.forEach(response => {
      expect(response.reason).toBe('SYSTEM_RATE_LIMIT');
      expect(response.allowed).toBe(false);
    });
  });

  it('should handle multiple systems independently', async () => {
    // Each system should have independent quotas
    const browserResult = await checkRateLimit('browser');
    const convexResult = await checkRateLimit('convex');
    const workerResult = await checkRateLimit('worker');

    // All should be allowed initially
    expect(browserResult.allowed).toBe(true);
    expect(convexResult.allowed).toBe(true);
    expect(workerResult.allowed).toBe(true);

    // Each should have their specific quota
    expect(browserResult.remaining_quota).toBe(399); // 400 - 1
    expect(convexResult.remaining_quota).toBe(299); // 300 - 1
    expect(workerResult.remaining_quota).toBe(299); // 300 - 1
  });
});
```

### Common Anti-Patterns to Avoid

#### **Testing Anti-Patterns**:

```typescript
// ❌ DON'T: Assume quota values
expect(result.remaining_quota).toBe(100); // Where did 100 come from?

// ✅ DO: Use actual system configuration
expect(result.remaining_quota).toBe(BROWSER_QUOTA - requestCount);

// ❌ DON'T: Invent non-existent mock methods
mockStub.setResponse('/check', { success: false }); // Method doesn't exist

// ✅ DO: Use available simulation methods
mockStub.simulateSystemRateLimit('browser');

// ❌ DON'T: Test implementation timing in mocks
expect(responseTime).toBeLessThan(100); // Mock timing is unpredictable

// ✅ DO: Test functional behavior
expect(result.allowed).toBe(false); // Business outcome
```

### Rate Limiter Test Strategy

1. **Configuration Testing**: Verify actual quotas and limits
2. **Business Logic Testing**: Precise quota calculations and enforcement
3. **Integration Testing**: Mock API capabilities and limitations
4. **Cost Control Testing**: Prevent overruns and validate protection
5. **State Management Testing**: Proper isolation and reset between tests

**Rationale**: Ensures rate limiters effectively control costs while maintaining test reliability and avoiding mock API limitations

## Anti-Patterns to Avoid

### Testing Implementation Details

- Don't test internal component state
- Focus on user-facing behavior
- Avoid testing private methods

### Overly Complex Test Setup

- Keep test setup simple and focused
- Avoid shared mutable state between tests
- Don't create overly elaborate test fixtures

### Ignoring Test Maintenance

- Update tests when requirements change
- Remove obsolete tests
- Refactor tests as code evolves

### Insufficient Error Testing

- Test error conditions and edge cases
- Validate error messages and handling
- Test recovery from failures

### Test Environment Issues

- **Wrong test runner**: Always use `npx jest --coverage`, not `bun test`
- **Mock hoisting problems**: Define mocks inline, not as variables
- **Global state leakage**: Reset singletons and global state between tests
- **Incomplete mocking**: Mock all external dependencies comprehensively

### State Isolation Anti-Patterns

- **Missing state reset**: Not calling reset functions between tests
- **Partial state reset**: Resetting some but not all shared state
- **Test order dependency**: Tests that only pass in specific order
- **Shared mock reuse**: Using same mock instance without proper isolation

## Vector Storage Testing Patterns (Story 4.2)

### 1. UAT Testing Framework for Vector Operations

The Knowledge Ingestion Service introduces specialized testing patterns for vector storage and embedding operations. These patterns ensure comprehensive coverage of the hybrid Convex + Vectorize architecture.

#### **Automated UAT Script Structure**

```bash
# Location: ./scripts/test-uat-4.2.sh
# Usage: ./scripts/test-uat-4.2.sh [test-case|all]

# Test Categories:
# - AC1: Document Processing Action (tc1.1, tc1.2, tc1.3)
# - AC2: Text Content Processing (tc2.1, tc2.2)
# - AC3: Embedding Generation (tc3.1, tc3.2, tc3.3)
# - AC4: Vector Storage (tc4.2)
# - AC5: Document Seeding (tc5.1, tc5.2)
# - Additional: Vector Search (tc6.1, tc6.2)
```

#### **Environment-Aware Testing Pattern**

```bash
# Graceful handling of missing configuration
run_vector_search() {
    output=$(npx convex run knowledgeActions:queryVectorSimilarity "$json_payload" 2>&1)

    if echo "$output" | grep -q "Vectorize configuration incomplete"; then
        echo "⚠️  SKIP: Vectorize not configured - this test requires Cloudflare Vectorize setup"
        echo "   To enable: Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, VECTORIZE_DATABASE_ID"
    elif [ $exit_code -eq 0 ]; then
        echo "✅ PASS: Vector search succeeded"
    else
        echo "❌ FAIL: Vector search failed"
    fi
}
```

### 2. Multi-Service Testing Coordination

#### **Service Dependency Testing Matrix**

| Test Case        | Convex | OpenAI API | Vectorize  | Expected Behavior                            |
| ---------------- | ------ | ---------- | ---------- | -------------------------------------------- |
| Basic Processing | ✅     | ❌         | ❌         | Graceful degradation, placeholder embeddings |
| With Embeddings  | ✅     | ✅         | ❌         | Embeddings generated, no vector storage      |
| Full Integration | ✅     | ✅         | ✅         | Complete vector storage and search           |
| Partial Failure  | ✅     | ✅         | ❌ (fails) | Document processing continues                |

#### **Configuration Testing Pattern**

```typescript
// Test configuration validation
describe('Configuration Validation', () => {
  it('should handle missing OpenAI API key gracefully', async () => {
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content',
      source: 'test.md',
    });

    expect(result.status).toBe('completed');
    expect(result.chunksCreated).toBeGreaterThan(0);
    // Should not throw error even without OpenAI key
  });

  it('should handle missing Vectorize config gracefully', async () => {
    // Similar pattern for Vectorize configuration testing
  });
});
```

### 3. Vector Operation Testing Patterns

#### **Embedding Dimension Validation**

```typescript
describe('Embedding Generation', () => {
  it('should generate 1536-dimension embeddings', async () => {
    const chunks = chunkText('Sample content for testing embedding generation');
    const embeddings = await generateEmbeddingsForChunks(chunks, apiKey);

    embeddings.forEach(({ embedding }) => {
      if (embedding) {
        expect(embedding).toHaveLength(1536);
        expect(embedding.every(val => typeof val === 'number')).toBe(true);
      }
    });
  });
});
```

#### **Vector ID Constraint Testing**

```typescript
describe('Vector ID Generation', () => {
  it('should generate vector IDs under 64 bytes', async () => {
    const longContentHash = 'a'.repeat(64);
    const chunkIndex = 999;

    const shortHash = longContentHash.substring(0, 16);
    const vectorizeId = `${shortHash}_c${chunkIndex}`;

    expect(vectorizeId.length).toBeLessThanOrEqual(64);
    expect(vectorizeId).toMatch(/^[a-f0-9]{16}_c\d+$/);
  });
});
```

#### **Hybrid Storage Consistency Testing**

```typescript
describe('Hybrid Storage Consistency', () => {
  it('should maintain consistency between Convex and Vectorize', async () => {
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test document for consistency verification',
      source: 'consistency-test.md',
    });

    // Verify Convex storage
    const convexChunks = await ctx.runQuery(api.knowledge.getChunksBySource, {
      sourceDocument: 'consistency-test.md',
    });

    expect(convexChunks).toHaveLength(result.chunksCreated);

    // Verify each chunk has corresponding vector reference
    convexChunks.forEach(chunk => {
      expect(chunk.vectorize_id).toMatch(/^[a-f0-9]{16}_c\d+$/);
      expect(chunk.vectorize_id.length).toBeLessThanOrEqual(64);
    });
  });
});
```

### 4. Performance Testing Patterns

#### **Large Document Processing**

```typescript
describe('Performance Testing', () => {
  it('should handle large documents efficiently', async () => {
    const largeContent = 'Lorem ipsum '.repeat(1000); // ~10KB content
    const startTime = Date.now();

    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: largeContent,
      source: 'large-test.md',
    });

    const processingTime = Date.now() - startTime;

    expect(result.status).toBe('completed');
    expect(result.chunksCreated).toBeGreaterThan(1);
    expect(processingTime).toBeLessThan(30000); // Under 30 seconds
  });
});
```

#### **Batch Operation Testing**

```typescript
describe('Batch Operations', () => {
  it('should efficiently process multiple documents', async () => {
    const documents = Array.from({ length: 10 }, (_, i) => ({
      content: `Test document ${i} with unique content for testing batch processing`,
      source: `batch-test-${i}.md`,
    }));

    const startTime = Date.now();
    const results = await Promise.all(
      documents.map(doc => ctx.runAction(api.knowledgeActions.addDocument, doc))
    );
    const totalTime = Date.now() - startTime;

    expect(results.every(r => r.status === 'completed')).toBe(true);
    expect(totalTime / documents.length).toBeLessThan(5000); // Under 5s per document
  });
});
```

### 5. Error Handling Testing Patterns

#### **Service Failure Simulation**

```typescript
describe('Error Handling', () => {
  it('should handle OpenAI API failures gracefully', async () => {
    // Mock OpenAI API to return error
    const mockApiKey = 'invalid-key';

    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content',
      source: 'error-test.md',
    });

    // Should complete even with API failure
    expect(result.status).toBe('completed');
    expect(result.chunksCreated).toBeGreaterThan(0);
  });

  it('should handle Vectorize API failures gracefully', async () => {
    // Similar pattern for Vectorize failure testing
  });
});
```

#### **Data Consistency Under Failure**

```typescript
describe('Failure Recovery', () => {
  it('should maintain data consistency during partial failures', async () => {
    // Test scenario where vector insertion fails but document processing continues
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content for failure scenario',
      source: 'failure-test.md',
    });

    // Document should be created even if vector insertion fails
    const document = await ctx.runQuery(
      api.knowledgeMutations.getDocumentByPath,
      {
        filePath: 'failure-test.md',
      }
    );

    expect(document).toBeTruthy();
    expect(document.processing_status).toBe('completed');
  });
});
```

### 6. Integration Testing Patterns

#### **End-to-End Vector Search Testing**

```typescript
describe('Vector Search Integration', () => {
  beforeAll(async () => {
    // Seed test documents with known content
    await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Machine learning algorithms for data analysis',
      source: 'ml-test.md',
    });

    await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Cooking recipes for Italian cuisine',
      source: 'cooking-test.md',
    });
  });

  it('should return relevant results for similarity search', async () => {
    const results = await ctx.runAction(
      api.knowledgeActions.queryVectorSimilarity,
      {
        query: 'machine learning techniques',
        topK: 2,
        includeContent: true,
      }
    );

    expect(results.matches).toHaveLength(2);
    expect(results.matches[0].score).toBeGreaterThan(results.matches[1].score);

    // Should find ML document more relevant than cooking
    const mlResult = results.matches.find(
      m => m.chunk?.source_document === 'ml-test.md'
    );
    expect(mlResult).toBeTruthy();
    expect(mlResult.score).toBeGreaterThan(0.5); // High relevance threshold
  });
});
```

### 7. Seeding Script Testing Patterns

#### **File Discovery Testing**

```typescript
describe('Document Seeding', () => {
  it('should discover appropriate files for processing', () => {
    const { findFilesToProcess } = require('../scripts/seed-knowledge.cjs');

    const docsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'docs'));
    const appsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'apps'));

    expect(docsFiles.length).toBeGreaterThan(50); // Should find substantial docs
    expect(appsFiles.length).toBeGreaterThan(50); // Should find substantial code

    // Verify file type filtering
    const allFiles = [...docsFiles, ...appsFiles];
    allFiles.forEach(file => {
      expect([
        'markdown',
        'typescript',
        'javascript',
        'typescript-react',
        'javascript-react',
      ]).toContain(file.fileType);
    });
  });
});
```

### 8. Monitoring and Observability Testing

#### **Correlation ID Tracing**

```typescript
describe('Observability', () => {
  it('should maintain correlation IDs throughout processing', async () => {
    const result = await ctx.runAction(api.knowledgeActions.addDocument, {
      content: 'Test content for correlation tracking',
      source: 'correlation-test.md',
    });

    // Verify correlation ID exists in document record
    const document = await ctx.runQuery(
      api.knowledgeMutations.getDocumentByPath,
      {
        filePath: 'correlation-test.md',
      }
    );

    expect(document.correlation_id).toBeTruthy();
    expect(document.correlation_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );

    // Verify correlation ID propagated to chunks
    const chunks = await ctx.runQuery(api.knowledge.getChunksBySource, {
      sourceDocument: 'correlation-test.md',
    });

    chunks.forEach(chunk => {
      expect(chunk.correlation_id).toBe(document.correlation_id);
    });
  });
});
```

These vector storage testing patterns ensure comprehensive coverage of the Knowledge Ingestion Service while accounting for the complexity of multi-service integration and the need for graceful degradation in various failure scenarios.

**Rationale**: Rate limiter testing patterns balance business precision with implementation flexibility, ensuring cost control mechanisms work correctly while adapting to mock environment limitations

## Redis Client Testing Patterns

### Context: External Service Integration with Error Handling

Redis clients require comprehensive testing for network operations, error handling, data serialization, and TTL management. These patterns ensure robust testing of external service integrations.

### 1. Constructor Validation Testing Pattern

**Context**: Validate configuration early to prevent runtime failures  
**Implementation**: Test all validation paths and error messages

**Example**:

```typescript
describe('RedisClient Constructor', () => {
  it('should throw error for empty base URL', () => {
    expect(() => new RedisClient('', mockToken)).toThrow(
      'Redis base URL is required and cannot be empty'
    );
  });

  it('should throw error for whitespace-only token', () => {
    expect(() => new RedisClient(mockBaseUrl, '   ')).toThrow(
      'Redis token is required and cannot be empty'
    );
  });

  it('should handle URL validation gracefully', () => {
    // Note: Modern URL constructor is permissive
    // Focus on testing actual validation logic
  });
});
```

### 2. Network Error Handling Testing Pattern

**Context**: External services can fail in multiple ways  
**Implementation**: Test all network failure scenarios systematically

**Example**:

```typescript
describe('Network Error Handling', () => {
  it('should handle undefined response from fetch', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce(undefined as any);

    await expect((redisClient as any).request(['PING'])).rejects.toThrow(
      'Redis request failed: No response received'
    );
  });

  it('should handle response with error field in JSON', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Custom Redis error message' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect((redisClient as any).request(['PING'])).rejects.toThrow(
      'Redis error: Custom Redis error message'
    );
  });

  it('should handle unknown error types gracefully', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValueOnce('string error'); // Non-Error object

    await expect((redisClient as any).request(['PING'])).rejects.toThrow(
      'Redis request failed: Network error - Unknown error'
    );
  });
});
```

### 3. Pipeline Operations Testing Pattern

**Context**: Redis pipelines batch multiple commands for efficiency  
**Implementation**: Test successful batching and partial failure scenarios

**Example**:

```typescript
describe('Pipeline Operations', () => {
  it('should execute multiple Redis commands in pipeline', async () => {
    setupRedisMock({
      PIPELINE: [
        { result: 1 }, // LPUSH result
        { result: 1 }, // EXPIRE result
        { result: 'value' }, // GET result
      ],
    });

    const commands = [
      ['LPUSH', 'test:key', 'value'],
      ['EXPIRE', 'test:key', '3600'],
      ['GET', 'other:key'],
    ];

    const results = await redisClient.pipeline(commands);

    expect(results).toEqual([1, 1, 'value']);
  });

  it('should handle mixed success/error results in pipeline', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          { result: 1 }, // Success
          { error: 'ERR command failed' }, // Error
          { result: 'value' }, // Success
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    await expect(redisClient.pipeline(commands)).rejects.toThrow(
      'Redis pipeline command 1 failed: ERR command failed'
    );
  });
});
```

### 4. Data Management Operations Testing Pattern

**Context**: CRUD operations with proper cleanup and error handling  
**Implementation**: Test successful operations and error scenarios

**Example**:

```typescript
describe('Data Management', () => {
  it('should successfully delete all log keys', async () => {
    const mockKeys = ['logs:trace-1', 'logs:trace-2', 'logs:trace-3'];
    setupRedisMock({
      KEYS: { result: mockKeys },
      PIPELINE: [{ result: 1 }, { result: 1 }, { result: 1 }], // DEL results
    });

    const result = await redisClient.clearAllLogs();

    expect(result.deleted).toBe(3);
    expect(result.message).toBe('Successfully deleted 3 log collections');
  });

  it('should handle case when no logs exist', async () => {
    setupRedisMock({
      KEYS: { result: [] },
    });

    const result = await redisClient.clearAllLogs();

    expect(result.deleted).toBe(0);
    expect(result.message).toBe('No logs found to delete');
  });

  it('should count partial deletions correctly', async () => {
    const mockKeys = ['logs:trace-1', 'logs:trace-2', 'logs:trace-3'];
    setupRedisMock({
      KEYS: { result: mockKeys },
      PIPELINE: [{ result: 1 }, { result: 0 }, { result: 1 }], // Mixed success/failure
    });

    const result = await redisClient.clearAllLogs();

    expect(result.deleted).toBe(2); // Only successful deletions counted
  });
});
```

### 5. Complex Method Testing Pattern

**Context**: Methods with multiple operations and error paths  
**Implementation**: Focus on key functionality and error handling over complex mocking

**Example**:

```typescript
describe('getRecentTraces', () => {
  it('should return empty array when no traces exist', async () => {
    setupRedisMock({
      KEYS: { result: [] },
    });

    const traces = await redisClient.getRecentTraces();

    expect(traces).toEqual([]);
  });

  it('should handle traces with no logs gracefully', async () => {
    setupRedisMock({
      KEYS: { result: ['logs:trace-123'] },
    });

    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: ['logs:trace-123'] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      )
      // Mock empty response for LINDEX (no logs)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: null }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );

    const traces = await redisClient.getRecentTraces();

    expect(traces).toEqual([]);
  });

  it('should handle Redis errors in getRecentTraces', async () => {
    setupRedisMock({
      KEYS: RedisMockResponses.ERROR,
    });

    await expect(redisClient.getRecentTraces()).rejects.toThrow(
      'Failed to get recent traces: Redis request failed'
    );
  });
});
```

### Key Principles for Redis Client Testing

**Testing Philosophy**: Pragmatic over perfectionist

- Test what the functions actually do, not implementation details
- Focus on error handling and edge cases
- Use realistic mock data structures
- Avoid overly complex mocking scenarios that are brittle

**Coverage Priorities**:

1. **Constructor validation** - Fail fast with clear error messages
2. **Network error handling** - Robust failure scenarios
3. **Data operations** - CRUD functionality with proper cleanup
4. **Pipeline operations** - Batch command processing
5. **Health checks** - Service availability monitoring

**Mock Management**:

- Use centralized mock setup functions
- Test error scenarios systematically
- Keep complex mocking minimal and focused
- Prefer multiple simple tests over complex integration tests

**Coverage Results Achieved**:

- Statements: 97.87% (target: 85%) ✅
- Branches: 87.5% (target: 80%) ✅
- Functions: 95.83% (target: 85%) ✅
- Lines: 97.7% (target: 85%) ✅

**Rationale**: Redis client testing ensures external service integration reliability while maintaining test maintainability through focused, pragmatic test scenarios

## Related Documentation

- [Test Strategy and Standards](../architecture/test-strategy-and-standards.md) - Testing strategy and coverage standards
- [Testing Infrastructure Lessons Learned](../lessons-learned/technology/testing-infrastructure-lessons-learned.md) - Implementation challenges and solutions
- [CI/CD Pipeline Setup](../technical-guides/cicd-pipeline-setup.md) - Pipeline testing configuration
- [Frontend Patterns](frontend-patterns.md) - Component testing integration
- [Backend Patterns](backend-patterns.md) - For API testing patterns
- [Development Workflow Patterns](development-workflow-patterns.md) - For test automation
