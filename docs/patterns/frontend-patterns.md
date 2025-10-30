# Frontend Patterns

## Overview

This document outlines established patterns for React, Next.js, and UI development in this project.

## Component Architecture Patterns

### Server-First Components

**Context**: Default approach for Next.js App Router components
**Implementation**:

- Components in `app/` directory are Server Components by default
- Only add `"use client"` when client-side interactivity is required
- Keep server components lightweight and focused on data fetching

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Optimizes performance and reduces client-side JavaScript bundle

### Client Component Boundaries

**Context**: When to use `"use client"` directive
**Implementation**:

- Interactive components (forms, buttons with handlers)
- Components using React hooks (useState, useEffect)
- Components accessing browser APIs
- Event handlers and user interactions

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Minimizes client-side JavaScript while enabling necessary interactivity

## Styling Patterns

### Tailwind-First Approach

**Context**: Default styling methodology
**Implementation**:

- Use Tailwind utility classes as primary styling method
- CSS modules for complex component-specific styles
- Follow ShadCN UI theming patterns for consistency

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures design consistency and reduces CSS maintenance overhead

### ShadCN Component Integration

**Context**: UI component library usage
**Implementation**:

- Use ShadCN components as base building blocks
- Customize through Tailwind classes and CSS variables
- Follow established theming patterns

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Accelerates development with proven, accessible components

## Form Handling Patterns

### React Hook Form + Zod Integration

**Context**: Form state management and validation
**Implementation**:

- Use `react-hook-form` for form state management
- Zod schemas for runtime validation
- TypeScript integration for type safety

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Provides type-safe, performant form handling with excellent UX

## State Management Patterns

### Server State via Convex

**Context**: Data fetching and real-time updates
**Implementation**:

- Use `useQuery` for reactive data fetching
- `useMutation` for data modifications
- Automatic real-time subscriptions

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Eliminates complex client-side cache management

### Client State via Zustand

**Context**: Local UI state management
**Implementation**:

- Lightweight store for non-persisted state
- TypeScript-first approach
- Minimal boilerplate

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Simple, performant local state management

### React + Convex Integration Patterns

**Context**: Proper integration of React hooks with Convex for data flow and actions
**Implementation**:

- **User-Driven Actions**: Actions triggered by user interactions (button clicks), not automatic effects
- **Trust Convex Reactivity**: Let `useQuery` handle UI updates when server data changes
- **Stable useEffect Dependencies**: Only include external data in dependencies, never state variables that the effect updates
- **Minimal State Duplication**: Don't duplicate server data in local state if Convex can manage it
- **Conditional Queries**: Use `"skip"` pattern for conditional data fetching

**Example**:
```typescript
// ✅ CORRECT: User-driven action flow
const [isLoading, setIsLoading] = useState(false);
const existingData = useQuery(api.getData, sessionToken ? { sessionToken } : "skip");
const triggerAction = useAction(api.processData);

const handleUserAction = useCallback(async () => {
  setIsLoading(true);
  try {
    await triggerAction({ sessionToken, data });
    // Let useQuery reactively update UI - no manual state setting
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
}, [triggerAction, sessionToken]);

// ✅ CORRECT: Stable effect for UI synchronization
useEffect(() => {
  if (existingData) {
    setLocalUIState(existingData); // Only sync UI state
  }
}, [existingData]); // Only external data dependencies
```

**Rationale**: 
- Prevents useEffect recursion loops
- Follows Convex's reactive architecture properly
- Maintains clean separation between server and UI state
- Ensures predictable, maintainable data flow

**Critical Reference**: See [React + Convex Patterns KDD](../technical-guides/react-convex-patterns-kdd.md) for comprehensive anti-patterns and debugging guidance.

## File Organization Patterns

### Component Co-location

**Context**: Organizing related component files
**Implementation**:

- Group components with their tests and styles
- Use index files for clean imports
- Separate by feature or domain

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Improves maintainability and reduces cognitive load

### Page Structure

**Context**: Next.js App Router page organization
**Implementation**:

- Use `page.tsx` for route endpoints
- `layout.tsx` for shared page structure
- `loading.tsx` and `error.tsx` for states

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Follows Next.js conventions for optimal performance

## Performance Patterns

### Dynamic Imports

**Context**: Code splitting for large components
**Implementation**:

- Use `next/dynamic` for heavy components
- Proper loading states
- Error boundaries for failed imports

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Reduces initial bundle size and improves loading performance

### Image Optimization

**Context**: Handling images in Next.js
**Implementation**:

- Use `next/image` component
- Proper sizing and optimization
- WebP format when supported

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Optimizes loading performance and Core Web Vitals

## Error Handling Patterns

### Error Boundaries

**Context**: Graceful error handling in React
**Implementation**:

- Implement error boundaries for component trees
- Fallback UI for error states
- Error reporting integration

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Prevents entire application crashes from component errors

### Form Error Handling

**Context**: User-friendly form validation errors
**Implementation**:

- Clear, actionable error messages
- Field-level and form-level validation
- Accessible error announcements

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Improves user experience and accessibility

## Accessibility Patterns

### Semantic HTML

**Context**: Building accessible interfaces
**Implementation**:

- Use semantic HTML elements
- Proper heading hierarchy
- ARIA labels when necessary

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Ensures application is usable by all users

### Keyboard Navigation

**Context**: Supporting keyboard-only users
**Implementation**:

- Proper focus management
- Skip links for main content
- Logical tab order

**Example**: _(Will be populated from actual implementations)_

**Rationale**: Required for accessibility compliance and better UX

## Development & Debugging Patterns

### Console Override for Development Logging

**Context**: Capturing browser console output for development debugging
**Implementation**:

- Override console methods while preserving original functionality
- Toggle capture based on environment (development only)
- Provide global API for trace management
- Send logs to backend via ConvexHttpClient
- Include correlation context (trace_id, user_id)

**Example**: 
```typescript
// Console override initialization
export function initializeConsoleOverride() {
  if (typeof window === 'undefined') return;
  if (window.CLAUDE_LOGGING_ENABLED !== 'true') return;
  
  // Make ConsoleLogger globally available for UAT testing
  (window as any).ConsoleLogger = ConsoleLogger;
  
  // Override each console method
  ['log', 'error', 'warn', 'info'].forEach(level => {
    (console as any)[level] = (...args: any[]) => {
      // Call original console method first
      (originalConsole as any)[level](...args);
      
      // Send to Convex (async, non-blocking)
      sendToConvex(level, args).catch(err => {
        originalConsole.error('Console override error:', err);
      });
    };
  });
}

// Global API for trace management
export const ConsoleLogger = {
  setTraceId: (traceId: string) => { currentTraceId = traceId; },
  setUserId: (userId: string) => { currentUserId = userId; },
  newTrace: () => { currentTraceId = generateTraceId(); return currentTraceId; },
  getTraceId: () => currentTraceId,
  getUserId: () => currentUserId,
  isEnabled: () => typeof window !== 'undefined' && window.CLAUDE_LOGGING_ENABLED === 'true',
  getStatus: () => ({ initialized: isInitialized, enabled: isEnabled(), traceId: currentTraceId, userId: currentUserId }),
};
```

**Rationale**: 
- Preserves normal console behavior while adding capture capability
- Environment-based toggling prevents production overhead
- Trace correlation enables debugging across distributed systems
- Global API enables manual testing and trace management
- Non-blocking async sending prevents performance impact

**Related Patterns**: Browser Log Capture with Convex Actions (backend-patterns.md)

## Anti-Patterns to Avoid

### Overuse of Client Components

- Don't default to `"use client"` unless necessary
- Avoid large client-side state for data that should be server-managed

### Inline Styles

- Avoid inline styles in favor of Tailwind utilities
- Don't bypass the design system without justification

### Prop Drilling

- Use Zustand or context for deeply nested state
- Consider component composition over complex prop passing

### useEffect + Convex Actions (CRITICAL ANTI-PATTERN)

**❌ NEVER DO THIS**:
```typescript
// Creates infinite recursion loops
useEffect(() => {
  if (shouldGenerate && !error) {
    generateAction(...); // Anti-pattern!
  }
}, [shouldGenerate, error, generateAction]); // error dependency causes loops
```

**Why Wrong**: 
- Actions should be user-triggered, not automatic
- State variables in dependencies create re-render cycles
- Fights against Convex's reactive architecture

**✅ CORRECT ALTERNATIVE**: User-driven actions with manual triggers

### State Variables in useEffect Dependencies

**❌ PROBLEMATIC**:
```typescript
const [error, setError] = useState(null);
useEffect(() => {
  if (condition && !error) {
    setError('something'); // Causes re-render → infinite loop risk
  }
}, [condition, error]); // error dependency is the problem
```

**✅ CORRECT**: Only external data dependencies, use refs for internal tracking

### Always-Visible Modal Anti-Pattern

**❌ PROBLEMATIC**:
```typescript
// Modal always renders regardless of data availability
return (
  <Modal isOpen={showModal}>
    {incompleteIncidents?.length > 0 ? (
      <IncidentList incidents={incompleteIncidents} />
    ) : (
      <div>Loading...</div> // Empty modal annoys users
    )}
  </Modal>
);
```

**✅ CORRECT**: Conditional modal rendering based on data availability

### URL Navigation for State-Heavy Workflows

**❌ PROBLEMATIC for complex workflows**:
```typescript
// Forces page reload, loses state, requires URL parsing
const handleContinue = (incidentId: string, step: number) => {
  router.push(`/workflow?id=${incidentId}&step=${step}`);
  // Loses all component state, requires loading states
};
```

**✅ CORRECT**: Direct state management for single-page workflows

### Parent-Child State Leakage in Modals

**❌ PROBLEMATIC**:
```typescript
// Modal directly manipulates parent state
const Modal = ({ setParentStep, setParentId }) => {
  const handleContinue = () => {
    setParentStep(3);    // Modal shouldn't know parent structure
    setParentId(id);     // Tight coupling
    closeModal();        // Modal manages own closure
  };
};
```

**✅ CORRECT**: Clean callback interfaces with single responsibility

## Modal State Management Patterns

### Conditional Modal Display Pattern

**Context**: Showing modals only when necessary, avoiding unnecessary UI interruption
**Implementation**: 

Use conditional rendering based on data availability rather than always showing modals.

```typescript
// ✅ CORRECT: Conditional modal display
const incompleteIncidents = useQuery(api.getMyIncompleteIncidents, 
  sessionToken ? { sessionToken } : "skip"
);

// Only show modal if user has incomplete work
const shouldShowModal = incompleteIncidents && incompleteIncidents.length > 0;

return (
  <>
    {shouldShowModal && (
      <ContinueWorkflowModal
        isOpen={showContinueModal}
        incompleteIncidents={incompleteIncidents}
        onClose={handleModalClose}
      />
    )}
    {/* Main content always renders */}
    <MainWorkflowContent />
  </>
);
```

**Rationale**: 
- Eliminates unnecessary modal interruptions when no action is needed
- Improves user experience by reducing cognitive load
- Prevents empty or loading states in modal content

**Example**: Story 4.2 workflow continuation modal only appears when user has incomplete incidents

### Modal Anti-Reappearance Pattern

**Context**: Preventing modals from reappearing after user dismisses them during the same session
**Implementation**:

Track modal dismissal state to respect user's decision within session boundaries.

```typescript
// ✅ CORRECT: Respect user dismissal
const [showContinueModal, setShowContinueModal] = useState(false);
const [modalDismissed, setModalDismissed] = useState(false);

// Show modal logic respects dismissal
useEffect(() => {
  if (incompleteIncidents?.length > 0 && !modalDismissed && !incidentId) {
    setShowContinueModal(true);
  }
}, [incompleteIncidents, modalDismissed, incidentId]);

const handleModalClose = () => {
  setShowContinueModal(false);
  setModalDismissed(true); // Prevent reappearance
};

// ❌ WRONG: Modal reappears every time
const handleModalClose = () => {
  setShowContinueModal(false);
  // Missing dismissal tracking - modal will reappear
};
```

**Rationale**:
- Respects user's explicit dismissal choice
- Prevents annoying repeated modal displays
- Maintains session-scoped user preferences

### Component Communication in Modals Pattern

**Context**: Clean data flow between modal components and parent containers
**Implementation**:

Use callback patterns with clear separation of concerns between modal logic and navigation logic.

```typescript
// ✅ CORRECT: Clean callback separation
interface ContinueWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  incompleteIncidents: IncidentPreview[];
  onContinue: (incidentId: string, step?: number) => void;
  onStartNew: () => void;
}

// Modal handles UI logic only
const handleContinue = (incidentId: string, step?: number) => {
  onContinue(incidentId, step);
  // Don't call onClose() - let parent handle navigation
};

// Parent handles navigation and routing
const handleContinueIncident = (incidentId: string, step?: number) => {
  setIncidentId(incidentId);
  if (step) setCurrentStep(step - 1);
  setShowContinueModal(false); // Parent manages modal state
};
```

**Rationale**:
- Clear separation between UI logic and business logic
- Parent component maintains control over navigation flow
- Reusable modal components with configurable behavior

## Data Loading Strategy Patterns

### Direct Data Loading vs URL Navigation Pattern

**Context**: Choosing between direct component state updates vs URL-based navigation for data loading
**Implementation**:

For workflow continuation, direct data loading provides better user experience than URL navigation.

```typescript
// ✅ CORRECT: Direct data loading for workflow continuation
const handleContinueIncident = (incidentId: string, step?: number) => {
  // Direct state updates for immediate UI response
  setIncidentId(incidentId);  
  if (step) setCurrentStep(step - 1);
  setShowContinueModal(false);
  
  // No router.push() needed - component handles state internally
};

// ❌ ALTERNATIVE: URL-based navigation (more complex)
const handleContinueIncident = (incidentId: string, step?: number) => {
  router.push(`/new-incident?id=${incidentId}&step=${step}`);
  // Requires URL parsing logic, loading states, etc.
};
```

**Rationale**:
- Direct loading eliminates page refresh and loading states
- Faster user experience with immediate state updates
- Simpler implementation without URL parameter parsing
- Better for single-page workflows with complex state

**When to use URL navigation instead**:
- Deep linking requirements (bookmarkable URLs)
- Multi-page workflows where each step is a separate page
- SEO requirements for different workflow steps

### Query Result Structure Handling Pattern

**Context**: Working with structured query results that contain both data arrays and metadata
**Implementation**:

Handle nested query results with proper null checking and default values.

```typescript
// ✅ CORRECT: Structured result handling
const incompleteIncidentsResult = useQuery(
  api.incidents_listing.getMyIncompleteIncidents,
  user?.sessionToken ? { sessionToken: user.sessionToken } : "skip"
);

// Extract with safe defaults
const incompleteIncidents = incompleteIncidentsResult?.incidents || [];
const totalIncompleteCount = incompleteIncidentsResult?.totalCount || 0;

// Use both pieces of data appropriately
const shouldShowModal = incompleteIncidents.length > 0;
const displayCount = totalIncompleteCount > incompleteIncidents.length 
  ? `Showing ${incompleteIncidents.length} of ${totalIncompleteCount}`
  : `${incompleteIncidents.length} total`;
```

**Rationale**:
- Handles loading states gracefully with default values
- Separates data from metadata for different UI purposes
- Prevents undefined errors during query loading

## Workflow Continuation Architecture Pattern

**Context**: Implementing continuation systems for complex multi-step workflows
**Implementation**:

Use a combination of conditional modals, direct data loading, and state management for seamless workflow resumption.

```typescript
// ✅ CORRECT: Complete workflow continuation architecture
const WorkflowContainer = () => {
  // Core workflow state
  const [currentStep, setCurrentStep] = useState(0);
  const [incidentId, setIncidentId] = useState<string | null>(null);
  
  // Modal state with dismissal tracking
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  
  // Data loading with conditional query
  const incompleteIncidentsResult = useQuery(
    api.getMyIncompleteIncidents,
    sessionToken ? { sessionToken } : "skip"
  );
  
  // Conditional modal display logic
  useEffect(() => {
    const incidents = incompleteIncidentsResult?.incidents || [];
    if (incidents.length > 0 && !modalDismissed && !incidentId) {
      setShowContinueModal(true);
    }
  }, [incompleteIncidentsResult, modalDismissed, incidentId]);
  
  // Direct data loading for continuation
  const handleContinueIncident = (incidentId: string, step?: number) => {
    setIncidentId(incidentId);
    if (step) setCurrentStep(step - 1);
    setShowContinueModal(false);
  };
  
  return (
    <>
      {/* Conditional modal */}
      {incompleteIncidentsResult?.incidents && (
        <ContinueWorkflowModal
          isOpen={showContinueModal}
          incompleteIncidents={incompleteIncidentsResult.incidents}
          onContinue={handleContinueIncident}
          onClose={() => setModalDismissed(true)}
        />
      )}
      
      {/* Main workflow */}
      <WorkflowSteps 
        currentStep={currentStep} 
        incidentId={incidentId}
      />
    </>
  );
};
```

**Key Components**:
1. **Conditional Modal Display**: Only shows when relevant
2. **Anti-Reappearance Logic**: Respects user dismissal
3. **Direct Data Loading**: Fast workflow resumption
4. **Clean Component Communication**: Clear callback patterns

**Implementation Reference**: Story 4.2 - Workflow Continuation System

## Loading State Patterns

### Three-Tier Loading Pattern

**Context**: Providing consistent, appropriate visual feedback during asynchronous operations
**Implementation**:

Use a three-tier system based on operation duration and impact:

1. **Inline Spinner** (< 2 seconds): Small spinner within the triggering element
2. **Card-Level Loader** (2-5 seconds): Overlay on affected component with medium spinner
3. **Page-Level Loader** (> 5 seconds OR mutations): Full-page overlay blocking all interaction

**Quick Decision Rule**: Any mutation that changes database state → Page-Level Loader

**Example**: See [Loading States Pattern](loading-states.md) for complete implementation guide with:
- Visual design specifications (sizes, colors, overlays)
- Code examples for all three tiers
- Accessibility guidelines (ARIA labels, screen reader support)
- State management patterns (try/finally, no cancellation needed)
- Migration guide from existing patterns

**Rationale**:
- Duration-based selection ensures appropriate feedback for operation complexity
- Page-Level blocking for mutations prevents navigation during state changes
- Simplified state management (boolean flags, no rollback/cancellation logic)
- Consistent visual hierarchy across application

**Implementation Reference**: Story 6.4, Story 0.8

## Related Documentation

- [Backend Patterns](backend-patterns.md) - For API integration patterns
- [Testing Patterns](testing-patterns.md) - For frontend testing approaches
- [Architecture Patterns](architecture-patterns.md) - For overall system design
- **[Loading States Pattern](loading-states.md)** - **Complete guide** to three-tier loading pattern implementation
- **[DX Tool Pattern Exceptions](dx-tool-pattern-exceptions.md)** - When and how to deviate from production patterns for developer tools
- **[AI Model Selection for Performance](ai-model-selection-performance.md)** - Model selection strategies for optimizing speed vs quality
- **[React + Convex Patterns KDD](../technical-guides/react-convex-patterns-kdd.md)** - **CRITICAL** - Comprehensive guide to avoid useEffect recursion and data flow anti-patterns
- **[Incident Workflow Patterns KDD](../incident-workflow/incident-workflow-patterns-kdd.md)** - Workflow-specific state management and save patterns
