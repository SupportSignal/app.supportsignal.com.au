# User Acceptance Tests (UAT) - Story 1.8: Extended Authentication Security

## Test Environment Setup

**Prerequisites:**
- Application running on `http://localhost:3000` (human dev) or `http://localhost:3100` (AI dev)
- Convex backend deployed and accessible with OAuth credentials configured
- Clean browser state (no existing sessions, cookies, or localStorage)
- GitHub OAuth app configured with correct redirect URIs
- Google OAuth app configured with correct redirect URIs

**Environment Variables Verified:**
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` set in Convex
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in Convex
- Proper redirect URIs configured in OAuth providers

## Core Authentication Security Tests (Updated from UAT 1.5)

### UAT-1.8.1: User Registration Flow Security
**Acceptance Criteria:** A user can successfully sign up with enhanced security validation

**Test Steps:**
1. Navigate to home page (`/`)
2. Verify "Not signed in" status is displayed
3. Click "Sign Up" button
4. Fill registration form:
   - Name: "Test User"
   - Email: "test@example.com" 
   - Password: "SecurePass123!"
   - Confirm Password: "SecurePass123!"
5. Click "Sign Up" button
6. Verify automatic redirect to protected page
7. Verify user name "Test User" is displayed
8. Verify authentication status shows "Signed in as Test User"

**Security Verification:**
- Password is hashed and not stored in plain text
- Session token is cryptographically secure
- No sensitive data exposed in browser developer tools

**Expected Result:** ✅ User successfully registered with secure password handling

---

### UAT-1.8.2: User Login Flow with Remember Me Security
**Acceptance Criteria:** A user can successfully log in with optional extended session

**Test Steps:**
1. If logged in, click "Log Out" to clear session
2. Navigate to home page (`/`)
3. Click "Sign In" button
4. Fill login form:
   - Email: "test@example.com"
   - Password: "SecurePass123!"
   - **NEW**: Leave "Remember Me" unchecked
5. Click "Log In" button
6. Verify automatic redirect to protected page
7. Verify user information is displayed correctly

**Extended Session Test:**
8. Log out and repeat login with "Remember Me" checked
9. Verify secure cookie `auth_remember_token` is set with:
   - Expires date 30 days in future
   - SameSite=Strict attribute
   - Secure flag (if HTTPS)
10. Close browser completely and reopen
11. Navigate to application
12. Verify user is still logged in from remember cookie

**Expected Result:** ✅ Regular login (24hr) and extended login (30 days) work securely

---

### UAT-1.8.3: Session Persistence and Security
**Acceptance Criteria:** User sessions persist securely with proper token management

**Test Steps:**
1. Complete login process (UAT-1.8.2) without "Remember Me"
2. Refresh the browser page
3. Verify authentication persists for 24 hours
4. Open browser developer tools → Application → Local Storage
5. Verify `auth_session_token` is present and secure
6. Navigate to `/protected` directly
7. Verify protected content is accessible

**Security Verification:**
- Session token is not predictable or guessable
- Token expires appropriately (24hr regular, 30 days remember)
- No session fixation vulnerabilities

**Expected Result:** ✅ Session maintained securely with proper expiration

---

### UAT-1.8.4: Enhanced Logout Security
**Acceptance Criteria:** Logout clears all session data including cookies

**Test Steps:**
1. Login with "Remember Me" checked
2. Verify both localStorage token and remember cookie exist
3. Navigate to protected page (`/protected`)
4. Click "Log Out" button
5. Verify redirect to home page
6. Verify authentication status shows "Not signed in"
7. Check developer tools:
   - localStorage `auth_session_token` removed
   - Cookie `auth_remember_token` cleared/expired
8. Attempt to navigate to `/protected` directly
9. Verify automatic redirect to login page

**Expected Result:** ✅ Complete session termination with all tokens cleared

---

## Password Management Security Tests

### UAT-1.8.5: Password Change Security Flow
**Acceptance Criteria:** Users can securely change their passwords

**Test Steps:**
1. Log in as existing user
2. Navigate to protected page
3. Click "Change Password" button
4. Navigate to `/change-password`
5. Fill password change form:
   - Current Password: "SecurePass123!"
   - New Password: "NewSecurePass456!"
   - Confirm New Password: "NewSecurePass456!"
6. Click "Change Password" button
7. Verify success message displayed
8. Log out and attempt login with old password
9. Verify login fails with appropriate error
10. Log in with new password
11. Verify login succeeds

**Security Verification:**
- Current password verified before allowing change
- New password properly hashed and stored
- All existing sessions remain valid after password change

**Expected Result:** ✅ Password changed securely with proper validation

---

### UAT-1.8.6: Password Reset Security Flow
**Acceptance Criteria:** Users can securely reset forgotten passwords

**Test Steps:**
1. Ensure logged out
2. Navigate to login page
3. Click "Forgot your password?" link
4. Navigate to `/forgot-password`
5. Enter email: "test@example.com"
6. Click "Send Reset Email" button
7. Check browser console for mock email with reset token
8. Copy reset link from console log
9. Navigate to reset link (e.g., `/reset-password?token=...`)
10. Fill password reset form:
    - New Password: "ResetPassword789!"
    - Confirm Password: "ResetPassword789!"
11. Click "Reset Password" button
12. Verify success message and redirect to login
13. Log in with new password
14. Verify login succeeds

**Security Verification:**
- Reset token expires after 1 hour
- Token is single-use only
- All existing sessions invalidated after password reset
- Used token cannot be reused

**Expected Result:** ✅ Password reset flow secure with proper token management

---

## OAuth Integration Security Tests

### UAT-1.8.7: GitHub OAuth Security Flow
**Acceptance Criteria:** GitHub OAuth integration is secure and functional

**Test Steps:**
1. Ensure logged out and clear all cookies/localStorage
2. Navigate to login page
3. Click "Continue with GitHub" button
4. Verify redirect to GitHub OAuth authorization
5. Complete GitHub authorization (if prompted)
6. Verify redirect back to application with success
7. Verify user is logged in with GitHub profile data
8. Check protected page shows GitHub user information

**Security Verification:**
- State parameter used for CSRF protection
- OAuth callback validates state parameter
- No authorization code reuse possible
- User profile data properly synchronized
- Session created with 30-day expiration (OAuth default)

**Expected Result:** ✅ GitHub OAuth flow secure with proper CSRF protection

---

### UAT-1.8.8: Google OAuth Security Flow
**Acceptance Criteria:** Google OAuth integration is secure and functional

**Test Steps:**
1. Ensure logged out and clear all cookies/localStorage
2. Navigate to login page
3. Click "Continue with Google" button
4. Verify redirect to Google OAuth authorization
5. Complete Google authorization (if prompted)
6. Verify redirect back to application with success
7. Verify user is logged in with Google profile data
8. Check protected page shows Google user information

**Security Verification:**
- State parameter used for CSRF protection
- OAuth callback validates state parameter
- Proper scope requested (openid email profile)
- User profile data properly synchronized
- Session created with 30-day expiration

**Expected Result:** ✅ Google OAuth flow secure with proper CSRF protection

---

### UAT-1.8.9: OAuth Account Linking Security
**Acceptance Criteria:** OAuth accounts properly link to existing users

**Test Steps:**
1. Register new user with email "oauth@example.com" and password
2. Log out completely
3. Attempt GitHub OAuth with same email "oauth@example.com"
4. Verify GitHub account links to existing user
5. Log out and log in with original password
6. Verify login succeeds with linked account data
7. Repeat test with Google OAuth using same email

**Security Verification:**
- No duplicate accounts created
- Existing user data preserved
- OAuth tokens properly stored
- No privilege escalation possible

**Expected Result:** ✅ OAuth accounts securely linked to existing users

---

## Cross-Browser and Security Compatibility Tests

### UAT-1.8.10: Cross-Browser Authentication Security
**Acceptance Criteria:** Authentication works securely across different browsers

**Test Browsers:** Chrome, Firefox, Safari, Edge

**Test Steps (per browser):**
1. Complete full registration flow
2. Test regular login and remember me functionality
3. Test password change and reset flows
4. Test GitHub and Google OAuth flows
5. Verify logout clears all session data
6. Test protected route access control

**Security Focus:**
- Cookie handling across browsers
- OAuth redirects work properly
- Session security maintained
- No browser-specific vulnerabilities

**Expected Result:** ✅ Consistent secure authentication across all browsers

---

### UAT-1.8.11: Mobile Security and Responsiveness
**Acceptance Criteria:** Authentication is secure and usable on mobile devices

**Test Steps:**
1. Test on mobile viewport (375px width)
2. Complete registration and login flows
3. Test OAuth flows on mobile
4. Verify touch interactions work properly
5. Test password change/reset on mobile
6. Verify proper keyboard handling for forms

**Security Verification:**
- No mobile-specific security issues
- OAuth redirects work on mobile browsers
- Secure cookie handling on mobile
- Form inputs properly secured

**Expected Result:** ✅ Mobile authentication fully secure and functional

---

## Security Penetration and Edge Case Tests

### UAT-1.8.12: Authentication Security Edge Cases
**Acceptance Criteria:** System resists common security attacks

**Test Steps:**
1. **SQL Injection Testing:**
   - Enter SQL injection strings in all form fields
   - Verify proper input sanitization

2. **XSS Testing:**
   - Enter JavaScript code in form fields
   - Verify no code execution occurs

3. **CSRF Testing:**
   - Attempt OAuth flow without state parameter
   - Verify request rejected

4. **Session Hijacking Testing:**
   - Copy session token between browsers
   - Verify proper session isolation

5. **Token Replay Testing:**
   - Reuse password reset tokens
   - Verify tokens are single-use

6. **Brute Force Testing:**
   - Attempt multiple failed logins
   - Verify system handles repeated attempts

**Expected Result:** ✅ System resists common authentication attacks

---

### UAT-1.8.13: Data Privacy and GDPR Compliance
**Acceptance Criteria:** User data handled according to privacy best practices

**Test Steps:**
1. Register new user and verify minimal data collection
2. Check what data is stored for OAuth users
3. Verify password hashing (bcrypt with salt rounds 10)
4. Test user data deletion (account deletion if implemented)
5. Verify no sensitive data in logs or console
6. Check OAuth token storage security

**Privacy Verification:**
- Passwords never stored in plain text
- OAuth tokens properly encrypted/secured
- Minimal user data collection
- No sensitive data in browser storage

**Expected Result:** ✅ User data handled securely with privacy protection

---

## Backward Compatibility and Integration Tests

### UAT-1.8.14: Backward Compatibility Security
**Acceptance Criteria:** Existing authentication flows remain secure

**Test Steps:**
1. Test existing user accounts still work
2. Verify old session tokens still valid (if within expiration)
3. Test existing password hashes still work
4. Verify no breaking changes to authentication API
5. Test migration of existing users to new system
6. Verify existing protected routes still secured

**Expected Result:** ✅ No security regressions with backward compatibility

---

### UAT-1.8.15: End-to-End Security Integration
**Acceptance Criteria:** All authentication methods work together securely

**Test Steps:**
1. Test user switching between password and OAuth login
2. Verify account linking works securely
3. Test remember me with OAuth accounts
4. Test password change for OAuth-linked accounts
5. Verify consistent security policies across all auth methods
6. Test session management with multiple login methods

**Expected Result:** ✅ All authentication methods integrate securely

---

## UAT Sign-off Criteria

**All test cases must pass for Story 1.8 to be considered complete:**

### Core Authentication (Updated from 1.5)
- [ ] UAT-1.8.1: User Registration Flow Security
- [ ] UAT-1.8.2: User Login Flow with Remember Me Security
- [ ] UAT-1.8.3: Session Persistence and Security
- [ ] UAT-1.8.4: Enhanced Logout Security

### Password Management Security
- [ ] UAT-1.8.5: Password Change Security Flow
- [ ] UAT-1.8.6: Password Reset Security Flow

### OAuth Integration Security
- [ ] UAT-1.8.7: GitHub OAuth Security Flow
- [ ] UAT-1.8.8: Google OAuth Security Flow
- [ ] UAT-1.8.9: OAuth Account Linking Security

### Cross-Platform Security
- [ ] UAT-1.8.10: Cross-Browser Authentication Security
- [ ] UAT-1.8.11: Mobile Security and Responsiveness

### Security Penetration Testing
- [ ] UAT-1.8.12: Authentication Security Edge Cases
- [ ] UAT-1.8.13: Data Privacy and GDPR Compliance

### Integration Testing
- [ ] UAT-1.8.14: Backward Compatibility Security
- [ ] UAT-1.8.15: End-to-End Security Integration

**UAT Completion Status:** 🟡 Ready for Execution

**Security Notes:**
- All tests must be executed with security focus
- Verify no sensitive data exposed in browser tools
- Test with both HTTP (development) and HTTPS (production) protocols
- Validate all cookie security attributes
- Check OAuth redirect URI security
- Verify CSRF protection across all flows
- Test session token security and rotation

**Performance Requirements:**
- Authentication response time < 2 seconds
- OAuth redirects complete within 5 seconds
- Password hashing completes within 1 second
- Session validation < 100ms

**Compliance Verification:**
- OWASP Authentication guidelines followed
- OAuth 2.0 security best practices implemented
- Secure cookie handling standards met
- Password security requirements exceeded

**UAT Executed By:** [Name]  
**UAT Date:** [Date]  
**Environment:** [Environment Details]  
**Security Sign-off:** [Security Team Signature]  
**Product Sign-off:** [Product Owner Signature]

---

## Security Test Data

**Test Users for UAT:**
- Standard User: test@example.com / SecurePass123!
- OAuth Test User: oauth@example.com (with GitHub/Google accounts)
- Admin User: admin@example.com / AdminSecure456! (if role-based auth implemented)

**Security Test Scenarios:**
- Happy path authentication flows
- Error handling and edge cases
- Malicious input and attack vectors
- Cross-browser and mobile compatibility
- OAuth integration security
- Session management security
- Password security validation

**Security Metrics to Track:**
- Authentication success/failure rates
- Session security compliance
- OAuth flow completion rates
- Password strength compliance
- Security vulnerability count (should be 0)
- CSRF protection effectiveness
- Session hijacking prevention