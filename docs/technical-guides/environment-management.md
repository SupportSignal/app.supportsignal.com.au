# Advanced Environment Management Workflow

## Overview

This guide documents the advanced environment variable synchronization system built around the `sync-env.js` script and `.env.source-of-truth.local` file. This system provides centralized environment management across Next.js, Convex, and deployment environments with validation, security checks, and automatic backup.

## Architecture

### Single Source of Truth Approach

```
.env.source-of-truth.local (Master)
           ↓
    scripts/sync-env.js
         ↙     ↘
apps/web/.env.local   apps/convex/.env.local
         ↓                    ↓
  Next.js Frontend    Convex Backend
                            ↓
                  Convex Deployment
```

**Benefits**:

- **Centralized Management**: All environment variables in one file
- **Automatic Distribution**: Script handles generating app-specific files
- **Validation**: Built-in security and consistency checks
- **Backup**: Automatic backup before changes
- **Documentation**: Human-readable table format

## Source File Format

### Table Structure

The `.env.source-of-truth.local` file uses a human-readable table format:

```
| NEXTJS | CONVEX | GROUP             | KEY                       | VALUE                                    |
|--------|--------|-------------------|---------------------------|------------------------------------------|
| true   | false  | Local Development | NEXT_PUBLIC_APP_URL       | http://localhost:3000                    |
| true   | false  | Local Development | PORT                      | 3000                                     |
| false  | true   | GitHub OAuth      | GITHUB_CLIENT_ID          | Ov23l-xxxxx-xxxxxx                      |
| false  | true   | GitHub OAuth      | GITHUB_CLIENT_SECRET      | 799ad-xxxxx-xxxxxx                      |
| true   | true   | Convex            | CONVEX_DEPLOYMENT         | dev:helpful-567                          |
| true   | true   | Convex            | NEXT_PUBLIC_CONVEX_URL    | https://helpful-567.convex.cloud         |
```

### Column Definitions

- **NEXTJS**: `true/false` - Include in Next.js environment file
- **CONVEX**: `true/false` - Include in Convex environment file
- **GROUP**: Descriptive category for organization
- **KEY**: Environment variable name
- **VALUE**: Environment variable value

### Groups Organization

Common groups used:

- `Local Development` - Development server configuration
- `GitHub OAuth` - GitHub authentication credentials
- `Google OAuth` - Google authentication credentials
- `OAuth` - General OAuth configuration
- `LLM Config` - AI/LLM API configuration
- `Convex` - Convex backend configuration

## Workflow Operations

### Daily Development Workflow

```bash
# 1. Edit the source file
nano .env.source-of-truth.local

# 2. Sync environment variables
bun run sync-env

# 3. Restart services to pick up changes
bun dev
```

### Initial Repository Setup

```bash
# 1. Copy the example file
cp .env.source-of-truth.example .env.source-of-truth.local

# 2. Fill in your actual values
nano .env.source-of-truth.local

# 3. Sync environment variables
bun run sync-env

# 4. Start development
bun dev
```

### Adding New Environment Variables

1. **Add to Source File**:

   ```bash
   # Add new row to .env.source-of-truth.local
   | false  | true   | New Service       | NEW_API_KEY               | your-actual-key-here                     |
   ```

2. **Sync Changes**:

   ```bash
   bun run sync-env
   ```

3. **Restart Services**:
   ```bash
   # Restart affected services
   bun dev
   ```

### Modifying Existing Variables

1. **Edit Source File**:

   ```bash
   # Update VALUE column in .env.source-of-truth.local
   | false  | true   | LLM Config        | LLM_MODEL                 | openai/gpt-4o                            |
   ```

2. **Sync with Dry Run** (recommended):

   ```bash
   bun run sync-env --dry-run
   ```

3. **Apply Changes**:
   ```bash
   bun run sync-env
   ```

## Script Commands & Options

### Basic Usage

```bash
# Standard sync (most common)
bun run sync-env

# Preview changes without applying
bun run sync-env --dry-run

# Verbose logging for debugging
bun run sync-env --verbose
```

### Advanced Usage

```bash
# Direct script execution with options
node ./scripts/sync-env.js --dry-run --verbose

# Target specific deployment
node ./scripts/sync-env.js --deployment=preview

# Full help
node ./scripts/sync-env.js --help
```

### Deployment Targeting

```bash
# Development deployment (default)
bun run sync-env --deployment=dev

# Preview deployment
bun run sync-env --deployment=preview

# Production (blocked for security)
# Use manual Convex commands for production
```

## Generated Files

### Next.js Environment File

**Location**: `apps/web/.env.local`

**Content Structure**:

```bash
# =============================================================================
# Next.js Environment Configuration
# =============================================================================
# Auto-generated from .env.source-of-truth.local - DO NOT EDIT MANUALLY
# Run 'bun run sync-env' to regenerate this file

# Local Development
# ------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=3000

# GitHub OAuth
# -------------
# ⚠️  PUBLIC: This variable is exposed to the browser
NEXT_PUBLIC_CONVEX_URL=https://helpful-567.convex.cloud
```

### Convex Environment File

**Location**: `apps/convex/.env.local`

**Content Structure**:

```bash
# =============================================================================
# Convex Backend Environment Configuration
# =============================================================================
# Auto-generated from .env.source-of-truth.local - DO NOT EDIT MANUALLY
# Run 'bun run sync-env' to regenerate this file

# GitHub OAuth
# -------------
GITHUB_CLIENT_ID=Ov23l-xxxxx-xxxxxx
GITHUB_CLIENT_SECRET=799ad-xxxxx-xxxxxx

# Convex
# ------
CONVEX_DEPLOYMENT=dev:helpful-567
NEXT_PUBLIC_CONVEX_URL=https://helpful-567.convex.cloud
```

### Backup Files

**Location**: `.env.backup.local`

**Purpose**: Automatic backup of Convex environment before changes

**Content**: Previous Convex environment state with timestamp

## Validation & Security

### Built-in Validations

1. **Empty Value Check**:
   - Warns about empty environment variables
   - Helps catch configuration mistakes

2. **Public Variable Security**:
   - Scans `NEXT_PUBLIC_` variables for sensitive data
   - Prevents accidental exposure of secrets

3. **Required Variable Check**:
   - Validates essential Convex variables
   - Ensures proper Next.js/Convex distribution

4. **Deployment Safety**:
   - Blocks production deployments for security
   - Requires manual production management

### Security Best Practices

```bash
# Never commit source file
echo ".env.source-of-truth.local" >> .gitignore

# Use secure secret generation
openssl rand -base64 32

# Rotate secrets regularly
# Update source file → sync → deploy
```

## Environment Synchronization

### Convex Deployment Sync

The script automatically syncs environment variables to your Convex deployment:

1. **Backup Current Environment**:
   - Creates timestamped backup
   - Stores in `.env.backup.local`

2. **Calculate Differences**:
   - Compares source vs current deployment
   - Shows what will be added/updated/removed

3. **Apply Changes**:
   - Adds new variables
   - Updates changed variables
   - Removes obsolete variables

4. **Verify Success**:
   - Double-checks applied changes
   - Reports any failures

### Sync Process Output

```bash
🚀 Starting advanced environment sync...
📖 Reading environment source file...
✅ Parsed 15 environment variables from source
🔧 Generating Next.js environment configuration...
✅ Next.js environment file generated: apps/web/.env.local
🔧 Generating Convex environment configuration...
✅ Convex environment file generated: apps/convex/.env.local
🔗 Syncing Convex deployment environment...
💾 Creating automatic backup of current environment...
✅ Environment backup saved to: .env.backup.local
🔍 Calculating environment differences...

📋 Environment Changes Summary:
==================================================

➕ Variables to ADD (2):
   • NEW_API_KEY = sk-xxxxx...
   • FEATURE_FLAG = true

🔄 Variables to UPDATE (1):
   • LLM_MODEL
     OLD: openai/gpt-4o-mini
     NEW: openai/gpt-4o

✅ All environment variables synchronized successfully!
```

## Troubleshooting

### Common Issues

**Error: "Source file not found"**

```bash
# Check if source file exists
ls -la .env.source-of-truth.local

# Copy from example if missing
cp .env.source-of-truth.example .env.source-of-truth.local
```

**Error: "Convex command failed"**

```bash
# Check Convex authentication
cd apps/convex && bunx convex dev

# Verify deployment exists
bunx convex env list
```

**Error: "Invalid table format"**

```bash
# Check table structure in source file
head -5 .env.source-of-truth.local

# Ensure proper pipe-delimited format
# | NEXTJS | CONVEX | GROUP | KEY | VALUE |
```

### Debug Steps

1. **Validate Source File Format**:

   ```bash
   # Check file structure
   cat .env.source-of-truth.local | head -10

   # Look for formatting issues
   grep -n "^[^|]" .env.source-of-truth.local
   ```

2. **Test Dry Run Mode**:

   ```bash
   # Preview without applying changes
   bun run sync-env --dry-run --verbose
   ```

3. **Check Generated Files**:

   ```bash
   # Verify Next.js file generated
   ls -la apps/web/.env.local

   # Check Convex file generated
   ls -la apps/convex/.env.local
   ```

4. **Verify Convex Sync**:
   ```bash
   # Check current Convex environment
   cd apps/convex && bunx convex env list
   ```

## Advanced Usage

### Custom Deployment Environments

```bash
# Sync to preview environment
bun run sync-env --deployment=preview

# Target specific branch deployment
bun run sync-env --deployment=feature-branch
```

### Batch Operations

```bash
# Multiple environment setup
for env in dev preview; do
  bun run sync-env --deployment=$env
done
```

### Integration with CI/CD

```bash
# In GitHub Actions (development only)
- name: Sync Environment
  run: bun run sync-env --deployment=dev

# Production requires manual management
# Never automate production environment sync
```

## Best Practices

### File Management

1. **Source File Security**:
   - Keep `.env.source-of-truth.local` secure
   - Never commit to version control
   - Back up separately from code

2. **Regular Maintenance**:
   - Clean up unused variables monthly
   - Rotate secrets quarterly
   - Review public variables for security

3. **Team Collaboration**:
   - Share source file format standards
   - Document variable purposes in GROUP column
   - Use descriptive variable names

### Development Workflow

1. **Environment Changes**:
   - Always edit source file first
   - Run dry-run to preview changes
   - Sync and restart services
   - Test application functionality

2. **New Team Members**:
   - Provide source file template
   - Document required external services
   - Include setup verification steps

3. **Production Deployment**:
   - Use manual Convex commands
   - Never sync production automatically
   - Maintain separate production source file

## Integration Examples

### Service Setup Integration

```bash
# After setting up OAuth services
# 1. Update source file with credentials
| false  | true   | GitHub OAuth      | GITHUB_CLIENT_ID          | your-client-id                           |
| false  | true   | GitHub OAuth      | GITHUB_CLIENT_SECRET      | your-client-secret                       |

# 2. Sync environment
bun run sync-env

# 3. Test authentication
bun dev
```

### API Key Configuration

```bash
# After obtaining LLM API keys
# 1. Add to source file
| false  | true   | LLM Config        | OPENROUTER_API_KEY        | sk-or-v1-xxxxx                           |

# 2. Sync and test
bun run sync-env
curl -H "Authorization: Bearer $(grep OPENROUTER apps/convex/.env.local | cut -d= -f2)" \
  "https://openrouter.ai/api/v1/models"
```

## Troubleshooting Environment Variables

### Issue: Environment Variables Show Wrong Values in Production

**Problem**: Production deployment shows localhost URLs or development values instead of production values.

**Common Symptoms**:

```javascript
// Production site showing:
{
  "NEXT_PUBLIC_APP_URL": "http://localhost:3000",
  "NEXT_PUBLIC_LOG_WORKER_URL": "http://localhost:8787"
}
```

**Root Causes & Solutions**:

#### 1. GitHub Repository Secrets Misconfigured

**Diagnosis**: GitHub Actions secrets exist but contain wrong values

**Solution**:

1. Go to GitHub Repository → Settings → Security → Secrets and variables → Actions
2. Check Repository secrets for production values:
   - `NEXT_PUBLIC_APP_URL` should be `https://your-site.pages.dev`
   - `NEXT_PUBLIC_LOG_WORKER_URL` should be `https://your-worker.workers.dev`
3. Update any secrets that contain localhost values

**Debug Method**: Add to CI workflow:

```yaml
- name: Debug Environment Variables
  run: |
    [ -n "${{ secrets.NEXT_PUBLIC_APP_URL }}" ] && echo "✅ SECRET exists" || echo "❌ SECRET missing"
    [ -n "$NEXT_PUBLIC_APP_URL" ] && echo "✅ ENV set (length: ${#NEXT_PUBLIC_APP_URL})" || echo "❌ ENV empty"
```

#### 2. Missing GitHub Repository Secrets

**Diagnosis**: Environment variables are undefined or empty in CI

**Solution**:

1. Create missing GitHub repository secrets
2. Ensure secret names match exactly what's used in CI workflow
3. Verify secrets are in Repository scope, not Environment scope

#### 3. CI Workflow Configuration Issues

**Diagnosis**: Secrets not properly injected into build environment

**Solution**: Verify CI workflow has proper env section:

```yaml
build:
  env:
    NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
    NEXT_PUBLIC_CONVEX_URL: ${{ secrets.NEXT_PUBLIC_CONVEX_URL }}
    NEXT_PUBLIC_LOG_WORKER_URL: ${{ secrets.NEXT_PUBLIC_LOG_WORKER_URL }}
```

### Debugging Strategies

#### 1. Local vs Production Comparison

```bash
# Local environment check
bun run sync-env
cat apps/web/.env.local | grep NEXT_PUBLIC

# Production environment check (via debug page)
# Create apps/web/app/debug-env/page.tsx for production verification
```

#### 2. CI Debug Logging

Add systematic environment variable logging to CI:

```yaml
- name: Environment Debug
  run: |
    echo "=== Secret Existence Check ==="
    [ -n "${{ secrets.NEXT_PUBLIC_APP_URL }}" ] && echo "✅ APP_URL secret exists" || echo "❌ missing"

    echo "=== Environment Variables ==="
    echo "APP_URL length: ${#NEXT_PUBLIC_APP_URL}"
    env | grep NEXT_PUBLIC || echo "No NEXT_PUBLIC vars found"
```

#### 3. String Length Analysis

Use string length to identify value source:

- `http://localhost:3000` = 21 characters (development)
- `https://your-site.pages.dev` = 30+ characters (production)

### Prevention Best Practices

1. **Create Debug Environment Page**:
   - Add `/debug-env` route to verify production environment variables
   - Only show in development or to authenticated users

2. **CI Validation**:
   - Add checks for localhost values in production builds
   - Fail build if production environment contains development URLs

3. **Documentation**:
   - Document expected environment variable values
   - Include character length references for validation

## Related Documentation

- **[Scripts and Commands Reference](./scripts-and-commands-reference.md)** - All available commands
- **[Google OAuth Setup](./google-oauth-setup.md)** - Service-specific setup
- **[LLM API Setup](./llm-api-setup.md)** - AI service configuration
- **[API Security and Secret Management](./api-security-and-secret-management.md)** - Security best practices

---

**Created**: For centralized environment management across monorepo  
**Security**: Follow source file security practices  
**Automation**: Integrates with development and deployment workflows