# Deployment Verification Procedures

**Last Updated**: October 1, 2025
**Version**: 1.0
**Maintainer**: DevOps Team

## Table of Contents

- [Overview](#overview)
- [Post-Deployment Verification Scripts](#post-deployment-verification-scripts)
- [Health Check Procedures](#health-check-procedures)
- [Worker Deployment Verification](#worker-deployment-verification)
- [Environment Detection Validation](#environment-detection-validation)
- [URL Configuration Verification](#url-configuration-verification)
- [OAuth Functionality Verification](#oauth-functionality-verification)
- [Automated Verification Workflow](#automated-verification-workflow)

## Overview

This guide provides comprehensive post-deployment verification procedures to ensure successful deployments across all platforms.

### Verification Workflow

```
┌──────────────────────────────────────────────────────────┐
│              Deployment Complete                          │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Platform Verification │
        ├───────────────────────┤
        │ 1. Pages Health Check │
        │ 2. Convex Health Check│
        │ 3. Worker Health Check│
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Functional Verification│
        ├───────────────────────┤
        │ 1. Authentication     │
        │ 2. Real-time Features │
        │ 3. API Endpoints      │
        │ 4. Worker Functions   │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Integration Testing   │
        ├───────────────────────┤
        │ 1. URL Configuration  │
        │ 2. OAuth Flows        │
        │ 3. End-to-End Tests   │
        └───────────┬───────────┘
                    │
                    ▼
            ┌──────────────┐
            │  ✅ Verified  │
            └──────────────┘
```

## Post-Deployment Verification Scripts

### Comprehensive Verification Script

**Location**: `scripts/verify-deployment.sh`

```bash
#!/bin/bash
# Post-deployment verification script
# Verifies all services are healthy and functional after deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
APP_URL=${2:-https://app.supportsignal.com.au}
WORKER_URL=${3:-https://log-ingestion-worker.workers.dev}

echo -e "${BLUE}🔍 Deployment Verification - $ENVIRONMENT${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Track verification status
VERIFICATION_ERRORS=0

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}

    echo -n "Checking $description... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ ($response)${NC}"
        return 0
    else
        echo -e "${RED}❌ (got $response, expected $expected_status)${NC}"
        VERIFICATION_ERRORS=$((VERIFICATION_ERRORS + 1))
        return 1
    fi
}

# Function to check JSON response
check_json_response() {
    local url=$1
    local description=$2
    local jq_query=$3
    local expected_value=$4

    echo -n "Checking $description... "

    response=$(curl -s "$url" 2>&1)

    if echo "$response" | jq -e "$jq_query" > /dev/null 2>&1; then
        actual_value=$(echo "$response" | jq -r "$jq_query")

        if [ "$actual_value" == "$expected_value" ] || [ -z "$expected_value" ]; then
            echo -e "${GREEN}✅ ($actual_value)${NC}"
            return 0
        else
            echo -e "${RED}❌ (got $actual_value, expected $expected_value)${NC}"
            VERIFICATION_ERRORS=$((VERIFICATION_ERRORS + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ (invalid JSON response)${NC}"
        VERIFICATION_ERRORS=$((VERIFICATION_ERRORS + 1))
        return 1
    fi
}

echo -e "${BLUE}1. Platform Health Checks${NC}"
echo -e "${BLUE}=========================${NC}"
echo ""

# Cloudflare Pages (Next.js)
echo -e "${YELLOW}Cloudflare Pages (Next.js App):${NC}"
check_endpoint "$APP_URL" "Application homepage"
check_endpoint "$APP_URL/api/health" "API health endpoint" 200
echo ""

# Cloudflare Worker
echo -e "${YELLOW}Cloudflare Worker (Log Ingestion):${NC}"
check_endpoint "$WORKER_URL" "Worker homepage"
check_json_response "$WORKER_URL/health" "Worker health status" ".status" "healthy"
check_json_response "$WORKER_URL/health" "Redis connectivity" ".components.redis.status" "healthy"
check_json_response "$WORKER_URL/health" "Rate limiter status" ".components.rate_limiter.status" "healthy"
echo ""

echo -e "${BLUE}2. Functional Verification${NC}"
echo -e "${BLUE}=========================${NC}"
echo ""

# Test worker log ingestion
echo -e "${YELLOW}Testing log ingestion:${NC}"
trace_id="verify-$(date +%s)"

log_response=$(curl -s -X POST "$WORKER_URL/log" \
    -H "Content-Type: application/json" \
    -d "{
        \"trace_id\": \"$trace_id\",
        \"level\": \"info\",
        \"message\": \"Deployment verification test\",
        \"system\": \"browser\"
    }" 2>&1)

if echo "$log_response" | jq -e '.success' > /dev/null 2>&1; then
    if [ "$(echo "$log_response" | jq -r '.success')" == "true" ]; then
        echo -e "${GREEN}✅ Log ingestion successful${NC}"
    else
        echo -e "${RED}❌ Log ingestion failed: $(echo "$log_response" | jq -r '.error')${NC}"
        VERIFICATION_ERRORS=$((VERIFICATION_ERRORS + 1))
    fi
else
    echo -e "${RED}❌ Invalid response from log ingestion${NC}"
    VERIFICATION_ERRORS=$((VERIFICATION_ERRORS + 1))
fi

# Retrieve logs
sleep 2  # Give Redis time to process
retrieval_response=$(curl -s "$WORKER_URL/logs?trace_id=$trace_id" 2>&1)

if echo "$retrieval_response" | jq -e '.logs' > /dev/null 2>&1; then
    log_count=$(echo "$retrieval_response" | jq '.count')
    if [ "$log_count" -gt 0 ]; then
        echo -e "${GREEN}✅ Log retrieval successful ($log_count logs)${NC}"
    else
        echo -e "${YELLOW}⚠️  No logs retrieved (may be expected if filtered)${NC}"
    fi
else
    echo -e "${RED}❌ Invalid response from log retrieval${NC}"
    VERIFICATION_ERRORS=$((VERIFICATION_ERRORS + 1))
fi
echo ""

echo -e "${BLUE}3. Integration Verification${NC}"
echo -e "${BLUE}===========================${NC}"
echo ""

# Check environment detection
echo -e "${YELLOW}Environment detection:${NC}"
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${GREEN}✅ Production environment verified${NC}"
elif [ "$ENVIRONMENT" == "development" ]; then
    echo -e "${GREEN}✅ Development environment verified${NC}"
else
    echo -e "${YELLOW}⚠️  Unknown environment: $ENVIRONMENT${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}==========================================${NC}"
if [ $VERIFICATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment verification passed${NC}"
    echo -e "${GREEN}All services are healthy and functional${NC}"
    exit 0
else
    echo -e "${RED}❌ Deployment verification failed with $VERIFICATION_ERRORS error(s)${NC}"
    echo -e "${YELLOW}Review the errors above and check service logs${NC}"
    exit 1
fi
```

### Quick Health Check Script

**Location**: `scripts/health-check.sh`

```bash
#!/bin/bash
# Quick health check script for all services

# Configuration
PROD_APP_URL="https://app.supportsignal.com.au"
PROD_WORKER_URL="https://log-ingestion-worker.workers.dev"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🏥 Quick Health Check"
echo "===================="
echo ""

# Check Pages
if curl -sf "$PROD_APP_URL" > /dev/null; then
    echo -e "${GREEN}✅ Cloudflare Pages${NC}"
else
    echo -e "${RED}❌ Cloudflare Pages${NC}"
fi

# Check Worker
if curl -sf "$PROD_WORKER_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Cloudflare Worker${NC}"
else
    echo -e "${RED}❌ Cloudflare Worker${NC}"
fi

echo ""
echo "For detailed verification, run: bun run verify:deployment"
```

## Health Check Procedures

### Cloudflare Pages Health Checks

**Manual Health Check:**
```bash
# Check application homepage
curl https://app.supportsignal.com.au

# Expected: HTML page with status 200

# Check API health endpoint
curl https://app.supportsignal.com.au/api/health

# Expected: {"status": "healthy"}
```

**Automated Health Check:**
```bash
# Run health check script
./scripts/health-check.sh

# Or use verification script
./scripts/verify-deployment.sh production
```

### Convex Health Checks

**Check Convex deployment status:**
```bash
# View function spec
bunx convex function-spec --prod

# Expected: List of all deployed functions

# Check recent logs
bunx convex logs --prod

# Expected: No critical errors

# Test a simple query
bunx convex run --prod users:list '{"limit": 1}'

# Expected: Successful query response
```

### Worker Health Checks

**Manual Health Check:**
```bash
# Get full health status
curl https://log-ingestion-worker.workers.dev/health | jq

# Expected output:
# {
#   "status": "healthy",
#   "service": "supportsignal-log-ingestion-worker",
#   "timestamp": 1234567890,
#   "components": {
#     "redis": {
#       "status": "healthy",
#       "url": "configured"
#     },
#     "rate_limiter": {
#       "status": "healthy",
#       ...
#     }
#   }
# }
```

**Component-Specific Checks:**
```bash
# Check Redis connectivity
curl https://log-ingestion-worker.workers.dev/health | jq '.components.redis'

# Check rate limiter status
curl https://log-ingestion-worker.workers.dev/health | jq '.components.rate_limiter'

# Check log processor status
curl https://log-ingestion-worker.workers.dev/health | jq '.components.log_processor'
```

## Worker Deployment Verification

### Complete Worker Verification Procedure

**1. Health Check Validation:**
```bash
# Get worker health status
curl https://log-ingestion-worker.workers.dev/health

# Verify status is "healthy"
# Verify all components are healthy
```

**2. Rate Limiter Functionality Verification:**
```bash
# Test rate limiter by sending multiple requests
for i in {1..5}; do
    curl -X POST https://log-ingestion-worker.workers.dev/log \
        -H "Content-Type: application/json" \
        -d "{
            \"trace_id\": \"rate-test-$i\",
            \"level\": \"info\",
            \"message\": \"Rate limiter test $i\",
            \"system\": \"browser\"
        }" | jq '.remaining_quota'
done

# Expected: Decreasing remaining_quota values
```

**3. Redis Connectivity and Operation Validation:**
```bash
# Send test log
trace_id="redis-test-$(date +%s)"

curl -X POST https://log-ingestion-worker.workers.dev/log \
    -H "Content-Type: application/json" \
    -d "{
        \"trace_id\": \"$trace_id\",
        \"level\": \"info\",
        \"message\": \"Redis connectivity test\",
        \"system\": \"browser\"
    }"

# Retrieve log to verify Redis storage
sleep 2
curl "https://log-ingestion-worker.workers.dev/logs?trace_id=$trace_id"

# Expected: Log entry retrieved successfully
```

**4. Log Ingestion Endpoint Testing:**
```bash
# Test all log levels
for level in info warn error debug; do
    curl -X POST https://log-ingestion-worker.workers.dev/log \
        -H "Content-Type: application/json" \
        -d "{
            \"trace_id\": \"level-test-$(date +%s)\",
            \"level\": \"$level\",
            \"message\": \"Testing $level level\",
            \"system\": \"browser\"
        }"
done

# Verify all succeed with 200 status
```

**5. Durable Objects State Verification:**
```bash
# Check Durable Objects status via health endpoint
curl https://log-ingestion-worker.workers.dev/health | jq '.components.rate_limiter'

# Expected: Rate limiter with current quotas and state
```

### Worker Verification Checklist

**Post-Deployment Checklist:**
- [ ] Health endpoint returns "healthy" status
- [ ] Redis component shows "healthy"
- [ ] Rate limiter component shows "healthy"
- [ ] Log processor component shows "healthy"
- [ ] Log ingestion endpoint accepts requests
- [ ] Rate limiting decreases quotas correctly
- [ ] Redis stores and retrieves logs successfully
- [ ] Durable Objects maintain state across requests
- [ ] All log levels (info, warn, error, debug) accepted
- [ ] Trace retrieval works correctly

## Environment Detection Validation

### Automated Environment Detection

**Convex Environment Detection:**
```bash
# Check current Convex environment
cd apps/convex

# Development
bunx convex env list | grep CONVEX_DEPLOYMENT
# Expected: Contains "dev-" prefix

# Production
bunx convex env list --prod | grep CONVEX_DEPLOYMENT
# Expected: Contains "prod-" prefix or production deployment name
```

**Next.js Environment Detection:**
```bash
# Check environment variables in build
cd apps/web

# Check what NEXT_PUBLIC_APP_URL is set to
grep NEXT_PUBLIC_APP_URL .env.local

# Development expected: http://localhost:3200
# Production (from Cloudflare dashboard): https://app.supportsignal.com.au
```

**Worker Environment Detection:**
```bash
# Check worker environment variable
curl https://log-ingestion-worker.workers.dev/health | jq '.components.environment' || \
curl https://log-ingestion-worker.workers.dev

# Check ENVIRONMENT variable in wrangler.toml matches deployed environment
```

### Manual Environment Verification

**Verify correct environment deployed:**
```bash
# 1. Check Next.js is using correct Convex URL
curl https://app.supportsignal.com.au | grep -o "convex.cloud[^\"]*"
# Should show production Convex deployment

# 2. Check Convex is using correct environment variables
bunx convex env list --prod | grep -E "(GITHUB|OPENAI)"
# Should show production values

# 3. Check Worker is in correct environment
curl https://log-ingestion-worker.workers.dev/health | jq '.service'
# Should show production service name
```

## URL Configuration Verification

### Verify URL Configuration Correctness

**Check Next.js URLs:**
```bash
# View configured URLs in production
curl https://app.supportsignal.com.au/api/config 2>/dev/null || \
grep -r "NEXT_PUBLIC" apps/web/.env.local

# Expected production URLs:
# NEXT_PUBLIC_APP_URL=https://app.supportsignal.com.au
# NEXT_PUBLIC_CONVEX_URL=https://graceful-shrimp-355.convex.cloud
# NEXT_PUBLIC_LOG_WORKER_URL=https://log-ingestion-worker.workers.dev
```

**Check Convex URL Configuration:**
```bash
# From Convex perspective
bunx convex env list --prod | grep URL

# Should match production URLs
```

**Check Worker URL Configuration:**
```bash
# Verify worker is accessible at expected URL
curl https://log-ingestion-worker.workers.dev/

# Should return service info
```

### Cross-Platform URL Verification

**Test URL integration between platforms:**
```bash
# 1. Verify Next.js can reach Convex
curl https://app.supportsignal.com.au/api/test-convex

# 2. Verify Next.js can reach Worker
curl https://app.supportsignal.com.au/api/test-worker

# 3. Verify Convex can reach Worker (if applicable)
bunx convex run --prod testWorkerConnection
```

## OAuth Functionality Verification

### GitHub OAuth Verification

**Test OAuth Configuration:**
```bash
# 1. Check OAuth app configuration in Convex
bunx convex env list --prod | grep GITHUB_CLIENT

# Should show GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET configured

# 2. Test OAuth redirect URLs
curl -I https://app.supportsignal.com.au/api/auth/github

# Should redirect to GitHub OAuth with correct client_id
```

**Manual OAuth Flow Test:**
```
1. Navigate to: https://app.supportsignal.com.au
2. Click "Sign in with GitHub"
3. Verify redirect to GitHub OAuth
4. Authorize application
5. Verify redirect back to app
6. Verify successful login
7. Check session created in Convex
```

**Automated OAuth Test:**
```bash
# Run OAuth flow test (requires test credentials)
bun run test:e2e oauth-flow

# Or use Playwright UI mode
bun run test:e2e:ui oauth-flow
```

## Automated Verification Workflow

### Complete Verification Workflow

**Run comprehensive verification:**
```bash
# 1. Verify configuration
./scripts/validate-config.sh

# 2. Quick health check
./scripts/health-check.sh

# 3. Full deployment verification
./scripts/verify-deployment.sh production

# 4. Run integration tests
bun run test:e2e

# All must pass for successful verification
```

### CI/CD Integration

**Add to package.json:**
```json
{
  "scripts": {
    "verify:health": "./scripts/health-check.sh",
    "verify:deployment": "./scripts/verify-deployment.sh production",
    "verify:config": "./scripts/validate-config.sh",
    "verify:all": "npm run verify:config && npm run verify:health && npm run verify:deployment"
  }
}
```

**GitHub Actions integration:**
```yaml
# Add to .github/workflows/ci.yml
- name: Verify Deployment
  run: |
    bun run verify:all
```

## Troubleshooting Failed Verifications

### Health Check Failures

**If health checks fail:**
```bash
# 1. Check service logs
bunx convex logs --prod                          # Convex logs
npx wrangler tail --env production              # Worker logs
# Check Cloudflare Pages logs in dashboard

# 2. Verify environment variables
./scripts/validate-config.sh

# 3. Check for recent deployments
bun run ci:status

# 4. Verify no incidents
# Check status pages for Cloudflare, Convex
```

### Integration Test Failures

**If integration tests fail:**
```bash
# 1. Verify all platforms are healthy
./scripts/health-check.sh

# 2. Check URL configuration
./scripts/validate-config.sh

# 3. Run tests with debugging
bun run test:e2e --debug

# 4. Check for environment mismatches
# Ensure all platforms are using same environment
```

## Related Documentation

- [Deployment Guide](./deployment-guide.md) - Deployment procedures
- [Configuration Management](./configuration-management.md) - Environment configuration
- [Rollback Procedures](./rollback-procedures.md) - Recovery procedures
- [CI/CD Pipeline Guide](./cicd-pipeline.md) - CI/CD integration

## Support

**For verification issues:**
- Review troubleshooting sections above
- Check service-specific logs
- Consult [Incident Response Procedures](./incident-response.md)
- Contact DevOps team
