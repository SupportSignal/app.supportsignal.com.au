# Rollback Procedures

**Last Updated**: October 1, 2025
**Version**: 1.0
**Maintainer**: DevOps Team

## Table of Contents

- [Overview](#overview)
- [Cloudflare Pages Rollback](#cloudflare-pages-rollback)
- [Convex Deployment Rollback](#convex-deployment-rollback)
- [Cloudflare Worker Rollback](#cloudflare-worker-rollback)
- [Configuration Rollback](#configuration-rollback)
- [Incident Response Procedures](#incident-response-procedures)
- [Testing Rollback Procedures](#testing-rollback-procedures)

## Overview

This guide provides step-by-step rollback procedures for recovering from failed deployments or configuration changes across all platforms.

### When to Roll Back

**Immediate Rollback Indicators:**
- Critical functionality broken in production
- Data corruption or loss detected
- Security vulnerability introduced
- Performance degradation >50%
- User-facing errors affecting >10% of users

**Evaluation First:**
- Minor UI issues
- Non-critical feature bugs
- Performance degradation <20%
- Issues affecting single user segment

### Rollback Decision Matrix

```
┌────────────────────────────────────────────────────┐
│             Severity Assessment                     │
├──────────────┬─────────────────────────────────────┤
│   Critical   │  Immediate Rollback Required        │
│    (P0)      │  • Data loss/corruption             │
│              │  • Security breach                  │
│              │  • Complete service outage          │
├──────────────┼─────────────────────────────────────┤
│     High     │  Rollback Within 15 Minutes         │
│    (P1)      │  • Core feature broken              │
│              │  • Authentication issues            │
│              │  • Significant performance drop     │
├──────────────┼─────────────────────────────────────┤
│    Medium    │  Evaluate - May Forward Fix         │
│    (P2)      │  • Secondary feature issues         │
│              │  • UI glitches                      │
│              │  • Minor performance issues         │
├──────────────┼─────────────────────────────────────┤
│     Low      │  Forward Fix - No Rollback          │
│    (P3)      │  • Cosmetic issues                  │
│              │  • Edge case bugs                   │
│              │  • Documentation errors             │
└──────────────┴─────────────────────────────────────┘
```

## Cloudflare Pages Rollback

### Overview

- **Platform**: Cloudflare Pages (Next.js web app)
- **Rollback Method**: Re-deploy previous version via dashboard
- **Time to Rollback**: 2-5 minutes
- **Data Impact**: None (stateless application)

### Procedure

**1. Identify Previous Working Deployment:**

```bash
# View recent deployments
# Go to: Cloudflare Dashboard → Pages → app-supportsignal → Deployments

# Or via GitHub:
git log --oneline -10
# Identify last known good commit
```

**2. Rollback via Cloudflare Dashboard (Recommended):**

```
1. Navigate to Cloudflare Dashboard
2. Go to Pages → app-supportsignal
3. Click "Deployments" tab
4. Find last successful deployment (marked with green checkmark)
5. Click "..." menu on that deployment
6. Select "Rollback to this deployment"
7. Confirm rollback

Expected time: 2-3 minutes
```

**3. Alternative: Rollback via Git Revert:**

```bash
# 1. Identify problematic commit
git log --oneline -10

# 2. Revert the commit
git revert [commit-hash]

# 3. Push revert
git push origin main

# 4. Cloudflare automatically deploys the revert
# Monitor: bun run ci:watch

Expected time: 3-5 minutes (includes CI pipeline)
```

**4. Verification:**

```bash
# Verify homepage accessible
curl -I https://app.supportsignal.com.au

# Run health check
./scripts/health-check.sh production

# Test critical paths
# - User login
# - Dashboard access
# - Core features
```

### Post-Rollback Actions

- [ ] Notify team of rollback
- [ ] Document issue that caused rollback
- [ ] Create incident report
- [ ] Plan forward fix
- [ ] Schedule deployment retry

## Convex Deployment Rollback

### Overview

- **Platform**: Convex backend
- **Rollback Method**: Re-deploy previous functions
- **Time to Rollback**: 1-2 minutes
- **Data Impact**: Potentially significant (see schema rollback section)

### Function Rollback Procedure

**1. Identify Last Working Version:**

```bash
# Check Convex deployment history
cd apps/convex
bunx convex logs --prod | head -50

# Or check git history
git log --oneline -- apps/convex/
```

**2. Rollback via Git Revert:**

```bash
# 1. Checkout previous version
git checkout [last-good-commit-hash] apps/convex/

# 2. Deploy previous version
cd apps/convex
bunx convex deploy --prod

# 3. Verify deployment
bunx convex function-spec --prod

# 4. Commit the rollback
cd ../..
git add apps/convex/
git commit -m "rollback: revert Convex to [commit-hash]"
git push origin main
```

**3. Alternative: Manual Function Restoration:**

```bash
# If specific functions broken, restore from backup
cd apps/convex

# Copy backup files (if available)
cp backup/[function-file].ts [function-file].ts

# Deploy
bunx convex deploy --prod
```

### Schema Rollback (CRITICAL)

**⚠️ WARNING**: Schema changes with existing data require careful rollback.

**Safe Schema Rollback:**
```typescript
// If schema change broke deployment:

// 1. Check what data exists
bunx convex data --prod [table-name] --limit 5

// 2. Make schema backward compatible (don't remove fields)
// Instead of:
// defineTable({ newField: v.string() })

// Do:
defineTable({
  newField: v.string(),
  // Keep old fields as optional for backward compatibility
  oldField: v.optional(v.string()),
})

// 3. Deploy schema fix
bunx convex deploy --prod

// 4. Migrate data gradually (not during rollback)
```

**If Data Migration Required:**
```bash
# This is NOT a quick rollback - requires planning

# 1. Stop accepting new writes (if possible)
# 2. Export current data
bunx convex export --prod

# 3. Rollback schema to previous version
bunx convex deploy --prod

# 4. Restore compatible data
# (Manual process - contact team)
```

### Verification

```bash
# Verify functions deployed
bunx convex function-spec --prod

# Test critical functions
bunx convex run --prod users:list '{"limit": 1}'
bunx convex run --prod incidents:list '{"limit": 1}'

# Check logs for errors
bunx convex logs --prod

# Verify via web app
# - Login flow
# - Real-time updates
# - Data queries
```

## Cloudflare Worker Rollback

### Overview

- **Platform**: Cloudflare Workers (log-ingestion)
- **Rollback Method**: Re-deploy previous version via Wrangler
- **Time to Rollback**: 1-2 minutes
- **Data Impact**: Durable Objects state may need consideration

### Procedure

**1. Identify Last Working Version:**

```bash
# Check deployment history
cd apps/workers/log-ingestion
npx wrangler deployments list --env production

# Check git history
git log --oneline -- apps/workers/log-ingestion/
```

**2. Rollback via Wrangler (Recommended):**

```bash
cd apps/workers/log-ingestion

# Option A: Rollback to specific deployment (if recent)
# Get deployment ID from: wrangler deployments list --env production
npx wrangler rollback [deployment-id] --env production

# Option B: Re-deploy previous version from git
git checkout [last-good-commit] -- apps/workers/log-ingestion/
bunx convex deploy --env production

# Verify
curl https://log-ingestion-worker.workers.dev/health
```

**3. Wrangler Deployment Version Rollback:**

```bash
# List recent deployments
npx wrangler deployments list --env production

# Example output:
# Created:     Deployment ID:       Version ID:
# 2025-10-01   abc123-456def        v1.2.3

# Rollback to specific deployment
npx wrangler rollback [deployment-id] --env production

# Verify rollback
curl https://log-ingestion-worker.workers.dev/health | jq '.'
```

### Durable Objects State Management

**⚠️ IMPORTANT**: Durable Objects maintain state across deployments.

**During Rollback:**
```bash
# Durable Objects state persists automatically
# Rate limiter quotas will continue from current state

# If state corruption suspected:
# 1. Deploy rollback first
# 2. Then reset Durable Objects state if needed

# Check Durable Objects status
curl https://log-ingestion-worker.workers.dev/health | \
  jq '.components.rate_limiter'
```

**Reset Durable Objects (if needed):**
```bash
# This is destructive - only if absolutely necessary

# Option 1: Deploy new migration (preferred)
# Update wrangler.toml:
# [[migrations]]
# tag = "v2"
# renamed_classes = [{from = "RateLimiterDO", to = "RateLimiterDO_Old"}]
# new_sqlite_classes = ["RateLimiterDO"]

# Option 2: Manual reset via worker endpoint (if implemented)
curl -X POST https://log-ingestion-worker.workers.dev/admin/reset \
  -H "Authorization: Bearer [admin-token]"
```

### Redis State Cleanup

**When to Clean Redis:**
- Corrupted log data detected
- Rate limiter state incorrect
- Test data in production

**Procedure:**
```bash
# Check Redis health first
curl https://log-ingestion-worker.workers.dev/health | \
  jq '.components.redis'

# If cleanup needed:
curl -X DELETE https://log-ingestion-worker.workers.dev/logs/clear

# This clears all logs from Redis (TTL-based cleanup automatic)

# Verify cleanup
curl https://log-ingestion-worker.workers.dev/traces/recent
```

### Worker Secret Rollback

**If Secrets Changed:**
```bash
cd apps/workers/log-ingestion

# Restore previous secret value
npx wrangler secret put UPSTASH_REDIS_REST_URL --env production
# Enter previous value when prompted

npx wrangler secret put UPSTASH_REDIS_REST_TOKEN --env production
# Enter previous value when prompted

# Verify secrets updated
npx wrangler secret list --env production

# Test connection
curl https://log-ingestion-worker.workers.dev/health | \
  jq '.components.redis'
```

### Verification

```bash
# Health check
curl https://log-ingestion-worker.workers.dev/health

# Test log ingestion
curl -X POST https://log-ingestion-worker.workers.dev/log \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "rollback-test-'$(date +%s)'",
    "level": "info",
    "message": "Rollback verification test",
    "system": "browser"
  }'

# Verify all components healthy
./scripts/health-check.sh production
```

## Configuration Rollback

### Environment Variable Rollback

**Convex Configuration:**
```bash
# Restore previous configuration value
cd apps/convex

# Development
bunx convex env set VARIABLE_NAME previous-value

# Production
bunx convex env set --prod VARIABLE_NAME previous-value

# Verify
bunx convex env list --prod
```

**Cloudflare Pages Configuration:**
```
1. Go to Cloudflare Dashboard → Pages → app-supportsignal
2. Navigate to Settings → Environment Variables
3. Edit variable to previous value
4. Save
5. Trigger rebuild (if needed)
```

**Worker Configuration:**
```bash
cd apps/workers/log-ingestion

# Update wrangler.toml to previous values
git checkout [last-good-commit] -- wrangler.toml

# For secrets:
npx wrangler secret put SECRET_NAME --env production
# Enter previous value

# Redeploy worker
bun run deploy:production
```

### Source of Truth Rollback

**If centralized config file corrupted:**
```bash
# Restore from backup
cp ~/.env-configs/app.supportsignal.com.au.env.backup \
   ~/.env-configs/app.supportsignal.com.au.env

# Or restore from git (if tracked)
git checkout [last-good-commit] -- config/

# Verify
bun run env:validate

# Resync to all platforms
bun run sync-env --mode=local
bun run sync-env --mode=deploy-prod
```

## Incident Response Procedures

### Rollback Checklist

**Pre-Rollback:**
- [ ] Severity assessed (P0-P3)
- [ ] Rollback decision approved
- [ ] Team notified
- [ ] Last known good version identified
- [ ] Backup of current state taken (if applicable)

**During Rollback:**
- [ ] Rollback procedure initiated
- [ ] Progress communicated to team
- [ ] Each platform verified after rollback
- [ ] Health checks passing

**Post-Rollback:**
- [ ] All services verified operational
- [ ] Users notified (if applicable)
- [ ] Incident report created
- [ ] Root cause analysis scheduled
- [ ] Forward fix planned

### Communication Template

**Incident Start:**
```
🚨 INCIDENT: [Brief description]
Severity: [P0/P1/P2/P3]
Impact: [User impact description]
Action: Initiating rollback to [version/commit]
ETA: [X minutes]
```

**Rollback Complete:**
```
✅ RESOLVED: Rollback complete
Platform: [Affected platform(s)]
Previous Version: [version/commit]
Current Status: All systems operational
Next Steps: [Root cause analysis, forward fix planning]
```

### Deployment Failure Response

**Automated Response (CI/CD Failure):**
```bash
# CI pipeline failed - automatic prevention
bun run ci:status
# Review logs
bun run ci:logs

# Fix issues locally
# Re-attempt deployment
bun run push
```

**Manual Response (Production Issue):**
```bash
# 1. Assess severity
./scripts/health-check.sh production

# 2. If critical, initiate rollback immediately
# See platform-specific rollback sections above

# 3. If non-critical, evaluate forward fix
# Create hotfix branch
git checkout -b hotfix/[issue-description]

# 4. Document incident
# Create incident report in docs/incidents/
```

## Testing Rollback Procedures

### Development Environment Testing

**Test Pages Rollback:**
```bash
# 1. Create test deployment
git checkout -b test-rollback
# Make intentional breaking change
git commit -am "test: breaking change for rollback test"
git push origin test-rollback

# 2. Verify issue in preview deployment

# 3. Practice rollback via dashboard
# Use preview deployment rollback

# 4. Cleanup
git checkout main
git branch -D test-rollback
```

**Test Convex Rollback:**
```bash
# Use development environment for testing

# 1. Deploy test version
cd apps/convex
bunx convex deploy  # Development

# 2. Make breaking change
# Edit a function intentionally

# 3. Deploy breaking change
bunx convex deploy

# 4. Practice rollback
git checkout HEAD~1 -- [function-file].ts
bunx convex deploy

# 5. Verify rollback worked
bunx convex function-spec
```

**Test Worker Rollback:**
```bash
cd apps/workers/log-ingestion

# 1. Deploy test version
bun run deploy  # Development

# 2. Make breaking change and deploy

# 3. Practice rollback
npx wrangler rollback [previous-deployment-id]

# 4. Verify
curl http://localhost:8787/health
```

### Rollback Drills

**Quarterly Rollback Drill:**
```bash
# Full rollback drill procedure

# 1. Schedule drill (non-production hours)
# 2. Simulate incident scenario
# 3. Execute rollback procedures
# 4. Document time to recovery
# 5. Identify improvement areas
# 6. Update procedures based on learnings
```

**Metrics to Track:**
- Time to detect issue
- Time to decision
- Time to rollback completion
- Time to verification
- Total incident duration

## Related Documentation

- [Deployment Guide](./deployment-guide.md) - Deployment procedures
- [Deployment Verification](./deployment-verification.md) - Post-deployment testing
- [Configuration Management](./configuration-management.md) - Configuration procedures
- [Incident Response Guide](./incident-response.md) - Complete incident response

## Emergency Contacts

**For rollback assistance:**
- DevOps On-Call: [Contact information]
- Platform Support:
  - Cloudflare: https://dash.cloudflare.com/support
  - Convex: https://docs.convex.dev/support
- Escalation Path: [Escalation procedure]
