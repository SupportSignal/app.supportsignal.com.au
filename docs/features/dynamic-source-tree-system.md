# Dynamic Source Tree System

A comprehensive project navigation system that provides always-current, categorized views of the codebase using dynamic file analysis.

## New Features Added

- **Dynamic Project Navigation**: 15 categorized views of project structure generated from live file system
- **Automated Generation**: Single script to refresh all source tree views with timestamps
- **Manual Command Access**: Direct gpt_context.rb commands for individual view generation
- **Maintenance-Free Documentation**: Eliminates stale static documentation through dynamic generation
- **Multi-Category Views**: Specialized views for code, tests, docs, config, deployment, and modules
- **Always-Current Data**: Generated from live file system, never outdated
- **Cross-Repository Ready**: Designed for feature extraction and adoption in other repositories

## Files Added/Modified

### New Directory Structure

- **`docs/architecture/source-tree/`** - Dynamic source tree system directory
- **`docs/architecture/source-tree/README.md`** - System overview with project status and usage guide
- **`docs/architecture/source-tree/commands.md`** - All 15 gpt_context commands organized by category
- **`docs/architecture/source-tree/generate-trees.sh`** - Automation script for batch generation
- **`docs/features/dynamic-source-tree-system.md`** - This feature documentation file

### Generated Source Tree Files (15 total)

- **`all-files-no-hidden.md`** - Complete project excluding hidden folders
- **`all-files-with-hidden.md`** - Complete project including hidden folders
- **`hidden-only.md`** - Hidden config folders excluding code
- **`code-only.md`** - Implementation code without tests/docs
- **`code-plus-tests.md`** - Implementation and test files only
- **`architecture-context.md`** - Code plus architectural documentation
- **`docs-permanent.md`** - Architectural/permanent documentation
- **`docs-transient.md`** - Stories/UAT/time-sensitive docs
- **`test-segmented.md`** - Tests by location and module type
- **`config-only.md`** - Configuration files across project
- **`deployment-files.md`** - All deployment-related configurations
- **`generated-artifacts.md`** - All generated/build files for debugging
- **`deprecation-cleanup.md`** - Deprecated/backup files for cleanup
- **`backend-only.md`** - Convex backend and workers only
- **`frontend-only.md`** - Next.js web app only

### Modified Files

- **`CLAUDE.md`** - Added reference to dynamic source tree system (pending)
- **`docs/architecture/`** - Existing `source-tree.md` preserved (static reference)

## Technical Impact

- **Files Total**: 18 new files (3 system files + 15 generated views)
- **Directories Added**: 1 (`docs/architecture/source-tree/`)
- **System Files**: 3 (README, commands, generate script)
- **Generated Views**: 15 categorized source tree files
- **Commands Available**: 15 individual gpt_context commands
- **Categories Covered**: Core, Code, Docs, Specialized, Module-specific views
- **Maintenance Burden**: Eliminated (dynamic generation vs static documentation)

## Key Benefits

### For Development Teams

- **Always Current**: Generated from live file system, never stale
- **Multiple Perspectives**: 15 different views of the same codebase
- **Quick Navigation**: Instantly see project structure for specific needs
- **Maintenance Free**: No manual updates required

### For AI-Assisted Development

- **Context Optimization**: Provide exactly the right project view for specific tasks
- **Dynamic Analysis**: Real-time project structure for AI context
- **Categorized Views**: Choose optimal context window usage
- **LLM-Friendly**: Structured output optimized for AI consumption

### For Cross-Repository Adoption

- **Feature Extraction**: Clear system for adopting in other repositories
- **Template Independence**: Not tied to specific project structure
- **Reusable Pattern**: Applies to any codebase with gpt_context.rb access
- **Documentation Pattern**: Establishes standard for dynamic project documentation

## Architecture & Implementation

### Core Components

1. **Command Repository** (`commands.md`)
   - 15 gpt_context.rb commands with proper -o flags
   - Organized by category (Core, Code, Docs, Specialized, Module)
   - Usage examples and pattern variations

2. **Automation Script** (`generate-trees.sh`)
   - Batch generation of all 15 views
   - Header injection with metadata
   - Error handling and progress reporting
   - Timestamp tracking for freshness verification

3. **Generated Views** (15 .md files)
   - Dynamic headers with generation time
   - Clean tree structure formatting
   - Category-specific filtering
   - Always-current project state

### Technology Integration

- **gpt_context.rb**: Core file analysis and tree generation
- **File Output**: Built-in -o flag support for direct file writing
- **Shell Automation**: Bash script for batch processing
- **Error Handling**: Graceful failure with diagnostic information

### Usage Patterns

#### Manual Individual Commands

```bash
# Generate specific view
$GPT_CONTEXT -i 'apps/**/*.ts' -d -f tree -o code-only.md
```

#### Batch Generation

```bash
# Regenerate all 15 views
./docs/architecture/source-tree/generate-trees.sh
```

#### Integration with Development Workflow

```bash
# Update source trees before major features
cd docs/architecture/source-tree && ./generate-trees.sh
```

## Cross-Repository Adoption

### Extraction Steps

1. **Copy System Files**:
   - `docs/architecture/source-tree/` directory
   - Modify paths in `generate-trees.sh` for target project
   - Update `README.md` with project-specific information

2. **Verify Dependencies**:
   - Ensure gpt_context.rb is available
   - Update GPT_CONTEXT path in commands and scripts
   - Test single command before batch generation

3. **Customize Categories**:
   - Modify gpt_context commands for project structure
   - Add/remove categories based on project needs
   - Update README and commands documentation

### Adaptation Guidelines

- **Project-Agnostic**: Commands work with any file structure
- **Path Flexibility**: Easy to modify include/exclude patterns
- **Category Customization**: Add project-specific view categories
- **Documentation Integration**: Fits any documentation structure

## Maintenance & Operations

### Regular Operations

- **Regeneration**: Run `generate-trees.sh` when project structure changes significantly
- **Verification**: Check timestamp headers to ensure freshness
- **Cleanup**: Regenerated files automatically replace outdated versions

### Monitoring

- **File Count**: Verify all 15 view files are generated
- **Error Handling**: Script reports failed generations with diagnostic info
- **Freshness**: Timestamp headers show when each view was last generated

### Updates

- **Command Modifications**: Update `commands.md` when adding new view categories
- **Script Updates**: Modify `generate-trees.sh` for new commands or enhanced functionality
- **Documentation**: Update README.md when system capabilities change

## Future Enhancements

- **Automated Triggers**: Git hooks to regenerate on significant changes
- **Web Interface**: Browser-based source tree navigation
- **Integration APIs**: Programmatic access to generated views
- **Custom Filters**: User-defined view categories and patterns
- **Diff Analysis**: Compare source trees across different timepoints

---

**Repository**: [SupportSignal Application](https://github.com/supportsignal/app.supportsignal.com.au)  
**Feature Type**: Infrastructure & Developer Experience  
**Dependencies**: gpt_context.rb (appydave-tools)  
**Maintenance**: Zero-maintenance (dynamic generation)