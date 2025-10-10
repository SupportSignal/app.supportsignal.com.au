#!/bin/bash

# Git Worktree End Script
# Merges worktree branch to main and cleans up

set -e

STORY_NUMBER="$1"

if [ -z "$STORY_NUMBER" ]; then
  echo "Error: Story number required"
  echo "Usage: bun run worktree:end <story-number>"
  echo "Example: bun run worktree:end 0.6"
  exit 1
fi

# Sanitize story number for directory and branch names
STORY_DIR="story-${STORY_NUMBER//./-}"
BRANCH_NAME="story/${STORY_NUMBER}"
WORKTREE_PATH="../${STORY_DIR}"

# Check if worktree exists
if [ ! -d "$WORKTREE_PATH" ]; then
  echo "Error: Worktree not found at $WORKTREE_PATH"
  exit 1
fi

# Check if branch exists
if ! git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "Error: Branch $BRANCH_NAME not found"
  exit 1
fi

echo "Ending worktree for story $STORY_NUMBER..."
echo "  Directory: $WORKTREE_PATH"
echo "  Branch: $BRANCH_NAME"
echo ""

# Check for uncommitted changes in worktree
if ! git -C "$WORKTREE_PATH" diff-index --quiet HEAD --; then
  echo "⚠️  Warning: Uncommitted changes in worktree"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Switch to main branch
echo "Switching to main branch..."
git checkout main

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Merge story branch
echo "Merging $BRANCH_NAME into main..."
git merge "$BRANCH_NAME" --no-ff -m "Merge story $STORY_NUMBER"

# Remove worktree
echo "Removing worktree..."
git worktree remove "$WORKTREE_PATH"

# Delete branch
echo "Deleting branch..."
git branch -d "$BRANCH_NAME"

echo ""
echo "✅ Worktree ended successfully!"
echo ""
echo "Story $STORY_NUMBER merged to main and cleaned up."
echo ""
echo "To push changes:"
echo "  git push origin main"
