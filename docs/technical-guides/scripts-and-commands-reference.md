# Scripts and Commands Reference

## Overview

This reference guide documents the complete script ecosystem for the Next.js Convex AI template, including both package.json scripts and shell scripts in the `/scripts/` directory. These scripts form an integrated system for development, deployment, and maintenance.

## Quick Reference

| Command | Type | Purpose |
|---------|------|---------|
| `bun dev` | Package | Start development server |
| `bun run sync-env` | Package → Script | Sync environment variables |
| `bun run push` | Package → Script | Smart git push with validation |
| `bun run ci:status` | Package → Script | Check CI pipeline status |
| `./scripts/cleanup-logs.sh` | Shell | Clean up Convex logs |
| `./scripts/grant-llm-access.sh` | Shell | Grant user LLM permissions |

## Package.json Scripts

### Development Workflow Scripts

#### `bun dev`
**Purpose**: Start all development servers (Next.js, Convex)
**Command**: `turbo dev`
**Usage**:
```bash
bun dev                    # Start all services
```
**Integration**: Uses Turbo to coordinate multiple dev servers in the monorepo

#### `bun build`
**Purpose**: Build all applications for production
**Command**: `turbo build`
**Usage**:
```bash
bun build                  # Build all apps
```
**Notes**: Required before deployment to Cloudflare Pages

#### `bun typecheck`
**Purpose**: TypeScript compilation check across monorepo
**Command**: `turbo typecheck`
**Usage**:
```bash
bun typecheck              # Check all TypeScript
```
**Integration**: Used by smart-push.sh for pre-push validation

#### `bun lint`
**Purpose**: ESLint validation across monorepo
**Command**: `turbo lint`
**Usage**:
```bash
bun lint                   # Check code quality
bun lint:fix               # Auto-fix issues
```
**Integration**: Used by smart-push.sh and CI pipeline

#### `bun format`
**Purpose**: Code formatting with Prettier
**Command**: `turbo format`
**Usage**:
```bash
bun format                 # Format all code
bun format:check           # Check formatting only
```

#### `bun test`
**Purpose**: Run unit tests across monorepo
**Command**: `turbo test`
**Usage**:
```bash
bun test                   # Run all unit tests
```

#### `bun clean`
**Purpose**: Clean build artifacts
**Command**: `turbo clean`
**Usage**:
```bash
bun clean                  # Clean all build outputs
```

### Testing Scripts

#### E2E Testing with Playwright
```bash
bun test:e2e               # Run Playwright tests
bun test:e2e:ui            # Run with UI mode
bun test:e2e:install       # Install Playwright browsers
```

**Integration**: Playwright tests run in CI pipeline

### Storybook Scripts

#### Component Development
```bash
bun storybook              # Start Storybook dev server
bun build-storybook        # Build static Storybook
```

**Directory**: Runs from `packages/storybook/`
**Port**: Uses development guide port allocation

### Convex Backend Scripts

#### `bun convex:dev`
**Purpose**: Start Convex development server
**Command**: `cd apps/convex && npx convex dev`
**Usage**:
```bash
bun convex:dev             # Start Convex backend
```
**Requirements**: Requires `.env.local` with Convex configuration

#### `bun convex:deploy`
**Purpose**: Deploy Convex functions to production
**Command**: `cd apps/convex && npx convex deploy`
**Usage**:
```bash
bun convex:deploy          # Deploy to production
```
**Security**: Production deployments require manual execution

### CI/CD & Quality Scripts

#### `bun run ci:status`
**Purpose**: Check GitHub Actions CI status for current branch
**Command**: `./scripts/ci-status.sh`
**Usage**:
```bash
bun run ci:status          # Check current branch CI
bun run ci:status develop  # Check specific branch
```
**Exit Codes**: 0=success, 1=failure, others=various states

#### `bun run ci:watch`
**Purpose**: Monitor CI execution with real-time updates
**Command**: `./scripts/ci-monitor.sh`
**Usage**:
```bash
bun run ci:watch           # Monitor with 300s timeout
bun run ci:watch main 600  # Monitor main branch, 600s timeout
```

#### `bun run ci:logs`
**Purpose**: View failed CI logs for current branch
**Command**: Complex GitHub CLI query
**Usage**:
```bash
bun run ci:logs            # View latest failed run logs
```
**Requirements**: Requires `gh` CLI authentication

#### `bun run push`
**Purpose**: Smart git push with pre-validation and CI monitoring
**Command**: `./scripts/smart-push.sh`
**Usage**:
```bash
bun run push               # Full validation + CI monitoring
bun run push:no-ci         # Skip CI monitoring
```

**Pre-push Validation**:
1. TypeScript type checking
2. ESLint code quality
3. Production build test
4. Only pushes if all pass

### Environment Management Scripts

#### `bun run sync-env`
**Purpose**: Synchronize environment variables from source of truth
**Command**: `node ./scripts/sync-env.js`  
**Usage**:
```bash
bun run sync-env           # Full sync to dev deployment
bun run sync-env --dry-run # Preview changes only
```

**Features**:
- Parses `.env.source-of-truth.local` table format
- Generates Next.js and Convex environment files
- Validates environment variables
- Syncs to Convex deployment
- Creates automatic backups

**File Generation**:
- `apps/web/.env.local` - Next.js environment
- `apps/convex/.env.local` - Convex environment  
- `.env.backup.local` - Automatic backup

## Shell Scripts (`/scripts/` Directory)

### Environment Management

#### `sync-env.js`
**Type**: Node.js script
**Purpose**: Advanced environment variable synchronization
**Usage**:
```bash
node ./scripts/sync-env.js [options]
```

**Options**:
- `--dry-run` - Preview changes without applying
- `--deployment=dev` - Target deployment (default: dev)
- `--verbose` - Detailed logging

**Integration**: Called by `bun run sync-env`

### CI/CD Management

#### `smart-push.sh`
**Type**: Bash script
**Purpose**: Intelligent git push with comprehensive validation
**Usage**:
```bash
./scripts/smart-push.sh [monitor_ci]
```

**Parameters**:
- `monitor_ci` - boolean, default true

**Workflow**:
1. Check for uncommitted changes
2. Check for commits to push
3. Run local validation (typecheck, lint, build)
4. Push to remote if validation passes
5. Monitor CI pipeline
6. Report final status

#### `ci-status.sh`
**Type**: Bash script  
**Purpose**: Check GitHub Actions CI status
**Usage**:
```bash
./scripts/ci-status.sh [branch_name]
```

**Output**:
- Recent CI runs with timestamps
- Current pipeline status
- Direct GitHub Actions links
- Exit codes for automation

#### `ci-monitor.sh`
**Type**: Bash script
**Purpose**: Real-time CI monitoring with timeout
**Usage**:
```bash
./scripts/ci-monitor.sh [branch_name] [timeout_seconds]
```

**Features**:
- Configurable timeout (default: 300 seconds)
- Progress updates
- Automatic failure log links
- Integration with smart-push.sh

### Application Management

#### `cleanup-logs.sh`
**Type**: Bash script
**Purpose**: Automated Convex log cleanup for cost management
**Usage**:
```bash
./scripts/cleanup-logs.sh
```

**Workflow**:
1. Check initial log status
2. Run safe cleanup (expired/old logs)
3. Run multiple cleanup cycles
4. Report final status

**Cost Management**: Essential for keeping Convex usage under $10/month

#### `grant-llm-access.sh`
**Type**: Bash script
**Purpose**: Grant LLM access permissions to users
**Usage**:
```bash
./scripts/grant-llm-access.sh user@example.com
```

**Requirements**:
- User must exist in system
- Convex migration must be available
- Run from project root

## Script Integration Patterns

### Development Workflow Integration

**Daily Development**:
```bash
# 1. Sync environment (if changed)
bun run sync-env

# 2. Start development
bun dev

# 3. Run tests during development
bun test

# 4. Pre-commit checks
bun typecheck && bun lint

# 5. Smart push when ready
bun run push
```

### CI/CD Integration

**Continuous Integration**:
- `bun lint` - Code quality validation
- `bun typecheck` - Type safety validation  
- `bun test` - Unit test execution
- `bun build` - Production build verification

**Deployment Pipeline**:
- GitHub Actions triggers on push to main
- Automated Cloudflare Pages deployment
- Convex functions deployed separately

### Environment Management Integration

**Environment Sync Workflow**:
1. Edit `.env.source-of-truth.local`
2. Run `bun run sync-env`
3. Restart development servers
4. Verify applications work correctly

### Monitoring & Maintenance

**Regular Maintenance**:
```bash
# Check CI health
bun run ci:status

# Clean up logs monthly
./scripts/cleanup-logs.sh

# Grant access to new users
./scripts/grant-llm-access.sh user@domain.com
```

## Error Handling & Troubleshooting

### Common Issues

**Environment Sync Failures**:
```bash
# Check source file exists
ls -la .env.source-of-truth.local

# Run in dry-run mode first
bun run sync-env --dry-run

# Check Convex connectivity
cd apps/convex && bunx convex dev
```

**CI Monitoring Issues**:
```bash
# Check GitHub CLI authentication
gh auth status

# Verify repository access
gh repo view

# Check branch exists
git branch -a
```

**Smart Push Failures**:
```bash
# Run individual validation steps
bun typecheck
bun lint  
bun build

# Check git status
git status
git log --oneline -5
```

### Script Permissions

Ensure shell scripts are executable:
```bash
chmod +x scripts/*.sh
```

### Dependencies

**Required Tools**:
- Bun (package manager)
- Node.js (for sync-env.js)
- GitHub CLI (for CI scripts)
- Git (for push operations)

## Security Considerations

### Environment Variables
- Never commit `.env.source-of-truth.local`
- Use secure secrets for production
- Validate environment variables before sync

### Script Execution
- Review scripts before running
- Use dry-run modes when available
- Monitor output for sensitive data exposure

### CI/CD Security
- Protect main branch with CI requirements
- Use GitHub Secrets for sensitive data
- Monitor deployment logs for security issues

## Performance Notes

### Script Execution Times
- `bun run sync-env`: ~2-5 seconds
- `bun run push`: ~30-60 seconds (with validation)
- `bun run ci:watch`: ~5 minutes (full CI pipeline)

### Optimization Tips
- Use `--dry-run` to preview changes
- Run validation locally before pushing
- Clean up logs regularly to improve performance

## Related Documentation

- **[Environment Management](./environment-management.md)** - Detailed environment variable strategy
- **[CI/CD Pipeline Setup](./cicd-pipeline-setup.md)** - Complete CI/CD configuration
- **[Development Guide](../development-guide.md)** - Development workflow and port management
- **[Cloudflare Pages Setup](./cloudflare-pages-setup.md)** - Deployment configuration

---

**Created**: For new repository setup and daily development workflows  
**Maintained**: Update when adding new scripts or changing workflows  
**Usage**: Reference guide for developers and CI/CD automation