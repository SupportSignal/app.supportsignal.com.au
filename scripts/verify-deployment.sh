#!/bin/bash
# Post-deployment verification script for all platform deployments
# Usage: ./scripts/verify-deployment.sh [environment]
# Environment: development (default) or production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🔍 SupportSignal Deployment Verification${NC}"
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Verification results tracking
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Helper function for check results
check_passed() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED_CHECKS++))
}

check_failed() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED_CHECKS++))
}

check_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNING_CHECKS++))
}

# Load environment configuration
echo -e "${BLUE}📋 Loading environment configuration...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${BLUE}Production environment - using production URLs and environment variables${NC}"

    # Production uses hardcoded URLs or environment variables
    APP_URL="${NEXT_PUBLIC_APP_URL:-https://app.supportsignal.com.au}"
    CONVEX_URL="${NEXT_PUBLIC_CONVEX_URL:-}"
    WORKER_URL="${NEXT_PUBLIC_LOG_WORKER_URL:-}"

    # If Convex URL not in environment, try to detect from common patterns
    if [ -z "$CONVEX_URL" ]; then
        # Production Convex deployment is graceful-shrimp-355
        CONVEX_URL="https://graceful-shrimp-355.convex.cloud"
    fi

    echo -e "${BLUE}Production configuration:${NC}"
    echo -e "${BLUE}  APP_URL: $APP_URL${NC}"
    echo -e "${BLUE}  CONVEX_URL: ${CONVEX_URL:0:50}...${NC}"
    [ -n "$WORKER_URL" ] && echo -e "${BLUE}  WORKER_URL: ${WORKER_URL:0:50}...${NC}" || echo -e "${YELLOW}  WORKER_URL: Not set (will skip Worker checks)${NC}"

else
    # Development - load from .env.local files
    if [ -f "$PROJECT_ROOT/apps/web/.env.local" ]; then
        echo -e "${BLUE}Development environment - loading from apps/web/.env.local...${NC}"

        # Extract URLs from .env.local
        CONVEX_URL=$(grep "^NEXT_PUBLIC_CONVEX_URL=" "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")
        APP_URL=$(grep "^NEXT_PUBLIC_APP_URL=" "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")
        WORKER_URL=$(grep "^NEXT_PUBLIC_LOG_WORKER_URL=" "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")

        # Use defaults if not found
        if [ -z "$APP_URL" ]; then
            APP_URL="http://localhost:3200"
        fi

        echo -e "${BLUE}Development configuration:${NC}"
        [ -n "$APP_URL" ] && echo -e "${BLUE}  APP_URL: $APP_URL${NC}"
        [ -n "$CONVEX_URL" ] && echo -e "${BLUE}  CONVEX_URL: ${CONVEX_URL:0:50}...${NC}" || echo -e "${YELLOW}  CONVEX_URL: Not set${NC}"
        [ -n "$WORKER_URL" ] && echo -e "${BLUE}  WORKER_URL: ${WORKER_URL:0:50}...${NC}" || echo -e "${YELLOW}  WORKER_URL: Not set${NC}"
    else
        echo -e "${YELLOW}⚠️  No .env.local found - using defaults${NC}"
        APP_URL="http://localhost:3200"
        CONVEX_URL=""
        WORKER_URL=""
    fi
fi

echo ""

# ============================================================================
# SECTION 1: Cloudflare Pages (Next.js Web App) Verification
# ============================================================================

echo -e "${BLUE}🌐 Verifying Cloudflare Pages Deployment${NC}"
echo -e "${BLUE}----------------------------------------${NC}"

# Check if app URL is accessible
if [ -n "$APP_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
        check_passed "Web app accessible at $APP_URL"
    elif [ "$HTTP_CODE" = "000" ]; then
        check_failed "Web app not accessible - connection failed"
    else
        check_failed "Web app returned HTTP $HTTP_CODE"
    fi
else
    check_failed "APP_URL not configured"
fi

# Verify Next.js build artifacts exist (for local verification)
if [ -d "$PROJECT_ROOT/apps/web/dist" ]; then
    check_passed "Next.js static export exists (dist/)"
elif [ -d "$PROJECT_ROOT/apps/web/.next" ]; then
    check_warning "Next.js build exists but not exported for Cloudflare Pages"
else
    check_warning "No Next.js build artifacts found (expected for remote deployment)"
fi

echo ""

# ============================================================================
# SECTION 2: Convex Backend Verification
# ============================================================================

echo -e "${BLUE}⚡ Verifying Convex Backend Deployment${NC}"
echo -e "${BLUE}--------------------------------------${NC}"

# Check Convex URL accessibility
if [ -n "$CONVEX_URL" ]; then
    # Try to access Convex deployment (health check endpoint if available)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CONVEX_URL" || echo "000")

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "405" ]; then
        # 405 is acceptable - means endpoint exists but method not allowed
        check_passed "Convex backend accessible at $CONVEX_URL"
    elif [ "$HTTP_CODE" = "000" ]; then
        check_failed "Convex backend not accessible - connection failed"
    else
        check_warning "Convex backend returned HTTP $HTTP_CODE"
    fi
else
    check_failed "CONVEX_URL not configured"
fi

# Verify Convex deployment via CLI
cd "$PROJECT_ROOT/apps/convex"

if command -v bunx &> /dev/null; then
    if [ "$ENVIRONMENT" = "production" ]; then
        DEPLOY_INFO=$(bunx convex function-spec --prod 2>&1 || echo "ERROR")
    else
        DEPLOY_INFO=$(bunx convex function-spec 2>&1 || echo "ERROR")
    fi

    if [[ "$DEPLOY_INFO" != *"ERROR"* ]]; then
        check_passed "Convex deployment responsive via CLI"
    else
        check_failed "Convex CLI connection failed"
    fi
else
    check_warning "Convex CLI (bunx) not available for verification"
fi

cd "$PROJECT_ROOT"

echo ""

# ============================================================================
# SECTION 3: Cloudflare Worker Verification
# ============================================================================

echo -e "${BLUE}⚙️  Verifying Cloudflare Worker Deployment${NC}"
echo -e "${BLUE}------------------------------------------${NC}"

# Worker health check
if [ -n "$WORKER_URL" ]; then
    WORKER_HEALTH=$(curl -s "$WORKER_URL/health" || echo "ERROR")

    if [[ "$WORKER_HEALTH" != *"ERROR"* ]]; then
        # Parse health status from JSON response
        WORKER_STATUS=$(echo "$WORKER_HEALTH" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

        if [ "$WORKER_STATUS" = "healthy" ]; then
            check_passed "Worker health check: healthy"
        elif [ "$WORKER_STATUS" = "degraded" ]; then
            check_warning "Worker health check: degraded (Redis may be unavailable)"
        else
            check_failed "Worker health check failed: $WORKER_STATUS"
        fi

        # Check Redis connectivity
        REDIS_STATUS=$(echo "$WORKER_HEALTH" | grep -o '"redis":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")
        if [ "$REDIS_STATUS" = "healthy" ]; then
            check_passed "Worker Redis backend: connected"
        else
            check_warning "Worker Redis backend: $REDIS_STATUS"
        fi

        # Check rate limiter
        RATE_LIMITER_STATUS=$(echo "$WORKER_HEALTH" | grep -o '"rate_limiter":{"status":"[^"]*"' | cut -d'"' -f6 || echo "unknown")
        if [ "$RATE_LIMITER_STATUS" = "healthy" ]; then
            check_passed "Worker rate limiter: operational"
        else
            check_warning "Worker rate limiter: $RATE_LIMITER_STATUS"
        fi
    else
        check_failed "Worker not accessible at $WORKER_URL/health"
    fi

    # Test log ingestion endpoint (non-destructive test)
    LOG_TEST=$(curl -s -X OPTIONS "$WORKER_URL/log" -w "\n%{http_code}" || echo "000")
    HTTP_CODE=$(echo "$LOG_TEST" | tail -n1)

    if [ "$HTTP_CODE" = "200" ]; then
        check_passed "Worker log ingestion endpoint: accessible"
    else
        check_warning "Worker log ingestion endpoint returned HTTP $HTTP_CODE"
    fi
else
    check_failed "WORKER_URL not configured"
fi

# Verify Wrangler deployment (if available)
cd "$PROJECT_ROOT/apps/workers/log-ingestion"

if command -v wrangler &> /dev/null; then
    if wrangler whoami &>/dev/null; then
        # Check deployment exists
        if [ "$ENVIRONMENT" = "production" ]; then
            DEPLOY_CHECK=$(wrangler deployments list --env production 2>&1 | head -n5 || echo "ERROR")
        else
            DEPLOY_CHECK=$(wrangler deployments list 2>&1 | head -n5 || echo "ERROR")
        fi

        if [[ "$DEPLOY_CHECK" != *"ERROR"* ]] && [[ "$DEPLOY_CHECK" != *"No deployments"* ]]; then
            check_passed "Worker deployment found via Wrangler CLI"
        else
            check_warning "No recent Worker deployments found"
        fi
    else
        check_warning "Wrangler CLI not authenticated"
    fi
else
    check_warning "Wrangler CLI not available for verification"
fi

cd "$PROJECT_ROOT"

echo ""

# ============================================================================
# SECTION 4: Environment Configuration Verification
# ============================================================================

echo -e "${BLUE}🔧 Verifying Environment Configuration${NC}"
echo -e "${BLUE}--------------------------------------${NC}"

# Check environment detection
if [ "$ENVIRONMENT" = "production" ]; then
    if [[ "$APP_URL" == *"supportsignal.com.au"* ]]; then
        check_passed "Production URL configuration correct"
    else
        check_failed "Production environment but non-production URL: $APP_URL"
    fi
else
    if [[ "$APP_URL" == *"localhost"* ]] || [[ "$APP_URL" == *"127.0.0.1"* ]]; then
        check_passed "Development URL configuration correct"
    else
        check_warning "Development environment with non-local URL: $APP_URL"
    fi
fi

# Verify URL configuration consistency
if [ -f "$PROJECT_ROOT/apps/convex/lib/urlConfig.ts" ]; then
    check_passed "Centralized URL configuration module exists"
else
    check_warning "URL configuration module not found"
fi

# Check OAuth configuration (if applicable)
if [ "$ENVIRONMENT" = "production" ]; then
    # Note: Cannot directly verify OAuth without credentials
    check_warning "OAuth configuration verification requires manual testing"
fi

echo ""

# ============================================================================
# SECTION 5: Summary Report
# ============================================================================

echo -e "${BLUE}📊 Verification Summary${NC}"
echo -e "${BLUE}======================${NC}"
echo ""
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNING_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

# Exit code determination
if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}❌ Deployment verification FAILED${NC}"
    echo -e "${YELLOW}Review failed checks above and investigate issues${NC}"
    exit 1
elif [ $WARNING_CHECKS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Deployment verification PASSED with warnings${NC}"
    echo -e "${YELLOW}Review warnings above - may indicate configuration issues${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Deployment verification PASSED${NC}"
    echo -e "${GREEN}All systems operational${NC}"
    exit 0
fi
