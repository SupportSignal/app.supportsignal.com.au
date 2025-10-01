#!/bin/bash
# Configuration validation script
# Validates environment configuration across all platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Configuration Validation${NC}"
echo -e "${BLUE}============================${NC}"
echo ""

# Track validation status
VALIDATION_ERRORS=0

# Function to check file exists
check_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        return 0
    else
        echo -e "${RED}❌ $description (missing: $file)${NC}"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
}

# Function to check variable in file
check_variable() {
    local file=$1
    local variable=$2
    local description=$3

    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  $description (file missing: $file)${NC}"
        return 1
    fi

    if grep -q "^$variable=" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $description${NC}"
        return 0
    else
        echo -e "${RED}❌ $description (missing variable: $variable)${NC}"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
}

# Check centralized config
echo -e "${BLUE}Checking centralized configuration...${NC}"
check_file "$HOME/.env-configs/app.supportsignal.com.au.env" "Centralized config file exists"
echo ""

# Check local configuration files
echo -e "${BLUE}Checking local configuration files...${NC}"
check_file "apps/web/.env.local" "Next.js local config exists"
check_file "apps/convex/.env.local" "Convex local config exists"
echo ""

# Check required Next.js variables
echo -e "${BLUE}Validating Next.js configuration...${NC}"
check_variable "apps/web/.env.local" "NEXT_PUBLIC_CONVEX_URL" "NEXT_PUBLIC_CONVEX_URL configured"
check_variable "apps/web/.env.local" "NEXT_PUBLIC_APP_URL" "NEXT_PUBLIC_APP_URL configured"
check_variable "apps/web/.env.local" "NEXT_PUBLIC_LOG_WORKER_URL" "NEXT_PUBLIC_LOG_WORKER_URL configured"
echo ""

# Check required Convex variables
echo -e "${BLUE}Validating Convex configuration...${NC}"
check_variable "apps/convex/.env.local" "GITHUB_CLIENT_ID" "GITHUB_CLIENT_ID configured"
check_variable "apps/convex/.env.local" "GITHUB_CLIENT_SECRET" "GITHUB_CLIENT_SECRET configured"
check_variable "apps/convex/.env.local" "OPENAI_API_KEY" "OPENAI_API_KEY configured"
echo ""

# Check Worker configuration
echo -e "${BLUE}Validating Worker configuration...${NC}"
check_file "apps/workers/log-ingestion/wrangler.toml" "Worker wrangler.toml exists"

# Check if wrangler is available
if command -v wrangler &> /dev/null; then
    cd apps/workers/log-ingestion

    # Check secrets (development)
    if wrangler secret list 2>/dev/null | grep -q "UPSTASH_REDIS_REST_URL"; then
        echo -e "${GREEN}✅ Worker secrets configured (development)${NC}"
    else
        echo -e "${YELLOW}⚠️  Worker secrets not configured (development)${NC}"
        echo -e "${YELLOW}   Run: npx wrangler secret put UPSTASH_REDIS_REST_URL${NC}"
    fi

    cd ../../..
else
    echo -e "${YELLOW}⚠️  Wrangler CLI not available - skipping secret validation${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}============================${NC}"
if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Configuration validation passed${NC}"
    echo -e "${GREEN}All required configuration files and variables are present${NC}"
    exit 0
else
    echo -e "${RED}❌ Configuration validation failed with $VALIDATION_ERRORS error(s)${NC}"
    echo -e "${YELLOW}Run: bun run sync-env --mode=local to generate missing files${NC}"
    exit 1
fi
