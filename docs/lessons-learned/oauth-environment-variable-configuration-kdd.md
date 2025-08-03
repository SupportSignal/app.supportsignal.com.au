# OAuth Environment Variable Configuration KDD

## Overview

**Date**: August 3, 2025  
**Issue**: GitHub OAuth failing with "redirect_uri is not associated with this application" error  
**Resolution**: Configure production environment variables in Convex deployment (not just defaults)  
**Impact**: OAuth authentication now works correctly in production environment

## Problem Statement

User experiencing OAuth authentication failures in production:

**Symptom**: GitHub OAuth redirect showing localhost callback URL instead of production URL:

```
https://github.com/login/oauth/authorize?client_id=your-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgithub%2Fcallback&scope=user%3Aemail&state=your-state-token
```

**Error Message**: "Be careful! The redirect_uri is not associated with this application."

**Expected Behavior**: OAuth should redirect to production callback URL:

```
https://app.supportsignal.com.au/auth/github/callback
```

## Root Cause Analysis

### Primary Root Cause

**Incorrect Convex Environment Variable Configuration**: The production Convex deployment was using development/localhost values instead of production URLs.

**Technical Details**:

- Auth callback URL is constructed in `apps/convex/auth.ts` using fallback pattern:
  ```javascript
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/github/callback`;
  ```
- The fallback to `localhost:3000` was being used because `NEXT_PUBLIC_APP_URL` was not properly set in production
- Convex production deployment had localhost values in environment variables

### Configuration Confusion

**Convex Dashboard Structure Misunderstanding**:

- User initially set environment variables in "Default Environment Variables" section
- This only affects NEW deployments, not existing production deployment
- Existing `production:helpful-panther-567` deployment retained old localhost values
- Need to configure environment variables on the specific deployment, not defaults

## Diagnostic Process

### Step 1: OAuth URL Analysis

**Method**: Examined the failing OAuth redirect URL
**Finding**: OAuth redirect URL contained `localhost:3000` instead of production domain
**Conclusion**: Environment variable configuration issue in backend

### Step 2: Code Review

**Method**: Searched codebase for OAuth callback URL construction
**Command Used**:

```bash
grep -r "localhost.*callback" --include="*.ts" --include="*.js"
```

**Key Finding**: In `apps/convex/auth.ts`:

```javascript
const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/github/callback`;
```

**Conclusion**: Convex backend needs `NEXT_PUBLIC_APP_URL` environment variable

### Step 3: Environment Variable Investigation

**Method**: Reviewed `.env.source-of-truth.local` for correct production values
**Finding**: Clear distinction between DEV_VALUE and PROD_VALUE:

- DEV: `http://localhost:3000`
- PROD: `https://app.supportsignal.com.au`

### Step 4: Convex Configuration Discovery

**Method**: Checked Convex Dashboard environment variable configuration
**Finding**: Variables were set in "Default Environment Variables" but not on production deployment
**Issue**: Default variables only apply to future deployments, not existing ones

## Solution Implementation

### Fix 1: Identify All Required Production Values

**Source**: Used `.env.source-of-truth.local` to identify all CONVEX-targeted variables needing production values

**Critical Variables Identified**:

```
NEXT_PUBLIC_APP_URL=https://app.supportsignal.com.au
LOG_WORKER_URL=https://log-ingestion-worker.workers.dev
NEXT_PUBLIC_LOG_WORKER_URL=https://log-ingestion-worker.workers.dev
CONVEX_DEPLOYMENT=production:helpful-panther-567
```

### Fix 2: Configure Production Deployment Environment Variables

**Action**: Set environment variables on the specific production deployment in Convex Dashboard

**Location**: Convex Dashboard → production:helpful-panther-567 deployment → Environment Variables

**Full Production Configuration Applied**:

```
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CONVEX_DEPLOYMENT=production:your-deployment-name
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
LLM_FALLBACK_MODEL=openai/gpt-4o-mini
LLM_MODEL=openai/gpt-4o-mini
LOG_WORKER_URL=https://your-worker.workers.dev
NEXT_PUBLIC_APP_URL=https://your-site.pages.dev
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_LOG_WORKER_URL=https://your-worker.workers.dev
OAUTH_SECRET=your-generated-oauth-secret
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
PORT=3000
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
VECTORIZE_DATABASE_ID=your-vectorize-database-id
```

## Files Modified

**No code changes were required** - this was purely a configuration issue.

**Configuration Changes**:

- **Convex Dashboard**: Production deployment environment variables updated
- **No files in repository were modified**

## Key Learnings

### 1. Convex Environment Variable Scope

**Problem**: Misunderstanding between default environment variables and deployment-specific variables
**Solution**: Configure environment variables on specific deployments, not just defaults

**Key Insight**:

- "Default Environment Variables" = applies to future deployments only
- Deployment-specific variables = applies to that specific deployment immediately

### 2. Environment Variable Inheritance Patterns

**Problem**: Assuming Next.js environment variables automatically available in Convex
**Solution**: Explicitly configure all required environment variables in Convex deployment

**Pattern**: Convex backend runs independently and requires separate environment configuration

### 3. Systematic Environment Variable Management

**Problem**: Production deployments using development values
**Solution**: Use `.env.source-of-truth.local` as reference for production configuration

**Best Practice**: Always cross-reference source of truth file when configuring production

### 4. OAuth Callback URL Construction

**Problem**: Dynamic callback URL construction can fail silently with fallback values
**Solution**: Ensure base URL environment variable is properly configured

**Code Pattern Analysis**:

```javascript
// This pattern is vulnerable to configuration issues
const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/github/callback`;

// The fallback hides configuration problems in production
```

## Anti-Patterns Identified

### ❌ Setting Only Default Environment Variables

**Why Bad**: Doesn't affect existing deployments, only future ones
**Better**: Configure variables on specific production deployment

### ❌ Assuming Environment Variable Inheritance

**Why Bad**: Convex backend doesn't inherit Next.js environment variables
**Better**: Explicitly configure all required variables in Convex

### ❌ Not Cross-Referencing Source of Truth

**Why Bad**: Easy to miss required production values
**Better**: Use `.env.source-of-truth.local` as checklist for production setup

### ❌ Ignoring Fallback Values in Code

**Why Bad**: Fallbacks can hide configuration issues in production
**Better**: Monitor and validate environment variables are properly set

## Future Prevention

### 1. Environment Variable Validation

**Add to production setup checklist**:

- Verify all CONVEX-targeted variables from source of truth are configured
- Test OAuth flow in production before considering setup complete
- Document expected vs actual callback URLs

### 2. Improved Documentation

**Update repository setup guides to emphasize**:

- Difference between default and deployment-specific environment variables
- Requirement to configure Convex production deployment separately
- Step-by-step Convex environment variable configuration process

### 3. Monitoring and Alerting

**Consider adding**:

- Production environment variable validation
- OAuth callback URL monitoring
- Automated checks for localhost values in production

## Verification Steps

### Successful Resolution Confirmed

1. **OAuth Flow Test**: GitHub authentication now works correctly
2. **Callback URL Verification**: Redirects to correct production URL
3. **Environment Separation**: Local development still works with dev deployment
4. **Production Functionality**: All OAuth-dependent features operational

### Post-Fix Validation

- ✅ GitHub OAuth authentication successful
- ✅ Callback URL uses production domain
- ✅ Local development unchanged (uses dev deployment)
- ✅ No code changes required
- ✅ All environment variables properly configured

## References

- **Source Configuration**: `.env.source-of-truth.local`
- **OAuth Implementation**: `apps/convex/auth.ts`
- **Convex Dashboard**: https://dashboard.convex.dev/t/david-cruwys/supportsignal/settings
- **Production Deployment**: `production:helpful-panther-567`
- **GitHub OAuth App**: https://github.com/settings/applications/3088589

## Related Documentation

- [Environment Management Guide](../technical-guides/environment-management.md)
- [GitHub OAuth Setup Guide](../technical-guides/github-oauth-setup.md)
- [New Repository Setup Guide](../template-usage/new-repository-setup-guide.md)
- [Convex Deployment Configuration](../technical-guides/convex-deployment-configuration.md)