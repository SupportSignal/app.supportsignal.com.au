#!/bin/bash

# Script to grant LLM access to a user by email
# Usage: ./scripts/grant-llm-access.sh your-email@example.com

if [ $# -eq 0 ]; then
    echo "Usage: $0 <email>"
    echo "Example: $0 user@example.com"
    exit 1
fi

EMAIL=$1

echo "🔍 Granting LLM access to: $EMAIL"
echo ""

# Grant LLM access using the Convex migration
echo "Running: bunx convex run migrations:grantLLMAccessByEmail --email \"$EMAIL\""
bunx convex run migrations:grantLLMAccessByEmail --email "$EMAIL"

echo ""
echo "✅ Done! If successful, $EMAIL now has LLM access."
echo "🔄 Try refreshing the chat page to see the full AI capabilities."