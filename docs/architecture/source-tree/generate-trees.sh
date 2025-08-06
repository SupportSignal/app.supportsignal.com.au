#!/bin/bash

# generate-trees.sh - Generate all source tree views using gpt_context commands
# Usage: ./generate-trees.sh

set -e  # Exit on any error

# Configuration
GPT_CONTEXT="/Users/davidcruwys/dev/ad/appydave/appydave-tools/bin/gpt_context.rb"
OUTPUT_DIR="$(dirname "$0")"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if gpt_context exists
check_gpt_context() {
    if [[ ! -f "$GPT_CONTEXT" ]]; then
        print_status $RED "❌ Error: gpt_context.rb not found at $GPT_CONTEXT"
        print_status $YELLOW "Please ensure appydave-tools are installed and accessible"
        exit 1
    fi
}

# Function to add header to generated file
add_header() {
    local file=$1
    local title=$2
    local description=$3
    
    cat > "$file" << EOF
# $title

> **Generated:** $TIMESTAMP  
> **Source:** gpt_context.rb dynamic analysis  
> **Description:** $description

---

EOF
}

# Function to generate source tree
generate_tree() {
    local name=$1
    local title=$2
    local description=$3
    local command=$4
    local filename="${OUTPUT_DIR}/${name}.md"
    
    print_status $BLUE "🔍 Generating: $title"
    
    # Add header to temp file
    local temp_file="/tmp/gpt_context_${name}.tmp"
    add_header "$temp_file" "$title" "$description"
    
    # Execute command with -o flag pointing to final file
    local final_command=$(echo "$command" | sed "s|-o ${name}.md|-o $filename|")
    
    if eval "$final_command" 2>&1; then
        # If gpt_context succeeded, prepend our header
        cat "$temp_file" "$filename" > "${filename}.tmp" && mv "${filename}.tmp" "$filename"
        print_status $GREEN "✅ Generated: $name.md"
    else
        # If failed, create error file with header and command info
        cat "$temp_file" > "$filename"
        echo "Command: $final_command" >> "$filename"
        echo "Exit code: $?" >> "$filename"
        print_status $RED "❌ Failed: $name.md"
    fi
    
    # Clean up temp file
    rm -f "$temp_file"
}

# Main execution
main() {
    print_status $YELLOW "🚀 Starting source tree generation..."
    
    # Check prerequisites
    check_gpt_context
    
    # Change to project root (assuming script is in docs/architecture/source-tree/)
    cd "$(dirname "$0")/../../.."
    PROJECT_ROOT=$(pwd)
    print_status $BLUE "📁 Project root: $PROJECT_ROOT"
    
    # Generate all 15 views
    
    # Core Project Views
    generate_tree "all-files-no-hidden" \
        "All Files (No Hidden)" \
        "Complete project excluding hidden folders" \
        "$GPT_CONTEXT -i 'apps/**/*' -i 'docs/**/*' -i 'packages/**/*' -i 'scripts/**/*' -i 'tests/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree -o all-files-no-hidden.md"
    
    generate_tree "all-files-with-hidden" \
        "All Files (With Hidden)" \
        "Complete project including hidden folders" \
        "$GPT_CONTEXT -i '**/*' -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree -o all-files-with-hidden.md"
    
    generate_tree "hidden-only" \
        "Hidden Only" \
        "Hidden config folders excluding code" \
        "$GPT_CONTEXT -i '.bmad-core/**/*' -i '.claude/**/*' -i '.github/**/*' -i '.husky/**/*' -e '.git/**/*' -e '.turbo/**/*' -d -f tree -o hidden-only.md"
    
    # Code-Focused Views
    generate_tree "code-only" \
        "Code Only" \
        "Implementation code without tests/docs" \
        "$GPT_CONTEXT -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/__tests__/**/*' -e '**/test*' -e '**/storybook/**/*' -d -f tree -o code-only.md"
    
    generate_tree "code-plus-tests" \
        "Code Plus Tests" \
        "Implementation and test files only" \
        "$GPT_CONTEXT -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -i 'tests/**/*.ts' -i 'tests/**/*.tsx' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/storybook/**/*' -d -f tree -o code-plus-tests.md"
    
    generate_tree "architecture-context" \
        "Architecture Context" \
        "Code plus architectural documentation" \
        "$GPT_CONTEXT -i 'apps/**/*.ts' -i 'apps/**/*.tsx' -i 'packages/ui/**/*.ts' -i 'packages/ui/**/*.tsx' -i 'docs/architecture/**/*' -i 'docs/patterns/**/*' -i 'docs/methodology/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -e '**/storybook/**/*' -d -f tree -o architecture-context.md"
    
    # Documentation Views
    generate_tree "docs-permanent" \
        "Docs Permanent" \
        "Architectural/permanent documentation" \
        "$GPT_CONTEXT -i 'docs/architecture/**/*' -i 'docs/patterns/**/*' -i 'docs/methodology/**/*' -i 'docs/technical-guides/**/*' -i 'docs/template-usage/**/*' -e 'docs/testing/uat/**/*' -d -f tree -o docs-permanent.md"
    
    generate_tree "docs-transient" \
        "Docs Transient" \
        "Stories/UAT/time-sensitive docs" \
        "$GPT_CONTEXT -i 'docs/testing/uat/**/*' -i 'docs/examples/**/*' -i 'docs/**/story-*' -i 'docs/**/*sprint*' -d -f tree -o docs-transient.md"
    
    # Specialized Views
    generate_tree "test-segmented" \
        "Test Segmented" \
        "Tests by location and module type" \
        "$GPT_CONTEXT -i 'tests/**/*' -i 'apps/**/test*' -i 'apps/**/__tests__/**/*' -i 'packages/**/__tests__/**/*' -e '**/node_modules/**/*' -e '**/storybook/**/*' -d -f tree -o test-segmented.md"
    
    generate_tree "config-only" \
        "Config Only" \
        "Configuration files across project" \
        "$GPT_CONTEXT -i '**/*.json' -i '**/*.js' -i '**/*.config.*' -i '**/tsconfig*' -i '**/jest*' -i '**/eslint*' -i '**/playwright*' -e '**/node_modules/**/*' -e '**/package-lock.json' -e '**/bun.lock' -e '**/storybook/**/*' -d -f tree -o config-only.md"
    
    generate_tree "deployment-files" \
        "Deployment Files" \
        "All deployment-related configurations" \
        "$GPT_CONTEXT -i '**/wrangler*' -i '**/.github/**/*' -i '**/cloudflare*' -i '**/deploy*' -i 'scripts/**/*' -e '**/node_modules/**/*' -d -f tree -o deployment-files.md"
        
    generate_tree "deprecation-cleanup" \
        "Deprecation Cleanup" \
        "Deprecated/backup files for cleanup" \
        "$GPT_CONTEXT -i '**/*.deprecated.*' -i '**/*.old.*' -i '**/*.backup' -i '**/*.bak' -i '**/*.tmp' -d -f tree -o deprecation-cleanup.md"
    
    # Module-Specific Views
    generate_tree "backend-only" \
        "Backend Only" \
        "Convex backend and workers only" \
        "$GPT_CONTEXT -i 'apps/convex/**/*' -i 'apps/workers/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree -o backend-only.md"
    
    generate_tree "frontend-only" \
        "Frontend Only" \
        "Next.js web app only" \
        "$GPT_CONTEXT -i 'apps/web/**/*' -i 'packages/ui/**/*' -i 'packages/storybook/**/*' -e '**/node_modules/**/*' -e '**/_generated/**/*' -d -f tree -o frontend-only.md"
    
    print_status $GREEN "🎉 Source tree generation completed!"
    print_status $YELLOW "📁 Generated files location: docs/architecture/source-tree/"
    print_status $BLUE "🔍 View individual files or use README.md for overview"
}

# Run main function
main "$@"