# ESLint Three-Tier Configuration Solution

## Problem Summary

The original ESLint configuration suffered from a "one size fits none" problem, attempting to serve multiple runtime environments with a single configuration:

- Browser globals (window, document, sessionStorage)
- Node.js globals (process, Buffer, \_\_dirname)
- Convex runtime globals (fetch, setTimeout, Response)
- Jest globals (describe, it, expect)

This caused a "whack-a-mole" pattern where fixing one environment broke another, leading to persistent ESLint errors and developer frustration.

## Solution: Three-Tier ESLint Configuration

### Architecture Overview

The solution implements three distinct ESLint configurations, each optimized for its specific runtime environment:

```
┌─────────────────┐
│ TIER 1: Frontend│  Strict rules, browser-only globals
│ apps/web/**/*.ts│  No console errors, no process.env
└─────────────────┘

┌─────────────────┐
│ TIER 2: Backend │  Pragmatic rules, Convex runtime globals
│apps/convex/**/*.ts│  Console warnings OK, any types warn
└─────────────────┘

┌─────────────────┐
│ TIER 3: Generated│  Minimal linting, compilation focus
│**/_generated/**│  Most rules disabled
└─────────────────┘
```

### Tier 1: Frontend Environment (Strict)

**Files**: `apps/web/**/*.{ts,tsx}`

**Philosophy**: User-facing code needs strict quality standards

**Globals**: Browser-only

- `window`, `document`, `sessionStorage`, `localStorage`
- `fetch`, `crypto`, DOM types (`HTMLElement`, etc.)
- React types (`React`, `JSX`)

**Key Rules**:

- `'@typescript-eslint/no-explicit-any': 'error'` - No any types
- `'no-console': 'error'` - No console statements
- `process.env` access blocked with custom error message

### Tier 2: Backend Environment (Pragmatic)

**Files**: `apps/convex/**/*.ts`

**Philosophy**: Backend integration needs flexibility

**Globals**: Convex runtime

- `console`, `process`, `Buffer`, Node.js-like globals
- `crypto`, `fetch`, `setTimeout`, Web API types
- `TextEncoder`, `TextDecoder`, `atob`, `btoa`

**Key Rules**:

- `'@typescript-eslint/no-explicit-any': 'warn'` - Any types allowed with warning
- `'no-console': 'warn'` - Console statements allowed
- `'no-restricted-syntax': 'off'` - process.env access allowed

### Tier 3: Generated Code (Minimal)

**Files**: `**/_generated/**/*`, `**/convex/_generated/**/*`

**Philosophy**: Don't lint generated code

**Rules**: Most linting disabled, focus on TypeScript compilation only

## Implementation Details

### File Structure

```javascript
// eslint.config.js
export default [
  js.configs.recommended,

  // TIER 1: Frontend Environment (Strict)
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    // ... strict browser configuration
  },

  // TIER 2: Backend Environment (Pragmatic)
  {
    files: ['apps/convex/**/*.ts'],
    // ... pragmatic Convex configuration
  },

  // TIER 3: Generated Code (Minimal)
  {
    files: ['**/_generated/**/*', '**/convex/_generated/**/*'],
    // ... minimal rules for generated code
  },

  // Additional configs for tests, config files, etc.
];
```

### Key Configuration Features

1. **Environment-Specific Globals**: Each tier only includes globals available in that runtime
2. **Rule Severity Levels**: Frontend uses `error`, backend uses `warn` for flexibility
3. **File Pattern Matching**: Precise file patterns prevent configuration bleeding
4. **Complete Separation**: No shared global configuration that causes conflicts

## Testing and Validation

### Validation Commands

```bash
# Test frontend strict rules (should error on process.env)
npx eslint apps/web/lib/config.ts

# Test backend pragmatic rules (should warn on any types)
npx eslint apps/convex/agentActions.ts

# Test generated code (should pass with minimal linting)
npx eslint apps/convex/_generated/api.ts
```

### Expected Results

- **Frontend**: Errors for `process.env` usage and undefined `process` global
- **Backend**: Warnings for `any` types, but no environment mismatches
- **Generated**: Clean pass with minimal rule enforcement

## Integration with Development Workflow

### Pre-commit Hooks

The configuration works seamlessly with existing Husky pre-commit hooks:

```bash
git add . && git commit -m "changes"
# Husky runs lint-staged with new configuration
# No more environment mismatch errors
```

### CI/CD Pipeline

Verified to pass CI/CD pipeline with:

- TypeScript compilation ✅
- ESLint validation ✅
- Unit tests ✅
- Production build ✅

### Development Commands

All existing commands work unchanged:

- `bun run lint` - Turbo lint across all packages
- `bun run typecheck` - TypeScript validation
- `bun run build` - Production build with linting

## Benefits Achieved

### 1. No More Environment Mismatches

- Frontend code no longer sees Convex globals
- Backend code no longer restricted by browser-only rules
- Generated code skips unnecessary linting

### 2. Developer Experience Improvements

- Clear, actionable error messages
- Environment-appropriate rule enforcement
- No more "whack-a-mole" debugging

### 3. Maintainability

- Each tier has clear responsibility boundaries
- Easy to modify rules for specific environments
- Simple to add new file patterns or environments

### 4. CI/CD Reliability

- Consistent behavior across local and CI environments
- No more surprising lint failures in CI
- Reliable pre-commit hook execution

## Troubleshooting

### Common Issues

**Issue**: New file type shows environment mismatch errors
**Solution**: Add appropriate file pattern to correct tier

**Issue**: Frontend needs Node.js global temporarily  
**Solution**: Add specific override for that file pattern

**Issue**: Generated code shows linting errors
**Solution**: Verify file matches `**/_generated/**/*` pattern

### Verification Commands

```bash
# Verify configuration working
bun run lint                    # Should pass with warnings only
npx eslint . --max-warnings=0   # Shows all issues clearly

# Test specific environments
npx eslint apps/web/components/  # Frontend rules
npx eslint apps/convex/          # Backend rules
```

## Future Considerations

### Adding New Environments

To add a new environment (e.g., Edge functions):

1. Create new tier configuration
2. Define appropriate globals for runtime
3. Set rule severity levels for use case
4. Add file patterns to match new environment

### Rule Adjustments

- **Frontend rules** can be made stricter as code quality improves
- **Backend rules** can remain pragmatic for integration flexibility
- **Generated code** should maintain minimal linting

## Related Documentation

- **[Testing Infrastructure Lessons](../testing/technical/testing-infrastructure-lessons-learned.md)** - ESLint + Jest configuration patterns
- **[CI/CD Pipeline Setup](cicd-pipeline-setup.md)** - Integration with automated testing
- **[Development Workflow](../methodology/bmad-methodology.md)** - BMAD process with CI verification

## Conclusion

The three-tier ESLint configuration successfully solves the environment mismatch problem by providing:

- **Appropriate rules** for each runtime environment
- **Clear separation** of concerns between frontend, backend, and generated code
- **Reliable development workflow** with working pre-commit hooks and CI
- **Easy maintenance** with environment-specific configurations

This solution eliminates the "one size fits none" problem and provides a scalable foundation for ESLint configuration in multi-environment TypeScript projects.
