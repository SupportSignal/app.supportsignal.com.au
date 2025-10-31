# CI Infrastructure Gap: Convex Codegen Authentication Issue

**Date**: October 31, 2025
**Impact**: High - CI pipeline failing on all commits
**Resolution Time**: Identified but not yet fixed
**Status**: ❌ Documented - Requires Infrastructure Work

---

## Incident Summary

**Problem**: CI Test job fails when running `convex codegen` due to missing authentication credentials, blocking all merges to main branch.

**Root Cause**: Convex codegen requires authentication to fetch deployment configuration, but CI pipeline lacks the necessary credentials.

**Impact**: All commits to main branch fail CI, preventing automated deployments and requiring manual verification.

---

## What Happened

### Discovery Timeline

1. **Story 11.0 Completed**: AI Prompt Admin UI refactor merged to main
2. **Lockfile Issue Fixed**: Updated `bun.lock` for @dnd-kit dependencies (commit 10ac7de)
3. **CI Test Job Failing**: "Generate Convex files" step failed with authentication error
4. **Multiple Fix Attempts**: Tried adding NEXT_PUBLIC_CONVEX_URL, then CONVEX_DEPLOYMENT
5. **Authentication Error**: 401 Unauthorized - MissingAccessToken

### Error Manifestation

```bash
$ cd apps/convex && bun run build
$ bun x convex codegen
✖ Error fetching GET https://api.convex.dev/api/deployment/beaming-gull-639/team_and_project 401 Unauthorized: MissingAccessToken: An access token is required for this command.
Authenticate with `npx convex dev`
error: script "build" exited with code 1
```

**CI Impact**: Test job fails before TypeScript checking, blocking entire pipeline

---

## Root Cause Analysis

### CI/CD Workflow Gap

File: `.github/workflows/ci.yml` (Test job, lines 94-98)

```yaml
- name: Generate Convex files
  env:
    CONVEX_DEPLOYMENT: ${{ secrets.CONVEX_DEPLOYMENT }}
  run: |
    cd apps/convex && bun run build
```

**The Gap**: `convex codegen` requires authentication credentials, but CI only has deployment identifier.

### Why Convex Codegen Needs Authentication

The `convex codegen` command:
1. Fetches schema from Convex deployment API
2. Generates TypeScript types in `apps/convex/_generated/`
3. **Requires authentication** to access deployment configuration

**Authentication Methods**:
- Interactive: `npx convex dev` (creates local auth session)
- CI/Automated: `CONVEX_DEPLOY_KEY` environment variable

**Current State**: CI has neither authentication method configured.

### Why This Wasn't Caught Earlier

1. **Convex generated files** (`apps/convex/_generated/`) are gitignored
2. **Local development** works because developers run `npx convex dev`
3. **CI recently started failing** when lockfile updates triggered fresh dependency installs
4. **Pre-existing gap** - not caused by any specific story

---

## Fix Attempts (Unsuccessful)

### Attempt 1: Add NEXT_PUBLIC_CONVEX_URL

```yaml
- name: Generate Convex files
  env:
    NEXT_PUBLIC_CONVEX_URL: ${{ secrets.NEXT_PUBLIC_CONVEX_URL }}
  run: |
    cd apps/convex && bun run build
```

**Result**: ❌ Failed - Still says "No CONVEX_DEPLOYMENT set"

**Why It Failed**: `convex codegen` doesn't use NEXT_PUBLIC_CONVEX_URL

### Attempt 2: Add CONVEX_DEPLOYMENT

```bash
# Added GitHub secret
echo "dev:beaming-gull-639" | gh secret set CONVEX_DEPLOYMENT
```

```yaml
- name: Generate Convex files
  env:
    CONVEX_DEPLOYMENT: ${{ secrets.CONVEX_DEPLOYMENT }}
  run: |
    cd apps/convex && bun run build
```

**Result**: ❌ Failed - "401 Unauthorized: MissingAccessToken"

**Why It Failed**: Deployment identifier alone isn't enough - needs authentication credentials

---

## Proposed Solutions

### Option 1: Add CONVEX_DEPLOY_KEY to CI (Recommended)

**Steps**:

1. **Get Deploy Key** from Convex Dashboard:
   - Go to Convex Dashboard → Settings → Deploy Keys
   - Create new deploy key for development deployment
   - Copy the key

2. **Add GitHub Secret**:
   ```bash
   # Via GitHub CLI
   echo "<deploy-key>" | gh secret set CONVEX_DEPLOY_KEY

   # Or via GitHub UI:
   # Repo → Settings → Secrets → Actions → New repository secret
   # Name: CONVEX_DEPLOY_KEY
   # Value: <paste key>
   ```

3. **Update CI Workflow**:
   ```yaml
   - name: Generate Convex files
     env:
       CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
     run: |
       cd apps/convex && bun run build
   ```

**Pros**:
- ✅ Proper solution using Convex's authentication mechanism
- ✅ Works for all Convex CLI commands
- ✅ Secure (deploy key has limited permissions)

**Cons**:
- ⚠️ Requires Convex dashboard access to create deploy key
- ⚠️ Additional secret to manage

### Option 2: Commit Generated Files to Git

**Steps**:

1. **Remove from .gitignore**:
   ```diff
   - apps/convex/_generated/
   ```

2. **Generate locally and commit**:
   ```bash
   cd apps/convex && bun run build
   git add _generated/
   git commit -m "chore: commit Convex generated files for CI"
   ```

3. **Remove "Generate Convex files" step from CI**:
   ```yaml
   # DELETE these lines from Test job:
   - name: Generate Convex files
     env:
       CONVEX_DEPLOYMENT: ${{ secrets.CONVEX_DEPLOYMENT }}
     run: |
       cd apps/convex && bun run build
   ```

**Pros**:
- ✅ Simple - no authentication needed
- ✅ Faster CI (skips codegen step)
- ✅ Deterministic (same types for all developers)

**Cons**:
- ⚠️ Git churn (generated files change frequently)
- ⚠️ Merge conflicts in generated files
- ⚠️ Developers must remember to regenerate before committing
- ❌ Against Convex best practices (generated files should be ephemeral)

### Option 3: Skip Codegen in Test Job

**Steps**:

1. **Remove "Generate Convex files" from Test job**
2. **Keep it in Build job** (where NEXT_PUBLIC_CONVEX_URL is already set)

**Pros**:
- ✅ Quick fix
- ✅ Test job passes

**Cons**:
- ❌ TypeScript checking happens AFTER tests (wrong order)
- ❌ Build job also fails with authentication error
- ❌ Doesn't actually solve the problem

---

## Recommended Solution

**Use Option 1**: Add CONVEX_DEPLOY_KEY to CI

**Reasoning**:
1. **Proper authentication** - Uses Convex's intended mechanism
2. **Best practices** - Keeps generated files gitignored
3. **Future-proof** - Works for all Convex CLI operations
4. **Secure** - Deploy keys have limited scope

**Implementation Priority**: High (blocking CI)

---

## ACTUAL SOLUTION (Updated October 31, 2025)

After implementing Option 1, discovered additional configuration required:

### The Root Cause

1. **convex codegen requires deployment access** - Not just local schema files
2. **turborepo doesn't propagate env vars by default** - Child processes don't inherit them
3. **Multiple steps need the key** - Both explicit codegen AND typecheck (which triggers codegen)

### Complete Implementation

**Step 1: Add deploy key to GitHub secrets**
```bash
echo "prod:graceful-shrimp-355|{key}" | gh secret set CONVEX_DEPLOY_KEY
```

**Step 2: Update CI workflow** (`.github/workflows/ci.yml`)
```yaml
- name: Generate Convex files
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
  run: cd apps/convex && bun run build

- name: Run type checks
  env:
    CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}  # ALSO needed here!
  run: bun run typecheck
```

**Step 3: Configure turborepo** (`turbo.json`)
```json
{
  "globalEnv": ["CONVEX_DEPLOY_KEY"],  // Make available globally
  "tasks": {
    "build": {
      "env": ["CONVEX_DEPLOY_KEY"]  // Pass to build tasks
    }
  }
}
```

### Key Lessons

1. **Deploy key format includes deployment**: `prod:graceful-shrimp-355|{auth-token}`
   - Safe to use production key for codegen (read-only schema access)
   - Deploy key determines which deployment to target

2. **Turborepo env var propagation**: Must explicitly declare env vars in `turbo.json`
   - `globalEnv`: Makes var available to all tasks
   - Task-level `env`: Passes var to specific task and dependencies

3. **Multiple codegen triggers in CI**:
   - Explicit: "Generate Convex files" step
   - Implicit: typecheck → turborepo → convex-backend:build → codegen
   - Both need CONVEX_DEPLOY_KEY

**Implementation Priority**: ✅ RESOLVED (October 31, 2025)

---

## Prevention Checklist

### Before Merging Changes That Affect CI

- [ ] **Test CI locally**: Use `act` or similar to test GitHub Actions
- [ ] **Verify environment variables**: Check all jobs have required secrets
- [ ] **Monitor first CI run**: Watch pipeline for any failures
- [ ] **Have rollback plan**: Know how to revert if CI breaks

### For Future CI Changes

- [ ] **Document required secrets**: Update CI setup guide
- [ ] **Add secret validation**: Check secrets exist before using them
- [ ] **Use matrix testing**: Test with and without secrets when possible
- [ ] **Alert on failures**: Set up notifications for CI failures

---

## Related Issues

### Lockfile Issue (Related but Separate)

**Problem**: Adding @dnd-kit dependencies without updating `bun.lock`

**Fix**: Upgraded Bun to 1.3.1, regenerated lockfile (commit 10ac7de)

**Lesson**: Always run `bun install` after adding dependencies and commit lockfile changes

### Why Lockfile Issue Surfaced First

1. Story 11.0 added `@dnd-kit` packages to `apps/web/package.json`
2. Lockfile wasn't updated (local Bun 1.2.18 vs CI Bun 1.3.1 version mismatch)
3. CI failed with "lockfile had changes, but lockfile is frozen"
4. After fixing lockfile, Convex codegen issue became visible

**Key Insight**: CI infrastructure issues often hide behind each other - fixing one reveals the next.

---

## Related Documentation

- [CI/CD Pipeline Setup Guide](../technical-guides/cicd-pipeline-setup.md) - Needs update with CONVEX_DEPLOY_KEY
- [Deployment Gap: Convex Backend Not in CI](./deployment-gap-convex-backend-not-in-ci.md) - Related CI gap
- [Testing Infrastructure Lessons Learned](./testing-infrastructure-lessons-learned.md) - CI verification patterns
- [Story 11.0](../stories/11.0.story.md) - Story that surfaced this issue

---

## Technical Details

### Convex Codegen Authentication Flow

**Local Development**:
```bash
# Interactive authentication
npx convex dev
# Creates ~/.convex/config.json with auth session
# convex codegen uses this session
```

**CI/Automated Deployment**:
```bash
# Non-interactive authentication
export CONVEX_DEPLOY_KEY="<deploy-key>"
bunx convex deploy --yes
# Deploy key provides authentication
```

### Required GitHub Secrets

Currently configured:
- ✅ `CLOUDFLARE_API_TOKEN` - Cloudflare Pages deployment
- ✅ `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- ✅ `CLOUDFLARE_PROJECT_NAME` - Pages project name
- ✅ `NEXT_PUBLIC_CONVEX_URL` - Convex backend URL (public)
- ✅ `CONVEX_DEPLOYMENT` - Deployment identifier (dev:beaming-gull-639)
- ✅ `CONVEX_DEPLOY_KEY` - Convex production deploy key (for deploy job)

**Missing** (needed for Test job):
- ❌ Development deployment authentication for codegen

**Options**:
1. Use existing `CONVEX_DEPLOY_KEY` (if it works for dev deployment)
2. Create separate `CONVEX_DEV_DEPLOY_KEY` for development
3. Use single deploy key with access to both dev and prod

---

## Impact Assessment

**Severity**: High (CI completely blocked)
**Duration**: Since commit ec0a8d0 (Story 11.0 TypeScript fixes)
**User Impact**: None (local development unaffected)
**Developer Impact**: High (cannot merge to main, manual verification required)
**Deployment Impact**: High (no automated deployments)

**Business Impact**: Medium (can still deploy manually, but slower process)

**Cost of Delay**: Increases with time (more commits blocked, more manual work)

---

## Follow-Up Actions

### Immediate (This Week)

- [ ] Create Convex development deploy key
- [ ] Add `CONVEX_DEPLOY_KEY` or `CONVEX_DEV_DEPLOY_KEY` to GitHub secrets
- [ ] Update `.github/workflows/ci.yml` to use deploy key
- [ ] Test CI pipeline with non-critical change
- [ ] Verify Test job passes

### Short-Term (Next Sprint)

- [ ] Update [CI/CD Pipeline Setup Guide](../technical-guides/cicd-pipeline-setup.md)
- [ ] Document required secrets for future setup
- [ ] Add secret validation step to CI
- [ ] Create CI troubleshooting runbook

### Long-Term (Ongoing)

- [ ] Consider using Convex GitHub Action (if available)
- [ ] Automate secret rotation
- [ ] Monitor CI success rate
- [ ] Add pre-commit hook to verify lockfile is updated

---

## Lessons Learned

### What Went Wrong

1. **Incomplete CI setup**: Convex codegen needs authentication, but CI lacked it
2. **Hidden dependency**: Lockfile issue masked Convex authentication issue
3. **Insufficient testing**: CI changes weren't tested in isolation
4. **Missing documentation**: Required secrets weren't documented

### What Went Right

1. **Systematic debugging**: Identified lockfile vs authentication as separate issues
2. **KDD process**: Documented issue properly for future reference
3. **Options analysis**: Evaluated multiple solutions before recommending one
4. **No data loss**: Issue only affects CI, not production or data

### Process Improvements

1. **✅ Test CI changes**: Use `act` or similar to test locally
2. **✅ Document secrets**: Update setup guides with all required secrets
3. **✅ Validate environment**: Add checks for required secrets before using
4. **✅ Monitor CI**: Set up alerts for pipeline failures
5. **✅ KDD knowledge capture**: Document infrastructure gaps as they're discovered

---

**Created**: October 31, 2025
**Author**: Claude Code (Sonnet 4.5)
**Reviewed**: Pending
**Status**: Issue Documented - Solution Pending Implementation
