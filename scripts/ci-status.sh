#!/bin/bash

# ci-status.sh - Quick CI status check for current or specified branch

set -e

BRANCH=${1:-$(git branch --show-current)}

echo "🔍 Checking CI status for branch: $BRANCH"
echo "========================================"

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    echo "   brew install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

# Get recent workflow runs for the branch
echo "📊 Recent CI runs for '$BRANCH':"
echo ""

# Show last 3 workflow runs with status
gh run list \
    --branch "$BRANCH" \
    --limit 3 \
    --json status,conclusion,workflowName,createdAt,headBranch,event \
    --template '{{range .}}{{.status}} | {{.conclusion}} | {{.workflowName}} | {{timeago .createdAt}} | {{.event}}
{{end}}'

echo ""

# Get current status summary
LATEST_STATUS=$(gh run list --branch "$BRANCH" --limit 1 --json status,conclusion --jq '.[0]')

if [ "$LATEST_STATUS" = "null" ] || [ "$LATEST_STATUS" = "" ]; then
    echo "ℹ️  No CI runs found for branch '$BRANCH'"
    exit 0
fi

STATUS=$(echo "$LATEST_STATUS" | jq -r '.status')
CONCLUSION=$(echo "$LATEST_STATUS" | jq -r '.conclusion')

case "$STATUS" in
    "completed")
        case "$CONCLUSION" in
            "success")
                echo "✅ Latest CI run: SUCCESS"
                ;;
            "failure")
                echo "❌ Latest CI run: FAILED"
                echo ""
                echo "💡 To view logs: bun run ci:logs"
                exit 1
                ;;
            "cancelled")
                echo "🚫 Latest CI run: CANCELLED"
                ;;
            *)
                echo "⚠️  Latest CI run: $CONCLUSION"
                ;;
        esac
        ;;
    "in_progress")
        echo "🔄 CI is currently running..."
        echo ""
        echo "💡 To monitor: bun run ci:watch"
        ;;
    "queued")
        echo "⏳ CI is queued and waiting to start..."
        ;;
    *)
        echo "❓ Unknown CI status: $STATUS"
        ;;
esac

echo ""
echo "🔗 GitHub Actions: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/actions"