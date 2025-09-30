# Convex Platform Constraints

**Created**: 2025-09-30
**Last Updated**: 2025-09-30
**Related Assets**: [Backend Patterns](../patterns/backend-patterns.md)
**Status**: Active

## Overview

Lessons learned about Convex platform-specific constraints, limitations, and requirements that impact development patterns and file organization.

## File Naming Constraints

### Convex Module Naming Requirements

**Context**: During AI prompt template implementation (Story 6.1)
**Challenge**: Convex rejected hyphenated filenames in module imports
**Solution**: Use underscore naming convention for Convex modules

**Problem Encountered**:
```typescript
// ❌ This failed in Convex deployment
import { PromptResolver } from './lib/prompts/prompt-resolver';

// File: apps/convex/lib/prompts/prompt-resolver.ts
// Error: Convex module names must use alphanumeric characters, underscores, or periods only
```

**Solution Applied**:
```typescript
// ✅ This works in Convex
import { PromptResolver } from './lib/prompts/prompt_resolver';

// File: apps/convex/lib/prompts/prompt_resolver.ts
// Successfully deployed and imported
```

**Rule Established**:
- **Convex modules**: Use underscore convention (`snake_case`)
- **Regular TypeScript**: Can use hyphens (`kebab-case`)
- **Applies to**: All files in `apps/convex/` directory

**Impact**: Medium - affects file naming conventions for Convex modules

### File Naming Convention Matrix

| Context | Naming Convention | Example | Works in Convex |
|---------|------------------|---------|-----------------|
| Convex Functions | snake_case | `prompt_templates.ts` | ✅ |
| Convex Utilities | snake_case | `prompt_resolver.ts` | ✅ |
| Web Components | PascalCase | `PromptTemplateForm.tsx` | N/A |
| Web Utilities | kebab-case | `prompt-template-service.ts` | N/A |
| Web Utilities | camelCase | `promptTemplateService.ts` | N/A |

**Discovery Method**: Deployment failure with clear error message during Story 6.1 implementation

## Module Import Constraints

### Convex Import Path Requirements

**Context**: Convex module resolution differs from Node.js/Next.js
**Implementation**: Use relative imports with proper file extensions in Convex

**Patterns That Work**:
```typescript
// ✅ Relative imports with explicit paths
import { DefaultPrompts } from './lib/prompts/default_prompts';
import { PromptResolver } from './lib/prompts/prompt_resolver';

// ✅ Generated API imports
import { api } from './_generated/api';
```

**Patterns to Avoid**:
```typescript
// ❌ Node.js style module resolution doesn't work
import { PromptResolver } from './lib/prompts'; // Won't find index file

// ❌ Absolute imports may not resolve correctly
import { PromptResolver } from 'convex/lib/prompts/prompt_resolver';
```

**Impact**: Low - standard Convex development pattern

## Database Schema Constraints

### Schema Definition Requirements

**Context**: Convex uses runtime schema validation
**Implementation**: All database operations must match schema exactly

**Key Constraints**:
- Schema changes require deployment
- Field types must match exactly (no implicit conversions)
- Indexes must be defined before use in queries
- Document IDs are auto-generated (no custom IDs)

**Pattern Example**:
```typescript
// ✅ Proper schema definition with validation
ai_prompt_templates: defineTable({
  name: v.string(), // Required for all records
  prompt_template: v.string(),
  variables: v.array(v.object({
    name: v.string(),
    type: v.union(v.literal("string"), v.literal("number"), v.literal("boolean")),
    required: v.boolean(),
  })),
  is_active: v.boolean(),
  version: v.number(),
  created_at: v.number(), // Unix timestamp
})
  .index("by_name", ["name"]) // Required for name-based queries
  .index("by_active", ["is_active"]) // Required for active status filtering
```

**Impact**: High - affects all database operations

## Authentication Context Constraints

### Context Type Limitations

**Context**: Complex context type unions cause TypeScript cascade failures
**Solution**: Use specific context types, avoid complex unions

**Problematic Pattern**:
```typescript
// ❌ This pattern caused TypeScript crashes in Story 6.1
export const requirePermission = (
  ctx: QueryCtx | MutationCtx | ActionCtx,  // Complex union breaks TypeScript
  permission: string
) => { /* ... */ };
```

**Recommended Pattern**:
```typescript
// ✅ Use specific context types
export const requirePermissionQuery = (
  ctx: QueryCtx,  // Specific type
  permission: string
) => { /* ... */ };

export const requirePermissionMutation = (
  ctx: MutationCtx,  // Specific type
  permission: string
) => { /* ... */ };
```

**Impact**: High - prevents development environment crashes

## Performance Constraints

### Function Execution Limits

**Context**: Convex functions have execution time and memory limits
**Implementation**: Design functions for efficiency and quick execution

**Limits Observed**:
- Query functions: Optimized for real-time performance
- Mutation functions: Should complete quickly (< 10 seconds typical)
- Action functions: Can run longer but should handle timeouts

**Design Patterns**:
```typescript
// ✅ Efficient query with proper indexing
export const getActivePromptTemplates = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("ai_prompt_templates")
      .withIndex("by_active", q => q.eq("is_active", true)) // Uses index
      .collect();
  }
});

// ✅ Batch operations for efficiency
export const createMultipleTemplates = mutation({
  handler: async (ctx, args) => {
    const results = [];
    for (const template of args.templates) {
      const id = await ctx.db.insert("ai_prompt_templates", template);
      results.push(id);
    }
    return results;
  }
});
```

**Impact**: Medium - affects system performance and scalability

## Future Considerations

### Platform Evolution Tracking

1. **Monitor Convex Updates**: Platform constraints may evolve with new releases
2. **File Naming Standards**: Establish consistent patterns across all Convex modules
3. **Performance Monitoring**: Track execution times and optimize as needed
4. **Schema Evolution**: Plan for schema migrations and versioning

### Related Knowledge Assets

- **Pattern**: [Backend Patterns - Type-Safe Database Operations](../patterns/backend-patterns.md#type-safe-database-operations)
- **Example**: AI prompt template implementation from Story 6.1
- **Anti-Pattern**: Complex context type unions documented in backend patterns

This document captures platform-specific constraints discovered during real implementation to prevent repeated discovery and debugging cycles.