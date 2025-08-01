# Development Server Startup Guide

This guide provides comprehensive instructions for starting all development services in the Next.js Convex AI template.

## Prerequisites

- **Working Directory**: `/Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai`
- **Package Manager**: Bun (v1.1.0+)
- **Node.js**: v18.0.0+

## Quick Start (All Services)

### Option 1: Single Command (Recommended)

Start all services with one command using Turbo:

```bash
cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai
bun dev
```

This starts **3 services** in parallel:
- **Next.js Web App** (`web#dev`)
- **Convex Backend** (`convex-backend#dev`) 
- **Log Ingestion Worker** (`@appydave/log-ingestion-worker#dev`)

**Note**: Storybook requires separate startup (see Individual Services below).

### Option 2: Individual Services

Start each service in separate terminals for better control and debugging:

#### Terminal 1 - Next.js Web Application
```bash
cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai
bun run web:dev
# OR directly:
cd apps/web && bun dev
```
- **URL**: http://localhost:3000
- **Purpose**: Frontend React application

#### Terminal 2 - Convex Backend
```bash
cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai
bun run convex:dev
# OR directly:
cd apps/convex && npx convex dev
```
- **Purpose**: Database functions, real-time subscriptions, API endpoints

#### Terminal 3 - Log Ingestion Worker
```bash
cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai
bun run worker:dev
# OR directly:
cd apps/workers/log-ingestion && bun run dev
```
- **URL**: http://localhost:8787
- **Purpose**: Cloudflare Worker for log processing

#### Terminal 4 - Storybook (UI Components)
```bash
cd /Users/davidcruwys/dev/ad/appydave/appydave-templates/starter-nextjs-convex-ai
bun run storybook:dev
# OR existing command:
bun storybook
# OR directly:
cd packages/storybook && bun run storybook
```
- **URL**: http://localhost:6006
- **Purpose**: Component library documentation and testing

## Service Details

### 1. Next.js Web Application (`apps/web/`)
- **Framework**: Next.js 14.2.15 with App Router
- **Port**: 3000
- **Environment**: `.env.local`
- **Hot Reload**: ✅ Enabled

### 2. Convex Backend (`apps/convex/`)
- **Platform**: Convex Cloud
- **Deployment**: `dev:helpful-panther-567`
- **Functions**: Database operations, authentication, real-time features
- **Environment**: `.env.local`

### 3. Log Ingestion Worker (`apps/workers/log-ingestion/`)
- **Platform**: Cloudflare Workers (local development)
- **Port**: 8787
- **Features**: Rate limiting, Redis integration, CORS handling
- **Environment**: `.dev.vars`

### 4. Storybook (`packages/storybook/`)
- **Version**: Latest
- **Port**: 6006
- **Purpose**: UI component development and documentation
- **Components**: Button, Card, Input, Alert, etc.

## Environment Configuration

All services use environment variables for configuration:

- **Project Root**: `.env.source-of-truth.local` (master configuration)
- **Web App**: `apps/web/.env.local`
- **Convex**: `apps/convex/.env.local`
- **Worker**: `apps/workers/log-ingestion/.dev.vars`

### Sync Environment Variables
```bash
bun run sync-env --deployment=dev
```

## Troubleshooting

### Common Issues

1. **Convex exits with code 254**
   - **Solution**: Authentication issue resolved automatically on retry

2. **Wrangler build errors**
   - **Solution**: Fixed deprecated `wrangler.toml` configuration
   - Updated `build.upload.rules` → `rules`
   - Updated `type: "ESModules"` → `type: "ESModule"`

3. **Port conflicts**
   - Next.js: 3000
   - Storybook: 6006  
   - Worker: 8787
   - Convex: Uses cloud deployment

### Service Status Check

Verify all services are running:

```bash
# Check Next.js
curl http://localhost:3000

# Check Storybook  
curl http://localhost:6006

# Check Worker
curl http://localhost:8787

# Check Convex (via web app API calls)
```

## Development Workflow

1. **Start Services**: Use `bun dev` for integrated development
2. **Individual Debugging**: Use separate terminals when troubleshooting
3. **Environment Sync**: Run `bun run sync-env --deployment=dev` after config changes
4. **Code Generation**: Convex auto-generates types on changes

## Additional Commands

### Build & Production
```bash
bun build              # Build all packages
bun start              # Start production server
```

### Testing
```bash
bun test               # Run all tests
bun test:e2e           # E2E tests with Playwright
bun test:e2e:ui        # Playwright with UI
```

### CI/CD
```bash
bun run ci:status      # Check CI pipeline status
bun run ci:watch       # Monitor CI execution
bun run push           # Smart push with validation
```

---

**Quick Reference**: For fastest startup, run `bun dev` from project root. For Storybook, use separate terminal with `bun storybook`.