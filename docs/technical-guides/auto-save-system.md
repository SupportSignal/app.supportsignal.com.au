# Auto-Save System

This document describes the reusable auto-save system for forms and wizard steps.

## Overview

The auto-save system provides consistent, debounced auto-saving across the application with proper error handling and visual feedback.

### Key Components

1. **`useAutoSave` Hook** - Core auto-save logic
2. **`AutoSaveIndicator` Component** - Visual status feedback
3. **Example Implementation** - Reference patterns

## Usage

### Basic Implementation

```typescript
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';

const { autoSaveState, triggerSave } = useAutoSave(
  formData, // Data to watch for changes
  async (data) => {
    // Your save function
    await api.updateSomething(data);
  },
  {
    debounceMs: 3000, // 3 second delay (optional)
    enabled: true, // Enable/disable (optional) 
  }
);

// In your JSX:
<AutoSaveIndicator 
  autoSaveState={autoSaveState} 
  variant="status-bar" 
/>
```

### Advanced Options

```typescript
const { autoSaveState, triggerSave, clearError } = useAutoSave(
  formData,
  saveFn,
  {
    debounceMs: 2000,
    enabled: !!sessionToken,
    saveOnMount: false,
    onSuccess: () => console.log('Saved!'),
    onError: (error) => console.error(error),
  }
);
```

### Visual Variants

```typescript
// Header/status bar style (recommended)
<AutoSaveIndicator autoSaveState={autoSaveState} variant="status-bar" />

// Inline badge style
<AutoSaveIndicator autoSaveState={autoSaveState} variant="badge" />

// Simple inline style  
<AutoSaveIndicator autoSaveState={autoSaveState} variant="inline" />
```

## Migration from Old Auto-Save

### Before (Custom Implementation)

```typescript
// ❌ Old approach - lots of boilerplate
const [isSaving, setIsSaving] = useState(false);
const [lastSaveTime, setLastSaveTime] = useState(null);
const timeoutRef = useRef(null);

const triggerAutoSave = () => {
  if (timeoutRef.current) clearTimeout(timeoutRef.current);
  timeoutRef.current = setTimeout(async () => {
    setIsSaving(true);
    try {
      await saveFn();
      setLastSaveTime(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, 3000);
};
```

### After (Reusable Hook)

```typescript
// ✅ New approach - clean and consistent
const { autoSaveState } = useAutoSave(data, saveFn);
```

## Auto-Save Behavior

1. **User types** → Data changes detected
2. **3 seconds of inactivity** → "Saving..." appears
3. **API call completes** → "✓ Saved [time]" appears
4. **On error** → "Save failed" appears (doesn't get stuck)

## Best Practices

### When to Use Auto-Save

✅ **Use for:**
- Long-form text areas (narratives, descriptions)
- Complex multi-field forms
- Wizard steps with valuable data
- Draft/work-in-progress content

❌ **Don't use for:**
- Simple forms (name, email)
- Login/authentication forms  
- Quick single-field inputs
- Forms with sensitive data that shouldn't auto-save

### Configuration Guidelines

- **Text areas**: 3-5 second debounce
- **Form fields**: 2-3 second debounce
- **Large forms**: Enable only after user starts editing
- **Critical data**: Add manual save buttons as backup

### Error Handling

```typescript
const { autoSaveState } = useAutoSave(data, saveFn, {
  onError: (error) => {
    // Log to monitoring service
    console.error('Auto-save failed:', error);
    
    // Show user-friendly message
    toast.error('Unable to save changes. Please try again.');
  },
});
```

## Examples

See `apps/web/components/examples/auto-save-example.tsx` for a complete working example.

## Current Implementations

- **NarrativeGrid** - Multi-phase incident narratives (✅ Migrated)
- **ParticipantForm** - Participant editing (✅ Migrated - edit mode only)
- **ClarificationStep** - Q&A responses (🚧 Uses custom multi-question variant)

## Migration Checklist

When adding auto-save to existing components:

1. [ ] Import `useAutoSave` and `AutoSaveIndicator`
2. [ ] Replace custom auto-save logic with hook
3. [ ] Add visual indicator to header/form
4. [ ] Test with network failures
5. [ ] Remove old timeout/state management code
6. [ ] Update component tests if needed