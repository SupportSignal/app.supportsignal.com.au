#!/bin/bash
# Quick deployment script for Cloudflare Worker setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Cloudflare Worker Deployment Setup${NC}"
echo -e "${BLUE}=====================================</${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/workers/log-ingestion" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Wrangler CLI...${NC}"
    npm install -g wrangler
fi

echo -e "${GREEN}✅ Wrangler CLI available${NC}"

# Check authentication
echo -e "${BLUE}🔐 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &>/dev/null; then
    echo -e "${YELLOW}🔑 Please login to Cloudflare:${NC}"
    wrangler login
else
    echo -e "${GREEN}✅ Already authenticated with Cloudflare${NC}"
fi

# Navigate to worker directory
cd apps/workers/log-ingestion

echo -e "${BLUE}📁 Working in: $(pwd)${NC}"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing worker dependencies...${NC}"
    bun install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Check for required secrets
echo -e "${BLUE}🔍 Checking environment secrets...${NC}"

SECRETS_NEEDED=()

if ! wrangler secret list | grep -q "UPSTASH_REDIS_REST_URL"; then
    SECRETS_NEEDED+=("UPSTASH_REDIS_REST_URL")
fi

if ! wrangler secret list | grep -q "UPSTASH_REDIS_REST_TOKEN"; then
    SECRETS_NEEDED+=("UPSTASH_REDIS_REST_TOKEN")
fi

if [ ${#SECRETS_NEEDED[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing required secrets:${NC}"
    for secret in "${SECRETS_NEEDED[@]}"; do
        echo -e "${YELLOW}   - $secret${NC}"
    done
    echo ""
    echo -e "${BLUE}Please set these secrets before deploying:${NC}"
    echo -e "${BLUE}1. Create an Upstash Redis database at https://upstash.com/${NC}"
    echo -e "${BLUE}2. Get your REST URL and TOKEN from the dashboard${NC}"
    echo -e "${BLUE}3. Run these commands:${NC}"
    echo ""
    for secret in "${SECRETS_NEEDED[@]}"; do
        echo -e "${YELLOW}   wrangler secret put $secret${NC}"
    done
    echo ""
    read -p "Have you set up the secrets? (y/n): " secrets_ready
    if [ "$secrets_ready" != "y" ]; then
        echo -e "${YELLOW}🛑 Deployment cancelled. Set up secrets first.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ All required secrets are configured${NC}"
fi

# Test build
echo -e "${BLUE}🔨 Testing build...${NC}"
if bun run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Deploy to development first
echo -e "${BLUE}🚀 Deploying to development environment...${NC}"
if wrangler deploy --env development; then
    echo -e "${GREEN}✅ Development deployment successful${NC}"
    DEV_URL=$(wrangler whoami | grep "Account ID" | cut -d: -f2 | xargs)
    echo -e "${GREEN}Development URL: https://log-ingestion-worker-dev.*.workers.dev${NC}"
else
    echo -e "${RED}❌ Development deployment failed${NC}"
    exit 1
fi

# Test development deployment
echo -e "${BLUE}🧪 Testing development deployment...${NC}"
sleep 5  # Give it a moment to propagate

# We can't easily get the exact URL without parsing, so we'll ask the user to test
echo -e "${YELLOW}Please test your development deployment:${NC}"
echo -e "${YELLOW}1. Find your Worker URL in the deployment output above${NC}"
echo -e "${YELLOW}2. Test: curl https://log-ingestion-worker.workers.dev/health${NC}"
echo ""

read -p "Did the health check pass? (y/n): " health_check
if [ "$health_check" != "y" ]; then
    echo -e "${RED}❌ Health check failed. Check Worker logs with: wrangler tail${NC}"
    exit 1
fi

# Deploy to production
echo ""
read -p "Deploy to production? (y/n): " deploy_prod
if [ "$deploy_prod" = "y" ]; then
    echo -e "${BLUE}🚀 Deploying to production environment...${NC}"
    if wrangler deploy --env production; then
        echo -e "${GREEN}✅ Production deployment successful!${NC}"
    else
        echo -e "${RED}❌ Production deployment failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}🎉 Worker deployment complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Note your Worker URL from the deployment output${NC}"
echo -e "${BLUE}2. Add to .env.local: NEXT_PUBLIC_LOG_WORKER_URL=https://log-ingestion-worker.workers.dev${NC}"
echo -e "${BLUE}3. Add to Convex: npx convex env set LOG_WORKER_URL https://log-ingestion-worker.workers.dev${NC}"
echo -e "${BLUE}4. Run the functional test plan to verify everything works${NC}"
echo ""

# Go back to project root
cd ../../..