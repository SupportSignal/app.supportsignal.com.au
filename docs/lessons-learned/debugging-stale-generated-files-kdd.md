# Debugging Stale Generated Files - KDD

**Context**: Story 11.0 - Production deployment showed empty `api.promptGroups` despite backend having data
**Discovered**: 2025-11-01
**Status**: Root cause identified, fix deployed (awaiting verification)

## Problem Signature

**Symptoms indicating stale generated files:**
- ✅ **Server has data** (verified via CLI: `bunx convex run promptGroups:listGroups` returns results)
- ✅ **Browser shows empty** (console: `apiKeys: Array(0)`, `hasListGroups: false`)
- ✅ **Local dev works fine** (development environment shows data correctly)
- ✅ **Production build broken** (only production deployment affected)
- ✅ **No errors in logs** (code runs, just returns empty results)

**This pattern indicates file resolution issues, NOT:**
- API endpoint failures (would show errors)
- Authentication issues (would show 401/403)
- Database problems (CLI queries work)
- Deployment failures (build succeeds)

## Root Cause Analysis Protocol

### Step 1: Verify File Locations (FIRST THING TO CHECK)

```bash
# Find ALL generated API files in the project
find . -name "_generated" -type d

# Check for multiple api.d.ts files
find . -name "api.d.ts" -type f

# Expected output for Convex projects:
# ./apps/convex/_generated        ← CORRECT (updated by convex codegen)
# ./apps/web/convex/_generated    ← STALE (if exists = problem!)
```

**RED FLAG**: If you find multiple `_generated` directories, you have stale files.

### Step 2: Check File Timestamps

```bash
# Compare timestamps of generated files
ls -la apps/convex/_generated/api.d.ts
ls -la apps/web/convex/_generated/api.d.ts  # If this exists

# Example output revealing stale files:
# -rw-r--r--  1 user  staff  7882  2 Oct 16:14  ← 2 MONTHS OLD!
# -rw-r--r--  1 user  staff  9123  1 Nov 05:20  ← CURRENT
```

**RED FLAG**: If timestamps differ by days/weeks/months, stale files are overriding fresh ones.

### Step 3: Compare File Sizes and Contents

```bash
# Quick size comparison
wc -l apps/web/convex/_generated/api.d.ts apps/convex/_generated/api.d.ts

# Check if specific modules exist in BOTH files
grep "promptGroups" apps/web/convex/_generated/api.d.ts
grep "promptGroups" apps/convex/_generated/api.d.ts

# Compare structure
diff apps/web/convex/_generated/api.d.ts apps/convex/_generated/api.d.ts | head -50
```

**RED FLAG**: Different file sizes or missing modules = stale file is being used.

### Step 4: Verify Import Resolution

```bash
# Check tsconfig path aliases
cat apps/web/tsconfig.json | grep -A 10 "paths"

# Example correct configuration:
# "@/convex/*": ["../convex/*"]   ← Points to apps/convex

# But local files override path aliases!
# If apps/web/convex/_generated/ exists, it takes precedence
```

**Key Understanding**: TypeScript path aliases don't prevent local files from shadowing the alias target.

## The Fix Pattern

### Immediate Fix

```bash
# 1. Delete stale generated files
rm -rf apps/web/convex/_generated/

# 2. Add to .gitignore to prevent reoccurrence
echo "# Convex generated files (use ../convex/_generated instead)" >> apps/web/.gitignore
echo "convex/_generated/" >> apps/web/.gitignore

# 3. Verify only one _generated directory exists
find . -name "_generated" -type d
# Should show ONLY: ./apps/convex/_generated
```

### Verification

```bash
# After fix is deployed, browser console should show:
# - apiKeys: Array(N) where N > 0
# - hasListGroups: true
# - All expected modules present in api object
```

## Why This Happens

### Common Scenarios

1. **Old Development Workflow**: Project previously generated files in web app directory
2. **Migration Issues**: Changed build process but didn't clean old files
3. **Copy-Paste Errors**: Developer copied files for debugging and forgot to delete
4. **Build System Changes**: Monorepo restructuring left orphaned files

### Why It's Hard to Spot

- ✅ TypeScript doesn't warn (both files are valid)
- ✅ Local dev works (both files might be in sync locally)
- ✅ CI passes (builds successfully)
- ✅ Deployment succeeds (no errors)
- ✅ Only runtime behavior reveals the issue

## Prevention Strategies

### .gitignore Configuration

```gitignore
# In apps/web/.gitignore
convex/_generated/
```

This ensures stale files don't get committed.

### Build Process Validation

Add to CI pipeline:
```yaml
- name: Verify no duplicate generated files
  run: |
    # Check for generated files in web app
    if [ -d "apps/web/convex/_generated" ]; then
      echo "❌ ERROR: Stale generated files found in apps/web/convex/_generated/"
      echo "These should only exist in apps/convex/_generated/"
      exit 1
    fi
```

### Documentation

```typescript
// In apps/web/components that import Convex API, add comment:
/**
 * IMPORTANT: This imports from apps/convex/_generated/api via path alias.
 * DO NOT create local copies in apps/web/convex/_generated/ - they will
 * override the path alias and cause production issues.
 */
import { api } from '@/convex/_generated/api';
```

## Debugging Time Comparison

### Without This Protocol (What We Did)
- **Total Time**: ~3 hours
- **Approaches Tried**:
  - CI job reordering (wrong)
  - Deployment propagation delays (wrong)
  - Cloudflare caching issues (wrong)
  - Build environment variables (wrong)
- **Root Cause Found**: After user frustration and multiple failed deployments

### With This Protocol (What We Should Have Done)
- **Total Time**: ~2 minutes
- **Steps**:
  1. `find . -name "_generated" -type d` → Found 2 directories
  2. `ls -la apps/web/convex/_generated/` → Saw October 2nd timestamps
  3. `grep promptGroups` → Missing in stale file
  4. `rm -rf apps/web/convex/_generated/` → Fixed
- **Result**: Immediate root cause identification

## Lessons Learned

### 1. Trust Data, Not Assumptions
- ❌ "The path alias should work" (assumption)
- ✅ "Let me verify WHERE the file is actually loaded from" (data)

### 2. Simple Before Complex
- ❌ Starting with CI job ordering, deployment timing, caching
- ✅ Starting with file locations, timestamps, contents

### 3. Follow the Data Flow
```
Browser shows empty → What file is browser loading?
                    → Are there multiple versions of this file?
                    → Which version is newer?
                    → Why is old version being used?
```

### 4. Occam's Razor
The simplest explanation is usually correct:
- Complex: "Race condition in deployment propagation affecting specific API modules"
- Simple: "Browser is loading an old file"

## When to Apply This Protocol

**Immediate triggers:**
- Server has data (CLI queries work) but browser shows empty
- Local dev works but production doesn't
- Generated/compiled code behaves differently than expected
- No errors in logs but missing functionality
- "It should work based on configuration" situations

**General rule:** When there's a mismatch between what SHOULD happen (based on code/config) and what DOES happen (observed behavior), check for:
1. Stale files
2. Wrong files
3. Cached files
4. Shadow copies

Only AFTER ruling these out, investigate complex issues like timing, concurrency, or environment-specific bugs.

## Related Patterns

- **Stale node_modules**: Similar issue, different directory (`rm -rf node_modules && npm install`)
- **Cached builds**: Browser caching old bundles (hard refresh, cache busting)
- **Shadow dependencies**: Multiple versions of same package (check `npm ls <package>`)
- **Path resolution conflicts**: Local files overriding node_modules (check import resolution)

## Success Metrics

After applying this protocol:
- ✅ Root cause identified in < 5 minutes
- ✅ No wasted deployments testing wrong hypotheses
- ✅ Clear understanding of file resolution behavior
- ✅ Prevention measures in place (.gitignore, CI checks)

## Example Output

### Before Protocol Application
```
Console: apiKeys: Array(0), hasListGroups: false
Developer: "Must be deployment propagation delay, let me add 30s wait..."
Result: Still broken after 3 deployments
```

### After Protocol Application
```bash
$ find . -name "_generated" -type d
./apps/convex/_generated
./apps/web/convex/_generated  ← STALE!

$ ls -la apps/web/convex/_generated/
-rw-r--r--  1 user  staff  7882  2 Oct 16:14 api.d.ts  ← 2 months old

$ rm -rf apps/web/convex/_generated/
Result: Fixed immediately
```

## Template for Future Issues

When investigating "server has data, browser shows empty":

```bash
# Stale Files Check (Run this FIRST)
find . -name "_generated" -type d
find . -name "api.d.ts" -type f
ls -la apps/web/convex/_generated/ 2>/dev/null || echo "No stale files"
ls -la apps/convex/_generated/

# If multiple locations found:
diff apps/web/convex/_generated/api.d.ts apps/convex/_generated/api.d.ts

# If stale files found:
rm -rf apps/web/convex/_generated/
echo "convex/_generated/" >> apps/web/.gitignore
git add -A && git commit -m "fix: Remove stale generated files"
```

---

**Remember**: The most sophisticated debugging technique is checking if you're looking at the right file.
