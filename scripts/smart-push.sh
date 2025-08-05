#!/bin/bash

# smart-push.sh - Intelligent git push with auto-sync and pre-flight checks
#
# What this script does:
# 1. Checks if you have uncommitted changes (stops if you do)
# 2. AUTO-SYNCS with remote to handle version manifest updates from CI
# 3. Checks if you have commits ready to push (exits if nothing to push)
# 4. Runs local validation BEFORE pushing:
#    - TypeScript type checking
#    - ESLint code quality checks  
#    - Production build test
# 5. Only pushes to remote if all local validation passes
# 6. Monitors the CI build and reports success/failure
#
# This prevents the "behind remote" issue caused by CI version increments
# and ensures code quality before pushing to keep the main branch clean.
#
# Usage:
#   ./scripts/smart-push.sh           # Full validation + CI monitoring
#   ./scripts/smart-push.sh false     # Skip CI monitoring
#   ./scripts/smart-push.sh true 600  # Custom timeout (10 minutes)

set -e

BRANCH=$(git branch --show-current)
MONITOR_CI=${1:-"true"}  # Default to monitoring CI
TIMEOUT=${2:-300}        # Default 5 minute timeout

echo "🚀 Smart Push for branch: $BRANCH"
echo "======================================"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Please commit or stash them first."
    echo ""
    echo "📋 Uncommitted files:"
    git status --porcelain
    exit 1
fi

# Auto-sync with remote to handle CI version increments
echo "🔄 Syncing with remote..."
echo ""

# Fetch latest changes
echo "📥 Fetching latest changes from remote..."
if ! git fetch origin; then
    echo "❌ Failed to fetch from remote. Check your connection."
    exit 1
fi

# Check if we are behind remote
COMMITS_BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
if [ "$COMMITS_BEHIND" -gt "0" ]; then
    echo "📊 Local branch is $COMMITS_BEHIND commit(s) behind remote"
    echo "🔄 Attempting automatic sync..."
    
    # Try rebase first (cleaner history)
    echo "   Trying rebase..."
    if git rebase origin/"$BRANCH" 2>/dev/null; then
        echo "✅ Successfully rebased with remote changes"
    else
        echo "   Rebase failed, trying merge..."
        git rebase --abort 2>/dev/null || true
        
        # Try merge as fallback
        if git merge origin/"$BRANCH" --no-edit 2>/dev/null; then
            echo "✅ Successfully merged with remote changes"
        else
            # Handle conflicts - check if they're just version manifest
            CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "")
            if [ -n "$CONFLICT_FILES" ]; then
                echo "⚠️  Merge conflicts detected:"
                echo "$CONFLICT_FILES"
                
                # Check if conflicts are only in version manifest
                if echo "$CONFLICT_FILES" | grep -q "version-manifest.json" && [ "$(echo "$CONFLICT_FILES" | wc -l)" = "1" ]; then
                    echo "🔧 Auto-resolving version manifest conflict (taking remote version)..."
                    
                    # Take remote version of manifest (it's always newer from CI)
                    git checkout --theirs apps/web/public/version-manifest.json
                    git add apps/web/public/version-manifest.json
                    
                    # Complete the merge
                    if git commit --no-edit 2>/dev/null; then
                        echo "✅ Successfully auto-resolved version manifest conflict"
                    else
                        echo "❌ Failed to complete merge after resolving conflicts"
                        exit 1
                    fi
                else
                    echo "❌ Manual conflict resolution required for:"
                    echo "$CONFLICT_FILES"
                    echo ""
                    echo "💡 To resolve manually:"
                    echo "   1. Fix conflicts in the files above"
                    echo "   2. Run: git add <resolved-files>"
                    echo "   3. Run: git commit"
                    echo "   4. Run: bun run push again"
                    exit 1
                fi
            else
                echo "❌ Merge failed for unknown reason"
                exit 1
            fi
        fi
    fi
    
    echo "✅ Sync completed successfully!"
    echo ""
else
    echo "✅ Already up to date with remote"
    echo ""
fi

# Check if we're ahead of remote (after sync)
COMMITS_AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
if [ "$COMMITS_AHEAD" = "0" ]; then
    echo "ℹ️  No new commits to push."
    echo ""
    echo "💡 Current status:"
    ./scripts/ci-status.sh "$BRANCH"
    exit 0
fi

echo "📤 Found $COMMITS_AHEAD commit(s) to push"
echo ""

# Run pre-push validation
echo "🔍 Running pre-push validation..."
echo ""

# 1. Type checking
echo "📝 TypeScript type checking..."
if ! bun run typecheck; then
    echo "❌ TypeScript errors found. Please fix before pushing."
    exit 1
fi
echo "✅ TypeScript: OK"

# 2. Linting
echo ""
echo "🧹 Running ESLint..."
if ! bun run lint; then
    echo "❌ ESLint errors found. Please fix before pushing."
    exit 1
fi
echo "✅ ESLint: OK"

# 3. Build test
echo ""
echo "🏗️  Testing production build..."
if ! bun run build; then
    echo "❌ Build failed. Please fix before pushing."
    exit 1
fi
echo "✅ Build: OK"

echo ""
echo "✅ All pre-push validations passed!"
echo ""

# Push to remote
echo "📤 Pushing to remote..."
if ! git push; then
    echo "❌ Push failed. Please resolve and try again."
    exit 1
fi

echo "✅ Successfully pushed to remote!"
echo ""

# Monitor CI if requested
if [ "$MONITOR_CI" = "true" ]; then
    echo "👀 Starting CI monitoring..."
    echo ""
    
    # Give CI a moment to register the push
    sleep 3
    
    # Run CI monitor with timeout
    if ./scripts/ci-monitor.sh "$BRANCH" "$TIMEOUT"; then
        echo ""
        echo "🎉 Smart push completed successfully!"
        echo "   ✅ Local validation passed"
        echo "   ✅ Push successful"  
        echo "   ✅ CI passed"
    else
        EXIT_CODE=$?
        echo ""
        case $EXIT_CODE in
            1)
                echo "💥 Smart push failed: CI failed"
                echo "   ✅ Local validation passed"
                echo "   ✅ Push successful"
                echo "   ❌ CI failed"
                ;;
            124)
                echo "⏰ Smart push timed out: CI still running"
                echo "   ✅ Local validation passed"
                echo "   ✅ Push successful"
                echo "   ⏳ CI timeout (may still be running)"
                echo ""
                echo "💡 Check CI status manually: bun run ci:status"
                ;;
            *)
                echo "❓ Smart push completed with unexpected CI status"
                echo "   ✅ Local validation passed"
                echo "   ✅ Push successful"
                echo "   ❓ CI status unclear"
                ;;
        esac
        exit $EXIT_CODE
    fi
else
    echo "ℹ️  CI monitoring skipped"
    echo ""
    echo "💡 To check CI status: bun run ci:status"
    echo "💡 To monitor CI: bun run ci:watch"
fi

echo ""
echo "🔗 View on GitHub: https://github.com/$(gh repo view --json owner,name --jq '.owner.login + "/" + .name')/actions"