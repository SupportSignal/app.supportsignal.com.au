# Deployment Anti-Patterns

## Overview

This document captures anti-patterns identified during Cloudflare Pages deployment (Story 1.3) and other deployment experiences. These patterns should be avoided to prevent deployment failures and configuration issues.

## Critical Anti-Patterns

### Assuming HTTP Actions Deploy Successfully Without Verification

**Anti-Pattern**: Deploying Convex HTTP Actions and assuming they're accessible without testing

**Example of What NOT to Do**:

```typescript
// ❌ DON'T: Deploy HTTP Action and assume it works
export const ingestLogs = httpAction(async (ctx, request) => {
  // Implementation here
});

// Deploy with: npx convex dev --once
// ❌ Then immediately try to use: curl https://deployment.convex.cloud/ingestLogs
```

**Why This is Wrong**:

- HTTP Actions can silently fail to deploy while other functions work correctly
- TypeScript compilation errors can prevent HTTP Action registration
- Function appears in codebase but doesn't exist in runtime environment
- Leads to 404 errors and wasted debugging time

**Correct Approach**:

```bash
# ✅ DO: Always verify HTTP Action deployment
npx convex dev --once
curl -X POST https://deployment.convex.cloud/module/function \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Or check Convex dashboard function list
# Or use regular Actions with ConvexHttpClient for more reliability
```

**Detection Signs**:
- Function shows in code but not in Convex dashboard
- HTTP endpoints return 404 despite successful deployment
- TypeScript compilation warnings or errors
- Other functions deploy but HTTP Actions don't appear

### Using String-Based Function References with ConvexHttpClient

**Anti-Pattern**: Using string identifiers instead of generated API references

**Example of What NOT to Do**:

```typescript
// ❌ DON'T: Use string-based function references
const client = new ConvexHttpClient(url);
await client.action('loggingAction:processLogs', payload);
```

**Why This is Wrong**:

- Causes TypeScript compilation errors
- Loses type safety and autocomplete
- Runtime errors if function names change
- No validation of argument types

**Correct Approach**:

```typescript
// ✅ DO: Use generated API references
import { api } from '../../convex/_generated/api';
const client = new ConvexHttpClient(url);
await client.action(api.loggingAction.processLogs, payload);
```

### Using wrangler.toml for Cloudflare Pages Projects

**Anti-Pattern**: Creating and using `wrangler.toml` configuration for Cloudflare Pages deployments

**Example of What NOT to Do**:

```toml
# ❌ DON'T: This conflicts with Cloudflare Pages configuration
name = "my-app"
compatibility_date = "2024-11-04"
pages_build_output_dir = ".vercel/output/static"
compatibility_flags = ["nodejs_compat"]
```

**Why This is Wrong**:

- wrangler.toml is designed for Cloudflare Workers, not Pages
- Creates configuration conflicts with Cloudflare Pages automatic settings
- Overrides dashboard configuration in unexpected ways
- Causes deployment failures and confusing error messages

**Correct Approach**:

- Configure everything through Cloudflare Pages dashboard
- Use environment variables for dynamic configuration
- Keep wrangler.toml only for Workers projects

**Impact**: Configuration conflicts, deployment failures, debugging confusion

### Running Development Scripts in CI Environment

**Anti-Pattern**: Allowing development-only scripts to execute in CI/CD pipelines

**Example of What NOT to Do**:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

**Why This is Wrong**:

- Husky tries to install git hooks in read-only CI environment
- Development tools assume interactive environment
- Causes CI build failures
- Wastes CI resources and time

**Correct Approach**:

```json
{
  "scripts": {
    "prepare": "echo 'Skipping husky in CI' && exit 0"
  }
}
```

**Alternative Solutions**:

- Use environment variables: `HUSKY=0`
- Conditional execution: `if [ "$CI" != "true" ]; then husky install; fi`

**Impact**: CI build failures, blocked deployments, wasted development time

### Ignoring Node.js Compatibility Requirements

**Anti-Pattern**: Not enabling required compatibility flags for Node.js runtime features

**Example of What NOT to Do**:

- Deploying Next.js app without `nodejs_compat` flag
- Assuming Cloudflare Workers includes all Node.js features
- Ignoring runtime compatibility errors

**Why This is Wrong**:

- Cloudflare Workers runtime is not identical to Node.js
- Missing compatibility flags cause runtime errors
- App fails in production despite working locally

**Correct Approach**:

- Always enable `nodejs_compat` for Next.js applications
- Test compatibility flags in preview environment
- Monitor runtime errors and adjust flags as needed

**Impact**: Runtime failures, user-facing errors, application crashes

### Using Incorrect Output Directories

**Anti-Pattern**: Using wrong build output directories for Cloudflare Pages

**Example of What NOT to Do**:

```
Output Directory: dist
Output Directory: .next
Output Directory: build
```

**Why This is Wrong**:

- @cloudflare/next-on-pages creates specific output structure
- Wrong directory contains incorrect or missing files
- Deployment succeeds but app doesn't work correctly

**Correct Approach**:

- Always use `.vercel/output/static` for @cloudflare/next-on-pages
- Verify build process creates expected directory structure
- Test local build output before deployment

**Impact**: Broken deployments, missing assets, non-functional applications

### Mixed Deployment Strategy Configuration

**Anti-Pattern**: Attempting to use both manual and auto-deployment simultaneously

**Example of What NOT to Do**:

- Configuring Git integration AND using manual Wrangler deployments
- Having conflicting deployment configurations
- Using different build processes for different deployment methods

**Why This is Wrong**:

- Creates confusion about which deployment is active
- Can lead to inconsistent application state
- Makes rollback and debugging difficult

**Correct Approach**:

- Choose primary deployment method (recommend auto-deployment)
- Use manual deployment only for testing and development
- Keep deployment processes consistent

**Impact**: Deployment confusion, inconsistent state, difficult rollbacks

## Configuration Anti-Patterns

### Hardcoding Environment-Specific Values

**Anti-Pattern**: Including environment-specific configuration in committed files

**Example of What NOT to Do**:

```javascript
// ❌ DON'T: Hardcoded values in configuration
const nextConfig = {
  env: {
    API_URL: 'https://my-production-api.com',
    ENVIRONMENT: 'production',
  },
};
```

**Why This is Wrong**:

- Prevents environment-specific configuration
- Requires code changes for different environments
- Increases risk of wrong configuration

**Correct Approach**:

```javascript
// ✅ DO: Use environment variables
const nextConfig = {
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    ENVIRONMENT: process.env.NODE_ENV,
  },
};
```

**Impact**: Configuration inflexibility, deployment errors, security risks

### Assuming Default Configurations Work

**Anti-Pattern**: Not explicitly configuring required settings

**Example of What NOT to Do**:

- Assuming default Next.js configuration works with Cloudflare Pages
- Not setting required flags like `output: 'export'`
- Skipping image optimization configuration

**Why This is Wrong**:

- Default configurations often don't match deployment requirements
- Leads to runtime errors and broken functionality
- Wastes time debugging implicit assumptions

**Correct Approach**:

- Explicitly configure all required settings
- Document configuration decisions and rationale
- Test configuration in environment similar to production

**Impact**: Runtime errors, broken functionality, debugging overhead

### Copying Configuration Without Understanding

**Anti-Pattern**: Copy-pasting configuration from other projects without adaptation

**Example of What NOT to Do**:

- Using Vercel-specific configuration for Cloudflare Pages
- Copying Workers configuration for Pages projects
- Using outdated configuration examples

**Why This is Wrong**:

- Different platforms have different requirements
- Configuration may be outdated or incorrect
- Leads to subtle bugs and incompatibilities

**Correct Approach**:

- Understand configuration requirements for specific platform
- Adapt configuration to current project needs
- Validate configuration works with current versions

**Impact**: Subtle bugs, performance issues, compatibility problems

## Build Process Anti-Patterns

### Skipping Build Process Steps

**Anti-Pattern**: Not running complete build process before deployment

**Example of What NOT to Do**:

```bash
# ❌ DON'T: Skip necessary build steps
next build
# Missing: npx @cloudflare/next-on-pages
```

**Why This is Wrong**:

- Incomplete build process produces incorrect output
- Missing platform-specific optimizations
- Deployment appears successful but app doesn't work

**Correct Approach**:

```bash
# ✅ DO: Complete build process
next build
npx @cloudflare/next-on-pages
```

**Impact**: Broken deployments, missing functionality, wasted debugging time

### Ignoring Build Warnings and Errors

**Anti-Pattern**: Deploying despite build warnings or non-fatal errors

**Example of What NOT to Do**:

- Ignoring TypeScript warnings
- Deploying with ESLint errors
- Skipping test failures

**Why This is Wrong**:

- Warnings often indicate real problems
- Issues compound over time
- Harder to debug problems in production

**Correct Approach**:

- Fix all build warnings before deployment
- Treat warnings as potential errors
- Use strict build configuration

**Impact**: Runtime errors, poor code quality, difficult maintenance

### Not Testing Build Output Locally

**Anti-Pattern**: Deploying without testing build output locally

**Example of What NOT to Do**:

- Running `bun run build` and immediately deploying
- Not testing with `wrangler pages dev`
- Assuming CI build will work if local dev works

**Why This is Wrong**:

- Build output may be different from development version
- Platform-specific issues only appear with proper build
- Wastes deployment cycles and CI resources

**Correct Approach**:

```bash
# ✅ DO: Test build output locally
bun run build:pages
npx wrangler pages dev .vercel/output/static
# Test functionality before deploying
```

**Impact**: Failed deployments, wasted CI resources, slower development cycle

## Environment Management Anti-Patterns

### Not Setting CI Environment Variables

**Anti-Pattern**: Forgetting to configure environment variables for CI environment

**Example of What NOT to Do**:

- Not setting `HUSKY=0` in CI
- Missing platform-specific environment variables
- Not configuring different values for preview vs production

**Why This is Wrong**:

- CI builds fail unexpectedly
- Different behavior between environments
- Security issues with missing or wrong configuration

**Correct Approach**:

- Configure all required environment variables
- Use different values for different environments
- Document required environment variables

**Impact**: CI failures, environment inconsistencies, security vulnerabilities

### Exposing Sensitive Information

**Anti-Pattern**: Including sensitive information in client-side configuration

**Example of What NOT to Do**:

```javascript
// ❌ DON'T: Expose sensitive values
const config = {
  apiKey: 'secret-api-key-12345',
  databaseUrl: 'postgres://user:pass@host/db',
};
```

**Why This is Wrong**:

- Client-side code is visible to users
- Sensitive information can be extracted
- Security vulnerability

**Correct Approach**:

- Use server-side environment variables for sensitive data
- Prefix client variables with `NEXT_PUBLIC_` only when needed
- Use secure credential management

**Impact**: Security vulnerabilities, data breaches, compliance issues

## Troubleshooting Anti-Patterns

### Making Multiple Changes Simultaneously

**Anti-Pattern**: Changing multiple configuration items when troubleshooting

**Example of What NOT to Do**:

- Changing build command, output directory, and environment variables at once
- Updating dependencies while changing configuration
- Modifying multiple files without testing each change

**Why This is Wrong**:

- Impossible to identify which change fixed the issue
- May introduce new problems while fixing others
- Makes it harder to understand root cause

**Correct Approach**:

- Change one thing at a time
- Test each change before making the next
- Document what was changed and why

**Impact**: Unclear fixes, new problems, difficult root cause analysis

### Not Reading Error Messages Carefully

**Anti-Pattern**: Making assumptions about error causes without reading full error messages

**Example of What NOT to Do**:

- Seeing "build failed" and assuming it's a code issue
- Not reading full stack traces
- Jumping to solutions without understanding the problem

**Why This is Wrong**:

- Miss important details in error messages
- Fix wrong problems
- Waste time on incorrect solutions

**Correct Approach**:

- Read complete error messages and logs
- Understand error context and stack traces
- Research specific error messages

**Impact**: Wasted time, incorrect fixes, recurring problems

### Not Documenting Solutions

**Anti-Pattern**: Fixing issues without documenting the solution

**Example of What NOT to Do**:

- Solving deployment issues and moving on
- Not sharing solution with team
- Not updating documentation with new knowledge

**Why This is Wrong**:

- Same issues will recur
- Team doesn't benefit from knowledge
- Wastes time re-solving same problems

**Correct Approach**:

- Document issue and solution
- Update troubleshooting guides
- Share knowledge with team

**Impact**: Repeated problems, knowledge loss, inefficient team

## Prevention Strategies

### Pre-Deployment Checklist

Create and follow checklists to avoid anti-patterns:

- [ ] Environment variables configured correctly
- [ ] Compatibility flags enabled
- [ ] Build process tested locally
- [ ] Configuration reviewed for platform compatibility
- [ ] No hardcoded environment-specific values

### Code Review Focus Areas

Review specifically for deployment anti-patterns:

- Configuration files for platform compatibility
- Environment variable usage
- Build script completeness
- Hardcoded values

### Automated Validation

Implement automated checks:

- CI pipeline validates build process
- Linting rules catch configuration issues
- Tests verify environment compatibility

## Related Documentation

- [Story 1.3 Lessons Learned](../stories/story-1-3-lessons.md)
- [Deployment Troubleshooting Guide](../../technical-guides/cloudflare-pages-deployment-troubleshooting.md)
- [Deployment Patterns](../../patterns/development-workflow-patterns.md#deployment-workflow-patterns)

## Conclusion

These anti-patterns represent real-world problems encountered during deployment implementation. By avoiding these patterns and following the correct approaches, teams can prevent deployment failures, reduce debugging time, and maintain reliable deployment processes.

The key is to understand the specific requirements of your deployment platform and configure explicitly rather than relying on defaults or assumptions.
