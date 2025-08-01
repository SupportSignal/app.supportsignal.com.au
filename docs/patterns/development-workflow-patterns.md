# Development Workflow Patterns

## Overview

This document outlines established patterns for development processes, tooling, team collaboration, and Knowledge-Driven Development (KDD) practices.

## KDD (Knowledge-Driven Development) Patterns

### Documentation Impact Assessment

**Context**: Evaluating documentation needs during story planning
**Implementation**:

- Assess what patterns might be established or validated
- Identify documentation files that might need updating
- Plan what knowledge should be captured for future reference
- Determine what examples should be created from implementation

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures knowledge capture is planned, not reactive

### Pattern Validation Workflow

**Context**: Validating implementation against established patterns
**Implementation**:

- Check `docs/patterns/` for relevant established patterns
- Validate against existing examples in `docs/examples/`
- Note any pattern deviations that need discussion
- Identify new patterns that might emerge and should be documented

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Maintains consistency and captures evolving best practices

### Knowledge Capture Process

**Context**: Systematically capturing lessons learned
**Implementation**:

- Document what worked well in implementation
- Capture challenges encountered and how they were solved
- Note what future developers should know about the approach
- Identify patterns or anti-patterns that were discovered

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Builds institutional knowledge and prevents repeated mistakes

## Story Development Patterns

### Story Planning

**Context**: Planning story implementation for maximum learning
**Implementation**:

- Include Documentation Impact Assessment in story planning
- Reference relevant patterns and examples during planning
- Plan knowledge capture activities upfront
- Identify dependencies on existing patterns

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Sets up stories for successful pattern validation and knowledge capture

### Implementation Workflow

**Context**: Following consistent development process
**Implementation**:

- Validate against patterns before implementation
- Implement task and subtasks systematically
- Document pattern adherence or deviations
- Update story documentation as work progresses

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures consistent quality and captures implementation knowledge

### Quality Review Process

**Context**: Validating both code quality and knowledge capture
**Implementation**:

- Review pattern compliance during QA
- Validate that new patterns are documented
- Ensure reference examples are created where appropriate
- Confirm lessons learned are captured

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Maintains quality standards and ensures knowledge is preserved

## Git Workflow Patterns

### Branch Strategy

**Context**: Managing code changes and collaboration
**Implementation**:

- Use feature branches for story development
- Follow conventional commit messages
- Use pull requests for code review
- Maintain clean commit history

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Enables parallel development and clear change tracking

### Commit Conventions

**Context**: Standardizing commit messages
**Implementation**:

- Use conventional commits format
- Include story references in commits
- Write descriptive commit messages
- Atomic commits for logical changes

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Improves code history readability and enables automation

## Code Review Patterns

### Review Checklist

**Context**: Ensuring consistent code review quality
**Implementation**:

- Validate code against established patterns
- Check for proper error handling
- Verify test coverage and quality
- Ensure documentation is updated

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Maintains code quality and knowledge consistency

### Knowledge Transfer in Reviews

**Context**: Using reviews for learning and pattern evolution
**Implementation**:

- Identify new patterns during review
- Share knowledge about implementation approaches
- Document rationale for significant decisions
- Update patterns based on review insights

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Spreads knowledge across team and evolves best practices

## Testing Workflow Patterns

### Test-Driven Development

**Context**: Writing tests to drive implementation
**Implementation**:

- Write tests before implementation
- Use tests to validate pattern compliance
- Test both happy path and error conditions
- Update tests when patterns evolve

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures reliable code and validates pattern effectiveness

### Continuous Testing

**Context**: Running tests throughout development
**Implementation**:

- Run tests on every commit
- Use test results to validate changes
- Maintain fast test feedback loops
- Monitor test coverage trends

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Catches issues early and maintains confidence in changes

## Documentation Workflow Patterns

### Living Documentation

**Context**: Keeping documentation current with implementation
**Implementation**:

- Update documentation as part of development
- Review documentation accuracy during QA
- Use real examples from implementation
- Archive outdated documentation

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures documentation remains useful and accurate

### Pattern Evolution

**Context**: Evolving patterns based on implementation experience
**Implementation**:

- Regular pattern review sessions
- Update patterns based on new learnings
- Deprecate patterns that are no longer effective
- Version control pattern changes

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Keeps patterns relevant and effective

## Collaboration Patterns

### Knowledge Sharing

**Context**: Spreading knowledge across the team
**Implementation**:

- Regular pattern review sessions
- Code pairing for complex implementations
- Documentation reviews
- Cross-training on different areas

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Prevents knowledge silos and improves team capability

### Decision Documentation

**Context**: Recording architectural and implementation decisions
**Implementation**:

- Document significant decisions in ADRs
- Include rationale and alternatives considered
- Update patterns based on decisions
- Review decisions periodically

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Preserves decision context and enables future evaluation

## Tooling Patterns

### Development Environment

**Context**: Standardizing development setup
**Implementation**:

- Use consistent tooling across team
- Document setup procedures
- Automate environment setup where possible
- Keep development environment close to production

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Reduces setup friction and environmental issues

### Automation Patterns

**Context**: Automating repetitive development tasks
**Implementation**:

- Automate linting and formatting
- Use git hooks for quality checks
- Automate dependency updates
- Generate boilerplate code where appropriate

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Reduces manual work and ensures consistency

## Deployment Workflow Patterns

### Cloudflare Pages Deployment Pattern

**Context**: Deploying Next.js applications to Cloudflare Pages with CI/CD integration
**Implementation**:

**Core Configuration Requirements**:

- Build Command: `bun run build && bun run pages:build`
- Output Directory: `.vercel/output/static`
- Root Directory: `apps/web`
- Environment Variables: `HUSKY=0` (disables git hooks in CI)
- Compatibility Flags: `nodejs_compat` (enables Node.js runtime features)

**Next.js Configuration**:

```javascript
const nextConfig = {
  transpilePackages: ['@repo/ui'],
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  trailingSlash: true,
  images: { unoptimized: true },
  output: 'export',
};
```

**Package Scripts**:

```json
{
  "build": "next build",
  "pages:build": "npx @cloudflare/next-on-pages",
  "pages:deploy": "wrangler pages deploy .vercel/output/static --project-name=starter-nextjs-convex-ai",
  "build:pages": "CI=true next build && npx @cloudflare/next-on-pages"
}
```

**Critical Anti-Patterns to Avoid**:

- Never use wrangler.toml for Cloudflare Pages projects (causes configuration conflicts)
- Never skip nodejs_compat compatibility flag (causes runtime errors)
- Never allow husky scripts to run in CI (causes build failures)

**Example**: See Story 1.3 implementation in `apps/web/` directory

**Rationale**: Enables reliable, fast deployment to global edge network with proper CI integration

### CI Environment Compatibility Pattern

**Context**: Ensuring build scripts work correctly in CI environments
**Implementation**:

**Environment Detection**:

```json
{
  "scripts": {
    "prepare": "echo 'Skipping husky in CI' && exit 0"
  }
}
```

**Environment Variables for CI**:

- `HUSKY=0` - Disables Husky git hooks
- `CI=true` - Enables CI-specific behavior in build tools

**CI-Aware Package Scripts**:

- Check for CI environment before running development-only scripts
- Use exit codes to gracefully skip development setup
- Provide clear logging for debugging CI issues

**Example**: Root `package.json` with CI-aware prepare script

**Rationale**: Prevents CI failures due to development environment assumptions

### Manual vs Auto-Deployment Workflow

**Context**: Understanding different deployment approaches for testing vs production
**Implementation**:

**Manual Deployment (Development/Testing)**:

- Uses Wrangler CLI: `wrangler pages deploy`
- Local build artifacts deployment
- Full control over deployment timing
- Good for testing configuration changes

**Auto-Deployment (Production)**:

- Git integration with Cloudflare Pages
- Automatic deployment on push to main branch
- CI/CD pipeline handles build process
- Preview deployments for feature branches

**Configuration Strategy**:

- Set up auto-deployment for main branch (production)
- Use manual deployment for testing and development
- Configure preview deployments for all non-production branches

**Example**: Cloudflare Pages Git integration configured for `main` branch production deployment

**Rationale**: Provides flexibility for development while ensuring reliable production deployment

### GitHub Actions + Bun + Turborepo CI/CD Pattern

**Context**: Implementing comprehensive CI/CD pipeline for monorepo with Bun and Turborepo
**Implementation**:

**Core Pipeline Structure**:

```yaml
jobs:
  lint: # ESLint validation
  test: # Unit tests + Type checking
  test-e2e: # E2E tests (conditional)
  build: # Production build + Cloudflare Pages build
  deploy: # Deploy to Cloudflare Pages (main branch only)
```

**Key Configuration Elements**:

- **Environment Variables**: `HUSKY=0`, `NODE_ENV=production`
- **Bun Setup**: `oven-sh/setup-bun@v1` with latest version
- **Frozen Lockfile**: `bun install --frozen-lockfile` for reproducible builds
- **Job Dependencies**: Sequential execution with `needs` for proper build order

**Turborepo Integration**:

```json
{
  "scripts": {
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck"
  }
}
```

**Example**: See `.github/workflows/ci.yml` - Complete CI/CD pipeline with all stages

**Rationale**: Provides fast, reliable monorepo builds with proper dependency management and parallel job execution

### Graceful Test Handling Pattern

**Context**: Handling optional test suites that may not exist in early development
**Implementation**:

**Conditional E2E Test Execution**:

```yaml
- name: Check if E2E tests exist
  id: check-e2e
  run: |
    if [ -d "tests" ] && [ "$(ls -A tests 2>/dev/null)" ]; then
      echo "e2e_exists=true" >> $GITHUB_OUTPUT
    else
      echo "e2e_exists=false" >> $GITHUB_OUTPUT
    fi

- name: Install Playwright browsers
  if: steps.check-e2e.outputs.e2e_exists == 'true'
  run: bunx playwright install --with-deps

- name: Run E2E tests
  if: steps.check-e2e.outputs.e2e_exists == 'true'
  run: bun run test:e2e

- name: Skip E2E tests
  if: steps.check-e2e.outputs.e2e_exists == 'false'
  run: echo "No E2E tests found, skipping..."
```

**Benefits**:

- Pipeline doesn't fail when test suites are not yet implemented
- Clear logging indicates when tests are skipped vs failed
- Automatic activation when tests are added to the project
- Maintains CI reliability during early development phases

**Example**: E2E test job in CI pipeline with directory existence checking

**Rationale**: Enables incremental test suite development without breaking CI pipeline

### ESLint + Next.js + GitHub Actions Compatibility Pattern

**Context**: Resolving ESLint flat config compatibility issues in CI environments
**Implementation**:

**Root Package Configuration**:

```json
{
  "devDependencies": {
    "eslint": "^8.57.0",
    "@typescript-eslint/eslint-plugin": "^8.37.0",
    "@typescript-eslint/parser": "^8.37.0"
  }
}
```

**Web App Configuration**:

```json
{
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.1",
    "eslint": "^8.57.0",
    "eslint-config-next": "^15.4.1"
  }
}
```

**Key Compatibility Requirements**:

- Use ESLint v8.x (not v9.x) for Next.js compatibility
- Install `@eslint/eslintrc` in web app for legacy config support
- Use compatible versions of TypeScript ESLint plugins
- Ensure eslint-config-next supports the ESLint version

**CI Integration**:

```yaml
- name: Run ESLint
  run: bun run lint # Uses turbo to run lint across all packages
```

**Example**: Package.json configurations in root and `apps/web/` directories

**Rationale**: Ensures ESLint works reliably across local development, CI environments, and all monorepo packages

### Continuous Integration

**Context**: Automated testing and validation
**Implementation**:

- Run all tests on pull requests
- Validate pattern compliance automatically
- Check documentation updates
- Require review approvals
- Use parallel job execution for faster feedback

**Example**: Complete GitHub Actions pipeline with lint, test, build, and deploy stages

**Rationale**: Ensures quality standards are met before deployment with fast feedback loops

### Deployment Pipeline

**Context**: Automated deployment process
**Implementation**:

- Deploy on merge to main branch only
- Use artifact upload/download for build sharing between jobs
- Implement conditional deployment based on branch and event type
- Monitor deployments through Cloudflare Pages dashboard

**Example**: Deploy job with proper dependency management and artifact handling

**Rationale**: Enables rapid, reliable deployments with proper build artifact management

## Monitoring & Feedback Patterns

### Development Metrics

**Context**: Tracking development process effectiveness
**Implementation**:

- Monitor story completion times
- Track pattern adherence rates
- Measure documentation quality
- Monitor code review effectiveness

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Enables continuous improvement of development process

### Feedback Loops

**Context**: Incorporating learnings into process improvement
**Implementation**:

- Regular retrospectives
- Pattern effectiveness reviews
- Tool evaluation sessions
- Process adjustment based on metrics

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures process evolves based on team experience

## Anti-Patterns to Avoid

### Inconsistent Process Following

- Don't skip KDD steps for "simple" stories
- Avoid inconsistent pattern validation
- Don't defer documentation updates

### Over-Documentation

- Avoid documenting every small decision
- Don't create patterns for one-off solutions
- Keep documentation focused and actionable

### Tool Obsession

- Don't change tools without clear benefits
- Avoid complex tooling for simple problems
- Focus on process over tools

### Knowledge Hoarding

- Share knowledge proactively
- Document tribal knowledge
- Cross-train team members

## Related Documentation

- [Frontend Patterns](frontend-patterns.md) - For frontend development workflows
- [Backend Patterns](backend-patterns.md) - For backend development workflows
- [Testing Patterns](testing-patterns.md) - For testing workflows
- [Architecture Patterns](architecture-patterns.md) - For architectural decision processes
