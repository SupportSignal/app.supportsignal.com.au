# TypeScript Configuration Best Practices

*Derived from CI debugging lessons and unified configuration implementation*

## Overview

This guide provides battle-tested TypeScript configuration patterns for monorepo environments, focusing on consistency between development, build, and CI contexts.

## Core Principles

### 1. Single Source of Truth
Use one `tsconfig.json` per package that serves all contexts (ESLint, Next.js build, CI typecheck).

### 2. Environment Consistency  
Configuration should work identically in local development and CI environments.

### 3. Package Isolation
Each package's TypeScript configuration should not analyze files from other packages.

## Recommended Configuration Structure

### Base Configuration Template

```json
// apps/web/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "typeRoots": ["./node_modules/@types", "./types"],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"],
      "@/ui/*": ["../../packages/ui/*"],
      "@starter/ui": ["../../packages/ui"],
      "workspace-package": ["./types/workspace-package"]
    }
  },
  "include": [
    "next-env.d.ts",
    "types/**/*.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "../other-packages/**/*",
    "**/*.test.*",
    "**/__tests__/**/*",
    "lib/test-utils.*"
  ]
}
```

## Configuration Strategies by Context

### 1. Monorepo Package Configuration

**Problem**: Preventing cross-package compilation while allowing proper imports.

**Solution**: Explicit excludes + stub types

```json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./types"],
    "paths": {
      "backend-api": ["./types/backend-api"]
    }
  },
  "exclude": [
    "../backend/**/*",
    "../other-packages/**/*"
  ]
}
```

**Companion Stub Types**:
```typescript
// types/backend-api.d.ts
declare module 'backend-api' {
  export const api: {
    queries: { [key: string]: any };
    mutations: { [key: string]: any };
  };
}
```

### 2. Next.js Integration

**Key Settings for Next.js**:
```json
{
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "jsx": "preserve",
    "incremental": true,
    "module": "esnext",
    "moduleResolution": "bundler"
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ]
}
```

**Critical**: Ensure Next.js build and typecheck use the same configuration.

### 3. Test File Handling

**Strategy**: Exclude test files from production builds but allow in development.

```json
{
  "exclude": [
    "**/*.test.*",
    "**/__tests__/**/*",
    "**/*.spec.*",
    "lib/test-utils.*"
  ]
}
```

**For Test-Specific Config** (if needed):
```json
// jest.config.js handles its own TypeScript compilation
// Main tsconfig.json excludes test files
// ESLint can have overrides for test files
```

## Anti-Patterns to Avoid

### ❌ Split Configuration Anti-Pattern

```json
// DON'T: Multiple configs that can drift
// tsconfig.json - for builds
// tsconfig.src.json - for typecheck
// tsconfig.dev.json - for development
```

**Problems**:
- Configuration drift over time
- Different tools see different files
- Linting doesn't catch build issues
- Maintenance overhead

### ❌ Cross-Package Includes

```json
// DON'T: Include files from other packages
{
  "include": [
    "**/*.ts",
    "../other-packages/**/*.ts"  // ❌ WRONG
  ]
}
```

**Problems**:
- Violates package boundaries
- Creates environment-sensitive builds
- Makes dependency graph unclear

### ❌ Overly Permissive Includes

```json
// DON'T: Include everything without proper excludes
{
  "include": ["**/*"],  // ❌ Too broad
  "exclude": ["node_modules"]  // ❌ Insufficient
}
```

**Problems**:
- Includes test files in production builds
- Processes unnecessary files
- Slower compilation times

## Debugging TypeScript Configuration Issues

### Common Diagnostic Commands

```bash
# Check what files TypeScript is processing
tsc --listFiles

# Trace module resolution
tsc --traceResolution

# Show configuration after extends/includes
tsc --showConfig

# Check specific file compilation
tsc --noEmit path/to/file.ts
```

### Environment Difference Detection

```bash
# Compare local vs CI module resolution
npm ls package-name    # Local
# vs CI logs for same command

# Check TypeScript version consistency
tsc --version

# Verify configuration is identical
cat tsconfig.json | shasum
```

## Performance Optimization

### 1. Incremental Compilation

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### 2. Skip Library Checks

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

**Note**: Only use if you trust your dependencies' type definitions.

### 3. Proper Excludes

```json
{
  "exclude": [
    "node_modules",
    "dist/**/*",
    "build/**/*",
    "**/*.test.*",
    "../other-packages/**/*"
  ]
}
```

## Integration with Build Tools

### ESLint Configuration Alignment

```json
// .eslintrc.json
{
  "parserOptions": {
    "project": "./tsconfig.json"  // Use same config
  }
}
```

### Turbo.json Considerations

```json
// turbo.json
{
  "pipeline": {
    "typecheck": {
      "dependsOn": [],
      "inputs": ["**/*.ts", "**/*.tsx", "tsconfig.json"]
    }
  }
}
```

## Testing Your Configuration

### Local Verification Checklist

```bash
# 1. TypeScript compilation
tsc --noEmit

# 2. Next.js build
npm run build

# 3. ESLint consistency
npm run lint

# 4. All should pass without errors
```

### CI/CD Verification

```bash
# Ensure same commands work in CI
# Check that environment differences don't cause failures
# Verify caching works correctly
```

## Migration Strategies

### From Split to Unified Configuration

1. **Audit Current Configs**
   ```bash
   diff tsconfig.json tsconfig.src.json
   ```

2. **Identify Common Patterns**
   - Which includes/excludes are shared?
   - What are the differences?
   - Can differences be eliminated?

3. **Create Unified Config**
   - Start with most restrictive configuration
   - Add includes/excludes that work for all contexts
   - Test thoroughly

4. **Remove Redundant Configs**
   - Update package.json scripts
   - Remove old configuration files
   - Update CI/CD pipelines

### From Loose to Strict Configuration

1. **Gradual Tightening**
   ```json
   {
     "exclude": [
       "node_modules",
       // Add one exclusion at a time
     ]
   }
   ```

2. **Fix Issues Incrementally**
   - Address compilation errors one by one
   - Don't try to fix everything at once
   - Test after each change

## Configuration Examples

### Frontend Package (Next.js)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "backend": ["./types/backend"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "../backend/**/*", "**/*.test.*"]
}
```

### Backend Package (Node.js)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": "."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.*"]
}
```

### Shared Package (Library)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["ES2017"],
    "module": "esnext",
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.*"]
}
```

## Troubleshooting Guide

### Issue: "Cannot find module" errors

**Diagnosis**:
```bash
tsc --traceResolution | grep "module-name"
```

**Solutions**:
1. Check `paths` configuration
2. Verify `baseUrl` is correct
3. Ensure module exists in `node_modules`
4. Check exclude patterns aren't too broad

### Issue: Different behavior local vs CI

**Diagnosis**:
1. Compare TypeScript versions
2. Check Node.js versions  
3. Verify same configuration files
4. Compare dependency versions

**Solutions**:
1. Use exact versions in CI
2. Commit lock files
3. Use same configuration everywhere

### Issue: Build includes test files

**Diagnosis**:
```bash
tsc --listFiles | grep test
```

**Solutions**:
1. Add test exclusions
2. Review include patterns
3. Check for overly broad includes

## Best Practices Summary

1. ✅ **Use single `tsconfig.json`** per package for all contexts
2. ✅ **Explicit excludes** for cross-package boundaries
3. ✅ **Stub types** for workspace dependencies during builds  
4. ✅ **Environment consistency** between local and CI
5. ✅ **Incremental compilation** for performance
6. ✅ **Regular audits** of configuration effectiveness

## Related Documentation

- [Monorepo Architecture Lessons](../lessons-learned/architecture/monorepo-lessons.md)
- [Symlink Anti-Patterns](../lessons-learned/anti-patterns/monorepo-symlink-anti-patterns.md)
- [CI Debugging Methodology](./ci-debugging-methodology.md)

---

*This guide was developed from real-world debugging experience and production implementations. It represents proven patterns for TypeScript configuration in complex monorepo environments.*