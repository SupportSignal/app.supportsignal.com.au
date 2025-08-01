# Cloudflare Pages Deployment Setup Guide

## Overview

This guide provides step-by-step instructions for deploying the Next.js application to Cloudflare Pages. Based on extensive troubleshooting and testing, this represents the proven, working configuration.

⚠️ **Important**: This guide is based on hard-won experience from resolving multiple critical deployment issues. Follow the exact steps to avoid common pitfalls.

## Prerequisites

- Cloudflare account with Pages access
- GitHub repository access
- Local development environment with Bun installed

## Quick Setup (If You Know What You're Doing)

```bash
# 1. Install Cloudflare adapter
cd apps/web
bun add @cloudflare/next-on-pages

# 2. Configure Next.js (see Configuration section below)
# 3. Set up Cloudflare Pages project (see Cloudflare Setup section)
# 4. Deploy and test
```

## Detailed Step-by-Step Setup

### Step 1: Install Next.js Cloudflare Adapter

```bash
cd apps/web
bun add @cloudflare/next-on-pages
```

### Step 2: Configure Next.js for Cloudflare Pages

**Update `apps/web/next.config.js`:**

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

**Update `apps/web/package.json` scripts:**

```json
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

### Step 3: Fix Husky for CI Environment

**Update root `package.json`:**

```json
{
  "scripts": {
    "prepare": "echo 'Skipping husky in CI' && exit 0"
  }
}
```

### Step 4: Test Local Build

```bash
# From apps/web directory
bun run build:pages
```

This should complete without errors and create `.vercel/output/static/` directory.

### Step 5: Set Up Cloudflare Pages Project

1. **Go to Cloudflare Dashboard** → Workers & Pages → Pages
2. **Create a new project** → Connect to Git
3. **Select your repository**
4. **Configure build settings:**

   | Setting                | Value                                  |
   | ---------------------- | -------------------------------------- |
   | Framework preset       | None                                   |
   | Build command          | `bun run build && bun run pages:build` |
   | Build output directory | `.vercel/output/static`                |
   | Root directory         | `apps/web`                             |

5. **Add Environment Variables:**
   - `HUSKY=0`

6. **Deploy the project**

### Step 6: Configure Node.js Compatibility

⚠️ **Critical Step**: After first deployment, you'll see Node.js compatibility errors.

1. **Go to your Pages project** → Settings → Functions → Runtime
2. **In Compatibility flags section:**
   - **Production environment**: Add `nodejs_compat`
   - **Preview environment**: Add `nodejs_compat`
3. **Save changes**
4. **Trigger a new deployment** (required for flags to take effect)

### Step 7: Verify Deployment

1. **Check the deployment URL** (will be provided after deployment)
2. **Verify the site loads** without "Node.js Compatibility Error"
3. **Test auto-deployment** by pushing a commit
4. **Confirm build logs** show no compatibility warnings

## Manual Deployment (Alternative)

If auto-deployment fails, use Wrangler CLI:

```bash
# From apps/web directory
npx wrangler pages deploy .vercel/output/static --project-name=your-project-name
```

## Common Issues and Solutions

### Issue: "Node.js Compatibility Error"

**Solution**: Add `nodejs_compat` flag to both Production and Preview environments, then re-deploy.

### Issue: Husky script failing in CI

**Solution**: Update root package.json prepare script to skip husky in CI environments.

### Issue: Auto-deployment not working

**Solutions**:

1. Check branch configuration in Pages settings
2. Verify webhook integration in repository settings
3. Use manual deployment as fallback

### Issue: Build fails with wrangler.toml errors

**Solution**: Never use wrangler.toml with Cloudflare Pages. Remove the file if it exists.

### Issue: Dependencies not installing

**Solution**: Ensure root directory is set to `apps/web` in Pages configuration.

## Architecture Notes

- **Static Site Generation**: Uses Next.js `output: 'export'` for full static generation
- **Build Process**: Two-step build (Next.js → Cloudflare adapter)
- **Output**: Static files in `.vercel/output/static/` for Cloudflare Pages
- **Runtime**: Cloudflare Workers runtime with Node.js compatibility

## Files Modified

- `apps/web/next.config.js` - Cloudflare Pages configuration
- `apps/web/package.json` - Build scripts for deployment
- `package.json` - Husky CI compatibility fix

## Security Considerations

- Environment variables are handled through Cloudflare Pages dashboard
- No secrets should be committed to repository
- Build process runs in isolated Cloudflare environment

## Performance

- Global CDN distribution via Cloudflare network
- Edge caching for static assets
- Optimized build output with tree shaking and minification

## Troubleshooting

For detailed troubleshooting, see:

- [Deployment Troubleshooting Guide](./technical-guides/cloudflare-pages-deployment-troubleshooting.md)
- Build logs in Cloudflare Pages dashboard
- [Anti-patterns Documentation](./lessons-learned/anti-patterns/deployment-anti-patterns.md)

## Support

If you encounter issues not covered in this guide:

1. Check Cloudflare Pages documentation
2. Review build logs for specific error messages
3. Consult the troubleshooting guide linked above
4. Check GitHub Issues for similar problems

---

**Note**: This guide represents the tested, working configuration after extensive troubleshooting. Deviating from these exact steps may result in deployment failures.
