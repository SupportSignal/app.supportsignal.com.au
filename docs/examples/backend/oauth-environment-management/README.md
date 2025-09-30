# OAuth Environment Management Examples

## Overview

This directory contains practical examples for managing OAuth applications across development and production environments, extracted from **Story 8.3: OAuth Production Application Setup**.

## Key Principles

1. **Single OAuth Application Strategy**: Use the same OAuth client ID across environments with multiple authorized callback URLs
2. **Centralized URL Generation**: Generate callback URLs dynamically based on environment configuration
3. **Environment Variable Isolation**: Separate client secrets per environment while sharing client IDs
4. **Comprehensive Testing**: Validate OAuth URL generation and authentication workflows across environments

## Examples

### 1. OAuth URL Generation (`urlConfig.ts`)

Environment-aware OAuth callback URL generation with validation:

```typescript
/**
 * Generate OAuth callback URL for authentication providers
 */
export function generateOAuthCallbackUrl(provider: 'github' | 'google'): string {
  if (!provider || !['github', 'google'].includes(provider)) {
    throw new Error('Provider must be either "github" or "google"');
  }

  const config = getUrlConfig();
  return `${config.baseUrl}/auth/${provider}/callback`;
}

/**
 * Environment configuration loading with fallbacks
 */
export function loadUrlConfig(): UrlConfig {
  const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';

  // Environment-specific defaults
  const defaultBaseUrl = environment === 'production'
    ? 'https://app.supportsignal.com.au'
    : 'http://localhost:3200';

  // Get URLs from environment with test-environment accommodation
  const isTestEnvironment = environment === 'test' || process.env.CI === 'true';

  let baseUrl = getEnvVar(
    'NEXT_PUBLIC_APP_URL',
    !isTestEnvironment,
    isTestEnvironment ? 'http://localhost:3200' : undefined
  );

  if (!baseUrl && !isTestEnvironment) {
    baseUrl = defaultBaseUrl;
  }

  // Validate URLs only in non-test environments
  if (!isTestEnvironment) {
    validateUrl(baseUrl, 'Base URL (NEXT_PUBLIC_APP_URL)');
  }

  return {
    baseUrl,
    environment,
    workerUrl: process.env.NEXT_PUBLIC_LOG_WORKER_URL,
  };
}
```

**Key Features**:
- Environment detection with graceful test handling
- URL validation using native URL constructor
- Trailing slash prevention for consistent concatenation
- Centralized configuration caching

### 2. OAuth Provider Configuration

OAuth application setup pattern for GitHub and Google:

```typescript
// OAuth application configurations
const OAUTH_CONFIGURATIONS = {
  github: {
    // Production and development use same client ID
    clientId: 'Ov23liMO6dymiqZKmiBS',

    // Multiple authorized callback URLs in OAuth app settings
    authorizedCallbacks: [
      'http://localhost:3200/auth/github/callback',      // Development
      'https://app.supportsignal.com.au/auth/github/callback'  // Production
    ],

    // Environment-specific client secrets (stored separately)
    clientSecret: {
      development: process.env.GITHUB_CLIENT_SECRET_DEV,
      production: process.env.GITHUB_CLIENT_SECRET_PROD
    }
  },

  google: {
    clientId: '524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com',

    authorizedRedirectUris: [
      'http://localhost:3200/auth/google/callback',      // Development
      'https://app.supportsignal.com.au/auth/google/callback'  // Production
    ],

    authorizedOrigins: [
      'http://localhost:3200',                           // Development
      'https://app.supportsignal.com.au'                // Production
    ],

    clientSecret: {
      development: process.env.GOOGLE_CLIENT_SECRET_DEV,
      production: process.env.GOOGLE_CLIENT_SECRET_PROD
    }
  }
};
```

### 3. Environment Variable Deployment

Environment variable management pattern using centralized configuration:

```bash
# Development environment variables (local .env.local)
NEXT_PUBLIC_APP_URL=http://localhost:3200
GITHUB_CLIENT_ID=Ov23liMO6dymiqZKmiBS
GITHUB_CLIENT_SECRET=ghs_development_secret_here
GOOGLE_CLIENT_ID=524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-development_secret_here

# Production deployment commands
bunx convex env set NEXT_PUBLIC_APP_URL https://app.supportsignal.com.au --prod
bunx convex env set GITHUB_CLIENT_ID Ov23liMO6dymiqZKmiBS --prod
bunx convex env set GITHUB_CLIENT_SECRET ghs_production_secret_here --prod
bunx convex env set GOOGLE_CLIENT_ID 524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com --prod
bunx convex env set GOOGLE_CLIENT_SECRET GOCSPX-production_secret_here --prod
```

### 4. Testing Patterns

#### Unit Tests for OAuth URL Generation

```typescript
/**
 * OAuth URL Generation Tests
 * Tests for Story 8.3: OAuth Production Application Setup
 */

describe('OAuth URL Generation for Story 8.3', () => {
  beforeEach(() => {
    resetUrlConfig();
  });

  describe('GitHub OAuth Callback URLs', () => {
    it('should generate production GitHub callback URL', () => {
      // Mock production environment
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const callbackUrl = generateOAuthCallbackUrl('github');

      expect(callbackUrl).toBe('https://app.supportsignal.com.au/auth/github/callback');
    });

    it('should generate development GitHub callback URL', () => {
      // Mock development environment
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';

      const callbackUrl = generateOAuthCallbackUrl('github');

      expect(callbackUrl).toBe('http://localhost:3200/auth/github/callback');
    });
  });

  describe('OAuth Provider Validation', () => {
    it('should throw error for invalid provider', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      expect(() => {
        generateOAuthCallbackUrl('invalid' as any);
      }).toThrow('Provider must be either "github" or "google"');
    });
  });

  describe('OAuth Callback URL Format Validation', () => {
    it('should generate valid URL format for production', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';

      const callbackUrl = generateOAuthCallbackUrl('github');

      // Should be valid URL
      expect(() => new URL(callbackUrl)).not.toThrow();

      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('app.supportsignal.com.au');
      expect(url.pathname).toBe('/auth/github/callback');
    });
  });
});
```

#### Integration Tests for Authentication Workflows

```typescript
/**
 * OAuth Authentication Workflow Integration Tests
 * Validates complete authentication workflows in both environments
 */

describe('OAuth Authentication Workflow Integration', () => {
  describe('Production Environment Authentication Workflow', () => {
    beforeEach(() => {
      // Mock production environment variables
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';
      process.env.GITHUB_CLIENT_ID = 'Ov23liMO6dymiqZKmiBS';
      process.env.GOOGLE_CLIENT_ID = '524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com';
    });

    it('should generate correct GitHub OAuth callback URL for production', () => {
      const callbackUrl = generateOAuthCallbackUrl('github');

      expect(callbackUrl).toBe('https://app.supportsignal.com.au/auth/github/callback');

      // Verify URL format matches GitHub OAuth app configuration
      const url = new URL(callbackUrl);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('app.supportsignal.com.au');
      expect(url.pathname).toBe('/auth/github/callback');
      expect(url.search).toBe(''); // No query parameters
    });
  });

  describe('Cross-Environment OAuth Configuration Validation', () => {
    it('should validate that same OAuth credentials work in both environments', () => {
      const githubClientId = 'Ov23liMO6dymiqZKmiBS';
      const googleClientId = '524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com';

      // Test production environment
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.supportsignal.com.au';
      process.env.GITHUB_CLIENT_ID = githubClientId;
      process.env.GOOGLE_CLIENT_ID = googleClientId;

      const prodGithubUrl = generateOAuthCallbackUrl('github');
      const prodGoogleUrl = generateOAuthCallbackUrl('google');

      expect(prodGithubUrl).toBe('https://app.supportsignal.com.au/auth/github/callback');
      expect(prodGoogleUrl).toBe('https://app.supportsignal.com.au/auth/google/callback');

      // Reset and test development environment
      resetUrlConfig();
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3200';
      process.env.GITHUB_CLIENT_ID = githubClientId;
      process.env.GOOGLE_CLIENT_ID = googleClientId;

      const devGithubUrl = generateOAuthCallbackUrl('github');
      const devGoogleUrl = generateOAuthCallbackUrl('google');

      expect(devGithubUrl).toBe('http://localhost:3200/auth/github/callback');
      expect(devGoogleUrl).toBe('http://localhost:3200/auth/google/callback');

      // Verify same OAuth credentials work with different callback URLs
      expect(process.env.GITHUB_CLIENT_ID).toBe(githubClientId);
      expect(process.env.GOOGLE_CLIENT_ID).toBe(googleClientId);
    });
  });
});
```

## Verification Commands

### Environment Variable Verification

```bash
# Check production environment variables
bunx convex env list --prod | grep -E "(GITHUB|GOOGLE)_CLIENT"

# Check development environment variables
bunx convex env list | grep -E "(GITHUB|GOOGLE)_CLIENT"

# Verify OAuth credentials are deployed
bunx convex env list --prod | grep -E "(GITHUB|GOOGLE|NEXT_PUBLIC_APP_URL)"
```

### Testing Commands

```bash
# Run OAuth URL generation tests
bun test tests/convex/lib/oauthUrlGeneration.test.ts

# Run authentication workflow tests
bun test tests/convex/integration/oauthAuthenticationWorkflow.test.ts

# Run all OAuth-related tests
bun test --testNamePattern="OAuth"
```

## Security Considerations

### Client Secret Management

1. **Environment Separation**: Client secrets are stored separately per environment in Convex environment variables
2. **Never Committed**: Client secrets never appear in version control
3. **Rotation Ready**: Secret rotation can be performed per environment without affecting other environments

### Callback URL Validation

1. **Strict Validation**: OAuth providers validate callback URLs against authorized list
2. **Protocol Enforcement**: HTTPS required in production, HTTP allowed in development
3. **Domain Restrictions**: Only authorized domains accepted by OAuth providers

### Environment Isolation

1. **Separate Deployments**: Production and development use separate Convex deployments
2. **No Credential Sharing**: Client secrets never shared between environments
3. **Independent Configuration**: Each environment maintains its own configuration state

## Rollback Procedures

### Emergency OAuth Rollback

If OAuth authentication fails in production:

```bash
# Immediate rollback of environment variables
bunx convex env set GITHUB_CLIENT_ID <previous_value> --prod
bunx convex env set GITHUB_CLIENT_SECRET <previous_value> --prod
bunx convex env set GOOGLE_CLIENT_ID <previous_value> --prod
bunx convex env set GOOGLE_CLIENT_SECRET <previous_value> --prod

# Verify rollback
bunx convex env list --prod | grep -E "(GITHUB|GOOGLE)"
```

### OAuth Provider Configuration Rollback

- **GitHub**: Update OAuth app callback URLs in GitHub Developer Settings
- **Google**: Update OAuth 2.0 redirect URIs in Google Cloud Console
- **Verification**: Test authentication flows after rollback

## Related Documentation

- [Story 8.3: OAuth Production Application Setup](../../../stories/8.3.story.md)
- [Story 8.2: Environment-Aware URL Configuration System](../../../stories/8.2.story.md)
- [OAuth Production Setup Guide](../../../technical-guides/oauth-production-setup.md)
- [Backend Patterns: OAuth Environment Separation](../../patterns/backend-patterns.md#oauth-production-environment-separation-pattern)