#!/bin/bash

# Git Worktree Start Script
# Creates a new worktree for parallel story development

set -e

STORY_NUMBER="$1"

if [ -z "$STORY_NUMBER" ]; then
  echo "Error: Story number required"
  echo "Usage: bun run worktree:start <story-number>"
  echo "Example: bun run worktree:start 0.6"
  exit 1
fi

# Sanitize story number for directory and branch names
STORY_DIR="story-${STORY_NUMBER//./-}"
BRANCH_NAME="story/${STORY_NUMBER}"
WORKTREE_PATH="../${STORY_DIR}"

# Check if worktree already exists
if [ -d "$WORKTREE_PATH" ]; then
  echo "Error: Worktree already exists at $WORKTREE_PATH"
  exit 1
fi

# Check if branch already exists
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  echo "Error: Branch $BRANCH_NAME already exists"
  echo "Use: git worktree add $WORKTREE_PATH $BRANCH_NAME"
  exit 1
fi

echo "Creating worktree for story $STORY_NUMBER..."
echo "  Directory: $WORKTREE_PATH"
echo "  Branch: $BRANCH_NAME"

# Create worktree with new branch from current HEAD
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH"

echo ""
echo "✅ Worktree created successfully!"
echo ""
echo "To start working:"
echo "  cd $WORKTREE_PATH"
echo ""
echo "To finish and merge:"
echo "  bun run worktree:end $STORY_NUMBER"
