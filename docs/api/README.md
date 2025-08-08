# SupportSignal API Documentation

## Overview

This documentation provides comprehensive coverage of the SupportSignal backend API built with Convex. All APIs are fully functional, tested, and ready for frontend integration.

**API Status**: 15/15 APIs implemented and operational ✅

## Quick Start

```typescript
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

// Basic authentication example
const user = useQuery(api.users.getCurrent, { sessionToken });

// Create an incident
const createIncident = useMutation(api.incidents.create);
```

## API Categories

### 🎫 [Incident Management APIs](./incidents.md)
Complete CRUD operations for incidents with role-based access control.
- **incidents.create** - Create new incident with validation
- **incidents.getById** - Retrieve incident with access control
- **incidents.listByUser** - List accessible incidents
- **incidents.updateStatus** - Update workflow status
- **incidents.subscribeToIncident** - Real-time incident updates

### 📝 [Narrative Management APIs](./narratives.md)
Manage incident narratives with collaborative editing and AI enhancement.
- **narratives.create** - Initialize narrative structure
- **narratives.update** - Real-time narrative editing with auto-save
- **narratives.enhance** - AI-enhanced narrative generation
- **narratives.getConsolidated** - Complete narrative for analysis
- **narratives.subscribeToNarrative** - Real-time collaborative editing

### 👤 [User & Authentication APIs](./users.md)
User profile management and authentication.
- **users.getCurrent** - Current user profile and permissions
- **users.updateUserProfile** - Profile management

### 🎯 [Session Management APIs](./sessions.md)
Secure session handling with workflow state persistence.
- **sessions.updateWorkflowState** - Wizard progress persistence
- **sessions.recoverState** - Session recovery after interruption
- **sessions.validateSession** - Session validation and refresh

### 📊 [Analysis APIs](./analysis.md)
Incident analysis with AI-powered insights.
- **analysis.getByIncident** - Retrieve analysis results
- **analysis.create** - Generate new analysis

## Authentication

All APIs use session-based authentication with the `sessionToken` parameter:

```typescript
const result = useQuery(api.incidents.getById, {
  sessionToken: "your-session-token",
  id: incidentId
});
```

## Real-time Features

SupportSignal provides real-time subscriptions for collaborative workflows:

```typescript
// Subscribe to incident updates
const incidentData = useQuery(api.incidents.subscribeToIncident, {
  sessionToken,
  incident_id: incidentId
});

// Subscribe to narrative changes  
const narrativeData = useQuery(api.narratives.subscribeToNarrative, {
  sessionToken,
  incident_id: incidentId
});
```

## Error Handling

All APIs use consistent error handling patterns:

```typescript
try {
  const result = await createIncident({
    sessionToken,
    reporter_name: "John Doe",
    participant_name: "Jane Smith", 
    event_date_time: new Date().toISOString(),
    location: "Office Building A"
  });
} catch (error) {
  if (error.message.includes('ValidationError')) {
    // Handle validation errors
  } else if (error.message.includes('Access denied')) {
    // Handle permission errors
  }
}
```

## TypeScript Support

Full TypeScript definitions are automatically generated and available at:
- `convex/_generated/api.d.ts` - API function signatures
- `convex/_generated/dataModel.d.ts` - Database schema types

## Next Steps

1. **Integration Examples**: See [examples/integration/](../examples/integration/) for complete implementation patterns
2. **Frontend Setup**: Review [development environment setup](../development/frontend-setup.md)
3. **Testing**: Check [API testing guide](../testing/api-testing.md)

## API Reference

- [Incident Management](./incidents.md)
- [Narrative Management](./narratives.md) 
- [User Management](./users.md)
- [Session Management](./sessions.md)
- [Analysis APIs](./analysis.md)