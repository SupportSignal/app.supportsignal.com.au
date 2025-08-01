# Testing Infrastructure Architecture - Knowledge-Driven Development

## Overview

This document captures critical learnings from resolving BadConvexModuleIdentifier errors and implementing a complete test separation architecture. The insights here prevent future development conflicts and establish sustainable testing patterns.

## Problem Context

### Original Issue

- **BadConvexModuleIdentifier errors** breaking Convex dev server
- Test files mixed with production code causing naming conflicts
- Coverage artifacts (`lcov-report` with hyphens) violating Convex naming rules
- Complex relative import paths making tests brittle

### Impact

- Development server failures
- Test suite instability
- Poor developer experience
- Architectural coupling between tests and production code

## Solution Architecture

### 1. Complete Test Separation

**Before:**

```
apps/convex/
├── knowledge.ts           # Production code
├── __tests__/            # Tests mixed with code
│   ├── knowledge.test.ts
│   └── coverage/         # Conflicts with Convex
└── other-files.ts
```

**After:**

```
tests/convex/             # Completely separate
├── knowledge.test.ts
├── lib/
│   └── config.test.ts
└── fixtures/
    └── testData.ts

apps/convex/              # Pure production code
├── knowledge.ts
├── lib/
│   └── config.ts
└── other-files.ts
```

**Benefits:**

- ✅ Zero Convex dev server conflicts
- ✅ Clear separation of concerns
- ✅ Independent test evolution
- ✅ Easier CI/CD configuration

### 2. TypeScript Path Mapping Revolution

**Before:**

```typescript
// Brittle relative imports
import { config } from '../../../apps/convex/lib/config';
import { knowledge } from '../../apps/convex/knowledge';
```

**After:**

```typescript
// Clean, maintainable aliases
import { config } from '@convex/lib/config';
import { knowledge } from '@convex/knowledge';
import { testData } from '@convex-tests/fixtures/testData';
```

**Configuration in `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@convex/*": ["apps/convex/*"],
      "@convex-tests/*": ["tests/convex/*"],
      "@web/*": ["apps/web/*"],
      "@ui/*": ["packages/ui/*"],
      "@test-coverage/*": ["test-coverage/*"]
    }
  }
}
```

### 3. Coverage Centralization

**Unified Structure:**

```
test-coverage/
├── convex/              # Backend test coverage
│   ├── index.html
│   ├── lcov-report/
│   └── lcov.info
└── web/                 # Frontend test coverage
    ├── index.html
    ├── lcov-report/
    └── lcov.info
```

**Jest Configuration Pattern:**

```javascript
// Root level: jest.config.js
export default {
  coverageDirectory: 'test-coverage/convex',
  testMatch: ['<rootDir>/tests/convex/**/*.test.ts'],
  // ...
};

// Web app: apps/web/jest.config.js
const config = {
  coverageDirectory: '../../test-coverage/web',
  // ...
};
```

## Technical Implementation Patterns

### 1. ESM-Compatible Jest Configuration

```javascript
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  // Transform ESM modules properly
  transformIgnorePatterns: ['node_modules/(?!(convex|@convex)/)'],

  // Path mapping support
  moduleNameMapper: {
    '^@convex/(.*)$': '<rootDir>/apps/convex/$1',
    '^@convex-tests/(.*)$': '<rootDir>/tests/convex/$1',
  },
};
```

### 2. Convex Configuration Updates

```json
{
  "ignoredPaths": [
    "coverage/**/*",
    "node_modules/**/*",
    "*.test.ts",
    "*.test.js",
    "*.spec.ts",
    "*.spec.js",
    "jest.config.js",
    "__tests__/**/*",
    "__tests_backup/**/*",
    "__tests_disabled/**/*",
    "**/__tests__/**/*",
    "**/__mocks__/**/*",
    "**/coverage/**/*",
    "**/*.test.*",
    "**/*.spec.*"
  ]
}
```

## Testing Philosophy - Pragmatic vs Perfectionist

### Core Principle

**Test what the function actually does, not what you think it should do.**

### Precision Guidelines

**BE PRECISE for:**

- Business logic validation
- Security requirements
- Critical path functionality
- Data integrity checks

**BE FLEXIBLE for:**

- Algorithm implementation details
- Performance metrics (unless critical)
- Non-functional characteristics
- Internal data structures

### Example Pattern

```typescript
// ❌ Perfectionist (causes false failures)
expect(stats.characterCount).toBe(18); // Where did 18 come from?

// ✅ Pragmatic (tests actual behavior)
expect(stats.characterCount).toBe(text.length); // Matches implementation
expect(stats.characterCount).toBeGreaterThan(0); // Verifies function works
```

### Verification First Rule

Always verify expectations against actual function output before writing assertions:

```typescript
// 1. Run the function to understand actual behavior
const result = myFunction(testInput);
console.log('Actual result:', result);

// 2. Write tests based on actual behavior
expect(result.someProperty).toBe(result.someProperty); // Not a guess
```

## Troubleshooting Patterns

### 1. Environment Corruption Detection

**Symptoms:**

- Import errors despite correct paths
- Module resolution failures
- Inconsistent test results

**Solution - Nuclear Cleanup:**

```bash
# 1. Clean everything
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm bun.lock

# 2. Fresh install
bun install

# 3. Regenerate artifacts
bunx convex dev  # Let it regenerate _generated files
```

### 2. Background Process Interference

**Issue:** Rogue Jest or Convex processes interfering with file generation

**Detection:**

```bash
ps aux | grep -E "(jest|convex)"
lsof -i :3000  # Check for port conflicts
```

**Resolution:**

```bash
# Kill specific processes
kill -9 <PID>

# Or nuclear approach
pkill -f jest
pkill -f convex
```

### 3. ESM Mocking Limitations

**Problem:** Complex `jest.mock()` calls fail with ESM configuration

**Solution - Manual Mock Pattern:**

```typescript
// Instead of jest.mock() calls
const mockServer = require('@convex-tests/__mocks__/_generated/server');
const mockApi = require('@convex-tests/__mocks__/_generated/api');

// Use global jest object conditionally
beforeEach(() => {
  if (global.jest) {
    global.jest.clearAllMocks();
  }
});
```

## Best Practices Summary

### 1. Architecture

- ✅ Complete separation of tests from production code
- ✅ Use TypeScript path mapping for clean imports
- ✅ Centralize coverage in unified directory structure
- ✅ Configure Convex `ignoredPaths` comprehensively

### 2. Testing Philosophy

- ✅ Test actual behavior, not assumptions
- ✅ Be precise for business logic, flexible for implementation
- ✅ Verify function output before writing assertions
- ✅ Prefer pragmatic over perfectionist approaches

### 3. Infrastructure

- ✅ Use ESM-compatible Jest configurations
- ✅ Implement proper module transformation patterns
- ✅ Plan for environment corruption recovery
- ✅ Monitor for background process interference

### 4. Maintenance

- ✅ Document path mapping conventions
- ✅ Maintain consistent coverage organization
- ✅ Update configurations when adding new test types
- ✅ Regular environment health checks

## Migration Guide

When implementing this architecture in new projects:

1. **Setup Phase:**
   - Create separate `tests/` directory structure
   - Configure TypeScript path mapping
   - Update Jest configurations for separation
   - Configure framework-specific ignore patterns

2. **Migration Phase:**
   - Move existing tests to new structure
   - Update import paths to use aliases
   - Verify coverage generation in new locations
   - Test framework compatibility

3. **Validation Phase:**
   - Verify no development server conflicts
   - Confirm all tests run successfully
   - Check coverage generation
   - Validate CI/CD pipeline compatibility

## References

- **Story 4.2**: Pragmatic vs Perfectionist Testing Philosophy
- **Convex Documentation**: File naming and structure requirements
- **Jest ESM Support**: Module transformation patterns
- **TypeScript Path Mapping**: Alias configuration best practices
