# Monorepo Symlink Anti-Patterns

*Lessons learned from CI debugging session - July 2025*

## Overview

This document captures critical anti-patterns discovered during a complex CI debugging session where symlinks in a monorepo caused module resolution failures between local and CI environments.

## The Anti-Pattern: Cross-Package Symlinks

### What We Did Wrong

```bash
# Created symlink from web package to convex generated files
apps/web/convex -> ../convex/_generated
```

**Problem**: This created a **module resolution context mismatch** where:
- **Local environment**: Symlink resolved correctly
- **CI environment**: Same symlink caused TypeScript to analyze files in wrong compilation context

### Why This Failed

1. **Package Isolation Violation**: Web package started importing and compiling Convex backend files
2. **Context Confusion**: TypeScript couldn't determine which `node_modules` context to use
3. **Environment Sensitivity**: Different behavior between local dev and CI systems
4. **Build Process Chaos**: Multiple TypeScript configs trying to process same files

## Root Cause Analysis

### The Symlink Problem Chain

```
Symlink Creation
    ↓
Cross-Package File Access
    ↓  
Module Resolution Ambiguity
    ↓
TypeScript Context Confusion
    ↓
Different Behavior: Local vs CI
    ↓
Build Failures
```

### Specific Error Pattern

```typescript
// This worked locally but failed in CI:
import { defineSchema, defineTable } from 'convex/server';
// Error: Module '"convex/server"' has no exported member 'defineSchema'
```

**Why**: The web package's TypeScript compilation was trying to process Convex files with the wrong module resolution context.

## Anti-Pattern Indicators

🚨 **Warning Signs** that you're violating monorepo package isolation:

1. **Symlinks between packages** (except for build outputs)
2. **Different CI vs local behavior** for same code
3. **Module resolution errors** only in CI
4. **TypeScript analyzing files from other packages**
5. **Cross-package imports** that bypass proper exports

## The Correct Pattern

### Proper Monorepo Architecture

```json
// apps/convex/package.json
{
  "name": "convex-backend",
  "exports": {
    ".": {
      "types": "./_generated/api.d.ts",
      "default": "./_generated/api.js"
    }
  }
}
```

```json
// apps/web/package.json  
{
  "dependencies": {
    "convex-backend": "workspace:*"
  }
}
```

```typescript
// Clean import in web package
import { api } from 'convex-backend';
```

### Benefits of Proper Approach

✅ **Package Isolation**: Each package compiles independently
✅ **Environment Consistency**: Same behavior local and CI  
✅ **Clear Dependencies**: Explicit package relationships
✅ **Type Safety**: Proper TypeScript module resolution
✅ **Scalability**: Follows monorepo best practices

## Debugging Methodology

### Systematic Investigation Process

1. **Identify Environment Differences**
   ```bash
   # Local works, CI fails - investigate module resolution
   npm ls convex  # Check dependency resolution
   ```

2. **Trace Import Paths**
   ```bash
   # Follow the import chain to find resolution differences
   tsc --noEmit --traceResolution
   ```

3. **Check Package Boundaries**
   ```bash
   # Ensure packages don't cross-contaminate
   find . -type l  # Find all symlinks
   ```

4. **Test in Isolation**
   ```bash
   # Test each package independently
   cd apps/web && npm run typecheck
   cd apps/convex && npm run typecheck
   ```

## Prevention Strategies

### 1. Proper Package Exports
Always use explicit package exports instead of direct file access.

### 2. TypeScript Configuration
Configure `tsconfig.json` to respect package boundaries:

```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./types"],
    "paths": {
      "package-name": ["./types/package-name"]
    }
  },
  "exclude": ["../other-packages/**/*"]
}
```

### 3. Stub Types for Build Isolation
Create stub type declarations for cross-package imports during builds:

```typescript
// types/convex-backend.d.ts
declare module 'convex-backend' {
  export const api: {
    queries: { getTestMessage: any };
    // ... other exports
  };
}
```

## Recovery Strategy

If you encounter this anti-pattern:

1. **Create Safety Commit**: Record current working state
2. **Remove Symlinks**: Delete problematic cross-package symlinks  
3. **Add Package Exports**: Configure proper package.json exports
4. **Update Imports**: Use workspace dependencies instead of symlinks
5. **Test Thoroughly**: Verify both local and CI environments
6. **Document Changes**: Record the architectural improvement

## Impact Assessment

### Technical Debt Cost
- **Initial Setup**: 30 minutes (symlink creation)
- **Debugging Time**: 4+ hours (CI investigation and fixes)  
- **Proper Fix**: 2 hours (architectural refactoring)
- **Total Cost**: 6+ hours vs 2 hours if done correctly initially

### Team Learning Value
- **Architecture Understanding**: Deep insight into monorepo patterns
- **CI/CD Knowledge**: Environment debugging skills
- **TypeScript Mastery**: Module resolution expertise
- **Process Improvement**: Better architectural review practices

## Key Takeaways

1. **Never use symlinks between packages** in monorepos
2. **Always use proper package exports** and workspace dependencies
3. **Test architectural changes in CI early** to catch environment differences
4. **When in doubt, choose explicit over implicit** package relationships
5. **Document anti-patterns immediately** for team learning

## Related Documentation

- [Monorepo Architecture Lessons](../architecture/monorepo-lessons.md)
- [TypeScript Configuration Best Practices](../../technical-guides/typescript-configuration-best-practices.md)
- [CI/CD Debugging Methodology](../../technical-guides/ci-debugging-methodology.md)

---

*This anti-pattern was discovered and resolved during the CI debugging session of July 25, 2025. The lessons learned have been integrated into our development practices and architectural guidelines.*