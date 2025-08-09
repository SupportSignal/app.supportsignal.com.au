# Epic 2: Entity & Relationship Management

## Epic Overview

**Status**: **READY FOR DEVELOPMENT** ✅  
**Epic 1 Handoff**: COMPLETED - All dependencies satisfied

**Goal**: Implement the foundational entity management system for NDIS participants and establish proper relationships between users, companies, and participants required for incident reporting workflows.

**Duration**: 2 weeks  
**Team Size**: 1-2 developers (frontend focus)  
**Dependencies**: ✅ Epic 1 (database, authentication, companies) - **COMPLETED**  
**Primary Users**: Team leads, company administrators (for participant management)

---

## Business Context

Epic 2 establishes the foundational entity management required for effective incident reporting. Without proper participant management, incident reporting lacks the necessary context and relationships that make reports meaningful for compliance and analysis.

**Key Business Drivers**:
- **Data Foundation**: Proper participant entities are required for meaningful incident reporting
- **Role-Based Access**: Only authorized staff can create and manage participant records
- **Company Isolation**: Multi-tenant participant management ensures data privacy between NDIS providers
- **Workflow Enablement**: Establishes the participant selection foundation needed for Epic 3 incident capture

**Success Metrics**:
- **Participant Onboarding**: <5 minutes to create a new participant record
- **Data Quality**: 100% participant-to-company association accuracy
- **Role Compliance**: Only authorized roles can access participant management
- **User Adoption**: >90% of incidents reference existing participants (vs manual entry)

---

## Story Breakdown

### Story 2.0: UI Design System Foundation

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Status**: ✅ **COMPLETED**  
**Dependencies**: Epic 1 (basic infrastructure)

#### Requirements
Establish comprehensive UI design system and React component specifications providing the application layout and component foundation needed for entity management and incident workflows.

#### Acceptance Criteria
- [x] Complete SupportSignal brand color palette implemented in Tailwind config
- [x] Typography scale and layout grid system with healthcare accessibility
- [x] Core incident management UI components built and documented
- [x] Application layout with proper navigation structure
- [x] Comprehensive component documentation and integration patterns

---

### Story 2.1: Wizard Framework & Navigation

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Status**: ✅ **COMPLETED**  
**Dependencies**: Story 2.0 (UI foundation)

#### Requirements
Build reusable wizard component framework that provides consistent navigation, progress tracking, and validation patterns for multi-step workflows.

#### Acceptance Criteria
- [x] Reusable `WizardShell` component with configurable steps and validation
- [x] Progress indicator with clear visual state (pending/current/completed)
- [x] Navigation controls that respect validation rules and user permissions
- [x] Auto-save functionality with 300ms debouncing for all form inputs
- [x] Session recovery that restores user to exact step and input state
- [x] Mobile-responsive design tested on iOS Safari and Android Chrome
- [x] Keyboard navigation and screen reader accessibility compliance

---

### Story 2.2: Main Application Navigation & Layout Foundation

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Status**: ✅ **COMPLETED**  
**Dependencies**: Stories 2.0 (UI foundation) & 2.1 (wizard framework)

#### Requirements
Establish consistent main application navigation structure with left sidebar, top menu, and bottom menu for seamless user experience across all workflows.

#### Acceptance Criteria
- [x] Left sidebar navigation with role-based menu items for different user types
- [x] Top header menu with user profile, notifications, and quick actions
- [x] Bottom navigation/footer with system information and secondary links
- [x] Responsive design that adapts sidebar to mobile (collapsible/drawer)
- [x] Main content area that integrates with wizard and other workflows
- [x] Navigation state persistence (active menu items, collapsed states)
- [x] WCAG 2.1 AA accessibility compliance for all navigation elements

---

### Story 2.3: NDIS Participants Management

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Dependencies**: Stories 2.0 (UI foundation), 2.1 (wizard framework), 2.2 (navigation), Epic 1 (companies, authentication)

#### Requirements
Implement comprehensive NDIS participant management system with role-based access control and automatic company association for incident reporting foundation.

**Participant Management Features**:
- **Create Participants**: Role-restricted participant creation (team_lead+)
- **Auto-Company Association**: Participants automatically belong to user's company
- **Participant Listing**: Company-scoped participant directory with search
- **Edit/Update**: Full participant record management with audit trail
- **Validation**: Required fields, duplicate prevention, data integrity

#### Acceptance Criteria
- [ ] **Create Participant Form**: Clean form with validation and auto-save
- [ ] **Role-Based Access**: Only team_lead, company_admin, system_admin can create participants
- [ ] **Auto-Association**: New participants automatically assigned to user's company
- [ ] **Participant List**: Searchable, filterable list of company's participants
- [ ] **Edit Functionality**: Full CRUD operations with change tracking
- [ ] **Data Validation**: Required fields, format validation, duplicate detection
- [ ] **Responsive Design**: Mobile-friendly participant management interface

#### Technical Implementation
```typescript
// Participant data structure (missing from current schema)
interface Participant {
  _id: Id<"participants">;
  company_id: Id<"companies">; // Auto-assigned from user's company
  
  // Core participant information
  first_name: string;
  last_name: string;
  date_of_birth: string; // For identification
  ndis_number: string; // NDIS participant number
  
  // Contact information
  contact_phone: string;
  emergency_contact: string;
  
  // Service information
  support_level: "high" | "medium" | "low";
  care_notes: string; // Special considerations
  
  // Audit trail
  created_at: number;
  created_by: Id<"users">;
  updated_at: number;
  updated_by: Id<"users">;
  
  // Status
  status: "active" | "inactive" | "discharged";
}

// Role-based creation validation
const canCreateParticipant = (userRole: UserRole): boolean => {
  return ["system_admin", "company_admin", "team_lead"].includes(userRole);
};
```

#### Database Schema Addition
```sql
-- New table needed in schema.ts
participants: defineTable({
  company_id: v.id("companies"), // Multi-tenant isolation
  first_name: v.string(),
  last_name: v.string(),
  date_of_birth: v.string(),
  ndis_number: v.string(), // NDIS participant identifier
  contact_phone: v.optional(v.string()),
  emergency_contact: v.optional(v.string()),
  support_level: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  care_notes: v.optional(v.string()),
  status: v.union(v.literal("active"), v.literal("inactive"), v.literal("discharged")),
  created_at: v.number(),
  created_by: v.id("users"),
  updated_at: v.number(),
  updated_by: v.id("users"),
})
  .index("by_company", ["company_id"])
  .index("by_ndis_number", ["ndis_number"])
  .index("by_status", ["status"])
  .index("by_name", ["last_name", "first_name"]),
```

---

### Story 2.4: Company Management

**Priority**: HIGH  
**Estimated Effort**: 1 week  
**Status**: PENDING  
**Dependencies**: Epic 1 (companies table), Stories 2.0 (UI foundation), 2.2 (navigation)

#### Requirements
Implement comprehensive company management system allowing administrators to view, edit, and manage company information. This provides both administrative oversight and integration point with existing admin tools.

**Company Management Features**:
- **Company Information Display**: Current company details with edit capabilities
- **Navigation Integration**: Accessible from Company Administration menu group
- **Admin Tools Integration**: Also accessible from existing admin/company-settings path
- **Role-Based Access**: Available to company_admin and system_admin roles
- **Data Validation**: Company information validation and update handling

#### Acceptance Criteria
- [ ] **Company Details View**: Display current company information in readable format
- [ ] **Edit Company Form**: Allow editing of company name, settings, and configuration
- [ ] **Navigation Integration**: Add to new "Company Administration" navigation group
- [ ] **Admin Tools Access**: Maintain existing admin/company-settings route integration
- [ ] **Role-Based Access**: Only company_admin and system_admin can access/edit
- [ ] **Data Validation**: Proper validation for company information updates
- [ ] **Responsive Design**: Mobile-friendly company management interface

#### Technical Implementation
```typescript
// Company management interface (extends existing company schema)
interface CompanyManagement {
  // Basic company information (already exists in companies table)
  name: string;
  domain?: string;
  settings?: Record<string, any>;
  
  // Management-specific features
  administrativeSettings: {
    defaultParticipantStatus: "active" | "inactive";
    incidentEscalationRules: boolean;
    notificationPreferences: Record<string, boolean>;
  };
  
  // Access control
  canEdit: boolean; // Based on user role
  lastUpdated: number;
  updatedBy: Id<"users">;
}

// Navigation structure update
const companyAdministrationGroup = {
  id: 'company-admin',
  title: 'Company Administration',
  requiredRole: ['system_admin', 'company_admin', 'team_lead'],
  items: [
    {
      id: 'participants',
      label: 'Participants',
      icon: '👥',
      href: '/participants',
    },
    {
      id: 'company-management',
      label: 'Company Management',
      icon: '🏢',
      href: '/company-management',
      requiredRole: ['system_admin', 'company_admin'],
    },
  ],
};
```

#### Integration Points
- **Existing Admin Route**: `/admin/company-settings` continues to work, redirects or shares component
- **Navigation Menu**: New "Company Administration" group contains both Participants and Company Management
- **Companies Table**: Leverages existing company data structure from Epic 1
- **Authentication**: Uses existing role-based access control system

---

## Epic Success Criteria

### Functional Requirements
- [ ] **Complete Participant Management**: Full CRUD operations with role-based access
- [ ] **Company Isolation**: Perfect multi-tenant data separation
- [ ] **Data Integrity**: All participants properly associated with companies
- [ ] **Search & Filter**: Efficient participant discovery within company scope

### User Experience Requirements
- [ ] **Fast Onboarding**: <5 minutes to create participant record
- [ ] **Role Compliance**: 100% enforcement of creation permissions
- [ ] **Data Quality**: Zero orphaned or mis-associated participant records
- [ ] **Usability**: Intuitive interface for non-technical staff

### Quality Assurance
- [ ] **Data Validation**: Comprehensive field validation and error handling
- [ ] **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- [ ] **Performance**: <2 second response times for all operations
- [ ] **Security**: Proper authorization and audit trails

---

## Dependencies & Handoffs

### ✅ From Epic 1 - DEPENDENCY STATUS: SATISFIED
- **✅ Companies Table**: Multi-tenant company structure operational
- **✅ User Authentication**: Role-based access control working
- **✅ Database Infrastructure**: Convex backend ready for new tables
- **✅ UI Foundation**: Design system and components available

### To Epic 3 (Incident Capture Workflow)
- **Participant Selection**: Dropdown of company participants for incident metadata
- **Auto-Population**: Reporter information from authenticated user
- **Data Foundation**: Proper participant context for meaningful incident reports

---

## Technical Notes

### Missing Schema Elements
The current `apps/convex/schema.ts` is missing the `participants` table. Story 2.2 implementation will require:

1. **Schema Addition**: Add participants table with proper indexes
2. **Convex Functions**: CRUD operations for participant management  
3. **Permission Integration**: Role-based access control enforcement
4. **UI Components**: Participant management interface components

### Integration Points
- **Users Table**: Already has `company_id` field for proper association
- **Companies Table**: Already exists and functional
- **Incidents Table**: Already has `participant_name` field (will be enhanced with participant selection)

---

This epic establishes the foundational entity relationships required for meaningful incident reporting in Epic 3, ensuring proper data context and multi-tenant isolation.