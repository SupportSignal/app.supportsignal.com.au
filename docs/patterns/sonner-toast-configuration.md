# Sonner Toast Configuration Pattern

## Problem Context

**Issue Discovered in Story 7.3**: Application code was calling `toast.success()` and `toast.error()` throughout the codebase, but no toast notifications were visible to users. Error messages appeared only in console logs.

**Root Cause**: The Sonner `<Toaster />` component was never added to the application layout, causing all toast calls to fail silently.

## Solution Pattern

### Required Setup

**1. Install Sonner** (already done via package.json):
```json
"sonner": "^1.x.x"
```

**2. Add Toaster Component to Root Layout** (`apps/web/app/layout.tsx`):
```typescript
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {/* Application content */}
          {children}

          {/* CRITICAL: Toaster must be rendered for toast notifications to work */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**3. Use Toast Functions Anywhere in Application**:
```typescript
import { toast } from 'sonner';

// Success notification (green)
toast.success('Site created successfully');

// Error notification (red)
toast.error('Cannot delete the last site');

// Info notification (blue)
toast.info('Processing your request');

// Warning notification (yellow/orange)
toast.warning('This action cannot be undone');
```

## Configuration Options

### Essential Properties

```typescript
<Toaster
  richColors      // Enables colored backgrounds (red for errors, green for success)
  position="top-right"  // Standard notification placement
/>
```

### Available Toast Types

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `toast.success()` | Green (#10b981) | Checkmark | Confirmations, completed actions |
| `toast.error()` | Red (#ef4444) | Error icon | Failures, validation errors |
| `toast.info()` | Blue (#3b82f6) | Info icon | Neutral information, tips |
| `toast.warning()` | Yellow/Orange (#f59e0b) | Warning icon | Cautions, advisory messages |
| `toast()` | Gray/Neutral | None | General notifications |

### Additional Configuration Options

```typescript
<Toaster
  richColors={true}           // Enable colored backgrounds
  position="top-right"        // Position: top-right, top-left, bottom-right, bottom-left
  theme="system"              // Theme: system, light, dark
  closeButton={true}          // Show close button on toasts
  duration={4000}             // Auto-dismiss time in ms (default: 4000)
  visibleToasts={3}           // Max visible toasts at once
  expand={false}              // Expand toasts on hover
  offset="16px"               // Distance from viewport edge
/>
```

## Error Handling Pattern with Toasts

### Structured ConvexError + Toast Pattern

**Backend** (throw structured errors):
```typescript
import { ConvexError } from 'convex/values';

throw new ConvexError({
  message: "Cannot delete the last site for a company",
  code: "LAST_SITE_DELETE_FORBIDDEN"
});
```

**Frontend** (extract and display clean message):
```typescript
import { toast } from 'sonner';

try {
  await deleteSite({ sessionToken, siteId });
  toast.success('Site deleted successfully');
} catch (error: any) {
  const errorMessage = error.data?.message || 'Failed to delete site';
  toast.error(errorMessage);
}
```

## Architecture Decision: Toasts vs Alert Components

### When to Use Toasts (Preferred)

✅ **Use Sonner toasts for:**
- Async operation feedback (mutations, actions)
- Success/error confirmations
- Non-blocking notifications
- Temporary status updates
- Operations in dialogs/modals

**Advantages:**
- Non-intrusive (appears, auto-dismisses)
- Consistent placement and styling
- No state management required
- Works across entire application

### When to Use Alert Components

❌ **Use Alert components for:**
- Critical blocking errors requiring user acknowledgment
- Static page-level warnings (e.g., "System admin access required")
- Form validation errors that must remain visible

## Implementation Reference

**Story**: 7.3 - Site Management (System Admin)
**Files Changed**:
- `apps/web/app/layout.tsx` - Added `<Toaster />` component
- `apps/web/app/admin/companies/[id]/sites/page.tsx` - Used toast notifications for CRUD feedback

## Related Patterns

- [ConvexError Handling Pattern](./convex-error-handling.md)
- [Frontend Error Handling](./frontend-patterns.md#error-handling-patterns)

## Testing Considerations

**How to Test Toast Notifications:**
1. Trigger operation that should show toast
2. Verify toast appears in UI (not just console)
3. Verify correct color/icon for toast type
4. Verify toast auto-dismisses after duration
5. Verify error messages are clean (no `[CONVEX M(...)]` prefix)

## Common Mistakes

❌ **Don't do this:**
```typescript
// Calling toast without <Toaster /> in layout
toast.success('This will fail silently!');

// Using plain strings in ConvexError backend
throw new ConvexError('This shows as [CONVEX M(...)] error');

// Forgetting richColors prop
<Toaster />  // Toasts will be plain black/white
```

✅ **Do this:**
```typescript
// Ensure <Toaster richColors /> in layout
<Toaster richColors position="top-right" />

// Use structured ConvexError in backend
throw new ConvexError({ message: 'Clean message', code: 'ERROR_CODE' });

// Extract clean message in frontend
const errorMessage = error.data?.message || 'Fallback message';
toast.error(errorMessage);
```

## Key Lesson

**Discovery from Story 7.3**: A working toast notification system requires **both** the `toast()` function calls **and** the `<Toaster />` component rendered in the layout. Without the component, all toast calls fail silently with no visible errors.
