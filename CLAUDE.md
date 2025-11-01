# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents

- Project Overview
- Import Path Guidelines
- Development Commands
- Architecture & Key Patterns
- Development Workflow
- Important Conventions
- Database Access & Environment Context
- Specialized Agent Delegation
- Testing Documentation Priority
- File Creation Discovery Protocol
- Claude Navigation & Directory Awareness
- CI Verification Scripts & Monitoring Tools
- Important Instruction Reminders
- Quick Reference

## Project Overview

**SupportSignal Application** - A Next.js AI-powered application built from the starter-nextjs-convex-ai template designed for AI-first development using:

- **Next.js** (App Router) with TypeScript
- **Convex** for backend and real-time features
- **Tailwind CSS** + **ShadCN UI** for styling
- **Cloudflare** Pages/Workers for edge deployment
- **Bun** as the package manager

**Setup Reference**: Follow the [New Repository Setup Guide](docs/template-usage/new-repository-setup-guide.md) for complete deployment configuration.

## Import Path Guidelines

**CRITICAL**: Use configured path aliases instead of relative imports.

**✅ Correct Import Patterns**:

```typescript
// Worker tests
import worker from '@/index'; // NOT: '../../../../apps/workers/log-ingestion/src/index'
import { RateLimiterDO } from '@/rate-limiter'; // NOT: '../../../../apps/workers/log-ingestion/src/rate-limiter'

// Web app
import { Button } from '@/components/ui/button'; // Standard alias pattern
```

**❌ Avoid These Patterns**:

```typescript
import worker from '../../../../apps/workers/log-ingestion/src/index'; // Ugly relative paths
import { Component } from '../../../components/ui/Component'; // Confusing navigation
```

**Configuration**: Path aliases are configured in Jest configs via `moduleNameMapper` - use them!

## Development Commands

```bash
# Development (The Way You Always Do It)
bun web:dev          # Start web development server
bun convex:dev       # Start Convex backend development
bun worker:dev       # Start Cloudflare Workers development

# Build & Production
bun build            # Build for production
bun start            # Start production server

# Testing (The Way You Always Do It)
bun test:convex:coverage:watch:all    # Convex backend tests with coverage + watch
bun test:worker:coverage:watch:all    # Cloudflare Workers tests with coverage + watch
bun test:web:coverage:watch:all       # Web (React/Next.js) tests with coverage + watch

# Linting & Formatting
bun lint             # Run ESLint
bun format           # Run Prettier
bun typecheck        # Run TypeScript compiler checks

# CI Monitoring & Smart Push
bun run ci:status    # Check CI status for current branch
bun run ci:watch     # Monitor CI runs with real-time updates
bun run ci:logs      # View detailed CI logs

# Systematic CI Verification (MANDATORY)
# These commands MUST be run after story completion and before marking complete
bun run typecheck    # TypeScript compilation verification
bun run lint         # ESLint validation
bun run ci:status    # Verify CI pipeline status
bun run ci:watch     # Monitor CI completion (when CI is running)

# Convex Backend
bunx convex dev              # Start Convex development server
bun run convex:deploy:dev    # Deploy to dev environment (beaming-gull-639)
bun run convex:deploy:prod   # Deploy to prod environment (graceful-shrimp-355)
bun run convex:deploy        # Legacy: prompts for prod (avoid)

# Cloudflare Pages Deployment
cd apps/web
bun run build:pages  # Build for Cloudflare Pages (includes CI=true flag)
bun run pages:deploy # Manual deployment via Wrangler CLI
bun run pages:dev    # Local development with Cloudflare Pages emulation

# Claude Integration
bun chrome:debug     # Start Chrome with debugging port
bun claude:bridge    # Start Claude Dev Bridge for log capture

# Monitoring & Cleanup
bunx convex run cleanup:status                    # Check what needs cleaning with message patterns
bunx convex run monitoring:usage                  # Database usage stats and warnings
bunx convex run monitoring:traces                 # Find traces generating lots of logs

# Cleanup Commands (run multiple times until totalDeleted returns 0)
bunx convex run cleanup:safe                      # Normal maintenance - expired/old logs only
bunx convex run cleanup:force                     # Testing/emergency - delete ALL logs
./scripts/cleanup-logs.sh                         # Automated cleanup script

## Architecture & Key Patterns

### Directory Structure

```
/
├── apps/web/           # Next.js application
│   ├── app/           # App Router pages and layouts
│   ├── components/    # React components
│   └── lib/          # Utilities and shared code
├── apps/convex/       # Convex backend functions
├── packages/
│   ├── ui/           # Shared UI components library
│   └── convex/       # Shared Convex schemas/helpers
└── tests/            # E2E Playwright tests
```

### Dynamic Source Tree System

The project includes a comprehensive navigation system providing always-current, categorized views of the codebase:

**Location**: `docs/architecture/source-tree/`

**15 Available Views**:
- **Core**: All files (with/without hidden), hidden-only views
- **Code**: Code-only, code-plus-tests, architecture-context views  
- **Documentation**: Permanent vs transient documentation views
- **Specialized**: Tests, config, deployment files, deprecated files
- **Module-Specific**: Backend-only, frontend-only views

**Usage**:
```bash
# Generate all views
./docs/architecture/source-tree/generate-trees.sh

# Individual commands available in:
# docs/architecture/source-tree/commands.md
```

**Benefits**: Always-current project structure, optimal AI context, zero maintenance overhead.

### Key Architectural Patterns
*Last Updated: September 30, 2025*

1. **Convex Integration**
   - All backend logic lives in `convex/` directory
   - Use `useQuery` and `useMutation` hooks for data fetching
   - Real-time subscriptions are automatic with `useQuery`
   - Schema validation with Convex's built-in validators

2. **Component Architecture**
   - Server Components by default in `app/` directory
   - Client Components marked with `"use client"`
   - UI components use ShadCN pattern with Radix UI primitives
   - Styling with Tailwind CSS and clsx for conditional classes

3. **State Management**
   - Server state: Convex (real-time, persistent)
   - Client state: Zustand (lightweight, type-safe)
   - Theme state: next-themes for dark/light mode

4. **Authentication**
   - BetterAuth with Convex adapter
   - Session management through Convex
   - Protected routes using middleware

5. **Error Handling**
   - Custom error boundaries for graceful degradation
   - Convex error handling with proper status codes
   - Toast notifications with Sonner

## Development Workflow

### BMAD Method (Before, Model, After, Document)

**Required Phases:**
1. **Before**: Capture context, verify CI status with `bun run ci:status`
2. **Model**: Implement with Claude, consider CI compatibility
3. **After**: MANDATORY verification: `pwd && bun run typecheck && bun run lint && bun test && bun run ci:status`
4. **Document**: Capture learnings, update docs (only after CI is green)

**Critical Rules:**
- ❌ Never skip CI verification in After phase
- ❌ Never proceed to Document phase until CI is green
- ✅ Use tester agent for complex CI debugging

### BMAD Agents

**Location**: `.bmad-core/agents/` (11 specialized agents)

**Key Agents**: bmad-master, architect, dev, pm, po, qa, sm, test-dev, analyst, ux-expert, bmad-orchestrator

**Usage**: Load agent files to adopt specialized personas. Agents execute tasks with `*` commands (`*help`, `*task`, `*create-doc`).

**Complete Guide**: See `.bmad-core/` directory and [BMAD Methodology](docs/methodology/bmad-context-engineering.md).

### Worktree Workflow

**When to Use**: Simple UI changes, docs, isolated refactoring (no schema/testing/multi-service work)

**Workflow**:
1. Invoke `*worktree-manager` to assess suitability
2. Human executes scripts (AI provides instructions only): `./scripts/worktree-start.sh X.Y`
3. Develop in worktree, document handoff with `*worktree-manager`
4. Human merges: `./scripts/worktree-end.sh X.Y`
5. Test in main branch before marking story complete

**Safety**: AI never executes worktree scripts, always `pwd`, story completion only after main branch testing.

**Complete Guide**: [Worktree Pattern](docs/patterns/worktree-development-pattern.md)

### BMAD Documentation Structure

The project uses sharded documentation for AI agent consumption:

- **[docs/prd/](docs/prd/)** - Sharded Product Requirements (Epic 1-7)
- **[docs/architecture/](docs/architecture/)** - Sharded Architecture components
- **[docs/methodology/](docs/methodology/)** - BMAD methodology guides

For systematic development, reference specific epics and architectural components as needed.

### Testing Strategy

**CRITICAL**: ALL tests use centralized pattern in `tests/` directory, not app directories.

- **Unit tests**: `tests/{app}/src/` - utilities, hooks, individual functions
- **Integration tests**: `tests/{app}/integration/` - full workflows, cross-system
- **E2E tests**: `tests/e2e/` - critical user flows
- **Workers**: `tests/workers/{worker-name}/` - Cloudflare Worker testing

#### Testing Migration Quick Reference

**Before moving tests from app directories:**

1. **Create centralized structure**: `mkdir -p tests/{app-name}/{src,integration}`
2. **Move preserving structure**: Keep unit vs integration separation
3. **Update imports to use aliases**: `@/module` instead of `../../../../apps/`
4. **Update Jest config**: Set `rootDir: '.'` and proper path mapping
5. **Update package.json scripts**: Use centralized Jest configs
6. **Apply pragmatic TypeScript**: Use `@ts-nocheck` for interface issues
7. **Run from project root**: Always `pwd` first, execute from project root

**Detailed Guide**: [Test Migration KDD](docs/testing/technical/test-migration-and-configuration-kdd.md)

### CI Verification Process (MANDATORY)

**Critical Gap Identified**: Local tests passing ≠ CI success. The following systematic verification MUST be performed:

#### Before Story Completion (REQUIRED)

1. **Local Verification Suite**:

   ```bash
   # Run ALL verification commands in sequence
   pwd                    # Verify project root directory
   bun run typecheck     # TypeScript compilation check
   bun run lint          # ESLint validation
   bun test              # Unit tests (use npm test for React components)
   bun run build         # Production build verification
   ```

2. **CI Pipeline Verification**:

   ```bash
   # After pushing changes
   bun run ci:status     # Check current CI status
   bun run ci:watch      # Monitor CI execution (if running)

   # If CI fails, investigate immediately
   bun run ci:logs       # View detailed failure logs
   ```

#### Story Completion Checklist (NON-NEGOTIABLE)

**NEVER mark a story as complete until ALL of these pass:**

- [ ] **Local TypeScript**: `bun run typecheck` passes with 0 errors
- [ ] **Local Linting**: `bun run lint` passes with 0 warnings
- [ ] **Local Tests**: All test suites pass (unit + integration)
- [ ] **Local Build**: `bun run build` completes successfully
- [ ] **CI Pipeline**: `bun run ci:status` shows SUCCESS for latest commit
- [ ] **Deployment**: Site accessible and functional (for main branch)

#### When CI Verification Fails

**Immediate Actions Required:**

1. **Don't ignore CI failures** - they represent production environment issues
2. **Fix before proceeding** - no new work until CI is green
3. **Document lessons learned** - update testing documentation
4. **Use tester agent** - delegate complex CI debugging to testing specialist

#### Integration with BMAD Phases

**Before Phase**: Verify CI status of current branch
**Model Phase**: Include CI considerations in implementation planning
**After Phase**: Mandatory CI verification before completion
**Document Phase**: Capture CI-related lessons learned

#### KDD (Knowledge-Driven Development) Integration

**MANDATORY**: Every story completion MUST execute KDD knowledge capture:

```bash
# After story implementation completion:
*task capture-kdd-knowledge    # Extract patterns and lessons to knowledge base
```

**KDD writes to knowledge base, NOT stories:**
- `docs/patterns/` - Architectural patterns and best practices
- `docs/examples/` - Working implementation examples
- `docs/lessons-learned/` - Technical insights and breakthroughs

**KDD Process:**
1. **Git Analysis**: Focus on files that actually changed during story
2. **Pattern Extraction**: Document new architectural patterns discovered
3. **Example Creation**: Extract reusable code and configurations
4. **Lesson Capture**: Record technical insights for future development
5. **Minimal Story Reference**: Brief summary with links to knowledge assets

**CRITICAL - Story Template Compliance:**
- Story files have "Knowledge Capture Reference" section for **LINKS ONLY**
- **DO NOT write detailed KDD content in stories** - they are not referenced by future agents
- Stories should contain **only file paths** to knowledge base and **1-2 sentence summary** maximum
- All detailed lessons, patterns, and examples go to permanent knowledge base files

**Why KDD Matters**: Transforms individual implementations into institutional knowledge that accelerates future development and prevents knowledge loss.

### Deployment

#### Cloudflare Pages Configuration

- **Auto-deployment**: Configured for `main` branch via Git integration
- **Build Command**: `bun run build && bun run pages:build`
- **Output Directory**: `dist`
- **Root Directory**: `apps/web`
- **Environment Variables**: `HUSKY=0` (required for CI)
- **Compatibility Flags**: `nodejs_compat` (required for Node.js runtime)

#### Critical Requirements

- **Next.js Config**: Must use `output: 'export'` for static generation
- **Images**: Must set `images: { unoptimized: true }` for Cloudflare compatibility
- **No wrangler.toml**: Use only Cloudflare Pages dashboard configuration
- **CI Compatibility**: Husky scripts must be disabled in CI environment

#### Deployment Commands

```bash
# Local testing
cd apps/web && bun run build:pages

# Manual deployment (testing only)
bun run pages:deploy

# Auto-deployment (production)
git push origin main  # Triggers automatic deployment
```

#### Troubleshooting

- See [Deployment Troubleshooting Guide](docs/technical-guides/cloudflare-pages-deployment-troubleshooting.md)
- Check build logs in Cloudflare Pages dashboard
- Verify compatibility flags are enabled for both Production and Preview environments
- **Dual Deployment Issues**: If seeing two deployments per commit, disable Cloudflare Pages auto-deploy in dashboard
- **Environment Variables**: If production shows localhost values, check GitHub repository secrets configuration

#### Convex Backend

- Convex functions deploy separately via `bunx convex deploy`
- Independent of Cloudflare Pages deployment
- Environment variables managed through Convex dashboard

## Important Conventions

1. **File Naming**
   - Components: PascalCase (e.g., `UserProfile.tsx`)
   - Utilities: camelCase (e.g., `formatDate.ts`)
   - Convex functions: camelCase (e.g., `getUsers.ts`)

2. **TypeScript**
   - Strict mode enabled for production code
   - Prefer interfaces over types for objects
   - Use Zod for runtime validation
   - Export types from Convex schemas
   - **For tests/interface issues**: Use `@ts-nocheck` pragmatically when TypeScript errors don't affect functionality

3. **Styling**
   - Tailwind utilities first
   - CSS modules for complex components
   - Follow ShadCN theming patterns

4. **Performance**
   - Use dynamic imports for heavy components
   - Optimize images with Next.js Image
   - Implement proper loading states
   - Cache Convex queries appropriately

## Database Access & Environment Context
*Last Updated: September 30, 2025*

### **Production vs Development Data Access**

**When user asks for "production data"**: Use `bunx convex data --prod`
**When user asks for "development data"**: Use `bunx convex data` (default)

### **Environment State (Current)**
- **Production Database**: 10 users, 3 companies, 0 participants (minimal production data)
- **Development Database**: 30 users, 32 companies, 11 participants (extensive test data)
- **Environments**: Properly separated (confirmed via Convex CLI and dashboard screenshots)

### **MCP Configuration Lessons Learned**
- **Convex MCP integration attempted but failed**: Admin key authentication not working with MCP servers
- **Current MCP setup**: Reverted to basic single `convex` server in `.mcp.json` (non-functional)
- **Working alternative**: Direct Convex CLI access with `--prod` flag for production, default for development
- **Authentication**: CLI uses standard user authentication (no admin keys needed)
- **Data verification method**: Always verify which environment by checking data counts

### **Database Query Patterns**
```bash
# Production (minimal production data)
bunx convex data --prod users --limit 3        # Shows 10 users
bunx convex data --prod companies --limit 3    # Shows 3 companies
bunx convex data --prod participants --limit 3 # Empty table

# Development (extensive test data)
bunx convex data users --limit 3               # Shows 30 users
bunx convex data companies --limit 3           # Shows 32 companies
bunx convex data participants --limit 3        # Shows 11 participants
```

### **Available Convex CLI Operations**

**Data Operations:**
- `bunx convex data [table]` - Query tables
- `bunx convex run [function]` - Run queries/mutations
- `bunx convex import` - Import data
- `bunx convex export` - Export data

**Environment Management:**
- `bunx convex env list` - List environment variables
- `bunx convex env set` - Set environment variables

**Development:**
- `bunx convex logs` - View deployment logs
- `bunx convex function-spec` - List available functions

**Examples:**
```bash
# Query production data
bunx convex data --prod users --limit 10

# Run a specific function
bunx convex run getCompanies '{"limit": 5}'

# Export production data
bunx convex export --prod
```

**Note:** Admin keys are NOT required for CLI operations - uses standard user authentication from `npx convex dev` login session.

## Environment Variables Management
*Last Updated: September 30, 2025*

### **Source of Truth System**

All environment variables are managed through a centralized source of truth system:

**Location**: `~/.env-configs/app.supportsignal.com.au.env`

**Format**: Table format with DEV_VALUE and PROD_VALUE columns
```
| TARGET               | GROUP                       | KEY                       | DEV_VALUE                 | PROD_VALUE                |
|----------------------|-----------------------------|---------------------------|---------------------------|---------------------------|
| NEXTJS,CONVEX        | Local Development           | NEXT_PUBLIC_APP_URL       | http://localhost:3200     | https://app.supportsignal.com.au |
| CONVEX               | GitHub OAuth                | GITHUB_CLIENT_ID          | Ov23liMO6dymiqZKmiBS      | Ov23liMO6dymiqZKmiBS      |
```

### **Sync Environment Script**

Use the sync-env script to generate environment files:

```bash
# Generate local .env files (always uses DEV_VALUE)
bun run sync-env --mode=local

# Deploy to cloud platforms
bun run sync-env --mode=deploy-dev    # Deploy dev values to Convex
bun run sync-env --mode=deploy-prod   # Deploy prod values to Convex

# Options
--dry-run    # Show what would change without applying
--verbose    # Show detailed output
```

### **Key Environment Variables**

**Convex:**
- `CONVEX_DEPLOYMENT` - Deployment identifier (dev:beaming-gull-639 / prod:graceful-shrimp-355)
- `NEXT_PUBLIC_CONVEX_URL` - Public Convex endpoint
- `OPENAI_API_KEY` - AI model access
- `GITHUB_CLIENT_ID/SECRET` - OAuth authentication

**Cloudflare:**
- `CLOUDFLARE_ACCOUNT_ID` - Account identifier
- `CLOUDFLARE_API_TOKEN` - API access token
- `NEXT_PUBLIC_LOG_WORKER_URL` - Log ingestion worker

**Architecture Principle:**
- **Local files (.env.local)**: Always contain development values
- **Production values**: Deployed directly to cloud platforms (Convex, Cloudflare)
- **Never commit**: .env.local files to version control

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.

## Commonly Missed Patterns

**Documentation-First Protocol**: Before troubleshooting, check if we already documented the solution.

**Quick Fixes:**
1. **Testing Issues**: `docs/testing/technical/testing-infrastructure-lessons-learned.md`
2. **TypeScript Errors in Tests**: Use `@ts-nocheck` pragmatically - don't fight interface issues
3. **Path Resolution**: Use `@/` aliases, not relative paths (`../../../../`)
4. **Directory Navigation**: ALWAYS `pwd` first, work from project root
5. **Test Location**: ALL tests in `tests/` directory (centralized)

**Complete Patterns**: See [Testing Patterns](docs/testing/technical/testing-patterns.md) and [Command Reference](docs/reference/commands.md).

## Specialized Agent Delegation

### Testing Infrastructure Work (MANDATORY)

**CRITICAL**: Testing work MUST involve the tester agent proactively, not just reactively when problems arise.

#### Mandatory Tester Agent Usage

**BEFORE implementing tests** (NON-NEGOTIABLE):

- [ ] **Strategy Planning**: Delegate test approach and patterns to tester agent
- [ ] **Requirements Analysis**: Have tester agent define coverage requirements
- [ ] **Framework Selection**: Confirm testing tools and setup with tester agent

**DURING test implementation**:

- [ ] **Infrastructure Issues**: Immediately delegate Jest/framework problems to tester agent
- [ ] **Complex Scenarios**: Use tester agent for accessibility and interaction testing
- [ ] **CI Integration**: Have tester agent handle CI testing configuration

**AFTER test implementation** (REQUIRED):

- [ ] **Coverage Review**: Tester agent MUST analyze coverage and patterns
- [ ] **Quality Assessment**: Delegate test quality evaluation to tester agent
- [ ] **Documentation**: Tester agent handles testing lessons learned documentation

#### Testing Agent Usage Pattern

```
Use Task tool with subagent_type: "tester" for:

PROACTIVE (before issues):
- Test strategy planning for new features
- Testing pattern establishment
- Coverage requirement definition
- CI testing integration planning

REACTIVE (when issues arise):
- Jest/testing framework debugging
- Test infrastructure troubleshooting
- Complex mocking scenarios
- Accessibility testing implementation

EVALUATIVE (after implementation):
- Test coverage analysis
- Testing pattern review
- Quality assessment
- Lessons learned documentation
```

#### Pragmatic vs Perfectionist Testing Philosophy (Story 4.2 Lesson)

**CRITICAL GUIDANCE**: After discovering 39 false test failures caused by overly precise expectations, the following testing philosophy MUST be followed:

**PRIMARY RULE**: Test what the function actually does, not what you think it should do.

**Precision Guidelines**:

- **BE PRECISE** for: Business logic, security, critical paths, data integrity
- **BE FLEXIBLE** for: Algorithm details, performance metrics, implementation specifics
- **ALWAYS VERIFY** expectations against actual function output before writing assertions

**For Tester Agent**:

```
Default to PRAGMATIC testing approach:
- Use `toBeGreaterThan()`, `toBeLessThan()` for non-critical values
- Test behavior and outcomes, not implementation details
- Verify all numeric expectations by running the function first
- Document any precise assertions with comments explaining why
- When in doubt, ask for clarification about precision requirements

Reference: See docs/testing/technical/pragmatic-vs-perfectionist-testing-kdd.md
```

**Examples**:

```javascript
// ❌ Perfectionist (causes false failures)
expect(stats.characterCount).toBe(18); // Where did 18 come from?

// ✅ Pragmatic (tests actual behavior)
expect(stats.characterCount).toBe(text.length); // Matches implementation
expect(stats.characterCount).toBeGreaterThan(0); // Verifies function works
```

#### Lessons from Story 4.1 Analysis

**Failure Pattern Identified**: Story 4.1 achieved 28/28 passing tests but failed to use tester agent proactively. This missed opportunities for:

- Better testing architecture
- More comprehensive patterns
- Systematic coverage analysis
- Testing infrastructure optimization

**Prevention Rule**: **NEVER** implement testing without tester agent involvement, even if local implementation succeeds.

#### Testing Workflow Integration

```bash
# MANDATORY workflow for ANY testing work:

# 1. BEFORE implementing tests
Task tool -> tester agent: "Plan test strategy for [component/feature]"

# 2. DURING implementation
Task tool -> tester agent: "Debug [specific testing issue]" (when issues arise)

# 3. AFTER implementation
Task tool -> tester agent: "Review test coverage and patterns for [feature]"
```

**Enforcement**: Any story involving testing MUST show evidence of tester agent delegation in story documentation.

## Testing Documentation Priority

When asked about testing or testing-related documentation:

1. **Technical/Developer Testing**: Focus on `docs/testing/technical/` first
   - **Debugging issues**: Start with `testing-infrastructure-lessons-learned.md`
   - **Writing tests**: Use `testing-patterns.md`
   - **Setup/standards**: Reference `test-strategy-and-standards.md`

2. **Functional/Story Acceptance Testing**: Only include files from `docs/testing/stories/` when specifically requested for functional testing

3. **Key principle**: Technical testing docs are for developers writing/debugging tests. Story acceptance test docs are for story validation. Don't mix contexts unless explicitly asked.

## File Creation Discovery Protocol

Before creating ANY new files, Claude MUST follow this discovery protocol:

1. **Check Project Navigation**
   - Read `docs/index.md` first (central documentation navigation)
   - Check for existing patterns and directory structures
   - Look for relevant sections that show where new content should go

2. **Check BMAD Methodology**
   - **BMAD Agent System**: Consider using specialized BMAD agents from `.bmad-core/agents/` for domain-specific tasks
   - **Task Workflows**: Look for `.bmad-core/tasks/` directory for executable task guidance
   - **Templates**: Check for templates in `.bmad-core/templates/` for document generation
   - **Follow established naming conventions** (e.g., `story-acceptance-test-{epic}.{story}.md`)

3. **Verify File Placement**
   - Ensure new files follow existing documentation hierarchy
   - Update `docs/index.md` when adding new documentation
   - Use established directory patterns (e.g., `docs/testing/stories/` for story acceptance test files)

This protocol prevents incorrect file placement and maintains project consistency.

## Epic Management

**MANDATORY**: Before creating or suggesting epic numbers, ALWAYS verify existing epics with `ls docs/prd/epic-*.md | sort`.

**Critical Rules:**
- ❌ Never trust `docs/prd/index.md` for availability (can be stale)
- ❌ Never assume gaps in numbering are usable
- ✅ Always run ls command to find highest epic number
- ✅ Next available = HIGHEST + 1
- ✅ Show user current epic list and get confirmation

**Complete Protocol**: See [Epic Management Guide](docs/reference/epic-management.md) for full discovery protocol, verification steps, and Scrum Master integration.

## Navigation & Directory Awareness

**🚨 CRITICAL: ALWAYS run `pwd` before ANY file operations!**

**Essential Rules:**
- ✅ ALWAYS verify directory with `pwd` first
- ✅ ALWAYS work from project root: `/Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au/`
- ✅ ALWAYS use paths relative to project root (not `../..`)
- ❌ NEVER assume current directory
- ❌ NEVER use relative navigation patterns (`../..`)

**Common Locations:**
- Project Root: `/Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au/`
- Web App: `apps/web/`
- Convex Backend: `apps/convex/`
- BMAD Agents: `.bmad-core/` (11 specialized agents)

**Complete Guide**: See [Navigation Conventions](docs/reference/navigation-conventions.md) for troubleshooting, directory locations, and best practices.

## CI Verification & Monitoring

**MANDATORY before story completion**: CI must be green before marking complete.

**Key Commands:**
```bash
bun run ci:status     # Check CI pipeline status
bun run ci:watch      # Monitor CI execution with updates
bun run ci:logs       # View detailed failure logs
```

**Systematic Workflow:**
1. Local validation: `bun run typecheck && bun run lint && bun test`
2. Push and monitor: `git push && bun run ci:watch`
3. Story completion: `bun run ci:status` (must show SUCCESS)

**Complete Reference**: See [Command Reference](docs/reference/commands.md#ci-verification--monitoring) for detailed CI workflows, error handling, and exit codes.

## Quick Reference

### Most-Used Commands
```bash
# Development
bun web:dev && bun convex:dev    # Start development servers
bun test:*:coverage:watch:all    # Run tests (convex/worker/web)
bun run typecheck && bun run lint # Code quality checks

# CI & Deployment
bun run ci:status                # Verify CI pipeline
bunx convex deploy              # Deploy backend
git push origin main            # Auto-deploy Cloudflare Pages

# Environment
bun run sync-env --mode=local   # Sync environment variables
bunx convex data [table]        # Query database
```

### Project Locations
- **Root**: `/Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au/`
- **Apps**: `apps/web/` (Next.js), `apps/convex/` (Backend), `apps/workers/` (Edge)
- **Tests**: `tests/` (centralized)
- **Docs**: `docs/` (all documentation)

### Complete References
- **[Full Command Reference](docs/reference/commands.md)** - All commands, versions, dependencies
- **[Navigation Guide](docs/reference/navigation-conventions.md)** - Directory awareness best practices
- **[Epic Management](docs/reference/epic-management.md)** - Epic numbering protocol
