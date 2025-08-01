# User Acceptance Tests (UAT) - Story 1.5: Foundational Authentication

## Test Environment Setup

**Prerequisites:**
- Application running on `http://localhost:3000`
- Convex backend deployed and accessible
- Clean browser state (no existing sessions)

## UAT Test Cases

### UAT-1.5.1: User Registration Flow
**Acceptance Criteria:** A user can successfully sign up for a new account

**Test Steps:**
1. Navigate to home page (`/`)
2. Verify "Not signed in" status is displayed
3. Click "Sign Up" button
4. Fill registration form:
   - Name: "Test User"
   - Email: "test@example.com" 
   - Password: "password123"
   - Confirm Password: "password123"
5. Click "Sign Up" button
6. Verify automatic redirect to protected page
7. Verify user name "Test User" is displayed
8. Verify authentication status shows "Signed in as Test User"

**Expected Result:** ✅ User successfully registered and automatically logged in

---

### UAT-1.5.2: User Login Flow
**Acceptance Criteria:** A user can successfully log in with existing credentials

**Test Steps:**
1. If logged in, click "Log Out" to clear session
2. Navigate to home page (`/`)
3. Click "Sign In" button
4. Fill login form:
   - Email: "test@example.com"
   - Password: "password123" 
5. Click "Log In" button
6. Verify automatic redirect to protected page
7. Verify user information is displayed correctly

**Expected Result:** ✅ User successfully authenticated and redirected

---

### UAT-1.5.3: Session Persistence
**Acceptance Criteria:** User session persists across browser refresh

**Test Steps:**
1. Complete login process (UAT-1.5.2)
2. Refresh the browser page
3. Navigate to home page
4. Verify authentication status still shows "Signed in as Test User"
5. Navigate to `/protected` directly
6. Verify protected content is accessible without re-login

**Expected Result:** ✅ Session maintained across page refreshes

---

### UAT-1.5.4: Logout Functionality  
**Acceptance Criteria:** User can successfully log out and session is terminated

**Test Steps:**
1. Ensure user is logged in
2. Navigate to protected page (`/protected`)
3. Click "Log Out" button
4. Verify redirect to home page
5. Verify authentication status shows "Not signed in"
6. Attempt to navigate to `/protected` directly
7. Verify automatic redirect to login page

**Expected Result:** ✅ Session terminated and protected content inaccessible

---

### UAT-1.5.5: Protected Content Access Control
**Acceptance Criteria:** Protected page is only visible to authenticated users

**Test Steps:**
1. Ensure user is logged out
2. Navigate directly to `/protected`
3. Verify automatic redirect to login page
4. Complete login process
5. Verify automatic redirect to protected page
6. Verify all user information displayed:
   - Full name
   - Email address
   - User role
   - Member since date

**Expected Result:** ✅ Protected content properly secured and displays user data

---

### UAT-1.5.6: Form Validation
**Acceptance Criteria:** Authentication forms properly validate user input

**Test Steps:**

**Registration Validation:**
1. Navigate to `/register`
2. Submit empty form - verify "Name is required" error
3. Enter invalid email "test" - verify "valid email address" error  
4. Enter password "123" - verify "at least 6 characters" error
5. Enter mismatched passwords - verify "Passwords do not match" error

**Login Validation:**
1. Navigate to `/login`
2. Submit empty form - verify "fill in all fields" error
3. Enter invalid email "test" - verify "valid email address" error

**Expected Result:** ✅ All validation rules enforced with clear error messages

---

### UAT-1.5.7: Navigation and UI Integration
**Acceptance Criteria:** UI properly reflects authentication state

**Test Steps:**
1. Start logged out on home page
2. Verify UI shows:
   - "🔐 Authentication Status" section
   - "Not signed in" message
   - "Sign In" and "Sign Up" buttons
3. Complete login process
4. Return to home page
5. Verify UI shows:
   - "✅ Signed in as [username]" message
   - "Protected Area" button
   - "Log Out" button
6. Click "Protected Area" button
7. Verify navigation to protected page works

**Expected Result:** ✅ UI correctly reflects authentication state with proper navigation

---

### UAT-1.5.8: Error Handling
**Acceptance Criteria:** System handles authentication errors gracefully

**Test Steps:**
1. Attempt login with non-existent email
2. Verify appropriate error message displayed
3. Attempt registration with existing email
4. Verify appropriate error message displayed
5. Verify loading states show during authentication requests
6. Verify error states clear when retrying

**Expected Result:** ✅ Errors handled gracefully with user-friendly messages

---

## UAT Sign-off Criteria

**All test cases must pass for Story 1.5 to be considered complete:**

- [ ] UAT-1.5.1: User Registration Flow
- [ ] UAT-1.5.2: User Login Flow  
- [ ] UAT-1.5.3: Session Persistence
- [ ] UAT-1.5.4: Logout Functionality
- [ ] UAT-1.5.5: Protected Content Access Control
- [ ] UAT-1.5.6: Form Validation
- [ ] UAT-1.5.7: Navigation and UI Integration
- [ ] UAT-1.5.8: Error Handling

**UAT Completion Status:** 🟡 Pending Execution

**Notes:**
- All tests should be executed in both light and dark mode
- Test with different screen sizes (mobile, tablet, desktop)
- Verify accessibility with keyboard navigation
- Test with browser developer tools network throttling

**UAT Executed By:** [Name]  
**UAT Date:** [Date]  
**Environment:** [Environment Details]  
**Sign-off:** [Signature]