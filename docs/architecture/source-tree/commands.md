# gpt_context Commands for Source Tree Generation

Direct commands to generate project source trees using gpt_context.rb. Each command can be run manually or piped to create static markdown files.

## Base Command Path

```bash
GPT_CONTEXT="/Users/davidcruwys/dev/ad/appydave/appydave-tools/bin/gpt_context.rb"
```

## Core Project Views

### 1. All Files (No Hidden)

Complete project excluding hidden folders

```bash
$GPT_CONTEXT -i 'apps/**/*' -i 'docs/**/*' -i 'packages/**/*' -i 'scripts/**/*' -i 'tests/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree -o all-files-no-hidden.md
```

### 2. All Files (With Hidden)

Complete project including hidden folders

```bash
$GPT_CONTEXT -i '**/*' -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree -o all-files-with-hidden.md
```

### 3. Hidden Only

Hidden config folders excluding code

```bash
$GPT_CONTEXT -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree -o hidden-only.md
```

## Code-Focused Views

### 4. Code Only

Implementation code without tests/docs

```bash
$GPT_CONTEXT -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/__tests__/**/*' -e '**/test*' -e '**/storybook/**/*' -d -f tree -o code-only.md
```

### 5. Code Plus Tests

Implementation and test files only

```bash
$GPT_CONTEXT -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -i 'tests/**/*.ts' -i 'tests/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/storybook/**/*' -d -f tree -o code-plus-tests.md
```

### 6. Architecture Context

Code plus architectural documentation

```bash
$GPT_CONTEXT -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -i 'docs/architecture/**/*' -i 'docs/patterns/**/*' -i 'docs/methodology/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/storybook/**/*' -d -f tree -o architecture-context.md
```

## Documentation Views

### 7. Docs Permanent

Architectural/permanent documentation

```bash
$GPT_CONTEXT -i 'docs/architecture/**/*' -i 'docs/patterns/**/*' -i 'docs/methodology/**/*' -i 'docs/technical-guides/**/*' -i 'docs/template-usage/**/*' -e 'docs/testing/uat/**/*' -d -f tree -o docs-permanent.md
```

### 8. Docs Transient

Stories/UAT/time-sensitive docs

```bash
$GPT_CONTEXT -i 'docs/testing/uat/**/*' -i 'docs/examples/**/*' -i 'docs/**/story-*' -i 'docs/**/*sprint*' -d -f tree -o docs-transient.md
```

## Specialized Views

### 9. Test Segmented

Tests by location and module type

```bash
$GPT_CONTEXT -i 'tests/**/*' -i 'apps/**/test*' -i 'apps/**/__tests__/**/*' -i 'packages/**/__tests__/**/*' -e '**/node_modules/**/*' -e '**/storybook/**/*' -d -f tree -o test-segmented.md
```

### 10. Config Only

Configuration files across project

```bash
$GPT_CONTEXT -i '**/*.json' -i '**/*.js' -i '**/*.config.*' -i '**/tsconfig*' -i '**/jest*' -i '**/eslint*' -i '**/playwright*' -e '**/node_modules/**/*' -e '**/package-lock.json' -e '**/bun.lock' -e '**/storybook/**/*' -d -f tree -o config-only.md
```

### 11. Deployment Files

All deployment-related configurations

```bash
$GPT_CONTEXT -i '**/wrangler*' -i '**/.github/**/*' -i '**/cloudflare*' -i '**/deploy*' -i 'scripts/**/*' -e '**/node_modules/**/*' -d -f tree -o deployment-files.md
```

### 12. Generated Artifacts

All generated/build files for debugging

```bash
$GPT_CONTEXT -i '**/_generated/**/*' -i '**/dist/**/*' -i '**/coverage/**/*' -i '**/test-coverage/**/*' -i '**/.next/**/*' -i '**/.vercel/**/*' -d -f tree -o generated-artifacts.md
```

### 13. Deprecation Cleanup

Deprecated/backup files for cleanup

```bash
$GPT_CONTEXT -i '**/*.deprecated.*' -i '**/*.old.*' -i '**/*.backup' -i '**/*.bak' -i '**/*.tmp' -d -f tree -o deprecation-cleanup.md
```

## Module-Specific Views

### 14. Backend Only

Convex backend and workers only

```bash
$GPT_CONTEXT -i 'apps/convex/**/*' -i 'apps/workers/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree -o backend-only.md
```

### 15. Frontend Only

Next.js web app only

```bash
$GPT_CONTEXT -i 'apps/web/**/*' -i 'packages/ui/**/*' -i 'packages/storybook/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree -o frontend-only.md
```

## Usage Examples

### Generate Single View

```bash
# Generate code-only view
$GPT_CONTEXT -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -e '**/node_modules/**/*' -d -f tree -o code-only.md
```

### Generate with Content (Change -f tree to -f content)

```bash
# Include file contents, not just tree structure
$GPT_CONTEXT -i 'docs/architecture/**/*' -d -f content -o architecture-docs-with-content.md
```

### Multiple Outputs

```bash
# Architecture context to both clipboard and file
$GPT_CONTEXT -i 'apps/**/*.ts' -i 'docs/architecture/**/*' -d -f tree -o clipboard -o architecture-context.md
```

## Automation

See `generate-trees.sh` script for automated generation of all 15 views as markdown files with timestamps.