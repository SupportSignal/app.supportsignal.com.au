# Cloudflare Worker Deployment Setup Guide

## Overview

This guide walks you through setting up and deploying the log ingestion Cloudflare Worker for Epic 3.4. The Worker handles high-frequency logging with Redis backend and rate limiting.

## Prerequisites

### Required Accounts & Services

1. **Cloudflare Account** (Free tier works)
   - Sign up at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
   - Note your Account ID from the dashboard

2. **Upstash Redis Account** (Free tier: 10K commands/day)
   - Sign up at [https://upstash.com/](https://upstash.com/)
   - Create a Redis database
   - Note the REST URL and REST Token

### Required Tools

```bash
# Install Wrangler CLI (Cloudflare's deployment tool)
npm install -g wrangler

# Verify installation
wrangler --version
```

## Quick Setup (Recommended)

### Step 1: Use Centralized Environment Management

**🚀 The fastest and most reliable way to set up the log ingestion worker:**

```bash
# 1. Review what will be configured
node scripts/sync-env.js --dry-run

# 2. Apply configuration to all platforms (Next.js, Convex, Worker)
node scripts/sync-env.js

# 3. Deploy the worker with automated validation
./scripts/deploy-worker.sh
```

This centralized approach:
- ✅ Configures all environment variables from single source
- ✅ Validates secrets and prevents exposure
- ✅ Creates backup of existing configuration
- ✅ Works across Next.js, Convex, and Cloudflare Workers

### Step 2: Verify Setup

```bash
# Test the deployed worker
curl https://your-worker-url.workers.dev/health
```

**That's it!** The centralized system handles account IDs, Redis credentials, CORS origins, and all environment variables automatically.

---

## Manual Setup (Fallback)

*Use this only if the automated setup doesn't work for your environment.*

### Step 1: Cloudflare Authentication

```bash
# Login to Cloudflare
wrangler login

# This will open your browser for authentication
# Follow the prompts to authorize Wrangler
```

### Step 2: Upstash Redis Setup

1. **Create Redis Database**:
   - Go to [Upstash Console](https://console.upstash.com/)
   - Click "Create Database"
   - Choose region (closest to your users)
   - Select "Free" plan
   - Name it `log-ingestion-redis`

2. **Get Connection Details**:
   ```bash
   # You'll need these values from your Upstash dashboard:
   UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```

### Step 3: Worker Configuration

Navigate to the Worker directory:

```bash
cd apps/workers/log-ingestion
```

Update `wrangler.toml` with your details:

```toml
name = "log-ingestion-worker"
main = "src/index.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# Replace with your account ID
account_id = "your-cloudflare-account-id"

# Workers dev configuration
workers_dev = true

# Durable Objects configuration
[[durable_objects.bindings]]
name = "RATE_LIMIT_STATE"
class_name = "RateLimiterDO"

[env.development]
name = "log-ingestion-worker-dev"

[env.production]
name = "log-ingestion-worker-prod"
```

### Step 4: Set Environment Secrets

Set your Redis credentials as Wrangler secrets:

```bash
# Set Redis URL secret
wrangler secret put UPSTASH_REDIS_REST_URL
# Paste your Redis URL when prompted

# Set Redis token secret
wrangler secret put UPSTASH_REDIS_REST_TOKEN
# Paste your Redis token when prompted
```

### Step 5: Install Dependencies

```bash
# Make sure you're in the worker directory
cd apps/workers/log-ingestion

# Install dependencies
bun install
```

### Step 6: Local Development Testing

```bash
# Start local development server
bun run dev

# This runs: wrangler dev
# Worker will be available at http://localhost:8787
```

Test the local worker:

```bash
# Test health endpoint
curl http://localhost:8787/health

# Should return JSON with service status
```

### Step 7: Deploy to Production

```bash
# Deploy to development environment first
wrangler deploy --env development

# If successful, deploy to production
wrangler deploy --env production
```

After deployment, you'll get URLs like:
- Development: `https://log-ingestion-worker-dev.your-subdomain.workers.dev`
- Production: `https://log-ingestion-worker-prod.your-subdomain.workers.dev`

## Environment Variables Setup

### For Next.js Application

Add to your `.env.local`:

```bash
# Development
NEXT_PUBLIC_LOG_WORKER_URL=https://log-ingestion-worker-dev.your-subdomain.workers.dev

# Production
NEXT_PUBLIC_LOG_WORKER_URL=https://log-ingestion-worker-prod.your-subdomain.workers.dev
```

### For Convex Backend

Add to your Convex environment variables:

```bash
cd apps/convex

# Set the Convex environment variable
npx convex env set LOG_WORKER_URL https://log-ingestion-worker-prod.your-subdomain.workers.dev
```

## Verification Steps

### Step 1: Health Check

```bash
# Test your deployed worker
curl https://your-worker-url.workers.dev/health

# Should return:
{
  "status": "healthy",
  "service": "log-ingestion-worker",
  "components": {
    "redis": {"status": "healthy"},
    "rate_limiter": {"status": "healthy"}
  }
}
```

### Step 2: Test Log Ingestion

```bash
# Send a test log
curl -X POST https://your-worker-url.workers.dev/log \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "test_trace_123",
    "message": "Deployment test log",
    "level": "info",
    "system": "manual"
  }'

# Should return:
{
  "success": true,
  "trace_id": "test_trace_123",
  "remaining_quota": 999
}
```

### Step 3: Test Log Retrieval

```bash
# Retrieve the test log
curl "https://your-worker-url.workers.dev/logs?trace_id=test_trace_123"

# Should return your test log with timestamp and system info
```

### Step 4: Test Convex Bridge

```bash
cd apps/convex

# Test Convex to Worker connection
bunx convex run internalLogging:checkWorkerHealth

# Should return worker_healthy: true
```

## Troubleshooting

### Common Issues

#### 1. "Account ID is required"
```bash
# Get your account ID
wrangler whoami

# Add it to wrangler.toml
account_id = "your-account-id-here"
```

#### 2. "Could not resolve dependencies"
```bash
# Make sure you're in the worker directory
cd apps/workers/log-ingestion

# Reinstall dependencies
rm -rf node_modules
bun install
```

#### 3. "Redis connection failed"
```bash
# Verify your Redis secrets
wrangler secret list

# Should show:
# UPSTASH_REDIS_REST_URL
# UPSTASH_REDIS_REST_TOKEN

# Test Redis connection directly
curl -X POST "https://your-redis-url.upstash.io/ping" \
  -H "Authorization: Bearer your-token"
```

#### 4. "Durable Object binding failed"
Make sure your `wrangler.toml` includes:
```toml
[[durable_objects.bindings]]
name = "RATE_LIMIT_STATE"
class_name = "RateLimiterDO"
```

#### 5. CORS Issues
The Worker includes CORS headers by default. If you have issues:
- Check that requests include proper `Content-Type: application/json`
- Verify the Worker URL is correct in environment variables

### Logs and Debugging

```bash
# View Worker logs in real-time
wrangler tail

# View specific deployment logs
wrangler logs
```

## Production Checklist

Before going live:

- [ ] Worker deployed successfully to production environment
- [ ] Health endpoint returns "healthy" status
- [ ] Redis connection working (check health endpoint)
- [ ] Rate limiting functioning (test with multiple requests)
- [ ] Environment variables set in Next.js and Convex
- [ ] CORS working from your domain
- [ ] Log ingestion working from browser console
- [ ] Log retrieval working via API
- [ ] Convex bridge functioning
- [ ] Old Convex logging system cleaned up

## Cost Monitoring

### Cloudflare Workers
- **Free Tier**: 100,000 requests/day
- **Paid**: $0.15 per million requests after free tier

### Upstash Redis
- **Free Tier**: 10,000 commands/day
- **Paid**: $0.2 per 100K commands

### Expected Monthly Costs
With projected usage (~50K logs/month):
- **Cloudflare Workers**: Free (well under limit)
- **Upstash Redis**: ~$2/month
- **Total**: ~$2/month (vs ~$10/month with old Convex system)

## Monitoring & Maintenance

### Regular Checks
1. **Weekly**: Check Worker logs for errors
2. **Monthly**: Review Redis usage and costs
3. **As needed**: Update Worker if rate limits need adjustment

### Key Metrics to Monitor
- Request success rate (should be >99%)
- Redis connection health
- Rate limit hit frequency
- Response time (<100ms typical)

## Next Steps

After successful deployment:

1. **Update UAT Plan**: Replace placeholder URLs with your actual Worker URLs
2. **Run Full Testing**: Execute the functional test plan
3. **Monitor Performance**: Watch logs and metrics for first week
4. **Document URLs**: Update team documentation with Worker endpoints

Your Worker logging system is now ready for production use! 🚀