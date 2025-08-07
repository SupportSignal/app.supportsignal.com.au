# Story 1.3 Acceptance Test: User Authentication & Permissions

**Story**: [User Authentication & Permissions](../../stories/1.3.story.md)  
**Status**: Ready for Testing  
**Test Environment**: Development  

## Test Overview

This acceptance test validates the role-based authentication system with simplified 4-role hierarchy focused on incident management workflows.

## Test User Accounts

All test accounts use the password: **`password`**

| Role | Email | Primary Function |
|------|-------|-----------------|
| **System Admin** | `system_admin@ndis.com.au` | Full system administration |
| **Company Admin** | `company_admin@ndis.com.au` | Company-level management |
| **Team Lead** | `team_lead@ndis.com.au` | Incident analysis & team management |
| **Frontline Worker** | `frontline_worker@ndis.com.au` | Create and edit incidents |

## Acceptance Criteria Testing

### AC1: Enhanced Convex authentication with secure session management

**Test Steps**:
1. Navigate to `/login`
2. Login with each test account
3. Verify session token is created and stored
4. Test session persistence across browser tabs
5. Verify automatic session expiration
6. Test logout clears session completely

**Expected Results**:
- ✅ All accounts can login successfully
- ✅ Sessions persist across tabs/refreshes
- ✅ Sessions expire after configured timeout
- ✅ Logout clears all session data

### AC2: Role-based permission system for API endpoint protection

**Test Steps**:
1. Login with each role
2. Visit `/dashboard` to view Permission Matrix
3. Verify permission display matches role capabilities
4. Test access boundaries for each role

**Expected Results**:

#### System Admin Permissions
- ✅ Create Incidents: ALLOWED
- ✅ Edit Own Incidents: ALLOWED
- ✅ View Team Incidents: ALLOWED
- ✅ View Company Incidents: ALLOWED
- ✅ Perform Analysis: ALLOWED
- ✅ Manage Users: ALLOWED
- ✅ Invite Users: ALLOWED
- ✅ View User Profiles: ALLOWED
- ✅ System Configuration: ALLOWED
- ✅ Company Configuration: ALLOWED
- ✅ Access LLM Features: ALLOWED
- ✅ View Audit Logs: ALLOWED
- ✅ View Security Logs: ALLOWED

#### Company Admin Permissions
- ✅ Create Incidents: ALLOWED
- ✅ Edit Own Incidents: ALLOWED
- ✅ View Team Incidents: ALLOWED
- ✅ View Company Incidents: ALLOWED
- ✅ Perform Analysis: ALLOWED
- ✅ Manage Users: ALLOWED
- ✅ Invite Users: ALLOWED
- ✅ View User Profiles: ALLOWED
- ❌ System Configuration: DENIED
- ✅ Company Configuration: ALLOWED
- ✅ Access LLM Features: ALLOWED
- ✅ View Audit Logs: ALLOWED
- ❌ View Security Logs: DENIED

#### Team Lead Permissions
- ✅ Create Incidents: ALLOWED
- ❌ Edit Own Incidents: DENIED
- ✅ View Team Incidents: ALLOWED
- ❌ View Company Incidents: DENIED
- ✅ Perform Analysis: ALLOWED
- ❌ Manage Users: DENIED
- ❌ Invite Users: DENIED
- ✅ View User Profiles: ALLOWED
- ❌ System Configuration: DENIED
- ❌ Company Configuration: DENIED
- ✅ Access LLM Features: ALLOWED
- ❌ View Audit Logs: DENIED
- ❌ View Security Logs: DENIED

#### Frontline Worker Permissions
- ✅ Create Incidents: ALLOWED
- ✅ Edit Own Incidents: ALLOWED
- ❌ View Team Incidents: DENIED
- ❌ View Company Incidents: DENIED
- ❌ Perform Analysis: DENIED
- ❌ Manage Users: DENIED
- ❌ Invite Users: DENIED
- ❌ View User Profiles: DENIED
- ❌ System Configuration: DENIED
- ❌ Company Configuration: DENIED
- ❌ Access LLM Features: DENIED
- ❌ View Audit Logs: DENIED
- ❌ View Security Logs: DENIED

### AC3: User registration and invitation workflow for administrators

**Test Steps**:
1. Login as System Admin or Company Admin
2. Navigate to user management interface
3. Test user invitation workflow
4. Verify invited users receive appropriate roles
5. Test registration with invitation tokens

**Expected Results**:
- ✅ Admins can invite users
- ✅ Invitation emails are sent (when configured)
- ✅ Invited users can complete registration
- ✅ New users get appropriate default roles

### AC4: Session persistence with workflow state recovery

**Test Steps**:
1. Login and start an incident creation workflow
2. Close browser tab and reopen
3. Verify session is restored
4. Check if workflow state is maintained

**Expected Results**:
- ✅ Session persists after browser close/reopen
- ✅ User remains authenticated
- ✅ Workflow state is recovered when possible

### AC5: Password requirements and account security measures

**Test Steps**:
1. Try to register with weak passwords
2. Verify password strength validation
3. Test account lockout after failed attempts
4. Verify password change functionality

**Expected Results**:
- ✅ Weak passwords are rejected
- ✅ Strong password requirements enforced
- ✅ Account lockout after 5 failed attempts
- ✅ Password change requires current password

### AC6: Integration with existing application components

**Test Steps**:
1. Test authentication with existing pages
2. Verify integration with chat system (LLM access)
3. Test debug log access based on roles
4. Check admin panel access restrictions

**Expected Results**:
- ✅ All existing pages work with new auth
- ✅ Chat system respects LLM access flags
- ✅ Debug logs accessible per role permissions
- ✅ Admin features restricted to appropriate roles

## Key Testing Pages

### Primary Testing Interface
- **Dashboard**: `/dashboard` - Complete role overview and Permission Matrix
- **Login**: `/login` - Authentication entry point
- **Protected**: `/protected` - Basic user information display

### Feature Testing Pages
- **Chat**: `/chat` - Test LLM access permissions
- **Debug Logs**: `/debug-logs` - System debugging (role-based access)
- **Admin Panel**: `/admin` - Administrative functions (admin roles only)

## Testing Scenarios

### 1. Basic Authentication Flow
1. Go to `/login`
2. Try each test account with password `password`
3. Verify redirect to `/dashboard`
4. Check user info displays correctly
5. Test logout functionality

### 2. Role-Based Access Testing
1. Login as each role
2. Visit dashboard to see permissions
3. Try accessing different features
4. Verify access boundaries are enforced
5. Switch between accounts to compare access

### 3. Permission Matrix Verification
1. Login with any account
2. Visit `/dashboard`
3. Check Permission Matrix shows correct ALLOWED/DENIED status
4. Verify Permission Summary counts are accurate
5. Test with all 4 roles to see different matrices

## Success Criteria

### ✅ Authentication System is Working When:
1. All 4 test accounts can login successfully
2. Dashboard shows correct role information for each user
3. Permission Matrix displays accurate ALLOWED/DENIED status
4. LLM access shows correctly (Enabled for system_admin, company_admin, team_lead; Disabled for frontline_worker)
5. UI clearly indicates user's current role and capabilities
6. Logout works and clears session properly
7. No unauthorized access to restricted features

### ✅ System Ready When:
- All roles tested and working
- Permissions properly enforced
- Permission Matrix matches expected results
- No security vulnerabilities found
- UI provides clear role information

## Troubleshooting

### Common Issues
- **Cannot Login**: Check if users exist, verify password is `password`
- **Dashboard Not Loading**: Check Convex connection, verify user session
- **Permissions Not Showing**: Verify role is set correctly in database
- **LLM Chat Not Working**: Check `has_llm_access` flag for user

### Developer Testing Tools
```bash
# Check user permissions programmatically
bunx convex run permissions:getUserPermissions '{"sessionToken": "your-session-token"}'

# Verify permission checks
bunx convex run permissions:checkPermission '{"sessionToken": "token", "permission": "create_incident"}'

# View all users and their roles
bunx convex data users
```

## Test Execution Log

| Date | Tester | Role Tested | Result | Notes |
|------|--------|-------------|---------|-------|
| | | | | |
| | | | | |
| | | | | |

---

**Story**: User Authentication & Permissions (1.3)  
**Last Updated**: 2025-08-07  
**Test Environment**: Development  
**Authentication System**: Convex with 4-role hierarchy