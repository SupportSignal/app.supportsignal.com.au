# DEPLOYMENT FIX PLAN - PRODUCTION CRISIS

**Created**: 2025-10-24
**Status**: ✅ RESOLVED - Production working, CI/CD fix implemented
**Root Cause**: Frontend deployed via CI, Backend did NOT deploy

---

## 🎉 RESOLUTION COMPLETE

**Production Status**: ✅ Working (fixed 2025-10-24)
**Long-term Fix**: ✅ Implemented (CI/CD workflow updated)

**See comprehensive documentation**: `docs/lessons-learned/deployment-gap-convex-backend-not-in-ci.md`

This file is preserved for historical reference showing the initial crisis analysis and planning.

---

## Original Planning Document Below

---

## Current Problem

**Frontend** (Cloudflare Pages): ✅ Story 7.6 code deployed 23 hours ago
**Backend** (Convex): ❌ Story 7.6 functions NOT deployed to production

**Result**: Frontend calling `sites/list:listCompanySites` which doesn't exist → React hydration errors → site crashes

---

## Root Cause Analysis

### CI/CD Workflow Gap

The `.github/workflows/ci.yml` file:
- ✅ **DOES** deploy frontend to Cloudflare Pages (line 197-221)
- ❌ **DOES NOT** deploy backend to Convex

This creates a deployment mismatch where:
1. Code merged to `main`
2. CI runs, deploys frontend automatically
3. Backend deployment forgotten/skipped
4. Production breaks

### Why Manual Deployment Failed

Attempted `convex deploy` multiple times, all failed with:
```
- Deploying to https://graceful-shrimp-355.convex.cloud...
- Bundling modules for Convex's runtime...
[verbose] Flushing and exiting, error: undefined
```

**TypeScript compilation**: ✅ Passes locally
**Bundling**: ❌ Fails with undefined error

---

## Immediate Fix Options

### Option 1: Fix Forward (Deploy Backend)

**Steps**:
1. Stop all running `convex dev` processes
2. Clean any temporary/cache files
3. Try fresh deployment with detailed logging
4. If deployment succeeds, run migration: `bunx convex run migrations:backfillIncidentSites --prod`

**Risks**:
- Bundling error might persist
- Could waste time debugging instead of fixing

**Timeline**: Unknown (could be 10 minutes or 2 hours)

### Option 2: Rollback Frontend

**Steps**:
1. Find last commit before Story 7.6: `git log --oneline | grep -B1 "feat(Story 7.6)"`
2. Checkout that commit's `apps/web/dist` folder
3. Manually redeploy to Cloudflare Pages with that build
4. Verify production stops crashing

**Risks**:
- Loses Story 7.6 functionality
- Might cause other issues if data was created with new schema

**Timeline**: 15-30 minutes

### Option 3: Quick Patch Frontend

**Steps**:
1. Temporarily remove/comment out the `sites/list:listCompanySites` query from frontend
2. Hardcode/skip site selection temporarily
3. Deploy patched frontend
4. Fix backend deployment later when less urgent

**Risks**:
- Creates technical debt
- Still need to fix backend deployment eventually

**Timeline**: 20-40 minutes

---

## Recommended Immediate Action

**CHOOSE Option 2: Rollback Frontend**

**Reasoning**:
1. **Fastest path to stability** - we know rollback will work
2. **Preserves dev environment** - Story 7.6 still works locally for testing
3. **Buys time** - can debug Convex deployment without production pressure
4. **Safe** - returns to last known good state

**Action Items**:
```bash
# 1. Find last good commit
git log --oneline | grep -B5 "feat(Story 7.6)"

# 2. Checkout that commit (example)
git checkout <commit-hash> -- apps/web/dist

# 3. Deploy to Cloudflare Pages
cd apps/web && bun run pages:deploy

# 4. Verify production is stable
# 5. Return to main branch
git checkout main
```

---

## Long-Term Fix: Add Convex Deployment to CI

### Add to `.github/workflows/ci.yml`

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
          bunx convex deploy --yes

  # Make frontend deployment depend on backend deployment
  deploy:
    name: Deploy to Cloudflare Pages
    runs-on: ubuntu-latest
    needs: [build, test-e2e, deploy-convex]  # ADD deploy-convex dependency
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    # ... rest of existing deploy job
```

### Required GitHub Secrets

Add to repository secrets:
- `CONVEX_DEPLOY_KEY`: Deployment key from Convex dashboard

### Implementation Steps

1. **Get Convex Deploy Key**:
   - Go to Convex dashboard → Settings → Deploy Keys
   - Create new deploy key for production
   - Copy the key

2. **Add GitHub Secret**:
   - GitHub repo → Settings → Secrets and variables → Actions
   - New repository secret
   - Name: `CONVEX_DEPLOY_KEY`
   - Value: <paste key>

3. **Update CI Workflow**:
   - Add `deploy-convex` job as shown above
   - Make `deploy` job depend on `deploy-convex`

4. **Test**:
   - Create test branch
   - Make small change
   - Push to main
   - Verify both Convex and Cloudflare Pages deploy

---

## Prevention Checklist

Before marking any story complete:

- [ ] **Verify CI includes ALL deployment targets**
- [ ] **Check production deployment status** (not just CI status)
- [ ] **Manually verify production after merge** (quick smoke test)
- [ ] **Document any manual deployment steps** in story completion notes

---

## Decision Required

**Which immediate fix option do you want to proceed with?**

1. **Option 1**: Try to debug and deploy Convex backend (unknown timeline)
2. **Option 2**: Rollback frontend to last stable version (15-30 min)
3. **Option 3**: Quick patch frontend to remove failing queries (20-40 min)

**Recommendation**: Option 2 (Rollback)
