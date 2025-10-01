# Configuration Drift Detection

**Last Updated**: October 1, 2025
**Version**: 1.0
**Maintainer**: DevOps Team

## Table of Contents

- [Overview](#overview)
- [Configuration Drift Detection](#configuration-drift-detection)
- [Automated Drift Detection](#automated-drift-detection)
- [Regular Validation Procedures](#regular-validation-procedures)
- [Drift Prevention Protocols](#drift-prevention-protocols)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Remediation Procedures](#remediation-procedures)

## Overview

Configuration drift occurs when environment configurations across platforms (Convex, Cloudflare, GitHub, local) diverge from the centralized source of truth.

### Impact of Configuration Drift

**Symptoms:**
- Different behavior between environments
- Authentication failures
- URL resolution errors
- Build failures in CI/CD
- Production environment using development values
- Development environment using production values

**Risk Level:**
- **Critical**: Production using wrong environment values
- **High**: Authentication credentials mismatch
- **Medium**: Development environment inconsistencies
- **Low**: Documentation drift

### Drift Detection Strategy

The project uses a multi-layered approach to detect and prevent configuration drift:

1. **Centralized Source of Truth** - Single configuration file
2. **Automated Detection** - Scripts to compare actual vs expected
3. **Regular Validation** - Scheduled drift checks
4. **Change Validation** - Pre-deployment drift verification
5. **Continuous Monitoring** - Ongoing drift alerting

## Configuration Drift Detection

### Drift Detection Script

**Location**: `scripts/check-config-drift.sh`

**Purpose**: Compare environment configurations across all platforms to detect drift from central source of truth.

### Usage

**Basic Usage:**
```bash
# Check all environments
./scripts/check-config-drift.sh

# Check specific environment
./scripts/check-config-drift.sh dev
./scripts/check-config-drift.sh prod
```

**Using npm/bun script:**
```bash
# Add to package.json
bun run drift:check
```

### What It Checks

**1. Local Environment Files:**
- `apps/web/.env.local`
- `apps/convex/.env.local`

**Validates:**
- Files exist
- Required variables present
- Values match DEV_VALUE from central config

**2. Convex Development Environment:**
- Variables deployed to Convex development

**Validates:**
- Required variables present
- Values match DEV_VALUE from central config

**3. Convex Production Environment:**
- Variables deployed to Convex production

**Validates:**
- Required variables present
- Values match PROD_VALUE from central config

**4. GitHub Secrets:**
- Secrets configured for CI/CD pipeline

**Validates:**
- Required secrets exist (cannot read values)

### Example Output

**No Drift Detected:**
```
╔════════════════════════════════════════════════════╗
║     Configuration Drift Detection                 ║
╚════════════════════════════════════════════════════╝

✅ Central configuration found

Checking Local Environment Files...

Checking: apps/web/.env.local
✅ Local (apps/web/.env.local) - NEXT_PUBLIC_APP_URL: OK
✅ Local (apps/web/.env.local) - NEXT_PUBLIC_CONVEX_URL: OK
✅ Local (apps/web/.env.local) - NEXT_PUBLIC_LOG_WORKER_URL: OK

Checking Convex Development Environment...

✅ Convex (Development) - NEXT_PUBLIC_APP_URL: OK
✅ Convex (Development) - NEXT_PUBLIC_CONVEX_URL: OK
✅ Convex (Development) - NEXT_PUBLIC_LOG_WORKER_URL: OK

═══════════════════════════════════════════════════

✅ No configuration drift detected
```

**Drift Detected:**
```
Checking Convex Production Environment...

✅ Convex (Production) - NEXT_PUBLIC_APP_URL: OK
❌ Convex (Production) - NEXT_PUBLIC_CONVEX_URL: DRIFT DETECTED
   Expected: https://graceful-shrimp-355.convex.cloud
   Actual:   https://beaming-gull-639.convex.cloud
✅ Convex (Production) - NEXT_PUBLIC_LOG_WORKER_URL: OK

═══════════════════════════════════════════════════

❌ Configuration drift detected: 1 issue(s)

Remediation Steps:
1. Review drift issues above
2. Update central config: ~/.env-configs/app.supportsignal.com.au.env
3. Sync environments: bun run sync-env --mode=local
4. Deploy to Convex: bun run sync-env --mode=deploy-prod
5. Update GitHub Secrets: gh secret set NEXT_PUBLIC_CONVEX_URL
6. Re-run drift check: ./scripts/check-config-drift.sh
```

### Exit Codes

- **0**: No drift detected
- **1**: Drift detected
- **2**: Script error or missing dependencies

## Automated Drift Detection

### Scheduled Drift Checks

**Recommendation**: Run drift detection on a regular schedule.

**Frequency:**
- **Daily**: Development environment (automatic)
- **Weekly**: Production environment (manual verification)
- **Before Deployment**: Always (mandatory)
- **After Configuration Changes**: Always (validation)

### GitHub Actions Integration

**Option 1: Scheduled Workflow**

Create `.github/workflows/drift-detection.yml`:

```yaml
name: Configuration Drift Detection

on:
  schedule:
    # Run daily at 9 AM UTC
    - cron: '0 9 * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  drift-check:
    name: Check Configuration Drift
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Check configuration drift
        run: ./scripts/check-config-drift.sh

      - name: Report drift detected
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Configuration Drift Detected',
              body: 'Automated drift detection found configuration inconsistencies. Please review and remediate.',
              labels: ['configuration', 'drift-detection', 'priority:high']
            })
```

**Option 2: Pre-Deployment Check**

Add to existing CI/CD pipeline (`.github/workflows/ci.yml`):

```yaml
  drift-check:
    name: Configuration Drift Check
    runs-on: ubuntu-latest
    needs: [security]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Check configuration drift
        run: ./scripts/check-config-drift.sh
```

### Pre-Commit Hook

**Option**: Add drift check to Git hooks (use cautiously - can slow commits)

```bash
# .husky/pre-commit (optional)
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Only run on configuration file changes
if git diff --cached --name-only | grep -q "env-configs"; then
    echo "Configuration changed - running drift check..."
    ./scripts/check-config-drift.sh || {
        echo "❌ Configuration drift detected - please fix before committing"
        exit 1
    }
fi
```

## Regular Validation Procedures

### Daily Validation (Development)

**Performed by**: Developers
**Frequency**: Daily (before starting work)

**Procedure:**
```bash
# 1. Run drift check
./scripts/check-config-drift.sh dev

# 2. If drift detected, sync local
bun run sync-env --mode=local

# 3. If Convex drift, re-deploy dev
bun run sync-env --mode=deploy-dev

# 4. Verify fix
./scripts/check-config-drift.sh dev
```

### Weekly Validation (Production)

**Performed by**: DevOps/Team Lead
**Frequency**: Weekly (scheduled)

**Procedure:**
```bash
# 1. Run full drift check
./scripts/check-config-drift.sh

# 2. Document any drift found
# Create incident report if drift detected

# 3. Remediate drift
# Follow remediation procedures below

# 4. Verify fix
./scripts/check-config-drift.sh

# 5. Update drift log
# Record check date and results
```

### Pre-Deployment Validation (Mandatory)

**Performed by**: Developer/DevOps
**Frequency**: Before every production deployment

**Procedure:**
```bash
# 1. Verify no drift before deployment
./scripts/check-config-drift.sh prod

# 2. If drift detected, STOP deployment
# Fix drift before proceeding

# 3. Re-run after fix
./scripts/check-config-drift.sh prod

# 4. Only deploy if drift check passes
```

### Post-Configuration-Change Validation (Mandatory)

**Performed by**: Developer making change
**Frequency**: After every configuration change

**Procedure:**
```bash
# 1. Update central config
vim ~/.env-configs/app.supportsignal.com.au.env

# 2. Sync to target environments
bun run sync-env --mode=deploy-dev
bun run sync-env --mode=deploy-prod

# 3. Verify sync was successful
./scripts/check-config-drift.sh

# 4. Fix any issues before committing
```

## Drift Prevention Protocols

### Protocol 1: Single Source of Truth

**Rule**: ALL configuration changes must go through central config file.

**Location**: `~/.env-configs/app.supportsignal.com.au.env`

**Prohibited Actions:**
- ❌ Direct changes to Convex environment via dashboard
- ❌ Direct changes to GitHub Secrets via settings
- ❌ Manual edits to local .env files (without sync)
- ❌ Cloudflare environment variable changes via dashboard

**Allowed Actions:**
- ✅ Update central config file
- ✅ Run sync-env script
- ✅ Verify with drift detection

### Protocol 2: Change Validation

**Rule**: Every configuration change must be validated.

**Workflow:**
```
1. Update central config
2. Run sync-env with --dry-run first
3. Review changes before applying
4. Apply sync-env to target environment
5. Run drift check to verify
6. Document change in changelog
```

**Example:**
```bash
# 1. Update central config
vim ~/.env-configs/app.supportsignal.com.au.env

# 2. Preview changes
bun run sync-env --mode=deploy-prod --dry-run

# 3. Apply if changes look correct
bun run sync-env --mode=deploy-prod

# 4. Verify
./scripts/check-config-drift.sh prod
```

### Protocol 3: Environment Isolation

**Rule**: Development and production values must remain separate.

**Validation:**
- Local files ALWAYS use DEV_VALUE
- Production Convex ALWAYS uses PROD_VALUE
- Development Convex ALWAYS uses DEV_VALUE
- GitHub Secrets use PROD_VALUE (for main branch CI)

**Prohibited Patterns:**
- ❌ Production values in local .env files
- ❌ Development values in production Convex
- ❌ Mixed dev/prod values in same environment

### Protocol 4: Documentation Synchronization

**Rule**: Keep configuration documentation in sync with reality.

**What to Document:**
- Configuration changes in central config
- Deployment procedures updated if flow changes
- Drift incidents and resolutions
- Lessons learned from drift events

**Update Triggers:**
- New environment variable added
- URL structure changes
- Platform configuration changes
- Security credential rotation

## Monitoring and Alerting

### Manual Monitoring

**Daily Developer Check:**
```bash
# Add to daily startup routine
alias check-drift='./scripts/check-config-drift.sh dev'

# Run before starting work
check-drift
```

**Weekly DevOps Review:**
```bash
# Full environment check
./scripts/check-config-drift.sh

# Review logs
cat logs/drift-detection.log
```

### Automated Monitoring (Future Enhancement)

**Recommended Setup:**

**1. GitHub Actions Scheduled Run:**
- Daily automated drift check
- Create issue on drift detection
- Notify team via Slack/email

**2. Drift Detection Dashboard:**
- Web interface showing drift status
- Historical drift trends
- Configuration version tracking

**3. Real-Time Alerting:**
- Slack notification on drift detection
- Email alert for production drift
- PagerDuty integration for critical drift

### Alerting Configuration

**Alert Levels:**

**Critical (Immediate Action):**
- Production environment drift
- Security credential mismatch
- Authentication configuration drift

**High (Same Day):**
- Development environment drift
- URL configuration mismatch
- Missing required variables

**Medium (This Week):**
- Optional variable drift
- Documentation inconsistencies
- Non-critical platform drift

**Low (When Convenient):**
- Local environment drift
- Development-only variables
- Cosmetic inconsistencies

## Remediation Procedures

### General Remediation Workflow

**Step 1: Identify Drift**
```bash
# Run drift check
./scripts/check-config-drift.sh

# Note specific variables with drift
# Note which platforms affected
```

**Step 2: Determine Root Cause**

**Common Causes:**
- Manual changes bypassing sync-env
- Incomplete sync operation
- Central config out of date
- Platform-specific configuration issues

**Step 3: Update Central Config (if needed)**
```bash
# Edit central config to correct value
vim ~/.env-configs/app.supportsignal.com.au.env

# Verify format is correct
cat ~/.env-configs/app.supportsignal.com.au.env | grep -A2 "KEY_NAME"
```

**Step 4: Sync to Affected Platforms**
```bash
# For local drift
bun run sync-env --mode=local

# For Convex development drift
bun run sync-env --mode=deploy-dev

# For Convex production drift
bun run sync-env --mode=deploy-prod
```

**Step 5: Verify Remediation**
```bash
# Run drift check again
./scripts/check-config-drift.sh

# Should show: ✅ No configuration drift detected
```

**Step 6: Document Incident**
```bash
# Log remediation
echo "$(date): Remediated drift in [environment] for [variable]" >> logs/drift-remediation.log
```

### Platform-Specific Remediation

#### Convex Environment Drift

**Cause**: Variable value doesn't match central config

**Remediation:**
```bash
# 1. Verify central config has correct value
cat ~/.env-configs/app.supportsignal.com.au.env | grep "VARIABLE_NAME"

# 2. Deploy correct value to Convex
bun run sync-env --mode=deploy-dev    # For development
bun run sync-env --mode=deploy-prod   # For production

# 3. Verify directly in Convex
bunx convex env list                  # Development
bunx convex env list --prod          # Production

# 4. Verify drift resolved
./scripts/check-config-drift.sh
```

#### Local Environment Drift

**Cause**: Local .env files out of sync

**Remediation:**
```bash
# 1. Backup existing local files (optional)
cp apps/web/.env.local apps/web/.env.local.backup
cp apps/convex/.env.local apps/convex/.env.local.backup

# 2. Regenerate from central config
bun run sync-env --mode=local

# 3. Verify drift resolved
./scripts/check-config-drift.sh dev
```

#### GitHub Secrets Drift

**Cause**: Secrets not configured or have wrong values

**Remediation:**
```bash
# 1. Verify secret value in central config
cat ~/.env-configs/app.supportsignal.com.au.env | grep "VARIABLE_NAME"

# 2. Update GitHub Secret
gh secret set VARIABLE_NAME
# Paste value when prompted (use PROD_VALUE)

# 3. Verify secret exists
gh secret list | grep VARIABLE_NAME

# 4. Note: Cannot verify value via API
# Manual verification required by running CI pipeline
```

### Critical Drift Response

**For Production Environment Drift:**

**Priority**: P0 - Immediate action required

**Procedure:**
```bash
# 1. STOP all deployments
# Do not deploy until drift resolved

# 2. Assess impact
# Determine if production is using wrong values
# Check recent deployments for errors

# 3. Remediate immediately
bun run sync-env --mode=deploy-prod

# 4. Verify fix
./scripts/check-config-drift.sh prod

# 5. Test production environment
./scripts/health-check.sh production

# 6. Document incident
# Create incident report
# Update runbook if needed

# 7. Root cause analysis
# Identify how drift occurred
# Implement prevention measures
```

## Related Documentation

- [Configuration Management](./configuration-management.md) - Configuration procedures
- [Deployment Guide](./deployment-guide.md) - Deployment procedures
- [Deployment Verification](./deployment-verification.md) - Post-deployment testing
- [CI/CD Pipeline Operations](./cicd-pipeline-operations.md) - Pipeline operations

## Appendix: Drift Detection Checklist

### Daily Developer Checklist

- [ ] Run drift check: `./scripts/check-config-drift.sh dev`
- [ ] If drift detected, sync local: `bun run sync-env --mode=local`
- [ ] Verify resolution: `./scripts/check-config-drift.sh dev`

### Weekly DevOps Checklist

- [ ] Run full drift check: `./scripts/check-config-drift.sh`
- [ ] Review drift log: `cat logs/drift-detection.log`
- [ ] Remediate any production drift
- [ ] Update drift detection documentation if needed
- [ ] Verify all environments synchronized

### Pre-Deployment Checklist

- [ ] Run production drift check: `./scripts/check-config-drift.sh prod`
- [ ] Ensure no drift before deployment
- [ ] If drift detected, remediate before deploying
- [ ] Verify drift resolved: `./scripts/check-config-drift.sh prod`
- [ ] Proceed with deployment only if no drift

### Post-Configuration-Change Checklist

- [ ] Update central config: `~/.env-configs/app.supportsignal.com.au.env`
- [ ] Preview changes: `bun run sync-env --dry-run --mode=[target]`
- [ ] Apply sync: `bun run sync-env --mode=[target]`
- [ ] Verify drift resolved: `./scripts/check-config-drift.sh`
- [ ] Document change in changelog
