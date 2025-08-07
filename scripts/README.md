# Scripts Directory

This directory contains automation scripts for the SupportSignal application. Scripts are organized by function and follow consistent patterns for maintainability.

## Quick Reference - Most Common Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| [run-integration-tests.ts](#integration-testing) | Comprehensive integration testing with cleanup | `bun run uat:test` |
| [ci-status.sh](#cicd--deployment) | Check CI status | `bun run ci:status` |
| [smart-push.sh](#cicd--deployment) | Intelligent push with CI monitoring | `bun run push` |
| [generate-schema-manifest.ts](#schema--documentation) | Generate AI-optimized schema docs | `bun run schema:docs` |

## All Scripts Directory (20+ files)

| Category | Script | Purpose |
|----------|--------|---------|
| **Integration Testing** | run-integration-tests.ts | Comprehensive integration testing suite |
| **CI/CD** | ci-status.sh | Check CI pipeline status |
| **CI/CD** | ci-monitor.sh | Real-time CI monitoring |
| **CI/CD** | smart-push.sh | Intelligent push with validation |
| **Schema/Docs** | generate-schema-manifest.ts | AI-optimized schema documentation |
| **Schema/Docs** | analyze-naming-conventions.ts | Database naming convention analysis |
| **Development** | debug-env-build.cjs | Environment debugging for builds |
| **Development** | sync-env.js | Environment variable synchronization |
| **Development** | sync.sh | Repository template synchronization |
| **Deployment** | deploy-worker.sh | Cloudflare Workers deployment |
| **Knowledge** | seed-knowledge.cjs | Knowledge base seeding |
| **Knowledge** | add-knowledge.sh | Interactive knowledge addition |
| **Data Management** | cleanup-logs.sh | Application log cleanup |
| **Data Management** | migrate-logging-cleanup.sh | Legacy logging migration |
| **User Management** | grant-llm-access.sh | LLM access management |
| **Version Control** | bootstrap-version-history.sh | Version history initialization |
| **Version Control** | version-increment.sh | Automated version incrementing |
| **Configuration** | version-config.json | Version management config |
| **Configuration** | llm-files | LLM-related configuration data |

## Script Categories

### 🧪 Integration Testing

#### run-integration-tests.ts
**Primary integration testing suite with comprehensive cleanup**

- **Purpose**: Real CRUD operations testing across all 19 Convex tables
- **Features**: 
  - Creates authentic test data using existing APIs
  - Surgical cleanup with dependency ordering
  - Interactive data view menu with keyboard controls
  - Status reporting (API implemented vs future features)
  - Alphabetical table ordering to match Convex dashboard
- **Usage**: `bun run uat:test`
- **Cleanup**: Automatically removes only test-created data
- **Output**: Detailed cleanup summary with Status/Reason columns

### 🚀 CI/CD & Deployment

#### ci-status.sh
**Check current CI pipeline status**

- **Purpose**: Verify CI status for current branch
- **Features**: Recent runs, status display, GitHub Actions links
- **Usage**: `bun run ci:status [branch-name]`
- **Exit Codes**: 0=success, 1=failure, others=various states

#### ci-monitor.sh  
**Real-time CI monitoring with timeout**

- **Purpose**: Monitor CI execution with configurable timeout
- **Features**: Real-time updates, automatic failure linking
- **Usage**: `bun run ci:watch [branch-name] [timeout-seconds]`
- **Default**: 300 seconds timeout

#### smart-push.sh
**Intelligent push with comprehensive validation**

- **Workflow**: 
  1. Pre-push validation (lint, typecheck, test)
  2. Git operations (add, commit, push)
  3. Automated CI monitoring
  4. Success/failure reporting
- **Usage**: 
  - `bun run push` - With CI monitoring
  - `bun run push:no-ci` - Skip CI monitoring

#### deploy-worker.sh
**Cloudflare Workers deployment automation**

- **Purpose**: Deploy log-ingestion worker with environment management
- **Features**: Production/development environment handling
- **Usage**: Direct execution for worker deployments

#### sync.sh
**Repository synchronization with template**

- **Purpose**: Keep project aligned with template updates
- **Features**: Force sync option for major updates
- **Usage**: 
  - `bun run sync` - Standard sync
  - `bun run sync:force` - Force overwrite

### 📊 Schema & Documentation

#### generate-schema-manifest.ts
**AI-optimized schema documentation generator**

- **Purpose**: Generate comprehensive data model manifest
- **Features**:
  - Analyzes 19 Convex tables
  - AI context injection for development
  - Business meaning analysis
  - Access pattern documentation
  - Relationship mapping
- **Usage**: `bun run schema:docs`
- **Output**: 
  - `docs/architecture/data-models.manifest.json` - Full AI manifest
  - `docs/architecture/data-models-summary.md` - Human-readable summary

#### analyze-naming-conventions.ts
**Database naming convention analysis**

- **Purpose**: Analyze existing naming patterns for consistency
- **Features**: 
  - Table/field naming pattern analysis
  - BetterAuth vs App convention comparison
  - Migration recommendations
- **Usage**: Direct execution for naming reviews

### 🔧 Development & Build

#### debug-env-build.cjs
**Environment debugging for build processes**

- **Purpose**: Debug environment variables during builds
- **Features**: Environment validation, build preparation
- **Usage**: Automatically called by `bun run build`

#### sync-env.js
**Environment variable synchronization**

- **Purpose**: Sync environment variables across systems
- **Features**: Cross-environment validation
- **Usage**: `bun run sync-env`

### 📚 Knowledge Management

#### seed-knowledge.cjs
**Knowledge base seeding and management**

- **Purpose**: Populate knowledge base with structured data
- **Features**: Dry-run mode, validation
- **Usage**: 
  - `bun run seed:knowledge` - Live seeding
  - `bun run seed:knowledge:dry` - Dry run validation

#### add-knowledge.sh
**Interactive knowledge addition**

- **Purpose**: Add new knowledge entries interactively
- **Features**: Guided input, validation
- **Usage**: Direct execution for knowledge management

#### grant-llm-access.sh
**LLM access management for users**

- **Purpose**: Grant/manage LLM access permissions
- **Features**: User access control, feature gating
- **Usage**: Direct execution for user management

### 🧹 Data Management

#### cleanup-logs.sh
**Application log cleanup automation**

- **Purpose**: Clean up application and debug logs
- **Features**: Retention policies, cost management
- **Usage**: `./scripts/cleanup-logs.sh`

#### migrate-logging-cleanup.sh
**Logging system migration and cleanup**

- **Purpose**: Migrate legacy logging data
- **Features**: 
  - Status checking: `bun run migrate:logging-status`
  - Verification: `bun run migrate:logging-verify`
- **Usage**: `bun run migrate:logging-cleanup`

### 📈 Version Management

#### bootstrap-version-history.sh
**Version history initialization**

- **Purpose**: Initialize version tracking system
- **Features**: Historical data bootstrap
- **Usage**: `./scripts/bootstrap-version-history.sh`

#### version-increment.sh
**Automated version incrementing**

- **Purpose**: Increment version numbers systematically
- **Features**: Semantic versioning support
- **Configuration**: `version-config.json`

### 🧪 Legacy Testing

#### test-uat-4.2.sh
**Story 4.2 specific UAT testing**

- **Purpose**: User Acceptance Testing for Story 4.2
- **Status**: Legacy - use `run-integration-tests.ts` for new testing
- **Usage**: Direct execution (deprecated)

## Usage Patterns

### Standard Development Workflow

```bash
# 1. Check CI status before starting
bun run ci:status

# 2. Development work...

# 3. Run integration tests
bun run uat:test

# 4. Smart push with CI monitoring
bun run push
```

### Documentation Updates

```bash
# Generate schema documentation
bun run schema:docs

# Analyze naming conventions
bun scripts/analyze-naming-conventions.ts
```

### Data Management

```bash
# Seed knowledge base
bun run seed:knowledge

# Clean up logs
./scripts/cleanup-logs.sh

# Run comprehensive integration tests
bun run uat:test
```

## Configuration Files

- **version-config.json** - Version management configuration
- **llm-files/** - LLM-related configuration and data files

## Script Conventions

### Naming Patterns
- **TypeScript scripts** (`.ts`): Complex logic, API integration
- **Shell scripts** (`.sh`): System operations, CI/CD
- **JavaScript files** (`.js`, `.cjs`): Node.js utilities

### Exit Codes
- **0**: Success/completion
- **1**: Failure (errors, authentication issues)
- **2**: Cancelled operations  
- **124**: Timeout reached
- **3+**: Warning states

### Output Formatting
- **🎯 Emojis**: Visual categorization and status indication
- **Colors**: Status communication (green=success, red=error, yellow=warning)
- **Tables**: Structured data presentation
- **Progress**: Real-time status updates

## Integration with Package.json

All major scripts are accessible via `bun run` commands:

```json
{
  "uat:test": "bun run scripts/run-integration-tests.ts",
  "schema:docs": "bun run scripts/generate-schema-manifest.ts", 
  "ci:status": "./scripts/ci-status.sh",
  "push": "./scripts/smart-push.sh"
}
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure scripts are executable (`chmod +x script.sh`)
2. **Environment Variables**: Check `.env` files and environment setup
3. **Dependencies**: Run `bun install` if scripts fail with import errors
4. **Convex Connection**: Verify `CONVEX_URL` environment variable

### Debug Mode

Most TypeScript scripts support verbose output:
```bash
bun run scripts/script-name.ts --verbose
```

### CI Integration

Scripts integrate with GitHub Actions:
- Use `bun run ci:status` to check pipeline status
- Use `bun run push` for automated CI monitoring
- Check script exit codes for automation integration

---

*This documentation is automatically maintained. Update it when adding new scripts or modifying existing functionality.*