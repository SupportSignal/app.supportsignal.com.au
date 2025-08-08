# Story 1.4: Core API Layer Documentation

**Implementation Status**: ✅ **COMPLETED**  
**Date**: 2025-01-11  
**Version**: 1.0.0

## Overview

This document provides comprehensive API documentation for Story 1.4: Core API Layer, which implements a complete, normalized API surface for the SupportSignal incident management system with real-time collaboration features, comprehensive validation, and multi-tenant security.

## Architecture Summary

### Key Features Implemented

- ✅ **Schema Normalization**: Updated enum values from PascalCase to lowercase snake_case
- ✅ **Data Migration**: Automated migration for existing classification records
- ✅ **Complete API Surface**: Incident, Narrative, Analysis, User & Session APIs
- ✅ **Real-time Subscriptions**: Collaborative editing with live updates
- ✅ **Comprehensive Validation**: Zod schema validation with detailed error handling
- ✅ **Multi-tenant Security**: Role-based permissions with company isolation
- ✅ **Audit Logging**: Correlation ID tracking and comprehensive logging

### API Categories

1. **Incident Management APIs** - Core incident CRUD operations
2. **Narrative Management APIs** - Collaborative narrative editing
3. **Analysis APIs** - AI-powered incident analysis and classification
4. **User & Session APIs** - Authentication and session management
5. **Real-time Subscription APIs** - Live collaborative features

---

## 1. Incident Management APIs

### `incidents.create(args: CreateIncidentArgs): Mutation<Id<"incidents">>`

Creates a new incident with comprehensive validation.

**Arguments:**
```typescript
interface CreateIncidentArgs {
  sessionToken: string;
  reporter_name: string;     // 1-100 chars, required
  participant_name: string;  // 1-100 chars, required  
  event_date_time: string;   // ISO 8601 date, within 30 days past to 24 hours future
  location: string;          // 1-200 chars, required
}
```

**Returns:** `Id<"incidents">` - The created incident ID

**Validation Rules:**
- Reporter and participant names: 1-100 characters, trimmed
- Event date: Valid ISO 8601, within business rules (30 days past to 24 hours future)
- Location: 1-200 characters, trimmed
- Automatic sanitization of all text inputs

**Example:**
```typescript
const incidentId = await ctx.runMutation("incidents:create", {
  sessionToken: "user-session-token",
  reporter_name: "John Doe",
  participant_name: "Jane Smith", 
  event_date_time: "2025-01-11T10:30:00Z",
  location: "Main Cafeteria"
});
```

### `incidents.getById(args: GetIncidentArgs): Query<Incident | null>`

Retrieves incident by ID with proper access control.

**Arguments:**
```typescript
interface GetIncidentArgs {
  sessionToken: string;
  id: Id<"incidents">;
}
```

**Returns:** `Incident | null`

**Access Control:**
- Company-wide access: system_admin, company_admin, team_lead
- Own incidents only: frontline_worker
- Multi-tenant isolation enforced

### `incidents.listByUser(args: ListIncidentsArgs): Query<Incident[]>`

Lists incidents accessible to current user based on role.

**Arguments:**
```typescript
interface ListIncidentsArgs {
  sessionToken: string;
  overallStatus?: "capture_pending" | "analysis_pending" | "completed";
  limit?: number; // Default: 50, Max: 100
}
```

**Returns:** `Incident[]`

### `incidents.updateStatus(args: UpdateStatusArgs): Mutation<{success: true}>`

Updates incident workflow status with state validation.

**Arguments:**
```typescript
interface UpdateStatusArgs {
  sessionToken: string;
  id: Id<"incidents">;
  capture_status?: "draft" | "in_progress" | "completed";
  analysis_status?: "not_started" | "in_progress" | "completed";
}
```

**State Transition Rules:**
- Capture: draft → in_progress → completed
- Analysis: not_started → in_progress → completed
- Cannot start analysis until capture is completed
- Cannot transition backwards from completed states

### `incidents.subscribeToIncident(args: SubscribeIncidentArgs): Query<IncidentSubscription>`

Real-time subscription to incident updates for collaborative editing.

**Arguments:**
```typescript
interface SubscribeIncidentArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}
```

**Returns:**
```typescript
interface IncidentSubscription {
  incident: Incident;
  narrative: IncidentNarrative | null;
  analysis: IncidentAnalysis | null;
  classifications: IncidentClassification[];
  subscribedAt: number;
  correlationId: string;
}
```

---

## 2. Narrative Management APIs

### `narratives.create(args: CreateNarrativeArgs): Mutation<Id<"incident_narratives">>`

Creates initial narrative content for new incident.

**Arguments:**
```typescript
interface CreateNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}
```

**Returns:** `Id<"incident_narratives">` - The created narrative ID

### `narratives.update(args: UpdateNarrativeArgs): Mutation<{success: true, version: number}>`

Updates narrative phase content with auto-save and version tracking.

**Arguments:**
```typescript
interface UpdateNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
  before_event?: string;
  during_event?: string; 
  end_event?: string;
  post_event?: string;
}
```

**Validation:**
- At least one phase must be provided
- Each phase: 10-5000 characters when provided
- Automatic version increment
- Cannot edit after capture phase completion

### `narratives.enhance(args: EnhanceNarrativeArgs): Action<{success: true}>`

Applies AI-enhanced content to narratives (requires LLM access).

**Arguments:**
```typescript
interface EnhanceNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
  enhanced_before?: string;
  enhanced_during?: string;
  enhanced_end?: string;
  enhanced_post?: string;
}
```

**Returns:** `{success: true}`

**Requirements:**
- User must have ACCESS_LLM_FEATURES permission
- At least one enhanced phase must be provided
- Original narrative must exist

### `narratives.getConsolidated(args: GetNarrativeArgs): Query<ConsolidatedNarrative | null>`

Retrieves complete narrative with consolidated view for analysis.

**Arguments:**
```typescript
interface GetNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}
```

**Returns:**
```typescript
interface ConsolidatedNarrative {
  // ... narrative fields
  consolidated_narrative: string; // Auto-generated markdown format
}
```

### `narratives.subscribeToNarrative(args: SubscribeNarrativeArgs): Query<NarrativeSubscription>`

Real-time subscription to narrative updates for collaborative editing.

**Arguments:**
```typescript
interface SubscribeNarrativeArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}
```

---

## 3. Analysis APIs

### `analysis.create(args: CreateAnalysisArgs): Mutation<Id<"incident_analysis">>`

Initializes analysis workflow for incident.

**Arguments:**
```typescript
interface CreateAnalysisArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}
```

**Requirements:**
- PERFORM_ANALYSIS permission required
- Incident capture must be completed
- Cannot create if analysis already exists

### `analysis.update(args: UpdateAnalysisArgs): Mutation<{success: true, revision: number}>`

Updates contributing conditions analysis with revision tracking.

**Arguments:**
```typescript
interface UpdateAnalysisArgs {
  sessionToken: string;
  analysis_id: Id<"incident_analysis">;
  contributing_conditions: string; // 10-10000 chars, required
  analysis_status?: "draft" | "ai_generated" | "user_reviewed" | "completed";
}
```

**Validation:**
- Contributing conditions: 10-10000 characters, trimmed
- Cannot edit completed analysis
- Automatic revision counting and edit history

### `analysis.generateClassifications(args: GenerateClassificationsArgs): Action<GenerateClassificationsResult>`

Generates AI-powered incident classifications using normalized enum values.

**Arguments:**
```typescript
interface GenerateClassificationsArgs {
  sessionToken: string;
  analysis_id: Id<"incident_analysis">;
  prompt_override?: string;
}
```

**Returns:**
```typescript
interface GenerateClassificationsResult {
  success: true;
  classificationsCreated: number;
  classificationIds: Id<"incident_classifications">[];
}
```

**Generated Classifications:**
- Uses normalized enum values: `behavioural | environmental | medical | communication | other`
- Severity levels: `low | medium | high`
- Includes confidence scores (0-1) and supporting evidence
- Marks analysis status as "ai_generated"

### `analysis.complete(args: CompleteAnalysisArgs): Mutation<{success: true, classificationsCount: number, completedAt: number}>`

Finalizes analysis and marks incident complete.

**Arguments:**
```typescript
interface CompleteAnalysisArgs {
  sessionToken: string;
  analysis_id: Id<"incident_analysis">;
  completion_notes?: string;
}
```

**Requirements:**
- Contributing conditions must be completed (≥10 chars)
- At least one classification must exist
- Updates incident overall_status to "completed"

### `analysis.subscribeToAnalysis(args: SubscribeAnalysisArgs): Query<AnalysisSubscription>`

Real-time subscription to analysis updates.

**Arguments:**
```typescript
interface SubscribeAnalysisArgs {
  sessionToken: string;
  incident_id: Id<"incidents">;
}
```

---

## 4. User & Session APIs

### `users.getCurrent(args: GetCurrentUserArgs): Query<UserProfile | null>`

Gets current user profile with proper authentication.

**Arguments:**
```typescript
interface GetCurrentUserArgs {
  sessionToken: string;
}
```

**Returns:**
```typescript
interface UserProfile {
  _id: Id<"users">;
  name: string;
  email: string;
  profile_image_url?: string;
  role: "system_admin" | "company_admin" | "team_lead" | "frontline_worker";
  has_llm_access: boolean;
  company_id: Id<"companies">;
  _creationTime: number;
}
```

### `sessions.updateWorkflowState(args: UpdateWorkflowStateArgs): Mutation<void>`

Updates workflow state for session persistence.

**Arguments:**
```typescript
interface UpdateWorkflowStateArgs {
  sessionToken: string;
  workflowType: "incident_capture" | "incident_analysis" | "user_registration" | "chat_session";
  workflowData: {
    incidentId?: Id<"incidents">;
    currentStep?: string;
    completedSteps?: string[];
    formData?: any;
    lastActivity?: number;
    metadata?: any;
  };
  saveToSession?: boolean;
}
```

**Returns:** `void`

### `sessions.recoverState(args: RecoverStateArgs): Query<WorkflowState | null>`

Recovers workflow state from session.

**Arguments:**
```typescript
interface RecoverStateArgs {
  sessionToken: string;
  workflowType?: "incident_capture" | "incident_analysis" | "user_registration" | "chat_session";
}
```

**Returns:** `WorkflowState | null`

---

## 5. Real-time Subscription Features

### Overview

All subscription queries automatically provide real-time updates when underlying data changes, enabling collaborative editing experiences.

### Key Subscription APIs

1. **`incidents.subscribeToIncident`** - Complete incident data with related entities
2. **`incidents.subscribeToCompanyIncidents`** - Live dashboard updates
3. **`narratives.subscribeToNarrative`** - Narrative editing collaboration
4. **`narratives.subscribeToNarrativeActivity`** - User activity tracking
5. **`analysis.subscribeToAnalysis`** - Analysis workflow updates
6. **`analysis.subscribeToClassifications`** - Classification changes

### Usage Pattern

```typescript
// Subscribe to incident updates
const subscription = useQuery("incidents:subscribeToIncident", {
  sessionToken: "user-session-token",
  incident_id: incidentId
});

// Data automatically updates when changes occur
useEffect(() => {
  if (subscription) {
    console.log('Incident updated:', subscription.incident);
    console.log('Narrative version:', subscription.narrative?.version);
  }
}, [subscription]);
```

---

## 6. Error Handling & Validation

### Comprehensive Validation System

All APIs use Zod-based validation with detailed error reporting:

```typescript
// Validation error response format
interface ValidationErrorResponse {
  success: false;
  error: {
    type: "validation_error" | "authentication_error" | "authorization_error" | "resource_not_found" | "business_logic_error";
    message: string;
    correlationId?: string;
    context?: any;
    validationErrors?: Array<{
      path: string;
      message: string;
      code: string;
    }>;
  };
}
```

### Error Types

- **validation_error**: Input validation failures
- **authentication_error**: Invalid or expired session
- **authorization_error**: Insufficient permissions  
- **resource_not_found**: Requested resource doesn't exist
- **business_logic_error**: Business rule violations
- **rate_limit_error**: Rate limiting (future)
- **external_service_error**: External API failures

### Input Sanitization

All text inputs are automatically sanitized to prevent XSS attacks:
- Script tag removal
- JavaScript protocol removal  
- Event handler removal
- HTML entity encoding where appropriate

---

## 7. Security & Multi-tenancy

### Role-Based Access Control

**Hierarchy**: system_admin > company_admin > team_lead > frontline_worker

**Permission Matrix**:

| API | system_admin | company_admin | team_lead | frontline_worker |
|-----|-------------|---------------|-----------|-----------------|
| Create Incident | ✅ | ✅ | ✅ | ✅ |
| View All Company Incidents | ✅ | ✅ | ✅ | ❌ (own only) |
| Edit Own Incident Capture | ✅ | ✅ | ✅ | ✅ |
| Perform Analysis | ✅ | ✅ | ✅ | ❌ |
| Access LLM Features | ✅ | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| System Configuration | ✅ | ❌ | ❌ | ❌ |

### Multi-tenant Isolation

- **Company Scoping**: All data queries filtered by user's company_id
- **Cross-company Access Prevention**: Validation on all operations
- **Resource Ownership**: Incident creators have special permissions
- **Audit Logging**: All operations logged with correlation IDs

### Session Security

- **Secure Token Generation**: Cryptographically secure session tokens
- **Session Limits**: Maximum 5 concurrent sessions per user
- **Auto-expiration**: 24 hours (regular) / 30 days (remember me)
- **Session Refresh**: Automatic extension when close to expiry

---

## 8. Schema Normalization

### Enum Value Changes

**Before (PascalCase)**:
```typescript
incident_type: "Behavioural" | "Environmental" | "Medical" | "Communication" | "Other"
severity: "Low" | "Medium" | "High"
```

**After (lowercase snake_case)**:
```typescript
incident_type: "behavioural" | "environmental" | "medical" | "communication" | "other"
severity: "low" | "medium" | "high"
```

### Data Migration

Automatic migration function provided:
```typescript
// Run once to update existing data
const result = await ctx.runMutation("migrations:normalizeClassificationEnums", {});
```

**Migration Results**:
- Updates all existing incident_classifications records
- Preserves all other data
- Provides detailed success/error reporting
- Safe to run multiple times (idempotent)

---

## 9. Integration Examples

### Complete Incident Creation Workflow

```typescript
// 1. Create incident
const incidentId = await ctx.runMutation("incidents:create", {
  sessionToken: sessionToken,
  reporter_name: "John Doe",
  participant_name: "Jane Smith",
  event_date_time: "2025-01-11T10:30:00Z",
  location: "Main Cafeteria"
});

// 2. Create narrative
const narrativeId = await ctx.runMutation("narratives:create", {
  sessionToken: sessionToken,
  incident_id: incidentId
});

// 3. Update narrative phases
await ctx.runMutation("narratives:update", {
  sessionToken: sessionToken,
  incident_id: incidentId,
  before_event: "Before the incident occurred...",
  during_event: "During the incident...",
  end_event: "How the incident ended...",
  post_event: "Follow-up actions taken..."
});

// 4. Mark capture complete
await ctx.runMutation("incidents:updateStatus", {
  sessionToken: sessionToken,
  id: incidentId,
  capture_status: "completed"
});

// 5. Create analysis
const analysisId = await ctx.runMutation("analysis:create", {
  sessionToken: sessionToken,
  incident_id: incidentId
});

// 6. Update analysis
await ctx.runMutation("analysis:update", {
  sessionToken: sessionToken,
  analysis_id: analysisId,
  contributing_conditions: "Contributing conditions analysis...",
  analysis_status: "user_reviewed"
});

// 7. Generate AI classifications
const classifications = await ctx.runAction("analysis:generateClassifications", {
  sessionToken: sessionToken,
  analysis_id: analysisId
});

// 8. Complete analysis
await ctx.runMutation("analysis:complete", {
  sessionToken: sessionToken,
  analysis_id: analysisId
});
```

### Real-time Dashboard Implementation

```typescript
// Dashboard component with real-time updates
function IncidentDashboard() {
  const incidents = useQuery("incidents:subscribeToCompanyIncidents", {
    sessionToken: session.token,
    limit: 20,
    status_filter: "analysis_pending"
  });

  return (
    <div>
      {incidents?.incidents.map(incident => (
        <IncidentCard key={incident._id} incident={incident} />
      ))}
      <div>Total: {incidents?.totalCount} incidents</div>
      <div>Last updated: {new Date(incidents?.subscribedAt).toLocaleTimeString()}</div>
    </div>
  );
}
```

### Collaborative Narrative Editing

```typescript
// Real-time narrative editor
function NarrativeEditor({ incidentId }: { incidentId: Id<"incidents"> }) {
  const subscription = useQuery("narratives:subscribeToNarrative", {
    sessionToken: session.token,
    incident_id: incidentId
  });

  const updateNarrative = useMutation("narratives:update");

  const handlePhaseUpdate = (phase: string, content: string) => {
    updateNarrative({
      sessionToken: session.token,
      incident_id: incidentId,
      [phase]: content
    });
  };

  return (
    <div>
      <TextArea
        value={subscription?.narrative?.before_event || ""}
        onChange={(content) => handlePhaseUpdate("before_event", content)}
        placeholder="Before Event narrative..."
      />
      <TextArea
        value={subscription?.narrative?.during_event || ""}
        onChange={(content) => handlePhaseUpdate("during_event", content)}
        placeholder="During Event narrative..."
      />
      {/* Additional phases... */}
      <div>Version: {subscription?.narrative?.version}</div>
    </div>
  );
}
```

---

## 10. Testing & Quality Assurance

### API Testing Approach

**Unit Tests**: Validate individual API functions
```typescript
describe("incidents.create", () => {
  it("should create incident with valid data", async () => {
    const incidentId = await testMutation("incidents:create", {
      sessionToken: testSession,
      reporter_name: "Test Reporter",
      participant_name: "Test Participant", 
      event_date_time: "2025-01-11T10:00:00Z",
      location: "Test Location"
    });
    
    expect(incidentId).toBeTruthy();
  });
  
  it("should reject invalid event date", async () => {
    await expect(testMutation("incidents:create", {
      sessionToken: testSession,
      reporter_name: "Test Reporter",
      participant_name: "Test Participant",
      event_date_time: "invalid-date",
      location: "Test Location"
    })).rejects.toThrow("Invalid date format");
  });
});
```

**Integration Tests**: Test complete workflows
```typescript
describe("Incident Workflow", () => {
  it("should complete full incident lifecycle", async () => {
    // Create incident
    const incidentId = await createTestIncident();
    
    // Create and update narrative
    await createAndUpdateNarrative(incidentId);
    
    // Create and complete analysis
    const analysisId = await createAnalysis(incidentId);
    await generateClassifications(analysisId);
    await completeAnalysis(analysisId);
    
    // Verify final state
    const incident = await testQuery("incidents:getById", {
      sessionToken: testSession,
      id: incidentId
    });
    expect(incident.overall_status).toBe("completed");
  });
});
```

**Real-time Testing**: Verify subscription updates
```typescript
describe("Real-time Subscriptions", () => {
  it("should receive incident updates in real-time", async () => {
    const updates = [];
    const subscription = subscribeToQuery("incidents:subscribeToIncident", {
      sessionToken: testSession,
      incident_id: testIncidentId
    }, (data) => updates.push(data));
    
    // Trigger update
    await testMutation("incidents:updateStatus", {
      sessionToken: testSession,
      id: testIncidentId,
      capture_status: "completed"
    });
    
    // Verify subscription received update
    await waitFor(() => {
      expect(updates.length).toBeGreaterThan(0);
      expect(updates[updates.length - 1].incident.capture_status).toBe("completed");
    });
  });
});
```

---

## 11. Performance & Optimization

### Query Optimization

- **Indexed Queries**: All queries use appropriate database indexes
- **Pagination**: Built-in pagination with configurable limits
- **Selective Loading**: Only load required data for each use case
- **Real-time Efficiency**: Subscriptions only update when relevant data changes

### Caching Strategy

- **Session Caching**: User sessions cached for authentication
- **Permission Caching**: Permission checks cached per session
- **Query Results**: Convex automatically caches query results

### Rate Limiting (Future)

Framework prepared for rate limiting implementation:
```typescript
// Rate limiting configuration
const RATE_LIMITS = {
  "incidents:create": { windowMs: 60000, maxAttempts: 10 },
  "narratives:update": { windowMs: 60000, maxAttempts: 50 },
  "analysis:generateClassifications": { windowMs: 300000, maxAttempts: 5 }
};
```

---

## 12. Monitoring & Observability

### Comprehensive Logging

All operations include structured logging:
```typescript
console.log('🆕 INCIDENT CREATED', {
  incidentId,
  createdBy: user._id,
  companyId: user.company_id,
  correlationId,
  timestamp: new Date().toISOString(),
});
```

### Correlation ID Tracking

Every operation includes a correlation ID for request tracing:
- Generated automatically for each API call
- Included in all log entries
- Returned in API responses for client-side tracking
- Enables end-to-end request tracing

### Audit Trail

Complete audit trail for all operations:
- User actions with timestamps
- Permission checks and results
- Data modifications with before/after states
- Error occurrences with full context

### Metrics Collection

Key metrics automatically tracked:
- API call frequencies and latencies
- Error rates by endpoint and error type
- User activity patterns
- Real-time subscription connection counts

---

## 13. Migration & Deployment

### Database Migration

Run the schema normalization migration:
```typescript
// Execute migration
const migrationResult = await ctx.runMutation("migrations:normalizeClassificationEnums", {});

console.log(`Migration completed: ${migrationResult.updatedCount} records updated`);
```

### Backward Compatibility

- Old enum values automatically migrated
- New APIs compatible with existing data
- Gradual rollout supported
- Rollback procedures documented

### Environment Configuration

Required environment variables:
- Authentication keys
- External service endpoints  
- Feature flags for gradual rollout
- Monitoring and logging configuration

---

## 14. Future Enhancements

### Planned Features

1. **Advanced Real-time Features**:
   - User presence indicators
   - Edit conflict resolution
   - Operational transforms for collaborative editing

2. **Enhanced AI Integration**:
   - Custom AI models for classification
   - Sentiment analysis
   - Automated report generation

3. **Advanced Analytics**:
   - Incident trend analysis
   - Performance dashboards
   - Custom reporting

4. **Mobile API Extensions**:
   - Optimized mobile endpoints
   - Offline synchronization
   - Push notifications

### Scalability Considerations

- Horizontal scaling patterns
- Data partitioning strategies
- Caching layer optimization
- API versioning strategy

---

## Conclusion

Story 1.4 Core API Layer provides a comprehensive, production-ready API foundation for the SupportSignal incident management system. The implementation includes:

- **Complete API Coverage**: All required functionality implemented
- **Real-time Collaboration**: Live updates for seamless teamwork
- **Enterprise Security**: Multi-tenant isolation with role-based access
- **Production Quality**: Comprehensive validation, error handling, and monitoring
- **Developer Experience**: Clear documentation and integration examples

The API layer is ready for production deployment and provides a solid foundation for future feature development.