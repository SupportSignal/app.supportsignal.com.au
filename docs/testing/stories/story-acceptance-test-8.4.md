# Story 8.4: Deployment Pipeline & Configuration Management - UAT Plan

## Story Reference
**Story ID**: 8.4
**Story Title**: Deployment Pipeline & Configuration Management
**Story File**: [docs/stories/8.4.story.md](../../stories/8.4.story.md)

## Test Environment Setup

### Prerequisites
- [x] Access to project root directory: `/Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au`
- [x] Terminal access with bash shell
- [x] Internet connectivity for testing deployed services
- [x] Environment variables configured (development environment)

### Environment Information
```bash
# Development URLs (used for testing)
APP_URL="http://localhost:3200"
WORKER_URL="<your-dev-worker-url>"  # Get from .env.local
CONVEX_URL="<your-dev-convex-url>"  # Get from .env.local

# Production URLs (for production testing - optional)
APP_URL_PROD="https://app.supportsignal.com.au"
WORKER_URL_PROD="<your-prod-worker-url>"
CONVEX_URL_PROD="<your-prod-convex-url>"
```

---

## UAT Test Cases

### Test Suite 1: Deployment Verification Scripts

#### Test Case 1.1: Verify Deployment Script Exists and is Executable

**Objective**: Confirm the deployment verification script is properly installed

**Steps**:
```bash
# Navigate to project root
cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au

# Verify script exists
ls -la scripts/verify-deployment.sh

# Check if executable
test -x scripts/verify-deployment.sh && echo "✅ Script is executable" || echo "❌ Script not executable"
```

**Expected Result**:
- Script file exists at `scripts/verify-deployment.sh`
- File has executable permissions (`-rwxr-xr-x` or similar)
- Output shows "✅ Script is executable"

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 1.2: Run Deployment Verification for Development Environment

**Objective**: Execute full deployment verification for development environment

**Steps**:
```bash
# From project root
pwd  # Verify you're in project root

# Run verification for development environment
./scripts/verify-deployment.sh development
```

**Expected Result**:
- Script executes without errors
- Output shows colored status indicators (green ✅, yellow ⚠️, red ❌)
- Verification sections appear in order:
  1. Loading environment configuration
  2. Cloudflare Pages verification
  3. Convex backend verification
  4. Cloudflare Worker verification
  5. Environment configuration verification
  6. Summary report with counts

- Final summary shows:
  - Passed: [number] ✅
  - Warnings: [number] ⚠️
  - Failed: [number] ❌

- Exit code: 0 (if no failures) or 1 (if failures present)

**Check Exit Code**:
```bash
echo $?  # Should be 0 for success
```

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

**Notes**: _[Record any warnings or failures and their reasons]_

---

#### Test Case 1.3: Run Deployment Verification for Production Environment

**Objective**: Execute full deployment verification for production environment

**Prerequisites**:
- Production deployments are active
- Production URLs are accessible

**Steps**:
```bash
# From project root
./scripts/verify-deployment.sh production
```

**Expected Result**:
- Script detects production environment
- Verifies production URLs (app.supportsignal.com.au)
- Checks production Convex deployment
- Verifies production Worker deployment
- Summary report shows production-specific checks

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

### Test Suite 2: Worker Health Verification Scripts

#### Test Case 2.1: Worker Health Script - Help Display

**Objective**: Verify help information displays correctly

**Steps**:
```bash
# Run without arguments to see help
./scripts/verify-worker-health.sh
```

**Expected Result**:
- Help text displays with usage instructions
- Shows example commands
- Lists verification features:
  - Worker availability and response time
  - Redis backend connectivity
  - Rate limiter Durable Object status
  - Log processor functionality
  - CORS configuration
  - All worker endpoints

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 2.2: Worker Health Check - Basic Mode

**Objective**: Run basic health check on Worker

**Prerequisites**:
- Get Worker URL from environment:
  ```bash
  # Extract Worker URL from .env.local
  grep "NEXT_PUBLIC_LOG_WORKER_URL" apps/web/.env.local
  ```

**Steps**:
```bash
# Replace <WORKER_URL> with your actual Worker URL
./scripts/verify-worker-health.sh <WORKER_URL>
```

**Expected Result**:
- Worker availability test passes ✅
- Health endpoint returns "healthy" status
- Redis backend status shown
- Rate limiter status shown
- Log processor status shown
- CORS configuration verified
- Log ingestion endpoint tested
- Log retrieval endpoint tested
- Recent traces endpoint tested
- Rate limiter functionality tested
- Summary shows all checks passed or with warnings

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 2.3: Worker Health Check - Verbose Mode

**Objective**: Run detailed health check with debug output

**Steps**:
```bash
# Run with --verbose flag
./scripts/verify-worker-health.sh <WORKER_URL> --verbose
```

**Expected Result**:
- All basic checks from Test Case 2.2
- Additional debug output with `[DEBUG]` prefix showing:
  - Raw health endpoint response
  - Redis configuration details
  - Rate limit details (active systems, active traces)
  - CORS method details
  - Log response bodies
  - Request/response details for each test

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

### Test Suite 3: Environment Validation Scripts

#### Test Case 3.1: Environment Detection - Development

**Objective**: Verify automatic development environment detection

**Steps**:
```bash
# Run without specifying expected environment
./scripts/verify-environment.sh
```

**Expected Result**:
- Script auto-detects "development" environment
- Shows: "Detected Environment: development"
- Verifies development-specific configuration:
  - App URL contains "localhost"
  - Convex URL contains "beaming-gull" (dev deployment)
- Checks source of truth configuration exists
- Validates URL consistency
- Verifies OAuth configuration
- Checks secrets configuration

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 3.2: Environment Detection - Production Validation

**Objective**: Verify production environment detection and validation

**Steps**:
```bash
# Specify expected environment as production
./scripts/verify-environment.sh production
```

**Expected Result**:
- Script checks if environment matches "production"
- If development detected but production expected:
  - Shows error: "Environment mismatch - Expected: production, Detected: development" ❌
  - This is expected if running locally

- If production detected:
  - Verifies production URLs (supportsignal.com.au)
  - Checks production Convex deployment (graceful-shrimp)

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 3.3: URL Configuration Validation

**Objective**: Verify URL configuration module checks

**Steps**:
```bash
# Run environment verification
./scripts/verify-environment.sh
```

**Focus on**: URL Configuration Validation section of output

**Expected Result**:
- Centralized URL configuration module exists ✅
  - File: `apps/convex/lib/urlConfig.ts`
- Environment detection function present ✅
- App URL generation function present ✅
- Convex URL generation function present ✅
- URL consistency checks pass
- Development URLs match development environment expectations

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 3.4: Configuration Drift Detection

**Objective**: Verify configuration drift detection works

**Steps**:
```bash
# Run environment verification
./scripts/verify-environment.sh
```

**Focus on**: "Checking Configuration Drift" section

**Expected Result**:
- Source of truth file check: ✅
- Local environment files check: ✅
- File modification time comparison performed
- Either:
  - "Local files appear up to date with source of truth" ✅
  - OR "Source of truth modified after local files - consider running sync-env" ⚠️
- Tip displayed: "Run sync-env in dry-run mode to check for drift"

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

### Test Suite 4: Rollback Procedures Documentation

#### Test Case 4.1: Rollback Documentation Exists

**Objective**: Verify rollback procedures documentation is accessible

**Steps**:
```bash
# Check if rollback documentation exists
ls -la docs/deployment/rollback-procedures.md

# View table of contents
head -n 50 docs/deployment/rollback-procedures.md
```

**Expected Result**:
- File exists at `docs/deployment/rollback-procedures.md`
- File contains table of contents with sections:
  1. General Rollback Principles
  2. Cloudflare Pages Rollback
  3. Convex Backend Rollback
  4. Cloudflare Worker Rollback
  5. Configuration Rollback
  6. Incident Response Procedures
  7. Post-Rollback Verification

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 4.2: Rollback Documentation Completeness

**Objective**: Verify all required rollback procedures are documented

**Steps**:
```bash
# Search for key sections
grep -n "## Cloudflare Pages Rollback" docs/deployment/rollback-procedures.md
grep -n "## Convex Backend Rollback" docs/deployment/rollback-procedures.md
grep -n "## Cloudflare Worker Rollback" docs/deployment/rollback-procedures.md
grep -n "## Configuration Rollback" docs/deployment/rollback-procedures.md
grep -n "## Incident Response Procedures" docs/deployment/rollback-procedures.md
```

**Expected Result**:
- All major sections found with line numbers
- Each section contains multiple subsections

**Review Cloudflare Pages Rollback section**:
```bash
# View Cloudflare Pages section
sed -n '/^## Cloudflare Pages Rollback/,/^## /p' docs/deployment/rollback-procedures.md | head -n 100
```

**Expected Content**:
- Method 1: Dashboard Rollback (Recommended)
- Method 2: Git-Based Rollback
- Method 3: Emergency Static Fallback
- Step-by-step instructions for each method
- Expected time estimates

**Review Cloudflare Worker Rollback section**:
```bash
# View Worker section
sed -n '/^## Cloudflare Worker Rollback/,/^## /p' docs/deployment/rollback-procedures.md | head -n 100
```

**Expected Content**:
- Wrangler version rollback
- Durable Objects state management
- Redis backend cleanup procedures
- Worker secrets rollback

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 4.3: Incident Response Decision Matrix

**Objective**: Verify incident response procedures include decision-making guidance

**Steps**:
```bash
# View General Rollback Principles section
sed -n '/^## General Rollback Principles/,/^## /p' docs/deployment/rollback-procedures.md
```

**Expected Result**:
- "When to Rollback" section exists
- "Rollback Decision Matrix" table exists with columns:
  - Issue Severity
  - User Impact
  - Action
  - Timeline
- Pre-Rollback Checklist provided
- Clear criteria for immediate rollback vs investigation

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

### Test Suite 5: Integration Testing

#### Test Case 5.1: Full Deployment Verification Workflow

**Objective**: Execute complete verification workflow as documented

**Steps**:
```bash
# 1. Verify you're in project root
pwd

# 2. Run comprehensive deployment verification
./scripts/verify-deployment.sh development

# 3. If Worker URL available, run detailed Worker check
./scripts/verify-worker-health.sh <WORKER_URL> --verbose

# 4. Run environment validation
./scripts/verify-environment.sh

# 5. Review all output for consistency
```

**Expected Result**:
- All three scripts execute successfully
- No conflicting information between scripts
- Environment detection consistent across scripts
- All scripts agree on URLs and configuration
- Exit codes appropriate (0 for success, non-zero for issues)

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 5.2: Error Handling - Invalid Worker URL

**Objective**: Verify script handles invalid Worker URLs gracefully

**Steps**:
```bash
# Test with invalid URL
./scripts/verify-worker-health.sh https://invalid-worker-url.example.com
```

**Expected Result**:
- Script detects connection failure
- Shows: "❌ Worker not accessible - connection failed"
- Displays: "Cannot proceed with further checks"
- Exits with code 1
- No crash or unhandled errors

**Verify exit code**:
```bash
echo $?  # Should be 1
```

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 5.3: Error Handling - Missing Environment Configuration

**Objective**: Verify scripts handle missing configuration gracefully

**Steps**:
```bash
# Temporarily rename source of truth (if it exists)
if [ -f ~/.env-configs/app.supportsignal.com.au.env ]; then
  mv ~/.env-configs/app.supportsignal.com.au.env ~/.env-configs/app.supportsignal.com.au.env.backup-test
fi

# Run environment verification
./scripts/verify-environment.sh

# Restore source of truth
if [ -f ~/.env-configs/app.supportsignal.com.au.env.backup-test ]; then
  mv ~/.env-configs/app.supportsignal.com.au.env.backup-test ~/.env-configs/app.supportsignal.com.au.env
fi
```

**Expected Result**:
- Script detects missing source of truth
- Shows: "❌ Source of truth configuration not found"
- Provides helpful message: "Run: bun run env:setup"
- Script continues with other checks
- Exit code reflects failure

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

### Test Suite 6: Script Output Quality

#### Test Case 6.1: Colored Output Verification

**Objective**: Verify scripts use colored output correctly

**Steps**:
```bash
# Run any script and observe colors
./scripts/verify-deployment.sh development | cat -v
```

**Expected Result**:
- Green color codes (`\033[0;32m`) for success (✅)
- Yellow color codes (`\033[1;33m`) for warnings (⚠️)
- Red color codes (`\033[0;31m`) for failures (❌)
- Blue color codes (`\033[0;34m`) for section headers
- Colors reset properly (`\033[0m`)

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

#### Test Case 6.2: Summary Report Accuracy

**Objective**: Verify summary reports show accurate counts

**Steps**:
```bash
# Run verification and manually count checks
./scripts/verify-deployment.sh development > test-output.txt 2>&1

# Count checkmarks manually
echo "Manual count of ✅:" && grep -c "✅" test-output.txt
echo "Manual count of ⚠️:" && grep -c "⚠️" test-output.txt
echo "Manual count of ❌:" && grep -c "❌" test-output.txt

# View reported summary
grep -A 5 "Verification Summary" test-output.txt

# Clean up
rm test-output.txt
```

**Expected Result**:
- Summary counts match manual grep counts
- All checks accounted for in summary
- No discrepancies

**Actual Result**: _[To be filled during testing]_

**Status**: ⬜ Pass / ⬜ Fail

---

## Quick Start Testing Guide

### Fastest Way to Test Everything

**Copy and paste this entire block into your terminal**:

```bash
# Navigate to project root
cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au

# Print current location for verification
echo "📍 Current Directory:"
pwd
echo ""

# Test 1: Check scripts exist and are executable
echo "=== Test 1: Script Installation ==="
ls -la scripts/verify-*.sh
echo ""

# Test 2: Run comprehensive deployment verification
echo "=== Test 2: Deployment Verification (Development) ==="
./scripts/verify-deployment.sh development
echo "Exit code: $?"
echo ""

# Test 3: Run environment validation
echo "=== Test 3: Environment Validation ==="
./scripts/verify-environment.sh
echo "Exit code: $?"
echo ""

# Test 4: Check Worker URL availability
echo "=== Test 4: Worker URL Check ==="
if grep -q "NEXT_PUBLIC_LOG_WORKER_URL" apps/web/.env.local 2>/dev/null; then
  WORKER_URL=$(grep "NEXT_PUBLIC_LOG_WORKER_URL" apps/web/.env.local | cut -d'=' -f2 | tr -d '"')
  echo "Found Worker URL: $WORKER_URL"
  echo ""
  echo "=== Test 5: Worker Health Check ==="
  ./scripts/verify-worker-health.sh "$WORKER_URL"
  echo "Exit code: $?"
else
  echo "⚠️  Worker URL not configured - skipping Worker health check"
fi
echo ""

# Test 6: Verify rollback documentation
echo "=== Test 6: Rollback Documentation Check ==="
if [ -f docs/deployment/rollback-procedures.md ]; then
  echo "✅ Rollback documentation exists"
  echo "Line count: $(wc -l < docs/deployment/rollback-procedures.md)"
  echo "Contains sections:"
  grep "^## " docs/deployment/rollback-procedures.md | head -n 10
else
  echo "❌ Rollback documentation not found"
fi
echo ""

echo "=== All Tests Complete ==="
```

---

## UAT Summary Report Template

**Tester Name**: ___________________
**Date**: ___________________
**Environment**: Development / Production _(circle one)_

### Test Results Summary

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| 1. Deployment Verification Scripts | 3 | ___ | ___ | |
| 2. Worker Health Scripts | 3 | ___ | ___ | |
| 3. Environment Validation Scripts | 4 | ___ | ___ | |
| 4. Rollback Documentation | 3 | ___ | ___ | |
| 5. Integration Testing | 3 | ___ | ___ | |
| 6. Script Output Quality | 2 | ___ | ___ | |
| **TOTAL** | **18** | ___ | ___ | |

### Overall Assessment

- [ ] **PASS** - All tests passed, ready for production use
- [ ] **PASS WITH WARNINGS** - Tests passed but warnings noted
- [ ] **FAIL** - Critical issues found, requires fixes

### Critical Issues Found
_[List any blocking issues]_

### Warnings/Minor Issues
_[List any non-blocking issues]_

### Recommendations
_[Any suggestions for improvement]_

### Tester Sign-off
- [ ] I have executed all test cases in this UAT plan
- [ ] I have documented all results accurately
- [ ] I have reviewed the rollback procedures documentation
- [ ] I confirm the deployment verification tools are ready for use

**Signature**: ___________________
**Date**: ___________________

---

## Appendix: Command Reference

### Quick Commands for Testing

```bash
# Get Worker URL from config
grep "NEXT_PUBLIC_LOG_WORKER_URL" apps/web/.env.local | cut -d'=' -f2 | tr -d '"'

# Get Convex URL from config
grep "NEXT_PUBLIC_CONVEX_URL" apps/web/.env.local | cut -d'=' -f2 | tr -d '"'

# Check script permissions
ls -la scripts/verify-*.sh

# Make scripts executable (if needed)
chmod +x scripts/verify-*.sh

# Run all verifications in sequence
./scripts/verify-deployment.sh development && \
./scripts/verify-environment.sh && \
echo "All verifications complete"

# Test Worker health with verbose output
./scripts/verify-worker-health.sh $(grep "NEXT_PUBLIC_LOG_WORKER_URL" apps/web/.env.local | cut -d'=' -f2 | tr -d '"') --verbose

# View rollback documentation sections
grep "^## " docs/deployment/rollback-procedures.md
```

### Troubleshooting

**Issue**: Scripts not executable
**Fix**:
```bash
chmod +x scripts/verify-deployment.sh
chmod +x scripts/verify-worker-health.sh
chmod +x scripts/verify-environment.sh
```

**Issue**: Worker URL not found
**Check**:
```bash
cat apps/web/.env.local | grep LOG_WORKER
```

**Issue**: Source of truth not found
**Fix**:
```bash
# Check if file exists
ls -la ~/.env-configs/app.supportsignal.com.au.env
# If not, run environment setup
bun run sync-env --mode=local
```

---

## Related Documentation

- **Story File**: [docs/stories/8.4.story.md](../../stories/8.4.story.md)
- **Rollback Procedures**: [docs/deployment/rollback-procedures.md](../../deployment/rollback-procedures.md)
- **Deployment Operations Guide**: [docs/deployment/deployment-operations-guide.md](../../deployment/deployment-operations-guide.md) _(if exists)_
- **CI/CD Pipeline Setup**: [docs/technical-guides/cicd-pipeline-setup.md](../../technical-guides/cicd-pipeline-setup.md)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-01
**Created By**: Claude Code (Developer James)
