# Story Acceptance Test 8.3: OAuth Production Application Setup

## Overview
User Acceptance Testing plan to verify Story 8.3 implementation of OAuth production application setup for GitHub and Google authentication in both development and production environments.

**Story**: OAuth Production Application Setup
**Test Environment**: Production + Development
**Tester**: QA Team / Product Owner
**Date**: 2025-01-15

## Prerequisites

### Setup Information
- **Production URL**: https://app.supportsignal.com.au
- **Development URL**: http://localhost:3200
- **GitHub OAuth Client ID**: Ov23liMO6dymiqZKmiBS
- **Google OAuth Client ID**: 524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com

### Before Testing
1. **Verify Environment Separation**:
   - Production URLs point to https://app.supportsignal.com.au
   - Development URLs point to http://localhost:3200
   - OAuth applications configured for both environments

2. **Required Test Accounts**:
   - GitHub account with access to repository
   - Google account for OAuth testing
   - Existing email/password account for comparison testing

3. **Browser Requirements**:
   - Test in multiple browsers (Chrome, Firefox, Safari)
   - Test with and without existing sessions
   - Clear cookies/storage between major test groups

## Test Scenarios

### Test Group 1: Production Environment OAuth

#### UAT-1.1: GitHub OAuth in Production
**Objective**: Verify GitHub OAuth flow works correctly in production

**Environment**: Production (https://app.supportsignal.com.au)

**Test Steps**:
1. **Navigate to Production Login**:
   - Open browser to https://app.supportsignal.com.au/login
   - **Expected**: Login page loads correctly with OAuth buttons visible

2. **Initiate GitHub OAuth**:
   - Click "Sign in with GitHub" button
   - **Expected**: Redirects to GitHub OAuth authorization page
   - **Expected**: Authorization URL contains correct callback:
     `redirect_uri=https://app.supportsignal.com.au/auth/github/callback`

3. **Complete GitHub Authorization**:
   - Sign in to GitHub (if not already signed in)
   - Click "Authorize" button for SupportSignal application
   - **Expected**: Redirects back to production callback URL
   - **Expected**: Processing screen shows "Completing GitHub login..."

4. **Verify Successful Login**:
   - **Expected**: Redirects to `/protected` page
   - **Expected**: User appears logged in with GitHub profile information
   - **Expected**: User session persists on page refresh

**Pass Criteria**: ✅ GitHub OAuth completes successfully with correct production callbacks

#### UAT-1.2: Google OAuth in Production
**Objective**: Verify Google OAuth flow works correctly in production

**Environment**: Production (https://app.supportsignal.com.au)

**Test Steps**:
1. **Log Out** (if logged in from previous test):
   - Navigate to logout option
   - Clear browser session

2. **Navigate to Production Login**:
   - Open browser to https://app.supportsignal.com.au/login
   - **Expected**: Login page loads correctly

3. **Initiate Google OAuth**:
   - Click "Sign in with Google" button
   - **Expected**: Redirects to Google OAuth authorization page
   - **Expected**: Authorization URL contains correct callback:
     `redirect_uri=https://app.supportsignal.com.au/auth/google/callback`

4. **Complete Google Authorization**:
   - Sign in to Google (if not already signed in)
   - Click "Allow" button for SupportSignal application
   - **Expected**: Redirects back to production callback URL
   - **Expected**: Processing screen shows "Completing Google login..."

5. **Verify Successful Login**:
   - **Expected**: Redirects to `/protected` page
   - **Expected**: User appears logged in with Google profile information
   - **Expected**: User session persists on page refresh

**Pass Criteria**: ✅ Google OAuth completes successfully with correct production callbacks

### Test Group 2: Development Environment OAuth

#### UAT-2.1: GitHub OAuth in Development
**Objective**: Verify GitHub OAuth flow works correctly in development

**Environment**: Development (http://localhost:3200)

**Prerequisites**:
- Development server running: `bun dev`
- Convex development server running: `bunx convex dev`

**Test Steps**:
1. **Navigate to Development Login**:
   - Open browser to http://localhost:3200/login
   - **Expected**: Login page loads correctly with OAuth buttons visible

2. **Initiate GitHub OAuth**:
   - Click "Sign in with GitHub" button
   - **Expected**: Redirects to GitHub OAuth authorization page
   - **Expected**: Authorization URL contains correct callback:
     `redirect_uri=http://localhost:3200/auth/github/callback`

3. **Complete GitHub Authorization**:
   - Sign in to GitHub (if not already signed in)
   - Click "Authorize" button for SupportSignal application
   - **Expected**: Redirects back to development callback URL
   - **Expected**: Processing screen shows "Completing GitHub login..."

4. **Verify Successful Login**:
   - **Expected**: Redirects to `/protected` page
   - **Expected**: User appears logged in with GitHub profile information
   - **Expected**: User session persists on page refresh

**Pass Criteria**: ✅ GitHub OAuth completes successfully with correct development callbacks

#### UAT-2.2: Google OAuth in Development
**Objective**: Verify Google OAuth flow works correctly in development

**Environment**: Development (http://localhost:3200)

**Test Steps**:
1. **Log Out** (if logged in from previous test):
   - Navigate to logout option
   - Clear browser session

2. **Navigate to Development Login**:
   - Open browser to http://localhost:3200/login
   - **Expected**: Login page loads correctly

3. **Initiate Google OAuth**:
   - Click "Sign in with Google" button
   - **Expected**: Redirects to Google OAuth authorization page
   - **Expected**: Authorization URL contains correct callback:
     `redirect_uri=http://localhost:3200/auth/google/callback`

4. **Complete Google Authorization**:
   - Sign in to Google (if not already signed in)
   - Click "Allow" button for SupportSignal application
   - **Expected**: Redirects back to development callback URL
   - **Expected**: Processing screen shows "Completing Google login..."

5. **Verify Successful Login**:
   - **Expected**: Redirects to `/protected` page
   - **Expected**: User appears logged in with Google profile information
   - **Expected**: User session persists on page refresh

**Pass Criteria**: ✅ Google OAuth completes successfully with correct development callbacks

### Test Group 3: OAuth Application Configuration Validation

#### UAT-3.1: GitHub Application Settings Verification
**Objective**: Verify GitHub OAuth application is configured correctly

**Test Steps**:
1. **Check GitHub Application Settings**:
   - Login to GitHub as application owner
   - Navigate to Settings > Developer settings > OAuth Apps
   - Find application with Client ID: `Ov23liMO6dymiqZKmiBS`

2. **Verify Callback URLs**:
   - **Expected**: Application includes both callback URLs:
     - `https://app.supportsignal.com.au/auth/github/callback` (Production)
     - `http://localhost:3200/auth/github/callback` (Development)

3. **Verify Application Details**:
   - **Expected**: Application name: "SupportSignal"
   - **Expected**: Homepage URL points to production site
   - **Expected**: Application is active and not suspended

**Pass Criteria**: ✅ GitHub OAuth app configured with correct callback URLs for both environments

#### UAT-3.2: Google Application Settings Verification
**Objective**: Verify Google OAuth application is configured correctly

**Test Steps**:
1. **Check Google Cloud Console**:
   - Login to Google Cloud Console as project owner
   - Navigate to APIs & Services > Credentials
   - Find OAuth 2.0 Client ID: `524819461298-2nil4kfhehgpn04srd4qv8939s04qq4f.apps.googleusercontent.com`

2. **Verify Authorized Redirect URIs**:
   - **Expected**: Application includes both redirect URIs:
     - `https://app.supportsignal.com.au/auth/google/callback` (Production)
     - `http://localhost:3200/auth/google/callback` (Development)

3. **Verify OAuth Consent Screen**:
   - **Expected**: Application name: "SupportSignal"
   - **Expected**: Support email configured
   - **Expected**: Privacy policy URL configured (if required)

**Pass Criteria**: ✅ Google OAuth app configured with correct redirect URIs for both environments

### Test Group 4: Error Scenario Testing

#### UAT-4.1: OAuth Error Handling
**Objective**: Verify proper error handling for OAuth failures

**Test Steps**:
1. **Test OAuth Cancellation**:
   - Initiate GitHub OAuth flow
   - Click "Cancel" or "Deny" on authorization page
   - **Expected**: Redirects to callback with error
   - **Expected**: Error page displays user-friendly message
   - **Expected**: Provides link to return to login

2. **Test Invalid State Parameter**:
   - Manually modify OAuth callback URL with invalid state
   - **Expected**: Error displayed about invalid state/CSRF protection
   - **Expected**: User can return to login page

3. **Test Network Connectivity Issues**:
   - Test with slow/unstable internet connection
   - **Expected**: Appropriate timeout handling
   - **Expected**: Error messages guide user to retry

**Pass Criteria**: ✅ All error scenarios handled gracefully with user-friendly messages

#### UAT-4.2: Session Management Testing
**Objective**: Verify OAuth sessions work correctly

**Test Steps**:
1. **Test Session Persistence**:
   - Complete OAuth login
   - Close browser and reopen
   - Navigate to protected page
   - **Expected**: User remains logged in (if remember me selected)

2. **Test Session Logout**:
   - Login via OAuth
   - Click logout button
   - **Expected**: User successfully logged out
   - **Expected**: Cannot access protected pages without re-login

3. **Test Multiple Browser Sessions**:
   - Login in Browser A
   - Open same site in Browser B
   - **Expected**: Independent sessions (B requires separate login)

**Pass Criteria**: ✅ Session management works correctly across OAuth login types

### Test Group 5: Cross-Environment Consistency

#### UAT-5.1: User Account Linking
**Objective**: Verify OAuth accounts link correctly across environments

**Test Steps**:
1. **Create Account in Production**:
   - Use GitHub OAuth to create account in production
   - Note user email and profile information

2. **Login in Development**:
   - Use same GitHub account in development environment
   - **Expected**: Same user account accessed (same email)
   - **Expected**: Profile information consistent

3. **Test Account Persistence**:
   - Login with Google OAuth using same email as GitHub
   - **Expected**: Accounts linked if using same email address
   - **Expected**: User can login with either OAuth provider

**Pass Criteria**: ✅ User accounts consistent and properly linked across environments

#### UAT-5.2: Environment Variable Validation
**Objective**: Verify environment variables are correctly configured

**Test Steps**:
1. **Check Production Environment**:
   - Verify production Convex deployment receives correct URLs
   - **Expected**: OAuth callbacks generated with https://app.supportsignal.com.au
   - **Expected**: No localhost URLs in production logs

2. **Check Development Environment**:
   - Verify development Convex deployment receives correct URLs
   - **Expected**: OAuth callbacks generated with http://localhost:3200
   - **Expected**: No production URLs in development logs

3. **Test URL Generation**:
   - Verify password reset URLs use correct environment
   - **Expected**: Production generates https:// URLs
   - **Expected**: Development generates http://localhost URLs

**Pass Criteria**: ✅ Environment variables correctly configured and URLs generated properly

### Test Group 6: Rollback Verification

#### UAT-6.1: Fallback Authentication
**Objective**: Verify traditional email/password authentication still works

**Test Steps**:
1. **Test Email/Password Login**:
   - Navigate to login page
   - Use existing email/password credentials
   - **Expected**: Traditional login works alongside OAuth
   - **Expected**: Can switch between OAuth and traditional methods

2. **Test Account Creation**:
   - Create new account using email/password
   - **Expected**: Traditional registration works
   - **Expected**: Can login using created credentials

3. **Test Password Reset**:
   - Use "Forgot Password" functionality
   - **Expected**: Password reset emails generated with correct URLs
   - **Expected**: Reset process works for non-OAuth accounts

**Pass Criteria**: ✅ Traditional authentication methods unaffected by OAuth implementation

#### UAT-6.2: OAuth Disable Verification
**Objective**: Verify system gracefully handles OAuth service outages

**Test Steps**:
1. **Test with Invalid OAuth Credentials**:
   - Temporarily use invalid client ID (test only, restore afterward)
   - Attempt OAuth login
   - **Expected**: Clear error message about OAuth configuration
   - **Expected**: Traditional login remains available

2. **Test OAuth Provider Downtime**:
   - Attempt OAuth during provider maintenance window (if available)
   - **Expected**: Appropriate error handling
   - **Expected**: Fallback to traditional authentication suggested

**Pass Criteria**: ✅ System remains functional when OAuth providers unavailable

## Test Results Template

### Test Execution Summary
- **Test Date**: _________
- **Environment**: Production + Development
- **Tester**: _________
- **Browser Tested**: _________

| Test Group | Test Case | Production | Development | Notes |
|------------|-----------|------------|-------------|-------|
| 1.1 | GitHub OAuth Production | ⏳ | N/A | |
| 1.2 | Google OAuth Production | ⏳ | N/A | |
| 2.1 | GitHub OAuth Development | N/A | ⏳ | |
| 2.2 | Google OAuth Development | N/A | ⏳ | |
| 3.1 | GitHub App Configuration | ⏳ | ⏳ | |
| 3.2 | Google App Configuration | ⏳ | ⏳ | |
| 4.1 | OAuth Error Handling | ⏳ | ⏳ | |
| 4.2 | Session Management | ⏳ | ⏳ | |
| 5.1 | User Account Linking | ⏳ | ⏳ | |
| 5.2 | Environment Variable Validation | ⏳ | ⏳ | |
| 6.1 | Fallback Authentication | ⏳ | ⏳ | |
| 6.2 | OAuth Disable Verification | ⏳ | ⏳ | |

### Legend
- ⏳ **Pending**: Ready for execution
- ✅ **Pass**: Test completed successfully
- ❌ **Fail**: Test failed, issue identified
- ⚠️ **Warning**: Test passed with minor issues

### Overall Status
- ⏳ **Pending**: Ready for execution
- Target: ✅ **All tests passing**

## Critical Pass/Fail Criteria

### MUST PASS (Story Blocker if Failed)
1. **OAuth Callback URLs**: Both GitHub and Google must use correct URLs for each environment
2. **Authentication Flow**: Complete OAuth login process must work in both environments
3. **Session Management**: Users must stay logged in and be able to log out properly
4. **Environment Separation**: Production must use production URLs, development must use localhost

### SHOULD PASS (High Priority)
1. **Error Handling**: OAuth errors must display user-friendly messages
2. **Account Linking**: Same email should link across OAuth providers
3. **Traditional Auth**: Email/password login must continue working
4. **Cross-Browser**: OAuth should work in major browsers

### NICE TO HAVE (Medium Priority)
1. **Network Resilience**: Graceful handling of network issues
2. **Provider Downtime**: Clear messaging when OAuth providers unavailable
3. **Session Persistence**: Remember me functionality across browser sessions

## Troubleshooting Guide

### Common Issues
1. **Callback URL Mismatch**:
   - Verify OAuth app settings include correct URLs
   - Check for trailing slashes in configuration
   - Ensure HTTP vs HTTPS matches environment

2. **Environment Variable Issues**:
   - Verify Convex deployment has correct environment variables
   - Check NEXT_PUBLIC_APP_URL matches expected environment
   - Confirm OAuth client secrets are deployed correctly

3. **Session Problems**:
   - Clear browser cookies/localStorage between tests
   - Check for conflicting sessions across environments
   - Verify session token generation and validation

### Validation Commands
```bash
# Check production environment variables
bunx convex env list --prod

# Check development environment variables
bunx convex env list

# Verify development server is running on correct port
curl http://localhost:3200/login

# Test production site accessibility
curl https://app.supportsignal.com.au/login
```

## Next Steps After Story Acceptance Testing

### If All Tests Pass:
- Story 8.3 approved for production deployment
- OAuth production setup complete
- Begin next authentication-related stories

### If Tests Fail:
- Document specific failures with reproduction steps
- Prioritize fixes based on pass/fail criteria severity
- Re-test failed scenarios after fixes applied
- Consider rollback if critical failures affect production access

## Security Considerations

### OAuth Security Checklist
- [ ] State parameters used for CSRF protection
- [ ] Callback URLs restricted to application domains
- [ ] OAuth tokens properly secured and not logged
- [ ] Session tokens generated securely
- [ ] User data handled according to privacy requirements

### Production Security Validation
- [ ] HTTPS enforced for all OAuth flows
- [ ] No development URLs exposed in production
- [ ] OAuth applications configured with minimal required scopes
- [ ] Error messages don't leak sensitive information

This comprehensive UAT plan ensures Story 8.3 OAuth production setup is thoroughly validated across all critical scenarios and environments.