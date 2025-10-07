# LLM Testing Feature Removal

**Date**: 2025-10-07
**Reason**: Developer/admin-only testing tool, not actively used

## Files Removed

1. **Backend**: `apps/convex/llmTest.ts` (366 lines)
   - Convex action for testing LLM communication
   - Speed test functionality

2. **Route**: `apps/web/app/test-llm/page.tsx` (105 lines)
   - Dedicated LLM testing page

3. **Component**: `apps/web/components/dev/llm-test-interface.tsx` (438 lines)
   - React component for LLM testing UI

## Files Modified

1. **`apps/web/app/admin/page.tsx`**
   - Removed LLM Testing card from Developer Tools section

2. **`apps/web/app/dev/page.tsx`**
   - Removed LLMTestInterface import and usage

## Restoration Instructions

If you need to restore this feature:

```bash
# Restore backend
cp .archived-code/2025-10-07-llm-testing-removal/llmTest.ts apps/convex/

# Restore route
mkdir -p apps/web/app/test-llm
cp .archived-code/2025-10-07-llm-testing-removal/test-llm-page.tsx apps/web/app/test-llm/page.tsx

# Restore component
cp .archived-code/2025-10-07-llm-testing-removal/llm-test-interface.tsx apps/web/components/dev/

# Restore admin page card (manual edit required)
# Add back the card definition to apps/web/app/admin/page.tsx

# Restore dev page import (manual edit required)
# Add back the import and usage to apps/web/app/dev/page.tsx

# Deploy
bun run convex:deploy:dev
```

## Impact

- **Lines removed**: 909 lines
- **Routes removed**: `/test-llm`
- **Endpoints removed**: `api.llmTest.testLLMCommunication`, `api.llmTest.llmSpeedTest`
- **External dependencies**: None
