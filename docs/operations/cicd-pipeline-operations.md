# CI/CD Pipeline Operations Guide

**Last Updated**: October 1, 2025
**Version**: 1.0
**Maintainer**: DevOps Team

## Table of Contents

- [Overview](#overview)
- [Pipeline Architecture](#pipeline-architecture)
- [GitHub Actions Configuration](#github-actions-configuration)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Pipeline Failure Response](#pipeline-failure-response)
- [Integration with Deployment Procedures](#integration-with-deployment-procedures)

## Overview

This guide provides operational procedures for the CI/CD pipeline, covering monitoring, troubleshooting, and responding to pipeline failures.

### Pipeline Purpose

The CI/CD pipeline automates:
- **Security scanning** - Gitleaks secret detection
- **Code quality** - Linting and type checking
- **Testing** - Unit and E2E test execution
- **Building** - Production-ready build generation
- **Deployment** - Automated Cloudflare Pages deployment

### Key Characteristics

- **Platform**: GitHub Actions
- **Trigger**: Push to main branch and pull requests
- **Deployment**: Automatic on main branch only
- **Duration**: 5-8 minutes typical execution
- **Dependencies**: Bun, Convex, Cloudflare Pages

## Pipeline Architecture

### Job Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Git Push/PR                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   Security      │ (Gitleaks scan)
         └────────┬────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   ┌─────┐    ┌──────┐   ┌────────┐
   │Lint │    │Test  │   │E2E (*)│
   └──┬──┘    └───┬──┘   └────┬───┘
      └───────────┼───────────┘
                  ▼
            ┌──────────┐
            │  Build   │
            └─────┬────┘
                  │
                  ▼
         ┌────────────────┐
         │ Deploy (main)  │ (Conditional)
         └────────────────┘
```

**(*) E2E tests**: Currently disabled, runs as no-op

### Job Dependencies

```yaml
security: [] # No dependencies (runs first)
lint: [security]
test: [security]
test-e2e: [security]
build: [lint, test]
deploy: [build, test-e2e]
```

### Execution Characteristics

**Parallel Execution:**
- Security scan runs first (blocking)
- Lint, Test, E2E run in parallel after security
- Build waits for lint and test
- Deploy waits for everything

**Timing Breakdown:**
- Security: 30-60 seconds
- Lint: 1-2 minutes
- Test: 2-3 minutes
- E2E: 0 seconds (disabled)
- Build: 2-3 minutes
- Deploy: 1-2 minutes

**Total Duration**: 5-8 minutes (varies by workload)

## GitHub Actions Configuration

### Workflow File Location

**File**: `.github/workflows/ci.yml`

### Environment Variables

**Global Variables:**
```yaml
env:
  HUSKY: 0              # Disable git hooks in CI
  NODE_ENV: production  # Production build mode
```

**Build Job Variables:**
```yaml
env:
  NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
  NEXT_PUBLIC_CONVEX_URL: ${{ secrets.NEXT_PUBLIC_CONVEX_URL }}
  NEXT_PUBLIC_LOG_WORKER_URL: ${{ secrets.NEXT_PUBLIC_LOG_WORKER_URL }}
```

### Required GitHub Secrets

**Cloudflare Deployment:**
- `CLOUDFLARE_API_TOKEN` - API token with Pages:Edit permission
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- `CLOUDFLARE_PROJECT_NAME` - Pages project name

**Application Configuration:**
- `NEXT_PUBLIC_APP_URL` - Production application URL
- `NEXT_PUBLIC_CONVEX_URL` - Convex backend URL
- `NEXT_PUBLIC_LOG_WORKER_URL` - Log ingestion worker URL

**Automatic Secrets:**
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

### Permissions Configuration

```yaml
permissions:
  contents: read        # Read repository contents
  deployments: write    # Write deployment statuses
  pull-requests: read   # Read PR information
```

### Job Configuration Details

#### 1. Security Job

**Purpose**: Detect secrets and sensitive data before code execution

```yaml
security:
  name: Security Scan
  runs-on: ubuntu-latest
  steps:
    - Checkout code (full history)
    - Install Gitleaks (latest version)
    - Run Gitleaks with .gitleaks.toml config
```

**Exit Code**: 1 if secrets detected (fails pipeline)

#### 2. Lint Job

**Purpose**: Validate code quality with ESLint

```yaml
lint:
  needs: [security]
  steps:
    - Checkout code
    - Setup Bun
    - Install dependencies (frozen lockfile)
    - Run ESLint
```

**Command**: `bun run lint`

#### 3. Test Job

**Purpose**: Run unit tests, type checking, Convex validation

```yaml
test:
  needs: [security]
  steps:
    - Checkout code
    - Setup Bun
    - Install dependencies
    - Run unit tests with coverage
    - Upload coverage reports
    - Generate Convex files
    - Run type checks
```

**Commands**:
- `cd apps/web && bun run test:ci`
- `cd apps/convex && bun run build`
- `bun run typecheck`

#### 4. E2E Test Job

**Purpose**: Run end-to-end tests (currently disabled)

```yaml
test-e2e:
  needs: [security]
  steps:
    - Check if E2E tests exist (always returns false)
    - Conditionally install Playwright
    - Conditionally run E2E tests
```

**Status**: Disabled via `e2e_exists=false` flag

#### 5. Build Job

**Purpose**: Generate production build with Cloudflare Pages output

```yaml
build:
  needs: [lint, test]
  steps:
    - Checkout code
    - Setup Bun
    - Install dependencies
    - Debug environment variables
    - Generate Convex files
    - Build applications
    - Build for Cloudflare Pages
    - Upload build artifacts
```

**Commands**:
- `cd apps/convex && bun run build`
- `bun run build`
- `cd apps/web && bun run build:pages`

**Artifact**: `apps/web/dist` directory

#### 6. Deploy Job

**Purpose**: Deploy to Cloudflare Pages (main branch only)

```yaml
deploy:
  needs: [build, test-e2e]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  environment: production
  steps:
    - Checkout code
    - Download build artifacts
    - Deploy to Cloudflare Pages
```

**Deployment Action**: `cloudflare/pages-action@v1`

## Monitoring and Alerting

### Available Monitoring Tools

**1. CI Status Check:**
```bash
# Check current CI status
bun run ci:status [branch-name]

# Features:
- Shows recent CI runs with status
- Displays timestamps and conclusions
- Provides GitHub Actions link
- Exit codes indicate status
```

**2. CI Monitor:**
```bash
# Monitor CI execution with timeout
bun run ci:watch [branch-name] [timeout-seconds]

# Features:
- Real-time status updates
- Configurable timeout (default: 300s)
- Automatic log link on failure
- Progress indicators
```

**3. CI Logs Viewer:**
```bash
# View detailed CI logs
bun run ci:logs [branch-name]

# Shows:
- Complete workflow run output
- Job-specific logs
- Failure details
- Artifact information
```

### Monitoring Best Practices

**After Every Push:**
```bash
# Verify push was successful
git push origin main

# Monitor CI execution
bun run ci:watch
```

**During Story Completion:**
```bash
# Final verification before marking complete
bun run ci:status

# If running, monitor to completion
bun run ci:watch
```

**When Investigating Issues:**
```bash
# Check status first
bun run ci:status

# If failed, get detailed logs
bun run ci:logs

# Check specific job in GitHub UI
# (link provided by ci:status)
```

### GitHub Actions Dashboard

**Access**: `https://github.com/{owner}/{repo}/actions`

**Features:**
- Visual workflow status
- Job-level details
- Log streaming
- Artifact downloads
- Re-run capabilities

**Recommended Views:**
- **Workflow runs** - See all pipeline executions
- **Failed runs** - Focus on failures
- **Specific workflow** - ci.yml execution history

## Troubleshooting Guide

### Common Failure Scenarios

#### 1. Security Scan Failure

**Symptom**: Security job fails with exit code 1

**Cause**: Gitleaks detected secrets or sensitive data

**Investigation:**
```bash
# Check local files for secrets
gitleaks detect --config=.gitleaks.toml --verbose

# Review .gitleaks.toml configuration
cat .gitleaks.toml
```

**Resolution:**
1. Identify leaked secret from Gitleaks output
2. Remove secret from code
3. Add to .gitleaks.toml allowlist if false positive
4. Update repository secrets if compromised
5. Commit fix and push

**Prevention:**
- Use environment variables for secrets
- Configure .gitleaksignore for known safe patterns
- Run `gitleaks detect` locally before pushing

#### 2. Lint Failure

**Symptom**: Lint job fails with ESLint errors

**Cause**: Code quality issues or formatting problems

**Investigation:**
```bash
# Run lint locally
bun run lint

# See detailed errors
bun run lint --debug
```

**Resolution:**
1. Fix ESLint errors manually
2. Or run auto-fix: `bun run lint --fix`
3. Commit fixes and push

**Common Issues:**
- Unused variables/imports
- Missing TypeScript types
- Formatting violations
- Import order issues

#### 3. Test Failure

**Symptom**: Test job fails with test failures or type errors

**Cause**: Unit test failures or TypeScript compilation errors

**Investigation:**
```bash
# Run tests locally
cd apps/web && bun run test:ci

# Run type checking
bun run typecheck

# Generate Convex files
cd apps/convex && bun run build
```

**Resolution for Test Failures:**
1. Review test output for specific failures
2. Fix failing tests
3. Verify tests pass locally
4. Commit and push

**Resolution for Type Errors:**
1. Generate Convex types: `cd apps/convex && bun run build`
2. Run typecheck: `bun run typecheck`
3. Fix TypeScript errors
4. Commit and push

**Common Issues:**
- Outdated Convex type definitions
- Missing test assertions
- Mock implementation issues
- Type definition mismatches

#### 4. Build Failure

**Symptom**: Build job fails during Next.js build

**Cause**: Build errors, missing environment variables, or dependency issues

**Investigation:**
```bash
# Run build locally
bun run build

# Check for Cloudflare Pages compatibility
cd apps/web && bun run build:pages

# Verify environment variables
bun run sync-env --mode=local
```

**Resolution for Build Errors:**
1. Review build output for specific errors
2. Fix source code issues
3. Test build locally
4. Commit and push

**Resolution for Environment Variables:**
1. Verify GitHub Secrets are configured
2. Check secret names match workflow
3. Update secrets in GitHub Settings
4. Re-run workflow

**Common Issues:**
- Missing environment variables
- Next.js configuration errors
- Dependency version conflicts
- Static export compatibility issues

#### 5. Deployment Failure

**Symptom**: Deploy job fails during Cloudflare Pages deployment

**Cause**: Invalid API token, missing secrets, or Cloudflare service issues

**Investigation:**
```bash
# Verify Cloudflare credentials
cd apps/web
npx wrangler whoami

# Check Pages project exists
# Visit: https://dash.cloudflare.com/pages

# Test manual deployment
bun run pages:deploy
```

**Resolution for Authentication:**
1. Verify CLOUDFLARE_API_TOKEN in GitHub Secrets
2. Check token has Pages:Edit permission
3. Regenerate token if needed
4. Update GitHub Secret
5. Re-run workflow

**Resolution for Project Issues:**
1. Verify CLOUDFLARE_PROJECT_NAME matches exactly
2. Check project exists in Cloudflare dashboard
3. Verify CLOUDFLARE_ACCOUNT_ID is correct
4. Update secrets if needed

**Common Issues:**
- Expired API token
- Incorrect secret values
- Project name mismatch
- Cloudflare service outage

### Debugging Workflow

**Step 1: Identify Failed Job**
```bash
bun run ci:status  # Shows which job failed
```

**Step 2: Get Detailed Logs**
```bash
bun run ci:logs    # View complete output
```

**Step 3: Reproduce Locally**
```bash
# Run the exact commands from failed job
# Example for test job:
cd apps/web && bun run test:ci
cd apps/convex && bun run build
bun run typecheck
```

**Step 4: Fix and Verify**
```bash
# Fix the issue
# Verify fix works locally
# Commit and push
```

**Step 5: Monitor Fix**
```bash
bun run ci:watch   # Confirm fix worked
```

## Pipeline Failure Response

### Immediate Response Checklist

**When Pipeline Fails:**

- [ ] **Stop new work** - Don't continue until CI is green
- [ ] **Check status**: `bun run ci:status`
- [ ] **Get logs**: `bun run ci:logs`
- [ ] **Identify job**: Determine which job failed
- [ ] **Reproduce locally**: Run same commands locally
- [ ] **Fix issue**: Address root cause
- [ ] **Verify locally**: Ensure fix works
- [ ] **Push fix**: Commit and push
- [ ] **Monitor**: `bun run ci:watch` to confirm

### Severity Classification

**P0 - Critical (Fix Immediately):**
- Main branch deployment failed
- Production build broken
- Security scan failed (secrets exposed)
- All jobs failing

**P1 - High (Fix Within Hour):**
- Pull request blocked by CI failure
- Test failures blocking merge
- Build failures on feature branch

**P2 - Medium (Fix Same Day):**
- Intermittent test failures
- Linting issues on feature branch
- Non-blocking warnings

**P3 - Low (Fix When Convenient):**
- Coverage threshold warnings
- Performance degradation in CI
- Non-critical job failures

### Response Procedures

**For P0 Critical Failures:**
```bash
# Immediate investigation
bun run ci:status
bun run ci:logs

# Quick assessment
# If simple fix (lint, type error):
#   1. Fix locally
#   2. Push immediately

# If complex issue:
#   1. Create hotfix branch
#   2. Fix and test
#   3. Create emergency PR
#   4. Request immediate review
```

**For P1 High Failures:**
```bash
# Investigation workflow
bun run ci:status
bun run ci:logs

# Fix on current branch
# Test locally
# Push fix

# Monitor resolution
bun run ci:watch
```

**For P2 Medium Failures:**
```bash
# Standard debugging workflow
# Fix during normal development cycle
# No special escalation needed
```

### Escalation Path

**Level 1**: Developer (Self-Service)
- Use monitoring tools
- Review logs
- Fix locally
- Push resolution

**Level 2**: Team Lead (Complex Issues)
- Review with team lead
- Architectural issues
- Configuration problems
- Third-party service failures

**Level 3**: DevOps/Platform (Infrastructure)
- GitHub Actions issues
- Cloudflare platform problems
- Convex backend issues
- Infrastructure outages

### Communication Template

**Failure Notification:**
```
🚨 CI Pipeline Failure

Branch: [branch-name]
Job: [failed-job-name]
Run: [GitHub Actions link]
Status: Investigating

Impact: [describe impact]
ETA: [estimated fix time]
```

**Resolution Notification:**
```
✅ CI Pipeline Resolved

Branch: [branch-name]
Issue: [brief description]
Fix: [what was fixed]
Duration: [time to resolution]

All jobs passing: [GitHub Actions link]
```

## Integration with Deployment Procedures

### CI/CD Pipeline in Deployment Workflow

**Automatic Deployment (Main Branch):**
```
1. Developer pushes to main
2. CI pipeline executes
3. All jobs must pass
4. Deploy job triggers automatically
5. Cloudflare Pages deploys
6. Deployment URL available
```

**Manual Deployment (Development):**
```
1. Developer tests locally
2. Pushes to feature branch
3. CI validates (no deploy)
4. Merge to main when ready
5. Automatic deployment follows
```

### Pre-Deployment Validation

**Before pushing to main:**
```bash
# Local verification suite
pwd                    # Verify project root
bun run typecheck     # TypeScript validation
bun run lint          # ESLint compliance
bun test              # Unit tests
bun run build         # Production build
bun run ci:status     # Check current CI status
```

**After pushing to main:**
```bash
# Monitor deployment
bun run ci:watch      # Monitor CI execution

# Verify deployment succeeded
./scripts/verify-deployment.sh production

# Check application health
./scripts/health-check.sh production
```

### Integration Points

**With Deployment Guide:**
- CI pipeline is first step in deployment
- See [Deployment Guide](./deployment-guide.md) for complete workflow
- Deployment verification follows CI success

**With Rollback Procedures:**
- Failed CI may trigger rollback
- See [Rollback Procedures](./rollback-procedures.md) for recovery
- CI must be green before marking rollback complete

**With Configuration Management:**
- Environment variables managed through GitHub Secrets
- See [Configuration Management](./configuration-management.md) for secrets
- Configuration changes require CI re-run

### Deployment Dependencies

**CI Must Pass Before:**
- Cloudflare Pages deployment
- Production environment updates
- Release tagging
- Story completion marking

**CI Validates:**
- Source code quality
- Test coverage
- Type safety
- Build compatibility
- Security compliance

## Related Documentation

- [Deployment Guide](./deployment-guide.md) - Complete deployment procedures
- [Deployment Verification](./deployment-verification.md) - Post-deployment testing
- [Rollback Procedures](./rollback-procedures.md) - Recovery procedures
- [Configuration Management](./configuration-management.md) - Environment configuration
- [CI/CD Pipeline Setup](../technical-guides/cicd-pipeline-setup.md) - Initial setup guide

## Emergency Contacts

**For CI/CD assistance:**
- DevOps Team: [Contact information]
- GitHub Support: https://support.github.com
- Cloudflare Support: https://dash.cloudflare.com/support
- Escalation Path: [Escalation procedure]

## Appendix: CI Script Reference

### ci-status.sh

**Purpose**: Check current CI pipeline status

**Usage**:
```bash
bun run ci:status [branch-name]
```

**Exit Codes**:
- 0: Success
- 1: Failure
- 2: Cancelled
- 3: In progress
- 4: Queued

**Output**:
- Recent CI runs with timestamps
- Current status and conclusion
- Direct link to GitHub Actions

### ci-monitor.sh

**Purpose**: Monitor CI execution with real-time updates

**Usage**:
```bash
bun run ci:watch [branch-name] [timeout-seconds]
```

**Parameters**:
- `branch-name`: Branch to monitor (default: current)
- `timeout-seconds`: Maximum wait time (default: 300)

**Exit Codes**:
- 0: CI succeeded
- 1: CI failed
- 124: Timeout reached
- Others: Various states

**Features**:
- Real-time status updates
- Progress indicators
- Remaining time display
- Automatic failure log link

### smart-push.sh

**Purpose**: Intelligent push with pre-validation and CI monitoring

**Usage**:
```bash
bun run push
```

**Workflow**:
1. Pre-push validation (lint, typecheck, test)
2. Git operations (add, commit, push)
3. Automated CI monitoring
4. Success/failure reporting

**Features**:
- Automatic validation before push
- Interactive commit message
- CI integration
- Actionable feedback on failure
