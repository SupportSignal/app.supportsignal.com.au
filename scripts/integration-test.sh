#!/bin/bash

# Integration Test Runner for Story 1.1
# Runs all integration tests programmatically via command line

set -e

echo "🧪 Running Integration Tests for Story 1.1..."
echo "   Make sure your Convex dev server is running (bunx convex dev)"
echo ""

# Check if CONVEX_URL is set, otherwise use default
if [ -z "$CONVEX_URL" ]; then
    echo "📍 Using default Convex URL (beaming-gull-639.convex.cloud)"
    echo "   Set CONVEX_URL environment variable to override"
    echo ""
fi

# Run the TypeScript test runner
bun run scripts/run-integration-tests.ts

echo ""
echo "✅ Integration Tests completed!"