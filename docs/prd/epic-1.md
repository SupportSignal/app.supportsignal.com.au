# Epic 1: Data Foundation & Backend Setup

> **Quick Navigation:** [1.1](#story-11-convex-database-implementation) · [1.2](#story-12-ai-service-integration) · [1.3](#story-13-user-authentication--permissions) · [1.4](#story-14-core-api-layer) · [1.5](#story-15-ui-design-system-foundation) · [1.6](#story-16-remove-betterauth-dependencies)

## Epic Overview

**Goal**: Establish the complete data infrastructure, AI integration services, and authentication system that powers both incident capture and analysis workflows in SupportSignal.

**Duration**: 2-3 weeks  
**Team Size**: 2-3 developers (backend focus)  
**Dependencies**: None (foundational epic)  
**Enables**: All subsequent platform functionality

---

## Business Context

Epic 1 creates the invisible but critical foundation that enables SupportSignal's core value proposition. Without robust data infrastructure, AI integration, and secure authentication, the user-facing workflows in subsequent epics cannot deliver the reliability and compliance requirements NDIS providers demand.

**Key Business Drivers**:
- **Compliance Foundation**: Audit-ready data structure with complete change tracking
- **AI-First Architecture**: Scalable AI integration supporting multiple workflows
- **Multi-Tenant Security**: Role-based access supporting different organizational structures
- **Real-Time Collaboration**: Live workflow handoffs between frontline workers and team leaders

---

## Quick Navigation

**Stories in this Epic:**
- [Story 1.1: Convex Database Implementation](#story-11-convex-database-implementation) - 📋 **Planned** (Critical)
- [Story 1.2: AI Service Integration](#story-12-ai-service-integration) - 📋 **Planned** (Critical)
- [Story 1.3: User Authentication & Permissions](#story-13-user-authentication--permissions) - 📋 **Planned** (Critical)
- [Story 1.4: Core API Layer](#story-14-core-api-layer) - 📋 **Planned** (Critical)
- [Story 1.5: UI Design System Foundation](#story-15-ui-design-system-foundation) - 📋 **Planned** (Critical)
- [Story 1.6: Remove BetterAuth Dependencies](#story-16-remove-betterauth-dependencies) - 📋 **Planned** (High)

---

## Story Breakdown

### Story 1.1: Convex Database Implementation

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Dependencies**: Convex environment setup

#### Requirements
Implement comprehensive Convex database schema supporting the complete incident lifecycle from initial report through analysis completion.

**Core Tables**:
- **incidents**: Primary incident records with metadata and workflow status
- **incidentNarratives**: Multi-phase narrative content with AI enhancements
- **clarificationQuestions**: AI-generated questions organized by narrative phase
- **clarificationAnswers**: User responses to AI-generated questions
- **incidentAnalysis**: Contributing conditions analysis and AI-generated insights
- **incidentClassifications**: Incident types, severity, and confidence scores
- **users**: User accounts with roles and organizational attribution
- **userSessions**: Session management and workflow state tracking
- **aiPrompts**: Versioned AI prompts with performance tracking
- **aiRequestLogs**: Complete AI request/response audit trail
- **systemSettings**: Platform configuration and feature flags
- **activityLogs**: Comprehensive user action audit trail

#### Acceptance Criteria
- [ ] All 12 tables implemented with proper TypeScript definitions
- [ ] Convex validators for all data inputs with comprehensive error messages
- [ ] Database indexes optimized for workflow queries and reporting
- [ ] Seed data for development and testing environments
- [ ] Data relationship integrity enforced at database level
- [ ] Migration scripts for schema updates during development

#### Technical Notes
```typescript
// Example: incidents table structure
export const incidents = defineTable({
  // Core Metadata
  reporterName: v.string(),
  participantName: v.string(), 
  eventDateTime: v.string(),
  location: v.string(),
  
  // Workflow Status
  captureStatus: v.union(v.literal("draft"), v.literal("in_progress"), v.literal("completed")),
  analysisStatus: v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed")),
  overallStatus: v.union(v.literal("capture_pending"), v.literal("analysis_pending"), v.literal("completed")),
  
  // Audit Fields
  createdAt: v.number(),
  createdBy: v.id("users"),
  updatedAt: v.number(),
  
  // Data Quality Tracking
  narrativeHash: v.optional(v.string()),
  questionsGenerated: v.boolean(),
  narrativeEnhanced: v.boolean(),
  analysisGenerated: v.boolean(),
})
.index("by_status", ["overallStatus"])
.index("by_reporter", ["reporterName"])
.index("by_created", ["createdAt"]);
```

---

### Story 1.2: AI Service Integration

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Dependencies**: Story 1.1 (AI request logging)

#### Requirements
Build comprehensive AI integration layer supporting the four core AI operations: clarification question generation, narrative enhancement, contributing conditions analysis, and incident classification.

**AI Operations**:
1. **Generate Clarification Questions**: Context-aware questions based on narrative content
2. **Enhance Narrative Content**: Combine original narratives with clarification answers
3. **Analyze Contributing Conditions**: Generate analysis of incident contributing factors
4. **Generate Classification Suggestions**: Suggest incident types and severity levels

#### Acceptance Criteria
- [ ] Convex actions for all four AI operations with proper error handling
- [ ] AI prompt management system with versioning and A/B testing capabilities
- [ ] Request/response logging with performance metrics and cost tracking
- [ ] Fallback mechanisms for AI service failures (retry logic, degraded functionality)
- [ ] Rate limiting and cost controls to prevent API abuse
- [ ] Integration with both OpenAI GPT-4 and Anthropic Claude for redundancy

#### Technical Implementation
```typescript
// Example: AI clarification questions action
export const generateClarificationQuestions = action({
  args: {
    incidentId: v.id("incidents"),
    narrativePhase: v.union(v.literal("before"), v.literal("during"), v.literal("end"), v.literal("post")),
    narrativeContent: v.string(),
  },
  handler: async (ctx, { incidentId, narrativePhase, narrativeContent }) => {
    // Retrieve incident metadata for context
    const incident = await ctx.runQuery(api.incidents.getById, { id: incidentId });
    
    // Construct AI prompt with context
    const prompt = buildClarificationPrompt(incident, narrativePhase, narrativeContent);
    
    // Execute AI request with logging
    const aiResponse = await executeAIRequest(ctx, {
      promptType: "clarification_questions",
      prompt,
      model: "gpt-4",
      incidentId,
    });
    
    // Parse and store questions
    const questions = parseQuestionsResponse(aiResponse);
    await ctx.runMutation(api.clarificationQuestions.create, {
      incidentId,
      phase: narrativePhase,
      questions,
      generatedAt: Date.now(),
    });
    
    return questions;
  },
});
```

---

### Story 1.3: User Authentication & Permissions

**Priority**: HIGH  
**Estimated Effort**: 1 week  
**Dependencies**: Story 1.1 (users table)

#### Requirements
Implement secure authentication system with role-based access control supporting the distinct user types and their workflow permissions in the SupportSignal platform.

**User Roles**:
- **Frontline Worker**: Can create and capture incidents, view their own incidents
- **Team Leader**: Can analyze incidents, view team incidents, access reporting features  
- **Administrator**: Full system access, user management, system configuration

**Permission Matrix**:
| Action | Frontline Worker | Team Leader | Administrator |
|--------|------------------|-------------|---------------|
| Create Incident | ✅ | ✅ | ✅ |
| Edit Own Incident (capture phase) | ✅ | ❌ | ✅ |
| View Team Incidents | ❌ | ✅ | ✅ |
| Perform Analysis | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| System Configuration | ❌ | ❌ | ✅ |

#### Acceptance Criteria
- [ ] Convex Auth integration with secure session management
- [ ] Role-based middleware for API endpoint protection
- [ ] User registration and invitation workflow for administrators
- [ ] Session persistence with workflow state recovery
- [ ] Password requirements and account security measures
- [ ] Audit logging for all authentication and authorization events

---

### Story 1.4: Core API Layer

**Priority**: CRITICAL  
**Estimated Effort**: 1 week  
**Dependencies**: Stories 1.1, 1.2, 1.3

#### Requirements
Implement comprehensive Convex queries, mutations, and actions that provide the complete API surface for both capture and analysis workflows.

**API Categories**:

##### Incident Management APIs
- `incidents.create`: Create new incident with metadata validation
- `incidents.getById`: Retrieve incident with user permission checking
- `incidents.listByUser`: List incidents accessible to current user
- `incidents.updateStatus`: Update workflow status with state validation
- `incidents.delete`: Soft delete with audit trail preservation

##### Narrative Management APIs
- `narratives.create`: Initialize narrative content for new incident
- `narratives.update`: Update narrative phase content with auto-save
- `narratives.enhance`: Apply AI-enhanced content to narratives
- `narratives.getConsolidated`: Retrieve complete narrative for analysis

##### Analysis APIs
- `analysis.create`: Initialize analysis workflow for incident
- `analysis.update`: Update contributing conditions analysis
- `analysis.generateClassifications`: Create AI-powered incident classifications
- `analysis.complete`: Finalize analysis and mark incident complete

##### User & Session APIs
- `users.getCurrent`: Get current user profile and permissions
- `sessions.updateWorkflowState`: Persist wizard step progress
- `sessions.recoverState`: Restore user's workflow state after login

#### Acceptance Criteria
- [ ] All API endpoints implemented with proper TypeScript definitions
- [ ] Input validation using Convex validators with meaningful error messages
- [ ] Permission checking integrated into all queries and mutations
- [ ] Real-time subscriptions for workflow handoffs and collaborative features
- [ ] Comprehensive error handling with user-friendly messages
- [ ] API documentation with examples for frontend integration

#### Technical Pattern Example
```typescript
// Example: Incident creation with full validation and audit trail
export const createIncident = mutation({
  args: {
    reporterName: v.string(),
    participantName: v.string(),
    eventDateTime: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user permissions
    const currentUser = await getCurrentUser(ctx);
    if (!canCreateIncident(currentUser)) {
      throw new ConvexError("Insufficient permissions to create incident");
    }
    
    // Validate input data
    validateIncidentMetadata(args);
    
    // Create incident record
    const incidentId = await ctx.db.insert("incidents", {
      ...args,
      captureStatus: "draft",
      analysisStatus: "not_started", 
      overallStatus: "capture_pending",
      createdAt: Date.now(),
      createdBy: currentUser._id,
      updatedAt: Date.now(),
      questionsGenerated: false,
      narrativeEnhanced: false,
      analysisGenerated: false,
    });
    
    // Initialize empty narrative structure
    await ctx.db.insert("incidentNarratives", {
      incidentId,
      beforeEvent: "",
      duringEvent: "", 
      endEvent: "",
      postEvent: "",
      createdAt: Date.now(),
    });
    
    // Log creation activity
    await ctx.db.insert("activityLogs", {
      userId: currentUser._id,
      action: "incident_created",
      resourceType: "incident",
      resourceId: incidentId,
      timestamp: Date.now(),
    });
    
    return incidentId;
  },
});
```

---

### Story 1.5: UI Design System Foundation

**Priority**: HIGH  
**Estimated Effort**: 3-4 days  
**Dependencies**: Analysis of NDIS system screenshots and patterns

#### Requirements
Establish comprehensive UI design system and React component specifications based on proven patterns from the NDIS Assistant system, providing the foundation for both incident capture and analysis workflows.

**Core Design System Elements**:

##### Incident Management APIs
- `incidents.create`: Create new incident with metadata validation
- `incidents.getById`: Retrieve incident with user permission checking
- `incidents.listByUser`: List incidents accessible to current user
- `incidents.updateStatus`: Update workflow status with state validation
- `incidents.delete`: Soft delete with audit trail preservation

##### Narrative Management APIs
- `narratives.create`: Initialize narrative content for new incident
- `narratives.update`: Update narrative phase content with auto-save
- `narratives.enhance`: Apply AI-enhanced content to narratives
- `narratives.getConsolidated`: Retrieve complete narrative for analysis

##### Analysis APIs
- `analysis.create`: Initialize analysis workflow for incident
- `analysis.update`: Update contributing conditions analysis
- `analysis.generateClassifications`: Create AI-powered incident classifications
- `analysis.complete`: Finalize analysis and mark incident complete

##### User & Session APIs
- `users.getCurrent`: Get current user profile and permissions
- `sessions.updateWorkflowState`: Persist wizard step progress
- `sessions.recoverState`: Restore user's workflow state after login

#### Acceptance Criteria
- [ ] All API endpoints implemented with proper TypeScript definitions
- [ ] Input validation using Convex validators with meaningful error messages
- [ ] Permission checking integrated into all queries and mutations
- [ ] Real-time subscriptions for workflow handoffs and collaborative features
- [ ] Comprehensive error handling with user-friendly messages
- [ ] API documentation with examples for frontend integration

#### Technical Pattern Example
```typescript
// Example: Incident creation with full validation and audit trail
export const createIncident = mutation({
  args: {
    reporterName: v.string(),
    participantName: v.string(),
    eventDateTime: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user permissions
    const currentUser = await getCurrentUser(ctx);
    if (!canCreateIncident(currentUser)) {
      throw new ConvexError("Insufficient permissions to create incident");
    }
    
    // Validate input data
    validateIncidentMetadata(args);
    
    // Create incident record
    const incidentId = await ctx.db.insert("incidents", {
      ...args,
      captureStatus: "draft",
      analysisStatus: "not_started", 
      overallStatus: "capture_pending",
      createdAt: Date.now(),
      createdBy: currentUser._id,
      updatedAt: Date.now(),
      questionsGenerated: false,
      narrativeEnhanced: false,
      analysisGenerated: false,
    });
    
    // Initialize empty narrative structure
    await ctx.db.insert("incidentNarratives", {
      incidentId,
      beforeEvent: "",
      duringEvent: "", 
      endEvent: "",
      postEvent: "",
      createdAt: Date.now(),
    });
    
    // Log creation activity
    await ctx.db.insert("activityLogs", {
      userId: currentUser._id,
      action: "incident_created",
      resourceType: "incident",
      resourceId: incidentId,
      timestamp: Date.now(),
    });
    
    return incidentId;
  },
});
```

---

### Story 1.6: Remove BetterAuth Dependencies

**Priority**: LOW
**Estimated Effort**: 2-3 hours
**Dependencies**: Story 1.3 (Convex Auth working correctly)

#### Requirements
Remove all remaining BetterAuth references and dependencies from the codebase following the decision to use Convex Auth instead of BetterAuth for authentication.

**Context**: An attempted migration to BetterAuth (Story 1.6 original) was abandoned after discovering the existing Convex Auth system already provided all required functionality. This cleanup story removes the minimal BetterAuth artifacts that remain.

**Current BetterAuth Remnants**:
- Package dependency: `better-auth: ^1.2.12` in `apps/web/package.json`
- Environment variable: `BETTER_AUTH_SECRET` in configuration
- Config references in `apps/web/lib/config.ts`
- Schema comments mentioning "BetterAuth" in `apps/convex/schema.ts`
- Documentation references (19 files - to be updated with historical context)

#### Acceptance Criteria
- [ ] All BetterAuth code references removed from active codebase
- [ ] `better-auth` package removed from `package.json`
- [ ] Environment variables cleaned from `.env.local` and sync source
- [ ] Config file cleaned of unused `betterAuthSecret` and `betterAuthUrl` exports
- [ ] Schema comments updated to remove "BetterAuth" terminology
- [ ] All authentication methods verified working (email/password, GitHub OAuth, Google OAuth)
- [ ] No TypeScript errors or build failures after removal
- [ ] Documentation updated to reflect Convex Auth as chosen solution

#### Technical Implementation - 4 Phases

**Phase 1: Remove Unused Code References** (Safe, No Functional Impact)
```typescript
// apps/web/lib/config.ts - Remove these exports:
betterAuthSecret: process.env.BETTER_AUTH_SECRET,  // DELETE
betterAuthUrl: process.env.BETTER_AUTH_URL,        // DELETE

// apps/convex/schema.ts - Update comments:
// Line 45: "BetterAuth sessions table" → "Sessions table for user authentication"
// Line 55: "BetterAuth accounts table" → "OAuth accounts table for GitHub/Google"
```

**Phase 2: Remove Environment Variables** (Low Risk)
- Remove `BETTER_AUTH_SECRET` from `apps/web/.env.local`
- Remove from environment sync source if present

**Phase 3: Remove Package Dependency** (Medium Risk)
```json
// apps/web/package.json - Remove:
"better-auth": "^1.2.12"  // DELETE
```
- Run `bun install` to update lockfile
- Verify build succeeds

**Phase 4: Update Documentation** (Archival) - ✅ COMPLETED
- ✅ Historical note added to Epic 1
- ✅ All BetterAuth artifacts removed from codebase
- ✅ Story docs preserved for audit trail

**Historical Note**: Story 1.6 originally planned a BetterAuth migration, but was abandoned after discovering Convex Auth already provided all required functionality (email/password, GitHub OAuth, Google OAuth). This cleanup story (also 1.6) removed the minimal BetterAuth artifacts that remained from the exploration.

#### Test Strategy
**Before Each Phase**:
- Verify email/password login works
- Verify GitHub OAuth works
- Verify Google OAuth works
- Run `bun run typecheck` and `bun run lint`

**After Each Phase**:
- Re-verify all authentication methods
- Re-run typecheck and lint
- Test both dev and production builds

**Rollback**: Simple `git revert` for each phase if issues discovered

---

## Epic Success Criteria

### Technical Validation
- [ ] **Database Performance**: All queries complete in <500ms with realistic data volumes
- [ ] **AI Integration**: 95%+ success rate for AI requests with proper error handling
- [ ] **Authentication Security**: Passes security audit for role-based access control
- [ ] **API Completeness**: 100% coverage of user workflow requirements

### Business Validation  
- [ ] **Data Integrity**: Zero data loss scenarios during concurrent user operations
- [ ] **Audit Compliance**: Complete audit trail meets NDIS reporting requirements
- [ ] **Scalability**: Infrastructure supports 100+ concurrent users
- [ ] **Cost Efficiency**: AI integration costs <$10/incident for realistic usage patterns

### Integration Readiness
- [ ] **Frontend Ready**: All APIs documented and tested for frontend integration
- [ ] **Real-Time Functional**: Workflow handoffs trigger real-time updates correctly
- [ ] **Error Handling**: Graceful degradation for all failure scenarios
- [ ] **Development Experience**: Clear documentation and examples for Epic 2/3 teams

---

## Risks & Mitigation

### Technical Risks
**Risk**: AI service reliability and cost overruns  
**Mitigation**: Implement comprehensive fallback mechanisms and cost monitoring with circuit breakers

**Risk**: Convex platform limitations for complex queries  
**Mitigation**: Design data model optimized for Convex capabilities, implement caching strategies

**Risk**: Real-time performance under load  
**Mitigation**: Load testing during development, optimize subscriptions and query patterns

### Business Risks  
**Risk**: Compliance requirements changes during development  
**Mitigation**: Flexible audit logging system, regular compliance review checkpoints

**Risk**: User permission complexity affects development velocity  
**Mitigation**: Simple initial permission model with extensibility for future complexity

---

## Dependencies & Handoffs

### External Dependencies
- **Convex Environment**: Production and development environments configured
- **AI API Credentials**: OpenAI and Anthropic API keys with appropriate rate limits
- **Domain Knowledge**: NDIS compliance requirements and incident reporting standards

### Epic Completion Handoffs
**To Epic 2 Team**:
- Complete API documentation with integration examples
- Test data and scenarios for capture workflow development
- Authentication system ready for user interface integration

**To Epic 3 Team**:
- Analysis APIs fully functional with sample data
- AI integration tested and reliable for analysis workflows
- User permission system supporting team leader analysis access

This foundation epic delivers the invisible but critical infrastructure that enables SupportSignal to provide reliable, compliant, and scalable incident reporting for NDIS service providers.