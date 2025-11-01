# Cloudflare Dual Deployment Issue - KDD

**Created**: 2025-11-01
**Story Context**: Story 11.0 - Production deployment blocked by dual deployment system
**Impact**: Production unable to receive updates despite successful CI builds

## Problem Signature

**Symptoms**:
- GitHub Actions CI shows ✅ SUCCESS
- Cloudflare Pages shows TWO deployments per commit
- One deployment succeeds (from GitHub Actions)
- One deployment fails with "No deployment available"
- Production domain stuck on old build
- Browser shows stale data despite backend updates

**Example Console Output**:
```
# Cloudflare Dashboard shows:
- Deployment 1: ✅ c798e0ad (GitHub Actions)
- Deployment 2: ❌ "No deployment available" (Auto-deploy)
```

## Root Cause

**Dual Deployment System Conflict**:

1. **GitHub Actions Deployment** (via `.github/workflows/deploy.yml`):
   - Uses `bun install`
   - Builds successfully
   - Uploads to Cloudflare Pages via Wrangler CLI
   - ✅ Creates working deployment artifact

2. **Cloudflare Auto-Deploy** (via Git integration):
   - Uses `npm install` (hardcoded by Cloudflare)
   - Fails with peer dependency conflicts:
     ```
     npm error ERESOLVE unable to resolve dependency tree
     npm error peer next@">=14.3.0 && <=15.5.2" from @cloudflare/next-on-pages@1.13.16
     npm error Found: next@14.2.15
     ```
   - ❌ Creates failed deployment entry

**Key Issue**: Even though GitHub Actions succeeds, production doesn't auto-promote to the working deployment.

## Time Comparison

**With Dual Deployments (Broken)**:
- ❌ 6+ hours of investigation
- ❌ Production stuck on old build
- ❌ Users seeing stale data
- ❌ Confusion about which deployment is active

**With Single Deployment Source (Fixed)**:
- ✅ Clear deployment pipeline
- ✅ Production auto-updates from CI
- ✅ Predictable deployment behavior
- ✅ No npm vs bun conflicts

## Solution: Disable Cloudflare Auto-Deploy

### Immediate Fix (Manual Promotion)

Since deployment `c798e0ad` already exists and succeeded:

1. Cloudflare Dashboard → Workers & Pages → Your Project
2. Deployments tab → Find deployment `c798e0ad`
3. Manage deployment → Promote to production
4. Verify production updates

### Permanent Fix (Disable Auto-Deploy)

**Cloudflare Dashboard Steps**:

1. Navigate to: **Workers & Pages** → **Project** → **Settings**
2. Find: **"Builds & deployments"** section
3. Action: **Pause builds** or **Disable automatic Git deployments**
4. Save changes

**Result**: Only GitHub Actions will trigger deployments (using bun successfully).

### Verification

After disabling auto-deploy:

```bash
# Push a test commit
echo "# Deployment Test" >> README.md
git add README.md
git commit -m "test: verify single deployment source"
git push

# Monitor CI
bun run ci:watch

# Check Cloudflare Pages
# Should see: ONE deployment per commit (from GitHub Actions)
# Should NOT see: Dual deployments or failed auto-deploy
```

## Prevention Strategies

### 1. Document Deployment Architecture

**Update deployment documentation** to clarify:
- GitHub Actions is the ONLY deployment source
- Cloudflare auto-deploy must remain disabled
- Why: npm peer dependency conflicts vs bun success

**File**: `docs/template-usage/new-repository-setup-guide.md`

Add warning in Step 8 (Cloudflare Pages Deployment):

```markdown
⚠️ **CRITICAL**: After initial Cloudflare Pages setup:

1. Disable automatic Git deployments in Cloudflare dashboard
2. Rely solely on GitHub Actions for deployments
3. Reason: Cloudflare uses npm (conflicts), GitHub Actions uses bun (works)

See: docs/lessons-learned/cloudflare-dual-deployment-kdd.md
```

### 2. Add Deployment Verification to Story Checklist

Before marking stories complete, verify:

```bash
# Check CI succeeded
bun run ci:status

# Verify SINGLE deployment in Cloudflare
# - Should see ONE deployment per commit
# - Should see deployment from GitHub Actions
# - Should NOT see failed auto-deploy entry
```

### 3. Monitor for Dual Deployments

If you ever see TWO deployments for one commit:
- 🚨 **Red flag**: Auto-deploy was re-enabled
- **Action**: Disable it immediately in Cloudflare dashboard
- **Investigate**: Why it was re-enabled (accidental setting change?)

## Key Learnings

1. **Build Tool Consistency**: Cloudflare auto-deploy uses npm, our project requires bun
2. **Deployment Sources**: Multiple deployment sources create confusion and conflicts
3. **Production Updates**: Successful CI ≠ Production updated (manual promotion may be needed)
4. **Verification Protocol**: Always check Cloudflare dashboard deployment list, not just CI status

## Diagnostic Commands

**Check CI Status**:
```bash
bun run ci:status
```

**Verify Latest Commit**:
```bash
git log -1 --oneline
```

**Expected Pattern** (After Fix):
- ✅ ONE deployment per commit in Cloudflare
- ✅ Deployment source: GitHub Actions (via Wrangler)
- ✅ Build uses: bun install
- ✅ Production auto-promotes to latest successful deployment

**Red Flag Pattern** (Dual Deployment Active):
- ❌ TWO deployments per commit
- ❌ One from GitHub Actions (succeeds)
- ❌ One from auto-deploy (fails with npm error)
- ❌ Production stuck on old build

## Related Documentation

- **Primary Guide**: `docs/template-usage/new-repository-setup-guide.md` (Step 8)
- **CI/CD Setup**: `docs/template-usage/technical-guides/cicd-pipeline-setup.md`
- **Deployment Troubleshooting**: `docs/technical-guides/cloudflare-pages-deployment-troubleshooting.md`

## Tags

`#deployment` `#cloudflare` `#cicd` `#build-tools` `#npm` `#bun` `#production-issues`
