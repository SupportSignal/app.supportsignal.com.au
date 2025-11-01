# Command Reference

Complete reference for all development, testing, deployment, and monitoring commands.

**Last Updated:** October 2025

---

## Core Development Commands

### Development Servers

```bash
# Start all development servers (The Way You Always Do It)
bun web:dev          # Next.js web development server (port 3200)
bun convex:dev       # Convex backend development server
bun worker:dev       # Cloudflare Workers development server

# Production Build
bun build            # Build for production
bun start            # Start production server
```

### Code Quality

```bash
# Type Checking & Linting
bun run typecheck    # TypeScript compiler validation
bun run lint         # ESLint validation
bun run format       # Prettier code formatting
```

---

## Testing Commands

### Test Execution (The Way You Always Do It)

```bash
# Convex Backend Tests
bun test:convex:coverage:watch:all    # With coverage + watch mode

# Cloudflare Workers Tests
bun test:worker:coverage:watch:all    # With coverage + watch mode

# Web (React/Next.js) Tests
bun test:web:coverage:watch:all       # With coverage + watch mode

# All Tests
bun test              # Run all test suites
```

### Legacy Test Commands

```bash
# Individual test suites
npm test              # React component tests (use for act() warnings)
bun test:convex       # Convex backend only
bun test:worker       # Workers only
bun test:web          # Web only
```

---

## CI Verification & Monitoring

### CI Status & Monitoring (MANDATORY before story completion)

```bash
# Check CI Pipeline Status
bun run ci:status [branch-name]    # View current CI status
bun run ci:watch [branch-name]     # Monitor CI execution with updates
bun run ci:logs                    # View detailed CI failure logs

# Smart Push with CI Integration
bun run push                       # Push with automatic CI monitoring
```

### Systematic CI Verification Workflow

```bash
# MANDATORY before marking story complete
pwd                    # Verify project root
bun run typecheck     # TypeScript validation
bun run lint          # ESLint compliance
bun test              # Local test execution
bun run build         # Production build test
bun run ci:status     # CI pipeline verification
```

---

## Convex Backend

### Convex Development

```bash
# Start Convex Development
bunx convex dev                    # Start Convex development server
bun run convex:dev                 # Alternative via package.json

# Deployment
bunx convex deploy                 # Deploy to default environment
bun run convex:deploy:dev          # Deploy to dev (beaming-gull-639)
bun run convex:deploy:prod         # Deploy to prod (graceful-shrimp-355)
```

### Database Operations

```bash
# Query Data
bunx convex data [table] --limit [n]           # Development data
bunx convex data --prod [table] --limit [n]    # Production data

# Environment Variables
bunx convex env list               # List all environment variables
bunx convex env set KEY VALUE      # Set environment variable

# Monitoring
bunx convex logs                   # View deployment logs
bunx convex function-spec          # List available functions

# Database Monitoring & Cleanup
bunx convex run monitoring:usage   # Database usage stats and warnings
bunx convex run monitoring:traces  # Find traces generating lots of logs
bunx convex run cleanup:status     # Check what needs cleaning
bunx convex run cleanup:safe       # Normal maintenance (expired/old logs)
bunx convex run cleanup:force      # Emergency cleanup (delete ALL logs)
./scripts/cleanup-logs.sh          # Automated cleanup script
```

---

## Environment Management

### Environment Synchronization

```bash
# Sync Environment Variables (Source of Truth: ~/.env-configs/)
bun run sync-env --mode=local        # Generate local .env files (DEV values)
bun run sync-env --mode=deploy-dev   # Deploy dev values to Convex
bun run sync-env --mode=deploy-prod  # Deploy prod values to Convex

# Options
--dry-run                            # Show changes without applying
--verbose                            # Detailed output
```

### Key Environment Variables

**Convex:**
- `CONVEX_DEPLOYMENT` - dev:beaming-gull-639 / prod:graceful-shrimp-355
- `NEXT_PUBLIC_CONVEX_URL` - Public Convex endpoint
- `OPENAI_API_KEY` - AI model access

**Cloudflare:**
- `CLOUDFLARE_ACCOUNT_ID` - Account identifier
- `CLOUDFLARE_API_TOKEN` - API access token
- `NEXT_PUBLIC_LOG_WORKER_URL` - Log ingestion worker

---

## Cloudflare Deployment

### Cloudflare Pages

```bash
# Build for Cloudflare Pages
cd apps/web && bun run build:pages  # Includes CI=true flag

# Manual Deployment (testing only)
bun run pages:deploy                # Deploy via Wrangler CLI
bun run pages:dev                   # Local Pages emulation

# Auto-deployment
git push origin main                # Triggers automatic deployment
```

### Cloudflare Workers

```bash
# Worker Development
bun worker:dev                      # Start local worker development

# Worker Deployment
wrangler deploy                     # Deploy worker to Cloudflare
wrangler list                       # List deployed workers
```

---

## Development Tools

### Claude Integration

```bash
# Chrome DevTools Integration
bun chrome:debug     # Start Chrome with debugging port
bun claude:bridge    # Start Claude Dev Bridge for log capture
```

### Verification Scripts

```bash
# Operations Verification (See scripts/ directory)
./scripts/verify-deployment.sh     # Comprehensive deployment verification
./scripts/verify-worker-health.sh  # Cloudflare Worker health checks
./scripts/verify-environment.sh    # Environment detection & validation
./scripts/validate-config.sh       # Configuration validation
./scripts/check-config-drift.sh    # Configuration drift detection
./scripts/health-check.sh          # Quick service health verification
```

---

## Commonly Missed Patterns

**Before troubleshooting, check existing documentation:**

1. **Testing Issues**: `docs/testing/technical/testing-infrastructure-lessons-learned.md`
2. **Jest Configuration**: `docs/testing/technical/test-migration-and-configuration-kdd.md`
3. **TypeScript Errors in Tests**: Apply `@ts-nocheck` pragmatically
4. **Path Resolution**: Use configured aliases (`@/`) not relative paths
5. **Directory Navigation**: ALWAYS `pwd` first, run from project root
6. **Test Location**: ALL tests in `tests/` directory (centralized)
7. **Package.json Scripts**: Update when moving tests

**Documentation-First Protocol**: Search existing docs before implementing new solutions.

---

## Project Information

### Directory Structure

```
apps/web/           # Next.js application
apps/convex/        # Convex backend functions
apps/workers/       # Cloudflare Workers
packages/ui/        # Shared UI components
tests/              # Centralized test files
```

### Version Requirements

```
Node.js: 18+ required
Bun: Latest (package manager)
Next.js: 14.2.15
React: 18.2.0
Convex: 1.25.4+
TypeScript: 5.4.5+
```

### Key Dependencies

```
UI Framework: ShadCN + Radix UI
Styling: Tailwind CSS 3.4.14
Authentication: BetterAuth 1.2.12
State Management: Zustand
Icons: Lucide React
Testing: Jest + Playwright
```

---

## Quick Command Lookup

**Start Development:** `bun web:dev && bun convex:dev`
**Run Tests:** `bun test:convex:coverage:watch:all` (or web/worker variants)
**Check Types:** `bun run typecheck`
**Check CI:** `bun run ci:status`
**Deploy Convex:** `bun run convex:deploy:dev` (or :prod)
**Sync Environment:** `bun run sync-env --mode=local`
**Database Query:** `bunx convex data [table] --limit 10`
