# Incident Management APIs

Complete CRUD operations for incidents with role-based access control and real-time collaboration features.

## Overview

The incident management system supports the complete incident lifecycle from creation through analysis completion. All operations include comprehensive permission checking and audit logging.

## Core APIs

### incidents.create

Create a new incident with comprehensive validation and permission checks.

**Type**: `Mutation<Id<"incidents">>`

```typescript
const createIncident = useMutation(api.incidents.create);

const incidentId = await createIncident({
  sessionToken: string,
  reporter_name: string,
  participant_name: string, 
  event_date_time: string, // ISO date string
  location: string
});
```

**Validation Rules**:
- Event date cannot be more than 24 hours in the future
- Event date cannot be more than 30 days in the past
- All text fields are sanitized for XSS protection
- Reporter and participant names required (1-200 characters)
- Location required (1-500 characters)

**Permissions**: `CREATE_INCIDENT` - Available to all authenticated users

**Returns**: New incident ID

**Example**:
```typescript
const incidentId = await createIncident({
  sessionToken: userSession.sessionToken,
  reporter_name: "John Doe",
  participant_name: "Jane Smith",
  event_date_time: new Date().toISOString(),
  location: "Office Building A, Conference Room 203"
});
```

### incidents.getById

Retrieve incident by ID with proper access control.

**Type**: `Query<Incident | null>`

```typescript
const incident = useQuery(api.incidents.getById, {
  sessionToken: string,
  id: Id<"incidents">
});
```

**Access Control**:
- System/Company admins: Can view all company incidents
- Team leads: Can view all company incidents  
- Frontline workers: Can view own incidents only

**Returns**: Complete incident object or null if not found/no access

**Example**:
```typescript
const incident = useQuery(api.incidents.getById, {
  sessionToken: userSession.sessionToken,
  id: "incident-id-here" as Id<"incidents">
});

if (incident) {
  console.log(`Incident status: ${incident.overall_status}`);
  console.log(`Created by: ${incident.reporter_name}`);
}
```

### incidents.listByUser

List incidents accessible to current user based on their role and permissions.

**Type**: `Query<Incident[]>`

```typescript
const incidents = useQuery(api.incidents.listByUser, {
  sessionToken: string,
  overallStatus?: "capture_pending" | "analysis_pending" | "completed",
  limit?: number // Default: 50, Max: 100
});
```

**Access Patterns**:
- **System/Company admins & Team leads**: All company incidents
- **Frontline workers**: Own incidents only

**Filtering**: Optional status filter for workflow management

**Returns**: Array of accessible incidents, ordered by creation date (newest first)

**Example**:
```typescript
// Get all pending incidents
const pendingIncidents = useQuery(api.incidents.listByUser, {
  sessionToken: userSession.sessionToken,
  overallStatus: "capture_pending",
  limit: 20
});

// Get all incidents for dashboard
const allIncidents = useQuery(api.incidents.listByUser, {
  sessionToken: userSession.sessionToken
});
```

### incidents.updateStatus

Update incident workflow status with comprehensive validation.

**Type**: `Mutation<{ success: boolean }>`

```typescript
const updateStatus = useMutation(api.incidents.updateStatus);

await updateStatus({
  sessionToken: string,
  id: Id<"incidents">,
  capture_status?: "draft" | "in_progress" | "completed",
  analysis_status?: "not_started" | "in_progress" | "completed"
});
```

**State Transitions**:
- **Capture**: draft → in_progress → completed
- **Analysis**: not_started → in_progress → completed
- **Business Rule**: Analysis cannot start until capture is completed

**Permissions**: 
- Capture status: `EDIT_OWN_INCIDENT_CAPTURE` (users can update own incidents)
- Analysis status: `PERFORM_ANALYSIS` (team leads and above)

**Auto-calculated Overall Status**:
- `capture_pending`: Capture not completed
- `analysis_pending`: Capture completed, analysis not completed  
- `completed`: Both capture and analysis completed

**Example**:
```typescript
// Complete capture phase
await updateStatus({
  sessionToken: userSession.sessionToken,
  id: incidentId,
  capture_status: "completed"
});

// Start analysis (team lead/admin only)
await updateStatus({
  sessionToken: userSession.sessionToken,
  id: incidentId,  
  analysis_status: "in_progress"
});
```

## Real-time Collaboration APIs

### incidents.subscribeToIncident

Real-time subscription to incident updates for collaborative workflows.

**Type**: `Query<IncidentSubscription | null>`

```typescript
const incidentData = useQuery(api.incidents.subscribeToIncident, {
  sessionToken: string,
  incident_id: Id<"incidents">
});
```

**Returns**: Complete incident data with related records:
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

**Use Cases**:
- Live dashboard updates
- Collaborative editing indicators
- Workflow handoff notifications
- Status change notifications

**Example**:
```typescript
const incidentData = useQuery(api.incidents.subscribeToIncident, {
  sessionToken: userSession.sessionToken,
  incident_id: currentIncidentId
});

// React to real-time updates
useEffect(() => {
  if (incidentData?.incident.overall_status === "analysis_pending") {
    showNotification("Incident ready for analysis");
  }
}, [incidentData?.incident.overall_status]);
```

### incidents.subscribeToCompanyIncidents

Real-time subscription to company incidents list for dashboard updates.

**Type**: `Query<IncidentListSubscription>`

```typescript
const incidentsList = useQuery(api.incidents.subscribeToCompanyIncidents, {
  sessionToken: string,
  limit?: number,
  status_filter?: "capture_pending" | "analysis_pending" | "completed"
});
```

**Returns**: Live incident list with metadata:
```typescript
interface IncidentListSubscription {
  incidents: Incident[];
  subscribedAt: number;
  totalCount: number;
  correlationId: string;
}
```

**Example**:
```typescript
const dashboardData = useQuery(api.incidents.subscribeToCompanyIncidents, {
  sessionToken: userSession.sessionToken,
  limit: 50
});

// Live dashboard metrics
const metrics = useMemo(() => ({
  total: dashboardData?.incidents.length || 0,
  pending: dashboardData?.incidents.filter(i => i.overall_status === "capture_pending").length || 0,
  analysis: dashboardData?.incidents.filter(i => i.overall_status === "analysis_pending").length || 0,
  completed: dashboardData?.incidents.filter(i => i.overall_status === "completed").length || 0
}), [dashboardData?.incidents]);
```

## Data Types

### Incident

```typescript
interface Incident {
  _id: Id<"incidents">;
  _creationTime: number;
  
  // Company context
  company_id: Id<"companies">;
  
  // Basic incident information
  reporter_name: string;
  participant_name: string;
  event_date_time: string;
  location: string;
  
  // Workflow status
  capture_status: "draft" | "in_progress" | "completed";
  analysis_status: "not_started" | "in_progress" | "completed";
  overall_status: "capture_pending" | "analysis_pending" | "completed";
  
  // Audit fields
  created_at: number;
  created_by: Id<"users">;
  updated_at: number;
  
  // Data quality tracking
  narrative_hash?: string;
  questions_generated: boolean;
  narrative_enhanced: boolean;
  analysis_generated: boolean;
}
```

## Permission Matrix

| Role | Create | View Own | View All | Update Own | Update All | Delete |
|------|--------|----------|----------|------------|------------|--------|
| Frontline Worker | ✅ | ✅ | ❌ | ✅ (capture) | ❌ | ❌ |
| Team Lead | ✅ | ✅ | ✅ | ✅ | ✅ (analysis) | ❌ |
| Company Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Error Handling

```typescript
try {
  const incident = await createIncident(incidentData);
} catch (error) {
  if (error.message.includes('ValidationError')) {
    // Handle validation errors (date range, required fields)
    console.error('Validation failed:', error.message);
  } else if (error.message.includes('Access denied')) {
    // Handle permission errors
    console.error('Insufficient permissions:', error.message);
  } else if (error.message.includes('Invalid status transition')) {
    // Handle workflow validation errors
    console.error('Status update failed:', error.message);
  }
}
```

## Integration Patterns

### Incident Creation Workflow

```typescript
// 1. Create incident
const incidentId = await createIncident(basicInfo);

// 2. Initialize narrative
const narrativeId = await createNarrative({
  sessionToken,
  incident_id: incidentId
});

// 3. Subscribe to updates
const incidentData = useQuery(api.incidents.subscribeToIncident, {
  sessionToken,
  incident_id: incidentId
});

// 4. Update workflow state
await updateWorkflowState({
  sessionToken,
  workflowType: "incident_capture",
  workflowData: {
    incidentId,
    currentStep: "narrative_entry",
    completedSteps: ["basic_info"]
  }
});
```

### Dashboard Integration

```typescript
// Live dashboard with real-time updates
const Dashboard = () => {
  const incidents = useQuery(api.incidents.subscribeToCompanyIncidents, {
    sessionToken: userSession.sessionToken
  });
  
  const statusCounts = useMemo(() => {
    if (!incidents?.incidents) return { pending: 0, analysis: 0, completed: 0 };
    
    return incidents.incidents.reduce((acc, incident) => {
      acc[incident.overall_status === "capture_pending" ? "pending" : 
          incident.overall_status === "analysis_pending" ? "analysis" : "completed"]++;
      return acc;
    }, { pending: 0, analysis: 0, completed: 0 });
  }, [incidents?.incidents]);
  
  return (
    <div>
      <StatusCard title="Pending Capture" count={statusCounts.pending} />
      <StatusCard title="Pending Analysis" count={statusCounts.analysis} />
      <StatusCard title="Completed" count={statusCounts.completed} />
    </div>
  );
};
```

## Next Steps

- [Narrative Management APIs](./narratives.md) - Continue with narrative workflow
- [Session Management](./sessions.md) - Implement workflow state persistence
- [Integration Examples](../examples/integration/) - Complete implementation patterns