#!/bin/bash
# Quick health check script for all services
# Usage: ./scripts/health-check.sh [environment]

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-production}"

echo "🏥 Quick Health Check - $ENVIRONMENT"
echo "======================================"
echo ""

# Set URLs based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    APP_URL="https://app.supportsignal.com.au"
    WORKER_URL="https://log-ingestion-worker.workers.dev"
else
    APP_URL="http://localhost:3200"
    WORKER_URL="http://localhost:8787"
fi

# Check Pages
if curl -sf "$APP_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Cloudflare Pages${NC} ($APP_URL)"
else
    echo -e "${RED}❌ Cloudflare Pages${NC} ($APP_URL)"
fi

# Check Worker
if curl -sf "$WORKER_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Cloudflare Worker${NC} ($WORKER_URL)"

    # Get detailed worker status
    HEALTH=$(curl -s "$WORKER_URL/health" 2>/dev/null)
    if command -v jq &> /dev/null; then
        REDIS_STATUS=$(echo "$HEALTH" | jq -r '.components.redis.status' 2>/dev/null || echo "unknown")
        RATE_LIMITER_STATUS=$(echo "$HEALTH" | jq -r '.components.rate_limiter.status' 2>/dev/null || echo "unknown")

        if [ "$REDIS_STATUS" = "healthy" ]; then
            echo -e "  ${GREEN}✅ Redis: $REDIS_STATUS${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Redis: $REDIS_STATUS${NC}"
        fi

        if [ "$RATE_LIMITER_STATUS" = "healthy" ]; then
            echo -e "  ${GREEN}✅ Rate Limiter: $RATE_LIMITER_STATUS${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Rate Limiter: $RATE_LIMITER_STATUS${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Cloudflare Worker${NC} ($WORKER_URL)"
fi

echo ""
echo "For detailed verification, run: ./scripts/verify-deployment.sh $ENVIRONMENT"
