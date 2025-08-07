# 🔐 Authentication System Testing Guide

This guide helps you test the role-based authentication system that was just implemented. The system has been simplified to 4 core roles focused on incident management workflows.

## 🎯 Quick Start

1. **Start the application**: `bun dev`
2. **Visit**: `http://localhost:3000`
3. **Login with test accounts** (see below)
4. **Use the Dashboard**: `http://localhost:3000/dashboard` to see role information

## 👥 Test User Accounts

All test accounts use the password: **`password`**

| Role | Email | Primary Function |
|------|-------|-----------------|
| **System Admin** | `system_admin@ndis.com.au` | Full system administration |
| **Company Admin** | `company_admin@ndis.com.au` | Company-level management |
| **Team Lead** | `team_lead@ndis.com.au` | Incident analysis & team management |
| **Frontline Worker** | `frontline_worker@ndis.com.au` | Create and edit incidents |

## 🧪 Testing Scenarios

### 1. Basic Authentication Flow

**Test Steps:**
1. Go to `/login`
2. Try each test account
3. Verify redirect to `/protected` or `/dashboard`
4. Check user info displays correctly
5. Test logout functionality

### 2. Role-Based Access Control

#### System Admin Testing
- ✅ **Should have access to:**
  - All company incidents
  - User management features
  - System configuration
  - LLM chat features
  - Cross-company access
  - Audit logs

- 🧪 **Test scenarios:**
  - Try accessing `/admin` (should work)
  - Test user invitation/management
  - Verify LLM access in `/chat`
  - Check comprehensive permissions on dashboard

#### Company Admin Testing
- ✅ **Should have access to:**
  - Company-wide incidents
  - User management within company
  - Company configuration
  - LLM chat features

- ❌ **Should NOT have access to:**
  - System-wide configuration
  - Cross-company data

- 🧪 **Test scenarios:**
  - Try managing users in company
  - Verify LLM access in `/chat`
  - Test company configuration access
  - Verify cannot access other companies' data

#### Team Lead Testing
- ✅ **Should have access to:**
  - Team incident viewing
  - Incident analysis features
  - LLM chat features
  - User profile viewing

- ❌ **Should NOT have access to:**
  - User management
  - System/company configuration

- 🧪 **Test scenarios:**
  - Create new incidents
  - Test incident analysis features
  - Verify LLM access in `/chat`
  - Check team incident access only

#### Frontline Worker Testing  
- ✅ **Should have access to:**
  - Create new incidents
  - Edit own incidents (during capture phase)

- ❌ **Should NOT have access to:**
  - Team incident viewing
  - User management
  - Analysis features
  - LLM features (limited access)

- 🧪 **Test scenarios:**
  - Create new incidents
  - Try editing own incident
  - Verify limited access (no admin features)
  - Confirm cannot view team incidents

### 3. Permission System Testing

#### Testing Individual Permissions
Visit the **Dashboard** (`/dashboard`) to see:
- Your role and permissions
- Role description
- Specific testing scenarios for your role
- Quick action buttons based on your access level

#### Permission Verification
1. **Check Permission Display**: Dashboard shows all permissions for your role
2. **Test Boundaries**: Try accessing features you shouldn't have
3. **Verify Inheritance**: Higher roles should have lower role permissions
4. **Cross-Role Testing**: Switch between accounts to compare access

## 📍 Key Testing Pages

### Primary Testing Interface
- **Dashboard**: `/dashboard` - Complete role overview and testing interface
- **Login**: `/login` - Authentication entry point
- **Protected**: `/protected` - Basic user information display

### Feature Testing Pages
- **Chat**: `/chat` - Test LLM access permissions
- **Debug Logs**: `/debug-logs` - System debugging (role-based access)
- **Debug Tools**: `/debug` - Development tools
- **Password Change**: `/change-password` - Security features

### Administrative Pages (Role-Dependent)
- **Admin Panel**: `/admin` - Administrative functions (system/company admin only)

## 🔍 What to Look For

### ✅ Expected Behaviors
- **Smooth Login**: No errors during authentication
- **Correct Redirects**: Proper page navigation after login
- **Role Display**: Your role shows correctly on dashboard
- **Permission Lists**: Dashboard shows accurate permissions for your role
- **Feature Access**: Can access features you should have
- **LLM Integration**: Chat works for roles with LLM access

### ❌ Issues to Report
- **Authentication Failures**: Cannot login with valid credentials
- **Wrong Permissions**: Seeing permissions you shouldn't have
- **Access Violations**: Can access features your role should block
- **UI Problems**: Dashboard not displaying correctly
- **LLM Access Issues**: Chat not working when it should

## 🚀 Advanced Testing

### 1. Session Management
- **Multi-Tab Testing**: Open multiple tabs, test session consistency
- **Session Expiry**: Wait for session timeout (if configured)
- **Concurrent Logins**: Try logging in with different roles simultaneously

### 2. Security Testing
- **Password Requirements**: Try weak passwords during registration
- **Session Security**: Check if logout properly clears session
- **Role Escalation**: Verify you cannot access higher-role features

### 3. Edge Cases
- **Network Issues**: Test with poor connectivity
- **Browser Refresh**: Refresh page and verify session persistence
- **Direct URL Access**: Try accessing protected URLs without login

## 🛠️ Developer Testing Tools

### Convex Functions for Testing
```bash
# Check user permissions programmatically
bunx convex run permissions:getUserPermissions '{"sessionToken": "your-session-token"}'

# Verify permission checks
bunx convex run permissions:checkPermission '{"sessionToken": "token", "permission": "create_incident"}'
```

### Database Inspection
```bash
# View all users and their roles
bunx convex run seed:quickSeed # If you need to reset test data
```

## 📊 Success Criteria

### Authentication System is Working If:
1. ✅ All 4 test accounts can login successfully
2. ✅ Dashboard shows correct role information for each user
3. ✅ Permissions are properly restricted per role
4. ✅ LLM access works for appropriate roles
5. ✅ UI clearly indicates user's current role and capabilities
6. ✅ Logout works and clears session properly
7. ✅ No unauthorized access to restricted features

### 🎉 System Ready When:
- All roles tested and working
- Permissions properly enforced
- UI provides clear role information
- No security vulnerabilities found
- Documentation matches actual behavior

## 🆘 Troubleshooting

### Common Issues
- **Cannot Login**: Check if users exist, verify password is `password`
- **Dashboard Not Loading**: Check Convex connection, verify user session
- **Permissions Not Showing**: Verify role is set correctly in database
- **LLM Chat Not Working**: Check `has_llm_access` flag for user

### Getting Help
- Check browser console for errors
- Verify Convex connection in Network tab
- Check user data in dashboard
- Test with different browsers/incognito mode

---

**Happy Testing!** 🚀 This authentication system is now ready for your incident management workflows.