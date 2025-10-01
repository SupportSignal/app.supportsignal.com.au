# Deployment Rollback Procedures

## Overview

This document provides comprehensive rollback procedures for all deployment platforms used in the SupportSignal application. These procedures ensure quick recovery from deployment issues while maintaining data integrity and system stability.

**Deployment Platforms:**
- Cloudflare Pages (Next.js Web App)
- Convex Backend
- Cloudflare Workers (Log Ingestion)

**Last Updated:** 2025-10-01
**Document Version:** 1.0

---

## Table of Contents

1. [General Rollback Principles](#general-rollback-principles)
2. [Cloudflare Pages Rollback](#cloudflare-pages-rollback)
3. [Convex Backend Rollback](#convex-backend-rollback)
4. [Cloudflare Worker Rollback](#cloudflare-worker-rollback)
5. [Configuration Rollback](#configuration-rollback)
6. [Incident Response Procedures](#incident-response-procedures)
7. [Post-Rollback Verification](#post-rollback-verification)

---

## General Rollback Principles

### When to Rollback

**Immediate Rollback Required:**
- Critical functionality broken (authentication, core features)
- Security vulnerability introduced
- Data corruption or loss occurring
- Service completely unavailable
- Performance degradation >50%

**Investigate First, Rollback if Needed:**
- Minor UI issues
- Non-critical feature bugs
- Isolated user reports
- Performance degradation <50%

### Rollback Decision Matrix

| Issue Severity | User Impact | Action | Timeline |
|----------------|-------------|--------|----------|
| Critical | All users | **Immediate rollback** | <5 minutes |
| High | >50% users | **Quick rollback** | <15 minutes |
| Medium | <50% users | Investigate, rollback if unfixable | <1 hour |
| Low | <10% users | Forward fix preferred | Next deployment |

### Pre-Rollback Checklist

- [ ] Identify exact issue and deployment causing it
- [ ] Determine last known good deployment
- [ ] Alert team members of rollback action
- [ ] Capture error logs and metrics
- [ ] Document incident timeline
- [ ] Verify rollback target is stable

---

## Cloudflare Pages Rollback

### Architecture Context

Cloudflare Pages maintains deployment history and supports instant rollbacks to previous builds. Each deployment is immutable and can be activated independently.

### Rollback Methods

#### Method 1: Dashboard Rollback (Recommended for Production)

**Access:** [Cloudflare Pages Dashboard](https://dash.cloudflare.com/)

**Steps:**

1. **Navigate to Deployment History**
   ```
   Cloudflare Dashboard → Pages → app-supportsignal-com-au → Deployments
   ```

2. **Identify Last Known Good Deployment**
   - Review deployment list with timestamps
   - Look for deployment before issue was introduced
   - Verify deployment status is "Success"

3. **Activate Previous Deployment**
   - Click on the target deployment
   - Click "Manage deployment" → "Promote to production"
   - **OR** click three-dot menu → "Rollback to this deployment"

4. **Confirm Rollback**
   - Review deployment preview URL first (optional but recommended)
   - Click "Promote" to activate
   - Deployment switches instantly (no rebuild required)

**Expected Time:** 1-2 minutes

**Verification:**
```bash
# Check production URL
curl -I https://app.supportsignal.com.au

# Verify expected content
curl https://app.supportsignal.com.au | grep "version"  # If version tag exists
```

#### Method 2: Git-Based Rollback

**Use When:** Dashboard unavailable or scripted rollback needed

**Steps:**

1. **Identify Good Commit**
   ```bash
   cd /path/to/app.supportsignal.com.au
   git log --oneline --graph -n 20
   ```

2. **Revert to Previous Commit**

   **Option A: Create Revert Commit (Preferred)**
   ```bash
   # Revert the problematic commit
   git revert <bad-commit-hash>
   git push origin main
   ```

   **Option B: Hard Reset (Use with Caution)**
   ```bash
   # Reset to known good commit
   git reset --hard <good-commit-hash>
   git push --force origin main
   ```

3. **Monitor Auto-Deployment**
   ```bash
   # Cloudflare Pages will auto-deploy from main branch
   # Check deployment status
   bun run ci:status
   ```

**Expected Time:** 5-10 minutes (includes build time)

#### Method 3: Emergency Static Fallback

**Use When:** All deployments failing, emergency downtime prevention

**Steps:**

1. **Prepare Minimal Static Page**
   ```html
   <!DOCTYPE html>
   <html>
     <head><title>SupportSignal - Maintenance</title></head>
     <body>
       <h1>We'll be back soon!</h1>
       <p>We're performing maintenance. Please check back shortly.</p>
     </body>
   </html>
   ```

2. **Deploy Emergency Page**
   ```bash
   cd apps/web
   echo "<html>...</html>" > public/index.html
   bun run build:pages
   # Upload to Cloudflare Pages manually if needed
   ```

**Expected Time:** 10-15 minutes

---

## Convex Backend Rollback

### Architecture Context

Convex maintains deployment snapshots but does not support instant rollback. Rollback requires redeploying previous code version. Database schema changes require careful handling.

### Rollback Methods

#### Method 1: Code Rollback (No Schema Changes)

**Use When:** Code changes only, no database schema modifications

**Steps:**

1. **Identify Last Known Good Version**
   ```bash
   cd /path/to/app.supportsignal.com.au
   git log --oneline apps/convex/
   ```

2. **Checkout Previous Code**
   ```bash
   # Option A: Create rollback branch
   git checkout <good-commit-hash> -- apps/convex/
   git commit -m "Rollback Convex to <commit-hash>"

   # Option B: Full revert
   git revert <bad-commit-hash>
   ```

3. **Deploy Rollback**
   ```bash
   cd apps/convex

   # Development rollback
   bunx convex deploy

   # Production rollback
   bunx convex deploy --prod
   ```

4. **Verify Deployment**
   ```bash
   # Check function spec
   bunx convex function-spec --prod

   # Test critical functions
   bunx convex run healthCheck:status --prod
   ```

**Expected Time:** 5-10 minutes

#### Method 2: Rollback with Schema Changes

**Use When:** Previous deployment included schema changes

**⚠️ WARNING:** Schema rollbacks are complex and may cause data issues

**Steps:**

1. **Assess Schema Changes**
   ```bash
   # Review schema changes between versions
   git diff <good-commit> <current-commit> apps/convex/schema.ts
   ```

2. **Determine Rollback Strategy**

   **Option A: Backward Compatible Changes (Safe)**
   - Field additions → Safe to rollback (new fields unused)
   - Index additions → Safe to rollback
   - Optional field changes → Safe if properly handled

   **Option B: Breaking Changes (Dangerous)**
   - Field removals → **Data loss risk**
   - Type changes → **Data corruption risk**
   - Required field additions → **Write failures**

3. **Execute Rollback (Backward Compatible Only)**
   ```bash
   cd apps/convex
   git checkout <good-commit-hash> -- schema.ts
   git commit -m "Rollback schema to <commit-hash>"
   bunx convex deploy --prod
   ```

4. **Handle Breaking Changes**

   If rollback includes breaking schema changes:

   ```bash
   # DO NOT rollback automatically
   # Instead, create migration function

   # Example: apps/convex/migrations/rollbackSchema.ts
   import { internalMutation } from "./_generated/server";

   export const rollbackField = internalMutation(async (ctx) => {
     const docs = await ctx.db.query("tableName").collect();
     for (const doc of docs) {
       // Handle data migration
       await ctx.db.patch(doc._id, {
         // Transform data to match previous schema
       });
     }
   });

   # Run migration before deploying rollback
   bunx convex run migrations:rollbackField --prod
   ```

**Expected Time:** 15-60 minutes (depending on data migration complexity)

**⚠️ CRITICAL:** For breaking schema changes, consider **forward fix** instead of rollback

---

## Cloudflare Worker Rollback

### Architecture Context

Cloudflare Workers support version rollback via Wrangler CLI. Worker deployments include Durable Objects and external dependencies (Redis) that require consideration during rollback.

### Rollback Methods

#### Method 1: Wrangler Version Rollback

**Steps:**

1. **List Recent Deployments**
   ```bash
   cd apps/workers/log-ingestion

   # Production deployments
   wrangler deployments list --env production

   # Development deployments
   wrangler deployments list
   ```

   **Output Example:**
   ```
   Deployment ID: abc123...
   Created on:    2025-10-01 14:30:00
   Author:        developer@example.com
   Source:        Upload
   ```

2. **Identify Target Deployment**
   - Note deployment ID from list
   - Verify deployment timestamp matches known good state
   - Check deployment author if uncertain

3. **Rollback to Specific Version**

   **⚠️ NOTE:** Wrangler does not have built-in rollback command. Must redeploy previous code.

   ```bash
   # Option A: Git-based rollback
   cd /path/to/app.supportsignal.com.au
   git checkout <good-commit-hash> -- apps/workers/log-ingestion/src/

   cd apps/workers/log-ingestion

   # Deploy rollback
   bun run deploy:production  # Or wrangler deploy --env production
   ```

   **Option B: Deploy from specific git tag/commit**
   ```bash
   # Create rollback branch
   git checkout -b rollback-worker-<timestamp> <good-commit>

   cd apps/workers/log-ingestion
   bun run deploy:production
   ```

4. **Verify Rollback**
   ```bash
   # Test worker health
   ./scripts/verify-worker-health.sh <worker-url> --verbose
   ```

**Expected Time:** 5-10 minutes

#### Method 2: Durable Objects State Management

**Use When:** Rollback affects Durable Objects logic

**Considerations:**

1. **Durable Objects State Persistence**
   - Durable Objects maintain state across deployments
   - Code rollback does NOT reset Durable Object state
   - State created by newer code remains after rollback

2. **State Compatibility Check**

   Before rollback, verify state compatibility:

   ```typescript
   // Check if old code can handle new state structure
   // Example: apps/workers/log-ingestion/src/rate-limiter.ts

   export class RateLimiterDO {
     async fetch(request: Request): Promise<Response> {
       // Handle state version compatibility
       const state = await this.state.get("version");

       if (state > EXPECTED_VERSION) {
         // Newer state detected - handle or throw error
       }
     }
   }
   ```

3. **State Rollback Procedure** (if required)

   ```bash
   # Option A: Clear Durable Objects state (destructive)
   # This requires custom mutation endpoint in Worker

   curl -X DELETE https://worker-url/admin/reset-durable-objects \
     -H "Authorization: Bearer <admin-token>"

   # Option B: Migrate state to compatible format
   # Implement migration endpoint in Worker before rollback
   ```

**Expected Time:** 10-30 minutes (depending on state complexity)

#### Method 3: Redis Backend Cleanup

**Use When:** Rollback changes Redis data structure or schema

**Steps:**

1. **Assess Redis Data Impact**
   ```bash
   # Connect to Upstash Redis Console
   # Check for data structure changes in deployment
   ```

2. **Data Cleanup Options**

   **Option A: Selective Key Deletion**
   ```bash
   # Use Worker admin endpoint (if implemented)
   curl -X DELETE https://worker-url/logs/clear

   # Or via Upstash console
   # Filter and delete keys matching pattern
   ```

   **Option B: TTL Expiration** (Preferred for log data)
   ```
   # Log data has 1-hour TTL by default
   # Wait for natural expiration (low risk)
   # No action needed unless urgent
   ```

   **Option C: Full Redis Clear** (Emergency only)
   ```bash
   # ⚠️ DESTRUCTIVE - Only for emergencies
   # Via Upstash console: Database → Data Browser → Flush All
   ```

3. **Verify Redis State**
   ```bash
   # Check Worker health after cleanup
   curl https://worker-url/health | jq '.components.redis'
   ```

**Expected Time:** 5-15 minutes

### Worker Secrets Rollback

**Use When:** Rollback requires different secrets (Redis credentials, etc.)

**Steps:**

1. **List Current Secrets**
   ```bash
   cd apps/workers/log-ingestion
   wrangler secret list --env production
   ```

2. **Update Secrets if Needed**
   ```bash
   # If rollback requires previous Redis instance
   wrangler secret put UPSTASH_REDIS_REST_URL --env production
   wrangler secret put UPSTASH_REDIS_REST_TOKEN --env production
   ```

3. **Verify Secret Application**
   ```bash
   # Secrets take effect immediately
   # Test worker health
   curl https://worker-url/health
   ```

**Expected Time:** 2-5 minutes

---

## Configuration Rollback

### Source of Truth Rollback

**File:** `~/.env-configs/app.supportsignal.com.au.env`

**Steps:**

1. **Backup Current Configuration**
   ```bash
   cp ~/.env-configs/app.supportsignal.com.au.env \
      ~/.env-configs/app.supportsignal.com.au.env.backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **Restore Previous Configuration**

   **Option A: From Git (if tracked)**
   ```bash
   # If configuration tracked in repository
   git checkout <good-commit> ~/.env-configs/app.supportsignal.com.au.env
   ```

   **Option B: From Manual Backup**
   ```bash
   cp ~/.env-configs/app.supportsignal.com.au.env.backup-YYYYMMDD-HHMMSS \
      ~/.env-configs/app.supportsignal.com.au.env
   ```

3. **Sync to All Platforms**
   ```bash
   # Development environment
   bun run sync-env --mode=deploy-dev

   # Production environment (careful!)
   bun run sync-env --mode=deploy-prod

   # Local files
   bun run sync-env --mode=local
   ```

4. **Verify Configuration**
   ```bash
   ./scripts/verify-environment.sh production
   ```

**Expected Time:** 5-10 minutes

### Environment Variable Rollback

#### Convex Environment Variables

**Steps:**

1. **List Current Variables**
   ```bash
   cd apps/convex
   bunx convex env list --prod
   ```

2. **Update Individual Variables**
   ```bash
   # Set to previous value
   bunx convex env set VARIABLE_NAME "previous-value" --prod
   ```

3. **Verify Update**
   ```bash
   bunx convex env get VARIABLE_NAME --prod
   ```

#### Cloudflare Worker Secrets

**Steps:**

1. **Update Secrets**
   ```bash
   cd apps/workers/log-ingestion
   wrangler secret put SECRET_NAME --env production
   # Enter previous value when prompted
   ```

2. **Secrets take effect immediately** (no redeployment needed)

---

## Incident Response Procedures

### Deployment Failure Response

**Phase 1: Detection (0-2 minutes)**

1. **Automated Alerts** (if configured)
   - CI/CD pipeline failure notifications
   - Health check monitoring alerts
   - Error rate spike alerts

2. **Manual Detection**
   ```bash
   # Check deployment status
   bun run ci:status

   # Verify all platforms
   ./scripts/verify-deployment.sh production
   ```

**Phase 2: Assessment (2-5 minutes)**

1. **Identify Scope**
   - Which platform affected? (Pages / Convex / Worker)
   - What percentage of users impacted?
   - Is system partially or fully down?

2. **Gather Data**
   ```bash
   # Collect error logs
   bun run ci:logs > incident-logs-$(date +%Y%m%d-%H%M%S).txt

   # Check each platform
   curl -I https://app.supportsignal.com.au
   curl https://worker-url/health
   bunx convex run healthCheck:status --prod
   ```

3. **Determine Rollback Need**
   - Use [Rollback Decision Matrix](#rollback-decision-matrix)
   - Critical issues → Immediate rollback
   - Non-critical → Attempt forward fix first

**Phase 3: Action (5-15 minutes)**

1. **Execute Rollback** (if decided)
   - Follow platform-specific rollback procedures above
   - Document actions taken

2. **OR Attempt Forward Fix**
   - Make minimal fix
   - Test in development first
   - Deploy cautiously

3. **Communication**
   - Alert team of actions
   - Update status page (if applicable)
   - Prepare user communication

**Phase 4: Verification (15-20 minutes)**

1. **Run Verification Suite**
   ```bash
   # Full deployment verification
   ./scripts/verify-deployment.sh production

   # Worker-specific checks
   ./scripts/verify-worker-health.sh <worker-url> --verbose

   # Environment validation
   ./scripts/verify-environment.sh production
   ```

2. **User Impact Check**
   - Test critical user flows
   - Verify authentication
   - Check core functionality

**Phase 5: Post-Incident (20+ minutes)**

1. **Document Incident**
   - Timeline of events
   - Root cause identified
   - Actions taken
   - Prevention measures

2. **Team Review**
   - Postmortem meeting
   - Update procedures if needed
   - Identify improvements

---

## Post-Rollback Verification

### Verification Checklist

After any rollback, perform complete verification:

- [ ] **Deployment Status**
  ```bash
  bun run ci:status
  ```

- [ ] **Platform Health**
  ```bash
  ./scripts/verify-deployment.sh production
  ```

- [ ] **Worker Health**
  ```bash
  ./scripts/verify-worker-health.sh <worker-url>
  ```

- [ ] **Environment Configuration**
  ```bash
  ./scripts/verify-environment.sh production
  ```

- [ ] **User Authentication**
  - Test login flow
  - Verify OAuth callback

- [ ] **Core Functionality**
  - Test critical user flows
  - Verify data integrity
  - Check real-time features

- [ ] **Performance Metrics**
  - Page load times acceptable
  - API response times normal
  - No error rate spikes

### Monitoring After Rollback

**First 30 minutes:**
- Monitor error logs continuously
- Watch user activity metrics
- Check for new issue reports

**First 24 hours:**
- Regular health checks every hour
- Review automated monitoring alerts
- User feedback monitoring

**Document Lessons Learned:**
- Update rollback procedures if issues found
- Improve deployment verification
- Enhance automated testing

---

## Emergency Contacts

**Deployment Issues:**
- Platform Owner: [Contact Info]
- DevOps Lead: [Contact Info]

**Cloudflare Support:**
- Dashboard: https://dash.cloudflare.com/
- Support: https://support.cloudflare.com/

**Convex Support:**
- Dashboard: https://dashboard.convex.dev/
- Discord: https://convex.dev/community

---

## Related Documentation

- [Deployment Operations Guide](./deployment-operations-guide.md)
- [Environment Configuration Management](./environment-configuration.md)
- [CI/CD Pipeline Setup](../technical-guides/cicd-pipeline-setup.md)
- [Testing Infrastructure](../testing/technical/test-strategy-and-standards.md)

---

**Document Maintenance:**
- Review quarterly
- Update after significant deployment changes
- Incorporate lessons learned from incidents
