# Loading State Pattern

**Category**: User Experience / UI Patterns
**Status**: ✅ Active
**Last Updated**: October 26, 2025
**Source**: Story 6.4 (initial design), Story 0.8 (pattern extraction and documentation)

---

## Overview

This pattern provides a **three-tier system** for displaying loading states during asynchronous operations. It ensures consistent user feedback across the application, improving perceived performance and reducing user confusion during waits.

**Key Principle**: Match the loading indicator to the operation's duration and scope to provide appropriate feedback without over- or under-communicating progress.

---

## Quick Decision Guide

**Use this simple rule to choose the right tier:**

| Operation Type | Duration | Tier | Blocks Navigation? |
|----------------|----------|------|-------------------|
| **Database mutation** (any) | Any | Page-Level | ✅ Yes |
| **Data loading/display** | 2-5 seconds | Card-Level | ❌ No |
| **Quick operation** | < 2 seconds | Inline | ❌ No |

**Simplified Rule**: **If it mutates database → Page-Level** (prevents state management complexity)

---

## The Three Tiers

### Tier 1: Inline Spinner

**When to Use:**
- Quick operations that feel nearly instant (< 2 seconds)
- Button-level feedback
- Single field updates or validations
- Auto-save indicators

**Visual Appearance:**
- Small blue spinning icon (16x16px)
- Appears inside or adjacent to the triggering element
- No overlay, no blocking
- Rest of page fully interactive

**Implementation:**

```tsx
import { Loader2 } from 'lucide-react';

export function QuickSaveButton() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await quickSaveOperation();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button onClick={handleSave} disabled={isSaving}>
      {isSaving && <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />}
      {isSaving ? 'Saving...' : 'Save'}
    </button>
  );
}
```

**Accessibility:**

```tsx
<button aria-busy={isSaving} aria-label={isSaving ? "Saving..." : "Save"}>
  {isSaving && <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />}
  {isSaving ? 'Saving...' : 'Save'}
</button>
```

**Visual Example:**

```
Before:  [Save Changes]
During:  [○ Saving...]  ← Small blue spinner inside button
```

---

### Tier 2: Card-Level Loader

**When to Use:**
- Medium-duration data loading (2-5 seconds)
- Component-level refresh operations
- Loading data for a specific section
- **NOT for database mutations** (use Page-Level instead)

**Visual Appearance:**
- Semi-transparent white overlay (80% opacity) covers only the specific card/component
- Medium-sized blue spinner (64x64px) centered on component
- Message text below spinner
- Rest of page (header, nav, other sections) remains fully visible and interactive
- Component content dims but remains partially visible

**Implementation:**

```tsx
import { Loader2 } from 'lucide-react';

export function NarrativeCard({ phase }: { phase: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await loadNarrativeData(phase);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Card content */}
      <div className="p-4">
        <h3>Narrative: {phase}</h3>
        {/* ... card content ... */}
      </div>

      {/* Card-Level Loader Overlay */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"
          role="status"
          aria-live="polite"
          aria-label="Loading narrative data"
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-hidden="true" />
            <p className="text-sm text-gray-600">Loading {phase} narrative...</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Visual Example:**

```
┌─────────────────────────────────────┐
│ Header / Navigation ✓               │ ← Still clickable!
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │ ← White overlay (80%)
│ │░░░░░░░░░  ◉  ░░░░░░░░░░░░░░░░░░░│ │ ← Spinner (64px)
│ │░░░░░ Loading narrative... ░░░░░░░│ │ ← Message
│ │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ │
│ └─────────────────────────────────┘ │
│                                     │
│ Other content still visible ✓       │
└─────────────────────────────────────┘
```

**Key Characteristics:**
- **Position**: `absolute inset-0` (covers parent component only)
- **z-index**: 10 (above component content, below global elements)
- **Overlay**: `bg-white/80` (white at 80% opacity)
- **Spinner**: 64x64px (`h-8 w-8`)
- **Blocking**: Only the specific component - can navigate away

---

### Tier 3: Page-Level Loader

**When to Use:**
- **ANY database mutation** (Save, Delete, Update operations)
- Long-running operations (> 5 seconds)
- Wizard step transitions with data preparation
- AI operations that generate or modify data
- Critical blocking operations where navigation would cause data inconsistency

**Critical Rule**: **Mutation changes database → Page-Level** (blocks navigation, prevents state management complexity)

**Visual Appearance:**
- ENTIRE PAGE covered by semi-transparent dark overlay (20% black opacity)
- Large blue spinner (96x96px) centered in viewport
- White card container around spinner and messages
- Primary message in bold (what's happening)
- Secondary message in gray (time expectation or additional context)
- Header, navigation, all content completely inaccessible
- Truly modal experience - user cannot interact with anything

**Implementation:**

```tsx
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function FillQAButton({ incidentId, questionCount }: { incidentId: string; questionCount: number }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFillQA = async () => {
    setIsGenerating(true);
    try {
      await generateMockAnswers({ incidentId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button onClick={handleFillQA} disabled={isGenerating}>
        Fill Q&A
      </button>

      {/* Page-Level Loader */}
      {isGenerating && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
          role="status"
          aria-live="polite"
          aria-label="Generating answers, please wait"
        >
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" aria-hidden="true" />
              <p className="text-base font-medium">
                Generating answers for {questionCount} questions...
              </p>
              <p className="text-sm text-gray-500">
                This may take up to 30 seconds
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
```

**Visual Example:**

```
████████████████████████████████████████ ← Dark overlay (20% black)
████████████████████████████████████████   BLOCKS EVERYTHING
████████████████████████████████████████
████████  ┌─────────────────────┐  █████
████████  │         ◉          │  █████ ← Large spinner (96px)
████████  │   Processing...     │  █████ ← Bold primary message
████████  │ This may take a     │  █████ ← Gray secondary message
████████  │   few moments       │  █████
████████  └─────────────────────┘  █████ ← White card container
████████████████████████████████████████
```

**Key Characteristics:**
- **Position**: `fixed inset-0` (covers ENTIRE viewport including header/nav)
- **z-index**: 50 (above absolutely everything)
- **Overlay**: `bg-black/20` (black at 20% opacity)
- **Spinner**: 96x96px (`h-12 w-12`)
- **Container**: White Card component with padding (`p-6`)
- **Blocking**: EVERYTHING - user cannot interact with any part of application

**Message Examples by Context:**

```typescript
// Fill Q&A operation
<p>Generating answers for {questionCount} questions...</p>
<p className="text-sm text-gray-500">This may take up to 30 seconds</p>

// Wizard step transition
<p>Preparing Step 3...</p>
<p className="text-sm text-gray-500">Loading questions for next phase</p>

// Form save mutation
<p>Saving changes...</p>
<p className="text-sm text-gray-500">This may take a few moments</p>
```

---

## Design Tokens

### Spinner Specifications

| Tier | Size | Tailwind Class | Pixels |
|------|------|----------------|--------|
| Inline | Small | `h-4 w-4` | 16x16px |
| Card | Medium | `h-8 w-8` | 64x64px |
| Page | Large | `h-12 w-12` | 96x96px |

**Consistent Across All Tiers:**
- **Color**: `text-blue-500` (#3b82f6)
- **Animation**: `animate-spin` (1 rotation per second)
- **Icon**: `Loader2` from `lucide-react`

### Overlay Specifications

| Tier | Background | Tailwind Class | Purpose |
|------|------------|----------------|---------|
| Inline | None | N/A | No overlay needed |
| Card | White 80% | `bg-white/80` | Dims content, maintains visibility |
| Page | Black 20% | `bg-black/20` | Blocks interaction, slight dim |

**Why Different Overlays:**
- **Card-Level**: White overlay heavily dims content (user sees 20% of original) - emphasizes "this section is busy"
- **Page-Level**: Black overlay lightly dims content (user sees 80% of original) - emphasizes "wait for this to complete" without completely hiding context

### Text Colors

- **Primary message**: Default text color (inherits from theme)
- **Secondary message**: `text-gray-500` (#6b7280)
- **Card-Level message**: `text-gray-600` (#4b5563) - slightly darker for better contrast on white overlay

### z-index Layering

- **Inline**: No overlay, no z-index needed
- **Card-Level**: `z-10` (above component content, below global UI elements)
- **Page-Level**: `z-50` (above everything including navigation and modals)

---

## Accessibility Guidelines

### Screen Reader Support

**All loading states MUST include:**

1. **Container with `role="status"`**: Announces state changes
2. **`aria-live="polite"`**: Announces without interrupting current screen reader activity
3. **`aria-label`**: Descriptive text for screen readers
4. **Spinner with `aria-hidden="true"`**: Hide decorative spinner from screen readers
5. **Visible text message**: Screen readers read the actual text

**Example Implementation:**

```tsx
<div
  role="status"
  aria-live="polite"
  aria-label="Loading, please wait"
>
  <Loader2 className="h-8 w-8 animate-spin text-blue-500" aria-hidden="true" />
  <p>Loading data...</p>  {/* Screen reader reads this */}
</div>
```

### What Screen Reader Users Hear

**Inline Spinner:**
```
[Button clicked]
"Saving, please wait"
[Short pause]
"Saved successfully"
```

**Card-Level Loader:**
```
[Operation triggered]
"Status: Loading narrative data, please wait"
"Loading before event narrative..."
[Complete]
"Status: Complete"
```

**Page-Level Loader:**
```
[Mutation triggered]
"Status: Generating answers for 4 questions, please wait"
"This may take up to 30 seconds"
[User hears nothing else - knows to wait]
[Complete]
"Status: Complete"
```

### Focus Management

**Page-Level Loaders:**
- Consider trapping focus within the loading card
- Prevent tab navigation to hidden content
- Restore focus to trigger element when complete

```tsx
// Optional: Focus trap for Page-Level loaders
useEffect(() => {
  if (isLoading) {
    // Trap focus in loading overlay
    const previousFocus = document.activeElement;
    // ... focus trap logic ...
    return () => {
      // Restore focus when done
      previousFocus?.focus();
    };
  }
}, [isLoading]);
```

---

## State Management Guidelines

### Simple Boolean State (Recommended)

For most cases, a simple boolean suffices:

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleOperation = async () => {
  setIsLoading(true);
  try {
    await performOperation();
  } finally {
    setIsLoading(false); // Always executes, even on error
  }
};
```

### Why Page-Level Blocking Simplifies State

**User Decision** (from Story 0.8 Q&A):
- **Blocking users during mutations is acceptable** - eliminates complex state management
- **No cancellation logic needed** - mutations complete, then loader disappears
- **No "what if they navigate away"** - they can't (Page-Level blocks everything)

**Implementation Benefits:**
- ✅ Simple `isLoading` boolean
- ✅ No navigation event handling
- ✅ No state rollback logic
- ✅ No cancellation tokens
- ✅ No "orphaned mutation" concerns

---

## Visual Comparison: Card vs Page Level

| Aspect | Card-Level | Page-Level |
|--------|------------|------------|
| **Overlay Color** | White (`bg-white/80`) | Black (`bg-black/20`) |
| **Overlay Scope** | One component/card | Entire viewport |
| **Spinner Size** | Medium (64px) | Large (96px) |
| **Container** | None (just overlay) | White Card component |
| **Navigation** | Header/nav visible & clickable | Everything blocked |
| **Other Content** | Visible through overlay | Dimmed but visible |
| **z-index** | 10 (local) | 50 (global) |
| **User Can** | Navigate away, interact elsewhere | Nothing - completely trapped |
| **Feel** | "This section is loading" | "Wait for this to complete" |

---

## Common Use Cases

### Inline Spinner Use Cases
- ✅ Auto-save while typing
- ✅ Quick field validation
- ✅ Button-level feedback for fast operations
- ✅ Toggle switch state changes
- ❌ Database mutations (use Page-Level)
- ❌ Long-running operations (use Card or Page-Level)

### Card-Level Loader Use Cases
- ✅ Refreshing one section's data
- ✅ Loading data for a specific component
- ✅ Filtering/sorting operations
- ✅ Non-mutation data fetch operations
- ❌ Database mutations (use Page-Level)
- ❌ Operations requiring full page blocking

### Page-Level Loader Use Cases
- ✅ ANY database mutation (Create, Update, Delete)
- ✅ Fill Q&A button (AI answer generation)
- ✅ Wizard step transitions with data prep
- ✅ Form submissions that save data
- ✅ File uploads that modify database
- ✅ Batch operations
- ✅ Long AI operations (> 5 seconds)

---

## Testing Guidelines

### Manual Testing Checklist

- [ ] Loader appears immediately when operation starts
- [ ] Correct spinner size for tier
- [ ] Correct overlay color and opacity
- [ ] Message is contextual and clear
- [ ] Screen reader announces loading state
- [ ] Loader disappears when operation completes
- [ ] Loader disappears if operation errors
- [ ] For Page-Level: Navigation completely blocked
- [ ] For Card-Level: Other page sections remain interactive
- [ ] Visual consistency with other loaders in app

### Simulating Delays for Testing

```typescript
// Add artificial delay for testing
const testOperation = async () => {
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
  await actualOperation();
};
```

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';

describe('PageLevelLoader', () => {
  it('should render with correct message', () => {
    render(<PageLevelLoader message="Processing..." submessage="Please wait" />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    render(<PageLevelLoader message="Loading" />);
    const loader = screen.getByRole('status');
    expect(loader).toHaveAttribute('aria-live', 'polite');
  });

  it('should hide spinner from screen readers', () => {
    render(<PageLevelLoader message="Loading" />);
    const spinner = screen.getByRole('status').querySelector('svg');
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });
});
```

---

## Migration from Existing Patterns

### If You Already Have Loading Indicators

**Audit Questions:**
1. Is this operation a database mutation?
   - **Yes** → Migrate to Page-Level Loader
   - **No** → Continue to step 2

2. How long does the operation take?
   - **< 2 seconds** → Use Inline Spinner
   - **2-5 seconds** → Use Card-Level Loader
   - **> 5 seconds** → Use Page-Level Loader

3. Does it need to block navigation?
   - **Yes** → Use Page-Level Loader
   - **No** → Use Card or Inline based on duration

### Common Migration Scenarios

**From: Custom spinner in button**
→ To: Inline Spinner pattern (if < 2s, not a mutation)
→ To: Page-Level Loader pattern (if mutation)

**From: Modal with "Processing..." text**
→ To: Page-Level Loader with contextual message

**From: No loading indicator at all**
→ To: Assess operation type and duration, apply appropriate tier

---

## Related Patterns

- **[Error Handling](./error-handling.md)**: How to handle errors during loading states
- **[Form Patterns](./form-patterns.md)**: Form submission with loading states
- **[Backend Patterns](./backend-patterns.md)**: Mutation patterns that require Page-Level loaders

---

## References

- **Story 6.4**: Original loading pattern design and implementation
- **Story 0.8**: Pattern extraction and comprehensive documentation
- **Q&A Session (Story 0.8)**: User confirmation of Page-Level blocking approach
- **[Tailwind CSS Opacity Documentation](https://tailwindcss.com/docs/background-color#changing-the-opacity)**: Overlay opacity syntax
- **[lucide-react Loader2 Icon](https://lucide.dev/icons/loader-2)**: Spinner icon documentation

---

## Changelog

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2025-10-26 | 1.0 | Initial pattern documentation extracted from Story 6.4 and Story 0.8 | Story 0.8 Implementation |
