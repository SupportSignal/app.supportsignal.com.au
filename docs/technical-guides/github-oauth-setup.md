# GitHub OAuth Setup Guide

## Overview

This guide provides step-by-step instructions for configuring GitHub OAuth to work with all development environments as defined in the port management strategy.

## Required GitHub OAuth App Configuration

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in the application details:

```
Application name: Your App Name (Dev)
Homepage URL: http://localhost:3000
Application description: Development OAuth app for [your project]
```

### 2. Configure Authorization Callback URLs

**CRITICAL**: GitHub OAuth app must include ALL these redirect URIs:

```
http://localhost:3000/auth/github/callback
http://localhost:3100/auth/github/callback
https://your-staging-domain.com/auth/github/callback
https://your-production-domain.com/auth/github/callback
```

**Why Multiple URLs?**
- `localhost:3000` - Human development environment
- `localhost:3100` - AI development environment  
- Staging/Production - Deployed environments

### 3. Get OAuth Credentials

After creating the app:
1. Copy the **Client ID**
2. Generate and copy the **Client Secret**

## Environment Configuration

**IMPORTANT**: This project uses a centralized environment management system with `.env.source-of-truth.local` files.

### Update Environment Source File

Edit your `.env.source-of-truth.local` file and add your GitHub OAuth credentials:

```bash
# Find the GitHub OAuth section and update:
| false  | true   | GitHub OAuth      | GITHUB_CLIENT_ID          | your_actual_client_id_here     |
| false  | true   | GitHub OAuth      | GITHUB_CLIENT_SECRET      | your_actual_client_secret_here |
| false  | true   | Authentication    | OAUTH_SECRET              | generate_random_secret_here    |
```

### Sync Environment Variables

After updating the source file:

```bash
# Sync environment variables to all required files
bun run sync-env

# Restart development servers to pick up new variables
bun dev
```

**What this does**:
- Updates `apps/web/.env.local` with Next.js variables
- Updates `apps/convex/.env.local` with Convex variables  
- Maintains consistency across all environments
- Supports both development ports (3000 and 3100)

## Development Workflow

### Human Development (Port 3000)

```bash
# Ensure environment is configured
cat apps/web/.env.local | grep GITHUB

# Start development server
PORT=3000 bun dev

# Access at: http://localhost:3000
# GitHub OAuth will redirect to: http://localhost:3000/auth/github/callback
```

### AI Development (Port 3100)  

```bash
# Start AI development server
PORT=3100 bun dev

# Access at: http://localhost:3100  
# GitHub OAuth will redirect to: http://localhost:3100/auth/github/callback
```

### Multi-Environment Development

Both environments can run simultaneously since both redirect URIs are configured in your GitHub OAuth app and the centralized environment system handles port-specific configuration automatically.

## Verification Steps

### 1. Test Human Development Environment

```bash
# Start human dev server
PORT=3000 bun dev

# Navigate to: http://localhost:3000/login
# Click "Continue with GitHub"
# Should redirect to GitHub, then back to localhost:3000
```

### 2. Test AI Development Environment

```bash
# Start AI dev server  
PORT=3100 bun dev

# Navigate to: http://localhost:3100/login
# Click "Continue with GitHub" 
# Should redirect to GitHub, then back to localhost:3100
```

### 3. Verify Callback URLs

Check that your GitHub OAuth app includes:
- ✅ `http://localhost:3000/auth/github/callback`
- ✅ `http://localhost:3100/auth/github/callback`

## Production Deployment

### Staging Environment

1. Add staging redirect URI to GitHub OAuth app:
   ```
   https://your-staging-domain.com/auth/github/callback
   ```

2. Set staging environment variables:
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-staging-domain.com
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### Production Environment

1. **Option A**: Use same GitHub OAuth app
   - Add production redirect URI
   - Use same credentials

2. **Option B**: Create separate production OAuth app
   - Create new OAuth app for production
   - Use separate credentials
   - Better security isolation

## Security Considerations

### Environment Separation

- **Development**: Use localhost redirect URIs
- **Staging**: Use staging domain redirect URIs  
- **Production**: Use production domain redirect URIs

### Secret Management

- **Never commit** `.env.local` or `.env.ai` files
- **Use secure secret generation** for `OAUTH_SECRET`
- **Use different secrets** for production vs development

### OAuth App Security

- **Limit redirect URIs** to only necessary domains
- **Use HTTPS** for all production redirect URIs
- **Consider separate OAuth apps** for development vs production

## Troubleshooting

### Common Issues

**Error: "redirect_uri_mismatch"**
- Check that the exact redirect URI is configured in GitHub OAuth app
- Verify `NEXT_PUBLIC_APP_URL` matches the port you're running on

**Error: "Invalid client_id"**
- Check that `GITHUB_CLIENT_ID` is correctly set
- Verify the OAuth app exists and is active

**Error: "Invalid client_secret"** 
- Check that `GITHUB_CLIENT_SECRET` is correctly set
- Regenerate client secret if needed

### Debug Steps

1. **Check environment variables**:
   ```bash
   # Verify variables are set
   cat apps/web/.env.local | grep GITHUB
   
   # Check source file
   cat .env.source-of-truth.local | grep "GitHub OAuth"
   ```

2. **Verify OAuth app configuration**:
   - Go to GitHub OAuth app settings
   - Check all redirect URIs are present
   - Confirm client ID matches environment variable

3. **Test callback URL manually**:
   ```bash
   curl http://localhost:3000/auth/github/callback
   # Should return the callback page (not 404)
   ```

## Related Documentation

- **[Google OAuth Setup](./google-oauth-setup.md)** - Similar setup for Google authentication
- **[Environment Sync Workflow](./environment-sync-workflow.md)** - Environment variable management
- **[New Repository Setup Guide](../new-repository-setup-guide.md)** - Complete setup process
- **[Development Guide](../development-guide.md)** - Development workflow and port management

## External Resources

- **[GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)** - Official GitHub OAuth guide