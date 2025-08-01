#!/bin/bash

# ci-monitor.sh - Monitor CI runs with timeout and status reporting

set -e

BRANCH=${1:-$(git branch --show-current)}
TIMEOUT=${2:-300}  # Default 5 minutes (300 seconds)

echo "🔄 Monitoring CI for branch: $BRANCH"
echo "⏰ Timeout: ${TIMEOUT} seconds"
echo "========================================"

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

# Function to get latest CI status
get_ci_status() {
    gh run list \
        --branch "$BRANCH" \
        --limit 1 \
        --json status,conclusion,workflowName,createdAt \
        --jq '.[0] // empty'
}

# Function to check if CI is running or queued
is_ci_active() {
    local status_data="$1"
    if [ "$status_data" = "" ]; then
        return 1  # No CI found
    fi
    
    local status=$(echo "$status_data" | jq -r '.status')
    [ "$status" = "in_progress" ] || [ "$status" = "queued" ]
}

# Wait for CI to start if not already running
echo "⏳ Waiting for CI to start..."
sleep 5

START_TIME=$(date +%s)
LAST_STATUS=""

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    # Check timeout
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo ""
        echo "⏰ Timeout reached after ${TIMEOUT} seconds"
        echo "💡 CI may still be running. Check manually: bun run ci:status"
        exit 124  # Standard timeout exit code
    fi
    
    # Get current CI status
    CI_DATA=$(get_ci_status)
    
    if [ "$CI_DATA" = "" ]; then
        echo "ℹ️  No CI runs found for branch '$BRANCH'"
        exit 0
    fi
    
    STATUS=$(echo "$CI_DATA" | jq -r '.status')
    CONCLUSION=$(echo "$CI_DATA" | jq -r '.conclusion // "pending"')
    WORKFLOW=$(echo "$CI_DATA" | jq -r '.workflowName')
    
    # Print status update if it changed
    CURRENT_STATUS="${STATUS}:${CONCLUSION}"
    if [ "$CURRENT_STATUS" != "$LAST_STATUS" ]; then
        REMAINING=$((TIMEOUT - ELAPSED))
        case "$STATUS" in
            "in_progress")
                echo "🔄 [${ELAPSED}s] Running: $WORKFLOW (timeout in ${REMAINING}s)"
                ;;
            "queued")
                echo "⏳ [${ELAPSED}s] Queued: $WORKFLOW (timeout in ${REMAINING}s)"
                ;;
            "completed")
                echo ""
                case "$CONCLUSION" in
                    "success")
                        echo "✅ CI completed successfully! ($WORKFLOW)"
                        echo "   Duration: ${ELAPSED} seconds"
                        exit 0
                        ;;
                    "failure")
                        echo "❌ CI failed! ($WORKFLOW)"
                        echo "   Duration: ${ELAPSED} seconds"
                        echo ""
                        echo "📋 To view logs:"
                        echo "   gh run view --log"
                        echo "   bun run ci:logs"
                        exit 1
                        ;;
                    "cancelled")
                        echo "🚫 CI was cancelled ($WORKFLOW)"
                        echo "   Duration: ${ELAPSED} seconds"
                        exit 2
                        ;;
                    *)
                        echo "⚠️  CI completed with status: $CONCLUSION ($WORKFLOW)"
                        echo "   Duration: ${ELAPSED} seconds"
                        exit 3
                        ;;
                esac
                ;;
            *)
                echo "❓ [${ELAPSED}s] Unknown status: $STATUS ($WORKFLOW)"
                ;;
        esac
        LAST_STATUS="$CURRENT_STATUS"
    fi
    
    # If CI is not active, break
    if ! is_ci_active "$CI_DATA"; then
        break
    fi
    
    # Wait before next check
    sleep 10
done

echo ""
echo "🏁 CI monitoring completed"