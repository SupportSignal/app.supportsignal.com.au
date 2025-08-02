# File System Exploration and Segmentation for LLM Context Optimization

## Problem Context

### Challenge: LLM Token Limits vs. Project Complexity

Modern AI-powered development faces a fundamental challenge: **sophisticated projects require comprehensive context, but LLMs have practical token limits**. This creates a tension between providing enough context for intelligent assistance and staying within efficient processing boundaries.

**Specific Issues Identified:**
- Large codebases (1000+ files) exceed token limits when included wholesale
- Different development tasks require different file perspectives
- Hidden configuration folders contain critical AI methodology but also noise
- Generated files and dependencies create context pollution
- Documentation spans permanent architecture and transient implementation details

### The Gemini Advantage

Google Gemini's million-token context window offers unprecedented capacity for whole-codebase analysis, but **intelligent segmentation remains crucial** for:
- **Focused Analysis**: Different queries need different file subsets
- **Efficiency**: Even with large context windows, relevant filtering improves response quality
- **Cost Optimization**: Smaller, targeted contexts reduce processing costs
- **Reusability**: Standardized queries enable consistent context patterns

## Solution Approach: Intelligent File Segmentation

### Core Philosophy

**Context-driven file selection**: The nature of your task determines which files are relevant. A UI component update doesn't need backend database schemas, and a deployment issue doesn't need test files.

### The `files` Command System

This solution uses the `files` command with sophisticated include/exclude patterns to create **15 specialized queries** covering all development scenarios.

#### Command Structure
```bash
files -i 'pattern1' -i 'pattern2' -e 'exclude1' -e 'exclude2' -d -f tree
```

**Key Modifiers:**
- `-i 'pattern'`: Include files matching pattern
- `-e 'pattern'`: Exclude files matching pattern  
- `-d`: Show directory structure
- `-f tree`: Display as tree format (structure only)
- Remove `-f tree`: Include full file contents

## Complete Query Reference

### Core Project Views

#### 1. **all-files-no-hidden**: Complete project excluding hidden folders
**Use Case**: Full project overview without configuration complexity
```bash
files -i 'apps/**/*' -i 'docs/**/*' -i 'packages/**/*' -i 'scripts/**/*' -i 'tests/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree
```

#### 2. **all-files-with-hidden**: Complete project including hidden folders  
**Use Case**: Comprehensive analysis including AI methodology and CI/CD
```bash
files -i '**/*' -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree
```

#### 3. **hidden-only**: Hidden config folders excluding code
**Use Case**: Understanding project methodology, CI/CD, and development tooling
```bash
files -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree
```

### Code-Focused Views

#### 4. **code-only**: Implementation code without tests/docs
**Use Case**: Understanding business logic and application structure
```bash
files -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/**/*.ts' -i 'packages/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/__tests__/**/*' -e '**/test*' -d -f tree
```

#### 5. **code-plus-tests**: Implementation and test files only
**Use Case**: Comprehensive code review including test coverage
```bash
files -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/**/*.ts' -i 'packages/**/*.tsx' -i 'tests/**/*.ts' -i 'tests/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree
```

#### 6. **architecture-context**: Code plus architectural documentation
**Use Case**: Understanding implementation within architectural constraints
```bash
files -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'docs/architecture/**/*' -i 'docs/patterns/**/*' -i 'docs/methodology/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree
```

### Documentation Views

#### 7. **docs-permanent**: Architectural/permanent documentation
**Use Case**: Understanding long-term architecture and established patterns
```bash
files -i 'docs/architecture/**/*' -i 'docs/patterns/**/*' -i 'docs/methodology/**/*' -i 'docs/technical-guides/**/*' -i 'docs/template-usage/**/*' -e 'docs/testing/uat/**/*' -d -f tree
```

#### 8. **docs-transient**: Stories/UAT/time-sensitive docs
**Use Case**: Understanding current sprint work and functional testing
```bash
files -i 'docs/testing/uat/**/*' -i 'docs/examples/**/*' -i 'docs/**/story-*' -i 'docs/**/*sprint*' -d -f tree
```

### Specialized Views

#### 9. **test-segmented**: Tests by location and module type
**Use Case**: Understanding test architecture and coverage patterns
```bash
files -i 'tests/**/*' -i 'apps/**/test*' -i 'apps/**/__tests__/**/*' -i 'packages/**/__tests__/**/*' -e '**/node_modules/**/*' -d -f tree
```

#### 10. **config-only**: Configuration files across project
**Use Case**: Understanding project setup, build tools, and environment config
```bash
files -i '**/*.json' -i '**/*.js' -i '**/*.config.*' -i '**/tsconfig*' -i '**/jest*' -i '**/eslint*' -i '**/playwright*' -e '**/node_modules/**/*' -e '**/package-lock.json' -e '**/bun.lock' -d -f tree
```

#### 11. **deployment-files**: All deployment-related configurations
**Use Case**: Understanding deployment pipelines and infrastructure setup
```bash
files -i '**/wrangler*' -i '**/.github/**/*' -i '**/cloudflare*' -i '**/deploy*' -i 'scripts/**/*' -e '**/node_modules/**/*' -d -f tree
```

#### 12. **generated-artifacts**: All generated/build files for debugging
**Use Case**: Investigating build issues or generated code problems
```bash
files -i '**/_generated/**/*' -i '**/dist/**/*' -i '**/coverage/**/*' -i '**/test-coverage/**/*' -i '**/.next/**/*' -i '**/.vercel/**/*' -d -f tree
```

#### 13. **deprecation-cleanup**: Deprecated/backup files for cleanup
**Use Case**: Identifying legacy code and files ready for removal
```bash
files -i '**/*.deprecated.*' -i '**/*.old.*' -i '**/*.backup' -i '**/*.bak' -i '**/*.tmp' -d -f tree
```

### Module-Specific Views

#### 14. **backend-only**: Convex backend and workers only
**Use Case**: Backend development and API analysis
```bash
files -i 'apps/convex/**/*' -i 'apps/workers/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree
```

#### 15. **frontend-only**: Next.js web app only
**Use Case**: Frontend development and UI component work
```bash
files -i 'apps/web/**/*' -i 'packages/ui/**/*' -i 'packages/storybook/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree
```

## Hidden Folder Analysis

### Critical Decision: What Hidden Folders to Include

**NEEDED for LLM Context:**
- `.bmad-core/` - AI development methodology framework
- `.claude/` - Claude Code integration and agent definitions
- `.github/` - CI/CD workflows and repository automation  
- `.husky/` - Git hooks and quality gates

**EXCLUDED from LLM Context:**
- `.git/` - Version control internals (objects, refs, logs)
- `.turbo/` - Build cache and runtime artifacts

**Rationale**: Include **configuration as code** and **methodology definitions** that impact system behavior, exclude **runtime artifacts** and **internal tooling state**.

## Integration with Gemini's Million-Token Context

### Strategic Advantage

Gemini's expanded context window enables:

1. **Whole-Project Analysis**: Use `all-files-with-hidden` for complete project understanding
2. **Cross-System Correlation**: Analyze relationships between frontend, backend, and deployment
3. **Documentation-Informed Development**: Include comprehensive docs with code for context-aware suggestions
4. **Historical Pattern Recognition**: Include legacy/deprecated files to understand evolution

### Recommended Gemini Workflows

**Architecture Review**: `all-files-with-hidden` + `docs-permanent`
**Feature Development**: `architecture-context` + relevant module view
**Debugging**: `code-plus-tests` + `generated-artifacts` 
**Deployment Issues**: `deployment-files` + `config-only`

## Best Practices

### Query Selection Strategy

1. **Start Broad**: Use `all-files-no-hidden` for initial understanding
2. **Focus Narrow**: Switch to specific views based on task type
3. **Include Context**: Add documentation views when architectural understanding is needed
4. **Exclude Noise**: Always exclude `node_modules`, `_generated`, `.git`, `.turbo`

### Performance Optimization

- Use `-f tree` for structure analysis (faster, fewer tokens)
- Remove `-f tree` only when you need actual file contents
- Combine multiple specialized views rather than using overly broad queries
- Cache frequently-used query results for consistent context

### Maintenance

- Review and update exclusion patterns as project evolves
- Add new specialized views for emerging development patterns
- Document team-specific query preferences
- Regular cleanup of deprecated/backup files to reduce noise

## Implementation Notes

### File Command Requirements

- Requires custom `files` command with glob pattern support
- Must support multiple include/exclude patterns
- Tree format display capability essential for structure overview
- Content display mode needed for detailed analysis

### Integration Points

- README.md quick reference for developer onboarding
- Documentation in both current project and template repository
- CI/CD integration for automated project analysis
- Claude Code agent configuration for context-aware assistance

## Conclusion

This file segmentation system transforms LLM context management from an ad-hoc challenge into a **systematic capability**. By providing 15 specialized queries covering all development scenarios, teams can:

- **Maximize LLM effectiveness** through relevant context selection
- **Reduce processing costs** via efficient token usage
- **Standardize development workflows** with consistent context patterns
- **Scale to large projects** without context limitations

The system is particularly powerful when combined with Gemini's million-token capacity, enabling comprehensive whole-project analysis while maintaining the flexibility to focus on specific subsystems when needed.