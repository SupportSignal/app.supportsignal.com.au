# Cloudflare Pages Deployment Troubleshooting Guide

## Overview

This guide provides systematic troubleshooting approaches for Cloudflare Pages deployment issues, based on real-world challenges encountered during Story 1.3 implementation.

## Quick Reference: Common Issues

| Issue                         | Symptom                                | Solution                                  |
| ----------------------------- | -------------------------------------- | ----------------------------------------- |
| Dual Deployments              | Two deployments per commit, one fails  | Disable Cloudflare Pages auto-deploy      |
| Environment Variables Wrong   | Localhost URLs in production           | Check GitHub repository secrets values    |
| Husky CI Failure              | Build fails with git hook errors       | Set `HUSKY=0` environment variable        |
| Runtime Module Errors         | App crashes with Node.js module issues | Enable `nodejs_compat` compatibility flag |
| Build Configuration Conflicts | Deployment fails with config errors    | Remove wrangler.toml, use Pages dashboard |
| Auto-deployment Not Working   | New commits don't trigger deployment   | Check Git integration settings            |
| Build Output Directory Not Found        | "Output directory not found" error     | Verify output directory is `dist`         |

## Systematic Troubleshooting Process

### Step 1: Identify Failure Stage

**Build Stage Failures**

- Check Cloudflare Pages build logs
- Look for CI environment issues
- Verify build command configuration

**Runtime Stage Failures**

- Check browser console for errors
- Verify compatibility flags
- Test local build with `bun run build:pages`

**Configuration Stage Failures**

- Check for conflicting configuration files
- Verify environment variables
- Validate build settings

### Step 2: Isolate the Problem

**Local vs CI Environment**

```bash
# Test local build
bun run build:pages

# Test manual deployment
wrangler pages deploy dist --project-name=your-project
```

**Environment-Specific Issues**

- Check environment variables in Cloudflare dashboard
- Verify compatibility flags are set
- Test with minimal configuration

**Configuration Conflicts**

- Remove or rename wrangler.toml temporarily
- Test with default Cloudflare Pages settings
- Gradually add configuration back

## Detailed Issue Resolution

### Issue: Husky Git Hook Failures in CI

**Symptoms**:

```
Error: Failed to install git hooks
Error: EACCES: permission denied, mkdir '.git/hooks'
Build failed with exit code 1
```

**Root Cause**: Husky prepare script tries to install git hooks in CI environment where git is read-only

**Solutions**:

**Option 1: Environment Variable (Recommended)**

```bash
# In Cloudflare Pages environment variables
HUSKY=0
```

**Option 2: CI-Aware Prepare Script**

```json
{
  "scripts": {
    "prepare": "echo 'Skipping husky in CI' && exit 0"
  }
}
```

**Option 3: Conditional Husky Setup**

```json
{
  "scripts": {
    "prepare": "if [ \"$CI\" != \"true\" ]; then husky install; fi"
  }
}
```

**Verification**:

- Check build logs show "Skipping husky in CI"
- Build should proceed past prepare step
- No git hook installation attempts

### Issue: Node.js Module Compatibility Errors

**Symptoms**:

```
ReferenceError: process is not defined
ReferenceError: Buffer is not defined
Module not found: Can't resolve 'fs'
```

**Root Cause**: Cloudflare Workers runtime doesn't include Node.js globals by default

**Solution**: Enable nodejs_compat Flag

**Configuration Location**: Cloudflare Pages Dashboard → Settings → Functions → Compatibility flags

**Required Settings**:

- Production environment: Add `nodejs_compat`
- Preview environment: Add `nodejs_compat`

**Verification**:

```javascript
// Should work after enabling nodejs_compat
console.log(process.env.NODE_ENV);
const buffer = Buffer.from('hello');
```

### Issue: wrangler.toml Configuration Conflicts

**Symptoms**:

```
Error: Configuration conflict detected
Error: pages_build_output_dir conflicts with Pages settings
Build settings overridden unexpectedly
```

**Root Cause**: wrangler.toml is designed for Cloudflare Workers, not Pages

**Solution**: Remove wrangler.toml Entirely

**Steps**:

1. Delete or rename `wrangler.toml`
2. Configure all settings in Cloudflare Pages dashboard
3. Use environment variables for dynamic configuration

**Configuration Migration**:

```toml
# DON'T: wrangler.toml for Pages
name = "my-app"
pages_build_output_dir = ".vercel/output/static"
```

```bash
# DO: Use Cloudflare Pages dashboard settings
Build command: bun run build && bun run pages:build
Output directory: dist
Root directory: apps/web
```

### Issue: Git Integration Not Working

**Symptoms**:

- New commits don't trigger deployment
- Only manual deployments work
- No deployment notifications

**Root Cause**: Git integration not properly configured

**Solution**: Configure Git Integration

**Steps**:

1. Go to Cloudflare Pages Dashboard → Settings → Builds & deployments
2. Connect to GitHub repository
3. Set production branch to `main`
4. Set preview branches to "All non-production branches"
5. Verify webhook is created in GitHub

**Verification**:

- Push to main branch should trigger deployment
- Feature branches should create preview deployments
- Check GitHub webhook deliveries

### Issue: Build Output Directory Not Found

**Symptoms**:

```
Error: Output directory not found: dist
Error: No files found in build output
Deployment contains no files
```

**Root Cause**: Incorrect output directory configuration

**Solution**: Use Correct Output Directory

**Required Configuration**:

- Output Directory: `dist`
- This is created by `@cloudflare/next-on-pages`

**Build Process Verification**:

```bash
# Check build creates correct output
bun run build
bun run pages:build
ls -la dist/
```

**Common Mistakes**:

- Using `dist` instead of `dist`
- Using `.next` instead of processed output
- Missing `pages:build` step

### Issue: Next.js Configuration Incompatibility

**Symptoms**:

```
Error: Server-side rendering not supported
Error: Dynamic imports not working
Images not loading correctly
```

**Root Cause**: Next.js configuration not optimized for static export

**Solution**: Correct Next.js Configuration

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui'],
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  trailingSlash: true, // Required for static hosting
  images: { unoptimized: true }, // Required for Cloudflare Pages
  output: 'export', // Required for static generation
};
```

**Key Requirements**:

- `output: 'export'` - Enables static site generation
- `images: { unoptimized: true }` - Disables Next.js image optimization
- `trailingSlash: true` - Ensures proper routing

### Issue: Dual Deployments (Two Deployments Per Commit)

**Symptoms**:

```
First deployment: "No deployment available" (immediate)
Second deployment: Successful deployment (2-3 minutes later)
Build logs show npm workspace errors in first deployment
```

**Root Cause**: Both Cloudflare Pages Git integration and GitHub Actions are deploying simultaneously

**Solution**: Disable Cloudflare Pages Auto-Deploy

**Steps**:

1. Go to Cloudflare Pages Dashboard → Settings → Build → Branch control
2. **Turn OFF** "Enable automatic production branch deployments"
3. Keep GitHub Actions deployment only
4. Test with new commit - should see only one deployment

**Why This Happens**:

- GitHub Actions workflow includes "Deploy to Cloudflare Pages" step
- Cloudflare Pages Git integration is also enabled
- Both systems try to deploy the same commit
- Cloudflare direct deploy often fails with npm/workspace issues
- GitHub Actions deploy succeeds with proper bun setup

**Verification**:

- Single deployment entry per commit in Cloudflare Pages dashboard
- No more "No deployment available" entries
- Clean deployment logs via GitHub Actions

### Issue: Environment Variables Show Localhost in Production

**Symptoms**:

```javascript
// Production site shows:
{
  "NEXT_PUBLIC_APP_URL": "http://localhost:3000",
  "NEXT_PUBLIC_LOG_WORKER_URL": "http://localhost:8787",
  "NODE_ENV": "production"
}
```

**Root Cause**: GitHub repository secrets configured with localhost values instead of production URLs

**Solution**: Update GitHub Repository Secrets

**Steps**:

1. Go to GitHub Repository → Settings → Security → Secrets and variables → Actions
2. Update the following Repository secrets:
   - `NEXT_PUBLIC_APP_URL`: Change to `https://your-site.pages.dev`
   - `NEXT_PUBLIC_LOG_WORKER_URL`: Change to `https://your-worker.workers.dev`
3. Trigger new deployment to test

**Debug Process**:

Add debug logging to GitHub Actions workflow to identify the issue:

```yaml
- name: Debug Environment Variables
  run: |
    echo "=== Checking if GitHub Secrets are configured ==="
    [ -n "${{ secrets.NEXT_PUBLIC_APP_URL }}" ] && echo "✅ NEXT_PUBLIC_APP_URL secret exists" || echo "❌ NEXT_PUBLIC_APP_URL secret missing"

    echo "=== Environment Variables (length check) ==="
    [ -n "$NEXT_PUBLIC_APP_URL" ] && echo "✅ NEXT_PUBLIC_APP_URL env var set (length: ${#NEXT_PUBLIC_APP_URL})" || echo "❌ NEXT_PUBLIC_APP_URL env var empty"

    echo "=== All NEXT_PUBLIC env vars ==="
    env | grep NEXT_PUBLIC || echo "No NEXT_PUBLIC vars found"
```

**Length Analysis**:

- `http://localhost:3000` = 21 characters (indicates localhost)
- `https://your-site.pages.dev` = 40+ characters (indicates production)

**Common Misconceptions**:

- ❌ It's NOT missing GitHub secrets (they exist)
- ❌ It's NOT Next.js configuration issues (build works)
- ❌ It's NOT local .env files affecting CI (properly ignored)
- ✅ It IS GitHub secrets having wrong values

**Verification**:

- Debug logs show correct string lengths (40+ characters)
- Production site shows correct URLs
- No localhost references in deployed application

## Debugging Tools and Commands

### Local Build Testing

```bash
# Test complete build process
bun run build && bun run pages:build

# Verify output directory
ls -la dist/

# Test local preview
npx wrangler pages dev dist
```

### Manual Deployment Testing

```bash
# Test manual deployment
wrangler pages deploy dist --project-name=your-project

# Check deployment status
wrangler pages deployment list --project-name=your-project
```

### Log Analysis

**Cloudflare Pages Build Logs**:

1. Go to Cloudflare Pages Dashboard
2. Select your project
3. Click on latest deployment
4. Review build logs section by section

**Key Log Sections**:

- Initialize build environment
- Install dependencies
- Run build command
- Deploy to Pages

### Environment Verification

```bash
# Check environment variables in build
echo $HUSKY
echo $CI
echo $NODE_ENV

# Verify compatibility flags (check in browser console)
console.log(typeof process);
console.log(typeof Buffer);
```

## Prevention Checklist

### Before Deployment

- [ ] Environment variables configured (`HUSKY=0`)
- [ ] Compatibility flags enabled (`nodejs_compat`)
- [ ] No wrangler.toml in root directory
- [ ] Build command includes both steps: `bun run build && bun run pages:build`
- [ ] Output directory set to `dist`
- [ ] Next.js config includes `output: 'export'`

### After Configuration

- [ ] Test local build process
- [ ] Verify manual deployment works
- [ ] Test auto-deployment with test commit
- [ ] Check live site functionality
- [ ] Verify no console errors

### Ongoing Maintenance

- [ ] Monitor build logs for new issues
- [ ] Keep @cloudflare/next-on-pages updated
- [ ] Test deployments after dependency updates
- [ ] Document any new issues and solutions

## Emergency Procedures

### Rollback Deployment

1. Go to Cloudflare Pages Dashboard
2. Select project → Deployments
3. Find last working deployment
4. Click "Rollback to this deployment"
5. Verify rollback completed successfully

### Manual Override

```bash
# Emergency manual deployment
git checkout last-working-commit
bun run build && bun run pages:build
wrangler pages deploy dist --project-name=your-project
```

### Configuration Reset

1. Delete all environment variables
2. Reset compatibility flags
3. Use minimal build configuration
4. Test basic functionality
5. Gradually add configuration back

## Getting Help

### Information to Gather

When seeking help, collect:

- Complete build logs from Cloudflare Pages
- Local build output/errors
- Current configuration settings
- Recent changes that might have caused issues

### Useful Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [@cloudflare/next-on-pages GitHub](https://github.com/cloudflare/next-on-pages)
- [Next.js Static Export Docs](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- Story 1.3 implementation in this repository

## Related Documentation

- [Dual Deployment and Environment Variable Troubleshooting KDD](../lessons-learned/dual-deployment-and-environment-variable-troubleshooting-kdd.md)
- [Deployment Patterns](../patterns/development-workflow-patterns.md#deployment-workflow-patterns)
- [Story 1.3 Lessons Learned](../lessons-learned/stories/story-1-3-lessons.md)
- [CLAUDE.md Deployment Section](../../CLAUDE.md#deployment)
