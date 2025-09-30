# OAuth Production Application Setup Guide

## Overview

This guide documents the OAuth application setup and configuration for SupportSignal production environment. This documentation was created as part of **Story 8.3: OAuth Production Application Setup**.

## OAuth Application Configurations

### GitHub OAuth Application

**Application Details:**
- **Application Name**: SupportSignal Production
- **Client ID**: `Ov23liMO6dymiqZKmiBS`
- **Homepage URL**: `https://app.supportsignal.com.au`
- **Authorization Callback URL**: `https://app.supportsignal.com.au/auth/github/callback`

**Environment Variables:**
- `GITHUB_CLIENT_ID`: `Ov23liMO6dymiqZKmiBS`
- `GITHUB_CLIENT_SECRET`: Configured in Convex production deployment

### Google OAuth Application

**Application Details:**
- **Application Name**: SupportSignal Production
- **Client ID**: `524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com`
- **Authorized JavaScript Origins**: `https://app.supportsignal.com.au`
- **Authorized Redirect URIs**: `https://app.supportsignal.com.au/auth/google/callback`

**Environment Variables:**
- `GOOGLE_CLIENT_ID`: `524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET`: Configured in Convex production deployment

## Environment Configuration

### Production Environment
- **Base URL**: `https://app.supportsignal.com.au`
- **Convex Deployment**: `prod:graceful-shrimp-355`
- **Convex URL**: `https://graceful-shrimp-355.convex.cloud`

### Development Environment
- **Base URL**: `http://localhost:3200`
- **Convex Deployment**: `dev:beaming-gull-639`
- **Convex URL**: `https://beaming-gull-639.convex.cloud`

## OAuth Callback URL Generation

The system uses centralized URL configuration from `apps/convex/lib/urlConfig.ts`:

```typescript
// Generate OAuth callback URLs
const githubCallback = generateOAuthCallbackUrl('github');
const googleCallback = generateOAuthCallbackUrl('google');

// Production URLs:
// https://app.supportsignal.com.au/auth/github/callback
// https://app.supportsignal.com.au/auth/google/callback

// Development URLs:
// http://localhost:3200/auth/github/callback
// http://localhost:3200/auth/google/callback
```

## Verification Procedures

### Environment Variable Verification

```bash
# Check production environment variables
bunx convex env list --prod

# Check development environment variables
bunx convex env list

# Verify OAuth credentials are deployed
bunx convex env list --prod | grep -E "(GITHUB|GOOGLE)_CLIENT"
```

### OAuth Callback URL Testing

```bash
# Run OAuth URL generation tests
bun test tests/convex/lib/oauthUrlGeneration.test.ts

# Run authentication workflow tests
bun test tests/convex/integration/oauthAuthenticationWorkflow.test.ts
```

## Rollback Procedures

### Emergency OAuth Rollback

If OAuth authentication fails in production:

1. **Immediate Action**:
   ```bash
   # Revert to previous environment variables (if available)
   bunx convex env set GITHUB_CLIENT_ID <previous_value> --prod
   bunx convex env set GITHUB_CLIENT_SECRET <previous_value> --prod
   bunx convex env set GOOGLE_CLIENT_ID <previous_value> --prod
   bunx convex env set GOOGLE_CLIENT_SECRET <previous_value> --prod
   ```

2. **OAuth Provider Configuration Rollback**:
   - **GitHub**: Update OAuth app callback URLs to previous working URLs
   - **Google**: Update OAuth 2.0 redirect URIs to previous working URLs

3. **Verification**:
   ```bash
   # Test authentication after rollback
   bunx convex env list --prod | grep -E "(GITHUB|GOOGLE|NEXT_PUBLIC_APP_URL)"
   ```

### Gradual Rollback Strategy

1. **Test in Development First**:
   - Apply changes to development environment
   - Run comprehensive test suite
   - Manual testing of authentication flows

2. **Production Deployment**:
   - Deploy during low-traffic periods
   - Monitor authentication success rates
   - Have rollback commands ready

3. **Monitoring**:
   - Watch authentication error rates
   - Monitor OAuth callback success
   - Check user login patterns

## Testing Strategy

### Automated Testing

**Unit Tests**: `tests/convex/lib/oauthUrlGeneration.test.ts`
- Tests OAuth callback URL generation
- Validates environment-specific URLs
- Tests provider validation

**Integration Tests**: `tests/convex/integration/oauthAuthenticationWorkflow.test.ts`
- Tests complete authentication workflows
- Validates cross-environment configuration
- Tests OAuth provider patterns

### Manual Testing

1. **Development Environment**:
   - Visit `http://localhost:3200`
   - Test GitHub OAuth login
   - Test Google OAuth login
   - Verify callback URLs

2. **Production Environment**:
   - Visit `https://app.supportsignal.com.au`
   - Test GitHub OAuth login
   - Test Google OAuth login
   - Verify production callbacks

## Security Considerations

### OAuth Application Security

1. **Client Secret Management**:
   - Client secrets stored only in Convex environment variables
   - Never committed to version control
   - Rotated periodically for security

2. **Callback URL Validation**:
   - Strict callback URL validation in OAuth providers
   - Only authorized domains allowed
   - HTTPS enforced in production

3. **Environment Separation**:
   - Separate OAuth applications for each environment
   - No credential sharing between environments
   - Environment-specific validation

## Troubleshooting

### Common Issues

**Callback URL Mismatch**:
- Verify OAuth provider callback URLs match generated URLs
- Check environment variable configuration
- Validate URL generation logic

**Environment Variable Issues**:
- Check Convex environment variable deployment
- Verify environment separation
- Test URL configuration loading

**Authentication Failures**:
- Check OAuth application status
- Verify client credentials
- Monitor authentication logs

### Debug Commands

```bash
# Check current environment configuration
bunx convex env list --prod

# Test URL generation
node -e "
const { generateOAuthCallbackUrl } = require('./apps/convex/lib/urlConfig');
console.log('GitHub:', generateOAuthCallbackUrl('github'));
console.log('Google:', generateOAuthCallbackUrl('google'));
"

# Run authentication tests
bun test tests/convex/lib/oauthUrlGeneration.test.ts --verbose
```

## Related Documentation

- [Story 8.3: OAuth Production Application Setup](../stories/8.3.story.md)
- [Story 8.2: Environment-Aware URL Configuration System](../stories/8.2.story.md)
- [Authentication Architecture](../architecture/security.md)
- [Environment Management Technical Guide](environment-management.md)

## Change History

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-09-30 | 1.0 | Initial OAuth production setup documentation | James (Dev Agent) |