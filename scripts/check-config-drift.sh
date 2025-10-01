#!/usr/bin/env bash

#############################################################################
# Configuration Drift Detection Script
#
# Purpose: Compare environment configurations across platforms to detect drift
# Usage: ./scripts/check-config-drift.sh [environment]
#
# Arguments:
#   environment - dev or prod (optional, checks both if not specified)
#
# Exit Codes:
#   0 - No configuration drift detected
#   1 - Configuration drift detected
#   2 - Script error or missing dependencies
#############################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CENTRAL_CONFIG="$HOME/.env-configs/app.supportsignal.com.au.env"
DRIFT_COUNT=0
ENVIRONMENT="${1:-both}"

# Banner
echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Configuration Drift Detection                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Verify central config exists
if [ ! -f "$CENTRAL_CONFIG" ]; then
    echo -e "${RED}❌ Central configuration file not found: $CENTRAL_CONFIG${NC}"
    exit 2
fi

echo -e "${GREEN}✅ Central configuration found${NC}"
echo ""

#############################################################################
# Function: Extract value from central config
#############################################################################
get_central_value() {
    local key=$1
    local env_type=$2  # DEV_VALUE or PROD_VALUE

    # Extract value from table format
    grep "^|" "$CENTRAL_CONFIG" | \
        grep -v "^|--" | \
        grep -v "^| TARGET" | \
        awk -F'|' -v key="$key" -v env="$env_type" '
            $4 ~ key {
                if (env == "DEV_VALUE") print $5
                else if (env == "PROD_VALUE") print $6
            }
        ' | \
        tr -d ' ' | head -1
}

#############################################################################
# Function: Get Convex environment variable
#############################################################################
get_convex_value() {
    local key=$1
    local deployment=$2

    if [ "$deployment" = "dev" ]; then
        bunx convex env list 2>/dev/null | grep "^$key=" | cut -d'=' -f2- || echo ""
    else
        bunx convex env list --prod 2>/dev/null | grep "^$key=" | cut -d'=' -f2- || echo ""
    fi
}

#############################################################################
# Function: Compare values and report drift
#############################################################################
compare_values() {
    local platform=$1
    local key=$2
    local central_value=$3
    local actual_value=$4
    local env_name=$5

    if [ -z "$actual_value" ]; then
        echo -e "${YELLOW}⚠️  $platform ($env_name) - $key: NOT SET${NC}"
        echo -e "   Expected: ${BLUE}$central_value${NC}"
        DRIFT_COUNT=$((DRIFT_COUNT + 1))
        return 1
    fi

    if [ "$central_value" != "$actual_value" ]; then
        echo -e "${RED}❌ $platform ($env_name) - $key: DRIFT DETECTED${NC}"
        echo -e "   Expected: ${BLUE}$central_value${NC}"
        echo -e "   Actual:   ${YELLOW}$actual_value${NC}"
        DRIFT_COUNT=$((DRIFT_COUNT + 1))
        return 1
    fi

    echo -e "${GREEN}✅ $platform ($env_name) - $key: OK${NC}"
    return 0
}

#############################################################################
# Function: Check Convex environment
#############################################################################
check_convex_environment() {
    local env_type=$1  # dev or prod
    local env_name=$2  # Development or Production

    echo -e "${BLUE}Checking Convex $env_name Environment...${NC}"
    echo ""

    # Key variables to check
    local keys=(
        "NEXT_PUBLIC_APP_URL"
        "NEXT_PUBLIC_CONVEX_URL"
        "NEXT_PUBLIC_LOG_WORKER_URL"
        "GITHUB_CLIENT_ID"
    )

    for key in "${keys[@]}"; do
        # Determine central config column
        local column="PROD_VALUE"
        if [ "$env_type" = "dev" ]; then
            column="DEV_VALUE"
        fi

        # Get expected value from central config
        local central_value=$(get_central_value "$key" "$column")

        # Skip if not in central config
        if [ -z "$central_value" ]; then
            continue
        fi

        # Get actual value from Convex
        local actual_value=$(get_convex_value "$key" "$env_type")

        # Compare values
        compare_values "Convex" "$key" "$central_value" "$actual_value" "$env_name"
    done

    echo ""
}

#############################################################################
# Function: Check local environment files
#############################################################################
check_local_environment() {
    echo -e "${BLUE}Checking Local Environment Files...${NC}"
    echo ""

    local env_files=(
        "apps/web/.env.local"
        "apps/convex/.env.local"
    )

    for env_file in "${env_files[@]}"; do
        if [ ! -f "$env_file" ]; then
            echo -e "${YELLOW}⚠️  $env_file: NOT FOUND${NC}"
            DRIFT_COUNT=$((DRIFT_COUNT + 1))
            continue
        fi

        echo -e "Checking: ${BLUE}$env_file${NC}"

        # Check key variables
        local keys=(
            "NEXT_PUBLIC_APP_URL"
            "NEXT_PUBLIC_CONVEX_URL"
            "NEXT_PUBLIC_LOG_WORKER_URL"
        )

        for key in "${keys[@]}"; do
            # Get expected DEV value from central config
            local central_value=$(get_central_value "$key" "DEV_VALUE")

            # Skip if not in central config
            if [ -z "$central_value" ]; then
                continue
            fi

            # Get actual value from env file
            local actual_value=$(grep "^$key=" "$env_file" 2>/dev/null | cut -d'=' -f2- || echo "")

            # Compare values
            compare_values "Local" "$key" "$central_value" "$actual_value" "$env_file"
        done

        echo ""
    done
}

#############################################################################
# Function: Check GitHub Secrets (requires gh CLI)
#############################################################################
check_github_secrets() {
    echo -e "${BLUE}Checking GitHub Secrets...${NC}"
    echo ""

    # Check if gh CLI is available
    if ! command -v gh &> /dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI (gh) not available - skipping GitHub Secrets check${NC}"
        echo -e "   Install with: brew install gh${NC}"
        echo ""
        return 0
    fi

    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated - skipping GitHub Secrets check${NC}"
        echo -e "   Authenticate with: gh auth login${NC}"
        echo ""
        return 0
    fi

    # List secrets (can't read values, only verify they exist)
    echo -e "Verifying GitHub Secrets exist..."

    local required_secrets=(
        "CLOUDFLARE_API_TOKEN"
        "CLOUDFLARE_ACCOUNT_ID"
        "CLOUDFLARE_PROJECT_NAME"
        "NEXT_PUBLIC_APP_URL"
        "NEXT_PUBLIC_CONVEX_URL"
        "NEXT_PUBLIC_LOG_WORKER_URL"
    )

    for secret in "${required_secrets[@]}"; do
        if gh secret list | grep -q "^$secret"; then
            echo -e "${GREEN}✅ GitHub Secret - $secret: EXISTS${NC}"
        else
            echo -e "${RED}❌ GitHub Secret - $secret: MISSING${NC}"
            DRIFT_COUNT=$((DRIFT_COUNT + 1))
        fi
    done

    echo ""
    echo -e "${YELLOW}ℹ️  Note: Cannot verify GitHub Secret values (API limitation)${NC}"
    echo -e "   Manual verification required via GitHub Settings${NC}"
    echo ""
}

#############################################################################
# Main execution
#############################################################################

# Check local environment files (always uses dev values)
check_local_environment

# Check Convex environments
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "both" ]; then
    check_convex_environment "dev" "Development"
fi

if [ "$ENVIRONMENT" = "prod" ] || [ "$ENVIRONMENT" = "both" ]; then
    check_convex_environment "prod" "Production"
fi

# Check GitHub Secrets
check_github_secrets

#############################################################################
# Summary and exit
#############################################################################

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

if [ $DRIFT_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ No configuration drift detected${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Configuration drift detected: $DRIFT_COUNT issue(s)${NC}"
    echo ""
    echo -e "${YELLOW}Remediation Steps:${NC}"
    echo -e "1. Review drift issues above"
    echo -e "2. Update central config: $CENTRAL_CONFIG"
    echo -e "3. Sync environments: ${BLUE}bun run sync-env --mode=local${NC}"
    echo -e "4. Deploy to Convex: ${BLUE}bun run sync-env --mode=deploy-dev${NC} or ${BLUE}--mode=deploy-prod${NC}"
    echo -e "5. Update GitHub Secrets: ${BLUE}gh secret set [SECRET_NAME]${NC}"
    echo -e "6. Re-run drift check: ${BLUE}./scripts/check-config-drift.sh${NC}"
    echo ""
    exit 1
fi
