#!/bin/bash

# sync.sh - Standalone git sync with smart conflict resolution
#
# What this script does:
# 1. Fetches latest changes from remote
# 2. Attempts automatic rebase (preferred) or merge
# 3. Auto-resolves version manifest conflicts (always takes remote version)
# 4. Provides clear guidance for manual conflict resolution
#
# This solves the "behind remote" issue caused by CI version increments
# without requiring a full push operation.
#
# Usage:
#   ./scripts/sync.sh                    # Sync current branch
#   ./scripts/sync.sh main               # Sync specific branch
#   bun run sync                         # Via package.json script

set -e

BRANCH=${1:-$(git branch --show-current)}

echo "🔄 Git Sync for branch: $BRANCH"
echo "================================"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Options:"
    echo ""
    echo "📋 Uncommitted files:"
    git status --porcelain
    echo ""
    echo "💡 Choose an option:"
    echo "   1. Commit your changes: git add . && git commit -m 'your message'"
    echo "   2. Stash your changes: git stash"
    echo "   3. Continue anyway (may cause conflicts): sync.sh --force"
    echo ""
    
    if [ "$2" != "--force" ]; then
        exit 1
    else
        echo "🚨 Continuing with uncommitted changes (--force flag detected)"
        echo ""
    fi
fi

# Fetch latest changes
echo "📥 Fetching latest changes from remote..."
if ! git fetch origin; then
    echo "❌ Failed to fetch from remote. Check your connection."
    exit 1
fi

# Check if we are behind remote
COMMITS_BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
COMMITS_AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")

echo "📊 Branch status:"
echo "   Local commits ahead: $COMMITS_AHEAD"
echo "   Remote commits behind: $COMMITS_BEHIND"
echo ""

if [ "$COMMITS_BEHIND" = "0" ]; then
    echo "✅ Already up to date with remote"
    if [ "$COMMITS_AHEAD" -gt "0" ]; then
        echo "💡 You have $COMMITS_AHEAD local commit(s) ready to push"
        echo "   Run: bun run push"
    fi
    exit 0
fi

echo "🔄 Syncing $COMMITS_BEHIND commit(s) from remote..."

# Try rebase first (cleaner history)
echo "   Attempting rebase (preferred for clean history)..."
if git rebase origin/"$BRANCH" 2>/dev/null; then
    echo "✅ Successfully rebased with remote changes"
    echo ""
    echo "🎉 Sync completed! Your branch is now up to date."
    if [ "$COMMITS_AHEAD" -gt "0" ]; then
        echo "💡 You still have local commits ready to push: bun run push"
    fi
else
    echo "   Rebase failed, trying merge..."
    git rebase --abort 2>/dev/null || true
    
    # Try merge as fallback
    echo "   Attempting merge..."
    if git merge origin/"$BRANCH" --no-edit 2>/dev/null; then
        echo "✅ Successfully merged with remote changes"
        echo ""
        echo "🎉 Sync completed! Your branch is now up to date."
        if [ "$COMMITS_AHEAD" -gt "0" ]; then
            echo "💡 You still have local commits ready to push: bun run push"
        fi
    else
        # Handle conflicts
        CONFLICT_FILES=$(git diff --name-only --diff-filter=U 2>/dev/null || echo "")
        if [ -n "$CONFLICT_FILES" ]; then
            echo "⚠️  Merge conflicts detected in:"
            echo "$CONFLICT_FILES"
            echo ""
            
            # Check if conflicts are only in version manifest
            if echo "$CONFLICT_FILES" | grep -q "version-manifest.json" && [ "$(echo "$CONFLICT_FILES" | wc -l)" = "1" ]; then
                echo "🔧 Auto-resolving version manifest conflict..."
                echo "   Taking remote version (it's newer from CI deployment)"
                
                # Take remote version of manifest (it's always newer from CI)
                git checkout --theirs apps/web/public/version-manifest.json
                git add apps/web/public/version-manifest.json
                
                # Complete the merge
                if git commit --no-edit 2>/dev/null; then
                    echo "✅ Successfully auto-resolved version manifest conflict"
                    echo ""
                    echo "🎉 Sync completed! Your branch is now up to date."
                    if [ "$COMMITS_AHEAD" -gt "0" ]; then
                        echo "💡 You still have local commits ready to push: bun run push"
                    fi
                else
                    echo "❌ Failed to complete merge after resolving conflicts"
                    exit 1
                fi
            else
                echo "❌ Manual conflict resolution required"
                echo ""
                echo "🛠️  Resolution steps:"
                echo "   1. Edit the conflicted files to resolve conflicts"
                echo "   2. Mark resolved files: git add <file-name>"
                echo "   3. Complete the merge: git commit"
                echo "   4. Verify with: git status"
                echo ""
                echo "💡 For version manifest conflicts, you can usually:"
                echo "   git checkout --theirs apps/web/public/version-manifest.json"
                echo "   git add apps/web/public/version-manifest.json"
                echo ""
                echo "🔄 After resolving, run sync again: bun run sync"
                exit 1
            fi
        else
            echo "❌ Merge failed for unknown reason"
            echo ""
            echo "🛠️  Debug steps:"
            echo "   1. Check git status: git status"
            echo "   2. Check git log: git log --oneline -5"
            echo "   3. Reset if needed: git merge --abort"
            exit 1
        fi
    fi
fi