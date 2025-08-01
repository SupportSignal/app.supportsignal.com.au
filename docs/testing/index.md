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

**User acceptance testing and functional verification:**

### Functional Test Plans

**Epic 1 - Platform Foundation:**
- [Story 1.2 - Basic Next.js App Shell](uat/functional-test-plan-1.2.md)
- [Story 1.4 - Convex Backend Integration](uat/functional-test-plan-1.4.md) 
- [Story 1.5 - Authentication System](uat/functional-test-plan-1.5.md)
- [Story 1.6 - User Dashboard](uat/functional-test-plan-1.6.md)
- [Story 1.7 - GitHub OAuth](uat/functional-test-plan-1.7.md)
- [Story 1.8 - Profile Management](uat/functional-test-plan-1.8.md)

**Epic 2 - UI Toolkit & Component Showcase:**
- [Story 2.1 - Integrate ShadCN/UI Library](uat/functional-test-plan-2.1.md)

**Epic 3 - Resilient Real-time Logging:**
- [Story 3.1 - Browser Log Capture Foundation](uat/functional-test-plan-3.1.md)
- [Story 3.2 - Multi-System Log Ingestion & Correlation](uat/functional-test-plan-3.2.md)

**Epic 4 - AI-Powered Chat Interface:**
- [Story 4.2 - Knowledge Ingestion Service](uat/functional-test-plan-4.2.md)

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
└── uat/                       # Functional testing documentation  
    ├── functional-test-plan-1.2.md
    ├── functional-test-plan-1.4.md
    ├── functional-test-plan-1.5.md
    ├── functional-test-plan-1.6.md
    ├── functional-test-plan-1.7.md
    ├── functional-test-plan-1.8.md
    ├── functional-test-plan-2.1.md
    ├── functional-test-plan-3.1.md
    ├── functional-test-plan-3.2.md
    └── functional-test-plan-4.2.md
```