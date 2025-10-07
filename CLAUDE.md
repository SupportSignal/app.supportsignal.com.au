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
# Development
bun dev              # Start development server
bun dev:claude       # Development with Claude logging integration

# Build & Production
bun build            # Build for production
bun start            # Start production server

# Testing
bun test             # Run Jest unit tests
bun test:e2e         # Run Playwright E2E tests
bun test:e2e:ui      # Run Playwright with UI mode

# Linting & Formatting
bun lint             # Run ESLint
bun format           # Run Prettier
bun typecheck        # Run TypeScript compiler checks

# CI Monitoring & Smart Push
bun run ci:status    # Check CI status for current branch
bun run ci:watch     # Monitor CI runs with real-time updates
bun run ci:logs      # View detailed CI logs
bun run push         # Smart push with pre-validation and CI monitoring
bun run push:no-ci   # Smart push without CI monitoring

# Systematic CI Verification (MANDATORY)
# These commands MUST be run after story completion and before marking complete
bun run typecheck    # TypeScript compilation verification
bun run lint         # ESLint validation
bun test             # Unit test execution (use npm test for component tests)
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

### AI-Assisted Development

This project follows the BMAD (Before, Model, After, Document) method with integrated CI verification:

#### BMAD Phase Integration with CI Verification

1. **Before Phase**:
   - Capture context before starting tasks
   - **CI Context Check**: Run `bun run ci:status` to verify starting state
   - Document current CI status in planning

2. **Model Phase**:
   - Use Claude for implementation
   - **Include CI Considerations**: Plan implementation with CI compatibility in mind
   - Consider test requirements and CI pipeline impact

3. **After Phase**:
   - **MANDATORY CI Verification Suite**:
     ```bash
     pwd                    # Verify project root
     bun run typecheck     # TypeScript validation
     bun run lint          # ESLint compliance
     bun test              # Local test execution
     bun run build         # Production build test
     bun run ci:status     # CI pipeline verification
     ```
   - **DO NOT PROCEED** to Document phase until CI is green

4. **Document Phase**:
   - Document changes and learnings
   - **Include CI Lessons**: Capture any CI-related insights
   - Update testing documentation if CI patterns change

#### BMAD-CI Integration Rules

- **Never skip CI verification** in After phase - it's non-negotiable
- **CI failures block story completion** - fix before documenting
- **Document CI lessons** - maintain institutional CI knowledge
- **Use tester agent** for complex CI debugging during any phase

### BMAD Agent System

This project includes a comprehensive BMAD agent system located in `.bmad-core/`:

#### Available BMAD Agents

The system provides specialized agents for different development roles:

- **bmad-master.md** - Universal task executor and BMAD method expert (🧙)
- **architect.md** - Technical architecture and system design specialist
- **dev.md** - Development implementation and coding expert
- **pm.md** - Project management and coordination specialist
- **po.md** - Product owner and requirements expert
- **qa.md** - Quality assurance and testing specialist
- **analyst.md** - Business analysis and requirements gathering
- **ux-expert.md** - User experience and interface design
- **sm.md** - Scrum master and agile process expert
- **test-dev.md** - Test development and automation specialist
- **bmad-orchestrator.md** - Multi-agent workflow orchestration

#### BMAD Agent Usage

To work with a specific BMAD agent persona:

1. **Agent Selection**: Choose the appropriate agent based on the task domain
2. **Agent Activation**: Load the agent file to adopt the specialized persona
3. **Task Execution**: Use agent-specific commands and workflows
4. **Resource Access**: Agents can access tasks, templates, checklists from `.bmad-core/`

#### BMAD Commands and Resources

Each agent can execute specialized commands with `*` prefix:
- `*help` - Show available commands
- `*task {task}` - Execute specific task workflow
- `*create-doc {template}` - Generate documents from templates
- `*execute-checklist {checklist}` - Run quality assurance checklists

**Resource Structure**:
```
.bmad-core/
├── agents/           # Specialized agent personas
├── tasks/            # Executable task workflows
├── templates/        # Document generation templates
├── checklists/       # Quality assurance checklists
├── workflows/        # Multi-step process definitions
└── data/             # Knowledge base and reference materials
```

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

## Quick Reference: Commonly Missed Patterns

**Before troubleshooting, check if we already documented the solution:**

1. **Testing Issues**: Check `docs/testing/technical/testing-infrastructure-lessons-learned.md`
2. **Jest Configuration**: Use templates in `docs/testing/technical/test-migration-and-configuration-kdd.md`
3. **TypeScript Errors in Tests**: Apply `@ts-nocheck` pragmatically - don't "fix" interface issues
4. **Path Resolution**: Use configured aliases (`@/`) not relative paths (`../../../../`)
5. **Directory Navigation**: ALWAYS `pwd` first, run commands from project root
6. **Test Location**: ALL tests go in `tests/` directory (centralized), not app directories
7. **Package.json Scripts**: Update scripts when moving tests to centralized location

**Documentation-First Protocol**: Search existing docs before implementing new solutions.

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

## Claude Navigation & Directory Awareness

**CRITICAL**: Claude must maintain directory context awareness to prevent navigation errors.

### Navigation Best Practices

**🚨 CRITICAL: ALWAYS run `pwd` as your FIRST command before any file operations!**

1. **MANDATORY directory verification before ANY commands:**

   ```bash
   pwd  # ALWAYS run this first - no exceptions!
   ```

2. **All commands must be run from project root:**

   ```bash
   # If not in project root, navigate immediately:
   cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai

   # Then verify you're in the right place:
   pwd
   ```

3. **Use absolute paths when referencing project files:**

   ```bash
   # Good - paths from project root
   docs/testing/index.md
   apps/web/components/ui/button.tsx

   # Avoid relative paths that lose context
   ../../../.bmad-core/
   ../../docs/testing/index.md
   ```

   **NEVER use `../..` patterns - always reference files from project root.**

4. **Before running any bun/npm scripts, confirm location:**

   ```bash
   pwd && bun run ci:status    # Combine directory check with command
   ```

5. **When using LS tool, pay attention to the path context shown in output**

6. **For hidden directories (starting with .), use explicit listing:**
   ```bash
   ls -la | grep "^\."  # List hidden files/directories
   ```

### Common Directory Locations

- **Project Root**: `/Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au/`
- **Template Reference**: `/Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai/`
- **Web App**: `apps/web/`
- **Convex Backend**: `apps/convex/`
- **Documentation**: `docs/`
- **BMAD Agent System**: `.bmad-core/` (comprehensive agent system with 11 specialized agents)
- **Claude Config**: `.claude/` (if exists)

### Troubleshooting Navigation Issues

If you get "file not found" or "script not found" errors:

1. **IMMEDIATELY run `pwd` to check current location**
2. **Navigate to project root:** `cd /Users/davidcruwys/dev/clients/supportsignal/app.supportsignal.com.au`
3. **Verify you're in the right place:** `pwd` (should show the full project path)
4. **Test with a known file:** `ls package.json` (should exist at root)
5. **Then retry your original command**

**Common failure pattern:** Running commands from subdirectories like `apps/web/` when scripts expect project root context.

## CI Verification Scripts & Monitoring Tools

### Available CI Monitoring Scripts

The project includes comprehensive CI monitoring tools to support systematic verification:

#### 1. **CI Status Check** (`scripts/ci-status.sh`)

```bash
# Usage: Check current CI status for branch
bun run ci:status [branch-name]

# Features:
- Shows recent CI runs with status and timestamps
- Displays current pipeline status (success/failure/running)
- Provides direct GitHub Actions link
- Exit codes: 0=success, 1=failure, others=various states
```

#### 2. **CI Monitor** (`scripts/ci-monitor.sh`)

```bash
# Usage: Monitor CI execution with timeout
bun run ci:watch [branch-name] [timeout-seconds]

# Features:
- Real-time CI monitoring with status updates
- Configurable timeout (default: 300 seconds)
- Exit codes indicate final CI state
- Automatic link to detailed logs on failure
```

#### 3. **Smart Push with CI Integration** (`scripts/smart-push.sh`)

```bash
# Usage: Intelligent push with pre-validation
bun run push

# Workflow:
1. Pre-push validation (lint, typecheck, test)
2. Git operations (add, commit, push)
3. Automated CI monitoring
4. Success/failure reporting with actionable feedback
```

### CI Integration Best Practices

#### Systematic Use Pattern

```bash
# 1. Before starting work - verify baseline
bun run ci:status

# 2. During development - local validation
bun run typecheck && bun run lint && bun test

# 3. After implementation - comprehensive check
bun run build  # Verify production build
bun run push   # Smart push with CI monitoring

# 4. Story completion - final verification
bun run ci:status  # Confirm CI success before marking complete
```

#### Error Handling Workflow

```bash
# If CI fails after push:
bun run ci:logs        # View detailed failure logs
bun run ci:status      # Check current status
# Fix issues locally, then:
bun run push           # Re-push with monitoring
```

### Integration with Development Tools

#### GitHub CLI Integration

All CI scripts use GitHub CLI (`gh`) for authenticated API access:

- Automatic authentication detection
- Rich status reporting with timestamps
- Direct links to GitHub Actions dashboard

#### Exit Code Standards

- **0**: Success/completion
- **1**: Failure (CI failed, authentication issues)
- **2**: Cancelled operations
- **124**: Timeout reached
- **3+**: Various warning states

#### Monitoring Timeouts

- **Default**: 300 seconds (5 minutes) for most pipelines
- **Configurable**: Pass custom timeout as second argument
- **Smart Timeout**: Scripts provide progress updates and remaining time

### Documentation References

For comprehensive CI setup and troubleshooting:

- **[CI/CD Pipeline Setup Guide](docs/technical-guides/cicd-pipeline-setup.md)** - Complete setup instructions
- **[Testing Infrastructure Lessons](docs/testing/technical/testing-infrastructure-lessons-learned.md)** - CI debugging patterns
- **[Chat Component KDD](docs/testing/technical/chat-component-testing-lessons.md)** - Testing methodology improvements

## Quick Reference
*Last Updated: September 30, 2025*

### Essential Development Commands
```bash
# Core Development
bun dev              # Start development server
bun build            # Build for production
bun test             # Run all tests
bun run typecheck    # TypeScript validation
bun run lint         # ESLint validation

# CI Verification (MANDATORY before story completion)
bun run ci:status    # Check CI status
bun run ci:watch     # Monitor CI runs
bun run push         # Smart push with CI monitoring

# Convex Backend
bunx convex dev      # Start Convex dev server
bunx convex deploy   # Deploy functions
bunx convex data [table] --limit [n]  # Query development data
bunx convex data --prod [table] --limit [n]  # Query production data
```

### Environment & Deployment
```bash
# Environment Sync
bun run sync-env --mode=local        # Generate local .env files
bun run sync-env --mode=deploy-dev   # Deploy to dev
bun run sync-env --mode=deploy-prod  # Deploy to prod

# Cloudflare Pages
cd apps/web && bun run build:pages  # Build for Pages
bun run pages:deploy                 # Manual deployment

# Database Monitoring
bunx convex run monitoring:usage    # Database usage stats
bunx convex run cleanup:safe        # Clean expired logs
```

### Testing Commands
```bash
# Unit Tests
bun test              # All tests
bun test:web          # Web app tests
bun test:convex       # Convex tests
bun test:worker       # Worker tests

# E2E Tests
bun test:e2e          # Playwright E2E
bun test:e2e:ui       # E2E with UI

# Coverage
bun test:coverage     # Coverage reports
```

### Project Structure Quick Guide
```
apps/web/           # Next.js application
apps/convex/        # Convex backend functions
apps/workers/       # Cloudflare Workers
packages/ui/        # Shared UI components
tests/              # Centralized test files
```

### Version Information
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
