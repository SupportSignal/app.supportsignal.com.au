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

## Related Documentation

- [Backend Patterns](backend-patterns.md) - For API integration patterns  
- [Testing Patterns](testing-patterns.md) - For frontend testing approaches
- [Architecture Patterns](architecture-patterns.md) - For overall system design
- **[React + Convex Patterns KDD](../technical-guides/react-convex-patterns-kdd.md)** - **CRITICAL** - Comprehensive guide to avoid useEffect recursion and data flow anti-patterns
