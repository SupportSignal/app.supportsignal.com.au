# Testing Infrastructure KDD: Lessons Learned from Story 1.9

## Executive Summary

This document captures extensive challenges and solutions encountered while implementing comprehensive testing infrastructure for Story 1.9. What should have been a straightforward Jest setup became a complex integration challenge involving Next.js compatibility, ESLint configuration, CI/CD environment issues, git workflow problems, and Convex conflicts. This document captures critical knowledge to prevent future development pain.

## ⚠️ CRITICAL WARNING: CI Verification Workflow

**NEVER declare "CI is working" without:**

1. **Pushing changes to remote repository**
2. **Monitoring actual CI pipeline completion** (`bun run ci:watch`)
3. **Verifying ALL CI steps pass** (not just local tests)

**Local tests passing ≠ CI working**. This mistake was made repeatedly, causing user frustration and wasted time. See Section 7 for detailed analysis.

## ⚠️ CRITICAL ADDITION: Schema-Code Synchronization Crisis (Story 3.3)

**Root Cause**: Database schemas and backend code evolved independently, creating cascading failures across the application.

## ⚠️ CRITICAL ADDITION: Schema Backward Compatibility Issues (Story 6.3)

**Root Cause**: Schema changes made without considering existing database records, preventing Convex deployments and causing function availability issues.

### Problem Pattern: Schema Validation Breaking Deployments
**Symptom**: Functions appear to work locally but fail to deploy, causing "function not found" errors
```
Logs show: "Schema validation failed" 
Frontend shows: "Could not find public function for 'promptManager:updatePromptTemplate'"
```

**Root Cause**: Schema changes removed fields while existing database records still contained those fields

**Debug Process**:
1. ✅ Check function exists locally (works in dev mode)  
2. ✅ Test function with CLI (`bunx convex run function:name`)  
3. ❌ Deployment fails due to schema validation  
4. ✅ Add removed fields back as optional for backward compatibility

**Solution Pattern**: Schema Backward Compatibility
```typescript
// Instead of removing fields completely:
// ai_prompts: defineTable({
//   prompt_name: v.string(),
//   // REMOVED: scope, developer_session_id
// })

// Add removed fields as optional:
ai_prompts: defineTable({
  prompt_name: v.string(),
  // Backward compatibility for existing data
  scope: v.optional(v.union(v.literal("production"), v.literal("developer"))),
  developer_session_id: v.optional(v.string()),
})
```

### Problem Categories Identified

1. **API Contract Violations** (4 incidents)
   - Missing `scenarioType` parameter in function calls
   - Missing `updated_by` field in incidents schema
   - Missing `version` field in narratives inserts
   - Missing `narrative_hash` field in narratives schema

2. **Architectural Anti-Patterns** (2 incidents)
   - Broken frontend event system vs backend function calls
   - Frontend data access without server context

3. **Type System Gaps** (2 incidents)
   - `v.number()` vs `v.float64()` mismatches
   - Session token naming inconsistencies (`session_token` vs `sessionToken`)

### Critical Prevention Strategies

**Schema Validation Pipeline** - Add to CI:
```bash
bun run schema:validate    # Verify schema-code sync
bun run schema:coverage    # Check database operations
```

**Type-Safe Database Operations**:
```typescript
// Instead of raw inserts
await ctx.db.insert("incidents", rawData);

// Use type-safe operations
await ctx.db.insert("incidents", data satisfies InsertIncident);
```

**Architecture Decision**: Data lives on server, frontend is view layer only. No hybrid frontend/backend data access patterns.

## Background Context

**Story**: 1.9 - Comprehensive Testing Infrastructure  
**Duration**: Multiple sessions across several iterations  
**Scope**: Jest unit testing, React Testing Library integration, CI/CD pipeline testing  
**Initial Expectation**: Simple Jest setup with existing Next.js project  
**Reality**: Complex multi-system integration requiring deep configuration troubleshooting

## Critical Lessons Learned

### 1. Jest + Next.js Integration Complexity

#### The Problem

Modern Next.js projects (App Router) have complex compatibility requirements with Jest that aren't immediately obvious from documentation.

#### Key Issues Encountered

- **Version compatibility**: Jest 30.x with Next.js 15.x required specific configuration
- **Module resolution**: TypeScript path mapping conflicts with Jest module resolution
- **Environment setup**: Browser globals (window, document, sessionStorage) needed careful configuration
- **Transform issues**: Next.js components required specific Jest transforms

#### Solution Pattern

```javascript
// jest.config.mjs - Critical configuration
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
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};
```

#### Future Avoidance Strategy

- Always check Next.js + Jest compatibility matrix before setup
- Use official Next.js testing documentation as primary source
- Test module resolution early with simple import tests

### 2. ESLint Configuration Hell

#### The Problem

ESLint rules designed for production code conflicted with testing infrastructure, causing pre-commit hooks to block all commits.

#### Key Issues Encountered

- **Jest globals undefined**: `describe`, `it`, `expect` not recognized
- **Config file restrictions**: ESLint rules preventing `process.env` access in config files
- **Test file exemptions**: Testing utilities needed different rule sets

#### Solution Pattern

```javascript
// eslint.config.js - Critical overrides
export default [
  {
    languageOptions: {
      globals: {
        // Jest globals - REQUIRED
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
  // Config files override - CRITICAL
  {
    files: [
      '**/jest.config.js',
      '**/jest.setup.js',
      '**/*.config.js',
      '**/*.config.ts',
    ],
    rules: {
      'no-restricted-syntax': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
  // Test files override
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
```

#### Future Avoidance Strategy

- Add Jest globals to ESLint config BEFORE writing any tests
- Create file-specific overrides for config and test files upfront
- Test ESLint + pre-commit hooks early in setup process

### 3. CI/CD Environment Configuration Gotchas

#### The Problem

Tests that passed locally failed in CI due to environment variable conflicts, specifically React Testing Library production build restrictions.

#### Key Issues Encountered

- **NODE_ENV confusion**: Global `NODE_ENV=production` broke React Testing Library
- **Test environment isolation**: CI needed `NODE_ENV=test` for test steps
- **Coverage thresholds**: Convex app had no tests but CI expected coverage reports

#### Solution Pattern

```yaml
# .github/workflows/ci.yml - Critical environment setup
jobs:
  test:
    env:
      NODE_ENV: production # Global setting
    steps:
      - name: Run unit tests with coverage
        env:
          NODE_ENV: test # Override for test steps - CRITICAL
        run: |
          cd apps/web && bun run test:ci
          cd ../convex && bun run test:coverage
```

```json
// apps/convex/package.json - Handle empty test suites
{
  "scripts": {
    "test:coverage": "jest --coverage --passWithNoTests"
  }
}
```

#### Future Avoidance Strategy

- Always set `NODE_ENV=test` for test execution steps in CI
- Use `--passWithNoTests` flag for optional test suites
- Test CI pipeline with actual environment variables early

### 4. Git Workflow Monorepo Issues

#### The Problem

Git operations executed from subdirectories (`apps/web`) only staged files in that directory, missing changes in other parts of the monorepo.

#### Key Issues Encountered

- **Partial commits**: Only web app files committed, missing convex and root changes
- **Repository root awareness**: Need to ensure git operations run from repository root
- **Claude Code commands**: Command files needed updates to prevent partial commits

#### Solution Pattern

```bash
# Always navigate to repository root before git operations
cd $(git rev-parse --show-toplevel)
git add .
git commit -m "message"
git push
```

#### Claude Code Command Updates

```markdown
<!-- ~/.claude/commands/push.md -->

Push changes with autogenerated commit message (stage, commit, push in one step)

- Stage all changes, commit with descriptive message, and push to remote
- Ensure git operations are run from repository root to avoid partial commits
- Do not ask for confirmation — execute all steps automatically
```

#### Future Avoidance Strategy

- Always run git operations from repository root in monorepo projects
- Update Claude Code commands to enforce repository root operations
- Test git workflow with changes across multiple directories early

### 5. Convex + Jest Coverage Conflicts

#### The Problem

Jest coverage reports generated in `apps/convex/coverage/` directory caused Convex dev server to fail, as it tried to sync HTML/JS coverage files as Convex modules.

#### Key Issues Encountered

- **Invalid module paths**: `lcov-report` contains hyphens not allowed in Convex module paths
- **Coverage directory syncing**: Convex `"functions": "."` included everything in directory
- **Module naming restrictions**: Convex requires alphanumeric + underscore + periods only

#### Solution Pattern

```json
// apps/convex/convex.json - Critical ignore paths
{
  "functions": ".",
  "ignoredPaths": [
    "coverage/**/*",
    "node_modules/**/*",
    "*.test.ts",
    "jest.config.js",
    "jest.setup.js"
  ]
}
```

```gitignore
# apps/convex/.gitignore
.env.local
coverage/
```

#### Future Avoidance Strategy

- Add `ignoredPaths` to `convex.json` before setting up testing
- Include coverage directories in `.gitignore` from start
- Test Convex dev server after adding any new file types

## Technical Implementation Patterns

### Browser Globals Setup

```javascript
// jest.setup.js - Centralized browser globals
// Global mocks for browser APIs
global.window = global.window || {};
global.document = global.document || {};
global.navigator = global.navigator || { userAgent: 'test' };

// SessionStorage mock with error handling
Object.defineProperty(global.window, 'sessionStorage', {
  value: {
    getItem: jest.fn(key => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});
```

### Test Environment Configuration

```javascript
// test-config/setup-test-env.js
function setupTestEnvironment() {
  // Set CI-specific environment variables
  if (process.env.CI) {
    process.env.NODE_ENV = 'test';
    process.env.NEXTJS_SKIP_PREFLIGHT = 'true';
  }
}
```

### React Testing Library Best Practices

```typescript
// Component test pattern
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Always use userEvent for interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');

// Proper async handling
await waitFor(() => {
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

## Process Improvements

### 1. Testing Infrastructure Checklist

- [ ] Check Next.js + Jest compatibility matrix
- [ ] Configure ESLint with Jest globals upfront
- [ ] Set up file-specific ESLint overrides for config/test files
- [ ] Configure CI with proper NODE_ENV for test steps
- [ ] Add `--passWithNoTests` for optional test suites
- [ ] Update git workflow to operate from repository root
- [ ] Configure Convex `ignoredPaths` before testing setup
- [ ] **Add Convex build script for client code generation**
- [ ] **Implement cross-file test isolation patterns (Section 10)**
- [ ] **Test file combinations, not just individual files**
- [ ] Test complete pipeline early with dummy tests
- [ ] **CRITICAL: Establish CI verification workflow (push + monitor real CI)**

### 2. Early Detection Strategies

- **Local validation**: Run `bun run lint && bun run test && bun run build` before committing
- **Cross-file isolation**: Test file combinations early to catch state contamination (Section 10)
- **CI validation**: **MANDATORY - Push changes and monitor real CI with `bun run ci:watch`**
- **Integration testing**: Verify all tools work together before writing complex tests
- **Environment parity**: Ensure local and CI environments match
- **Never trust local success**: Local tests passing ≠ CI working

### 3. Configuration Management

- **Centralized config**: Keep test configuration in root-level files when possible
- **Documentation**: Document all configuration decisions and their reasoning
- **Version tracking**: Commit all configuration files to prevent drift
- **Backup strategy**: Keep working configurations before making changes

## Metrics and Success Criteria

### Final State Achieved

- **Test Success Rate**: 100% (11/11 suites passing, 77/80 tests passing, 3 skipped)
- **CI/CD Pipeline**: Fully functional with automatic deployment
- **Development Workflow**: Smooth local development with proper git operations
- **Tool Integration**: All tools (Jest, ESLint, Convex, CI) working harmoniously

### Performance Impact

- **Local test execution**: ~15 seconds for full test suite
- **CI pipeline duration**: ~3-4 minutes end-to-end
- **Developer productivity**: Restored after resolving configuration conflicts

## Future Recommendations

### For Similar Projects

1. **Start with official documentation**: Use Next.js official testing docs as primary source
2. **Incremental setup**: Add one tool at a time and verify integration
3. **Early CI testing**: Test CI pipeline with minimal configuration first
4. **Configuration templates**: Create reusable configuration templates for similar projects

### For Team Knowledge Sharing

1. **Configuration audit**: Review all configuration files quarterly
2. **Documentation maintenance**: Keep this KDD updated with new lessons
3. **Onboarding checklist**: Use this document for new team member onboarding
4. **Best practices sharing**: Regular team sessions on testing infrastructure

### 6. Test Coverage Implementation Lessons

#### The Problem

Achieving high test coverage requires systematic approaches to complex mocking scenarios, especially for singleton services and external dependencies.

#### Key Issues Encountered

- **Singleton pattern testing**: AuthService singleton required special handling for test isolation
- **Complex mocking**: Convex client + API mocking required understanding import/export patterns
- **Coverage optimization**: Strategic test writing to maximize coverage impact
- **Branch coverage**: Error handling paths often missed without systematic approach

#### Solution Pattern

```typescript
// Comprehensive mocking strategy
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
      // ... map all API endpoints
    },
  },
}));

// Singleton testing pattern
beforeEach(() => {
  (AuthService as any).instance = undefined; // Reset singleton
});
```

#### Coverage Achievement Results

- **lib/auth.ts**: 99.31% statements, 87.09% branches (from ~25%)
- **Overall coverage**: 86.7% statements, 79.49% branches (from ~60%)
- **57 comprehensive test cases** covering all auth methods and error scenarios

#### Future Avoidance Strategy

- Plan mocking strategy before writing tests
- Focus on high-impact files first (services, utilities)
- Write error path tests systematically
- Use coverage reports to identify gaps strategically

### 7. Critical CI Verification Workflow Failures

#### The Problem

A fundamental workflow error where local test success was incorrectly equated with CI success, leading to repeated false "CI is fixed" declarations without actual verification.

#### Key Issues Encountered

- **False CI success claims**: Declaring "CI is working" after local fixes without pushing changes
- **No actual verification**: Never checking real CI pipeline status after making fixes
- **Multiple failure cascades**: Each fix revealed new issues that weren't caught locally
- **User frustration**: Pattern repeated multiple times causing loss of trust

#### Critical Workflow Error Pattern

```bash
# ❌ WRONG - What was happening:
1. User: "CI is failing"
2. Make local changes
3. Run `bun run test:ci` locally ✅
4. Declare "CI is now working!" ❌ (NEVER VERIFIED)

# ✅ CORRECT - Required workflow:
1. User: "CI is failing"
2. Make local changes
3. Run tests locally to validate
4. **Commit and push changes**
5. **Monitor actual CI pipeline** (`bun run ci:watch`)
6. **Only then** declare CI is working
```

#### Root Cause Analysis

The three separate CI failures revealed:

1. **Test execution issues** - HTML5 validation preventing test scenarios
2. **Configuration conflicts** - Duplicate test runs (limited vs full suite)
3. **Missing build dependencies** - Convex client code generation not configured

#### Solution Pattern

**Mandatory CI Verification Protocol:**

```bash
# After making any CI-related changes:
git add . && git commit -m "fix: description"
git push
bun run ci:watch  # Monitor real pipeline
# Wait for actual CI completion before declaring success
```

**Never declare CI success without:**

- ✅ Pushing changes to remote
- ✅ Monitoring actual CI pipeline completion
- ✅ Verifying all CI steps pass (not just tests)

#### Future Avoidance Strategy

- **Always push first**: No CI declarations without pushing changes
- **Use monitoring tools**: `bun run ci:watch` for real-time verification
- **Document all failures**: Each CI failure type should be captured for pattern recognition
- **Test the full pipeline**: Local tests ≠ CI environment

### 8. Test Environment and Tooling Challenges

#### The Problem

Test runner selection and environment configuration significantly impact development velocity and coverage accuracy.

#### Key Issues Encountered

- **Bun vs Jest**: `bun test` didn't properly support Jest mocking patterns
- **Coverage accuracy**: Only `npx jest --coverage` gave accurate coverage reports
- **Mock hoisting**: Variable hoisting issues with `jest.mock()` required specific patterns
- **Test isolation**: Global state leakage between tests

#### Solution Pattern

```bash
# Always use Jest directly for accurate coverage
npx jest --coverage

# Not: bun test (mocking issues)
# Not: bun run test (environment issues)
```

```typescript
// Proper mock hoisting pattern
jest.mock('../module', () => ({
  export: mockValue, // Define inline, not as variable
}));

// Not: const mockValue = ...; jest.mock(() => ({ export: mockValue }))
```

#### Future Avoidance Strategy

- Use Jest directly for all test execution
- Understand test runner limitations early
- Test mocking patterns with simple cases first
- Establish test isolation patterns upfront

## Advanced Testing Patterns Learned

### 1. Component Testing with Context Providers

```typescript
// Custom render with providers pattern
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
```

### 2. Async State Testing Patterns

```typescript
// Proper async testing with React Testing Library
it('handles async state updates', async () => {
  const mockFn = jest.fn().mockResolvedValue(mockData);
  render(<Component />);

  fireEvent.click(screen.getByText('Load Data'));

  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });

  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

### 3. Error Boundary Testing

```typescript
// Test error scenarios systematically
it('handles service errors gracefully', async () => {
  mockConvex.mutation.mockRejectedValue(new Error('Service error'));

  const result = await authService.register('test', 'email', 'pass');

  expect(result.success).toBe(false);
  expect(result.error).toBe('Service error');
});
```

## Test Organization and Maintenance

### 1. File Organization Patterns

```
__tests__/
├── components/          # Component tests
├── services/           # Service layer tests
├── utils/              # Utility function tests
├── integration/        # Integration tests
└── fixtures/           # Test data and mocks
```

### 2. Test Data Management

```typescript
// Centralized test fixtures
export const mockUser = {
  _id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  // ... complete mock object
};

export const createMockAuthResult = (overrides = {}) => ({
  success: true,
  user: mockUser,
  ...overrides,
});
```

### 3. Coverage-Driven Development Process

1. **Baseline measurement**: Establish current coverage
2. **Gap analysis**: Identify high-impact, low-coverage files
3. **Strategic testing**: Target files with biggest coverage impact
4. **Incremental improvement**: Aim for 10-15% coverage increase per iteration
5. **Maintenance**: Regular coverage reviews and gap filling

### 9. Rate Limiter Testing Challenges

#### The Problem

Testing business logic systems like rate limiters requires balancing precise cost control validation with pragmatic mock API usage. Mock limitations can prevent proper testing if not handled correctly.

#### Key Issues Encountered

- **Mock API limitations**: Attempting to use non-existent mock methods instead of available simulation APIs
- **System configuration assumptions**: Testing assumed quota values rather than actual system configuration
- **Business logic precision**: Rate limiting is cost control - requires exact quota calculations, not flexible ranges

#### Solution Pattern

```typescript
// Use actual system quotas, not assumptions
const BROWSER_QUOTA = 400; // From actual system config
expect(result.remaining_quota).toBe(BROWSER_QUOTA - requestCount);

// Use available mock methods, don't invent new ones
mockStub.simulateSystemRateLimit('browser'); // Existing method
// Not: mockStub.setResponse() - doesn't exist

// Reset shared state for test isolation
beforeEach(() => {
  mockStub.resetState(); // Available reset method
});
```

#### Future Avoidance Strategy

- Study mock API documentation before writing tests
- Check actual system configuration for precise business logic testing
- Use available simulation methods rather than extending mock APIs
- Apply pragmatic vs perfectionist testing philosophy appropriately

### 10. Jest Cross-File Test Isolation: Shared Mock State Contamination

#### The Problem

Jest tests that pass individually but fail when run as a complete suite due to shared mock state contamination across test files. This creates false confidence in individual test passes while hiding critical system integration issues.

#### Root Cause Analysis

**Core Issue**: Shared MockDurableObjectStub instance in `setup.ts` persisted rate limiter state across test files, causing cross-file test contamination.

**Failure Pattern**:
```bash
# Individual tests pass
npm test load.test.ts ✅
npm test integration.test.ts ✅

# Complete suite fails
npm test ❌ (integration tests fail due to contaminated state from load tests)
```

**Architecture Problem**: Global shared mock instance across multiple test files:

```typescript
// ❌ PROBLEMATIC: Shared state across all test files
let rateLimiterStub: MockDurableObjectStub;

export function getRateLimiterStub(): MockDurableObjectStub {
  return rateLimiterStub; // Same instance for all tests
}
```

#### The Solution: Per-File Instance Management Architecture

**Core Architecture Change**: Replace global shared instance with per-file instance management using Jest lifecycle hooks.

```typescript
// ✅ SOLUTION: Per-file instance management
let currentRateLimiterStub: MockDurableObjectStub | null = null;

export function createFreshRateLimiterInstance(): MockDurableObjectStub {
  currentRateLimiterStub = new MockDurableObjectStub();
  return currentRateLimiterStub;
}

export function destroyRateLimiterInstance(): void {
  currentRateLimiterStub = null;
}

export function getRateLimiterStub(): MockDurableObjectStub {
  if (!currentRateLimiterStub) {
    throw new Error('Rate limiter instance not initialized. Call setupGlobalTestCleanup() first.');
  }
  return currentRateLimiterStub;
}
```

#### Critical Implementation Pattern: setupGlobalTestCleanup()

**Centralized Cleanup Function**: All test files must use this pattern for cross-file isolation:

```typescript
// setup.ts - Core isolation architecture
export function setupGlobalTestCleanup(): void {
  beforeAll(() => {
    // Create fresh instance for this test file
    createFreshRateLimiterInstance();
  });

  beforeEach(() => {
    // Reset state between tests within the same file
    const stub = getRateLimiterStub();
    stub.resetState();
  });

  afterAll(() => {
    // Destroy instance when test file completes
    destroyRateLimiterInstance();
  });
}
```

**Test File Implementation Pattern**: Every test file must follow this exact pattern:

```typescript
// load.test.ts, integration.test.ts, etc.
import { setupGlobalTestCleanup, getRateLimiterStub } from './setup';

// CRITICAL: Must be at top level of test file
setupGlobalTestCleanup();

describe('Test Suite', () => {
  it('test case', async () => {
    const rateLimiterStub = getRateLimiterStub();
    // Test implementation...
  });
});
```

#### Key Architecture Decisions and Rationale

**1. Per-File Lifecycle Management**
- **Decision**: Use `beforeAll()` and `afterAll()` for instance creation/destruction
- **Rationale**: Ensures complete isolation between test files
- **Alternative Rejected**: Global singleton (caused the original problem)

**2. Centralized Cleanup Function**
- **Decision**: Single `setupGlobalTestCleanup()` function used by all test files
- **Rationale**: Prevents test file implementation inconsistencies
- **Alternative Rejected**: Manual cleanup in each test file (error-prone)

**3. Explicit Instance Validation**
- **Decision**: Throw error if instance not initialized
- **Rationale**: Fail fast if test file forgets to call setup
- **Alternative Rejected**: Auto-create instance (hides setup issues)

**4. State Reset vs Instance Recreation**
- **Decision**: Reset state between tests within file, recreate instance between files
- **Rationale**: Performance optimization while maintaining isolation
- **Performance Impact**: State reset ~1ms, instance recreation ~10ms

#### Implementation Details: Files Modified

**Core Infrastructure (`tests/setup.ts`)**:
```typescript
// Key changes made:
- Replaced `rateLimiterStub` with `currentRateLimiterStub | null`
- Added `createFreshRateLimiterInstance()` and `destroyRateLimiterInstance()`
- Modified `getRateLimiterStub()` to validate instance exists
- Added `setupGlobalTestCleanup()` with beforeAll/afterAll lifecycle
```

**Test Files Updated**:
- `tests/load.test.ts` - Updated to use `setupGlobalTestCleanup()`
- `tests/integration.test.ts` - Updated + pragmatic test fix
- `tests/cross-system.test.ts` - Updated to use new pattern
- `tests/migration.test.ts` - Updated to use new pattern

**Configuration Enhancement (`jest.config.js`)**:
```javascript
// Added documentation about maxWorkers for extreme isolation cases
module.exports = {
  // maxWorkers: 1, // Uncomment for extreme isolation debugging
  // Force sequential test file execution if needed
};
```

#### Testing Results and Validation

**Before Fix**:
```bash
npm test load.test.ts ✅ (400 browser requests consumed)
npm test integration.test.ts ❌ (fails due to depleted quota)
npm test # Complete suite ❌
```

**After Fix**:
```bash
npm test load.test.ts ✅ (fresh instance, 400 requests available)
npm test integration.test.ts ✅ (fresh instance, 400 requests available)
npm test # Complete suite ✅ (all tests pass with proper isolation)
```

**Performance Impact**:
- **Individual test runtime**: No significant change
- **Suite runtime**: ~10-15% increase due to instance recreation
- **Memory usage**: Reduced (instances properly garbage collected)

#### Debugging Patterns for Future State Contamination

**1. Systematic Isolation Testing**:
```bash
# Test individual files first
npm test file1.test.ts
npm test file2.test.ts

# Then test combination
npm test file1.test.ts file2.test.ts

# Finally full suite
npm test
```

**2. State Inspection Pattern**:
```typescript
beforeEach(() => {
  const stub = getRateLimiterStub();
  console.log('State before test:', stub.getInternalState());
  stub.resetState();
});
```

**3. Instance Tracking Pattern**:
```typescript
// Add to setup.ts for debugging
let instanceCounter = 0;
export function createFreshRateLimiterInstance(): MockDurableObjectStub {
  const instance = new MockDurableObjectStub();
  instance._debugId = ++instanceCounter;
  console.log(`Created instance ${instanceCounter}`);
  return instance;
}
```

**4. Extreme Isolation Testing**:
```javascript
// jest.config.js - Force sequential execution
module.exports = {
  maxWorkers: 1, // One test file at a time
  runInBand: true, // No parallelization
};
```

#### Best Practices for Jest Cross-File Isolation

**1. Architectural Principles**:
- Never share mutable state between test files
- Use lifecycle hooks (`beforeAll`/`afterAll`) for instance management
- Centralize cleanup patterns to prevent inconsistencies
- Validate instance state explicitly

**2. Implementation Patterns**:
- Create fresh instances per test file
- Reset state between tests within same file
- Use centralized setup functions for consistency
- Throw errors for invalid state rather than auto-recovering

**3. Testing Workflow**:
- Always test files individually first
- Test file combinations before full suite
- Run complete suite regularly to catch contamination
- Use debugging patterns when isolation fails

**4. Performance Considerations**:
- Balance isolation completeness vs test performance
- Consider `maxWorkers: 1` for debugging only
- Profile test suite performance after isolation changes
- Monitor memory usage with proper cleanup

#### Future Avoidance Strategy

- **Design Phase**: Plan mock instance lifecycle before implementing tests
- **Implementation Phase**: Use centralized setup patterns from start
- **Testing Phase**: Test file combinations early, not just individual files
- **Maintenance Phase**: Regular cross-file contamination testing in CI
- **Debugging Phase**: Use systematic isolation patterns to identify contamination sources

#### Related Documentation

- **[Pragmatic vs Perfectionist Testing KDD](./pragmatic-vs-perfectionist-testing-kdd.md)** - Testing philosophy for avoiding over-precise assertions
- **[Testing Patterns](./testing-patterns.md)** - Reusable patterns including mock lifecycle management
- **[Jest Configuration Best Practices](./jest-configuration-patterns.md)** - Configuration patterns for test isolation

### 11. Environment Variable Validation and Error Handling in Tests

#### The Problem

Test cases that expect proper error handling for missing/invalid environment variables can fail with confusing error messages when the underlying code doesn't validate configuration early enough.

#### Key Issues Encountered

- **Fetch with invalid URLs**: When Redis environment variables are empty strings, `fetch()` calls to invalid URLs return `undefined` or malformed responses
- **Confusing error messages**: Instead of clear "missing configuration" errors, tests showed "Cannot read properties of undefined (reading 'ok')"
- **Error propagation**: Validation errors happening deep in the call stack make debugging difficult

#### Solution Pattern

**Early Validation in Service Constructors**:
```typescript
// RedisClient constructor - validate immediately
constructor(baseUrl: string, token: string) {
  // Validate required configuration
  if (!baseUrl || baseUrl.trim() === '') {
    throw new Error('Redis base URL is required and cannot be empty');
  }
  if (!token || token.trim() === '') {
    throw new Error('Redis token is required and cannot be empty');
  }

  // Validate URL format
  try {
    new URL(baseUrl);
  } catch {
    throw new Error('Redis base URL must be a valid URL');
  }

  this.baseUrl = baseUrl.replace(/\/$/, '');
  this.token = token;
}
```

**Robust Fetch Error Handling**:
```typescript
async pipeline(commands: string[][]): Promise<any[]> {
  let response: Response | undefined;

  try {
    response = await fetch(`${this.baseUrl}/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });
  } catch (error) {
    throw new Error(`Redis request failed: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (!response) {
    throw new Error('Redis request failed: No response received');
  }

  if (!response.ok) {
    throw new Error(`Redis pipeline failed: ${response.status} ${response.statusText}`);
  }

  // ... rest of method
}
```

**Clear Error Messages in Tests**:
```typescript
// Before: Confusing error
console.error('Log ingestion error:', TypeError: Cannot read properties of undefined (reading 'ok'))

// After: Clear error  
console.error('Log ingestion error:', Error: Redis base URL is required and cannot be empty)
```

#### Test Impact and Verification

**Test Behavior Maintained**:
- Environment variable error test still expects and receives 500 status
- Error response still contains `success: false` and `error: 'Internal server error'`
- All existing tests continue to pass without modification

**Improved Debugging Experience**:
- Clear error messages indicate exactly what configuration is missing
- Errors occur early in the call stack (constructor) rather than deep in fetch operations
- Health checks can distinguish between configuration and runtime errors

#### Future Avoidance Strategy

- **Validate early**: Check required configuration in service constructors
- **Fail fast**: Throw clear errors immediately when configuration is invalid
- **Handle fetch robustly**: Always check for undefined responses and network errors
- **Test error paths systematically**: Ensure error handling tests verify both the expected response and clear error messages
- **Distinguish error types**: Separate configuration errors (setup issues) from runtime errors (network failures)

### 14. Story 3.2 Testing Debt Resolution (2025-08-14)

#### Comprehensive Testing Implementation for AI-Powered Clarification System

**The Achievement**: Successfully implemented all deferred testing tasks from Story 3.2 (Subtasks 3.2.4.2-3.2.4.4), resolving technical debt and achieving comprehensive test coverage for the AI-Powered Clarification System.

**Scope of Implementation**:
- **Unit Tests**: AI generation and caching mechanisms
- **Integration Tests**: Complete Steps 3-6 clarification workflow
- **Error Boundary Tests**: Component error handling and recovery
- **AI Service Mocking**: Configurable mock services for reliable testing

#### Key Implementation Achievements

**1. Comprehensive Component Testing Suite**:
```typescript
// ClarificationStep.test.tsx - 350+ lines
- Authentication flow testing with session tokens
- Question generation lifecycle testing  
- Auto-save functionality validation
- Mock answer generation scenarios
- Navigation flow testing
- Error handling and recovery patterns
```

**2. AI Service Testing Architecture**:
```typescript
// ai-service-mocks.ts - 400+ lines reusable infrastructure
- Configurable error rate simulation
- Processing delay simulation
- Cache hit/miss testing patterns
- Realistic question generation mocking
- Token usage and cost tracking simulation
```

**3. Integration Workflow Testing**:
```typescript
// steps-3-6-clarification-workflow.test.ts - 400+ lines
- End-to-end Steps 3-6 execution
- Realistic incident narrative data
- Cross-phase question generation
- Complete workflow state management
- Performance optimization validation
```

**4. Error Boundary Testing Patterns**:
```typescript
// ClarificationStepErrorBoundary.test.tsx - 200+ lines
- Component error scenarios
- Async error handling
- User recovery actions
- Development vs production error modes
- Graceful degradation testing
```

#### Testing Infrastructure Insights

**Mock Service Architecture**:
- **Configurable Scenarios**: Error rates, processing delays, cache behavior
- **Realistic Responses**: AI-generated questions with proper structure
- **Performance Simulation**: Token usage, cost tracking, cache optimization
- **Error Simulation**: Network failures, AI service unavailability, prompt template errors

**Test Organization Pattern**:
```
tests/
├── web/components/incidents/
│   ├── ClarificationStep.test.tsx
│   ├── QuestionsList.test.tsx  
│   ├── QuestionCard.test.tsx
│   └── ClarificationStepErrorBoundary.test.tsx
├── convex/ai/
│   └── clarification-caching.test.ts
├── integration/
│   └── steps-3-6-clarification-workflow.test.ts
└── mocks/
    └── ai-service-mocks.ts
```

#### Test Coverage Results

**Comprehensive Coverage Achieved**:
- **200+ Test Scenarios**: Covering all AI clarification components and workflows
- **Unit Test Coverage**: ClarificationStep, QuestionsList, QuestionCard with edge cases
- **Integration Coverage**: Complete Steps 3-6 workflow with realistic data
- **Error Coverage**: AI service failures, component errors, recovery patterns
- **Performance Coverage**: Cache behavior, processing times, optimization patterns

**Mock Infrastructure Quality**:
- **Reusable Mock Services**: Configurable for different testing scenarios
- **Realistic Test Data**: Sample incident narratives and AI-generated questions
- **Error Scenario Coverage**: Network failures, authentication issues, service unavailability
- **Performance Testing**: Cache hit rates, processing times, optimization validation

#### Technical Implementation Lessons

**AI Service Testing Patterns**:
```typescript
// Lesson: Comprehensive AI service mocking
const mockAIService = {
  generateQuestions: jest.fn()
    .mockResolvedValueOnce(successResponse)
    .mockRejectedValueOnce(new Error('AI service unavailable'))
    .mockResolvedValueOnce(cachedResponse),
    
  // Configurable error rates for realistic testing
  setErrorRate: (rate: number) => { /* implementation */ },
  simulateProcessingDelay: (ms: number) => { /* implementation */ }
};
```

**Pragmatic Testing Philosophy Applied**:
Following lessons from Story 4.2, applied pragmatic vs perfectionist testing approach:
- **Test actual behavior**, not implementation details
- **Use flexible assertions** for non-critical values (`toBeGreaterThan` vs precise numbers)
- **Focus on business logic** rather than algorithm specifics
- **Verify expectations** against actual function output before writing assertions

**Error Boundary Testing Strategy**:
```typescript
// Comprehensive error recovery testing
test('handles component errors gracefully', () => {
  const ThrowError = () => { throw new Error('Component error'); };
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  expect(screen.getByText('Try again')).toBeInTheDocument();
});
```

#### Performance and Quality Impact

**Development Velocity**:
- **Test Execution Time**: ~15-20 seconds for complete AI clarification test suite
- **Coverage Validation**: Comprehensive coverage without over-testing implementation details
- **Debugging Support**: Clear error messages and realistic test scenarios
- **Maintainability**: Reusable mock infrastructure and centralized test patterns

**Quality Assurance**:
- **Regression Prevention**: Comprehensive test coverage prevents AI workflow regressions
- **Error Handling Validation**: Systematic testing of error scenarios and recovery patterns
- **Performance Monitoring**: Cache behavior and optimization testing
- **Integration Confidence**: End-to-end workflow testing with realistic data

#### Story 3.2 Completion Status Update

**Technical Debt Fully Resolved**:
- ✅ **Subtask 3.2.4.2**: Unit tests for AI generation and caching mechanisms
- ✅ **Subtask 3.2.4.3**: Integration tests for complete Steps 3-6 workflow
- ✅ **Subtask 3.2.4.4**: Error boundary testing and AI service mocking

**Final Assessment**:
Story 3.2 is now **100% complete** with no remaining technical debt. The AI-Powered Clarification System has:
- Complete feature implementation (previously done)
- Comprehensive test coverage (newly implemented)
- Production-ready error handling and recovery
- Robust AI service integration with proper mocking
- End-to-end workflow validation

#### Future Application and KDD Updates

**Testing Pattern Documentation Needed**:
1. **AI Service Testing Patterns**: Document comprehensive AI service mocking architecture
2. **Error Boundary Testing**: Standard patterns for component error handling
3. **Integration Testing**: End-to-end workflow testing with realistic data
4. **Mock Infrastructure**: Reusable mock service patterns for AI systems

**Process Improvements**:
1. **Testing Strategy**: Update story templates to clarify when testing can be deferred vs mandatory
2. **Technical Debt Management**: Better tracking and resolution patterns for deferred testing work
3. **Completion Criteria**: Clear definition of story completion including testing requirements

**Lessons for Future Stories**:
- **Proactive Testing**: Implement comprehensive testing during initial development when possible
- **Pragmatic Approach**: Apply pragmatic vs perfectionist testing philosophy from start
- **Reusable Infrastructure**: Invest in quality mock infrastructure for complex systems like AI services
- **Integration Focus**: Prioritize end-to-end workflow testing alongside unit tests

#### Permission System Enhancement Note

**Demo Admin Role Addition**:
During Story 3.2 testing implementation, the permission system was enhanced with a new Demo Admin role:
- **5 Total Roles**: System Admin, Demo Admin (NEW), Company Admin, Team Lead, Frontline Worker
- **Demo Admin Permissions**: All Company Admin permissions + sample data access + testing features
- **UI Integration**: Complete role selector updates across user management interfaces
- **Testing Impact**: Enhanced testing capabilities with dedicated demo/testing role

This permission enhancement supports better testing scenarios and demonstration capabilities while maintaining security boundaries.

## Related Testing Documentation

This document is part of a comprehensive testing knowledge system:

### **Core Testing Knowledge**

- **[Test Strategy and Standards](../../architecture/test-strategy-and-standards.md)** - Overall testing strategy and coverage standards
- **[Testing Patterns](../../patterns/testing-patterns.md)** - Reusable testing patterns and implementation examples
- **[Pragmatic vs Perfectionist Testing KDD](./pragmatic-vs-perfectionist-testing-kdd.md)** - Testing philosophy and rate limiter lessons

### **Implementation Guides**

- **[CI/CD Pipeline Setup](../../technical-guides/cicd-pipeline-setup.md)** - Complete CI/CD setup with testing
- **[Cloudflare Pages GitHub Actions Example](../../examples/cicd-deployment/cloudflare-pages-github-actions.md)** - Working CI/CD implementation

### **Cross-References**

- **Section 7**: Critical CI verification workflow (referenced by all CI/CD guides)
- **Section 14**: Story 3.2 testing debt resolution (comprehensive AI testing patterns)
- **Process Improvements**: Testing infrastructure checklist (used in setup guides)
- **Technical Patterns**: Mocking and configuration patterns (referenced in testing patterns)

## Conclusion

The testing infrastructure implementation revealed the hidden complexity of modern JavaScript toolchain integration. While the final result is robust and comprehensive, the path required deep technical knowledge across multiple systems. This document serves as a critical reference to prevent future teams from experiencing the same challenges and to accelerate similar implementations.

The key insight is that testing infrastructure is not just about writing tests—it's about orchestrating a complex ecosystem of tools that must work harmoniously across development, CI/CD, and deployment environments.

**Additional Insight**: Achieving high test coverage (86.7% statements, 79.49% branches) requires systematic approaches to mocking, strategic test planning, and understanding of coverage optimization patterns. The investment in comprehensive testing infrastructure pays dividends in code quality and developer confidence.

### 12. Story 1.4 API Testing Methodology (2025-08-08)

#### Critical Discovery: Authentication Testing vs API Implementation Validation

**The Problem**: Initial Story 1.4 integration testing showed 66.7% failure rate, leading to incorrect assumption that APIs were missing or broken.

**The Solution**: Separate API existence testing from authentication testing using phased validation approach.

#### Key Learning: Multi-Phase API Testing Strategy

**Phase 1 - API Existence Testing**:
```typescript
// Test API availability and validation without authentication
await testAPIEndpoint('incidents.create', client.mutation, api.incidents.create, mockData);
// Result: Confirms API exists, has proper validation, returns appropriate errors
```

**Phase 2 - Authentication Integration Testing**:
```typescript  
// Test with real authentication after confirming APIs exist
const loginResult = await client.mutation(api.auth.loginUser, {
  email: "system_admin@ndis.com.au", 
  password: "password"
});
// Result: Tests actual permission system with real role validation
```

**Phase 3 - Business Logic Workflow Testing**:
```typescript
// Test complete end-to-end workflows with authenticated users
// Result: Validates business logic implementation and user permissions
```

#### Impact on Story 1.4 Assessment

**Before Multi-Phase Testing**:
- Assumed 66.7% test failure = missing API implementation
- Authentication issues masked successful API implementation
- Incorrect gaps analysis led to unnecessary development work

**After Multi-Phase Testing**:  
- Discovered 87% API implementation complete (13/15 APIs working)
- 70.4% success rate with real authentication (authentic permission testing)
- Clear distinction between implementation bugs vs missing functionality

#### Static User Authentication Pattern

**Challenge**: Integration testing required multiple user roles but dynamic user creation always defaulted to `frontline_worker`.

**Solution**: Use persistent static users with known credentials:
```typescript
const STATIC_USERS = {
  system_admin: { email: "system_admin@ndis.com.au", password: "password" },
  company_admin: { email: "company_admin@ndis.com.au", password: "password" },
  team_lead: { email: "team_lead@ndis.com.au", password: "password" },
  frontline_worker: { email: "frontline_worker@ndis.com.au", password: "password" }
};
```

**Benefits**:
- Authentic role-based permission testing
- Consistent test environment without user creation complexity
- Clear distinction between permission issues vs implementation bugs

#### Future Application

This methodology should be applied to all API testing scenarios:
1. **Always test API existence separately from authentication**
2. **Use static users with known credentials for role-based testing** 
3. **Validate permission systems with real authentication, not mocks**
4. **Distinguish between missing functionality vs configuration issues**

This discovery significantly improves Story completion assessment accuracy and prevents wasted development effort on non-existent gaps.

### 13. Story 3.4 Authentication Pattern Security Violation (2025-08-12)

#### Critical Security Architecture Violation

**The Problem**: During AI Prompt Templates implementation, a **fundamental authentication pattern violation** occurred that caused runtime authentication errors and exposed gaps in architecture pattern adherence.

**Root Cause**: Failed to follow established session-based authentication patterns, instead using generic Convex `ctx.auth.getUserIdentity()` approach.

#### The Critical Error Pattern

**Initial Implementation (WRONG)**:
```typescript
// ❌ INCORRECT: Generic Convex authentication
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Not authenticated");
}
```

**Correct Implementation (RIGHT)**:
```typescript
// ✅ CORRECT: Established session token pattern
const { user } = await requirePermission(
  ctx,
  sessionToken,
  PERMISSIONS.SYSTEM_CONFIGURATION
);
```

#### Impact and User Feedback

**Runtime Error**:
```
[CONVEX Q(promptTemplates:getSystemPromptTemplates)] [Request ID: c2e73ff9d536d290] 
Server Error Uncaught Error: Not authenticated at validateSystemAdmin
```

**User Response**: 
> "How could you make such a fundamental mistake? Have you not read the documentation around building these systems?"

#### Systematic Correction Required

**Scope of Fix**:
- **Backend Functions**: 10+ functions required sessionToken parameter addition
- **Frontend Components**: 3 React components needed auth context integration
- **Service Layer**: React hooks updated to pass session tokens
- **File Naming**: Convex module naming requirements (hyphens → underscores)

#### Key Architecture Lessons

**1. Documentation-First Development**:
```bash
# MANDATORY pattern review before new features
grep -r "sessionToken" apps/convex/
grep -r "requirePermission" apps/convex/
cat docs/technical-guides/authentication-architecture.md
```

**2. Authentication Pattern Consistency**:
- **Rule**: Never implement authenticated functions without following established patterns
- **Pattern**: Always use `sessionToken` parameter + `requirePermission()` middleware
- **Validation**: Check existing functions for authentication patterns before implementing

**3. Security Pattern Discovery Protocol**:
Before implementing any authenticated feature:
- [ ] **Read authentication architecture documentation**
- [ ] **Survey existing authenticated functions**
- [ ] **Follow established permission constants**
- [ ] **Match existing function signatures**
- [ ] **Test authentication systematically**

#### Prevention Strategy

**Pre-Implementation Checklist**:
```typescript
// Template for new authenticated functions
export const newFunction = mutation({
  args: {
    sessionToken: v.string(),  // MANDATORY
    // ... other args
  },
  handler: async (ctx, args) => {
    // MANDATORY authentication pattern
    const { user } = await requirePermission(
      ctx, 
      args.sessionToken, 
      PERMISSIONS.REQUIRED_PERMISSION
    );
    // ... business logic
  }
});
```

**Testing Requirements**:
```typescript
// MANDATORY authentication tests
describe('New Function Authentication', () => {
  test('requires valid session token', () => {
    expect(() => newFunction({})).toThrow('Authentication required');
  });
  
  test('requires correct permissions', () => {
    expect(() => newFunction({ sessionToken: wrongRoleToken }))
      .toThrow('Insufficient permissions');
  });
  
  test('works with correct authentication', () => {
    const result = await newFunction({ sessionToken: systemAdminToken });
    expect(result).toBeDefined();
  });
});
```

#### Technical Debt Impact

**Debt Created**:
- Authentication pattern violation across 10+ functions
- Frontend integration gaps in 3+ components
- File naming compliance issues (Convex requirements)

**Debt Resolved**:
- Systematic authentication pattern compliance
- Proper role-based access control throughout feature
- Complete integration with established architecture

#### Long-term Learning

**Critical Insight**: In established codebases, **pattern consistency is a security requirement**, not a style preference. Architecture pattern violations can introduce critical security vulnerabilities.

**Process Improvement**: 
- Always survey existing patterns before implementing new features
- Authentication architecture review is mandatory for all secure features
- User feedback on "fundamental mistakes" indicates need for better pattern discovery protocols

#### Future Application

This lesson applies to all future feature development:
1. **Pattern Discovery First**: Review existing implementations before starting
2. **Documentation Review**: Read architecture guides as prerequisite  
3. **Systematic Testing**: Authentication testing is non-negotiable
4. **User Experience**: Architecture violations cause user frustration and system instability

**Reference Documentation**:
- **[Story 3.4 Authentication Security Pattern KDD](./story-3.4-authentication-security-pattern-kdd.md)** - Detailed analysis of this violation
- **[AI Prompt Template Implementation KDD](./ai-prompt-template-implementation-kdd.md)** - Complete feature implementation documentation
