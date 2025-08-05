#!/bin/bash

# Bootstrap Version History Script
# Analyzes existing commit history using conventional commit patterns
# Generates semantic versions for historical commits and creates/updates version manifest
# Repository-agnostic and designed for template reuse

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$SCRIPT_DIR/version-config.json"
MANIFEST_FILE="$PROJECT_ROOT/apps/web/public/version-manifest.json"
DEFAULT_DEPTH=50
DEFAULT_STARTING_VERSION="0.1.0"

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
    log_info "Git repository detected"
}

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log_info "Loading configuration from $CONFIG_FILE"
        DEPTH=$(jq -r '.depth // empty' "$CONFIG_FILE" 2>/dev/null || echo "")
        STARTING_VERSION=$(jq -r '.startingVersion // empty' "$CONFIG_FILE" 2>/dev/null || echo "")
    fi
    
    # Use defaults if not configured
    DEPTH=${DEPTH:-$DEFAULT_DEPTH}
    STARTING_VERSION=${STARTING_VERSION:-$DEFAULT_STARTING_VERSION}
    
    log_info "Configuration: depth=$DEPTH, startingVersion=$STARTING_VERSION"
}

# Create default configuration file if it doesn't exist
create_default_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_info "Creating default configuration file"
        cat > "$CONFIG_FILE" << EOF
{
  "depth": $DEFAULT_DEPTH,
  "startingVersion": "$DEFAULT_STARTING_VERSION",
  "description": "Version bootstrap configuration - customize depth and starting version as needed"
}
EOF
        log_success "Created configuration file: $CONFIG_FILE"
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

# Generate version manifest from git history
generate_version_manifest() {
    log_info "Analyzing git history (depth: $DEPTH)"
    
    local github_repo_url
    github_repo_url=$(get_github_repo_url)
    
    # Get commits in reverse chronological order (oldest first for version calculation)
    local commits
    commits=$(git log --oneline --no-merges -n "$DEPTH" --reverse --format="%H|%s|%ct")
    
    if [[ -z "$commits" ]]; then
        log_error "No commits found in repository"
        exit 1
    fi
    
    local current_version="$STARTING_VERSION"
    local versions=()
    local commit_count=0
    
    log_info "Processing commits and calculating versions..."
    
    while IFS='|' read -r commit_hash commit_message timestamp; do
        [[ -z "$commit_hash" ]] && continue
        
        commit_count=$((commit_count + 1))
        
        # Get version increment for this commit
        local increment_type
        increment_type=$(get_version_increment "$commit_message")
        
        # Increment version (except for the first commit which uses starting version)
        if [[ $commit_count -gt 1 ]]; then
            current_version=$(increment_version "$current_version" "$increment_type")
        fi
        
        # Build commit URL if GitHub repo is available
        local commit_url=""
        if [[ -n "$github_repo_url" ]]; then
            commit_url="$github_repo_url/commit/$commit_hash"
        fi
        
        # Add to versions array (store as JSON objects)
        local version_entry
        version_entry=$(cat << EOF
{
  "version": "$current_version",
  "commitHash": "$commit_hash",
  "timestamp": $timestamp,
  "description": "$commit_message",
  "commitUrl": "$commit_url"
}
EOF
)
        versions+=("$version_entry")
        
        log_info "  v$current_version ($increment_type) - $commit_message"
        
    done <<< "$commits"
    
    log_success "Processed $commit_count commits"
    
    # Get the latest (current) version
    local latest_version="$current_version"
    local now=$(date +%s)
    
    # Create manifest directory if it doesn't exist
    mkdir -p "$(dirname "$MANIFEST_FILE")"
    
    # Build JSON manifest
    log_info "Generating version manifest..."
    
    # Convert versions array to JSON array
    local versions_json="["
    local first=true
    for version_entry in "${versions[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            versions_json+=","
        fi
        versions_json+="$version_entry"
    done
    versions_json+="]"
    
    # Create complete manifest
    cat > "$MANIFEST_FILE" << EOF
{
  "versions": $versions_json,
  "current": "$latest_version",
  "lastUpdated": $now
}
EOF
    
    log_success "Version manifest created: $MANIFEST_FILE"
    log_success "Latest version: $latest_version"
    log_info "Total versions in manifest: ${#versions[@]}"
}

# Validate manifest file
validate_manifest() {
    if [[ ! -f "$MANIFEST_FILE" ]]; then
        log_error "Manifest file not found: $MANIFEST_FILE"
        exit 1
    fi
    
    log_info "Validating manifest file..."
    
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
}

# Display help
show_help() {
    cat << EOF
Bootstrap Version History Script

Usage: $0 [OPTIONS]

This script analyzes existing git commit history using conventional commit patterns,
generates semantic versions for historical commits, and creates/updates the version manifest.

OPTIONS:
    -h, --help      Show this help message
    -d, --depth     Number of commits to analyze (default: $DEFAULT_DEPTH)
    -s, --start     Starting version (default: $DEFAULT_STARTING_VERSION)
    -c, --config    Path to configuration file (default: $CONFIG_FILE)
    -v, --validate  Validate existing manifest without regenerating
    --dry-run       Show what would be done without making changes

EXAMPLES:
    $0                          # Use default settings
    $0 --depth 100              # Analyze last 100 commits
    $0 --start "1.0.0"          # Start from version 1.0.0
    $0 --validate               # Only validate existing manifest
    $0 --dry-run                # Preview without making changes

CONFIGURATION:
    Create $CONFIG_FILE to customize default settings:
    {
      "depth": 50,
      "startingVersion": "0.1.0"
    }

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

OUTPUT:
    Version manifest will be created at:
    $MANIFEST_FILE

EOF
}

# Main function
main() {
    local depth_override=""
    local start_override=""
    local config_override=""
    local validate_only=false
    local dry_run=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--depth)
                depth_override="$2"
                shift 2
                ;;
            -s|--start)
                start_override="$2"
                shift 2
                ;;
            -c|--config)
                config_override="$2"
                shift 2
                ;;
            -v|--validate)
                validate_only=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Override config file path if specified
    if [[ -n "$config_override" ]]; then
        CONFIG_FILE="$config_override"
    fi
    
    log_info "Bootstrap Version History Script Starting..."
    log_info "Project root: $PROJECT_ROOT"
    
    # Validate environment
    check_git_repository
    
    # Check for required tools
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed. Please install jq to continue."
        exit 1
    fi
    
    # If validate only, just validate and exit
    if [[ "$validate_only" == "true" ]]; then
        validate_manifest
        exit 0
    fi
    
    # Create default config if needed
    create_default_config
    
    # Load configuration
    load_config
    
    # Override with command line arguments
    if [[ -n "$depth_override" ]]; then
        DEPTH="$depth_override"
        log_info "Depth overridden to: $DEPTH"
    fi
    
    if [[ -n "$start_override" ]]; then
        STARTING_VERSION="$start_override"
        log_info "Starting version overridden to: $STARTING_VERSION"
    fi
    
    # Dry run mode
    if [[ "$dry_run" == "true" ]]; then
        log_info "DRY RUN MODE - No files will be modified"
        log_info "Would analyze last $DEPTH commits starting from version $STARTING_VERSION"
        log_info "Would create manifest at: $MANIFEST_FILE"
        exit 0
    fi
    
    # Generate the version manifest
    generate_version_manifest
    
    # Validate the generated manifest
    validate_manifest
    
    log_success "Bootstrap version history completed successfully!"
    log_info "Next steps:"
    log_info "  1. Review the generated manifest: $MANIFEST_FILE"
    log_info "  2. Customize version-config.json if needed"
    log_info "  3. Integrate with CI/CD pipeline for automatic updates"
}

# Run main function with all arguments
main "$@"