# CI/Environment Debugging Methodology

*Systematic approach derived from complex CI debugging session*

## Overview

This methodology provides a structured approach to debugging CI failures, particularly those involving environment differences, module resolution issues, and build configuration problems.

## The Debugging Framework

### Phase 1: Rapid Assessment (5-10 minutes)

#### 1.1 Establish the Baseline
```bash
# Check if it works locally
npm run build && npm run typecheck && npm run lint

# Document current working state
git log --oneline -1
git status
```

#### 1.2 Categorize the Failure
- ✅ **Works locally, fails in CI** → Environment difference
- ❌ **Fails locally and CI** → Code/configuration issue  
- 🔄 **Intermittent failures** → Race condition or flaky dependency
- 📦 **New dependency issues** → Package resolution problem

#### 1.3 Get CI Failure Details
```bash
# Get specific failure logs
gh run list --branch main --limit 1
gh run view {run-id} --log-failed

# Look for key patterns:
# - Module resolution errors
# - TypeScript compilation failures  
# - Missing dependencies
# - Permission issues
```

### Phase 2: Environment Analysis (10-15 minutes)

#### 2.1 Compare Environments
```bash
# Local versions
node --version
npm --version  # or bun --version
tsc --version

# CI versions (check workflow file or logs)
# Look for version mismatches
```

#### 2.2 Dependency Resolution Audit
```bash
# Local dependency tree
npm ls problem-package

# Check lock file consistency
git status # Look for package-lock.json changes

# Verify workspace dependencies
npm ls | grep workspace
```

#### 2.3 Configuration Consistency Check
```bash
# Compare configurations that might differ
diff local-config ci-config

# Check for environment-specific files
find . -name "*.local.*" -o -name "*.ci.*"
```

### Phase 3: Hypothesis Formation (5 minutes)

Based on Phase 2 analysis, form specific hypotheses:

#### Common Hypothesis Patterns

**H1: Module Resolution Context Mismatch**
- Symptoms: `Cannot find module` errors that work locally
- Investigation: Cross-package imports, symlinks, path mappings

**H2: TypeScript Configuration Split**  
- Symptoms: Different TypeScript errors in CI vs local
- Investigation: Multiple tsconfig files, different include/exclude patterns

**H3: Environment Variable Dependencies**
- Symptoms: Runtime or build-time missing configuration
- Investigation: .env files, CI environment variables

**H4: Build Tool Version Differences**
- Symptoms: Different build outputs or compilation errors
- Investigation: Lock file inconsistencies, cache differences

### Phase 4: Targeted Investigation (15-30 minutes)

#### 4.1 For Module Resolution Issues

```bash
# Trace module resolution
tsc --traceResolution | grep failing-module

# Check symlinks and cross-package references
find . -type l -ls
grep -r "import.*\.\./\. ../packages" --include="*.ts"

# Verify package boundaries
ls -la node_modules/workspace-package
```

#### 4.2 For TypeScript Configuration Issues

```bash
# Show effective configuration
tsc --showConfig

# List files being processed
tsc --listFiles | head -20

# Compare configs
diff tsconfig.json tsconfig.ci.json
```

#### 4.3 For Build Pipeline Issues

```bash
# Check build order dependencies
cat turbo.json | jq '.pipeline'

# Verify build inputs/outputs
ls -la dist/ .next/ build/

# Check cache consistency
npm run clean && npm run build
```

### Phase 5: Hypothesis Testing (10-20 minutes per hypothesis)

#### 5.1 Create Minimal Reproduction

```bash
# Create isolated test case
mkdir debug-reproduction
cd debug-reproduction
# Copy minimal files that reproduce the issue
```

#### 5.2 Test Single Variable Changes

```bash
# Test one change at a time
git checkout -b test-hypothesis-1
# Make single focused change
git commit -m "test: hypothesis 1 - module resolution fix"
git push origin test-hypothesis-1
# Check CI result
```

#### 5.3 Document Test Results

```markdown
## Hypothesis Testing Log

### H1: Module Resolution Context Mismatch
- **Change**: Removed symlink, added proper package export
- **Result**: ✅ Fixed - CI now passes
- **Evidence**: No more "Cannot find module" errors

### H2: TypeScript Configuration Split
- **Change**: Unified tsconfig.json
- **Result**: ✅ Improved - Consistent behavior
- **Evidence**: Same files processed in all contexts
```

### Phase 6: Solution Implementation (20-40 minutes)

#### 6.1 Create Safety Net

```bash
# Record rollback point
git log --oneline -1 > rollback-commit.txt
echo "Rollback point: $(cat rollback-commit.txt)"

# Create feature branch
git checkout -b fix-ci-environment-issue
```

#### 6.2 Implement Systematic Fix

**Priority Order**:
1. **Structural fixes** (architecture, configuration)
2. **Dependency fixes** (package.json, lock files)  
3. **Code fixes** (imports, exports)
4. **CI configuration fixes** (workflow files)

#### 6.3 Validate Fix Comprehensively

```bash
# Local validation
npm run clean
npm install
npm run build && npm run typecheck && npm run lint

# CI validation
git push origin fix-ci-environment-issue
# Monitor CI logs
```

## Advanced Debugging Techniques

### Deep Module Resolution Analysis

```bash
# Create resolution trace file
tsc --traceResolution > resolution-trace.log 2>&1

# Analyze patterns
grep "Resolution for module" resolution-trace.log
grep "Module name.*was successfully resolved" resolution-trace.log
grep "Module name.*was not resolved" resolution-trace.log
```

### Environment Reproduction Locally

```bash
# Simulate CI environment locally
docker run -it node:18-alpine sh
# Or use exact CI container
docker run -it --rm -v $(pwd):/app -w /app ubuntu:latest

# Install exactly CI versions
npm install --exact
```

### Build Artifact Analysis

```bash
# Compare build outputs
diff -r local-build/ ci-build/

# Check generated types
find . -name "*.d.ts" -newer reference-file
```

## Common Issue Patterns & Solutions

### Pattern 1: Symlink Module Resolution

**Symptoms**:
```
Module '"convex/server"' has no exported member 'defineSchema'
```

**Investigation**:
```bash
ls -la apps/web/convex  # Check if symlink exists
file apps/web/convex    # Verify symlink target
```

**Solution**:
```bash
# Remove symlink
rm apps/web/convex

# Add proper package export
echo '{"exports": {".": "./_generated/api.js"}}' > apps/convex/package.json

# Update imports
sed -i 's|../convex/api|convex-backend|g' apps/web/**/*.ts
```

### Pattern 2: Split TypeScript Configuration

**Symptoms**:
```
Different TypeScript errors between local and CI
ESLint doesn't catch build issues
```

**Investigation**:
```bash
find . -name "tsconfig*.json"
diff tsconfig.json tsconfig.src.json
```

**Solution**:
```bash
# Unify configurations
cp tsconfig.json tsconfig.backup.json
# Merge configurations to single file
rm tsconfig.src.json
# Update package.json scripts
```

### Pattern 3: Package Boundary Violations

**Symptoms**:
```
Compilation includes files from other packages
Circular dependency warnings
```

**Investigation**:
```bash
tsc --listFiles | grep "../"
grep -r "import.*\.\./\.\." . --include="*.ts"
```

**Solution**:
```bash
# Add proper excludes
echo '"exclude": ["../other-packages/**/*"]' # Add to tsconfig.json
# Create stub types for cross-package imports
```

## Prevention Strategies

### 1. Environment Parity Enforcement

```yaml
# .github/workflows/ci.yml
- uses: actions/setup-node@v3
  with:
    node-version-file: '.nvmrc'  # Ensure version consistency
    
- name: Install dependencies
  run: npm ci  # Use exact lock file versions
```

### 2. Configuration Validation

```bash
# Add to package.json scripts
"validate-config": "tsc --showConfig | jq '.compilerOptions'"
"check-boundaries": "npm run typecheck && npm run build"
```

### 3. Proactive Monitoring

```bash
# Add CI checks
"ci-check": "npm run validate-config && npm run check-boundaries"

# Regular audits
"audit-deps": "npm audit && npm ls"
```

## Debugging Checklist

### Before You Start
- [ ] Document current working commit
- [ ] Verify issue exists (run CI locally if possible)
- [ ] Check recent changes that might have caused issue
- [ ] Estimate time investment (bail out if > 2 hours without progress)

### During Investigation  
- [ ] Form specific hypotheses before making changes
- [ ] Test one variable at a time
- [ ] Document what you try and the results
- [ ] Keep changes small and focused
- [ ] Test locally before pushing to CI

### After Resolution
- [ ] Verify fix works in clean environment
- [ ] Document the root cause and solution
- [ ] Update prevention strategies if needed
- [ ] Share learnings with team

## Time Management

### Time Boxes
- **Rapid Assessment**: 10 minutes max
- **Environment Analysis**: 15 minutes max  
- **Each Hypothesis Test**: 20 minutes max
- **Total Investigation**: 2 hours max before escalating

### Escalation Triggers
- Same hypothesis tested 3 times without progress
- Multiple unrelated symptoms appear
- Changes work locally but consistently fail in CI
- Issue impacts team velocity significantly

### Documentation Requirements
- Record all hypotheses tested
- Document root cause when found
- Update prevention strategies
- Create knowledge base entry

## Tools and Resources

### Essential Commands
```bash
# CI monitoring
gh run list --branch main
gh run view --log-failed

# Environment comparison  
node --version && npm --version
tsc --version

# Configuration debugging
tsc --showConfig
tsc --listFiles
tsc --traceResolution
```

### Helpful Resources
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Monorepo Best Practices](../lessons-learned/architecture/monorepo-lessons.md)
- [Common Anti-Patterns](../lessons-learned/anti-patterns/)

## Case Study: The Great CI Debug Session

### Timeline
- **00:00-00:10**: Rapid assessment - CI failing, works locally
- **00:10-00:25**: Environment analysis - found symlink architecture  
- **00:25-00:30**: Hypothesis - module resolution context mismatch
- **00:30-01:30**: Multiple attempts at fixing imports/configs
- **01:30-02:00**: Deep dive into monorepo architecture
- **02:00-02:30**: Root cause identification - symlink anti-pattern
- **02:30-03:00**: Systematic architectural fix
- **03:00-03:30**: Validation and documentation

### Key Insights
1. **Environment differences** often indicate architectural issues
2. **Quick fixes** can mask deeper structural problems  
3. **Systematic investigation** is faster than trial-and-error
4. **Documentation during debugging** accelerates future fixes

### Lessons Applied
- Always check for symlinks in monorepos
- Unify TypeScript configurations when possible
- Test architectural changes in isolated branches
- Document anti-patterns immediately for team learning

---

*This methodology was developed through systematic analysis of complex CI debugging sessions. It provides a framework for efficient problem-solving and knowledge capture.*