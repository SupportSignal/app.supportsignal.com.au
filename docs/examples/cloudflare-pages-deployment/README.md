# Cloudflare Pages Deployment Example

## Overview

This example demonstrates the complete configuration for deploying a Next.js application to Cloudflare Pages, based on the successful implementation from Story 1.3.

## Directory Structure

```
apps/web/
├── next.config.js          # Next.js configuration for static export
├── package.json            # Build scripts and dependencies
├── app/                    # Next.js application
└── .env.local             # Local environment variables (optional)
```

## Configuration Files

### 1. Next.js Configuration (`apps/web/next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui'],
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
};

module.exports = nextConfig;
```

**Key Configuration Explained**:

- `output: 'export'` - Enables static site generation for Cloudflare Pages
- `images: { unoptimized: true }` - Disables Next.js image optimization (required for static hosting)
- `trailingSlash: true` - Ensures proper routing on static hosting
- `transpilePackages` - Includes monorepo packages in build process

### 2. Package Configuration (`apps/web/package.json`)

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:deploy": "wrangler pages deploy .vercel/output/static --project-name=starter-nextjs-convex-ai",
    "build:pages": "CI=true next build && npx @cloudflare/next-on-pages",
    "pages:dev": "npx @cloudflare/next-on-pages --watch"
  },
  "dependencies": {
    "@cloudflare/next-on-pages": "^1.13.12",
    "next": "14.2.15",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.31.0",
    "eslint-config-next": "^15.4.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.4.5"
  }
}
```

**Key Scripts Explained**:

- `pages:build` - Converts Next.js build to Cloudflare Pages format
- `pages:deploy` - Manual deployment using Wrangler CLI
- `build:pages` - Complete build process for CI/CD
- `pages:dev` - Local development with Cloudflare Pages emulation

### 3. Root Package Configuration (CI Compatibility)

```json
{
  "scripts": {
    "prepare": "echo 'Skipping husky in CI' && exit 0"
  }
}
```

**Purpose**: Prevents Husky git hooks from failing in CI environment

## Cloudflare Pages Dashboard Configuration

### Project Settings

**Basic Settings**:

- Project Name: `starter-nextjs-convex-ai`
- Production Branch: `main`
- Preview Branches: All non-production branches

**Build Settings**:

- Build Command: `bun run build && bun run pages:build`
- Output Directory: `.vercel/output/static`
- Root Directory: `apps/web`

### Environment Variables

**Production Environment**:

```
HUSKY=0
```

**Preview Environment**:

```
HUSKY=0
```

### Compatibility Flags

**Functions Settings**:

- Production: `nodejs_compat`
- Preview: `nodejs_compat`

## Build Process Flow

### Local Development Build

```bash
cd apps/web

# Development server
bun dev

# Production build test
bun run build
bun run pages:build

# Local preview
npx wrangler pages dev .vercel/output/static
```

### CI/CD Build Process

1. **Install Dependencies**: `bun install`
2. **Build Next.js App**: `next build`
3. **Convert to Pages Format**: `npx @cloudflare/next-on-pages`
4. **Deploy Output**: Uses `.vercel/output/static` directory

### Manual Deployment

```bash
# From apps/web directory
bun run build:pages
wrangler pages deploy .vercel/output/static --project-name=your-project-name
```

## File Structure After Build

```
apps/web/
├── .vercel/
│   └── output/
│       └── static/           # Cloudflare Pages deployment directory
│           ├── index.html
│           ├── _next/
│           └── assets/
├── .next/                    # Next.js build artifacts
└── node_modules/
```

## Environment-Specific Configurations

### Development Environment

```bash
# .env.local (optional)
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Environment

Environment variables configured in Cloudflare Pages dashboard:

- `HUSKY=0` - Disables git hooks in CI
- Any application-specific variables

## Common Issues and Solutions

### Build Failures

**Issue**: Husky prepare script fails
**Solution**: Set `HUSKY=0` environment variable

**Issue**: Module resolution errors
**Solution**: Enable `nodejs_compat` compatibility flag

**Issue**: Output directory not found
**Solution**: Verify output directory is `.vercel/output/static`

### Runtime Issues

**Issue**: Images not loading
**Solution**: Ensure `images: { unoptimized: true }` in next.config.js

**Issue**: Routing issues
**Solution**: Use `trailingSlash: true` in next.config.js

**Issue**: Node.js module errors
**Solution**: Enable `nodejs_compat` compatibility flag

## Testing and Validation

### Pre-Deployment Checklist

- [ ] Local build completes successfully
- [ ] Output directory contains expected files
- [ ] Local preview works correctly
- [ ] No console errors in browser
- [ ] All environment variables configured

### Post-Deployment Validation

- [ ] Live site loads correctly
- [ ] All pages and routes work
- [ ] Static assets serve properly
- [ ] No runtime errors in browser console
- [ ] Auto-deployment triggers on git push

## Performance Considerations

### Build Optimization

- Static generation reduces server load
- Global CDN distribution via Cloudflare
- Automatic asset optimization
- Edge caching for fast load times

### Bundle Optimization

```javascript
// next.config.js optimizations
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

## Security Considerations

### Headers Configuration

Headers can be configured in Cloudflare Pages dashboard:

- Content Security Policy
- HTTPS enforcement
- HSTS headers

### Environment Variables

- Never commit sensitive values to git
- Use Cloudflare Pages environment variables for secrets
- Prefix public variables with `NEXT_PUBLIC_`

## Monitoring and Maintenance

### Deployment Monitoring

- Monitor build logs for issues
- Check deployment status in Cloudflare dashboard
- Set up notifications for build failures

### Update Strategy

1. Test dependency updates locally
2. Deploy to preview environment
3. Validate functionality
4. Deploy to production

## Related Documentation

- [Deployment Troubleshooting Guide](../../technical-guides/cloudflare-pages-deployment-troubleshooting.md)
- [Story 1.3 Implementation Details](../../../apps/web/)
- [Deployment Patterns](../../patterns/development-workflow-patterns.md#cloudflare-pages-deployment-pattern)

## Live Example

The configuration shown here is currently deployed at:
https://starter-nextjs-convex-ai.pages.dev/

This example represents a working, production-ready deployment configuration that has been tested and validated through real-world implementation.
