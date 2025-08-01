#!/bin/bash
# Script to safely migrate from old Convex logging to new Worker logging system
# Run this ONLY after confirming the Worker logging system is operational

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Logging System Migration Cleanup${NC}"
echo -e "${BLUE}=====================================Convex Logging → Worker + Redis Migration${NC}"
echo ""

# Verify we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "apps/convex" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root directory${NC}"
    exit 1
fi

# Check if Convex is available
if ! command -v bunx &> /dev/null; then
    echo -e "${RED}❌ Error: bun is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  IMPORTANT: This script will permanently delete old logging data${NC}"
echo -e "${YELLOW}   Make sure your Worker logging system is operational first!${NC}"
echo ""

# Step 1: Check current logging data status
echo -e "${BLUE}📊 Step 1: Checking current logging data status...${NC}"
cd apps/convex

echo "Running: bunx convex run migrations/cleanupLoggingTables:checkLoggingDataStatus"
RESULT=$(bunx convex run migrations/cleanupLoggingTables:checkLoggingDataStatus 2>/dev/null || echo "error")

if [ "$RESULT" = "error" ]; then
    echo -e "${RED}❌ Failed to check logging data status${NC}"
    echo -e "${YELLOW}This could mean:${NC}"
    echo -e "${YELLOW}  - The old logging tables don't exist (already cleaned)${NC}"
    echo -e "${YELLOW}  - Convex is not properly configured${NC}"
    echo -e "${YELLOW}  - The migration script has an error${NC}"
    echo ""
    echo -e "${BLUE}Attempting to verify Worker system instead...${NC}"
    
    # Try to verify Worker health
    if bunx convex run internalLogging:checkWorkerHealth &>/dev/null; then
        echo -e "${GREEN}✅ Worker logging system appears to be available${NC}"
        echo -e "${GREEN}   Old logging tables may already be cleaned up${NC}"
    else
        echo -e "${YELLOW}⚠️  Worker logging system not yet configured${NC}"
        echo -e "${YELLOW}   Complete Worker setup before running this cleanup${NC}"
    fi
    
    cd ../..
    exit 0
fi

echo "$RESULT"
echo ""

# Parse the result to check if data exists
if echo "$RESULT" | grep -q '"safe_to_delete": true'; then
    echo -e "${GREEN}✅ No logging data found - tables appear to be empty${NC}"
    
    echo -e "${BLUE}🔍 Verifying cleanup completion...${NC}"
    bunx convex run migrations/cleanupLoggingTables:verifyCleanupComplete
    
    cd ../..
    echo -e "${GREEN}🎉 Migration cleanup verification complete!${NC}"
    exit 0
fi

# Step 2: Confirm with user before proceeding
echo -e "${YELLOW}⚠️  Found existing logging data that will be permanently deleted${NC}"
echo ""
echo -e "${RED}This action cannot be undone!${NC}"
echo ""
echo -e "Prerequisites checklist:"
echo -e "  ✓ Worker logging system is deployed and operational"
echo -e "  ✓ Environment variables are configured (LOG_WORKER_URL, etc.)"
echo -e "  ✓ You have tested the new Worker logging and confirmed it works"
echo -e "  ✓ You understand this will permanently delete old log data"
echo ""

read -p "Do you want to proceed with the cleanup? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}🛑 Cleanup cancelled by user${NC}"
    cd ../..
    exit 0
fi

# Step 3: Batch cleanup
echo -e "${BLUE}🧹 Step 3: Starting batch cleanup...${NC}"
echo "This may take several iterations for large datasets"
echo ""

BATCH_COUNT=0
MAX_BATCHES=50  # Safety limit

while [ $BATCH_COUNT -lt $MAX_BATCHES ]; do
    BATCH_COUNT=$((BATCH_COUNT + 1))
    echo -e "${BLUE}Running batch $BATCH_COUNT...${NC}"
    
    BATCH_RESULT=$(bunx convex run migrations/cleanupLoggingTables:cleanupLoggingDataBatch '{"batch_size": 100, "confirm_deletion": true}' 2>/dev/null || echo "error")
    
    if [ "$BATCH_RESULT" = "error" ]; then
        echo -e "${RED}❌ Error during batch cleanup${NC}"
        cd ../..
        exit 1
    fi
    
    echo "$BATCH_RESULT"
    
    # Check if cleanup is complete
    if echo "$BATCH_RESULT" | grep -q '"status": "all_clean"'; then
        echo -e "${GREEN}✅ Batch cleanup complete - no more data to delete${NC}"
        break
    fi
    
    # Small delay between batches
    sleep 1
done

if [ $BATCH_COUNT -ge $MAX_BATCHES ]; then
    echo -e "${YELLOW}⚠️  Reached maximum batch limit. You may need to run the script again.${NC}"
fi

# Step 4: Final verification
echo ""
echo -e "${BLUE}🔍 Step 4: Final verification...${NC}"
VERIFY_RESULT=$(bunx convex run migrations/cleanupLoggingTables:verifyCleanupComplete 2>/dev/null || echo "error")

if [ "$VERIFY_RESULT" = "error" ]; then
    echo -e "${RED}❌ Error during verification${NC}"
    cd ../..
    exit 1
fi

echo "$VERIFY_RESULT"

if echo "$VERIFY_RESULT" | grep -q '"cleanup_complete": true'; then
    echo ""
    echo -e "${GREEN}🎉 Migration cleanup completed successfully!${NC}"
    echo -e "${GREEN}   All old logging data has been removed${NC}"
    echo -e "${GREEN}   Worker logging system is now the only active logging method${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Monitor Worker logging to ensure it's working correctly"
    echo -e "  2. Update any admin interfaces that may reference old logging tables"
    echo -e "  3. Deploy the updated schema to remove table definitions"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Cleanup verification failed - some data may remain${NC}"
    echo -e "${YELLOW}   Run this script again or use the complete cleanup option${NC}"
fi

cd ../..
echo -e "${BLUE}Migration cleanup script completed${NC}"