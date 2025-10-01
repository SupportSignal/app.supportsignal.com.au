# Deployment & Operations Patterns

**Knowledge Domain**: DevOps, Deployment, CI/CD, Configuration Management
**Source Story**: Story 8.4 - Deployment Pipeline & Configuration Management
**Date Captured**: 2025-10-01
**Status**: Production-Validated

## Overview

This document captures deployment and operations patterns established during the implementation of comprehensive deployment procedures for a multi-platform application (Cloudflare Pages, Convex Backend, Cloudflare Workers).

**Key Context:**
- Multi-platform deployment coordination (3 independent deployment pipelines)
- Environment separation (development vs production)
- Configuration management with single source of truth
- Automated verification and rollback procedures

---

## Pattern 1: Multi-Platform Deployment Framework

### Problem
Applications using multiple deployment platforms (web app, backend, edge workers) require coordinated deployment procedures that account for:
- Platform-specific deployment mechanisms
- Independent deployment lifecycles
- Cross-platform configuration dependencies
- Different rollback procedures per platform

### Solution
Create a unified deployment framework that handles each platform independently while maintaining configuration consistency.

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│         Deployment Coordination Layer               │
│  (Documentation + Verification Scripts)             │
└─────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Pages    │   │ Convex   │   │ Workers  │
    │ (Auto)   │   │ (Manual) │   │ (Manual) │
    └──────────┘   └──────────┘   └──────────┘
         │              │              │
         ▼              ▼              ▼
    [Static      [Functions    [Edge
     Export]      + Schema]     Runtime]
```

**Implementation:**
- **Platform-Specific Guides**: Separate deployment documentation per platform
- **Unified Verification**: Single script that verifies all platforms
- **Configuration Coordination**: Centralized environment variable management
- **Cross-Platform Health Checks**: Automated verification across all services

**Example Usage:**
```bash
# Deploy all platforms (coordinated but independent)
# 1. Deploy Convex backend
cd apps/convex && bunx convex deploy --prod

# 2. Deploy Cloudflare Worker
cd apps/workers/log-ingestion && wrangler deploy --env production

# 3. Deploy Cloudflare Pages (auto-triggered by git push)
git push origin main

# 4. Verify all platforms
./scripts/verify-deployment.sh production
```

**Benefits:**
- ✅ Platform independence (failures isolated)
- ✅ Flexible deployment order
- ✅ Unified verification interface
- ✅ Clear rollback boundaries

**Related Files:**
- `docs/operations/deployment-guide.md` - Complete deployment procedures
- `scripts/verify-deployment.sh` - Multi-platform verification script
- `docs/operations/rollback-procedures.md` - Platform-specific rollback

---

## Pattern 2: Single Source of Truth Configuration

### Problem
Managing environment-specific configuration across multiple platforms creates drift, inconsistency, and deployment errors. Traditional approaches scatter configuration across:
- Local `.env` files
- Platform dashboards
- CI/CD secrets
- Git-tracked configs

### Solution
Centralize all configuration in a single source of truth with environment-aware deployment.

**Architecture:**
```
┌─────────────────────────────────────────┐
│  Source of Truth                        │
│  ~/.env-configs/[project].env           │
│  ┌─────────────────────────────────┐   │
│  │ TARGET | GROUP | KEY | DEV | PRD│   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │ sync-env.js      │
    │ (Deployment Tool)│
    └──────────────────┘
         │         │
         ▼         ▼
    [Local]   [Cloud Platforms]
    .env.local   ├─ Convex
    (DEV only)   ├─ Cloudflare
                 └─ GitHub
```

**Implementation:**

**Source of Truth Format:**
```
| TARGET               | GROUP          | KEY                    | DEV_VALUE            | PROD_VALUE              |
|----------------------|----------------|------------------------|----------------------|-------------------------|
| NEXTJS,CONVEX        | Local Dev      | NEXT_PUBLIC_APP_URL    | http://localhost:3200| https://app.example.com |
| CONVEX               | Convex Backend | CONVEX_DEPLOYMENT      | dev-beaming-gull-639 | prod-graceful-shrimp-355|
| CLOUDFLARE_WORKER    | Worker Secrets | UPSTASH_REDIS_REST_URL | dev-redis-url        | prod-redis-url          |
```

**Deployment Commands:**
```bash
# Generate local files (always DEV values)
bun run sync-env --mode=local

# Deploy to development environment
bun run sync-env --mode=deploy-dev

# Deploy to production environment
bun run sync-env --mode=deploy-prod

# Verify without applying
bun run sync-env --mode=local --dry-run
```

**Critical Principles:**
1. **Local files = Development values ALWAYS**
2. **Production values = Deployed directly to cloud platforms**
3. **Never commit production values to version control**
4. **Single source, multiple deployment targets**

**Benefits:**
- ✅ Single source of truth eliminates drift
- ✅ Environment values clearly separated (DEV_VALUE vs PROD_VALUE columns)
- ✅ Safe local development (can't accidentally use production values)
- ✅ Auditable configuration changes (source of truth version controlled separately)
- ✅ Platform-specific deployment (different targets get different subsets)

**Related Files:**
- `~/.env-configs/app.supportsignal.com.au.env` - Source of truth configuration
- `scripts/sync-env.js` - Configuration deployment tool
- `docs/operations/configuration-management.md` - Complete configuration guide

---

## Pattern 3: Automated Deployment Verification

### Problem
Manual post-deployment verification is:
- Inconsistent (steps missed)
- Time-consuming
- Error-prone (false positives/negatives)
- Not CI/CD compatible

### Solution
Create bash-based verification scripts with structured checks, exit codes, and comprehensive coverage.

**Architecture:**
```
Deployment Complete
       │
       ▼
┌──────────────────────────────────┐
│ Verification Script              │
│                                  │
│ 1. Load Configuration            │
│ 2. Platform Health Checks        │
│    ├─ Pages (HTTP, content)      │
│    ├─ Convex (CLI, functions)    │
│    └─ Workers (health endpoint)  │
│ 3. Configuration Validation      │
│ 4. Integration Testing           │
│ 5. Summary Report                │
└──────────────────────────────────┘
       │
       ▼
Exit Code: 0=Success, 1=Failure
```

**Implementation Pattern:**

```bash
#!/bin/bash
# Verification script template

# Exit codes
# 0 = All checks passed
# 1 = Critical failures detected
# Other = Warnings present

PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

check_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

check_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNING_CHECKS++))
}

# Platform verification sections
# 1. Cloudflare Pages
# 2. Convex Backend
# 3. Cloudflare Workers
# 4. Configuration
# 5. Integration

# Summary and exit
if [ $FAILED_CHECKS -gt 0 ]; then
    exit 1
elif [ $WARNING_CHECKS -gt 0 ]; then
    exit 0  # Warnings don't fail deployment
else
    exit 0
fi
```

**Key Features:**
- **Colored Output**: Green (✅), Yellow (⚠️), Red (❌) for status
- **Counter Tracking**: Passed/Failed/Warning counts
- **Exit Code Standards**: 0=success, 1=failure for CI/CD
- **Comprehensive Checks**: Application, configuration, integration
- **Environment Awareness**: Different checks for dev vs prod

**Example Checks:**

```bash
# Health check example
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
if [ "$HTTP_CODE" = "200" ]; then
    check_passed "Web app accessible at $APP_URL"
else
    check_failed "Web app returned HTTP $HTTP_CODE"
fi

# Convex backend check
DEPLOY_INFO=$(bunx convex function-spec --prod 2>&1)
if [[ "$DEPLOY_INFO" != *"ERROR"* ]]; then
    check_passed "Convex deployment responsive via CLI"
else
    check_failed "Convex CLI connection failed"
fi

# Worker health check
WORKER_HEALTH=$(curl -s "$WORKER_URL/health")
WORKER_STATUS=$(echo "$WORKER_HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$WORKER_STATUS" = "healthy" ]; then
    check_passed "Worker health check: healthy"
else
    check_failed "Worker health check failed: $WORKER_STATUS"
fi
```

**Benefits:**
- ✅ Automated and consistent verification
- ✅ CI/CD compatible (exit codes)
- ✅ Fast execution (<30 seconds)
- ✅ Clear pass/fail indication
- ✅ Actionable failure messages

**Related Files:**
- `scripts/verify-deployment.sh` - Comprehensive platform verification
- `scripts/verify-worker-health.sh` - Worker-specific health checks
- `scripts/verify-environment.sh` - Configuration validation

---

## Pattern 4: Platform-Specific Rollback Procedures

### Problem
Generic rollback procedures fail because each platform has different:
- Deployment mechanisms (dashboard vs CLI vs git)
- State management (stateless vs database vs Durable Objects)
- Rollback capabilities (instant vs rebuild required)
- Side effects (data migrations, secrets, external services)

### Solution
Document platform-specific rollback procedures with decision matrices and incident response workflows.

**Decision Matrix:**

| Issue Severity | User Impact | Action | Timeline | Platform |
|----------------|-------------|--------|----------|----------|
| Critical | All users | **Immediate rollback** | <5 min | All |
| High | >50% users | **Quick rollback** | <15 min | Pages, Workers |
| High | >50% users | **Investigate first** | <30 min | Convex (schema changes) |
| Medium | <50% users | **Forward fix** | <1 hour | All |

**Platform-Specific Procedures:**

### Cloudflare Pages Rollback
**Mechanism**: Instant activation of previous deployment
**Time**: 1-2 minutes
**Data Impact**: None (stateless)

```bash
# Method 1: Dashboard (fastest)
# Cloudflare Dashboard → Pages → Deployments → Select previous → Rollback

# Method 2: Git-based
git revert <bad-commit-hash>
git push origin main
# Auto-deploys previous version
```

### Convex Backend Rollback
**Mechanism**: Redeploy previous code version
**Time**: 5-10 minutes (no schema changes), 15-60 minutes (with schema changes)
**Data Impact**: Potential (schema changes)

```bash
# Code-only rollback (safe)
git checkout <good-commit-hash> -- apps/convex/
bunx convex deploy --prod

# Schema rollback (DANGEROUS)
# 1. Check schema compatibility
git diff <good-commit> <current-commit> apps/convex/schema.ts

# 2. If backward compatible → proceed
# 3. If breaking changes → STOP, use forward fix or data migration
```

**Critical Convex Rule**: Never rollback breaking schema changes without data migration.

### Cloudflare Worker Rollback
**Mechanism**: Redeploy previous code + state management
**Time**: 5-10 minutes + state cleanup time
**Data Impact**: Durable Objects state persists

```bash
# Code rollback
git checkout <good-commit-hash> -- apps/workers/log-ingestion/
cd apps/workers/log-ingestion
wrangler deploy --env production

# Durable Objects state management (if needed)
# State persists across deployments - handle compatibility in code
# OR implement state reset endpoint for emergency

# Redis cleanup (if data structure changed)
# Option 1: Let TTL expire (1 hour for logs)
# Option 2: Manual cleanup via worker endpoint
curl -X DELETE https://worker-url/logs/clear
```

**Benefits:**
- ✅ Clear rollback paths per platform
- ✅ Prevents dangerous rollbacks (schema changes)
- ✅ State management awareness
- ✅ Time estimates for incident response

**Related Files:**
- `docs/operations/rollback-procedures.md` - Complete rollback documentation

---

## Pattern 5: Configuration Drift Detection

### Problem
Configuration drift occurs when:
- Local files diverge from source of truth
- Cloud platform values modified manually
- Different team members have different configs
- Deployments use inconsistent values

### Solution
Implement automated drift detection with comparison, reporting, and remediation procedures.

**Architecture:**
```
Source of Truth                Cloud Platforms
~/.env-configs/[project].env   ├─ Convex Env Vars
       │                       ├─ GitHub Secrets
       │                       └─ Cloudflare Settings
       │                              │
       ▼                              ▼
  ┌─────────────────────────────────────┐
  │   Drift Detection Script            │
  │   1. Parse source of truth          │
  │   2. Query cloud platforms          │
  │   3. Compare values                 │
  │   4. Generate drift report          │
  └─────────────────────────────────────┘
              │
              ▼
         Drift Report
    ┌──────────────────┐
    │ Key: APP_URL     │
    │ Expected: prod   │
    │ Actual: dev      │
    │ Platform: Convex │
    │ Action: Required │
    └──────────────────┘
```

**Implementation:**

```bash
#!/bin/bash
# Drift detection pattern

# 1. Parse source of truth
SOURCE_CONVEX_URL=$(grep "NEXT_PUBLIC_CONVEX_URL" ~/.env-configs/project.env | awk -F'|' '{print $6}')

# 2. Query actual deployment
ACTUAL_CONVEX_URL=$(bunx convex env get NEXT_PUBLIC_CONVEX_URL --prod)

# 3. Compare
if [ "$SOURCE_CONVEX_URL" != "$ACTUAL_CONVEX_URL" ]; then
    echo "❌ DRIFT DETECTED: CONVEX_URL"
    echo "   Expected: $SOURCE_CONVEX_URL"
    echo "   Actual: $ACTUAL_CONVEX_URL"
    DRIFT_COUNT=$((DRIFT_COUNT + 1))
fi

# 4. Remediation
if [ $DRIFT_COUNT -gt 0 ]; then
    echo ""
    echo "🔧 Remediation: Run 'bun run sync-env --mode=deploy-prod'"
fi
```

**Detection Schedule:**
- **Pre-deployment**: Before every production deployment
- **Daily**: Automated drift detection via cron/CI
- **Weekly**: Manual review and audit
- **Post-incident**: After any manual configuration changes

**Benefits:**
- ✅ Early drift detection prevents deployment issues
- ✅ Automated checking reduces manual effort
- ✅ Clear remediation steps (re-run sync-env)
- ✅ Audit trail of configuration consistency

**Related Files:**
- `scripts/check-config-drift.sh` - Automated drift detection
- `docs/operations/configuration-drift-detection.md` - Drift detection procedures

---

## Lessons Learned

### macOS Compatibility in Bash Scripts

**Problem**: Using GNU date extensions breaks on macOS BSD date.

**Symptom**:
```bash
# This fails on macOS
START_TIME=$(date +%s%3N)  # %3N = milliseconds, GNU only
# Output: "17592748903N: value too great for base"
```

**Solution**: Use portable alternatives.
```bash
# macOS-compatible (works on both BSD and GNU)
START_TIME=$(date +%s)  # Seconds only
RESPONSE_TIME=$((END_TIME - START_TIME))
echo "Response time: ${RESPONSE_TIME}s"
```

**Lesson**: Test bash scripts on target platforms (Linux CI vs macOS local development).

---

### Environment Detection Logic

**Problem**: Production verification loaded development values from local `.env.local` files.

**Symptom**:
```bash
./scripts/verify-deployment.sh production
# Output: Verifying http://localhost:3200 (wrong!)
```

**Solution**: Separate configuration loading by environment.
```bash
if [ "$ENVIRONMENT" = "production" ]; then
    # Use hardcoded production URLs or environment variables
    APP_URL="${NEXT_PUBLIC_APP_URL:-https://app.example.com}"
    CONVEX_URL="https://prod-deployment.convex.cloud"
else
    # Load from .env.local for development
    APP_URL=$(grep "NEXT_PUBLIC_APP_URL" apps/web/.env.local | cut -d'=' -f2)
fi
```

**Lesson**: Local files should NEVER be used for production verification.

---

### Durable Objects State Persistence

**Problem**: Worker code rollback doesn't reset Durable Objects state.

**Key Insight**: Durable Objects maintain state across deployments.
- New code deploys
- Old Durable Object state remains
- State created by new code persists after rollback

**Solution**: Handle state compatibility in code.
```typescript
export class RateLimiterDO {
  async fetch(request: Request): Promise<Response> {
    // Check state version
    const stateVersion = await this.state.get("version") || 1;

    if (stateVersion > EXPECTED_VERSION) {
      // Handle newer state or throw error
      console.warn("Newer state detected after rollback");
    }

    // Handle state compatibility...
  }
}
```

**Lesson**: Durable Objects require versioned state management for safe rollbacks.

---

### Exit Code Standards for CI/CD

**Problem**: Inconsistent exit codes break CI/CD automation.

**Standard Established**:
```bash
# 0 = Success (all checks passed)
exit 0

# 1 = Failure (critical issues, block deployment)
exit 1

# 0 = Success with warnings (non-blocking)
# Report warnings but don't fail
exit 0
```

**Implementation Pattern**:
```bash
if [ $FAILED_CHECKS -gt 0 ]; then
    echo "❌ Verification FAILED"
    exit 1
elif [ $WARNING_CHECKS -gt 0 ]; then
    echo "⚠️  Verification PASSED with warnings"
    exit 0  # Don't block on warnings
else
    echo "✅ Verification PASSED"
    exit 0
fi
```

**Lesson**: Use standard exit codes (0/1) consistently for CI/CD compatibility.

---

### Configuration Loading Order Priority

**Problem**: Unclear precedence when configuration comes from multiple sources.

**Established Priority**:
```
1. Command-line arguments (highest priority)
2. Environment variables
3. Local .env files (development only)
4. Hardcoded defaults (lowest priority)
```

**Implementation Pattern**:
```bash
# Development: .env.local → env vars → defaults
if [ -f ".env.local" ]; then
    APP_URL=$(grep "APP_URL" .env.local | cut -d'=' -f2)
fi
APP_URL="${NEXT_PUBLIC_APP_URL:-$APP_URL}"
APP_URL="${APP_URL:-http://localhost:3200}"

# Production: env vars → hardcoded → no .env.local
APP_URL="${NEXT_PUBLIC_APP_URL:-https://app.example.com}"
```

**Lesson**: Explicit priority order prevents configuration conflicts.

---

## Related Documentation

**Primary Documentation:**
- [Deployment Guide](../operations/deployment-guide.md) - Complete deployment procedures
- [Configuration Management](../operations/configuration-management.md) - Configuration protocols
- [Rollback Procedures](../operations/rollback-procedures.md) - Platform-specific rollback

**Implementation Examples:**
- `scripts/verify-deployment.sh` - Multi-platform verification implementation
- `scripts/verify-worker-health.sh` - Worker health check implementation
- `scripts/check-config-drift.sh` - Drift detection implementation

**KDD Knowledge Base:**
- [Backend Patterns](./backend-patterns.md) - Convex deployment patterns
- [Development Workflow Patterns](./development-workflow-patterns.md) - CI/CD patterns

---

## Usage Guidelines

### When to Use These Patterns

**Multi-Platform Deployment Framework:**
- ✅ Application uses 3+ deployment platforms
- ✅ Platforms have independent lifecycles
- ✅ Need coordinated but flexible deployment

**Single Source of Truth Configuration:**
- ✅ Managing environment-specific configuration
- ✅ Multiple deployment environments (dev, staging, prod)
- ✅ Configuration drift is a problem

**Automated Deployment Verification:**
- ✅ Manual verification taking too long
- ✅ Inconsistent verification steps
- ✅ Need CI/CD integration

**Platform-Specific Rollback:**
- ✅ Different platforms have different rollback needs
- ✅ Database schema changes involved
- ✅ Stateful services (Durable Objects, Redis)

**Configuration Drift Detection:**
- ✅ Team modifying configs manually
- ✅ Multiple configuration sources
- ✅ Deployment failures due to config mismatch

---

**Last Updated**: 2025-10-01
**Validation Status**: Production-tested across 3 deployment platforms
**Source Story**: [Story 8.4](../stories/8.4.story.md)
