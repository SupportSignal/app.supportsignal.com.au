#!/bin/bash

# UAT Test Suite for Story 4.2 - Knowledge Ingestion Service
# Usage: ./scripts/test-uat-4.2.sh [test-case]
# Example: ./scripts/test-uat-4.2.sh tc1.1
# Example: ./scripts/test-uat-4.2.sh all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Set Convex deployment if not already set
if [ -z "$CONVEX_DEPLOYMENT" ]; then
    if [ -f "apps/convex/.env.local" ]; then
        export CONVEX_DEPLOYMENT=$(grep "^CONVEX_DEPLOYMENT=" apps/convex/.env.local | cut -d'=' -f2)
        echo -e "${BLUE}Using deployment: $CONVEX_DEPLOYMENT${NC}"
    else
        echo -e "${RED}Error: CONVEX_DEPLOYMENT not set and apps/convex/.env.local not found${NC}"
        echo "Please run 'bunx convex dev' first to set up the deployment"
        exit 1
    fi
fi

# Helper function to run convex command
run_convex_cmd() {
    local json_payload="$1"
    local description="$2"
    local should_fail="${3:-false}"
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Command: npx convex run knowledgeActions:addDocument '$json_payload'"
    echo ""
    
    if [ "$should_fail" = "true" ]; then
        # Expected to fail - capture output and check for expected error
        if npx convex run knowledgeActions:addDocument "$json_payload" 2>&1 | grep -q "ConvexError"; then
            echo -e "${GREEN}✅ PASS: Expected error occurred${NC}"
        else
            echo -e "${RED}❌ FAIL: Expected error did not occur${NC}"
        fi
    else
        # Expected to succeed
        if npx convex run knowledgeActions:addDocument "$json_payload"; then
            echo -e "${GREEN}✅ PASS: Command succeeded${NC}"
        else
            echo -e "${RED}❌ FAIL: Command failed unexpectedly${NC}"
        fi
    fi
    echo ""
}

# Helper function for vector search
run_vector_search() {
    local json_payload="$1"
    local description="$2"
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "Command: npx convex run knowledgeActions:queryVectorSimilarity '$json_payload'"
    echo ""
    
    # Capture output to check for Vectorize configuration issues
    output=$(npx convex run knowledgeActions:queryVectorSimilarity "$json_payload" 2>&1)
    exit_code=$?
    
    echo "$output"
    
    if echo "$output" | grep -q "Vectorize configuration incomplete"; then
        echo -e "${YELLOW}⚠️  SKIP: Vectorize not configured - this test requires Cloudflare Vectorize setup${NC}"
        echo -e "${BLUE}   To enable: Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, VECTORIZE_DATABASE_ID${NC}"
    elif [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ PASS: Vector search succeeded${NC}"
    else
        echo -e "${RED}❌ FAIL: Vector search failed${NC}"
    fi
    echo ""
}

# Test Cases
tc1_1() {
    echo -e "${GREEN}=== TC1.1: Document Processing Action Exists ===${NC}"
    run_convex_cmd '{"content":"Test document content","source":"test.md","metadata":{"file_path":"test.md","file_type":"markdown","modified_at":1706227200000}}' "Basic document processing"
}

tc1_2() {
    echo -e "${GREEN}=== TC1.2: Input Validation ===${NC}"
    
    echo -e "${BLUE}Testing empty content (should fail):${NC}"
    run_convex_cmd '{"content":"","source":"test.md"}' "Empty content validation" "true"
    
    echo -e "${BLUE}Testing empty source (should fail):${NC}"
    run_convex_cmd '{"content":"Test content","source":""}' "Empty source validation" "true"
    
    echo -e "${BLUE}Testing valid input (should succeed):${NC}"
    run_convex_cmd '{"content":"Valid document content for testing the knowledge ingestion system.","source":"valid-test.md"}' "Valid input processing" "false"
}

tc1_3() {
    echo -e "${GREEN}=== TC1.3: Document Deduplication ===${NC}"
    
    echo -e "${BLUE}Adding document first time:${NC}"
    run_convex_cmd '{"content":"Duplicate test content","source":"dup-test.md"}' "First document addition"
    
    echo -e "${BLUE}Adding same document again (should detect duplicate):${NC}"
    run_convex_cmd '{"content":"Duplicate test content","source":"dup-test.md"}' "Duplicate document detection"
}

tc2_1() {
    echo -e "${GREEN}=== TC2.1: Text Content Processing ===${NC}"
    
    echo -e "${BLUE}Testing markdown content:${NC}"
    run_convex_cmd '{"content":"# Test Document\n\nThis is **markdown** content with formatting.","source":"test.md","metadata":{"file_path":"test.md","file_type":"markdown","modified_at":1706227200000}}' "Markdown content processing"
    
    echo -e "${BLUE}Testing plain text:${NC}"
    run_convex_cmd '{"content":"Plain text document without any formatting or special characters.","source":"test.txt","metadata":{"file_path":"test.txt","file_type":"text","modified_at":1706227200000}}' "Plain text processing"
    
    echo -e "${BLUE}Testing TypeScript code:${NC}"
    run_convex_cmd '{"content":"export interface TestInterface {\n  id: string;\n  name: string;\n}","source":"test.ts","metadata":{"file_path":"test.ts","file_type":"typescript","modified_at":1706227200000}}' "TypeScript code processing"
}

tc2_2() {
    echo -e "${GREEN}=== TC2.2: Large Document Handling ===${NC}"
    
    # Create large content
    LARGE_CONTENT=$(printf 'This is a large document with repeated content. %.0s' {1..500})
    JSON_PAYLOAD=$(node -e "console.log(JSON.stringify({content: '$LARGE_CONTENT', source: 'large-test.md'}))")
    
    run_convex_cmd "$JSON_PAYLOAD" "Large document processing"
}

tc3_1() {
    echo -e "${GREEN}=== TC3.1: Text Chunking Verification ===${NC}"
    run_convex_cmd '{"content":"This is the first sentence. This is the second sentence. This is the third sentence with more content to ensure chunking occurs properly when the text exceeds the maximum chunk size limit.","source":"chunk-test.md"}' "Text chunking verification"
}

tc3_2() {
    echo -e "${GREEN}=== TC3.2: Embedding Generation (with OpenAI API key) ===${NC}"
    run_convex_cmd '{"content":"Test document for embedding generation with sufficient content to create meaningful vector representations.","source":"embedding-test.md"}' "Embedding generation test"
}

tc3_3() {
    echo -e "${GREEN}=== TC3.3: Embedding Generation Fallback ===${NC}"
    run_convex_cmd '{"content":"Test document without embedding generation capability.","source":"no-embedding-test.md"}' "Embedding fallback test"
}

tc4_2() {
    echo -e "${GREEN}=== TC4.2: Vector Storage Verification ===${NC}"
    run_convex_cmd '{"content":"CHANGED by DAVID DEBUG TEST '"$(date +%s)"' Document for vector storage verification with sufficient content to create multiple chunks and test the complete vector storage pipeline.","source":"vector-storage-test.md"}' "Vector storage verification"
}

tc6_1() {
    echo -e "${GREEN}=== TC6.1: Vector Query Functionality ===${NC}"
    run_vector_search '{"query":"test document content","topK":5,"includeContent":true}' "Vector similarity search with content"
}

tc6_2() {
    echo -e "${GREEN}=== TC6.2: Similarity Search Without Content ===${NC}"
    run_vector_search '{"query":"test query","includeContent":false}' "Vector similarity search without content"
}

tc5_1() {
    echo -e "${GREEN}=== TC5.1: Seeding Script Availability ===${NC}"
    echo -e "${BLUE}Checking if seeding script exists:${NC}"
    ls -la scripts/seed-knowledge.cjs
    echo ""
    
    echo -e "${BLUE}Running dry run:${NC}"
    bun run seed:knowledge:dry
}

tc5_2() {
    echo -e "${GREEN}=== TC5.2: File Type Filtering ===${NC}"
    echo -e "${BLUE}Running dry run to check file filtering:${NC}"
    bun run seed:knowledge:dry | head -20
}

# Main execution
case "${1:-all}" in
    "tc1.1"|"TC1.1")
        tc1_1
        ;;
    "tc1.2"|"TC1.2")
        tc1_2
        ;;
    "tc1.3"|"TC1.3")
        tc1_3
        ;;
    "tc2.1"|"TC2.1")
        tc2_1
        ;;
    "tc2.2"|"TC2.2")
        tc2_2
        ;;
    "tc3.1"|"TC3.1")
        tc3_1
        ;;
    "tc3.2"|"TC3.2")
        tc3_2
        ;;
    "tc3.3"|"TC3.3")
        tc3_3
        ;;
    "tc4.2"|"TC4.2")
        tc4_2
        ;;
    "tc5.1"|"TC5.1")
        tc5_1
        ;;
    "tc5.2"|"TC5.2")
        tc5_2
        ;;
    "tc6.1"|"TC6.1")
        tc6_1
        ;;
    "tc6.2"|"TC6.2")
        tc6_2
        ;;
    "all"|"ALL")
        echo -e "${GREEN}Running all UAT test cases for Story 4.2${NC}"
        echo ""
        tc1_1
        echo ""; echo ""
        tc1_2
        echo ""; echo ""
        tc1_3
        echo ""; echo ""
        tc2_1
        echo ""; echo ""
        tc2_2
        echo ""; echo ""
        tc3_1
        echo ""; echo ""
        tc3_2
        echo ""; echo ""
        tc3_3
        echo ""; echo ""
        tc4_2
        echo ""; echo ""
        tc5_1
        echo ""; echo ""
        tc5_2
        echo ""; echo ""
        tc6_1
        echo ""; echo ""
        tc6_2
        echo ""
        echo -e "${GREEN}All UAT tests completed!${NC}"
        ;;
    *)
        echo "Usage: $0 [test-case]"
        echo ""
        echo "Available test cases:"
        echo "  tc1.1  - Document Processing Action Exists"
        echo "  tc1.2  - Input Validation"
        echo "  tc1.3  - Document Deduplication"
        echo "  tc2.1  - Text Content Processing"
        echo "  tc2.2  - Large Document Handling"
        echo "  tc3.1  - Text Chunking Verification"
        echo "  tc3.2  - Embedding Generation (with API key)"
        echo "  tc3.3  - Embedding Generation Fallback"
        echo "  tc4.2  - Vector Storage Verification"
        echo "  tc5.1  - Seeding Script Availability"
        echo "  tc5.2  - File Type Filtering"
        echo "  tc6.1  - Vector Query Functionality"
        echo "  tc6.2  - Similarity Search Without Content"
        echo "  all    - Run all test cases"
        echo ""
        echo "Examples:"
        echo "  $0 tc1.1     # Run single test case"
        echo "  $0 all       # Run all test cases"
        ;;
esac