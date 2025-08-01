# Google OAuth Setup Guide

## Overview

This guide provides step-by-step instructions for configuring Google OAuth to work with all development environments as defined in the port management strategy. This enables "Continue with Google" authentication in your application.

## Required Google OAuth App Configuration

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Fill in the project details:

```
Project name: Your App Name (Dev)
Organization: (Optional - your organization)
Location: (Optional - your organization)
```

4. Click **"Create"**

### 2. Enable Required APIs

1. In the Google Cloud Console, navigate to **"APIs & Services"** → **"Library"**
2. Search for and enable these APIs:
   - **"Google Identity Toolkit API"** - For authentication
   - **"People API"** - For user profile information
3. Click on each API and then **"Enable"**

**Note**: The Google+ API has been deprecated. We now use Google Identity APIs for OAuth authentication.

### 3. Configure OAuth Consent Screen

1. Navigate to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have Google Workspace)
3. Fill in the required information:

```
App name: Your App Name
User support email: your-email@example.com
Developer contact information: your-email@example.com
```

4. Add scopes (click **"Add or Remove Scopes"**):
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile` 
   - `openid`

   **Note**: Use full scope URLs for clarity and future compatibility.

5. Add test users (for development):
   - Add your development email addresses
   - Add any team member emails who need to test

6. Click **"Save and Continue"** through all steps

### 4. Create OAuth 2.0 Credentials

1. Navigate to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Choose **"Web application"**
4. Fill in the application details:

```
Name: Your App OAuth Client
```

### 5. Configure Authorized Redirect URIs

**CRITICAL**: Google OAuth client must include ALL these redirect URIs:

```
http://localhost:3000/auth/google/callback
http://localhost:3100/auth/google/callback
https://your-staging-domain.com/auth/google/callback
https://your-production-domain.com/auth/google/callback
```

**Why Multiple URLs?**
- `localhost:3000` - Human development environment
- `localhost:3100` - AI development environment  
- Staging/Production - Deployed environments

### 6. Get OAuth Credentials

After creating the client:
1. Copy the **Client ID**
2. Copy the **Client Secret**
3. Keep these secure - you'll add them to your environment configuration

## Environment Configuration

**IMPORTANT**: This project uses a centralized environment management system with `.env.source-of-truth.local` files.

### Update Environment Source File

Edit your `.env.source-of-truth.local` file:

```bash
# Find the Google OAuth section and update:
| false  | true   | Google OAuth      | GOOGLE_CLIENT_ID          | your_actual_google_client_id_here     |
| false  | true   | Google OAuth      | GOOGLE_CLIENT_SECRET      | your_actual_google_client_secret_here |
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
cat apps/web/.env.local | grep GOOGLE

# Start development server
PORT=3000 bun dev

# Access at: http://localhost:3000
# Google OAuth will redirect to: http://localhost:3000/auth/google/callback
```

### AI Development (Port 3100)  

```bash
# Start AI development server
PORT=3100 bun dev

# Access at: http://localhost:3100  
# Google OAuth will redirect to: http://localhost:3100/auth/google/callback
```

### Multi-Environment Development

Both environments can run simultaneously since both redirect URIs are configured in your Google OAuth client.

## Verification Steps

### 1. Test Human Development Environment

```bash
# Start human dev server
PORT=3000 bun dev

# Navigate to: http://localhost:3000/login
# Click "Continue with Google"
# Should redirect to Google, then back to localhost:3000
```

### 2. Test AI Development Environment

```bash
# Start AI dev server
PORT=3100 bun dev

# Navigate to: http://localhost:3100/login  
# Click "Continue with Google"
# Should redirect to Google, then back to localhost:3100
```

### 3. Verify OAuth Configuration

Check that your Google OAuth client includes:
- ✅ `http://localhost:3000/auth/google/callback`
- ✅ `http://localhost:3100/auth/google/callback`

### 4. Test Authentication Flow

1. Navigate to your login page
2. Click "Continue with Google"
3. Complete Google authentication
4. Verify you're redirected back to your application
5. Check that user profile information is available

## Production Deployment

### Staging Environment

1. Add staging redirect URI to Google OAuth client:
   ```
   https://your-staging-domain.com/auth/google/callback
   ```

2. Update your environment source file for staging deployment
3. Sync environment variables to staging

### Production Environment

1. **Option A**: Use same Google OAuth client
   - Add production redirect URI
   - Use same credentials
   - Simpler management

2. **Option B**: Create separate production OAuth client
   - Create new OAuth client for production
   - Use separate credentials  
   - Better security isolation
   - Recommended for high-security applications

**Production Setup Steps**:
1. Add production redirect URI: `https://your-domain.com/auth/google/callback`
2. Set production environment variables in your deployment platform
3. Test authentication flow in production environment

## Security Considerations

### OAuth Client Security

- **Limit redirect URIs** to only necessary domains
- **Use HTTPS** for all production redirect URIs
- **Review OAuth scopes** - only request what you need
- **Monitor OAuth usage** in Google Cloud Console

### Environment Security

- **Never commit** OAuth credentials to version control
- **Use different clients** for development vs production (recommended)
- **Rotate secrets** regularly
- **Monitor for suspicious OAuth activity**

### User Data Handling

- **Respect user privacy** - only collect necessary information
- **Implement proper logout** - clear all session data
- **Handle OAuth errors** gracefully
- **Provide clear privacy policy**

## Troubleshooting

### Common Issues

**Error: "redirect_uri_mismatch"**
- Check that the exact redirect URI is configured in Google OAuth client
- Verify `NEXT_PUBLIC_APP_URL` matches the port you're running on
- Ensure no trailing slashes in URLs

**Error: "invalid_client"**
- Check that `GOOGLE_CLIENT_ID` is correctly set
- Verify the OAuth client exists and is active
- Ensure the client hasn't been deleted or disabled

**Error: "invalid_client_secret"**
- Check that `GOOGLE_CLIENT_SECRET` is correctly set
- Regenerate client secret if needed
- Verify environment sync completed successfully

**Error: "access_denied"**
- User cancelled authentication or denied permissions
- Check OAuth consent screen configuration
- Verify test users are added for development

**Error: "User not found" or permission issues**
- Check that user has been added to test users list
- Verify OAuth consent screen is properly configured
- Ensure your app is not in "Testing" mode for production users

### Debug Steps

1. **Check environment variables**:
   ```bash
   # Verify variables are set
   cat apps/web/.env.local | grep GOOGLE
   
   # Check source file
   cat .env.source-of-truth.local | grep Google
   ```

2. **Verify OAuth client configuration**:
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Check your OAuth client settings
   - Confirm all redirect URIs are present
   - Verify client ID matches environment variable

3. **Test callback URL manually**:
   ```bash
   curl http://localhost:3000/auth/google/callback
   # Should return the callback page (not 404)
   ```

4. **Check Google Cloud Console logs**:
   - Navigate to "Logging" in Google Cloud Console
   - Filter for OAuth-related errors
   - Look for authentication attempts and failures

### OAuth Flow Debugging

Enable detailed OAuth logging by checking browser developer tools:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Initiate OAuth flow
4. Check for failed requests or error responses
5. Look at OAuth callback parameters

## Advanced Configuration

### Custom OAuth Scopes

To request additional user information:

1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Click "Edit App"
3. In "Scopes" section, add additional scopes:
   - `https://www.googleapis.com/auth/user.birthday.read` - User's birthday
   - `https://www.googleapis.com/auth/user.gender.read` - User's gender  
   - `https://www.googleapis.com/auth/user.phonenumbers.read` - User's phone numbers

**Note**: Additional scopes require app verification for production use.

### Multi-Domain Support

For applications with multiple domains:

1. Add all domain redirect URIs to the same OAuth client
2. Or create separate OAuth clients per domain
3. Configure environment variables appropriately

### OAuth with Custom Domains

For custom authentication domains:

1. Configure OAuth client for your auth subdomain
2. Set up proper DNS and SSL certificates
3. Update redirect URIs accordingly

## Related Documentation

- **[GitHub OAuth Setup](./github-oauth-setup.md)** - Similar setup for GitHub authentication
- **[Environment Sync Workflow](./environment-sync-workflow.md)** - Environment variable management
- **[New Repository Setup Guide](../new-repository-setup-guide.md)** - Complete setup process
- **[Development Guide](../development-guide.md)** - Port management and development workflow

## External Resources

- **[Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)**
- **[Google Cloud Console](https://console.cloud.google.com/)**  
- **[OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes)**
- **[Google OAuth Playground](https://developers.google.com/oauthplayground/)** - For testing OAuth flows

---

**Created**: For new repository setup requiring Google OAuth authentication  
**Last Updated**: Current as of Google Cloud Console interface changes  
**Security**: Follow Google's OAuth security best practices