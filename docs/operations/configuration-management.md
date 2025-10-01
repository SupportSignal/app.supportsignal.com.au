# Configuration Management Guide

**Last Updated**: October 1, 2025
**Version**: 1.0
**Maintainer**: DevOps Team

## Table of Contents

- [Overview](#overview)
- [Source of Truth System](#source-of-truth-system)
- [sync-env.js Usage](#sync-envjs-usage)
- [Environment Variable Management](#environment-variable-management)
- [Worker-Specific Configuration](#worker-specific-configuration)
- [Configuration Validation](#configuration-validation)
- [Configuration Change Workflow](#configuration-change-workflow)
- [Best Practices](#best-practices)

## Overview

The SupportSignal application uses a **centralized source of truth** system for environment variable management across multiple platforms:

- **Cloudflare Pages** (Next.js web app)
- **Convex Backend** (serverless functions)
- **Cloudflare Workers** (log ingestion)

### Configuration Architecture

```
┌──────────────────────────────────────────────────────┐
│   Source of Truth (Centralized Config)              │
│   ~/.env-configs/app.supportsignal.com.au.env       │
│                                                       │
│   Format: Table with DEV_VALUE and PROD_VALUE       │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   sync-env.js Tool   │
        │  (Multi-mode Sync)   │
        └─────────┬────────────┘
                  │
        ┌─────────┼──────────┐
        │         │          │
        ▼         ▼          ▼
   ┌────────┐ ┌──────┐ ┌──────────┐
   │ Local  │ │Convex│ │Cloudflare│
   │  .env  │ │ Env  │ │  Secrets │
   └────────┘ └──────┘ └──────────┘
```

### Key Principles

1. **Single Source of Truth**: `~/.env-configs/app.supportsignal.com.au.env`
2. **Never Commit Secrets**: Local `.env.local` files are gitignored
3. **Environment Separation**: Development values in local files, production values deployed to cloud
4. **Automated Sync**: Use `sync-env.js` for consistent configuration deployment

## Source of Truth System

### Configuration File Location

```bash
# Centralized configuration file
~/.env-configs/app.supportsignal.com.au.env
```

### Configuration File Format

**Table format with DEV_VALUE and PROD_VALUE columns:**

```
| TARGET               | GROUP                       | KEY                       | DEV_VALUE                 | PROD_VALUE                |
|----------------------|-----------------------------|---------------------------|---------------------------|---------------------------|
| NEXTJS,CONVEX        | Local Development           | NEXT_PUBLIC_APP_URL       | http://localhost:3200     | https://app.supportsignal.com.au |
| CONVEX               | GitHub OAuth                | GITHUB_CLIENT_ID          | Ov23liMO6dymiqZKmiBS      | Ov23liMO6dymiqZKmiBS      |
| NEXTJS               | Convex                      | NEXT_PUBLIC_CONVEX_URL    | http://localhost:3210     | https://graceful-shrimp-355.convex.cloud |
| WORKER               | Cloudflare Worker           | NEXT_PUBLIC_LOG_WORKER_URL| http://localhost:8787     | https://log-worker.workers.dev |
| CONVEX               | Cloudflare                  | CLOUDFLARE_ACCOUNT_ID     | your-account-id           | your-account-id           |
```

### Column Definitions

- **TARGET**: Which platform uses this variable (NEXTJS, CONVEX, WORKER, or comma-separated list)
- **GROUP**: Logical grouping for organization
- **KEY**: Environment variable name
- **DEV_VALUE**: Development environment value (used locally)
- **PROD_VALUE**: Production environment value (deployed to cloud platforms)

### Setup Configuration File

**First-time setup:**

```bash
# Run interactive setup
bun run env:setup

# This will:
# 1. Create ~/.env-configs directory if needed
# 2. Create app.supportsignal.com.au.env from template
# 3. Prompt for required values
# 4. Validate configuration format
```

**Verify configuration exists:**

```bash
# Check if configuration file exists
bun run env:validate

# Output: ✅ Environment file exists
# Or: ❌ Run: bun env:setup
```

## sync-env.js Usage

### Command Overview

```bash
# Generate local .env files (always uses DEV_VALUE)
bun run sync-env --mode=local

# Deploy development values to Convex
bun run sync-env --mode=deploy-dev

# Deploy production values to Convex
bun run sync-env --mode=deploy-prod
```

### Sync Modes

#### 1. Local Mode (Development)

**Purpose**: Generate local `.env.local` files for development

```bash
bun run sync-env --mode=local

# What it does:
# - Reads centralized config file
# - Generates apps/web/.env.local (NEXTJS targets, DEV_VALUE)
# - Generates apps/convex/.env.local (CONVEX targets, DEV_VALUE)
# - NEVER uses PROD_VALUE for local files
```

**Generated Files:**
- `apps/web/.env.local` - Next.js environment variables
- `apps/convex/.env.local` - Convex local development variables

#### 2. Deploy-Dev Mode

**Purpose**: Deploy development values to Convex development deployment

```bash
bun run sync-env --mode=deploy-dev

# What it does:
# - Reads CONVEX target variables
# - Uses DEV_VALUE column
# - Deploys to Convex development environment
# - Uses bunx convex env set commands
```

**Verification:**
```bash
# Check deployed development variables
bunx convex env list
```

#### 3. Deploy-Prod Mode

**Purpose**: Deploy production values to Convex production deployment

```bash
bun run sync-env --mode=deploy-prod

# What it does:
# - Reads CONVEX target variables
# - Uses PROD_VALUE column
# - Deploys to Convex production environment
# - Uses bunx convex env set --prod commands
```

**Verification:**
```bash
# Check deployed production variables
bunx convex env list --prod
```

### Options

**Dry Run:**
```bash
# Show what would change without applying
bun run sync-env --mode=local --dry-run
```

**Verbose Output:**
```bash
# Show detailed output
bun run sync-env --mode=deploy-dev --verbose
```

### Usage Patterns

**Daily Development:**
```bash
# Sync local environment files when starting work
bun run sync-env --mode=local
```

**After Configuration Changes:**
```bash
# 1. Update centralized config file
vim ~/.env-configs/app.supportsignal.com.au.env

# 2. Sync to local development
bun run sync-env --mode=local

# 3. Restart dev servers to pick up changes
bun dev
```

**Deploying Configuration to Environments:**
```bash
# Deploy to development first
bun run sync-env --mode=deploy-dev

# Verify in development
bunx convex env list

# Deploy to production
bun run sync-env --mode=deploy-prod

# Verify in production
bunx convex env list --prod
```

## Environment Variable Management

### Platform-Specific Management

#### Next.js (Cloudflare Pages)

**Local Development:**
```bash
# Generated by sync-env.js
# File: apps/web/.env.local
NEXT_PUBLIC_APP_URL=http://localhost:3200
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210
NEXT_PUBLIC_LOG_WORKER_URL=http://localhost:8787
```

**Production (Cloudflare Pages Dashboard):**
```
Navigate to: Cloudflare Dashboard → Pages → app-supportsignal → Settings → Environment Variables

Production Environment:
  NEXT_PUBLIC_APP_URL=https://app.supportsignal.com.au
  NEXT_PUBLIC_CONVEX_URL=https://graceful-shrimp-355.convex.cloud
  NEXT_PUBLIC_LOG_WORKER_URL=https://log-worker.workers.dev
  HUSKY=0  # CRITICAL: Disable Husky in CI

Preview Environment:
  (Same as production for consistency)
```

**Adding New Variables:**
```bash
# 1. Add to centralized config
vim ~/.env-configs/app.supportsignal.com.au.env

# Add line:
# | NEXTJS | New Group | NEW_VARIABLE | dev-value | prod-value |

# 2. Sync to local
bun run sync-env --mode=local

# 3. Add to Cloudflare Pages dashboard manually
# (Cannot be automated - requires dashboard access)
```

#### Convex Backend

**Local Development:**
```bash
# Generated by sync-env.js
# File: apps/convex/.env.local
GITHUB_CLIENT_ID=Ov23liMO6dymiqZKmiBS
GITHUB_CLIENT_SECRET=dev-secret-value
OPENAI_API_KEY=sk-dev-key
```

**Development Deployment:**
```bash
# Deploy via sync-env.js
bun run sync-env --mode=deploy-dev

# Or manually:
bunx convex env set VARIABLE_NAME value
```

**Production Deployment:**
```bash
# Deploy via sync-env.js
bun run sync-env --mode=deploy-prod

# Or manually:
bunx convex env set --prod VARIABLE_NAME value
```

**View Current Variables:**
```bash
# Development
bunx convex env list

# Production
bunx convex env list --prod
```

**Remove Variables:**
```bash
# Development
bunx convex env remove VARIABLE_NAME

# Production
bunx convex env remove --prod VARIABLE_NAME
```

#### Cloudflare Workers

**Worker environment variables are managed differently:**
- Configuration in `wrangler.toml` for non-sensitive values
- Secrets via Wrangler CLI for sensitive values

See [Worker-Specific Configuration](#worker-specific-configuration) section.

### Variable Naming Conventions

**Public Variables (Next.js):**
- **Pattern**: `NEXT_PUBLIC_*`
- **Usage**: Exposed to browser
- **Example**: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CONVEX_URL`

**Server Variables:**
- **Pattern**: No specific prefix
- **Usage**: Server-side only
- **Example**: `GITHUB_CLIENT_SECRET`, `OPENAI_API_KEY`

**Worker Secrets:**
- **Pattern**: Uppercase with underscores
- **Usage**: Cloudflare Worker runtime
- **Example**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Security Best Practices

**1. Never Commit Secrets:**
```bash
# .gitignore should include:
.env
.env.local
.env.*.local
~/.env-configs/
```

**2. Rotate Secrets Regularly:**
```bash
# For each secret:
# 1. Generate new value
# 2. Update centralized config
# 3. Deploy to all environments
# 4. Verify applications work
# 5. Revoke old secret
```

**3. Separate Development and Production:**
```bash
# Use different values for dev and prod
# Development: Non-production API keys, test data
# Production: Production API keys, real data
```

**4. Audit Configuration Access:**
```bash
# Limit who can access:
# - ~/.env-configs/ directory
# - Cloudflare dashboard
# - Convex dashboard
# - GitHub repository secrets
```

## Worker-Specific Configuration

### wrangler.toml Configuration

**File Location**: `apps/workers/log-ingestion/wrangler.toml`

**Structure:**
```toml
name = "supportsignal-log-ingestion-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# Non-sensitive environment variables
[vars]
ENVIRONMENT = "development"

# Development environment
[env.development]
workers_dev = true

[env.development.vars]
ENVIRONMENT = "development"

# Production environment
[env.production]
workers_dev = false

[env.production.vars]
ENVIRONMENT = "production"

# Durable Objects configuration
[[durable_objects.bindings]]
name = "RATE_LIMIT_STATE"
class_name = "RateLimiterDO"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["RateLimiterDO"]
```

### Worker Secrets Management

**Unlike environment variables, Worker secrets are encrypted and managed via CLI:**

**Set Development Secrets:**
```bash
cd apps/workers/log-ingestion

# Set secret (prompted for value)
npx wrangler secret put UPSTASH_REDIS_REST_URL

# Paste value when prompted
```

**Set Production Secrets:**
```bash
cd apps/workers/log-ingestion

# Set production secret
npx wrangler secret put UPSTASH_REDIS_REST_URL --env production

# Paste value when prompted
```

**List Secrets:**
```bash
# Development
npx wrangler secret list

# Production
npx wrangler secret list --env production
```

**Delete Secrets:**
```bash
# Development
npx wrangler secret delete SECRET_NAME

# Production
npx wrangler secret delete SECRET_NAME --env production
```

### Redis Configuration Validation

**Required Secrets:**
- `UPSTASH_REDIS_REST_URL` - Format: `https://[region]-[id].upstash.io`
- `UPSTASH_REDIS_REST_TOKEN` - Alphanumeric token from Upstash dashboard

**Validation:**
```bash
# Test Redis connection via health endpoint
curl https://[worker-url]/health | jq '.components.redis'

# Expected output:
# {
#   "status": "healthy",
#   "url": "configured"
# }
```

### CORS Configuration

**Configured in Worker code (`apps/workers/log-ingestion/src/index.ts`):**

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Origin, User-Agent, Authorization',
  'Content-Type': 'application/json',
};
```

**Production Recommendation**: Restrict `Access-Control-Allow-Origin` to specific domains:
```typescript
// Update for production
'Access-Control-Allow-Origin': 'https://app.supportsignal.com.au',
```

## Configuration Validation

### Pre-Deployment Validation

**Validate Local Configuration:**
```bash
# 1. Verify centralized config exists
bun run env:validate

# 2. Sync to local
bun run sync-env --mode=local

# 3. Verify generated files
test -f apps/web/.env.local && echo "✅ Next.js config exists" || echo "❌ Missing"
test -f apps/convex/.env.local && echo "✅ Convex config exists" || echo "❌ Missing"

# 4. Check for required variables
grep NEXT_PUBLIC_CONVEX_URL apps/web/.env.local
grep GITHUB_CLIENT_ID apps/convex/.env.local
```

**Validate Convex Configuration:**
```bash
# Development
bunx convex env list | grep -E "(GITHUB|OPENAI|CLOUDFLARE)"

# Production
bunx convex env list --prod | grep -E "(GITHUB|OPENAI|CLOUDFLARE)"
```

**Validate Worker Configuration:**
```bash
cd apps/workers/log-ingestion

# Check secrets exist
npx wrangler secret list | grep UPSTASH_REDIS

# Verify wrangler.toml is valid
npx wrangler deploy --dry-run

# Test worker health
curl https://[worker-url]/health
```

### Post-Deployment Validation

**After deploying configuration changes:**

```bash
# 1. Verify Cloudflare Pages environment variables
# Navigate to: Dashboard → Pages → Settings → Environment Variables
# Check: NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_LOG_WORKER_URL

# 2. Verify Convex environment variables
bunx convex env list --prod

# 3. Verify Worker secrets
npx wrangler secret list --env production

# 4. Test application endpoints
curl https://app.supportsignal.com.au/api/health
curl https://[worker-url]/health

# 5. Check application logs for configuration errors
bunx convex logs --prod
npx wrangler tail --env production
```

### Configuration Validation Script

**Create validation script** (`scripts/validate-config.sh`):

```bash
#!/bin/bash
# Configuration validation script

echo "🔍 Validating Configuration..."

# Check centralized config
if [ ! -f ~/.env-configs/app.supportsignal.com.au.env ]; then
    echo "❌ Missing centralized config file"
    exit 1
fi
echo "✅ Centralized config exists"

# Check local files
test -f apps/web/.env.local && echo "✅ Next.js config" || echo "❌ Missing Next.js config"
test -f apps/convex/.env.local && echo "✅ Convex config" || echo "❌ Missing Convex config"

# Validate required variables
echo "🔍 Checking required variables..."
grep -q NEXT_PUBLIC_CONVEX_URL apps/web/.env.local && echo "✅ NEXT_PUBLIC_CONVEX_URL" || echo "❌ Missing NEXT_PUBLIC_CONVEX_URL"
grep -q GITHUB_CLIENT_ID apps/convex/.env.local && echo "✅ GITHUB_CLIENT_ID" || echo "❌ Missing GITHUB_CLIENT_ID"

echo "✅ Configuration validation complete"
```

## Configuration Change Workflow

### Adding New Configuration

**1. Update Centralized Config:**
```bash
# Edit centralized configuration file
vim ~/.env-configs/app.supportsignal.com.au.env

# Add new line with correct TARGET, GROUP, KEY, DEV_VALUE, PROD_VALUE
| NEXTJS,CONVEX | Feature X | FEATURE_X_API_KEY | dev-key-123 | prod-key-456 |
```

**2. Sync to Local Development:**
```bash
# Generate local .env files
bun run sync-env --mode=local

# Restart development servers
bun dev
```

**3. Deploy to Development:**
```bash
# Deploy Convex variables
bun run sync-env --mode=deploy-dev

# Restart Convex dev server
bunx convex dev
```

**4. Deploy to Production:**
```bash
# Deploy Convex variables
bun run sync-env --mode=deploy-prod

# For Next.js (Cloudflare Pages):
# - Add to dashboard manually
# - Redeploy application

# For Workers:
# - Add to wrangler.toml (non-sensitive)
# - Or use wrangler secret put (sensitive)
# - Redeploy worker
```

### Updating Existing Configuration

**1. Update Centralized Config:**
```bash
vim ~/.env-configs/app.supportsignal.com.au.env
# Update DEV_VALUE and/or PROD_VALUE
```

**2. Sync Changes:**
```bash
# Local
bun run sync-env --mode=local

# Development cloud
bun run sync-env --mode=deploy-dev

# Production cloud
bun run sync-env --mode=deploy-prod
```

**3. Restart Services:**
```bash
# Restart development servers to pick up changes
# Cloudflare Pages redeploys automatically
# Convex picks up changes immediately
# Workers require redeployment
```

### Removing Configuration

**1. Remove from Centralized Config:**
```bash
vim ~/.env-configs/app.supportsignal.com.au.env
# Delete or comment out the line
```

**2. Clean Up Local Files:**
```bash
# Regenerate local files
bun run sync-env --mode=local
```

**3. Remove from Cloud Platforms:**
```bash
# Convex
bunx convex env remove VARIABLE_NAME
bunx convex env remove --prod VARIABLE_NAME

# Cloudflare Pages
# Remove via dashboard

# Workers
npx wrangler secret delete SECRET_NAME
npx wrangler secret delete --env production SECRET_NAME
```

## Best Practices

### 1. Always Use Centralized Config

**❌ Don't:**
```bash
# Don't edit .env.local files directly
vim apps/web/.env.local  # Changes will be overwritten
```

**✅ Do:**
```bash
# Edit centralized config
vim ~/.env-configs/app.supportsignal.com.au.env
# Then sync
bun run sync-env --mode=local
```

### 2. Test Configuration Changes in Development First

```bash
# 1. Update centralized config
# 2. Sync to local
bun run sync-env --mode=local

# 3. Test locally
bun dev

# 4. Deploy to dev
bun run sync-env --mode=deploy-dev

# 5. Only deploy to prod after verifying
bun run sync-env --mode=deploy-prod
```

### 3. Document Configuration Changes

**In pull requests, document:**
- What configuration was added/changed
- Why the change was needed
- Which environments are affected
- How to test the change

### 4. Use Dry Run for Verification

```bash
# Before deploying, verify what will change
bun run sync-env --mode=deploy-prod --dry-run
```

### 5. Backup Configuration

```bash
# Backup centralized config before major changes
cp ~/.env-configs/app.supportsignal.com.au.env \
   ~/.env-configs/app.supportsignal.com.au.env.backup.$(date +%Y%m%d)
```

### 6. Regular Configuration Audits

**Monthly checklist:**
- [ ] Review all environment variables for unused entries
- [ ] Verify all secrets are still valid
- [ ] Check for configuration drift between environments
- [ ] Rotate sensitive credentials
- [ ] Update documentation

## Related Documentation

- [Deployment Guide](./deployment-guide.md) - Deployment procedures
- [Deployment Verification](./deployment-verification.md) - Post-deployment testing
- [Configuration Drift Detection](./configuration-drift-detection.md) - Monitoring and prevention

## Support

**For configuration issues:**
- Check this guide's troubleshooting section
- Review [Common Configuration Issues](./common-config-issues.md)
- Contact DevOps team
