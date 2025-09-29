# Configuration Management Protocols

**Purpose**: Prevent hardcoded configuration values and maintain consistency across environment management systems.

**Origin**: Lessons learned from LLM testing implementation (2025-08-20)

## Core Principle

> **NEVER hardcode production values in source code. ALWAYS use the established environment configuration system.**

## The Environment Configuration System

### Architecture Overview

```
~/.env-configs/[project].env  ←  Source of Truth
            ↓
    scripts/sync-env.js       ←  Deployment Tool  
            ↓
├── apps/web/.env.local       ←  Next.js Environment
├── apps/convex/.env.local    ←  Convex Local Environment  
└── Convex Cloud Deployment   ←  Production Environment
```

### Configuration Flow

1. **Single Source of Truth**: `~/.env-configs/app.supportsignal.com.au.env`
2. **Deployment Tool**: `scripts/sync-env.js --mode=local` (local) or `--mode=deploy-dev` (deployment)
3. **Application Consumption**: `config.ts` reads from environment variables

## Protocols

### 1. Adding New Configuration

**Process**:
```bash
# 1. Update the source of truth
vim ~/.env-configs/app.supportsignal.com.au.env

# 2. Add new configuration line
| CONVEX | My Feature | NEW_CONFIG_KEY | development_value | production_value |

# 3. Deploy to local environment files
cd /path/to/project
bun run sync-env

# 4. Use in code via getEnvVar()
const newConfig = getEnvVar('NEW_CONFIG_KEY', true);
```

**Never Do This**:
```typescript
// ❌ WRONG - Hardcoded values
const apiKey = 'sk-hardcoded-key-12345';
const modelName = 'openai/gpt-4o-mini';
const endpoint = 'https://api.example.com';
```

**Always Do This**:
```typescript  
// ✅ CORRECT - Environment-driven
const apiKey = getEnvVar('API_KEY', true);
const modelName = getEnvVar('MODEL_NAME', true); 
const endpoint = getEnvVar('API_ENDPOINT', true);
```

### 2. Changing Existing Configuration

**Process**:
```bash
# 1. Update source of truth
vim ~/.env-configs/app.supportsignal.com.au.env

# 2. Change the value(s)
| CONVEX | LLM Config | LLM_MODEL | openai/gpt-4o-mini | openai/gpt-4o-mini |

# 3. Deploy changes to local files
bun run sync-env

# 4. Verify in application
# (Configuration automatically picks up new values)
```

**Never Do This**:
```typescript
// ❌ WRONG - "Quick fix" hardcoding
const defaultModel = 'openai/gpt-4o-mini'; // FORCE working model
```

### 3. Environment-Specific Values  

**Pattern**: Use DEV_VALUE and PROD_VALUE columns in configuration file.

**Example**:
```
| TARGET | GROUP | KEY | DEV_VALUE | PROD_VALUE |
|--------|-------|-----|-----------|------------|
| CONVEX | LLM   | LLM_MODEL | openai/gpt-4o-mini | openai/gpt-5 |
| CONVEX | LLM   | API_ENDPOINT | https://api.dev.example.com | https://api.example.com |
```

**Deployment**:
```bash
# Local development files (always dev values)
bun run sync-env

# Deploy to dev Convex deployment
bun run sync-env:deploy-dev

# Production deployment (manual only)
# Use: bunx convex env set --prod VARIABLE value
```

### 4. AI Model Configuration Changes

**Process**:
```bash
# 1. Update environment configuration
vim ~/.env-configs/app.supportsignal.com.au.env

# 2. Deploy configuration to local files
bun run sync-env

# 3. MANDATORY: Validate model actually works
bunx convex run llmTest:llmSpeedTest

# 4. Verify actual content generation (not just success status)
# Look for: "response_content": "actual text here" (not empty string)
```

**Content Validation Checklist**:
- [ ] Model responds within acceptable time (<5 seconds)
- [ ] Model returns actual content (not empty string)
- [ ] Content matches expected format for use case
- [ ] Model handles typical prompt complexity
- [ ] Both primary and fallback models work independently

**Never Do This**:
```bash
# ❌ WRONG - Deploy AI model changes without validation
bun run sync-env
# Deploy to production without testing actual content generation
```

**Always Do This**:
```bash
# ✅ CORRECT - Validate AI models produce actual content
bun run sync-env
bunx convex run llmTest:llmSpeedTest
# Check output: response_content should contain actual text, not ""
# Test both primary and fallback models independently
```

## Anti-Patterns to Avoid

### 1. Hardcoded "Quick Fixes"

**Problem**:
```typescript
// ❌ Common anti-pattern
const defaultModel = getEnvVar('LLM_MODEL', false, 'openai/gpt-4o-mini'); // WRONG!

// ❌ Even worse
const defaultModel = 'openai/gpt-4o-mini'; // Emergency fix - TODO: make configurable
```

**Solution**:
```typescript
// ✅ Correct approach
const defaultModel = getEnvVar('LLM_MODEL', true); // Required - no fallback
```

**If you need a fallback value**, add it to the environment configuration file, not source code.

### 2. Inconsistent Configuration Sources

**Problem**:
- Some values in environment files
- Some values hardcoded in source
- Some values in database
- Some values in external config files

**Solution**: 
- **One source of truth**: Environment configuration system
- **Clear ownership**: Each config value has a single authoritative source
- **Consistent access**: All config values use `getEnvVar()` pattern

### 3. Environment-Specific Code Branches

**Problem**:
```typescript
// ❌ Environment-specific logic in code
if (process.env.NODE_ENV === 'development') {
  apiEndpoint = 'http://localhost:3000';
} else {
  apiEndpoint = 'https://api.production.com';
}
```

**Solution**:
```typescript
// ✅ Configuration-driven
const apiEndpoint = getEnvVar('API_ENDPOINT', true);
```

With configuration:
```
| CONVEX | API Config | API_ENDPOINT | http://localhost:3000 | https://api.production.com |
```

## Configuration Types

### Required Configuration
```typescript
const apiKey = getEnvVar('API_KEY', true); // Will throw error if missing
```

### Optional Configuration  
```typescript
const debugMode = getEnvVar('DEBUG_MODE', false); // Returns empty string if missing
```

### Configuration with Validation
```typescript
const config = getConfig(); // Uses validateConfig() for comprehensive checks
```

## Testing Configuration

### Development Testing
```bash
# Test configuration locally
bun dev

# Verify configuration loading
curl http://localhost:3200/dev # Check configuration display
```

### Configuration Validation
```typescript
// Built into getConfig()
export function validateConfig(config: AppConfig): void {
  // Validates all required configurations
  // Warns about missing optional configurations  
  // Checks configuration value formats
}
```

## Deployment Checklist

Before deploying configuration changes:

- [ ] Updated source of truth (`~/.env-configs/[project].env`)
- [ ] Ran `bun run sync-env` (for local files)
- [ ] Verified application startup with new configuration
- [ ] Tested affected functionality
- [ ] Documented reason for configuration change
- [ ] Reviewed that no hardcoded values remain in source code

## Emergency Procedures

### When Configuration is Broken

1. **Check environment sync status**:
   ```bash
   bun run sync-env --dry-run
   ```

2. **Restore from backup**:
   ```bash
   # Backups are automatically created
   ls ~/.env-configs/backups/app.supportsignal.com.au/
   ```

3. **Manual environment variable setting** (temporary):
   ```bash
   # Only for emergency situations
   bunx convex env set VARIABLE_NAME "temporary_value"
   ```

4. **Fix source of truth and re-deploy**:
   ```bash
   # Fix the configuration file
   vim ~/.env-configs/app.supportsignal.com.au.env

   # Re-deploy properly
   bun run sync-env
   ```

## Code Review Guidelines

When reviewing code, specifically check for:

- [ ] No hardcoded API keys, endpoints, or model names
- [ ] All configuration values use `getEnvVar()` pattern
- [ ] New configuration added to environment config file
- [ ] Configuration changes documented in PR description
- [ ] No temporary "TODO: make configurable" comments

## Related Documentation

- [Environment Sync Script Documentation](../scripts/sync-env-documentation.md)
- [Configuration Loading Architecture](../architecture/configuration-loading.md)
- [Deployment Environment Management](../deployment/environment-management.md)

---
**Last Updated**: 2025-08-20  
**Next Review**: 2025-09-20  
**Owner**: DevOps Team