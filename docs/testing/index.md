# Testing Documentation

This directory contains all testing-related documentation organized by purpose and audience.

## For Developers (Technical Testing)

**Priority reading for writing tests and debugging test issues:**

### 🔥 Essential Files
- **[Testing Infrastructure Lessons Learned](technical/testing-infrastructure-lessons-learned.md)** - **START HERE for debugging** - Real problems encountered and solutions found, including Jest + Next.js integration gotchas, ESLint configuration conflicts, CI environment differences
- **[Testing Patterns](technical/testing-patterns.md)** - **For implementation** - Concrete patterns for testing React components, hooks, Convex functions, mocking strategies, error path testing
- **[Test Strategy & Standards](technical/test-strategy-and-standards.md)** - **For context** - Testing framework, coverage targets, toolchain standards, CI/CD integration

### Quick Reference
- **Debugging tests that fail?** → Start with lessons-learned
- **Writing new tests?** → Use testing-patterns  
- **Setting up testing infrastructure?** → Follow test-strategy-and-standards

## For QA/Product (Functional Testing)

**Story acceptance testing and functional verification:**

### Story Acceptance Tests

**Epic 1 - SupportSignal Foundation:**
- [Story 1.1 - Multi-Tenant Database Implementation](stories/story-acceptance-test-1.1.md)
- [Story 1.2 - AI Service Integration](stories/story-acceptance-test-1.2.md)

## Testing Commands Reference

```bash
# Unit & Integration Tests
bun test              # Run Jest unit tests
bun test:watch        # Run tests in watch mode

# End-to-End Tests  
bun test:e2e          # Run Playwright E2E tests
bun test:e2e:ui       # Run Playwright with UI mode

# Code Quality
bun lint              # Run ESLint
bun typecheck         # Run TypeScript compiler checks
bun format            # Run Prettier

# CI Testing
bun test:ci           # Run tests in CI mode with coverage
```

## Directory Structure

```
docs/testing/
├── index.md                    # This file - testing documentation overview
├── technical/                  # Developer-focused testing documentation
│   ├── test-strategy-and-standards.md
│   ├── testing-patterns.md
│   └── testing-infrastructure-lessons-learned.md
└── stories/                    # Story acceptance testing documentation  
    ├── story-acceptance-test-1.1.md
    └── story-acceptance-test-1.2.md
```