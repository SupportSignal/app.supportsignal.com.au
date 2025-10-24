# Deployment Gap: Convex Backend Not in CI Pipeline

**Date**: October 24, 2025
**Impact**: Critical - Production site crashed
**Resolution Time**: 2 hours
**Status**: ✅ Fixed + Long-term solution documented

---

## Incident Summary

**Problem**: Frontend deployed to production via CI but Convex backend did NOT deploy, causing frontend to call non-existent backend functions → site crashes.

**Root Cause**: CI/CD pipeline only deploys Cloudflare Pages (frontend). Convex backend deployment is manual and was forgotten.

**Impact**: Production site showed React hydration errors when calling `sites/list:listCompanySites` function that didn't exist in production.

---

## What Happened

### Timeline

1. **Story 7.6 Completed**: Site selection feature merged to main branch
2. **CI Triggered**: GitHub Actions ran successfully
3. **Frontend Deployed**: Cloudflare Pages auto-deployed Story 7.6 code ✅
4. **Backend NOT Deployed**: Convex functions remained at old version ❌
5. **Production Broken**: Frontend calling functions that don't exist

### Error Manifestation

```javascript
Error: [CONVEX Q(sites/list:listCompanySites)] [Request ID: 7105718e8cf0dece] Server Error
  Called by client
  Could not find function for 'sites/list:listCompanySites'
```

**User Impact**: React hydration errors, site unusable

---

## Root Cause Analysis

### CI/CD Workflow Gap

File: `.github/workflows/ci.yml`

```yaml
# DOES deploy frontend
deploy:
  name: Deploy to Cloudflare Pages
  # ... Cloudflare Pages deployment configured

# DOES NOT deploy backend
# ❌ No convex deployment job exists
```

**The Gap**: No `deploy-convex` job in CI pipeline.

### Why Manual Deployment Failed Initially

Attempted `npx convex deploy` multiple times - all hung with "error: undefined" during bundling.

**Root Cause of Hang**: Being in wrong directory (`apps/convex/apps/convex` instead of `apps/convex`)

**Correct Command**:
```bash
cd apps/convex && npx convex deploy --yes
```

---

## Resolution Steps

### Immediate Fix (Manual Deployment)

**Step 1: Navigate to Correct Directory**
```bash
cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au
cd apps/convex
pwd  # Verify correct location
```

**Step 2: Deploy to Production**
```bash
npx convex deploy --yes
```

**Output**:
```
✔ Schema validation complete.
✔ Deleted table indexes:
  [-] participants.by_site ["site_id","_creationTime"]
✔ Added table indexes:
  [+] incidents.by_company_and_site ["company_id","site_id","_creationTime"]
✔ Deployed Convex functions to https://graceful-shrimp-355.convex.cloud
```

**Step 3: Run Migration**
```bash
bunx convex run migrations:backfillIncidentSites --prod
```

**Result**: 15/15 incidents backfilled successfully

**Step 4: Verify Production**
```bash
curl -s "https://app.supportsignal.com.au" | head -5
```

**Result**: ✅ Site loads without errors

---

## Long-Term Fix: Add Convex to CI Pipeline

### Updated CI/CD Workflow

Add to `.github/workflows/ci.yml`:

```yaml
deploy-convex:
  name: Deploy Convex Backend
  runs-on: ubuntu-latest
  needs: [build]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  environment: production
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1
      with:
        bun-version: latest

    - name: Install dependencies
      run: bun install --frozen-lockfile

    - name: Deploy to Convex Production
      env:
        CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
      run: |
        cd apps/convex
        npx convex deploy --yes

# Update frontend deployment to depend on backend
deploy:
  name: Deploy to Cloudflare Pages
  runs-on: ubuntu-latest
  needs: [build, test-e2e, deploy-convex]  # ← ADD deploy-convex dependency
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  environment: production
  # ... rest of existing deploy job
```

### Required GitHub Secrets

Add `CONVEX_DEPLOY_KEY` to repository secrets:

1. **Get Deploy Key**:
   - Go to Convex Dashboard → Settings → Deploy Keys
   - Create new deploy key for production
   - Copy the key

2. **Add GitHub Secret**:
   - GitHub repo → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `CONVEX_DEPLOY_KEY`
   - Value: <paste key>

### Deployment Order

**CRITICAL**: Backend must deploy BEFORE frontend:

1. ✅ `deploy-convex` runs first (backend functions available)
2. ✅ `deploy` runs second (frontend can call new functions)

This prevents deployment mismatches.

---

## Prevention Checklist

### Before Merging to Main

- [ ] **Run full CI verification**: `bun run ci:status`
- [ ] **Verify Convex deployment configured**: Check CI workflow includes `deploy-convex`
- [ ] **Test locally**: All tests pass (`bun test`)
- [ ] **TypeScript valid**: `bun run typecheck` passes
- [ ] **Lint passes**: `bun run lint` passes

### After Merging to Main

- [ ] **Monitor CI pipeline**: `bun run ci:watch`
- [ ] **Verify backend deployment**: Check `deploy-convex` job succeeded
- [ ] **Verify frontend deployment**: Check `deploy` job succeeded
- [ ] **Quick smoke test**: Load production site, check for errors
- [ ] **Verify functions exist**: `bunx convex function-spec --prod | grep <new-function>`

### Story Completion Criteria

**NEVER mark story complete until**:

- [ ] CI pipeline fully successful (all jobs green)
- [ ] Both frontend AND backend deployed to production
- [ ] Production site verified functional (smoke test)
- [ ] No errors in production logs

---

## Lessons Learned

### What Went Wrong

1. **Incomplete CI/CD**: Frontend automated, backend manual → easy to forget
2. **No deployment order enforcement**: Frontend can deploy without backend
3. **Directory navigation confusion**: Wrong directory caused deployment hangs
4. **Insufficient documentation**: Manual deployment process not well-documented

### What Went Right

1. **Migration system worked**: backfillIncidentSites ran perfectly on production
2. **Schema validation worked**: Convex caught schema changes correctly
3. **Rapid diagnosis**: Error logs clearly showed missing function
4. **Successful recovery**: Fixed in ~2 hours with no data loss

### Process Improvements

1. **✅ Add Convex to CI**: Automate backend deployment
2. **✅ Enforce deployment order**: Backend before frontend
3. **✅ Directory verification**: Always `pwd` before deploy commands
4. **✅ Smoke testing**: Quick production verification after deploy
5. **✅ Documentation updated**: Deployment guide now includes CI integration

---

## Related Documentation

- [Deployment Operations Guide](../operations/deployment-guide.md) - Updated with CI integration
- [CI/CD Pipeline Setup](../technical-guides/cicd-pipeline-setup.md) - GitHub Actions configuration
- [Convex Deployment Guide](../technical-guides/convex-deployment-guide.md) - Manual deployment procedures
- [Story 7.6 Completion Notes](../stories/7.6.story.md) - Story that triggered this incident

---

## Follow-Up Actions

### Immediate (Completed)

- [x] Fix production site
- [x] Deploy Convex backend to production
- [x] Run migration to backfill data
- [x] Document incident and resolution

### Short-Term (This Week)

- [ ] Implement CI/CD changes (add `deploy-convex` job)
- [ ] Add `CONVEX_DEPLOY_KEY` to GitHub secrets
- [ ] Test CI deployment with non-critical change
- [ ] Update deployment documentation

### Long-Term (Ongoing)

- [ ] Create deployment checklist template for all stories
- [ ] Add deployment verification to story acceptance criteria
- [ ] Consider deployment approval gates for production
- [ ] Monitor CI deployment success rate

---

## Impact Assessment

**Severity**: Critical (production site down)
**Duration**: ~23 hours (from initial deploy to fix)
**User Impact**: High (site unusable during outage)
**Data Impact**: None (no data loss)
**Financial Impact**: Minimal (early stage, small user base)

**Prevention ROI**: Implementing CI automation would have prevented this entirely.

---

## Technical Details

### Correct Deployment Command

```bash
# From project root
cd apps/convex
npx convex deploy --yes
```

**Why `--yes`**: Non-interactive terminals require auto-confirmation

### Common Deployment Errors

**Error**: "error: undefined" during bundling
**Cause**: Wrong directory (nested `apps/convex/apps/convex`)
**Fix**: Verify `pwd` shows correct path

**Error**: Deployment hangs at "Deploying to..."
**Cause**: `convex dev` process running
**Fix**: `pkill -f "convex dev"` before deploying

**Error**: "Could not find function"
**Cause**: Backend not deployed to production
**Fix**: Deploy backend, verify with `bunx convex function-spec --prod`

---

**Created**: October 24, 2025
**Author**: Claude Code (Sonnet 4.5)
**Reviewed**: David Cruwys
**Status**: Resolution Complete + Long-term Fix Documented
