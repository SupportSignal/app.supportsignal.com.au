# Multi-Tenant Administration Requirements Analysis

## Document Purpose

This requirements analysis document serves as the source of truth for identifying gaps in the current SupportSignal multi-tenant administration system and defining the scope for Epic #7. This document will inform the creation of Epic 7 stories and implementation specifications.

---

## Current System Capabilities Analysis

### **Authentication & Email Infrastructure** ✅

#### **BetterAuth System**
- ✅ **Core authentication**: BetterAuth handles user sessions, passwords, and security
- ✅ **Session management**: `sessions` table with proper token handling
- ✅ **Password reset tokens**: `password_reset_tokens` table ready for workflows
- ✅ **Account providers**: Support for OAuth providers (future use)

#### **Email Service Infrastructure**
- ✅ **Cloudflare Worker Email Service**: Deployed service using Resend API
- ✅ **Service endpoint**: `https://supportsignal-email-with-resend.your-account.workers.dev`
- ✅ **Email configuration**: From `info@supportsignal.com.au`, HTML formatted messages
- ✅ **CORS enabled**: Ready for web application integration

**Email Service Integration**:
```javascript
// POST request format
{
  "to": "recipient@example.com",
  "name": "John Doe",
  "message": "Email content"
}

// Response format
{
  "data": { "id": "resend-email-id" },
  "error": null
}
```

**Integration Code Example**:
```javascript
async function sendSupportEmail(to, name, message) {
  const response = await fetch('https://supportsignal-email-with-resend.your-account.workers.dev', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, name, message })
  });
  return await response.json();
}
```

### **Company Management** ✅

#### **Existing Infrastructure**
- ✅ **Company schema**: Multi-tenant `companies` table with name, slug, contact_email, status
- ✅ **Company management interfaces**:
  - `/company-management/` - Company information management
  - `/admin/company-settings/` - Admin company settings
- ✅ **Company editing**: Basic company information updates (name, email, status)
- ✅ **Company association**: Users linked via `company_id` for multi-tenant isolation

#### **Backend Functions Available**
```typescript
// Existing company functions
companies.getCompanyById
companies.getCompanyBySlug
companies.listActiveCompanies
companies.createCompany (basic, no auth)
companies.updateCompanyStatus
```

### **User Management** ✅

#### **Existing Infrastructure**
- ✅ **Comprehensive user admin**: `/admin/users` page with global user management
- ✅ **Role-based access**: 5-tier role system (system_admin → frontline_worker)
- ✅ **User filtering**: Search by name, email, role, company
- ✅ **Role management**: Promote/demote system administrators
- ✅ **User statistics**: Dashboard with user counts, company distribution

#### **Backend Functions Available**
```typescript
// Existing user management functions
adminUsers.listAllUsers
adminUsers.getUserStats
adminUsers.getCompanyList
adminUsers.promoteToSystemAdmin
adminUsers.demoteSystemAdmin
```

### **Participant Management** ✅

#### **Existing Infrastructure**
- ✅ **Full CRUD operations**: `/participants` page with create, edit, view, list
- ✅ **Advanced search**: Filter by status, support level, company scope
- ✅ **NDIS compliance**: Proper NDIS number, support levels, care notes
- ✅ **Mobile responsive**: Touch-friendly participant management interface

#### **Backend Functions Available**
```typescript
// Existing participant functions
participants.list.listParticipants
participants.create.createParticipant
participants.update.updateParticipant
participants.createSampleData.createSampleParticipants
```

---

## Critical Gaps Identified

### **1. Company Creation & Onboarding Workflow** ❌

**Current State**: Backend `createCompany` function exists but has no authentication and no UI

**Missing Components**:
- ❌ **Company creation form**: No UI for adding new companies
- ❌ **Company onboarding**: No guided setup workflow for new organizations
- ❌ **Slug generation**: No automatic URL-friendly identifier creation
- ❌ **Initial admin setup**: No process to assign first company admin
- ❌ **Authentication integration**: Backend function lacks proper auth checks

**Impact**: System administrators cannot easily onboard new organizations

### **2. User Creation & Invitation System** ❌

**Current State**: Users can only be promoted/demoted, not created or invited. **BetterAuth and email infrastructure ready**.

**Missing Components**:
- ❌ **User invitation workflow**: No integration of BetterAuth with email invitation system
- ❌ **User creation form**: No UI for adding new users to companies
- ❌ **Company-scoped user management**: Company admins cannot manage their own users
- ❌ **Invitation token management**: No secure invitation link generation

**Impact**: Poor user experience for adding new team members, all user management requires system admin intervention

### **3. Enhanced Company Management** ❌

**Current State**: Basic company management exists at `/company-management/` and `/admin/company-settings/`

**Missing Components**:
- ❌ **Company health overview**: Enhanced dashboard with key metrics (user count, participant count, recent activity)
- ❌ **Company lifecycle management**: Proper deactivation/reactivation workflows
- ❌ **Enhanced company settings**: Additional configuration options beyond basic info

**Impact**: Company administrators need better visibility into their organization's status and activity

### **4. Simple Multi-Tenant Administrative Tools** ❌

**Current State**: Basic global user management exists but lacks multi-tenant context

**Missing Components**:
- ❌ **Company listing interface**: Simple list of all companies with basic counts
- ❌ **Company overview**: User count and participant count per company
- ❌ **Company status management**: Easy way to activate/suspend companies

**Impact**: System administrators need a simple overview of all companies in the system

### **5. Delegated User Management** ❌

**Current State**: Only system admins can manage users, basic role promotion/demotion available

**Missing Components**:
- ❌ **Delegated administration**: Company admins can't manage their own users
- ❌ **Company-scoped permissions**: Company admins need ability to invite and manage users within their company

**Impact**: All user management requires system admin intervention, limiting operational efficiency

---

## Technical Architecture Requirements

### **Backend Functions Required**

#### **Company Management Functions**
```typescript
// Company Creation & Management
companies.create.createCompanyWithAuth       // Authenticated company creation
companies.admin.getCompanyDashboard         // Company-specific analytics
companies.admin.listAllCompanies           // System admin company listing
companies.lifecycle.suspendCompany         // Company deactivation
companies.lifecycle.reactivateCompany      // Company reactivation
companies.settings.updateCompanySettings   // Advanced company configuration

// Company Onboarding
companies.onboarding.createCompanyWithAdmin // Create company + initial admin
companies.onboarding.sendWelcomeEmail      // Welcome email workflow
companies.onboarding.getOnboardingStatus   // Track setup completion
```

#### **User Management Functions (BetterAuth Integration)**
```typescript
// User Invitation System (integrates with existing BetterAuth)
users.invite.sendUserInvitation           // Email invitation using Resend service
users.invite.acceptInvitation             // Invitation acceptance with BetterAuth account creation
users.invite.listPendingInvitations       // Track invitation status
users.invite.revokeInvitation             // Cancel pending invitations

// Company-Scoped User Management
users.company.listCompanyUsers            // Company admin user listing
users.company.createCompanyUser           // Direct user creation with BetterAuth
users.company.updateUserRole              // Company admin role management
users.company.deactivateUser              // User deactivation

// BetterAuth Password Management
users.auth.sendPasswordReset              // Integrate with existing password reset tokens
users.auth.updateUserPassword             // Password management workflows
```

#### **Simple Analytics Functions (Minimal)**
```typescript
// Basic Company Metrics
analytics.company.getUserCount            // Simple user count
analytics.company.getParticipantCount     // Simple participant count
analytics.company.getBasicStats           // Combined basic metrics

// System Overview
analytics.system.getCompanyList           // Company listing with counts
analytics.system.getSystemCounts          // Total system statistics
```

### **Database Schema Additions**

#### **User Invitations Table**
```sql
user_invitations: {
  _id: id,
  email: string,
  company_id: id("companies"),
  role: union("company_admin", "team_lead", "frontline_worker"),
  invited_by: id("users"),
  invitation_token: string,
  expires_at: number,
  status: union("pending", "accepted", "expired", "revoked"),
  created_at: number,
  accepted_at: optional(number)
}
```

#### **Company Analytics Table**
```sql
company_analytics: {
  _id: id,
  company_id: id("companies"),
  metric_type: string, // "user_count", "incident_count", "participant_count"
  metric_value: number,
  recorded_at: number,
  period_type: union("daily", "weekly", "monthly"),
  metadata: optional(any) // Additional context
}
```

#### **User Activity Logs Table**
```sql
user_activity_logs: {
  _id: id,
  user_id: id("users"),
  company_id: id("companies"),
  action_type: string, // "login", "create_incident", "manage_user"
  resource_type: optional(string), // "incident", "participant", "user"
  resource_id: optional(string),
  timestamp: number,
  ip_address: optional(string),
  user_agent: optional(string),
  details: optional(any)
}
```

### **Frontend Architecture Requirements**

#### **Admin Interface Structure**
```
/admin/
├── companies/
│   ├── create/                 # Company creation wizard
│   ├── [id]/
│   │   ├── dashboard/          # Company-specific admin dashboard
│   │   ├── users/              # Company user management
│   │   ├── participants/       # Company participant overview
│   │   ├── analytics/          # Company analytics & reporting
│   │   └── settings/           # Company configuration
│   └── list/                   # System-wide company management
│
├── system/
│   ├── dashboard/              # System-wide admin dashboard
│   ├── companies/              # Company lifecycle management
│   ├── analytics/              # Cross-company reporting
│   ├── monitoring/             # System health monitoring
│   └── users/                  # Global user management (existing)
│
└── invitations/
    ├── send/                   # User invitation interface
    ├── pending/                # Pending invitation management
    └── bulk/                   # Bulk invitation tools
```

#### **Company Admin Interface**
```
/company-admin/
├── dashboard/                  # Company overview & health
├── users/
│   ├── list/                   # Company user listing
│   ├── invite/                 # User invitation
│   └── [id]/                   # User profile management
├── participants/               # Enhanced participant management
├── reports/                    # Company-specific reporting
└── settings/                   # Company preferences
```

---

## User Journey Requirements

### **System Administrator Journey**
1. **Company Onboarding**:
   - Create new company with basic information
   - Generate unique company slug automatically
   - Set up initial company administrator
   - Send welcome email with setup instructions
   - Monitor onboarding completion

2. **Multi-Tenant Management**:
   - View system-wide company health dashboard
   - Compare company usage and performance
   - Manage company lifecycle (suspend/reactivate)
   - Access cross-company analytics and reporting

### **Company Administrator Journey**
1. **User Management**:
   - Invite new users to company via email
   - Assign appropriate roles during invitation
   - Manage existing user roles and permissions
   - Deactivate users when they leave organization

2. **Company Operations**:
   - Monitor company dashboard with key metrics
   - View user activity and engagement
   - Generate company-specific reports
   - Configure company settings and preferences

### **New User Journey**
1. **Invitation & Onboarding**:
   - Receive email invitation with secure link
   - Complete account setup with password creation
   - Guided onboarding based on assigned role
   - Access role-appropriate features immediately

---

## Success Metrics & Acceptance Criteria

### **Operational Efficiency**
- **Company Onboarding**: New companies operational within 24 hours
- **User Invitation**: New users active within 1 hour of invitation
- **Self-Service**: 90% of user management handled by company admins
- **Bulk Operations**: Support for 50+ simultaneous user invitations

### **System Scalability**
- **Multi-Tenant Performance**: <2 second response time for company-scoped queries
- **Administrative Load**: System admin workload reduced by 75% for routine tasks
- **Company Growth**: Support 100+ companies with minimal system admin intervention

### **User Experience**
- **Intuitive Interface**: Company admins complete user management tasks without training
- **Clear Permissions**: Users understand their access level and capabilities
- **Responsive Design**: Full functionality on mobile devices for admin tasks

---

## Implementation Priority

### **Phase 1: Foundation (Critical)**
1. Company creation workflow with authentication
2. User invitation system with email integration
3. Company-scoped user management interface

### **Phase 2: Enhanced Administration (High)**
1. Company dashboard with analytics
2. Advanced user management (bulk operations)
3. System-wide company management tools

### **Phase 3: Advanced Features (Medium)**
1. Cross-company analytics and reporting
2. Advanced permission management
3. Company migration and lifecycle tools

---

## Risk Considerations

### **Technical Risks**
- **Email Delivery**: Invitation emails may be blocked by spam filters
- **Token Security**: Invitation tokens need secure generation and expiration
- **Database Performance**: Company-scoped queries must remain performant at scale

### **User Experience Risks**
- **Permission Confusion**: Complex role hierarchies may confuse users
- **Workflow Complexity**: Onboarding process must remain simple despite comprehensive setup
- **Mobile Limitations**: Admin interfaces must work effectively on mobile devices

### **Operational Risks**
- **Data Isolation**: Must maintain strict company data separation
- **Migration Complexity**: Existing data must be properly associated with companies
- **Support Burden**: New self-service capabilities must reduce, not increase, support requests

---

## Integration Dependencies

### **Existing System Integration**
- **BetterAuth System**: Must integrate with existing BetterAuth for user account creation and password management
- **Email Service**: Use existing Cloudflare Worker email service with Resend for invitations and notifications
  - **Reference**: `/Users/davidcruwys/dev/clients/supportsignal/supportsignal-email-with-resend/INTEGRATION.md`
- **Participant Management**: Must maintain company isolation for participant access
- **Incident System**: Must respect company boundaries for incident data

### **Future Epic Enablement**
- **Advanced Analytics** (Future Epic): Company-scoped analytics foundation
- **API Management** (Future Epic): Company-specific API access controls
- **Compliance Reporting** (Future Epic): Company-segregated compliance data

---

*This requirements analysis provides the foundation for Epic 7 story creation and implementation planning.*

*Last Updated: 2025-01-19*
*Document Type: Requirements Analysis*
*Target Epic: Epic 7 - Multi-Tenant Administration & Onboarding System*