# Dead Code Cleanup Patterns

**Pattern Category**: Maintenance & Technical Debt
**Last Updated**: October 6, 2025
**Source**: Story 0.3 - Systematic Dead Code Cleanup

---

## Pattern: Multi-Phase Dead Code Analysis

### Context
When removing dead code from a large codebase, systematic analysis prevents breaking changes and identifies hidden dependencies.

### Pattern Structure

**Phase-Based Approach**:
1. **Phase 1**: Backend Functions (Convex/API)
2. **Phase 2**: Routes & API Endpoints
3. **Phase 3**: React Components
4. **Phase 4**: Cross-layer validation
5. **Phase 5**: Test cleanup

### Implementation

```bash
# Phase 1: Backend functions
grep -r "functionName" apps/convex apps/web --include="*.ts" --include="*.tsx"

# Phase 2: Routes (object-based)
grep -r '"/route-path"' apps/web --include="*.ts" --include="*.tsx"

# Phase 3: Components
grep -r "ComponentName" apps/web --include="*.ts" --include="*.tsx"

# Phase 4: Validation
bun run typecheck
bun run lint
bun test
bun run build
```

### Key Decisions

**When to Delete vs Document**:
- Delete: 0 usages found after comprehensive search
- Document: Function used but deprecated, needs migration story
- Investigate: Usages found in unexpected locations

**Search Strategy**:
- Use multiple search patterns (camelCase, PascalCase, kebab-case)
- Check both direct imports and dynamic imports
- Verify generated code (`_generated/api.d.ts`)
- Always backup before deletion (`.archived-code/`)

---

## Pattern: Orphaned Code Detection

### Context
Dead code removal can leave orphaned files that reference deleted dependencies.

### Detection Strategy

**TypeScript Compilation as Oracle**:
```bash
bun run typecheck
# Look for errors like:
# - Cannot find module '@/deleted-module'
# - Export 'deletedFunction' not found
# - Type 'DeletedType' not assignable
```

**Common Orphan Patterns**:
1. **Tests without implementation**: Test files for deleted functions
2. **POC code referencing deleted schemas**: Experimental features using removed database tables
3. **Cache issues**: Build artifacts referencing deleted routes

### Resolution

```bash
# 1. Backup orphaned files
mkdir -p .archived-code/$(date +%Y-%m-%d)-orphaned-code
cp orphaned-file.ts .archived-code/$(date +%Y-%m-%d)-orphaned-code/

# 2. Remove orphaned file
rm orphaned-file.ts

# 3. Clear build caches
rm -rf apps/web/.next
rm -rf apps/web/dist

# 4. Re-validate
bun run typecheck
```

---

## Pattern: Test Suite Cleanup After Code Removal

### Context
Removing code requires cleaning up associated tests to prevent false failures.

### Test Categorization Strategy

**Failure Types**:
1. **Orphaned Tests** (DELETE): Tests for deleted code
2. **Path Configuration Issues** (DOCUMENT): Tests for existing code with broken imports
3. **Pre-existing Failures** (IGNORE): Failures unrelated to code removal

### Detection Process

```bash
# Run tests and capture output
bun test 2>&1 | tee test-output.txt

# Categorize failures
grep "Cannot find module" test-output.txt  # Path issues
grep "Export.*not found" test-output.txt   # Deleted exports

# Verify module existence before deleting tests
ls apps/convex/module-name.ts  # If exists, it's a path issue
                                # If missing, orphaned test
```

### Decision Matrix

| Error Pattern | Module Exists? | Action |
|---------------|----------------|--------|
| `Cannot find module '@/foo'` | Yes | Document as path config issue |
| `Cannot find module '@/foo'` | No | Delete orphaned test |
| `Export 'bar' not found` | Function exists | Update test |
| `Export 'bar' not found` | Function deleted | Delete orphaned test |

---

## Pattern: Backup Before Deletion

### Context
Always maintain audit trail and rollback capability for deleted code.

### Implementation

```bash
# Create dated backup directory
BACKUP_DIR=".archived-code/$(date +%Y-%m-%d)-story-phase-description"
mkdir -p "$BACKUP_DIR"

# Backup before deletion
cp deleted-file.ts "$BACKUP_DIR/"

# Delete from working tree
rm deleted-file.ts
```

### Directory Structure

```
.archived-code/
├── 2025-10-06-story-0.3-phase1-convex-functions/
│   ├── narrativeGenerator.ts
│   └── aiEnhancement.ts
├── 2025-10-06-story-0.3-phase5-typecheck-fix/
│   ├── knowledge.ts
│   └── knowledgeActions.ts
└── 2025-10-06-story-0.3-phase6-orphaned-tests/
    ├── knowledge.test.ts
    └── aiEnhancement.test.ts
```

### Benefits
- Audit trail for compliance
- Easy rollback if needed
- Reference for future questions ("why was this removed?")
- Historical context for architectural decisions

---

## Pattern: Cross-Layer Dependency Validation

### Context
After removing code across multiple layers (backend, routes, components), validate no broken dependencies.

### Validation Suite

**4-Part Validation**:
```bash
# 1. TypeScript compilation (catches import errors)
bun run typecheck

# 2. ESLint (catches unused imports, dead references)
bun run lint

# 3. Test execution (catches runtime dependencies)
bun test

# 4. Production build (catches build-time issues)
bun run build
```

### Common Issues Caught

| Validation Step | Common Issues |
|-----------------|---------------|
| `typecheck` | Missing imports, deleted type references, orphaned files |
| `lint` | Unused imports (can be cleaned up), dead code warnings |
| `test` | Orphaned tests, broken mocks, deleted test utilities |
| `build` | Build cache issues, missing assets, route references |

### Fix Patterns

**TypeScript Errors**:
- `Cannot find module` → Clear cache or remove orphaned import
- `Type not found` → Remove orphaned type usage or update imports
- `Property not found` → Function/property was deleted, update caller

**Build Errors**:
- Cache errors → `rm -rf .next/`
- Missing routes → Update route references or delete unused route handlers

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern: Delete First, Validate Later

**Problem**: Breaking changes discovered too late

**Solution**: Always run comprehensive search before deletion

### ❌ Anti-Pattern: Skip Backup

**Problem**: No rollback path, lost context for future reference

**Solution**: Always backup to `.archived-code/` with dated directory

### ❌ Anti-Pattern: Batch Deletions Without Categorization

**Problem**: Mix orphaned tests with valid path configuration issues

**Solution**: Investigate each failure, categorize before deleting

### ❌ Anti-Pattern: Ignore Pre-existing Test Failures

**Problem**: Can't distinguish new failures from old ones

**Solution**: Baseline test suite before starting, compare after

---

## Success Metrics

**Story 0.3 Results**:
- **Phases 1-3**: 21 files deleted (functions, routes, components)
- **Phase 5**: 3 orphaned files removed (TypeScript validation caught)
- **Phase 6**: 9 orphaned tests removed
- **Total**: 33 files deleted safely with zero production impact

**Validation Results**:
- TypeScript: ✅ 0 errors
- ESLint: ✅ 0 new warnings
- Build: ✅ Production build successful
- Tests: ✅ All failures from dead code removal fixed

---

## Future Improvements

**Potential Enhancements**:
1. Automated dead code detection (static analysis tools)
2. Pre-commit hooks to prevent orphaned test creation
3. Dependency graph visualization before deletion
4. Automated backup script integration

**Reference**: See Story 0.4 for coding standards improvements based on dead code analysis insights.
