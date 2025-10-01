# Deployment Operations Guide

**Last Updated**: October 1, 2025
**Version**: 1.0
**Maintainer**: DevOps Team

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
- [Convex Backend Deployment](#convex-backend-deployment)
- [Cloudflare Worker Deployment](#cloudflare-worker-deployment)
- [Environment-Specific Checklists](#environment-specific-checklists)
- [Manual vs Automated Deployment](#manual-vs-automated-deployment)

## Overview

This guide provides comprehensive deployment procedures for the SupportSignal application across all platforms:

- **Cloudflare Pages**: Next.js web application
- **Convex**: Backend functions and real-time features
- **Cloudflare Workers**: Log ingestion worker with Durable Objects

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                         │
│                   (Source of Truth)                          │
└───────────────┬──────────────────┬─────────────────────────┘
                │                  │
                ▼                  ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  GitHub Actions  │  │   Development    │
    │    CI Pipeline   │  │   Environment    │
    └────────┬─────────┘  └──────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│              Multi-Platform Deployment                      │
├────────────────────┬──────────────┬─────────────────────────┤
│  Cloudflare Pages  │    Convex    │  Cloudflare Workers    │
│   (Next.js App)    │  (Backend)   │  (Log Ingestion)       │
└────────────────────┴──────────────┴─────────────────────────┘
```

## Prerequisites

### Required Tools

```bash
# Verify all required tools are installed
node --version    # >= 18.0.0
bun --version     # >= 1.1.0
git --version     # >= 2.0.0

# Cloudflare tools
npx wrangler --version    # Wrangler 4.x
gh --version              # GitHub CLI (for CI monitoring)
```

### Authentication Setup

**1. GitHub Authentication**
```bash
# Configure git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# GitHub CLI authentication
gh auth login
```

**2. Cloudflare Authentication**
```bash
# Login to Cloudflare via Wrangler
cd apps/workers/log-ingestion
npx wrangler login

# Verify authentication
npx wrangler whoami
```

**3. Convex Authentication**
```bash
# Login to Convex
cd apps/convex
npx convex login

# Verify authentication
npx convex whoami
```

### Environment Configuration

**Verify environment file exists:**
```bash
# Check for centralized environment configuration
bun run env:validate

# If missing, set up environment
bun run env:setup
```

## Cloudflare Pages Deployment

### Overview

- **Platform**: Cloudflare Pages
- **Application**: Next.js web app (`apps/web`)
- **Deployment Method**: Automatic via GitHub integration
- **Environments**: Development (preview) and Production (main branch)

### Automatic Deployment (Recommended)

**Production Deployment:**
```bash
# 1. Verify project root
pwd  # Should be at project root

# 2. Run pre-deployment validation
bun run typecheck
bun run lint
bun test

# 3. Commit and push to main branch
git add .
git commit -m "feat: your feature description"
git push origin main

# 4. Monitor CI pipeline
bun run ci:watch

# 5. Verify deployment
# Visit: https://app.supportsignal.com.au
# Check: Health status and functionality
```

**Preview Deployment (Feature Branches):**
```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Implement changes and commit
git add .
git commit -m "feat: implement feature"

# 3. Push to remote
git push origin feature/your-feature

# 4. Cloudflare automatically creates preview deployment
# Preview URL: https://[commit-hash].app-supportsignal.pages.dev
```

### Manual Build Verification

**Test production build locally:**
```bash
# Navigate to web app
cd apps/web

# Build for Cloudflare Pages
bun run build:pages

# Verify build output
ls -la dist/

# Return to project root
cd ../..
```

### Deployment Configuration

**Key Configuration Files:**
- `apps/web/next.config.js` - Next.js configuration
- `apps/web/package.json` - Build scripts
- `.github/workflows/ci.yml` - CI/CD pipeline

**Environment Variables (Cloudflare Dashboard):**
```
NEXT_PUBLIC_CONVEX_URL=https://graceful-shrimp-355.convex.cloud
NEXT_PUBLIC_APP_URL=https://app.supportsignal.com.au
NEXT_PUBLIC_LOG_WORKER_URL=https://log-ingestion-worker.workers.dev
HUSKY=0  # CRITICAL: Disable Husky in CI
```

### Troubleshooting

**Build Failures:**
```bash
# Check CI logs
bun run ci:logs

# Common issues:
# - Missing HUSKY=0 environment variable
# - Image optimization issues (must use unoptimized: true)
# - Missing compatibility flags (nodejs_compat required)
```

**Deployment Not Triggering:**
```bash
# Verify GitHub integration
# 1. Go to Cloudflare Pages dashboard
# 2. Check Git integration status
# 3. Verify branch configuration (main for production)

# Force rebuild via dashboard
# Deployments → Production → Retry deployment
```

## Convex Backend Deployment

### Overview

- **Platform**: Convex Cloud
- **Application**: Backend functions (`apps/convex`)
- **Deployment Method**: Manual via CLI
- **Environments**: Development and Production deployments

### Development Deployment

**Deploy to Development:**
```bash
# 1. Verify project root
pwd

# 2. Navigate to Convex app
cd apps/convex

# 3. Deploy to development
npx convex deploy

# 4. Verify deployment
npx convex logs

# 5. Test functions
npx convex function-spec

# 6. Return to root
cd ../..
```

### Production Deployment

**Deploy to Production:**
```bash
# 1. Ensure you're in Convex directory
cd apps/convex

# 2. CRITICAL: Verify you're deploying to correct environment
npx convex deploy --prod

# 3. Confirm deployment prompt
# Enter 'y' when prompted

# 4. Verify production functions
npx convex function-spec --prod

# 5. Monitor production logs
npx convex logs --prod

# 6. Return to root
cd ../..
```

### Environment Configuration

**Development Configuration:**
```bash
# View development environment variables
bunx convex env list

# Set development environment variable
bunx convex env set VARIABLE_NAME value
```

**Production Configuration:**
```bash
# View production environment variables
bunx convex env list --prod

# Set production environment variable
bunx convex env set --prod VARIABLE_NAME value
```

### Schema Migrations

**Deploy schema changes:**
```bash
# 1. Update schema in apps/convex/schema.ts

# 2. Deploy to development first
cd apps/convex
npx convex deploy

# 3. Verify schema changes
npx convex data [table-name] --limit 5

# 4. If successful, deploy to production
npx convex deploy --prod

# 5. Verify production schema
npx convex data --prod [table-name] --limit 5
```

### Troubleshooting

**Schema Validation Errors:**
```bash
# Issue: Schema changes break existing data
# Solution: Make fields optional for backward compatibility

# Example fix in schema.ts:
defineTable({
  field_name: v.string(),
  // Add optional fields for backward compatibility
  old_field: v.optional(v.string()),
})
```

**Function Not Found Errors:**
```bash
# Issue: Functions not available after deployment
# Cause: Schema validation preventing deployment

# Debug steps:
npx convex logs          # Check deployment logs
npx convex function-spec # Verify functions deployed
```

## Cloudflare Worker Deployment

### Overview

- **Platform**: Cloudflare Workers
- **Worker Name**: `supportsignal-log-ingestion-worker`
- **Application**: Log ingestion with Durable Objects (`apps/workers/log-ingestion`)
- **Deployment Method**: Manual via Wrangler CLI
- **Environments**: Development and Production

### First-Time Setup

**Complete worker setup:**
```bash
# 1. Run interactive setup script
bun run deploy:worker

# This script will:
# - Install Wrangler CLI if needed
# - Authenticate with Cloudflare
# - Install worker dependencies
# - Prompt for required secrets
# - Test build
# - Deploy to development
# - Optional production deployment

# 2. Follow prompts for:
# - Cloudflare authentication
# - Upstash Redis URL
# - Upstash Redis token
# - Health check verification
```

### Development Deployment

**Deploy to Development:**
```bash
# 1. Navigate to worker directory
cd apps/workers/log-ingestion

# 2. Verify build
bun run build

# 3. Deploy to development
bun run deploy
# This runs: wrangler deploy (defaults to development)

# 4. Get worker URL from output
# URL format: https://supportsignal-log-ingestion-worker.[subdomain].workers.dev

# 5. Test deployment
curl https://[worker-url]/health

# 6. Return to root
cd ../../..
```

### Production Deployment

**Deploy to Production:**
```bash
# 1. Navigate to worker directory
cd apps/workers/log-ingestion

# 2. Verify build passes
bun run build
bun run typecheck

# 3. Deploy to production environment
bun run deploy:production
# This runs: wrangler deploy --env production

# 4. Verify production deployment
curl https://[production-worker-url]/health

# 5. Configure production worker URL in dependent systems
# See "Configure Worker URL" section below

# 6. Return to root
cd ../../..
```

### Secret Management

**Required Secrets:**
- `UPSTASH_REDIS_REST_URL` - Redis database REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token

**Set Development Secrets:**
```bash
cd apps/workers/log-ingestion

# Set Redis URL
npx wrangler secret put UPSTASH_REDIS_REST_URL
# Paste value when prompted

# Set Redis token
npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
# Paste value when prompted
```

**Set Production Secrets:**
```bash
cd apps/workers/log-ingestion

# Set production Redis URL
npx wrangler secret put UPSTASH_REDIS_REST_URL --env production

# Set production Redis token
npx wrangler secret put UPSTASH_REDIS_REST_TOKEN --env production
```

**Verify Secrets:**
```bash
# List development secrets
npx wrangler secret list

# List production secrets
npx wrangler secret list --env production
```

### Durable Objects Deployment

**Understanding Durable Objects:**
- Worker uses `RateLimiterDO` for distributed rate limiting
- Durable Objects maintain state across requests
- Migrations defined in `wrangler.toml`

**Deploy with Durable Objects:**
```bash
# Durable Objects deploy automatically with worker
# Migration defined in wrangler.toml:
# [[migrations]]
# tag = "v1"
# new_sqlite_classes = ["RateLimiterDO"]

# No additional steps needed for initial deployment
```

**Verify Durable Objects:**
```bash
# Test rate limiter functionality
curl -X POST https://[worker-url]/log \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "test-trace",
    "level": "info",
    "message": "Test message",
    "system": "browser"
  }'

# Check rate limiter status in health endpoint
curl https://[worker-url]/health | jq '.components.rate_limiter'
```

### Configure Worker URL

**After deployment, configure Worker URL in dependent systems:**

**1. Next.js Web App:**
```bash
# Add to apps/web/.env.local
NEXT_PUBLIC_LOG_WORKER_URL=https://[your-worker-url]

# Or sync from centralized config
bun run sync-env --mode=local
```

**2. Convex Backend:**
```bash
# Set Convex environment variable
cd apps/convex

# Development
bunx convex env set LOG_WORKER_URL https://[dev-worker-url]

# Production
bunx convex env set --prod LOG_WORKER_URL https://[prod-worker-url]
```

### Worker Testing

**Comprehensive worker testing:**
```bash
# 1. Health check
curl https://[worker-url]/health

# 2. Test log ingestion
curl -X POST https://[worker-url]/log \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "test-'$(date +%s)'",
    "level": "info",
    "message": "Deployment test",
    "system": "browser"
  }'

# 3. Retrieve logs
curl "https://[worker-url]/logs?trace_id=test-[timestamp]"

# 4. Check recent traces
curl https://[worker-url]/traces/recent

# 5. Run unit tests (from project root)
bun run test:worker
```

### Troubleshooting

**Authentication Issues:**
```bash
# Re-authenticate with Cloudflare
npx wrangler login

# Verify authentication
npx wrangler whoami
```

**Secret Issues:**
```bash
# Issue: Missing secrets cause deployment to fail
# Solution: Set all required secrets before deployment

npx wrangler secret list
# Verify UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN exist
```

**Durable Objects Errors:**
```bash
# Issue: Durable Objects not accessible
# Solution: Verify migration in wrangler.toml

# Check wrangler.toml contains:
# [[durable_objects.bindings]]
# name = "RATE_LIMIT_STATE"
# class_name = "RateLimiterDO"
```

**Build Failures:**
```bash
# Check TypeScript compilation
bun run typecheck

# Verify build output
bun run build
ls -la dist/
```

## Environment-Specific Checklists

### Development Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing locally (`bun test`)
- [ ] TypeScript compilation successful (`bun run typecheck`)
- [ ] Linting passes (`bun run lint`)
- [ ] Feature branch up to date with main
- [ ] Environment variables synced (`bun run sync-env --mode=local`)

**Deployment:**
- [ ] Convex development deployment (`npx convex deploy`)
- [ ] Worker development deployment (`bun run worker:deploy`)
- [ ] Cloudflare Pages preview deployment (automatic on push)

**Post-Deployment:**
- [ ] Health checks passing for all services
- [ ] Core functionality tested in development
- [ ] No error logs in monitoring
- [ ] Worker endpoints responding correctly

### Production Deployment Checklist

**Pre-Deployment:**
- [ ] All development tests passing
- [ ] CI pipeline successful (`bun run ci:status`)
- [ ] Code review approved
- [ ] Production environment variables verified
- [ ] Rollback plan documented and ready
- [ ] Stakeholders notified of deployment window

**Deployment:**
- [ ] Create deployment branch from main
- [ ] Convex production deployment (`npx convex deploy --prod`)
- [ ] Worker production deployment (`bun run worker:deploy:production`)
- [ ] Cloudflare Pages deployment (push to main)
- [ ] Monitor CI pipeline (`bun run ci:watch`)

**Post-Deployment:**
- [ ] Production health checks passing
- [ ] Core functionality tested in production
- [ ] No critical errors in logs
- [ ] Performance metrics within acceptable ranges
- [ ] Authentication flows working (OAuth, session management)
- [ ] Real-time features operational (Convex subscriptions)
- [ ] Worker log ingestion functional
- [ ] Monitoring and alerting active

**Rollback Readiness:**
- [ ] Previous deployment version documented
- [ ] Rollback procedures accessible
- [ ] Database backup verified (if applicable)
- [ ] Incident response team on standby

## Manual vs Automated Deployment

### Automated Deployments

**Cloudflare Pages (Web App):**
- **Trigger**: Push to main branch (production) or feature branch (preview)
- **Pipeline**: GitHub Actions → Cloudflare Pages
- **Monitoring**: `bun run ci:watch`
- **Rollback**: Via Cloudflare Pages dashboard

**Advantages:**
- Consistent deployment process
- Integrated CI/CD testing
- Automatic preview environments
- Easy rollback mechanism

**When to Use:**
- Regular feature deployments
- Hotfixes to main branch
- Preview environments for testing

### Manual Deployments

**Convex Backend:**
- **Trigger**: `npx convex deploy [--prod]`
- **Control**: Developer-initiated
- **Verification**: Manual testing required

**Cloudflare Workers:**
- **Trigger**: `bun run worker:deploy[:production]`
- **Control**: Developer-initiated with guided script
- **Verification**: Health endpoint checks

**Advantages:**
- Precise deployment timing
- Ability to test before production
- Granular control over deployment steps
- Immediate rollback capability

**When to Use:**
- Backend schema changes
- Worker configuration updates
- Coordinated multi-service deployments
- Emergency hotfixes requiring specific timing

### Coordinated Multi-Platform Deployment

**For changes affecting multiple platforms:**

```bash
# 1. Deploy Convex backend first (has dependencies)
cd apps/convex
npx convex deploy --prod

# 2. Deploy Cloudflare Worker (uses Convex)
cd ../workers/log-ingestion
bun run deploy:production

# 3. Deploy Cloudflare Pages last (uses both)
cd ../../..
git push origin main

# 4. Monitor all deployments
bun run ci:watch  # Pages deployment
npx convex logs --prod  # Convex logs
curl https://[worker-url]/health  # Worker status
```

## Related Documentation

- [Configuration Management Guide](./configuration-management.md) - Environment variable management
- [Deployment Verification Procedures](./deployment-verification.md) - Post-deployment testing
- [Rollback Procedures](./rollback-procedures.md) - Recovery and incident response
- [CI/CD Pipeline Guide](./cicd-pipeline.md) - GitHub Actions and monitoring

## Support and Troubleshooting

**For deployment issues:**
1. Check relevant troubleshooting section in this guide
2. Review [CI/CD Troubleshooting Guide](./cicd-troubleshooting.md)
3. Check service-specific logs
4. Consult [Incident Response Procedures](./incident-response.md)

**Emergency Contacts:**
- DevOps Team: [Contact information]
- On-Call Engineer: [Rotation schedule]
- Cloudflare Support: [Support portal]
- Convex Support: [Support portal]
