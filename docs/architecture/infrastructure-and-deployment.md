# Infrastructure and Deployment

The project uses a pragmatic "Infrastructure from Code" approach with GitHub Actions and the Wrangler CLI managing deployments to Cloudflare. It follows a Continuous Deployment model for the `main` branch, with automatic preview deployments for every pull request. Rollbacks are handled via Cloudflare's instant rollback feature.

## Deployment Architecture Overview

### Cloudflare Pages Deployment

**Platform**: Cloudflare Pages provides edge deployment for the Next.js frontend
**Configuration**: Dashboard-based configuration (no wrangler.toml)
**Build Process**: Static site generation with @cloudflare/next-on-pages adapter

**Key Components**:

- **Frontend Application**: Next.js app deployed to global edge network
- **Static Assets**: Optimized and distributed via Cloudflare CDN
- **Environment Management**: Separate Production and Preview configurations

### Convex Backend Deployment

**Platform**: Convex provides serverless backend and real-time database
**Configuration**: Convex CLI and dashboard
**Deployment**: Independent of frontend deployment

**Key Components**:

- **Serverless Functions**: Auto-scaling backend functions
- **Real-time Database**: Managed NoSQL database with real-time subscriptions
- **Authentication**: Integrated auth system

## Proven Deployment Patterns

### Next.js Static Export Configuration

**Purpose**: Configure Next.js for optimal Cloudflare Pages compatibility

```javascript
// apps/web/next.config.js
const nextConfig = {
  transpilePackages: ['@repo/ui'],
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  trailingSlash: true, // Required for static hosting
  images: { unoptimized: true }, // Required for Cloudflare Pages
  output: 'export', // Required for static generation
};
```

**Rationale**: Ensures static generation compatible with edge deployment

### CI-Compatible Build Scripts

**Purpose**: Ensure build scripts work correctly in CI environments

```json
{
  "scripts": {
    "build": "next build",
    "pages:build": "npx @cloudflare/next-on-pages --outdir=dist",
    "build:pages": "CI=true next build && npx @cloudflare/next-on-pages --outdir=dist",
    "prepare": "echo 'Skipping husky in CI' && exit 0"
  }
}
```

**Key Features**:

- `CI=true` flag for CI-specific behavior
- Husky disabled in CI environment
- Two-step build process for clarity

### Environment Configuration Pattern

**Purpose**: Manage environment-specific configuration across deployment environments

**Cloudflare Pages Environment Variables**:

- `HUSKY=0` - Disables git hooks in CI
- `NODE_ENV=production` - Sets production environment
- Application-specific variables as needed

**Compatibility Flags**:

- `nodejs_compat` - Enables Node.js runtime features (Production & Preview)

**Configuration Management**:

- Production environment: Stable, optimized settings
- Preview environment: Same flags as production for consistency
- Local development: Standard Next.js development setup

## Deployment Workflows

### CI/CD Pipeline Architecture

**Platform**: GitHub Actions + Cloudflare Pages integration
**Workflow**: Complete automated pipeline from code commit to production deployment

**Pipeline Stages**:

1. **Lint Stage**: ESLint validation across monorepo packages
2. **Test Stage**: Unit tests and TypeScript type checking
3. **E2E Stage**: End-to-end tests (conditional execution)
4. **Build Stage**: Production build + Cloudflare Pages static generation
5. **Deploy Stage**: Automated deployment to Cloudflare Pages (main branch only)

**Key Features**:

- **Job Orchestration**: Proper dependency management with `needs` keyword
- **Artifact Management**: Build artifacts shared between jobs
- **Conditional Execution**: Graceful handling of optional test suites
- **Environment Compatibility**: CI-specific configuration for reliable builds
- **Monorepo Support**: Turborepo integration for efficient task execution

### Auto-Deployment Workflow (CI/CD)

**Trigger**: Push to `main` branch via GitHub Actions pipeline
**Process**:

1. **Code Quality Validation**: Lint and test stages run in parallel
2. **E2E Validation**: Conditional E2E tests based on test suite availability
3. **Build Process**: Production build with artifact generation
4. **Artifact Management**: Build outputs uploaded for deployment job
5. **Automated Deployment**: Cloudflare Pages deployment with artifact download
6. **Global Distribution**: Automatic cache invalidation and CDN distribution

**CI/CD Configuration**:

```yaml
# GitHub Actions Pipeline Structure
jobs:
  lint: # ESLint validation
  test: # Unit tests + TypeScript
  test-e2e: # E2E tests (conditional)
  build: # Production build + artifacts
  deploy: # Cloudflare Pages deployment
```

**Deployment Configuration**:

- Production Branch: `main`
- Preview Branches: All non-production branches
- Build Command: `bun run build && bun run pages:build`
- Output Directory: `dist`
- Root Directory: `apps/web`
- Environment Variables: `HUSKY=0`, `NODE_ENV=production`

### Legacy Auto-Deployment Workflow (Git Integration)

**Trigger**: Push to `main` branch via Cloudflare Git integration
**Process**:

1. GitHub webhook triggers Cloudflare Pages build
2. CI environment set up with required variables
3. Dependencies installed via Bun
4. Build process: `bun run build && bun run pages:build`
5. Deploy to production URL
6. Cache invalidation and global distribution

**Note**: This approach is being phased out in favor of GitHub Actions CI/CD pipeline for better control and artifact management.

### Manual Deployment Workflow (Development/Testing)

**Purpose**: Testing and development deployments
**Process**:

```bash
cd apps/web
bun run build:pages
wrangler pages deploy dist --project-name=project-name
```

**Use Cases**:

- Testing configuration changes
- Development environment deployment
- Troubleshooting deployment issues

### Preview Deployment Workflow

**Trigger**: Pull request creation/update
**Process**: Same as auto-deployment but deploys to preview URL
**Benefits**:

- Test changes before merge
- Share work-in-progress with stakeholders
- Validate deployment configuration

## Critical Configuration Requirements

### Required Cloudflare Pages Settings

1. **Build Configuration**:
   - Build Command: `bun run build && bun run pages:build`
   - Output Directory: `dist`
   - Root Directory: `apps/web`

2. **Environment Variables**:
   - `HUSKY=0` (prevents CI failures)

3. **Compatibility Flags**:
   - `nodejs_compat` (enables Node.js runtime features)

4. **Git Integration**:
   - Production Branch: `main`
   - Preview Branches: All non-production branches

### Configuration Anti-Patterns to Avoid

1. **Never use wrangler.toml for Cloudflare Pages projects**
   - Causes configuration conflicts
   - Overrides dashboard settings unpredictably

2. **Never skip nodejs_compat compatibility flag**
   - Causes runtime errors for Node.js modules
   - Required for Next.js applications

3. **Never allow development scripts in CI**
   - Husky and similar tools fail in CI environment
   - Use environment detection or flags

## Build Process Architecture

### Local Development Build

```bash
# Development server
bun dev

# Production build testing
bun run build:pages

# Local preview with Cloudflare Pages emulation
npx wrangler pages dev dist
```

### CI Build Process

1. **Environment Setup**: CI environment with HUSKY=0
2. **Dependency Installation**: `bun install`
3. **Next.js Build**: `next build` (static export)
4. **Cloudflare Adaptation**: `npx @cloudflare/next-on-pages`
5. **Output Verification**: Validate `dist` contents
6. **Deployment**: Upload to Cloudflare Pages

### Build Output Structure

```
dist/
├── index.html              # Homepage
├── _next/                  # Next.js build artifacts
│   ├── static/             # Static assets
│   └── webpack/            # Webpack bundles
├── assets/                 # Application assets
└── other-pages/            # Additional pages
```

## Monitoring and Troubleshooting

### Deployment Monitoring

**Build Logs**: Available in Cloudflare Pages dashboard
**Deployment Status**: Real-time status updates
**Performance Metrics**: Cloudflare Analytics integration

### Common Issues and Solutions

1. **Build Failures**: Check environment variables and compatibility flags
2. **Runtime Errors**: Verify nodejs_compat flag is enabled
3. **Asset Loading Issues**: Confirm output directory configuration
4. **Git Integration Issues**: Verify webhook configuration

**Reference**: [Deployment Troubleshooting Guide](../technical-guides/cloudflare-pages-deployment-troubleshooting.md)

### Rollback Procedures

**Automatic Rollback**: Available via Cloudflare Pages dashboard
**Manual Rollback**: Deploy previous known-good commit
**Emergency Procedures**: Direct file upload via Wrangler CLI

## Security Considerations

### Environment Security

- Environment variables managed via Cloudflare dashboard
- No sensitive information in committed files
- Separate configuration for Production and Preview environments

### Build Security

- CI environment isolation
- Dependency verification via lock files
- Build process validation

### Runtime Security

- HTTPS enforcement via Cloudflare
- Content Security Policy headers
- Secure asset delivery via CDN

## Performance Optimization

### Build Performance

- Bun package manager for fast dependency installation
- Incremental builds where possible
- Optimized Docker images for CI

### Runtime Performance

- Global CDN distribution via Cloudflare
- Edge caching and optimization
- Static asset optimization
- Compressed asset delivery

### Monitoring

- Core Web Vitals tracking
- CDN performance metrics
- Build time monitoring

## Related Documentation

- [Deployment Patterns](../patterns/development-workflow-patterns.md#deployment-workflow-patterns)
- [Deployment Troubleshooting Guide](../technical-guides/cloudflare-pages-deployment-troubleshooting.md)
- [Story 1.3 Implementation](../lessons-learned/stories/story-1-3-lessons.md)
- [Configuration Examples](../examples/cloudflare-pages-deployment/README.md)
