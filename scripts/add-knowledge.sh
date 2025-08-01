#!/bin/bash

# Knowledge Ingestion Script
# Usage: ./scripts/add-knowledge.sh <file-path>
# Example: ./scripts/add-knowledge.sh MOCK.md
# Example: ./scripts/add-knowledge.sh docs/architecture/index.md

set -e

# Check if file path is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <file-path>"
    echo "Example: $0 MOCK.md"
    echo "Example: $0 docs/architecture/index.md"
    exit 1
fi

FILE_PATH="$1"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File '$FILE_PATH' does not exist"
    exit 1
fi

# Get file extension for type detection
FILE_EXTENSION="${FILE_PATH##*.}"
case "$FILE_EXTENSION" in
    md|markdown)
        FILE_TYPE="markdown"
        ;;
    ts|tsx)
        FILE_TYPE="typescript"
        ;;
    js|jsx)
        FILE_TYPE="javascript"
        ;;
    py)
        FILE_TYPE="python"
        ;;
    *)
        FILE_TYPE="text"
        ;;
esac

# Get file modification time (Unix timestamp)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    MODIFIED_AT=$(stat -f %m "$FILE_PATH")
else
    # Linux
    MODIFIED_AT=$(stat -c %Y "$FILE_PATH")
fi

echo "Adding '$FILE_PATH' to knowledge base..."
echo "File type: $FILE_TYPE"
echo "Modified: $(date -r $MODIFIED_AT)"

# Create JSON payload using Node.js for proper escaping
JSON=$(node -e "
const fs = require('fs');
const content = fs.readFileSync('$FILE_PATH', 'utf8');
const payload = {
  content: content,
  source: '$FILE_PATH',
  metadata: {
    file_path: '$FILE_PATH',
    file_type: '$FILE_TYPE',
    modified_at: $MODIFIED_AT
  }
};
console.log(JSON.stringify(payload));
")

# Set Convex deployment if not already set
if [ -z "$CONVEX_DEPLOYMENT" ]; then
    if [ -f "apps/convex/.env.local" ]; then
        export CONVEX_DEPLOYMENT=$(grep "^CONVEX_DEPLOYMENT=" apps/convex/.env.local | cut -d'=' -f2)
        echo "Using deployment: $CONVEX_DEPLOYMENT"
    else
        echo "Error: CONVEX_DEPLOYMENT not set and apps/convex/.env.local not found"
        echo "Please run 'bunx convex dev' first to set up the deployment"
        exit 1
    fi
fi

# Run the Convex command
echo "Processing document..."
npx convex run knowledgeActions:addDocument "$JSON"

echo "✅ Successfully added '$FILE_PATH' to knowledge base"