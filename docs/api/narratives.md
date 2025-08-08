# Narrative Management APIs

Manage incident narratives with collaborative editing, auto-save capability, and AI enhancement features.

## Overview

The narrative management system supports the four-phase incident narrative structure (Before, During, End, Post Event) with real-time collaborative editing, automatic consolidation, and AI-powered enhancement capabilities.

## Core APIs

### narratives.create

Initialize narrative content for new incident.

**Type**: `Mutation<Id<"incident_narratives">>`

```typescript
const createNarrative = useMutation(api.narratives.create);

const narrativeId = await createNarrative({
  sessionToken: string,
  incident_id: Id<"incidents">
});
```

**Permissions**: `EDIT_OWN_INCIDENT_CAPTURE` - Users can create narratives for incidents they have access to

**Initial State**: All narrative phases start empty, ready for user input

**Returns**: New narrative ID

**Example**:
```typescript
// After creating an incident, initialize its narrative
const narrativeId = await createNarrative({
  sessionToken: userSession.sessionToken,
  incident_id: newIncidentId
});
```

### narratives.update

Update narrative phase content with auto-save capability and version tracking.

**Type**: `Mutation<{ success: boolean; version: number }>`

```typescript
const updateNarrative = useMutation(api.narratives.update);

const result = await updateNarrative({
  sessionToken: string,
  incident_id: Id<"incidents">,
  before_event?: string,
  during_event?: string,
  end_event?: string,
  post_event?: string
});
```

**Features**:
- **Partial Updates**: Update only the phases you specify
- **Auto-save**: Perfect for live typing scenarios
- **Version Tracking**: Each update increments version number
- **Edit Protection**: Cannot edit after capture phase is completed

**Permissions**: `EDIT_OWN_INCIDENT_CAPTURE` with ownership or company-wide access

**Returns**: Success status and new version number

**Example**:
```typescript
// Auto-save during user typing
const handlePhaseUpdate = async (phase: string, content: string) => {
  await updateNarrative({
    sessionToken: userSession.sessionToken,
    incident_id: currentIncidentId,
    [phase]: content
  });
};

// Update multiple phases
await updateNarrative({
  sessionToken: userSession.sessionToken,
  incident_id: incidentId,
  before_event: "The workplace was quiet that morning...",
  during_event: "Suddenly, there was a loud crash from the warehouse..."
});
```

### narratives.enhance

Apply AI-enhanced content to narratives (Action for external AI service calls).

**Type**: `Action<{ success: boolean }>`

```typescript
const enhanceNarrative = useAction(api.narratives.enhance);

await enhanceNarrative({
  sessionToken: string,
  incident_id: Id<"incidents">,
  enhanced_before?: string,
  enhanced_during?: string,
  enhanced_end?: string,
  enhanced_post?: string
});
```

**AI Enhancement Features**:
- Parallel enhancement of multiple phases
- Preserves original content alongside enhanced versions
- Timestamps enhancement for audit trail
- Updates incident enhancement tracking

**Permissions**: `ACCESS_LLM_FEATURES` - Enhanced narratives require LLM access

**Integration**: Automatically calls AI service, applies enhancements, and marks incident as enhanced

**Example**:
```typescript
// Enhance all narrative phases
await enhanceNarrative({
  sessionToken: userSession.sessionToken,
  incident_id: incidentId,
  enhanced_before: "Enhanced before event description with additional context...",
  enhanced_during: "AI-enhanced during event with identified safety concerns...",
  enhanced_end: "Detailed end event with immediate response actions...",
  enhanced_post: "Comprehensive post-event analysis with recommendations..."
});
```

### narratives.getConsolidated

Retrieve complete narrative with consolidated view for analysis.

**Type**: `Query<ConsolidatedNarrative | null>`

```typescript
const narrative = useQuery(api.narratives.getConsolidated, {
  sessionToken: string,
  incident_id: Id<"incidents">
});
```

**Consolidation Features**:
- Automatically generates consolidated view from phases
- Includes both original and enhanced content
- Formatted for analysis consumption
- Cached for performance

**Returns**: Complete narrative object with consolidated markdown text

**Example**:
```typescript
const narrative = useQuery(api.narratives.getConsolidated, {
  sessionToken: userSession.sessionToken,
  incident_id: currentIncidentId
});

if (narrative?.consolidated_narrative) {
  // Ready for analysis
  console.log("Consolidated narrative:", narrative.consolidated_narrative);
}
```

## Real-time Collaboration APIs

### narratives.subscribeToNarrative

Real-time subscription to narrative updates for collaborative editing.

**Type**: `Query<NarrativeSubscription | null>`

```typescript
const narrativeData = useQuery(api.narratives.subscribeToNarrative, {
  sessionToken: string,
  incident_id: Id<"incidents">
});
```

**Returns**: Live narrative data with metadata:
```typescript
interface NarrativeSubscription {
  incident_id: Id<"incidents">;
  narrative: ConsolidatedNarrative | null;
  subscribedAt: number;
  correlationId: string;
}
```

**Use Cases**:
- Live collaborative editing
- Auto-save feedback
- Version conflict detection
- Multi-user editing indicators

**Example**:
```typescript
const narrativeData = useQuery(api.narratives.subscribeToNarrative, {
  sessionToken: userSession.sessionToken,
  incident_id: currentIncidentId
});

// React to version changes
useEffect(() => {
  if (narrativeData?.narrative?.version !== lastKnownVersion) {
    showAutoSaveIndicator();
    setLastKnownVersion(narrativeData.narrative.version);
  }
}, [narrativeData?.narrative?.version]);
```

### narratives.subscribeToNarrativeActivity

Monitor collaborative editing activity and show live editing indicators.

**Type**: `Query<NarrativeActivitySubscription | null>`

```typescript
const editingActivity = useQuery(api.narratives.subscribeToNarrativeActivity, {
  sessionToken: string,
  incident_id: Id<"incidents">
});
```

**Returns**: Real-time editing activity:
```typescript
interface NarrativeActivitySubscription {
  incident_id: Id<"incidents">;
  activity: {
    activeEditors: Array<{userId: Id<"users">, section: string}>;
    recentUpdates: Array<{userId: Id<"users">, section: string, lastUpdate: number, action: string}>;
    editLocks: string[]; // Sections currently being edited
  };
  subscribedAt: number;
  correlationId: string;
}
```

**Example**:
```typescript
const editingActivity = useQuery(api.narratives.subscribeToNarrativeActivity, {
  sessionToken: userSession.sessionToken,
  incident_id: currentIncidentId
});

// Show live editing indicators
const renderPhaseEditor = (phase: string) => (
  <div>
    <textarea value={narrativeData[phase]} onChange={...} />
    {editingActivity?.activity.editLocks.includes(phase) && (
      <EditingIndicator users={getActiveEditorsForPhase(phase)} />
    )}
  </div>
);
```

## Data Types

### IncidentNarrative

```typescript
interface IncidentNarrative {
  _id: Id<"incident_narratives">;
  _creationTime: number;
  
  incident_id: Id<"incidents">;
  
  // Four-phase narrative structure
  before_event: string;
  during_event: string;
  end_event: string;
  post_event: string;
  
  // AI-enhanced content (optional)
  before_event_extra?: string;
  during_event_extra?: string;
  end_event_extra?: string;
  post_event_extra?: string;
  
  // Auto-generated consolidated narrative
  consolidated_narrative?: string;
  
  // Metadata
  created_at: number;
  updated_at: number;
  enhanced_at?: number;
  version: number;
}
```

### ConsolidatedNarrative

Extends `IncidentNarrative` with computed consolidated content:

```typescript
interface ConsolidatedNarrative extends IncidentNarrative {
  consolidated_narrative: string; // Always present, auto-generated
}
```

## Integration Patterns

### Collaborative Editor Implementation

```typescript
const NarrativeEditor = ({ incidentId }: { incidentId: Id<"incidents"> }) => {
  // Subscribe to live narrative updates
  const narrativeData = useQuery(api.narratives.subscribeToNarrative, {
    sessionToken: userSession.sessionToken,
    incident_id: incidentId
  });
  
  // Subscribe to collaborative editing activity
  const editingActivity = useQuery(api.narratives.subscribeToNarrativeActivity, {
    sessionToken: userSession.sessionToken,
    incident_id: incidentId
  });
  
  const updateNarrative = useMutation(api.narratives.update);
  
  // Auto-save with debouncing
  const [localContent, setLocalContent] = useState({
    before_event: narrativeData?.narrative?.before_event || "",
    during_event: narrativeData?.narrative?.during_event || "",
    end_event: narrativeData?.narrative?.end_event || "",
    post_event: narrativeData?.narrative?.post_event || ""
  });
  
  const debouncedSave = useCallback(
    debounce(async (phase: string, content: string) => {
      await updateNarrative({
        sessionToken: userSession.sessionToken,
        incident_id: incidentId,
        [phase]: content
      });
    }, 1000),
    [incidentId, updateNarrative]
  );
  
  const handlePhaseChange = (phase: string, content: string) => {
    setLocalContent(prev => ({ ...prev, [phase]: content }));
    debouncedSave(phase, content);
  };
  
  return (
    <div className="narrative-editor">
      {(['before_event', 'during_event', 'end_event', 'post_event'] as const).map(phase => (
        <PhaseEditor
          key={phase}
          phase={phase}
          value={localContent[phase]}
          onChange={(content) => handlePhaseChange(phase, content)}
          isBeingEdited={editingActivity?.activity.editLocks.includes(phase)}
          activeEditors={getActiveEditorsForPhase(editingActivity, phase)}
        />
      ))}
    </div>
  );
};
```

### AI Enhancement Workflow

```typescript
const NarrativeEnhancement = ({ incidentId }: { incidentId: Id<"incidents"> }) => {
  const narrative = useQuery(api.narratives.getConsolidated, {
    sessionToken: userSession.sessionToken,
    incident_id: incidentId
  });
  
  const enhanceNarrative = useAction(api.narratives.enhance);
  const [enhancing, setEnhancing] = useState(false);
  
  const handleEnhance = async () => {
    if (!narrative) return;
    
    setEnhancing(true);
    try {
      // Call AI service to enhance content
      const enhancements = await callAIService({
        before_event: narrative.before_event,
        during_event: narrative.during_event,
        end_event: narrative.end_event,
        post_event: narrative.post_event
      });
      
      // Apply enhancements
      await enhanceNarrative({
        sessionToken: userSession.sessionToken,
        incident_id: incidentId,
        ...enhancements
      });
      
      showSuccessMessage("Narrative enhanced successfully");
    } catch (error) {
      showErrorMessage("Enhancement failed: " + error.message);
    } finally {
      setEnhancing(false);
    }
  };
  
  return (
    <div>
      <Button 
        onClick={handleEnhance} 
        disabled={enhancing || !narrative}
        loading={enhancing}
      >
        Enhance with AI
      </Button>
    </div>
  );
};
```

### Auto-save Implementation

```typescript
const useAutoSave = (incidentId: Id<"incidents">) => {
  const updateNarrative = useMutation(api.narratives.update);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  const autoSave = useCallback(
    debounce(async (updates: Partial<Record<string, string>>) => {
      setSaveStatus('saving');
      try {
        await updateNarrative({
          sessionToken: userSession.sessionToken,
          incident_id: incidentId,
          ...updates
        });
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('error');
        console.error('Auto-save failed:', error);
      }
    }, 2000),
    [incidentId, updateNarrative]
  );
  
  return { autoSave, saveStatus };
};
```

## Error Handling

```typescript
try {
  await updateNarrative({
    sessionToken: userSession.sessionToken,
    incident_id: incidentId,
    before_event: content
  });
} catch (error) {
  if (error.message.includes('Cannot edit narrative: capture phase is completed')) {
    showWarning('This incident is no longer editable');
  } else if (error.message.includes('Access denied')) {
    showError('You do not have permission to edit this narrative');
  } else if (error.message.includes('At least one narrative phase must be provided')) {
    showError('Please provide content to save');
  }
}
```

## Performance Optimization

### Efficient Updates

```typescript
// Batch multiple phase updates
const updateMultiplePhases = async (phases: Record<string, string>) => {
  // Single API call for multiple phases
  await updateNarrative({
    sessionToken: userSession.sessionToken,
    incident_id: incidentId,
    ...phases
  });
};

// Debounced auto-save to prevent excessive API calls
const debouncedAutoSave = useMemo(
  () => debounce(autoSave, 1500),
  [autoSave]
);
```

### Real-time Subscription Optimization

```typescript
// Only subscribe when actively editing
const shouldSubscribe = isActivelyEditing || showCollaborativeIndicators;

const narrativeData = useQuery(
  api.narratives.subscribeToNarrative,
  shouldSubscribe ? {
    sessionToken: userSession.sessionToken,
    incident_id: incidentId
  } : "skip"
);
```

## Next Steps

- [Analysis APIs](./analysis.md) - Process completed narratives
- [Session Management](./sessions.md) - Handle workflow state persistence  
- [Integration Examples](../examples/integration/narrative-editor.md) - Complete editor implementation