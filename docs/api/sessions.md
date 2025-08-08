# Session Management APIs

Secure session handling with workflow state persistence, recovery capabilities, and comprehensive audit logging.

## Overview

The session management system provides secure session lifecycle management with workflow state persistence, enabling seamless user experiences across browser sessions and device switches. Perfect for wizard-style interfaces and complex multi-step workflows.

## Core APIs

### sessions.updateWorkflowState

Update workflow state for session persistence (Story 1.4 API specification).

**Type**: `Mutation<void>`

```typescript
const updateWorkflowState = useMutation(api.sessions.updateWorkflowState);

await updateWorkflowState({
  sessionToken: string,
  workflowType: "incident_capture" | "incident_analysis" | "user_registration" | "chat_session",
  workflowData: {
    incidentId?: Id<"incidents">,
    currentStep?: string,
    completedSteps?: string[],
    formData?: any,
    lastActivity?: number,
    metadata?: any
  },
  saveToSession?: boolean
});
```

**Workflow Types**:
- `incident_capture` - Multi-step incident creation and narrative entry
- `incident_analysis` - Analysis workflow with AI integration
- `user_registration` - User onboarding process
- `chat_session` - Conversational AI session state

**Auto-Enhanced Data**: Automatically adds timestamps, session IDs, and user context

**Returns**: `void` (as per Story 1.4 specification)

**Example**:
```typescript
// Save incident capture progress
await updateWorkflowState({
  sessionToken: userSession.sessionToken,
  workflowType: "incident_capture",
  workflowData: {
    incidentId: "incident-123" as Id<"incidents">,
    currentStep: "narrative_entry",
    completedSteps: ["basic_info", "participants"],
    formData: {
      phase: "during_event",
      content: "Partial narrative content..."
    },
    metadata: {
      startedAt: Date.now(),
      estimatedCompletion: 0.6
    }
  },
  saveToSession: true
});

// Save analysis workflow state
await updateWorkflowState({
  sessionToken: userSession.sessionToken,
  workflowType: "incident_analysis",
  workflowData: {
    incidentId: "incident-123" as Id<"incidents">,
    currentStep: "ai_enhancement",
    completedSteps: ["narrative_review", "classification"],
    formData: {
      selectedClassifications: ["safety", "equipment"],
      aiEnhancementApproved: true
    }
  }
});
```

### sessions.recoverState

Recover workflow state from session (Story 1.4 API specification).

**Type**: `Query<WorkflowState | null>`

```typescript
const workflowState = useQuery(api.sessions.recoverState, {
  sessionToken: string,
  workflowType?: "incident_capture" | "incident_analysis" | "user_registration" | "chat_session"
});
```

**Recovery Features**:
- Automatic session validation
- Workflow type filtering
- Graceful error handling (returns null on any error)
- Complete workflow context restoration

**Returns**: Complete workflow state or null if no state exists

**Example**:
```typescript
// Recover any workflow state
const anyWorkflowState = useQuery(api.sessions.recoverState, {
  sessionToken: userSession.sessionToken
});

// Recover specific workflow type
const incidentCaptureState = useQuery(api.sessions.recoverState, {
  sessionToken: userSession.sessionToken,
  workflowType: "incident_capture"
});

// Use in component
useEffect(() => {
  if (incidentCaptureState?.workflowData) {
    const { currentStep, completedSteps, formData } = incidentCaptureState.workflowData;
    
    // Restore wizard state
    setCurrentStep(currentStep || "basic_info");
    setCompletedSteps(completedSteps || []);
    setFormData(formData || {});
  }
}, [incidentCaptureState]);
```

## Session Lifecycle APIs

### sessions.validateSession

Validate session and return user information with workflow state.

**Type**: `Query<SessionValidation>`

```typescript
const sessionInfo = useQuery(api.sessions.validateSession, {
  sessionToken: string,
  includeWorkflowState?: boolean
});
```

**Returns**: Complete session validation result:
```typescript
interface SessionValidation {
  valid: boolean;
  reason?: string;
  user?: {
    id: Id<"users">;
    name: string;
    email: string;
    role: string;
    company_id: Id<"companies">;
    has_llm_access: boolean;
  };
  session?: {
    expires: number;
    rememberMe: boolean;
    shouldRefresh: boolean;
  };
  workflowState?: WorkflowState;
  correlationId: string;
}
```

**Example**:
```typescript
const sessionInfo = useQuery(api.sessions.validateSession, {
  sessionToken: userSession.sessionToken,
  includeWorkflowState: true
});

if (sessionInfo.valid) {
  console.log(`Session valid for ${sessionInfo.user?.name}`);
  
  if (sessionInfo.session?.shouldRefresh) {
    // Auto-refresh session
    refreshSession();
  }
  
  if (sessionInfo.workflowState) {
    // Resume workflow
    resumeWorkflow(sessionInfo.workflowState);
  }
} else {
  console.log(`Session invalid: ${sessionInfo.reason}`);
  redirectToLogin();
}
```

### sessions.refreshSession

Refresh existing session and extend expiration.

**Type**: `Mutation<{ success: boolean; expires: number; correlationId: string }>`

```typescript
const refreshSession = useMutation(api.sessions.refreshSession);

const result = await refreshSession({
  sessionToken: string,
  extendExpiry?: boolean
});
```

**Auto-refresh Logic**: Sessions are automatically refreshed when within 2 hours of expiry

**Example**:
```typescript
// Manual refresh
const result = await refreshSession({
  sessionToken: userSession.sessionToken,
  extendExpiry: true
});

if (result.success) {
  console.log(`Session refreshed, expires: ${new Date(result.expires)}`);
} else {
  // Session could not be refreshed, redirect to login
  redirectToLogin();
}
```

### sessions.invalidateSession

Invalidate session (logout) with workflow state cleanup.

**Type**: `Mutation<{ success: boolean; correlationId: string }>`

```typescript
const invalidateSession = useMutation(api.sessions.invalidateSession);

await invalidateSession({
  sessionToken: string,
  reason?: string
});
```

**Cleanup Features**:
- Automatic workflow state cleanup
- Audit trail preservation
- Graceful handling of already invalid sessions

**Example**:
```typescript
const handleLogout = async () => {
  await invalidateSession({
    sessionToken: userSession.sessionToken,
    reason: "User logout"
  });
  
  // Clear local storage
  localStorage.removeItem('sessionToken');
  
  // Redirect to login
  router.push('/login');
};
```

## Data Types

### WorkflowState

```typescript
interface WorkflowState {
  workflowType: "incident_capture" | "incident_analysis" | "user_registration" | "chat_session";
  workflowData: {
    incidentId?: Id<"incidents">;
    currentStep?: string;
    completedSteps?: string[];
    formData?: any;
    lastActivity?: number;
    metadata?: any;
    
    // Auto-added by system
    sessionId: Id<"sessions">;
    userId: Id<"users">;
  };
  sessionId: Id<"sessions">;
  userId: Id<"users">;
  lastActivity: number;
  created: number;
}
```

### SessionConfiguration

```typescript
const SESSION_CONFIG = {
  REGULAR_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_SESSIONS_PER_USER: 5,
  SESSION_REFRESH_THRESHOLD: 2 * 60 * 60 * 1000 // 2 hours before expiry
};
```

## Integration Patterns

### Wizard Workflow Implementation

```typescript
// Custom hook for workflow state management
export const useWorkflowState = <T = any>(
  workflowType: WorkflowType,
  initialData?: T
) => {
  const { sessionToken } = useAuth();
  
  // Recover existing workflow state
  const existingState = useQuery(api.sessions.recoverState, {
    sessionToken,
    workflowType
  });
  
  const updateWorkflowState = useMutation(api.sessions.updateWorkflowState);
  
  const [localState, setLocalState] = useState<T>(
    existingState?.workflowData || initialData || {}
  );
  
  // Auto-save state changes
  const saveState = useCallback(async (
    newData: Partial<T>,
    currentStep?: string,
    completedSteps?: string[]
  ) => {
    const updatedState = { ...localState, ...newData };
    setLocalState(updatedState);
    
    await updateWorkflowState({
      sessionToken,
      workflowType,
      workflowData: {
        ...existingState?.workflowData,
        formData: updatedState,
        currentStep,
        completedSteps,
        lastActivity: Date.now()
      },
      saveToSession: true
    });
  }, [sessionToken, workflowType, localState, existingState, updateWorkflowState]);
  
  return {
    workflowData: localState,
    currentStep: existingState?.workflowData?.currentStep,
    completedSteps: existingState?.workflowData?.completedSteps || [],
    saveState,
    isRecovered: !!existingState
  };
};

// Usage in wizard component
const IncidentCaptureWizard = () => {
  const {
    workflowData,
    currentStep,
    completedSteps,
    saveState,
    isRecovered
  } = useWorkflowState('incident_capture', {
    reporter_name: '',
    participant_name: '',
    event_date_time: '',
    location: ''
  });
  
  const [activeStep, setActiveStep] = useState(currentStep || 'basic_info');
  
  // Show recovery notification
  useEffect(() => {
    if (isRecovered) {
      showNotification('Previous session restored');
    }
  }, [isRecovered]);
  
  const handleStepComplete = async (stepData: any) => {
    const newCompletedSteps = [...completedSteps, activeStep];
    
    await saveState(
      { ...workflowData, ...stepData },
      getNextStep(activeStep),
      newCompletedSteps
    );
    
    setActiveStep(getNextStep(activeStep));
  };
  
  return (
    <WizardContainer>
      <ProgressIndicator 
        steps={WIZARD_STEPS}
        currentStep={activeStep}
        completedSteps={completedSteps}
      />
      
      <StepContent
        step={activeStep}
        data={workflowData}
        onComplete={handleStepComplete}
      />
    </WizardContainer>
  );
};
```

### Auto-Save Implementation

```typescript
// Auto-save hook with workflow state persistence
export const useAutoSave = <T>(
  data: T,
  workflowType: WorkflowType,
  currentStep: string,
  debounceMs: number = 2000
) => {
  const { sessionToken } = useAuth();
  const updateWorkflowState = useMutation(api.sessions.updateWorkflowState);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  const debouncedSave = useMemo(
    () => debounce(async (dataToSave: T) => {
      setSaveStatus('saving');
      try {
        await updateWorkflowState({
          sessionToken,
          workflowType,
          workflowData: {
            formData: dataToSave,
            currentStep,
            lastActivity: Date.now()
          }
        });
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('error');
        console.error('Auto-save failed:', error);
      }
    }, debounceMs),
    [sessionToken, workflowType, currentStep, updateWorkflowState, debounceMs]
  );
  
  useEffect(() => {
    if (data) {
      debouncedSave(data);
    }
  }, [data, debouncedSave]);
  
  return saveStatus;
};

// Usage
const NarrativeEditor = ({ incidentId }: { incidentId: Id<"incidents"> }) => {
  const [narrativeData, setNarrativeData] = useState({
    before_event: '',
    during_event: '',
    end_event: '',
    post_event: ''
  });
  
  const saveStatus = useAutoSave(
    narrativeData,
    'incident_capture',
    'narrative_entry'
  );
  
  return (
    <div>
      <SaveStatusIndicator status={saveStatus} />
      
      <TextArea
        value={narrativeData.before_event}
        onChange={(value) => setNarrativeData(prev => ({
          ...prev,
          before_event: value
        }))}
      />
      
      {/* Other narrative phases */}
    </div>
  );
};
```

### Session Recovery on Page Load

```typescript
// App-level session recovery
export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessionToken] = useLocalStorage('sessionToken', null);
  const [isRecovering, setIsRecovering] = useState(true);
  
  const sessionInfo = useQuery(
    api.sessions.validateSession,
    sessionToken ? {
      sessionToken,
      includeWorkflowState: true
    } : "skip"
  );
  
  useEffect(() => {
    if (sessionInfo) {
      setIsRecovering(false);
      
      if (sessionInfo.valid && sessionInfo.workflowState) {
        // Resume workflow
        const { workflowType, workflowData } = sessionInfo.workflowState;
        
        if (workflowType === 'incident_capture' && workflowData.incidentId) {
          // Resume incident capture
          router.push(`/incidents/${workflowData.incidentId}/capture`);
        } else if (workflowType === 'incident_analysis' && workflowData.incidentId) {
          // Resume analysis
          router.push(`/incidents/${workflowData.incidentId}/analysis`);
        }
      }
    }
  }, [sessionInfo]);
  
  if (isRecovering) {
    return <div>Recovering session...</div>;
  }
  
  return <>{children}</>;
};
```

## Error Handling

```typescript
// Comprehensive session error handling
const useSessionWithErrorHandling = () => {
  const { sessionToken } = useAuth();
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  const sessionInfo = useQuery(api.sessions.validateSession, {
    sessionToken
  });
  
  useEffect(() => {
    if (sessionInfo && !sessionInfo.valid) {
      switch (sessionInfo.reason) {
        case 'Session not found':
          setSessionError('Session expired. Please log in again.');
          break;
        case 'Session expired':
          setSessionError('Your session has expired. Please log in again.');
          break;
        case 'User not found':
          setSessionError('Account not found. Please contact support.');
          break;
        default:
          setSessionError('Authentication error. Please try again.');
      }
    } else {
      setSessionError(null);
    }
  }, [sessionInfo]);
  
  return {
    sessionInfo,
    sessionError,
    clearSessionError: () => setSessionError(null)
  };
};
```

## Security Features

### Session Limits and Cleanup

```typescript
// Automatic session management
const SESSION_SECURITY = {
  // Maximum 5 concurrent sessions per user
  MAX_SESSIONS_PER_USER: 5,
  
  // Auto-cleanup expired sessions
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
  
  // Session refresh threshold
  REFRESH_THRESHOLD: 2 * 60 * 60 * 1000 // 2 hours before expiry
};

// Security action: invalidate all other sessions
const SecurityActions = () => {
  const invalidateOtherSessions = useMutation(api.sessions.invalidateAllOtherSessions);
  
  const handleSecurityAction = async () => {
    const result = await invalidateOtherSessions({
      sessionToken: userSession.sessionToken
    });
    
    showSuccessMessage(`Invalidated ${result.invalidatedCount} other sessions`);
  };
  
  return (
    <Button onClick={handleSecurityAction}>
      Sign Out All Other Sessions
    </Button>
  );
};
```

## Next Steps

- [Analysis APIs](./analysis.md) - Complete the core API documentation
- [Integration Examples](../examples/integration/workflow-state.md) - Workflow implementation patterns
- [Frontend Setup](../development/frontend-setup.md) - Environment configuration