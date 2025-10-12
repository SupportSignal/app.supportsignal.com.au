# Lesson: TypeScript Directive Ordering in Next.js

**Discovered**: October 11, 2025 (Story 7.4)
**Severity**: Low - Build Error
**Affected**: Next.js pages with `@ts-nocheck` and `'use client'`
**Category**: TypeScript Configuration

## The Issue

TypeScript directive `@ts-nocheck` must be placed **before** the Next.js `'use client'` directive, otherwise TypeScript errors are not suppressed.

### Broken Order (Doesn't Work)

```typescript
'use client';
// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)

import React from 'react';
// ...

// Result: TypeScript still reports errors! ❌
// Error TS2589: Type instantiation is excessively deep and possibly infinite.
```

### Correct Order (Works)

```typescript
// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)
'use client';

import React from 'react';
// ...

// Result: TypeScript errors suppressed ✅
```

## Why This Happens

1. **TypeScript directive must be first**: `@ts-nocheck` needs to be the very first thing in the file (besides whitespace/comments)
2. **'use client' is a string literal**: It's valid JavaScript, so TypeScript parses it before seeing the directive
3. **Order matters**: Once TypeScript starts parsing, it's too late to suppress errors

## The Error We Hit

```bash
web:typecheck: app/admin/companies/[id]/participants/[participantId]/edit/page.tsx(86,5):
error TS2589: Type instantiation is excessively deep and possibly infinite.
```

This was caused by deep Convex type inference in nested queries/mutations.

## When to Use @ts-nocheck

### ✅ Appropriate Use Cases

- Known TypeScript limitations (TS2589 - deep type instantiation)
- Complex Convex queries with nested type inference
- Temporary workaround while fixing type issues
- Interface type mismatches that don't affect runtime

### ❌ Don't Use For

- Real type errors that indicate bugs
- Avoiding proper type definitions
- Production code without documentation
- Files that could be easily fixed with proper types

## Best Practices

### 1. Always Document Why

```typescript
// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)
// Related: https://github.com/microsoft/TypeScript/issues/xxxxx
// TODO: Remove when TypeScript 5.x fixes deep instantiation
'use client';
```

### 2. Use File-Level Only When Necessary

```typescript
// ❌ Don't disable entire file if only one function has issues
// @ts-nocheck
'use client';

// ✅ Better: Use @ts-ignore for specific lines
'use client';

// @ts-ignore - Convex deep type inference
const result = useQuery(api.deeply.nested.query, args);
```

### 3. Check Periodically If Still Needed

```typescript
// @ts-nocheck - TS2589 with Convex types
// Last checked: 2025-10-11
// TypeScript version: 5.4.5
// Can remove when: TypeScript 5.5+ or Convex updates types
'use client';
```

## Directive Ordering Rules

### Complete Order for Next.js Files

```typescript
// 1. TypeScript directives (if needed)
// @ts-nocheck
// or
// @ts-check
// or
// @ts-expect-error

// 2. Next.js directives
'use client';
// or
'use server';

// 3. Module-level strict mode (rare)
'use strict';

// 4. Imports
import React from 'react';
// ...
```

## Testing the Fix

### Before Fix
```bash
$ bun run typecheck

web:typecheck: ERROR: Type instantiation is excessively deep
 Tasks: 3 successful, 4 total
Failed: web#typecheck
```

### After Fix
```bash
$ bun run typecheck

 Tasks: 4 successful, 4 total
  Time: 5.368s
✅ All checks passed
```

## Related Issues

- **TS2589**: Type instantiation is excessively deep and possibly infinite
  - Common with complex generic types
  - Convex type inference can trigger this
  - Not a real error, just TypeScript limitation

- **Cloudflare Edge Runtime**: All pages need `export const runtime = 'edge';`
  - Different from directive ordering
  - Goes in exports, not at top of file

## Real-World Context

**Story 7.4:** Adding comprehensive logging to participant edit page triggered TS2589 error. Fixed by:
1. Moving `@ts-nocheck` before `'use client'`
2. Adding comment explaining why suppression is needed
3. Documenting in this lesson for future reference

**Previous Uses:**
- Participant create page: Already had correct order
- Other Convex-heavy pages: Followed same pattern

## Quick Reference

```typescript
// ✅ CORRECT ORDER
// @ts-nocheck
'use client';

// ❌ WRONG ORDER
'use client';
// @ts-nocheck

// ❌ ALSO WRONG
import React from 'react';
// @ts-nocheck  ← Too late!
'use client';
```

## Related Documentation

- [TypeScript Configuration](../patterns/typescript-configuration.md)
- [Pragmatic Testing Philosophy](../testing/technical/pragmatic-vs-perfectionist-testing-kdd.md)
- Story 7.4: Initial Participant Setup (where fix was applied)

## Key Takeaway

**TypeScript directives must be the FIRST thing in the file.** If you're using Next.js client/server directives, put TypeScript directives first, then Next.js directives, then imports.
