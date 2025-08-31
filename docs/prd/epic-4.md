# Epic 4: Incident Management & Listing

## Epic Overview

**Goal**: Implement comprehensive incident listing and management capabilities that enable both Team Leaders and Frontline Workers to view, filter, and manage incidents through two strategic entry points - a dedicated incidents page and workflow continuation prompts.

**Duration**: 2-3 weeks  
**Team Size**: 2-3 developers (full-stack focus)  
**Dependencies**: Epic 1 (Data Foundation), Epic 2 (Entity Management), Epic 3 (Incident Capture)  
**Enables**: Epic 5 (Analysis Workflow), improved workflow continuity, incident oversight

---

## Business Context

Epic 4 solves critical workflow gaps that emerge as incident volume scales. Without proper incident management, captured incidents become lost, team leaders lack oversight capabilities, and frontline workers struggle to resume incomplete work. This epic transforms individual incident capture into systematic incident management.

**Key Business Drivers**:
- **Workflow Continuity**: Frontline workers can easily resume incomplete incident captures
- **Management Oversight**: Team leaders gain visibility into all company incidents for proper supervision
- **Process Efficiency**: Reduces duplicate incident creation and abandoned workflows
- **Scalability Foundation**: Enables systematic incident processing as volume grows

**User Problems Solved**:
- **Frontline Worker**: "I started an incident yesterday but can't find it" → Clear personal incident access
- **Team Leader**: "I need to see all incidents to manage team workload" → Comprehensive incident dashboard
- **Organization**: "Incidents are getting lost between capture and analysis" → Systematic workflow bridging

---

## Story Breakdown

### Story 4.1: Incident Listing Foundation

**Priority**: CRITICAL  
**Epic**: Epic 4  
**Estimated Effort**: 1 week  

**User Story**: As a **Team Leader or Frontline Worker**, I need to view a list of incidents relevant to my role with appropriate filtering and search capabilities, so that I can effectively manage and track incident workflows.

**Business Value**: Provides the foundational incident management interface that enables both oversight and personal workflow management.

**Acceptance Criteria**:
1. **Multi-Tenant Data Isolation (CRITICAL)**
   - Team Leaders see ALL incidents within their company ONLY (company-scoped)
   - Frontline Workers see ONLY their own incidents within their company
   - **NO cross-company data visibility** under any circumstances
   - All database queries MUST include `companyId` filtering

2. **Incident List Interface** (`/incidents` page)
   - Responsive table/list showing incident summaries
   - Key fields: Participant, Reporter, Date, Status, Last Modified
   - Status indicators (Draft, Step X of 7, Completed, etc.)
   - Click-through navigation to individual incidents

3. **Search and Filtering**
   - Text search across incident content and metadata
   - Filter by Status (Draft, In Progress, Completed)
   - Filter by Date Range (Last Week, Month, Custom)
   - **Team Leader Only**: Filter by Participant, Filter by Frontline Worker
   - Clear/reset all filters functionality

4. **Sorting and Pagination**
   - Sort by Date (newest/oldest), Status, Participant, Reporter
   - Pagination for large incident lists (50 per page default)
   - Performance optimization for 100+ incidents

### Story 4.2: Workflow Continuation System

**Priority**: HIGH  
**Epic**: Epic 4  
**Estimated Effort**: 4-5 days  

**User Story**: As a **Frontline Worker**, when I visit the new incident page, I want to see my incomplete incidents and choose to continue existing work or start fresh, so that I don't create duplicate incidents or lose progress on partially completed work.

**Business Value**: Prevents workflow abandonment and duplicate incident creation while providing seamless workflow continuation.

**Acceptance Criteria**:
1. **Conditional Modal Display Logic**
   - Modal triggered **ONLY** when Frontline Worker has incomplete incidents
   - If no incomplete incidents exist → Direct to new incident creation (no modal)
   - If incomplete incidents exist → Show "Continue Existing" vs "Start New Incident" modal
   - Improves UX by eliminating unnecessary modal interruption

2. **Personal Incident Preview**
   - Incident summary cards showing: Participant, Date Started, Current Step
   - Progress indicator (e.g., "Step 3 of 7 - During Event Narrative")
   - Last modified timestamp for context
   - Quick preview of incident content (first 100 characters)

3. **Seamless Workflow Integration**
   - "Continue" button resumes exact workflow step where user left off
   - "Start New" proceeds to fresh incident creation
   - "Maybe Later" option closes modal and allows normal navigation
   - Modal can be bypassed with URL parameter for power users

4. **Performance and UX**
   - Modal loads quickly (<1 second) with minimal data
   - Mobile-responsive design for field workers
   - Keyboard navigation support (Enter to continue, Esc to close)

### Story 4.3: Incident Status Management

**Priority**: MEDIUM  
**Epic**: Epic 4  
**Estimated Effort**: 3 days  

**User Story**: As a **Team Leader or Frontline Worker**, I need clear incident status indicators and progress tracking so that I can understand workflow state and manage incident completion effectively.

**Business Value**: Provides workflow transparency and enables proper incident lifecycle management.

**Acceptance Criteria**:
1. **Status Classification System**
   - **Draft**: Metadata started but incomplete
   - **Step X of 7**: Clear progress through incident capture workflow
   - **Completed**: All 7 steps finished, ready for analysis handoff
   - **In Analysis**: Handed off to team leader (Epic 5 preparation)
   - **Closed**: Analysis complete (Epic 5 functionality)

2. **Progress Indicators**
   - Visual progress bars showing completion percentage
   - Step-by-step completion checkmarks
   - Time-based indicators (started 2 hours ago, completed yesterday)
   - Color-coded status badges (Draft=gray, In Progress=blue, Complete=green)

3. **Status Transition Logic**
   - Automatic status updates based on workflow progression
   - Manual status overrides for team leaders (edge cases)
   - Audit logging for all status changes
   - Real-time status updates across user sessions

### Story 4.4: Incident Click-Through Actions

**Priority**: HIGH  
**Epic**: Epic 4  
**Estimated Effort**: 3-4 days  

**User Story**: As a **Team Leader or Frontline Worker**, I need clear action buttons for each incident so I can view details, continue work, or start analysis based on my role and the incident status.

**Business Value**: Enables complete incident workflow management by providing role-appropriate actions for every incident interaction.

**Acceptance Criteria**:
1. **Role-Based Action Buttons**
   - **Frontline Worker + Incomplete Incident**: "Continue Work" button
   - **Frontline Worker + Complete Incident**: "View Incident" button (read-only)
   - **Team Leader + Any Incident**: "View Incident" button (read-only)
   - **Team Leader + Complete Incident**: Additional "Start Analysis" button

2. **Action Button Implementation**
   - "Continue Work" → Routes to `/new-incident?id=[incidentId]` (resumes at exact step)
   - "View Incident" → Routes to `/incidents/[id]` (read-only incident preview)
   - "Start Analysis" → Routes to `/analysis/[id]` (Epic 5 will implement this page)

3. **Read-Only Incident Preview**
   - New `/incidents/[id]` route displaying consolidated incident report
   - Reuses existing Step 8 consolidated report component in read-only mode
   - Shows complete incident: metadata, narratives, Q&A, enhanced content
   - Same view for both Team Leaders and Frontline Workers

4. **Epic 5 Integration Preparation**
   - "Start Analysis" button created by Epic 4
   - Routes to `/analysis/[id]` (Epic 5 implements actual analysis interface)
   - Clean separation: Epic 4 creates entry point, Epic 5 creates functionality

---

## Technical Requirements

### Backend API Extensions

**New Convex Queries**:
```typescript
// Team Leader - All company incidents (COMPANY-SCOPED ONLY)
getAllCompanyIncidents(companyId, filters, pagination)
// MUST verify user belongs to companyId before returning data

// Frontline Worker - Personal incidents only (COMPANY-SCOPED)  
getMyIncidents(userId, includeCompleted: boolean)
// MUST verify user.companyId and filter by both userId AND companyId

// Workflow continuation helper (COMPANY-SCOPED)
getMyIncompleteIncidents(userId) 
// MUST verify user.companyId and filter accordingly

// Status management (COMPANY-SCOPED)
updateIncidentStatus(incidentId, newStatus, userId)
// MUST verify incident.companyId matches user.companyId
```

**Database Schema Extensions**:
- Incident status field with defined enum values
- Progress tracking fields (current_step, completion_percentage)
- Last activity timestamp for sorting and filtering
- Search indexing for text-based filtering

### Frontend Components

**Incident List Components**:
- `IncidentListPage` - Main incidents listing page
- `IncidentTable` - Reusable table component with sorting/filtering
- `IncidentStatusBadge` - Status indicator component
- `IncidentFilters` - Filter sidebar/panel component

**Workflow Continuation Components**:
- `ContinueWorkflowModal` - Popup for new incident page
- `PersonalIncidentCard` - Incomplete incident preview cards
- `WorkflowProgressIndicator` - Visual progress tracking

### Integration Points

**Navigation Integration**:
- Add `/incidents` to main navigation menu (both roles)
- Integrate modal trigger in existing `/new-incident` page
- Breadcrumb navigation for incident detail views

**Permission Layer Integration**:
- Extend existing role-based access control with company boundaries
- **CRITICAL**: All queries MUST enforce company-scoped data filtering
- Multi-tenant isolation verification at API level (no cross-company leakage)
- Audit logging integration tracking company-scoped incident access
- Database indexes on (companyId, status) for efficient company-scoped queries

**Real-Time Updates**:
- Live status updates when incidents change
- Notification system for team leaders (incident completion alerts)
- Collaborative filtering updates (multiple team leaders)

---

## Success Metrics

### User Adoption Metrics
- **Incident List Usage**: >80% of team leaders use `/incidents` weekly
- **Workflow Continuation**: >60% of incomplete incidents resumed vs. abandoned
- **Duplicate Reduction**: <5% duplicate incidents created (vs baseline)

### Performance Metrics
- **Page Load Time**: Incident list loads in <2 seconds for 100+ incidents
- **Search Response**: Filter/search results in <500ms
- **Modal Load Time**: Continue workflow modal in <1 second

### Business Impact Metrics
- **Workflow Completion Rate**: Increased incident completion (target: >90%)
- **Management Efficiency**: Team leaders can review incident status 50% faster
- **Process Compliance**: Reduced lost/abandoned incidents by 75%

---

## Epic Dependencies

### Prerequisites (Must Be Complete)
- **Epic 1**: Database schema and authentication system
- **Epic 2**: User management and company relationships
- **Epic 3**: Complete incident capture workflow with status tracking

### Enables Future Work
- **Epic 5**: Team leaders can identify incidents ready for analysis
- **Analytics Features**: Foundation for incident volume and completion analytics
- **Bulk Operations**: Framework for multi-incident management

### Integration Considerations
- **Mobile Responsiveness**: Critical for frontline workers using mobile devices
- **Real-Time Sync**: Incidents must stay synchronized across user sessions
- **Audit Compliance**: All incident access and status changes must be logged
- **Multi-Tenant Security**: Company isolation must be bulletproof with no edge cases
- **Performance at Scale**: Company-scoped queries must perform well with 1000+ incidents

---

## Risk Analysis

### Technical Risks
- **Performance at Scale**: Large incident lists may impact page performance
  - *Mitigation*: Implement pagination, lazy loading, and database indexing
- **Real-Time Sync Complexity**: Status updates across multiple users
  - *Mitigation*: Leverage existing Convex real-time infrastructure

### User Experience Risks  
- **Modal Interruption**: Continue workflow modal may frustrate power users
  - *Mitigation*: Provide bypass option and remember user preference
- **Filter Confusion**: Different filtering for different roles
  - *Mitigation*: Clear UI indicators and role-appropriate help text

### Business Risks
- **Workflow Disruption**: Changes to existing `/new-incident` flow
  - *Mitigation*: Phased rollout with opt-out during testing period
- **Data Visibility Conflicts**: Team leader vs worker visibility expectations
  - *Mitigation*: Clear role-based permissions documentation and training

---

## Definition of Done

### Story Completion Criteria
- [ ] All acceptance criteria tested and verified
- [ ] Role-based permissions working correctly
- [ ] Mobile responsive design tested on iOS and Android
- [ ] Performance benchmarks met (<2 sec load, <500ms search)
- [ ] Integration testing with existing Epic 1-3 functionality

### Epic Completion Criteria
- [ ] Team leaders can effectively manage all company incidents
- [ ] Frontline workers can seamlessly continue incomplete work
- [ ] No regression in existing incident capture workflow (Epic 3)
- [ ] Documentation updated (user guides, API docs, architecture)
- [ ] Stakeholder acceptance testing completed with real user scenarios

---

## Implementation Strategy

### Phase 1: Foundation (Story 4.1)
- Build incident listing backend queries
- Create basic incident list UI with filtering
- Implement role-based data visibility
- Test with existing incident data

### Phase 2: Workflow Integration (Story 4.2)  
- Add continue workflow modal to `/new-incident`
- Test workflow continuation seamlessly
- Optimize for mobile device usage
- User acceptance testing with frontline workers

### Phase 3: Status & Polish (Story 4.3)
- Enhance status tracking and indicators
- Performance optimization for scale
- Final integration testing
- Documentation and training materials

This epic successfully bridges individual incident management (Epic 3) with systematic incident oversight, creating the foundation needed for effective analysis workflows (Epic 5).

---

*Epic 4 transforms SupportSignal from individual incident capture tool to comprehensive incident management platform, enabling scale and systematic workflow progression.*