# Navigation & Directory Awareness Conventions

**CRITICAL**: Claude must maintain directory context awareness to prevent navigation errors.

## Navigation Best Practices

**🚨 CRITICAL: ALWAYS run `pwd` as your FIRST command before any file operations!**

### 1. MANDATORY Directory Verification

```bash
pwd  # ALWAYS run this first - no exceptions!
```

### 2. Run Commands from Project Root

```bash
# If not in project root, navigate immediately:
cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au

# Then verify you're in the right place:
pwd
```

### 3. Use Absolute Paths for Project Files

```bash
# ✅ Good - paths from project root
docs/testing/index.md
apps/web/components/ui/button.tsx

# ❌ Avoid - relative paths that lose context
../../../.bmad-core/
../../docs/testing/index.md
```

**NEVER use `../..` patterns - always reference files from project root.**

### 4. Confirm Location Before Running Scripts

```bash
pwd && bun run ci:status    # Combine directory check with command
```

### 5. Pay Attention to Path Context in Tool Output

When using LS tool, note the path context shown in output

### 6. List Hidden Directories Explicitly

```bash
ls -la | grep "^\."  # List hidden files/directories
```

## Common Directory Locations

- **Project Root**: `/Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au/`
- **Template Reference**: `/Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai/`
- **Web App**: `apps/web/`
- **Convex Backend**: `apps/convex/`
- **Documentation**: `docs/`
- **BMAD Agent System**: `.bmad-core/` (11 specialized agents)
- **Claude Config**: `.claude/` (if exists)

## Troubleshooting Navigation Issues

If you get "file not found" or "script not found" errors:

1. **IMMEDIATELY run `pwd` to check current location**
2. **Navigate to project root:**
   ```bash
   cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au
   ```
3. **Verify you're in the right place:** `pwd` (should show the full project path)
4. **Test with a known file:** `ls package.json` (should exist at root)
5. **Then retry your original command**

**Common failure pattern:** Running commands from subdirectories like `apps/web/` when scripts expect project root context.

## Critical Rules Summary

- ✅ **ALWAYS** run `pwd` before file operations
- ✅ **ALWAYS** work from project root
- ✅ **ALWAYS** use paths relative to project root (not `../..`)
- ✅ **ALWAYS** verify location before running scripts
- ❌ **NEVER** assume current directory
- ❌ **NEVER** use relative navigation patterns (`../..`)
