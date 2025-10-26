# Anti-Pattern: Duplicate Configuration Systems

**Context**: Story 6.5 - Discovered unused duplicate prompt configuration file

## Problem Description

Two separate prompt configuration files existed in the codebase, but only one was actually being used. Changes to the unused file had no effect, causing confusion and wasted debugging time.

## The Duplicate Systems

### File 1: `/apps/convex/lib/prompts/default_prompts.ts` ❌ UNUSED

```typescript
export const DEFAULT_PROMPT_TEMPLATES = [
  {
    name: "generate_mock_answers",
    // ... template definition ...
    max_tokens: 5000, // ← Changes here had NO EFFECT
  }
]
```

**Not imported anywhere** except auto-generated files.

### File 2: `/apps/convex/promptManager.ts` ✅ ACTIVE

```typescript
// Line 310
const DEFAULT_PROMPTS = [
  {
    prompt_name: "generate_mock_answers",
    // ... template definition ...
    max_tokens: 2000, // ← This is what was actually used
  }
]
```

**Used by all seed operations** via lines 181, 230, 948.

## How This Happened

### Evolution Timeline

1. **Initial implementation**: Prompts defined in `promptManager.ts` (clean, simple)
2. **Refactoring attempt**: Someone tried to extract prompts to separate file (`default_prompts.ts`)
3. **Incomplete migration**: Created new file but didn't update imports
4. **Silent failure**: No errors because old system still worked
5. **Confusion**: Developers edited wrong file, changes had no effect

### Why It Persisted

**No failing tests** - both files were syntactically valid TypeScript
**No import errors** - unused file simply wasn't imported
**No runtime errors** - active system continued working
**No documentation** - unclear which file was source of truth

## Detection Method

### Search for Usage

```bash
# Find where configuration is imported/used
grep -r "DEFAULT_PROMPT" apps/convex/ --include="*.ts" | grep -v node_modules | grep -v "_generated"

# Result showed:
# - promptManager.ts: Uses its own DEFAULT_PROMPTS array
# - default_prompts.ts: Exports DEFAULT_PROMPT_TEMPLATES (not imported anywhere)
```

### Verify Imports

```bash
# Search for imports of the separate file
grep -r "from.*default_prompts" apps/convex/ --include="*.ts"

# Result: Only auto-generated files (not actual usage)
```

## Resolution

**Deleted the unused file**:
```bash
rm apps/convex/lib/prompts/default_prompts.ts
```

**Single source of truth**: `apps/convex/promptManager.ts` DEFAULT_PROMPTS array (line 310)

## Prevention Strategies

### 1. Import/Export Validation

**Lint rule**: Warn on exported constants that are never imported.

```typescript
// ESLint rule: no-unused-exports
// Would catch: export const DEFAULT_PROMPT_TEMPLATES (never imported)
```

### 2. Single Source of Truth Documentation

**Add comment at top of configuration file**:
```typescript
/**
 * PROMPT TEMPLATE DEFINITIONS - SOURCE OF TRUTH
 *
 * This is the ONLY location for prompt template definitions.
 * These templates are loaded into the database via seedPromptTemplates().
 *
 * DO NOT create duplicate configuration files.
 * DO NOT define prompts elsewhere in the codebase.
 */
const DEFAULT_PROMPTS = [
```

### 3. Architecture Decision Record (ADR)

Document why configuration lives where it does:

**ADR: Prompt Configuration in promptManager.ts**
- **Decision**: Keep prompt templates co-located with seed logic
- **Rationale**: Reduces import overhead, keeps related code together
- **Alternatives considered**: Separate file for reusability (rejected: no other consumers)

### 4. Automated Checks

**CI check for duplicate patterns**:
```bash
# Detect files that might be duplicate configs
if grep -r "const DEFAULT_PROMPT" apps/convex/ | wc -l > 1; then
  echo "ERROR: Multiple DEFAULT_PROMPT definitions found"
  exit 1
fi
```

## Warning Signs

**You might have duplicate configuration if**:

- [ ] Changes to config file don't take effect
- [ ] Multiple files with similar names (e.g., `config.ts` and `configuration.ts`)
- [ ] Exported constants with no imports
- [ ] Comments like "TODO: use this instead of X"
- [ ] Two files with same or similar export names
- [ ] Refactoring branches that were never completed

## Quick Diagnostic

```bash
# Find all configuration exports
grep -r "export const.*CONFIG\|export const.*DEFAULT" apps/ --include="*.ts"

# Check if each export is actually imported
for file in $(grep -l "export const DEFAULT" apps/**/*.ts); do
  basename=$(basename $file .ts)
  imports=$(grep -r "from.*$basename" apps/ --include="*.ts" | wc -l)
  if [ $imports -eq 0 ]; then
    echo "UNUSED: $file"
  fi
done
```

## Lessons Learned

### 1. Complete Refactoring or Revert

**Don't leave half-finished migrations**:
- If extracting config to separate file, update all imports
- If new approach doesn't work, revert immediately
- Don't commit "work in progress" extraction attempts

### 2. Delete Unused Code Aggressively

**If it's not imported, delete it**:
- Unused code creates confusion
- Git preserves history if you need it back
- Clean codebase reduces cognitive load

### 3. Configuration Should Scream Its Purpose

**File/constant naming should indicate usage**:
- `DEFAULT_PROMPTS` (used) vs `DEFAULT_PROMPT_TEMPLATES` (unused)
- Similar names suggest duplication

### 4. Test Your Changes

**Changing config? Verify it worked**:
```bash
# After editing prompt template
bunx convex run promptManager:resetAndSeedPrompts
bunx convex data ai_prompts | grep "your_prompt_name"
# Verify the change is in database
```

## Related Patterns

- [Database-Code Synchronization](./database-code-sync-pattern.md)
- [Token Limit Debugging](./ai-token-limit-debugging.md)

## When to Suspect This Anti-Pattern

**Symptoms**:
- "I changed the config but nothing happened"
- "Where do I update this setting?"
- Multiple files with similar configuration exports
- Grep shows multiple definitions of same constant

**Quick check**: Search for all files exporting similar names, verify each is imported.
