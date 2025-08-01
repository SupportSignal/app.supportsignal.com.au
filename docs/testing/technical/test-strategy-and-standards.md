# Test Strategy and Standards

## Executive Summary

A comprehensive testing strategy implementing the test pyramid pattern with strategic coverage targets, toolchain-aware implementation patterns, and systematic approaches to achieve high-quality testing infrastructure in modern React/Next.js applications.

## Testing Philosophy

### Test Pyramid Implementation

```
        /\
       /  \     E2E Tests (Playwright)
      /____\    - Critical user journeys only
     /      \   - Cross-browser compatibility
    /        \  - Authentication flows
   /__________\ - Core business workflows

  /            \ Integration Tests
 /              \ - Convex function testing
/________________\ - API workflow validation
                  - Real-time feature testing

/                  \ Unit Tests (Jest + RTL)
/____________________\ - Component behavior
                      - Service layer logic
                      - Utility functions
                      - Error handling
```

### Coverage Strategy and Targets

**Coverage Targets by Layer:**

- **Unit Tests**: 85%+ statements, 80%+ branches
- **Integration Tests**: Critical API workflows (100% of auth, data flows)
- **E2E Tests**: Core user journeys (login, dashboard, key features)

**Strategic Coverage Approach:**

1. **High-Impact Files First**: Services, utilities, core business logic
2. **Error Path Testing**: Systematic error scenario coverage
3. **Incremental Improvement**: 10-15% coverage increase per iteration
4. **Maintenance**: Regular coverage gap analysis and filling

## Toolchain Standards

### Test Runner Configuration

**Primary Test Runner**: Jest (via `npx jest`)

- **Rationale**: Accurate coverage reporting, mature mocking support
- **Critical**: Do NOT use `bun test` for coverage analysis

```bash
# Correct test execution patterns
npx jest --coverage                    # Accurate coverage reports
npx jest --coverage --watch           # Development mode
npx jest --coverage lib/__tests__/*   # Targeted testing

# Avoid these patterns
bun test              # Incomplete mocking support
bun run test         # Environment variable conflicts
```

**Jest Configuration Standards:**

```javascript
// jest.config.mjs - Production-tested configuration
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: { jsx: 'react-jsx' },
      },
    ],
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 80,
      functions: 80,
      lines: 85,
    },
  },
};
```

### ESLint Integration Standards

**Jest Globals Configuration:**

```javascript
// eslint.config.js - Required Jest globals
export default [
  {
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
  // File-specific overrides for config and test files
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
```

## Unit Testing Standards

### Component Testing with React Testing Library

**Standard Patterns:**

```typescript
// Custom render with providers (required pattern)
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

// User interaction testing (preferred approach)
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  const user = userEvent.setup();

  it('should handle user interaction', async () => {
    renderWithProviders(<Component />);

    await user.type(screen.getByLabelText(/input/i), 'test value');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### Service Layer Testing

**Comprehensive Mocking Pattern:**

```typescript
// External dependency mocking (required for Convex apps)
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

const mockConvex = jest.mocked(convex);
```

**Singleton Testing Pattern:**

```typescript
describe('SingletonService', () => {
  beforeEach(() => {
    // Critical: Reset singleton for test isolation
    (ServiceClass as any).instance = undefined;
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
});
```

### Error Path Testing Standards

**Systematic Error Testing:**

```typescript
// Comprehensive error scenario coverage
describe('Error Handling', () => {
  it('should handle different error formats', async () => {
    const testCases = [
      { error: new Error('Simple error'), expected: 'Simple error' },
      { error: new Error('Uncaught Error: Nested'), expected: 'Nested' },
      { error: { message: 'Object error' }, expected: 'Object error' },
      { error: 'String error', expected: 'String error' },
      { error: null, expected: 'An unexpected error occurred' },
    ];

    for (const { error, expected } of testCases) {
      mockService.method.mockRejectedValue(error);
      const result = await service.method();
      expect(result.error).toBe(expected);
    }
  });
});
```

## Integration Testing Standards

### Convex Function Testing

**Testing Approach:**

- Use ephemeral Convex environments for integration tests
- Test complete API workflows with realistic data
- Validate real-time subscription behavior
- Test cross-function dependencies

```typescript
// Convex integration test pattern
describe('Auth Integration', () => {
  beforeEach(async () => {
    // Setup ephemeral Convex environment
    await setupTestConvexEnvironment();
  });

  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  it('should complete user registration workflow', async () => {
    const userData = { name: 'Test User', email: 'test@example.com' };

    // Test complete workflow
    const user = await convex.mutation(api.auth.registerUser, userData);
    const session = await convex.query(api.users.getCurrentUser, {
      sessionToken: user.sessionToken,
    });

    expect(session).toMatchObject(userData);
  });
});
```

### API Workflow Testing

**Testing Scope:**

- Authentication flows (registration, login, logout, password reset)
- Data CRUD operations with proper validation
- Real-time updates and subscriptions
- Error handling and recovery scenarios

## End-to-End Testing Standards

### Playwright Configuration

**Testing Scope (Critical Paths Only):**

- User authentication flows
- Core business workflows
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile responsive behavior

```typescript
// E2E test structure
describe('Authentication Flow', () => {
  test('complete user registration and login', async ({ page }) => {
    // Test complete user journey
    await page.goto('/register');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="register-submit"]');

    // Verify successful registration
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });
});
```

## Test Data Management

### Fixture Standards

```typescript
// Centralized test fixtures
export const TestFixtures = {
  user: {
    valid: {
      _id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      _creationTime: Date.now(),
    },
    admin: {
      _id: 'admin-user-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      _creationTime: Date.now(),
    },
  },

  authResult: {
    success: (overrides = {}) => ({
      success: true,
      user: TestFixtures.user.valid,
      sessionToken: 'mock-session-token',
      ...overrides,
    }),
    failure: (error = 'Authentication failed') => ({
      success: false,
      user: null,
      error,
    }),
  },
};
```

## CI/CD Integration Standards

### Environment Configuration

**Critical CI Environment Setup:**

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    env:
      NODE_ENV: production # Global default
    steps:
      - name: Run unit tests with coverage
        env:
          NODE_ENV: test # Override for test steps - CRITICAL
        run: |
          cd apps/web && npx jest --coverage
          cd ../convex && npx jest --coverage --passWithNoTests
```

### Coverage Reporting

**Thresholds by Package:**

- **apps/web**: 85% statements, 80% branches
- **apps/convex**: 80% statements, 75% branches
- **shared packages**: 90% statements, 85% branches

## Performance and Maintenance

### Test Execution Optimization

**Strategies:**

- Parallel test execution where possible
- Targeted test runs during development
- Fast feedback loops with watch mode
- Strategic use of test.skip for flaky tests pending fixes

### Test Maintenance Standards

**Regular Maintenance Tasks:**

1. **Weekly**: Review and update flaky tests
2. **Monthly**: Coverage gap analysis and improvement
3. **Quarterly**: Test infrastructure audit and optimization
4. **Release**: Comprehensive test suite validation

## Monitoring and Metrics

### Key Test Metrics

**Quality Metrics:**

- Test coverage percentage by layer
- Test execution time trends
- Flaky test identification and resolution
- CI/CD test failure rates

**Success Criteria:**

- All tests pass in CI/CD pipeline
- Coverage thresholds met for all packages
- E2E tests cover all critical user journeys
- Test execution time under acceptable limits

## Implementation Guidelines

### Getting Started Checklist

**New Feature Testing:**

- [ ] Unit tests for new components/services
- [ ] Integration tests for new API endpoints
- [ ] E2E tests for new user-facing features
- [ ] Coverage impact analysis
- [ ] Test data fixtures updated

**Existing Feature Modification:**

- [ ] Update affected unit tests
- [ ] Verify integration test compatibility
- [ ] Update E2E tests if user journey changes
- [ ] Maintain or improve coverage levels

### Common Pitfalls and Solutions

**Toolchain Issues:**

- ❌ Using `bun test` for coverage analysis
- ✅ Use `npx jest --coverage` for accurate results

**Mocking Problems:**

- ❌ Variable hoisting issues with jest.mock()
- ✅ Define mocks inline within jest.mock() callback

**Test Isolation:**

- ❌ Singleton state leakage between tests
- ✅ Reset singleton instances in beforeEach

**Coverage Gaming:**

- ❌ Writing trivial tests just for coverage
- ✅ Focus on error paths and edge cases for meaningful coverage

## Related Documentation

- [Testing Infrastructure Lessons Learned](../lessons-learned/technology/testing-infrastructure-lessons-learned.md) - Detailed implementation lessons and CI workflow
- [Testing Patterns](../patterns/testing-patterns.md) - Specific implementation patterns
- [CI/CD Pipeline Setup](../technical-guides/cicd-pipeline-setup.md) - Complete pipeline setup guide
- [Cloudflare Pages GitHub Actions Example](../examples/cicd-deployment/cloudflare-pages-github-actions.md) - Working implementation example
- [Development Workflow](../patterns/development-workflow-patterns.md) - Integration with development process
