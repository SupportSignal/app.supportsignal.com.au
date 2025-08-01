# Cloudflare Pages + GitHub Actions Deployment Example

## Overview

This example demonstrates how to deploy a Next.js application to Cloudflare Pages using GitHub Actions CI/CD pipeline, based on the implementation from Story 1.6.

## Directory Structure

```
.github/workflows/
└── ci.yml                    # Complete CI/CD pipeline

apps/web/
├── next.config.js           # Cloudflare Pages compatible config
├── package.json             # Build scripts for Pages deployment
└── .vercel/output/static/   # Generated static output directory

package.json                 # Root monorepo configuration
turbo.json                   # Turborepo task definitions
```

## Complete CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  HUSKY: 0
  NODE_ENV: production

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run ESLint
        run: bun run lint

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run unit tests
        run: bun run test

      - name: Run type checks
        run: bun run typecheck

  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

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

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build applications
        run: bun run build

      - name: Build for Cloudflare Pages
        run: |
          cd apps/web
          bun run build:pages

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: apps/web/.vercel/output/static
          retention-days: 1

  deploy:
    name: Deploy to Cloudflare Pages
    runs-on: ubuntu-latest
    needs: [build, test-e2e]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-files
          path: apps/web/.vercel/output/static

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: ${{ secrets.CLOUDFLARE_PROJECT_NAME }}
          directory: apps/web/.vercel/output/static
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

      # Note: Required GitHub Secrets for Cloudflare Pages deployment:
      # - CLOUDFLARE_API_TOKEN: API token with Pages:Edit permission
      # - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
      # - CLOUDFLARE_PROJECT_NAME: Name of your Cloudflare Pages project
```

## Configuration Files

### Next.js Configuration

```javascript
// apps/web/next.config.js
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

### Package Scripts Configuration

```json
// apps/web/package.json
{
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
  }
}
```

### Root Package Configuration

```json
// package.json
{
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "prepare": "echo 'Skipping husky in CI' && exit 0"
  }
}
```

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Required GitHub Secrets

Set these secrets in your GitHub repository settings:

1. **CLOUDFLARE_API_TOKEN**
   - Generate in Cloudflare dashboard
   - Permissions: `Zone:Zone Settings:Edit`, `Zone:Zone:Edit`, `Account:Cloudflare Pages:Edit`

2. **CLOUDFLARE_ACCOUNT_ID**
   - Found in Cloudflare dashboard sidebar

3. **CLOUDFLARE_PROJECT_NAME**
   - Name of your Cloudflare Pages project

4. **GITHUB_TOKEN**
   - Automatically provided by GitHub Actions

## Key Features

### 1. Graceful Test Handling

The pipeline includes conditional E2E test execution that:

- Checks if tests directory exists and has content
- Skips E2E tests gracefully if not found
- Provides clear logging for debugging

### 2. Artifact Management

Build artifacts are:

- Uploaded after successful build
- Downloaded in deploy job
- Retained for 1 day to save storage costs

### 3. Environment Compatibility

CI environment handling:

- `HUSKY=0` disables git hooks in CI
- `CI=true` enables CI-specific build behavior
- Prepare script exits gracefully in CI

### 4. Monorepo Integration

Turborepo provides:

- Parallel execution across packages
- Dependency-aware task scheduling
- Efficient caching for faster builds

## Deployment Flow

1. **Trigger**: Push to main branch or pull request
2. **Parallel Jobs**: Lint and Test run simultaneously
3. **E2E Tests**: Run after lint/test with graceful fallback
4. **Build**: Runs after lint/test pass, creates artifacts
5. **Deploy**: Only on main branch push, downloads artifacts and deploys

## Troubleshooting

### Common Issues

1. **ESLint Compatibility**: Use ESLint v8.x with `@eslint/eslintrc`
2. **Build Failures**: Check `CI=true` flag and Husky environment
3. **Deployment Failures**: Verify Cloudflare secrets and permissions
4. **Test Failures**: Ensure test scripts exist in package.json

### Debug Steps

1. Check GitHub Actions logs for specific error messages
2. Verify all required secrets are configured
3. Test builds locally with `bun run build:pages`
4. Validate Next.js configuration for static export

## Related Documentation

- [CI/CD Pipeline Setup Guide](../../technical-guides/cicd-pipeline-setup.md) - Complete setup instructions
- [Testing Infrastructure Lessons Learned](../../lessons-learned/technology/testing-infrastructure-lessons-learned.md) - CI troubleshooting and workflow lessons
- [Test Strategy and Standards](../../architecture/test-strategy-and-standards.md) - Testing in CI/CD context
- [Development Workflow Patterns](../../patterns/development-workflow-patterns.md) - CI/CD patterns
- [Cloudflare Pages Setup Guide](../../technical-guides/cloudflare-pages-setup.md) - Manual deployment setup
- [Cloudflare Pages Troubleshooting](../../technical-guides/cloudflare-pages-deployment-troubleshooting.md)
