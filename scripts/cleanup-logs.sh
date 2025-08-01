#!/bin/bash

# Automated log cleanup script
echo "🧹 Starting log cleanup..."

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONVEX_DIR="$PROJECT_ROOT/apps/convex"

# Check if convex directory exists
if [ ! -d "$CONVEX_DIR" ]; then
  echo "❌ Error: Convex directory not found at $CONVEX_DIR"
  echo "Please run this script from the project root directory"
  exit 1
fi

# Change to convex directory
cd "$CONVEX_DIR" || {
  echo "❌ Error: Failed to change to convex directory"
  exit 1
}

echo "📁 Working from: $(pwd)"

# Check initial state
echo "📊 Initial state:"
bunx convex run cleanup:status

echo ""
echo "🗑️ Running safe cleanup batches..."

# Run cleanup in batches until no more data
for i in {1..20}; do
  echo "Batch $i:"
  result=$(bunx convex run cleanup:safe)
  echo "$result"
  
  # Check if deletedCount is 0 (no more data to clean)
  if echo "$result" | grep -q '"deletedCount": 0'; then
    echo "✅ Cleanup complete - no more data to delete"
    break
  fi
  
  # Small delay between batches  
  sleep 1
done

echo ""
echo "📊 Final state:"
bunx convex run cleanup:status

echo "🎉 Cleanup finished!"