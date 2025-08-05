#!/bin/bash

# Version Increment Script for CI/CD Pipeline
# Automatically increments version based on conventional commit messages
# Updates version manifest during successful deployments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MANIFEST_FILE="$PROJECT_ROOT/apps/web/public/version-manifest.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
check_git_repository() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "This script must be run from within a git repository"
        exit 1
    fi
}

# Parse conventional commit type and determine version increment
get_version_increment() {
    local commit_message="$1"
    
    # Extract conventional commit type (everything before the first colon)
    if [[ $commit_message =~ ^([a-zA-Z]+)(\(.+\))?:.*$ ]]; then
        local commit_type="${BASH_REMATCH[1]}"
        
        case "$commit_type" in
            "feat"|"feature")
                echo "minor"
                ;;
            "fix"|"bugfix")
                echo "patch"
                ;;
            "docs"|"doc"|"style"|"refactor"|"perf"|"test"|"chore"|"ci"|"build")
                echo "patch"
                ;;
            "BREAKING"|"breaking")
                echo "major"
                ;;
            *)
                # Check for breaking change indicators in message body
                if [[ $commit_message =~ BREAKING.CHANGE ]]; then
                    echo "major"
                else
                    echo "patch"
                fi
                ;;
        esac
    else
        # Non-conventional commit, default to patch
        echo "patch"
    fi
}

# Increment semantic version
increment_version() {
    local version="$1"
    local increment_type="$2"
    
    # Parse version components
    local major minor patch
    IFS='.' read -r major minor patch <<< "$version"
    
    case "$increment_type" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Get GitHub repository URL from git remote
get_github_repo_url() {
    local remote_url
    remote_url=$(git config --get remote.origin.url 2>/dev/null || echo "")
    
    if [[ -z "$remote_url" ]]; then
        log_warning "No remote origin URL found"
        echo ""
        return
    fi
    
    # Convert SSH URL to HTTPS if needed
    if [[ $remote_url =~ git@github\.com:(.+)/(.+)\.git ]]; then
        echo "https://github.com/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    elif [[ $remote_url =~ https://github\.com/(.+)/(.+)\.git ]]; then
        echo "https://github.com/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    elif [[ $remote_url =~ https://github\.com/(.+)/(.+) ]]; then
        echo "https://github.com/${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
    else
        log_warning "Could not parse GitHub URL from remote: $remote_url"
        echo ""
    fi
}

# Get current version from manifest
get_current_version() {
    if [[ ! -f "$MANIFEST_FILE" ]]; then
        log_error "Version manifest not found: $MANIFEST_FILE"
        log_error "Please run bootstrap-version-history.sh first"
        exit 1
    fi
    
    local current_version
    current_version=$(jq -r '.current // empty' "$MANIFEST_FILE" 2>/dev/null)
    if [[ -z "$current_version" ]]; then
        log_error "Could not read current version from manifest"
        exit 1
    fi
    
    echo "$current_version"
}

# Update version manifest with new version
update_version_manifest() {
    local new_version="$1"
    local commit_hash="$2"
    local commit_message="$3"
    local github_repo_url="$4"
    
    local timestamp=$(date +%s)
    local commit_url=""
    
    # Build commit URL if GitHub repo is available
    if [[ -n "$github_repo_url" ]]; then
        commit_url="$github_repo_url/commit/$commit_hash"
    fi
    
    log_info "Updating version manifest with version $new_version"
    
    # Clean commit message: remove control characters, limit length, and escape for JSON
    local clean_message
    clean_message=$(echo "$commit_message" | tr -d '\r\n\t' | head -c 500)
    
    # Create temporary file for jq operations
    local temp_file
    temp_file=$(mktemp)
    
    # Use jq to safely construct the new entry and update the manifest
    # This avoids JSON injection issues by using jq's argument passing
    jq --arg version "$new_version" \
       --arg commit_hash "$commit_hash" \
       --arg timestamp "$timestamp" \
       --arg description "$clean_message" \
       --arg commit_url "$commit_url" \
       '.versions = [{
         "version": $version,
         "commitHash": $commit_hash,
         "timestamp": ($timestamp | tonumber),
         "description": $description,
         "commitUrl": $commit_url
       }] + .versions | .versions = .versions[:20] | .current = $version | .lastUpdated = ($timestamp | tonumber)' \
       "$MANIFEST_FILE" > "$temp_file"
    
    # Replace original file
    mv "$temp_file" "$MANIFEST_FILE"
    
    log_success "Version manifest updated successfully"
}

# Main increment function
increment_and_update() {
    local commit_hash="$1"
    local commit_message="$2"
    
    log_info "Processing version increment for commit: $commit_hash"
    log_info "Commit message: $commit_message"
    
    # Get current version
    local current_version
    current_version=$(get_current_version)
    log_info "Current version: $current_version"
    
    # Determine increment type
    local increment_type
    increment_type=$(get_version_increment "$commit_message")
    log_info "Increment type: $increment_type"
    
    # Calculate new version
    local new_version
    new_version=$(increment_version "$current_version" "$increment_type")
    log_info "New version: $new_version"
    
    # Get GitHub repo URL
    local github_repo_url
    github_repo_url=$(get_github_repo_url)
    
    # Update manifest
    update_version_manifest "$new_version" "$commit_hash" "$commit_message" "$github_repo_url"
    
    log_success "Version incremented from $current_version to $new_version"
    
    # Output the new version for use in CI/CD
    echo "NEW_VERSION=$new_version" >> "$GITHUB_OUTPUT" 2>/dev/null || true
    echo "$new_version"
}

# Display help
show_help() {
    cat << EOF
Version Increment Script for CI/CD Pipeline

Usage: $0 [OPTIONS] <commit_hash> <commit_message>

This script increments the version based on conventional commit messages
and updates the version manifest file for deployment tracking.

ARGUMENTS:
    commit_hash     The full Git commit SHA
    commit_message  The commit message to analyze

OPTIONS:
    -h, --help      Show this help message
    --current       Show current version without incrementing
    --validate      Validate manifest file integrity

EXAMPLES:
    $0 abc123def "feat: add new feature"     # Minor version increment
    $0 def456ghi "fix: resolve bug"          # Patch version increment
    $0 ghi789jkl "BREAKING: major change"   # Major version increment
    $0 --current                             # Show current version
    $0 --validate                            # Validate manifest

CONVENTIONAL COMMIT TYPES:
    feat:       Minor version increment (new feature)
    fix:        Patch version increment (bug fix)
    docs:       Patch version increment (documentation)
    style:      Patch version increment (formatting)
    refactor:   Patch version increment (code refactoring)
    perf:       Patch version increment (performance improvement)
    test:       Patch version increment (tests)
    chore:      Patch version increment (maintenance)
    ci:         Patch version increment (CI/CD)
    build:      Patch version increment (build system)
    BREAKING:   Major version increment (breaking changes)

CI/CD INTEGRATION:
    This script sets the NEW_VERSION environment variable in GitHub Actions
    output for use in subsequent workflow steps.

    Example GitHub Actions usage:
    - name: Increment version
      id: version
      run: ./scripts/version-increment.sh \${{ github.sha }} "\${{ github.event.head_commit.message }}"
    
    - name: Use new version
      run: echo "Deployed version: \${{ steps.version.outputs.NEW_VERSION }}"

EOF
}

# Main function
main() {
    local show_current=false
    local validate_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --current)
                show_current=true
                shift
                ;;
            --validate)
                validate_only=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                break
                ;;
        esac
    done
    
    # Check for required tools
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq to continue."
        exit 1
    fi
    
    # Validate environment
    check_git_repository
    
    # Handle special flags
    if [[ "$show_current" == "true" ]]; then
        local current_version
        current_version=$(get_current_version)
        echo "$current_version"
        exit 0
    fi
    
    if [[ "$validate_only" == "true" ]]; then
        if [[ ! -f "$MANIFEST_FILE" ]]; then
            log_error "Version manifest not found: $MANIFEST_FILE"
            exit 1
        fi
        
        log_info "Validating version manifest..."
        
        # Check if it's valid JSON
        if ! jq empty "$MANIFEST_FILE" 2>/dev/null; then
            log_error "Manifest file contains invalid JSON"
            exit 1
        fi
        
        # Check required fields
        local current_version
        current_version=$(jq -r '.current // empty' "$MANIFEST_FILE")
        if [[ -z "$current_version" ]]; then
            log_error "Manifest missing 'current' field"
            exit 1
        fi
        
        local versions_count
        versions_count=$(jq '.versions | length' "$MANIFEST_FILE")
        if [[ "$versions_count" -eq 0 ]]; then
            log_error "Manifest has no versions"
            exit 1
        fi
        
        log_success "Manifest validation passed"
        log_info "Current version: $current_version"
        log_info "Total versions: $versions_count"
        exit 0
    fi
    
    # Require commit hash and message for increment operation
    if [[ $# -lt 2 ]]; then
        log_error "Commit hash and commit message are required"
        show_help
        exit 1
    fi
    
    local commit_hash="$1"
    local commit_message="$2"
    
    # Validate commit hash format (basic check)
    if [[ ! $commit_hash =~ ^[a-f0-9]{40}$ ]]; then
        log_warning "Commit hash doesn't look like a full SHA (expected 40 hex characters)"
        log_warning "Proceeding anyway, but this might indicate an issue"
    fi
    
    # Perform the version increment
    increment_and_update "$commit_hash" "$commit_message"
}

# Run main function with all arguments
main "$@"