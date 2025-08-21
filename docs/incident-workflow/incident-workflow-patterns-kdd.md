# Incident Workflow Patterns KDD

**Knowledge Discovery Document (KDD)**  
**Created**: 2025-01-19  
**Context**: Analysis of incident capture workflow patterns and architectural decisions  
**Scope**: Save patterns, navigation flows, and developer experience improvements

## Executive Summary

This KDD documents the architectural patterns discovered in the incident workflow system, focusing on save mechanisms, state management, and developer experience tooling. Key findings include mixed save patterns (auto-save vs manual), successful workflow state management, and opportunities for developer tooling decoupling.

## 1. Workflow Entry Points and State Management

### 1.1 Clean State Entry Pattern
**Discovery**: Users entering from `/new-incident` always start with a clean state.

```typescript
// Entry Point: /new-incident/page.tsx
export default function NewIncidentPage() {
  return <IncidentCaptureWorkflow />;
}

// Initial State in IncidentCaptureWorkflow.tsx:45-46
const [currentStep, setCurrentStep] = useState(0); // 0-based indexing
const [incidentId, setIncidentId] = useState<Id<"incidents"> | null>(null);
```

**Pattern**: Always starts fresh with no existing incident ID, ensuring clean workflow initialization.

### 1.2 Edit Mode Transition Pattern
**Discovery**: Once Step 1 completes and creates an incident ID, ALL subsequent navigation operates in edit mode.

```typescript
// Metadata completion triggers edit mode transition
const handleMetadataComplete = (newIncidentId: Id<"incidents">) => {
  setIncidentId(newIncidentId); // From null to actual ID
  setCompletedSteps(prev => new Set(prev).add('metadata'));
  setCurrentStep(1); // Auto-advance to Step 2
};
```

**Pattern**: Single incident ID persists throughout entire workflow (Steps 1-8), enabling consistent edit operations.

## 2. Save Pattern Analysis

### 2.1 Mixed Save Strategy Discovery
**Finding**: The workflow employs different save strategies based on component type and user interaction patterns.

#### Manual Save Pattern (Form Submissions)
```typescript
// Step 1: Metadata Form - Manual save on form submission
const handleSubmit = async (e: React.FormEvent) => {
  // Prepare form data
  if (incidentId) {
    await updateIncidentMetadata({ ...incidentData, incidentId });
  } else {
    incidentId = await createIncident(incidentData);
  }
  onComplete(incidentId);
};
```

**Used in**: Step 1 (Metadata), Step 7 (Enhanced Review), Step 8 (Consolidated Report)  
**Rationale**: Explicit user action required for critical workflow transitions

#### Auto-Save Pattern (Content Areas)
```typescript
// Step 2: Narrative Grid - Auto-save with 3-second debounce
const { autoSaveState, triggerSave } = useAutoSave(
  narrativeData,
  async (data) => await upsertNarrative({ ...data, incident_id: incidentId }),
  { debounceMs: 3000 }
);
```

**Used in**: Step 2 (Narrative), Steps 3-6 (Q&A responses)  
**Rationale**: Continuous content creation benefits from automatic persistence

### 2.2 Auto-Save Timing Inconsistency Discovery
**Issue Found**: Mixed auto-save delays across components
- **NarrativeGrid**: 3000ms (3 seconds) ✅
- **ClarificationStep**: 2000ms (2 seconds) ⚠️  
- **QuestionCard**: Inherits from ClarificationStep timing

**Recommendation**: Standardize to 3 seconds across all components for consistency.

### 2.3 Auto-Save Architecture Pattern

#### useAutoSave Hook Pattern
```typescript
// Reusable auto-save hook with comprehensive state management
export function useAutoSave<T>(
  data: T,
  saveFn: (data: T) => Promise<void>,
  options: AutoSaveOptions = {}
) {
  // Debounced saving, error handling, state management
  // Returns: { autoSaveState, triggerSave, clearError }
}
```

**Benefits**:
- Consistent debounced saving across components
- Unified error handling and state management
- Visual feedback integration
- Cleanup on unmount

**Usage Pattern**:
```typescript
// Component integration pattern
const { autoSaveState, triggerSave } = useAutoSave(
  formData,
  async (data) => await saveFunction(data),
  { debounceMs: 3000, enabled: !!sessionToken }
);

// Visual feedback integration
{autoSaveState.isSaving && <AutoSaveIndicator state="saving" />}
{autoSaveState.lastSaveTime && <AutoSaveIndicator state="saved" />}
```

## 3. Navigation and State Patterns

### 3.1 Step Completion Tracking
**Pattern**: Set-based completion tracking with auto-advancement

```typescript
const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

// Step completion handler
const handleStepComplete = (stepId: string) => {
  setCompletedSteps(prev => new Set(prev).add(stepId));
  // Auto-advance logic for specific step types
};
```

**Benefits**: Reliable state tracking, prevents regression, enables conditional navigation

### 3.2 Bidirectional Navigation Support
**Discovery**: All steps support back/forward navigation while preserving data

```typescript
// Each step component receives navigation handlers
component: incidentId ? (
  <ClarificationStep
    incident_id={incidentId}
    phase="before_event"
    onNext={() => handleStepComplete('before_event')}
    onPrevious={() => setCurrentStep(1)} // Explicit back navigation
    canProceed={true}
  />
) : null,
```

**Pattern**: Explicit navigation callbacks with state preservation through auto-save mechanisms

## 4. Developer Experience (DX) Tooling Analysis

### 4.1 Current DX Bar Implementation
**Location**: `DeveloperToolsBar` component in `IncidentCaptureWorkflow.tsx:475-485`

```typescript
<DeveloperToolsBar
  user={user}
  currentStep={currentStep + 1}
  incidentId={incidentId}
  onExportComplete={handleExportComplete}
  onImportComplete={handleImportComplete}
  onStepNavigate={handleStepNavigate}
  onFillForm={handleFillForm}
  onFillNarrative={handleFillNarrative}
  onFillQA={handleFillQA}
/>
```

### 4.2 Coupling Analysis

#### Current Tight Coupling Issues
1. **Incident-Specific Props**: Direct incidentId dependency
2. **Workflow-Specific Handlers**: Custom fill functions for each step type
3. **Step-Aware Logic**: Hardcoded step navigation and sample data generation
4. **Context Dependency**: Requires specific workflow context (user, mutations, etc.)

#### Current Benefits
1. **Comprehensive Functionality**: Full workflow testing and debugging capabilities
2. **Step-Aware Features**: Context-sensitive sample data generation
3. **Real-time Integration**: Direct access to workflow state and mutations

### 4.3 Future DX Bar Vision

#### Proposed Generic Interface
```typescript
// Future generic DX toolbar interface
interface GenericDeveloperToolbar {
  // Generic wizard integration
  wizard: {
    currentStep: number;
    totalSteps: number;
    stepIds: string[];
    onNavigateToStep: (step: number) => void;
  };
  
  // Generic sample data system
  sampleData: {
    generators: SampleDataGenerator[];
    onGenerate: (generatorId: string, target?: string) => Promise<void>;
  };
  
  // Generic import/export
  dataManagement: {
    onExport: () => Promise<string>;
    onImport: (data: string) => Promise<boolean>;
  };
  
  // Configuration
  config: {
    enabled: boolean;
    visibleFeatures: string[];
    autoSaveSettings?: AutoSaveConfig;
  };
}
```

#### Decoupling Strategy
1. **Generic Wizard Integration**: Interface with any wizard/step system
2. **Plugin-Based Sample Data**: Configurable generators per step type
3. **Abstract Data Operations**: Generic import/export without workflow specifics
4. **Configuration-Driven**: Enable/disable features based on context

#### Safe Extraction Pattern
```typescript
// Phase 1: Extract generic interfaces
interface WizardContext {
  currentStep: number;
  onNavigateToStep: (step: number) => void;
  // ... other generic properties
}

// Phase 2: Create adapter pattern
class IncidentWorkflowAdapter implements WizardContext {
  constructor(private workflow: IncidentCaptureWorkflow) {}
  // Adapt incident-specific to generic interface
}

// Phase 3: Generic DX component
function GenericDeveloperToolbar({ context }: { context: WizardContext }) {
  // Generic implementation using context interface
}
```

### 4.4 Configuration System Recommendations

#### Wizard-Level Auto-Save Configuration
```typescript
// Future auto-save configuration pattern
interface AutoSaveConfig {
  debounceMs: number;          // Default: 3000
  enabled: boolean;            // Default: true
  enabledSteps: string[];      // Step-specific overrides
  visual: {
    showIndicator: boolean;
    indicatorPosition: 'top' | 'bottom' | 'inline';
  };
}

// Usage in workflow configuration
const workflowConfig: WorkflowConfig = {
  autoSave: {
    debounceMs: 3000,
    enabled: true,
    enabledSteps: ['narrative', 'before_event', 'during_event', 'end_event', 'post_event']
  }
};
```

## 5. Error Handling and Recovery Patterns

### 5.1 Auto-Save Error Recovery
**Pattern**: Graceful degradation with user notification

```typescript
// Error handling in useAutoSave hook
catch (error) {
  setAutoSaveState(prev => ({
    ...prev,
    isSaving: false,
    hasUnsavedChanges: false, // Prevent stuck "Saving..." state
    error: errorMessage,
  }));
  
  onError?.(error instanceof Error ? error : new Error(errorMessage));
  console.warn('Auto-save failed:', error);
}
```

**Benefits**: Prevents UI lock-up, provides user feedback, maintains workflow continuity

### 5.2 Manual Save Error Handling
**Pattern**: Comprehensive validation and user feedback

```typescript
try {
  // Validation before save
  if (!validateForm()) return;
  
  // Save operation
  await saveFunction(data);
  
  // Success handling
  onComplete(result);
} catch (error) {
  // User-friendly error feedback
  setErrors({ 
    fieldName: error instanceof Error ? error.message : 'Save failed' 
  });
}
```

## 6. Performance and UX Patterns

### 6.1 Debounced Auto-Save Benefits
- **Reduced API calls**: 3-second debounce prevents excessive requests
- **Better UX**: Immediate feedback with background persistence
- **Network efficiency**: Batches rapid changes into single save operations

### 6.2 Progressive Enhancement Pattern
```typescript
// Graceful fallback for missing dependencies
const sessionToken = typeof window !== 'undefined' ? 
  localStorage.getItem('auth_session_token') : null;

const { autoSaveState } = useAutoSave(
  data,
  saveFunction,
  { enabled: !!sessionToken && !!incidentId } // Only enable when ready
);
```

## 7. Architectural Strengths and Opportunities

### 7.1 Current Strengths
1. **Clear Separation**: Manual vs auto-save strategies match user expectations
2. **Robust State Management**: Set-based completion tracking
3. **Comprehensive Error Handling**: Multiple fallback mechanisms
4. **Developer-Friendly**: Comprehensive debugging and testing tools

### 7.2 Improvement Opportunities
1. **Auto-Save Timing Standardization**: Consolidate to 3-second standard
2. **DX Tooling Decoupling**: Extract generic developer toolbar
3. **Configuration System**: Wizard-level auto-save settings
4. **Visual Consistency**: Standardized auto-save indicators

## 8. Implementation Recommendations

### 8.1 Immediate Actions
1. **Standardize auto-save timing to 3 seconds** across all components
2. **Document current DX bar patterns** before refactoring
3. **Create configuration interfaces** for future extensibility

### 8.2 Future Architectural Evolution
1. **Generic DX Toolbar**: Extract reusable developer experience component
2. **Configuration-Driven Auto-Save**: Wizard-level settings management
3. **Plugin-Based Sample Data**: Extensible testing data generation

## 9. Lessons Learned

### 9.1 Save Pattern Insights
- **Mixed strategies work well**: Different patterns for different interaction types
- **Auto-save timing matters**: Consistent timing improves user experience
- **Error recovery crucial**: Graceful degradation prevents workflow breakage

### 9.2 State Management Success
- **Single incident ID**: Simplifies edit mode throughout workflow
- **Set-based completion**: Reliable progress tracking
- **Bidirectional navigation**: Maintains data integrity

### 9.3 Developer Experience
- **Context-specific tooling**: Powerful but tightly coupled
- **Comprehensive debugging**: Essential for complex workflows
- **Future extensibility**: Generic patterns enable reuse

## Conclusion

The incident workflow demonstrates mature patterns for complex multi-step processes with mixed save strategies, robust state management, and comprehensive developer tooling. Key opportunities lie in standardizing auto-save timing and decoupling developer experience components for broader reusability while preserving current functionality and user experience.