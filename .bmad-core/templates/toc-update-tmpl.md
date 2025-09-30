# TOC Update Templates

**Purpose**: Standardized templates for updating knowledge base Table of Contents (TOCs) during KDD knowledge capture.

## Pattern TOC Entry Template

**For `docs/patterns/index.md` additions:**

```markdown
### [Pattern Name](pattern-filename.md)

Brief description of the pattern's purpose and when to use it.

**Added**: YYYY-MM-DD | **Category**: [Frontend/Backend/Testing/Architecture/Workflow]
```

**Example:**
```markdown
### [Environment-Aware URL Configuration](environment-url-configuration.md)

Centralized URL configuration with environment detection for development vs production.

**Added**: 2025-09-30 | **Category**: Backend
```

## Example TOC Entry Template

**For `docs/examples/index.md` additions:**

```markdown
### [Feature/Component Examples](subdirectory/)

Description of what this example demonstrates and key implementation highlights.

**Added**: YYYY-MM-DD | **Related Patterns**: [Link to relevant pattern]
```

**Example:**
```markdown
### [URL Configuration Implementation](environment-url-config/)

Complete environment-aware URL configuration with test suite and validation patterns.

**Added**: 2025-09-30 | **Related Patterns**: [Environment-Aware URL Configuration](../patterns/environment-url-configuration.md)
```

## Lessons Learned TOC Entry Template

**For `docs/lessons-learned/index.md` additions:**

```markdown
### [Lesson Category](lesson-filename.md)

Key insight or breakthrough captured from story implementation.

**Added**: YYYY-MM-DD | **Story**: X.X | **Impact**: [High/Medium/Low]
```

**Example:**
```markdown
### [Jest/Bun Test Runner Compatibility](jest-bun-compatibility-lessons.md)

API differences between Jest and Bun test runners that affect testing implementation.

**Added**: 2025-09-30 | **Story**: 8.2 | **Impact**: Medium
```

## Master TOC Update Template

**For `docs/index.md` KDD section updates:**

```markdown
#### Recent Knowledge Assets (Last Updated: YYYY-MM-DD)

**New Patterns Added:**
- [Pattern Name](./patterns/pattern-file.md) - Brief description

**New Examples Created:**
- [Example Name](./examples/category/example-dir/) - Implementation example

**New Lessons Captured:**
- [Lesson Name](./lessons-learned/category/lesson-file.md) - Key insight from Story X.X

**Knowledge Base Stats**: X patterns | Y examples | Z lessons learned
```

## Cross-Reference Templates

### Pattern → Example Cross-Reference

**Add to pattern file:**
```markdown
### Related Examples
- [Implementation Example](../examples/category/example-name/) - Working code from Story X.X
```

### Example → Pattern Cross-Reference

**Add to example README:**
```markdown
## Related Patterns
- [Pattern Name](../../patterns/pattern-file.md) - Architectural guidance for this implementation
```

### Lesson → Pattern/Example Cross-Reference

**Add to lesson file:**
```markdown
## Related Knowledge Assets
- **Pattern**: [Pattern Name](../patterns/pattern-file.md) - Established pattern this lesson validates
- **Example**: [Example Name](../examples/category/example-dir/) - Working implementation
```

## TOC Health Check Templates

### Orphaned File Detection

**Command to find files not referenced in TOCs:**
```bash
# Find potential orphaned files
find docs/patterns docs/examples docs/lessons-learned -name "*.md" -not -name "index.md" | while read file; do
  if ! grep -r "$(basename "$file" .md)" docs/*/index.md >/dev/null 2>&1; then
    echo "Potentially orphaned: $file"
  fi
done
```

### Cross-Reference Validation

**Check for broken links:**
```bash
# Validate cross-references (basic check)
find docs -name "*.md" -exec grep -l "\.\./" {} \; | while read file; do
  echo "File with relative links (verify manually): $file"
done
```

## TOC Update Workflow

### 1. During KDD Execution

**When creating new pattern:**
1. Create pattern file in `docs/patterns/`
2. Add entry to `docs/patterns/index.md` using Pattern TOC Entry Template
3. Update `docs/index.md` master TOC if significant addition
4. Add cross-references to related examples/lessons

**When creating new example:**
1. Create example directory in `docs/examples/[category]/`
2. Add entry to `docs/examples/index.md` using Example TOC Entry Template
3. Add cross-reference to related pattern(s)
4. Update master TOC if major new category

**When capturing new lesson:**
1. Create lesson file in `docs/lessons-learned/[category]/`
2. Add entry to `docs/lessons-learned/index.md` using Lessons TOC Entry Template
3. Cross-reference related patterns and examples
4. Update master TOC for significant insights

### 2. TOC Maintenance Checklist

- [ ] **New files added to category TOCs** using appropriate templates
- [ ] **Cross-references added** between related knowledge assets
- [ ] **Master TOC updated** if significant additions or new categories
- [ ] **Timestamps and metadata** included for all new entries
- [ ] **Broken links checked** using validation commands
- [ ] **Orphaned files identified** and either linked or archived

### 3. Quarterly TOC Review

**Process for knowledge base health maintenance:**

1. **Run health check commands** to identify orphaned files and broken links
2. **Review cross-references** for completeness and accuracy
3. **Consolidate similar patterns** that may have emerged separately
4. **Update category organization** if knowledge has grown significantly
5. **Archive obsolete knowledge** that's no longer relevant
6. **Update master TOC statistics** and last-updated timestamps

## Metadata Standards

### File Naming Convention
- **Patterns**: `descriptive-pattern-name.md`
- **Examples**: `feature-or-component-name/` (directory with README.md)
- **Lessons**: `category-specific-lesson-name.md`

### Required Metadata in Files
```markdown
**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Story**: X.X (if applicable)
**Related Assets**: [Links to patterns/examples/lessons]
**Status**: [Active/Under Review/Archived]
```

### TOC Entry Metadata
- **Added date**: When entry was added to TOC
- **Category/Type**: Classification for filtering
- **Relationships**: Links to related knowledge assets
- **Impact level**: For lessons learned (High/Medium/Low)

This template system ensures systematic, discoverable, and well-cross-referenced knowledge base maintenance as part of the KDD process.