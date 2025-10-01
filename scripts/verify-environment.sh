#!/bin/bash
# Environment detection and configuration validation script
# Usage: ./scripts/verify-environment.sh [expected-environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXPECTED_ENV="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🔍 Environment Configuration Validation${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Verification results tracking
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0
DETECTED_ENV="unknown"

# Helper functions
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

# ============================================================================
# SECTION 1: Environment Detection
# ============================================================================

echo -e "${BLUE}🔎 Detecting Current Environment${NC}"
echo -e "${BLUE}--------------------------------${NC}"

# Load environment configuration from source of truth
SOURCE_OF_TRUTH="$HOME/.env-configs/app.supportsignal.com.au.env"

if [ -f "$SOURCE_OF_TRUTH" ]; then
    check_passed "Source of truth configuration found"

    # Check for development indicators
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        check_passed "Local development environment files found"
        DETECTED_ENV="development"

        # Verify .env.local contains development values
        if grep -q "localhost" "$PROJECT_ROOT/.env.local" 2>/dev/null; then
            check_passed "Development URL configuration detected"
        else
            check_warning "Local environment file exists but may contain non-dev values"
        fi
    else
        check_warning "No local .env.local file (expected for deployed environments)"
        DETECTED_ENV="production"
    fi

    # Check Convex deployment indicator
    if [ -f "$PROJECT_ROOT/apps/convex/.env.local" ]; then
        CONVEX_DEPLOYMENT=$(grep "CONVEX_DEPLOYMENT" "$PROJECT_ROOT/apps/convex/.env.local" | cut -d'=' -f2 | tr -d '"' || echo "")

        if [[ "$CONVEX_DEPLOYMENT" == *"beaming-gull"* ]]; then
            check_passed "Convex development deployment detected"
            DETECTED_ENV="development"
        elif [[ "$CONVEX_DEPLOYMENT" == *"graceful-shrimp"* ]]; then
            check_passed "Convex production deployment detected"
            DETECTED_ENV="production"
        else
            check_warning "Unknown Convex deployment: $CONVEX_DEPLOYMENT"
        fi
    fi

    # Check app URL configuration
    if [ -f "$PROJECT_ROOT/apps/web/.env.local" ]; then
        APP_URL=$(grep "NEXT_PUBLIC_APP_URL" "$PROJECT_ROOT/apps/web/.env.local" | cut -d'=' -f2 | tr -d '"' || echo "")

        if [[ "$APP_URL" == *"localhost"* ]] || [[ "$APP_URL" == *"127.0.0.1"* ]]; then
            DETECTED_ENV="development"
        elif [[ "$APP_URL" == *"supportsignal.com.au"* ]]; then
            DETECTED_ENV="production"
        fi
    fi

else
    check_failed "Source of truth configuration not found at $SOURCE_OF_TRUTH"
    echo -e "${YELLOW}Run: bun run env:setup${NC}"
fi

echo ""
echo -e "${BLUE}Detected Environment: ${GREEN}$DETECTED_ENV${NC}"
echo ""

# Validate against expected environment
if [ -n "$EXPECTED_ENV" ]; then
    if [ "$DETECTED_ENV" = "$EXPECTED_ENV" ]; then
        check_passed "Environment matches expected: $EXPECTED_ENV"
    else
        check_failed "Environment mismatch - Expected: $EXPECTED_ENV, Detected: $DETECTED_ENV"
    fi
fi

echo ""

# ============================================================================
# SECTION 2: URL Configuration Validation
# ============================================================================

echo -e "${BLUE}🌐 Validating URL Configuration${NC}"
echo -e "${BLUE}-------------------------------${NC}"

# Check centralized URL config module
URL_CONFIG_FILE="$PROJECT_ROOT/apps/convex/lib/urlConfig.ts"

if [ -f "$URL_CONFIG_FILE" ]; then
    check_passed "Centralized URL configuration module exists"

    # Verify environment detection logic exists
    if grep -q "getEnvironment" "$URL_CONFIG_FILE"; then
        check_passed "Environment detection function present"
    else
        check_warning "Environment detection function not found"
    fi

    # Verify URL generation functions
    if grep -q "getAppUrl" "$URL_CONFIG_FILE"; then
        check_passed "App URL generation function present"
    else
        check_warning "App URL generation function not found"
    fi

    if grep -q "getConvexUrl" "$URL_CONFIG_FILE"; then
        check_passed "Convex URL generation function present"
    else
        check_warning "Convex URL generation function not found"
    fi
else
    check_failed "Centralized URL configuration module not found"
    echo -e "${YELLOW}Expected: apps/convex/lib/urlConfig.ts${NC}"
fi

# Validate URL consistency across environment files
echo ""
echo -e "${BLUE}Checking URL consistency across environment files...${NC}"

# Extract URLs from different locations
WEB_APP_URL=$(grep "NEXT_PUBLIC_APP_URL" "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")
CONVEX_URL=$(grep "NEXT_PUBLIC_CONVEX_URL" "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")
WORKER_URL=$(grep "NEXT_PUBLIC_LOG_WORKER_URL" "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")

# Validate URLs match expected environment
if [ "$DETECTED_ENV" = "development" ]; then
    if [[ "$WEB_APP_URL" == *"localhost"* ]]; then
        check_passed "App URL matches development environment"
    elif [ -z "$WEB_APP_URL" ]; then
        check_warning "App URL not configured"
    else
        check_failed "App URL does not match development environment: $WEB_APP_URL"
    fi

    if [[ "$CONVEX_URL" == *"beaming-gull"* ]]; then
        check_passed "Convex URL matches development deployment"
    elif [ -z "$CONVEX_URL" ]; then
        check_warning "Convex URL not configured"
    else
        check_warning "Convex URL may not match development: $CONVEX_URL"
    fi

elif [ "$DETECTED_ENV" = "production" ]; then
    if [[ "$WEB_APP_URL" == *"supportsignal.com.au"* ]]; then
        check_passed "App URL matches production environment"
    elif [ -z "$WEB_APP_URL" ]; then
        check_warning "App URL not configured (expected for server-side rendering)"
    else
        check_failed "App URL does not match production environment: $WEB_APP_URL"
    fi

    if [[ "$CONVEX_URL" == *"graceful-shrimp"* ]]; then
        check_passed "Convex URL matches production deployment"
    elif [ -z "$CONVEX_URL" ]; then
        check_warning "Convex URL not configured"
    else
        check_warning "Convex URL may not match production: $CONVEX_URL"
    fi
fi

# Validate Worker URL
if [ -n "$WORKER_URL" ]; then
    if [[ "$WORKER_URL" == *"workers.dev"* ]]; then
        check_passed "Worker URL configured with Cloudflare Workers domain"
    else
        check_warning "Worker URL not using standard workers.dev domain: $WORKER_URL"
    fi
else
    check_warning "Worker URL not configured"
fi

echo ""

# ============================================================================
# SECTION 3: OAuth Configuration Validation
# ============================================================================

echo -e "${BLUE}🔐 Validating OAuth Configuration${NC}"
echo -e "${BLUE}----------------------------------${NC}"

# Check GitHub OAuth configuration
GITHUB_CLIENT_ID=$(grep "GITHUB_CLIENT_ID" "$PROJECT_ROOT/apps/convex/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")

if [ -n "$GITHUB_CLIENT_ID" ]; then
    check_passed "GitHub OAuth client ID configured"

    # Verify client ID format (GitHub OAuth IDs start with Ov23)
    if [[ "$GITHUB_CLIENT_ID" == Ov23* ]]; then
        check_passed "GitHub OAuth client ID format valid"
    else
        check_warning "GitHub OAuth client ID format unexpected: $GITHUB_CLIENT_ID"
    fi

    # Check for client secret
    GITHUB_CLIENT_SECRET=$(grep "GITHUB_CLIENT_SECRET" "$PROJECT_ROOT/apps/convex/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")

    if [ -n "$GITHUB_CLIENT_SECRET" ]; then
        check_passed "GitHub OAuth client secret configured"
    else
        check_failed "GitHub OAuth client secret not configured"
    fi

    # Verify callback URLs are configured
    if [ "$DETECTED_ENV" = "production" ]; then
        echo -e "${BLUE}Production OAuth requires callback URL: https://app.supportsignal.com.au/auth/callback/github${NC}"
    else
        echo -e "${BLUE}Development OAuth requires callback URL: http://localhost:3200/auth/callback/github${NC}"
    fi
else
    check_warning "GitHub OAuth not configured"
fi

echo ""

# ============================================================================
# SECTION 4: Secrets and Credentials Validation
# ============================================================================

echo -e "${BLUE}🔑 Validating Secrets Configuration${NC}"
echo -e "${BLUE}----------------------------------${NC}"

# Check OpenAI API key
OPENAI_KEY=$(grep "OPENAI_API_KEY" "$PROJECT_ROOT/apps/convex/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")

if [ -n "$OPENAI_KEY" ]; then
    check_passed "OpenAI API key configured"

    # Verify key format (OpenAI keys start with sk-)
    if [[ "$OPENAI_KEY" == sk-* ]]; then
        check_passed "OpenAI API key format valid"
    else
        check_warning "OpenAI API key format unexpected"
    fi
else
    check_warning "OpenAI API key not configured"
fi

# Check Cloudflare credentials (cannot verify Worker secrets directly)
CLOUDFLARE_ACCOUNT_ID=$(grep "CLOUDFLARE_ACCOUNT_ID" "$SOURCE_OF_TRUTH" 2>/dev/null | awk -F'|' '{print $5}' | tr -d ' ' || echo "")

if [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
    check_passed "Cloudflare account ID configured in source of truth"
else
    check_warning "Cloudflare account ID not found in source of truth"
fi

echo -e "${BLUE}Note: Worker secrets (Redis credentials) must be verified via Wrangler CLI${NC}"

echo ""

# ============================================================================
# SECTION 5: Configuration Drift Detection
# ============================================================================

echo -e "${BLUE}🔄 Checking Configuration Drift${NC}"
echo -e "${BLUE}-------------------------------${NC}"

# Compare local files with source of truth expectations
if [ -f "$SOURCE_OF_TRUTH" ] && [ -f "$PROJECT_ROOT/apps/web/.env.local" ]; then
    # This is simplified - full drift detection requires parsing table format
    check_passed "Source of truth and local files both present"

    # Check file modification times
    SOT_MTIME=$(stat -f %m "$SOURCE_OF_TRUTH" 2>/dev/null || stat -c %Y "$SOURCE_OF_TRUTH" 2>/dev/null)
    LOCAL_MTIME=$(stat -f %m "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null || stat -c %Y "$PROJECT_ROOT/apps/web/.env.local" 2>/dev/null)

    if [ "$SOT_MTIME" -gt "$LOCAL_MTIME" ]; then
        check_warning "Source of truth modified after local files - consider running sync-env"
        echo -e "${YELLOW}Run: bun run sync-env --mode=local${NC}"
    else
        check_passed "Local files appear up to date with source of truth"
    fi
else
    check_warning "Cannot perform drift detection - missing files"
fi

# Suggest running sync-env dry-run
echo ""
echo -e "${BLUE}💡 Tip: Run sync-env in dry-run mode to check for drift:${NC}"
echo -e "${BLUE}   bun run sync-env --mode=local --dry-run${NC}"

echo ""

# ============================================================================
# Summary Report
# ============================================================================

echo -e "${BLUE}📊 Validation Summary${NC}"
echo -e "${BLUE}====================${NC}"
echo ""
echo -e "${BLUE}Detected Environment: ${GREEN}$DETECTED_ENV${NC}"
echo ""
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Warnings: $WARNING_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

# Exit code determination
if [ $FAILED_CHECKS -gt 0 ]; then
    echo -e "${RED}❌ Environment validation FAILED${NC}"
    echo -e "${YELLOW}Review failed checks and run sync-env to correct issues${NC}"
    exit 1
elif [ $WARNING_CHECKS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Environment validation PASSED with warnings${NC}"
    echo -e "${YELLOW}Review warnings - may indicate configuration issues${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Environment validation PASSED${NC}"
    echo -e "${GREEN}All environment configuration checks successful${NC}"
    exit 0
fi
