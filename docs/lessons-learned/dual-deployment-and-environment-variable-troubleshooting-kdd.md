# Dual Deployment and Environment Variable Troubleshooting KDD

## Overview

**Date**: August 3, 2025  
**Issue**: Dual deployments causing confusion and environment variables showing localhost values in production  
**Resolution**: Disabled Cloudflare Pages auto-deploy and corrected GitHub repository secrets  
**Impact**: Single, clean deployment process with correct production environment variables

## Problem Statement

User experiencing two simultaneous deployment issues:

1. **Dual Deployment Problem**: Every git push triggered two deployments:
   - First deployment: Cloudflare Pages direct Git integration (failed with npm/workspace errors)
   - Second deployment: GitHub Actions CI/CD pipeline (succeeded)

2. **Environment Variable Problem**: Production site showing localhost values instead of production URLs:
   - `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` instead of `https://app.supportsignal.com.au`
   - `NEXT_PUBLIC_LOG_WORKER_URL`: `http://localhost:8787` instead of production worker URL

## Root Cause Analysis

### Dual Deployment Root Cause

**Configuration Conflict**: Both deployment methods were active simultaneously:

- Cloudflare Pages **"Enable automatic production branch deployments"** was enabled
- GitHub Actions workflow with "Deploy to Cloudflare Pages" step was also configured

**Why Both Existed**:

- User had properly configured GitHub Actions deployment
- Cloudflare Pages Git integration was never disabled
- Both systems attempted to deploy the same commits

### Environment Variable Root Cause

**Incorrect GitHub Secrets Configuration**:

- GitHub repository secrets existed but contained localhost values
- Debug logging revealed secrets had exactly 21 characters (`http://localhost:3000` length)
- The secrets were properly configured and injected, but had wrong values

**What Was NOT the Issue**:

- ❌ Missing GitHub secrets (all existed)
- ❌ CI configuration problems (env vars were properly injected)
- ❌ Next.js configuration issues (build process worked correctly)
- ❌ Local `.env` files leaking to CI (files were properly ignored)

## Diagnostic Process

### Step 1: Dual Deployment Investigation

**Initial Symptom**: User reported seeing two deployments per commit:

```
1st: "No deployment available" (immediate failure)
2nd: Successful deployment after ~2 minutes
```

**Hypothesis**: Conflicting deployment systems

**Investigation Method**:

- Analyzed deployment timing patterns
- Examined Cloudflare Pages dashboard settings
- Reviewed GitHub Actions workflow configuration

### Step 2: Environment Variable Investigation

**Initial Approach**: Suspected various causes:

- Local `.env` files overriding production
- Missing GitHub secrets
- Next.js configuration issues

**Breakthrough Method**: Added comprehensive debug logging to GitHub Actions:

```yaml
- name: Debug Environment Variables
  run: |
    echo "=== Checking if GitHub Secrets are configured ==="
    [ -n "${{ secrets.NEXT_PUBLIC_APP_URL }}" ] && echo "✅ NEXT_PUBLIC_APP_URL secret exists" || echo "❌ NEXT_PUBLIC_APP_URL secret missing"

    echo "=== Environment Variables (length check) ==="
    [ -n "$NEXT_PUBLIC_APP_URL" ] && echo "✅ NEXT_PUBLIC_APP_URL env var set (length: ${#NEXT_PUBLIC_APP_URL})" || echo "❌ NEXT_PUBLIC_APP_URL env var empty"
```

**Key Insight**: String length analysis revealed the issue:

- `NEXT_PUBLIC_APP_URL`: 21 characters = `http://localhost:3000` (exact match)
- Production URL would be 40+ characters

## Solution Implementation

### Fix 1: Disable Dual Deployments

**Action**: Disabled Cloudflare Pages automatic Git integration
**Location**: Cloudflare Pages Dashboard → Settings → Build → Branch control
**Setting**: Turned OFF "Enable automatic production branch deployments"

**Result**: Single deployment per commit via GitHub Actions only

### Fix 2: Correct GitHub Repository Secrets

**Action**: Updated GitHub repository secrets with production values
**Location**: GitHub Repository → Settings → Security → Secrets and variables → Actions

**Changes**:

- `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` → `https://app.supportsignal.com.au`
- `NEXT_PUBLIC_LOG_WORKER_URL`: `http://localhost:8787` → production worker URL

## Files Modified

### 1. `.github/workflows/ci.yml`

**Purpose**: Added debug logging for environment variable troubleshooting

**Changes Made**:

```yaml
# Added debug step to check secrets and environment variables
- name: Debug Environment Variables
  run: |
    echo "=== Checking if GitHub Secrets are configured ==="
    [ -n "${{ secrets.NEXT_PUBLIC_APP_URL }}" ] && echo "✅ NEXT_PUBLIC_APP_URL secret exists" || echo "❌ NEXT_PUBLIC_APP_URL secret missing"
    [ -n "${{ secrets.NEXT_PUBLIC_CONVEX_URL }}" ] && echo "✅ NEXT_PUBLIC_CONVEX_URL secret exists" || echo "❌ NEXT_PUBLIC_CONVEX_URL secret missing"
    [ -n "${{ secrets.NEXT_PUBLIC_LOG_WORKER_URL }}" ] && echo "✅ NEXT_PUBLIC_LOG_WORKER_URL secret exists" || echo "❌ NEXT_PUBLIC_LOG_WORKER_URL secret missing"
    echo ""
    echo "=== Environment Variables (length check) ==="
    [ -n "$NEXT_PUBLIC_APP_URL" ] && echo "✅ NEXT_PUBLIC_APP_URL env var set (length: ${#NEXT_PUBLIC_APP_URL})" || echo "❌ NEXT_PUBLIC_APP_URL env var empty"
    [ -n "$NEXT_PUBLIC_CONVEX_URL" ] && echo "✅ NEXT_PUBLIC_CONVEX_URL env var set (length: ${#NEXT_PUBLIC_CONVEX_URL})" || echo "❌ NEXT_PUBLIC_CONVEX_URL env var empty"
    [ -n "$NEXT_PUBLIC_LOG_WORKER_URL" ] && echo "✅ NEXT_PUBLIC_LOG_WORKER_URL env var set (length: ${#NEXT_PUBLIC_LOG_WORKER_URL})" || echo "❌ NEXT_PUBLIC_LOG_WORKER_URL env var empty"
    echo ""
    echo "=== All NEXT_PUBLIC env vars ==="
    env | grep NEXT_PUBLIC || echo "No NEXT_PUBLIC vars found"
```

**Lessons**: Debug logging that works around GitHub's secret masking is crucial for environment variable troubleshooting

### 2. `apps/web/next.config.js`

**Purpose**: Attempted fix that was actually unnecessary (but harmless)

**Changes Made**:

```javascript
env: {
  CLAUDE_LOGGING_ENABLED: String(
    process.env.NODE_ENV === 'development' &&
      process.env.CLAUDE_LOGGING !== 'false'
  ),
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_LOG_WORKER_URL: process.env.NEXT_PUBLIC_LOG_WORKER_URL,
},
```

**Lesson**: This change was not needed for the fix, but doesn't hurt. Next.js automatically includes `NEXT_PUBLIC_*` variables in static builds.

## Key Learnings

### 1. Debug Environment Variables Systematically

**Problem**: Environment variable issues are hard to diagnose due to secret masking
**Solution**: Use length checks and existence checks to debug without revealing values

**Debug Pattern**:

```bash
# Check if secret exists (works around masking)
[ -n "${{ secrets.SECRET_NAME }}" ] && echo "✅ exists" || echo "❌ missing"

# Check environment variable length (reveals info without exposing value)
echo "Length: ${#VARIABLE_NAME}"

# Check all variables with prefix
env | grep PREFIX || echo "No variables found"
```

### 2. Disable Competing Deployment Systems

**Problem**: Multiple deployment systems create confusion and mask real issues
**Solution**: Choose one deployment method and disable others

**Best Practice**:

- Use GitHub Actions for complex CI/CD with testing
- Disable Cloudflare Pages direct Git integration
- GitHub Actions provides better control and debugging

### 3. Environment Variable Management Strategy

**Problem**: GitHub secrets are easy to misconfigure with wrong values
**Solution**: Implement verification in CI pipeline

**Verification Strategy**:

- Add debug logging to CI that checks variable lengths/patterns
- Use the debug-env page pattern for production verification
- Document expected values and their character lengths

### 4. Systematic Issue Isolation

**Problem**: Multiple simultaneous issues can mask root causes
**Solution**: Fix one issue at a time and verify each fix

**Process Used**:

1. Fix dual deployment issue first (isolate deployment noise)
2. Then debug environment variables with clean single deployment
3. Verify each fix independently

## Anti-Patterns Identified

### ❌ Troubleshooting Multiple Issues Simultaneously

**Why Bad**: Creates confusion and masks root causes
**Better**: Fix one thing at a time, verify each fix

### ❌ Assuming Local .env Files Cause CI Issues

**Why Bad**: Wastes time when files are properly ignored
**Better**: Check if files are actually committed/affecting CI

### ❌ Modifying Next.js Config for Environment Variable Issues

**Why Bad**: Next.js handles `NEXT_PUBLIC_*` variables automatically
**Better**: Focus on source of environment variables (secrets configuration)

### ❌ Living with Dual Deployments

**Why Bad**: Creates noise that hides real deployment issues
**Better**: Choose one deployment method and disable competing systems

## Future Prevention

### 1. Environment Variable Validation

Add to CI pipeline:

```yaml
- name: Validate Environment Variables
  run: |
    # Check for localhost values in production
    if [[ "$NEXT_PUBLIC_APP_URL" == *"localhost"* ]]; then
      echo "❌ Production URL contains localhost"
      exit 1
    fi
```

### 2. Deployment Method Documentation

Document which deployment method is active and why:

- Primary: GitHub Actions (testing integration, better control)
- Disabled: Cloudflare Pages auto-deploy (competing system)

### 3. Debug Tooling

Keep debug logging in CI for future troubleshooting:

- Can be enabled/disabled with environment variable
- Provides systematic approach to environment variable issues

## References

- **GitHub Actions Workflow**: `.github/workflows/ci.yml`
- **Next.js Configuration**: `apps/web/next.config.js`
- **Debug Environment Page**: `apps/web/app/debug-env/page.tsx`
- **Cloudflare Pages Dashboard**: Build settings and branch control
- **GitHub Repository Secrets**: Security → Secrets and variables → Actions

## Related Documentation

- [Cloudflare Pages Deployment Troubleshooting](../technical-guides/cloudflare-pages-deployment-troubleshooting.md)
- [Environment Management Guide](../technical-guides/environment-management.md)
- [CI/CD Pipeline Setup](../examples/cicd-deployment/cloudflare-pages-github-actions.md)