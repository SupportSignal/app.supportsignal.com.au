# Architectural Recreation: Proper Dependency Order

**Purpose**: Define the exact sequence and dependencies for recreating the SupportSignal architecture without the dependency order issues encountered in the original implementation.

**Based On**: KDD-to-Codebase Alignment Audit (2025-08-12)

---

## Critical Dependency Chain Analysis

### Original Implementation Issues Identified

🚨 **PRIMARY PROBLEM**: Story 3.4 (AI Prompt Management) was implemented before Epic 2 (Entity Management) completion, creating:
- Disconnected AI variable systems
- Incomplete integration testing capability  
- Circular dependency risks
- Difficult refactoring requirements

### Root Cause Analysis
1. **Story-Driven Development**: Implementation followed individual story completion rather than epic-level dependencies
2. **Incomplete Epic 2**: Entity management foundation was not fully verified before advanced features
3. **AI-First Approach**: Advanced AI systems implemented without proper entity context

---

## Phase-Based Recreation Strategy

## Phase 1: Absolute Foundation Layer
**Duration**: 3-4 weeks  
**CRITICAL**: No parallel work allowed - everything depends on this

### Phase 1.1: Database Schema & Multi-Tenancy (Week 1)
**STATUS**: ✅ **ALREADY COMPLETE** - Can be preserved

```
DEPENDENCY CHAIN:
└── Database Schema (Convex)
    ├── Multi-tenant companies table
    ├── Users table with roles
    ├── Session management tables
    └── Basic audit/logging tables

TESTING REQUIREMENT: 
✅ Database operations (all CRUD)
✅ Multi-tenant isolation verification
✅ Role-based access control
```

### Phase 1.2: Authentication & Authorization (Week 2)
**STATUS**: ✅ **ALREADY COMPLETE** - Can be preserved

```
DEPENDENCY CHAIN:
Database Schema → Authentication System
                 ├── BetterAuth integration
                 ├── Session token management
                 ├── Role-based permissions system
                 └── System admin impersonation

TESTING REQUIREMENT:
✅ Authentication flows (login/logout/register)
✅ Session persistence and timeout
✅ Role-based access control verification
✅ System admin privilege validation
```

### Phase 1.3: Core Infrastructure Services (Week 3-4)
**STATUS**: ✅ **ALREADY COMPLETE** - Can be preserved

```
DEPENDENCY CHAIN:
Auth System → Core Services
             ├── User management APIs
             ├── Company management APIs
             ├── Logging infrastructure (Redis + Workers)
             ├── Debug and monitoring systems
             └── Basic admin interfaces

TESTING REQUIREMENT:
✅ API endpoint functionality
✅ Multi-tenant data isolation
✅ Logging and observability
✅ Admin interface access control
```

## Phase 2: Entity Management Foundation  
**Duration**: 2-3 weeks  
**CRITICAL DEPENDENCY**: Phase 1 MUST be 100% complete and tested

### Phase 2.1: NDIS Participants System (Week 5-6)
**STATUS**: 🚨 **NEEDS VERIFICATION** - Schema exists, implementation unknown

```
DEPENDENCY CHAIN:
Core Infrastructure → Participants Management
                     ├── Participant CRUD operations (Convex)
                     ├── Company isolation for participants
                     ├── Participant data validation
                     └── Basic participant APIs

BLOCKING DEPENDENCIES:
✅ Multi-tenant company system (from Phase 1)
✅ User role system (from Phase 1) 
❓ Frontend participant management (NEEDS VERIFICATION)

TESTING REQUIREMENT BEFORE PROCEEDING:
🔍 Participant CRUD operations work correctly
🔍 Multi-tenant isolation prevents cross-company access
🔍 Role-based access (only authorized users can manage participants)
🔍 Data validation and error handling
```

### Phase 2.2: Participant Management UI (Week 6-7)
**STATUS**: ❓ **UNKNOWN** - Requires investigation

```
DEPENDENCY CHAIN:
Participant APIs → Participant UI Components
                  ├── Participant list/search interface
                  ├── Participant creation/editing forms
                  ├── Company-scoped participant management
                  └── Role-based UI access control

CRITICAL TESTING BEFORE PHASE 3:
🔍 UI components properly filter by company
🔍 Role restrictions work in frontend
🔍 Participant selection components work
🔍 Data validation feedback in UI
```

## Phase 3: Basic Incident Management
**Duration**: 3-4 weeks  
**CRITICAL DEPENDENCY**: Phase 2 MUST be 100% complete

### Phase 3.1: Incident Metadata & Core Workflow (Week 8-9)
**STATUS**: 🟡 **FOUNDATION READY** - Schema complete, implementation needs verification

```
DEPENDENCY CHAIN:
Participants System → Basic Incident Management
                     ├── Incident CRUD operations
                     ├── Participant-to-incident relationships
                     ├── Workflow status management
                     └── Basic incident listing/filtering

CRITICAL DEPENDENCIES:
✅ Incident schema (from Phase 1)
✅ Participants system (from Phase 2) ← BLOCKING
❓ Incident UI components (NEEDS IMPLEMENTATION)

TESTING REQUIREMENT:
🔍 Incidents properly link to participants
🔍 Company isolation for incidents
🔍 Workflow status transitions
🔍 Role-based incident access
```

### Phase 3.2: Multi-Phase Narrative Collection (Week 9-10)
**STATUS**: 🟡 **SCHEMA READY** - Narrative tables exist, UI needs verification

```
DEPENDENCY CHAIN:
Basic Incidents → Narrative Management
                 ├── Multi-phase narrative CRUD
                 ├── Narrative-to-incident relationships  
                 ├── Version tracking and audit
                 └── Narrative editing interfaces

TESTING REQUIREMENT:
🔍 All four narrative phases can be collected
🔍 Narrative versioning works correctly
🔍 Audit trail for narrative changes
🔍 UI properly handles narrative phases
```

### Phase 3.3: Basic AI Integration (Week 11)
**STATUS**: 🟡 **INFRASTRUCTURE READY** - AI logging exists, integration needs work

```
DEPENDENCY CHAIN:
Narrative System → Basic AI Services
                  ├── AI service connection (OpenAI/Anthropic)
                  ├── Basic prompt resolution
                  ├── AI request/response logging
                  └── Error handling and fallbacks

TESTING REQUIREMENT:
🔍 AI services connect and respond correctly
🔍 Request/response logging works
🔍 Error handling provides graceful degradation
🔍 AI responses properly formatted
```

## Phase 4: Advanced AI Management (Final Phase)
**Duration**: 2-3 weeks  
**CRITICAL DEPENDENCY**: Phase 3 MUST be 100% complete

### Phase 4.1: AI Prompt System Integration (Week 12-13)
**STATUS**: ✅ **FULLY IMPLEMENTED** - Can be preserved and integrated

```
DEPENDENCY CHAIN:
Basic AI Services → Advanced Prompt Management
                   ├── Existing prompt template system ✅
                   ├── Variable system alignment with entities
                   ├── Runtime prompt resolution
                   └── Prompt usage analytics

CURRENT STATE ASSESSMENT:
✅ Prompt template CRUD system is enterprise-grade
✅ Variable substitution system is sophisticated  
✅ Caching and fallback mechanisms exist
✅ Admin interface is fully functional
🔍 NEEDS INTEGRATION: Variable alignment with participant/incident data
🔍 NEEDS TESTING: End-to-end workflow with resolved prompts
```

### Phase 4.2: Advanced AI Features (Week 13-14)
**STATUS**: 🟡 **READY FOR IMPLEMENTATION** - Foundation exists

```
DEPENDENCY CHAIN:
Prompt System → Advanced AI Features
               ├── Clarification question generation
               ├── Narrative enhancement  
               ├── Contributing conditions analysis
               └── Incident classification

INTEGRATION REQUIREMENTS:
🔧 Connect prompt templates to specific workflow steps
🔧 Ensure AI variables align with entity data structure  
🔧 Implement AI feature triggering based on incident state
🔧 Complete end-to-end testing with real data flow
```

---

## Critical Success Gates

### Gate 1: Foundation Complete (End of Phase 1)
**REQUIREMENT**: All core infrastructure must pass comprehensive testing
- [ ] Database operations work correctly across all tables
- [ ] Authentication flows are solid
- [ ] Multi-tenant isolation is verified
- [ ] Admin interfaces function properly
- [ ] Logging and monitoring operational

### Gate 2: Entities Ready (End of Phase 2)  
**REQUIREMENT**: Participant management must be production-ready
- [ ] Participants can be created, edited, deleted by authorized users
- [ ] Company isolation prevents cross-tenant access
- [ ] UI components properly restrict based on user roles
- [ ] Participant selection works in downstream components
- [ ] Data validation catches all error conditions

### Gate 3: Basic Workflow Complete (End of Phase 3)
**REQUIREMENT**: Incident capture workflow must be functional end-to-end
- [ ] Incidents can be created with participant relationships
- [ ] Multi-phase narratives can be collected and stored
- [ ] Workflow status transitions work correctly
- [ ] Basic AI integration responds to requests
- [ ] All company isolation and role restrictions function

### Gate 4: Advanced Features Integrated (End of Phase 4)
**REQUIREMENT**: AI prompt management must integrate seamlessly
- [ ] Prompt variables correctly substitute entity data
- [ ] AI features trigger at appropriate workflow points
- [ ] End-to-end incident capture and analysis workflow functions
- [ ] Performance meets requirements under realistic load
- [ ] Error handling gracefully manages all failure modes

---

## Testing Strategy for Each Phase

### Phase 1 Testing: Infrastructure Validation
```typescript
// Example critical test categories
describe("Multi-Tenant Infrastructure", () => {
  test("Company isolation prevents data leakage")
  test("Role-based access controls restrict operations")  
  test("Session management handles concurrent users")
  test("Authentication flows prevent unauthorized access")
})
```

### Phase 2 Testing: Entity Management
```typescript
describe("Participant Management", () => {
  test("Participants are company-scoped correctly")
  test("Role restrictions prevent unauthorized participant access")
  test("UI components respect participant visibility rules")
  test("Participant selection integrates with incident creation")
})
```

### Phase 3 Testing: Basic Workflow
```typescript  
describe("Incident Workflow", () => {
  test("Incident-to-participant relationships maintain data integrity")
  test("Multi-phase narrative collection preserves all content")
  test("Workflow transitions follow business rules")
  test("AI integration provides expected response formats")
})
```

### Phase 4 Testing: Advanced Integration
```typescript
describe("AI Prompt Integration", () => {
  test("Prompt variables correctly resolve entity data")
  test("AI features trigger at correct workflow stages") 
  test("End-to-end capture-to-analysis workflow completes")
  test("System gracefully handles AI service failures")
})
```

---

## Preservation Strategy for Existing Code

### Code to Preserve (High Quality)
✅ **Database Schema** (`apps/convex/schema.ts`) - Production ready  
✅ **AI Prompt Management** (`apps/convex/promptTemplates.ts`) - Enterprise grade  
✅ **Authentication System** (`apps/convex/auth.ts`) - Robust implementation  
✅ **Logging Infrastructure** - Advanced distributed logging  
✅ **Admin Interfaces** - Well-designed management components  

### Code to Verify Before Preservation
🔍 **Participant Management** - Schema exists, implementation status unknown  
🔍 **Incident UI Components** - May exist but integration needs verification  
🔍 **AI Service Integration** - Infrastructure exists, workflow integration unclear  

### Code to Implement Fresh
🆕 **Participant UI Components** - If missing or incomplete  
🆕 **Incident Capture Workflow** - UI components for narrative collection  
🆕 **AI Feature Integration** - Connecting prompts to workflow stages  

---

## Risk Mitigation

### High-Risk Dependencies
1. **Epic 2 Completion Status**: Must be thoroughly verified before Phase 3
2. **AI Integration Points**: Current AI prompt system may need refactoring for entity alignment
3. **UI Component Integration**: Frontend-backend integration may have gaps

### Mitigation Strategies  
1. **Comprehensive Phase Gates**: No phase can begin until previous phase passes all tests
2. **Incremental Integration**: Build integration points slowly with extensive testing
3. **Rollback Planning**: Preserve working implementations before modifications
4. **Parallel Environment**: Use separate development environment for recreation testing

---

## Success Metrics

### Phase Completion Criteria
- **Phase 1**: 100% infrastructure test coverage, all admin functions operational
- **Phase 2**: Participant management production-ready with role-based access
- **Phase 3**: Complete incident capture workflow with AI basic integration  
- **Phase 4**: Advanced AI features integrated with <2s response times

### Overall Success Indicators
- **Zero Dependency Violations**: No phase begins before prerequisites complete
- **Preserved Code Quality**: Existing high-quality implementations remain functional
- **Enhanced Testing**: Each phase has comprehensive automated test coverage
- **Production Readiness**: Final system ready for NDIS provider deployment

---

**Document Version**: 1.0  
**Based On**: Comprehensive codebase audit (2025-08-12)  
**Next Review**: After Phase 2 verification complete  
**Usage**: Follow this order EXACTLY to avoid original dependency issues