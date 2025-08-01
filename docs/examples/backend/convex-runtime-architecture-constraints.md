# Convex Runtime Architecture Constraints

**Knowledge-Driven Development Process**  
**Topic**: Convex V8 vs Node.js Runtime Separation Patterns  
**Date**: 2025-01-25  
**Model**: Claude Sonnet 4 (claude-sonnet-4-20250514)  
**Context**: Learned during Story 4.2 implementation

## Executive Summary

Story 4.2 implementation encountered critical Convex runtime violations that caused deployment failures, leading to architectural insights about Convex's V8 vs Node.js runtime separation. The errors were completely predictable based on Convex's documented constraints but highlight the importance of runtime-aware architectural planning.

### Key Issue Transformation

- **Initial Implementation**: Mixed Node.js and V8 runtime code in same files
- **Production Reality**: Convex enforces strict runtime separation at deployment
- **Final Architecture**: Separated actions (Node.js) from mutations/queries (V8)

## Critical Runtime Violations Encountered

### 1. Node.js Module Usage in V8 Runtime

**Error**: `Could not resolve 'crypto'`  
**Root Cause**: V8 runtime (mutations/queries) cannot access Node.js modules  
**Files Affected**: `agent.ts`, `knowledge.ts` with crypto.randomUUID() usage

### 2. Mixed Runtime Functions in Single File

**Error**: `createChatMessage defined in agent.js is a Mutation function. Only actions can be defined in Node.js`  
**Root Cause**: Files with `"use node"` directive can only export actions  
**Files Affected**: All files attempting to mix mutations/queries with Node.js code

## Convex Runtime Architecture Rules

### V8 Runtime (Default)
- **Functions**: Mutations and Queries only
- **Node.js APIs**: ❌ Not available
- **External APIs**: ❌ Not recommended
- **Performance**: ⚡ Optimized for database operations
- **Directive**: None required (default)

### Node.js Runtime (Opt-in)
- **Functions**: Actions only
- **Node.js APIs**: ✅ Full access (crypto, fs, etc.)
- **External APIs**: ✅ Recommended for HTTP calls
- **Performance**: 🔄 Standard Node.js execution
- **Directive**: `"use node";` required at top of file

## Architectural Solution Implemented

### File Separation Strategy

**Before (Broken)**:
```
agent.ts           // ❌ "use node" + mutations = deployment error
knowledge.ts       // ❌ crypto usage in V8 runtime = build error
```

**After (Fixed)**:
```
agent.ts           // ✅ V8 runtime - mutations/queries only
agentActions.ts    // ✅ Node.js runtime - OpenRouter API actions
knowledge.ts       // ✅ V8 runtime - mutations/queries only  
knowledgeActions.ts // ✅ Node.js runtime - crypto + embedding actions
```

### Runtime-Specific Implementations

#### V8 Runtime Adaptations

**Simple ID Generation** (replaced crypto.randomUUID()):
```typescript
function generateSimpleId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**Database Operations** (mutations/queries):
```typescript
// apps/convex/agent.ts
export const createChatMessage = internalMutation({
  // V8 runtime - database operations only
});
```

#### Node.js Runtime Implementations

**External API Actions**:
```typescript
// apps/convex/agentActions.ts
"use node";
import crypto from 'crypto';

export const generateResponse = action({
  // Node.js runtime - external API calls + crypto
});
```

## Prevention Strategy for Future Development

### 1. Plan Runtime Separation Upfront

**Design Pattern**:
- **Database Layer**: V8 runtime (mutations/queries)
- **Integration Layer**: Node.js runtime (actions)
- **Never Mix**: Different runtimes in same file

### 2. Runtime Decision Matrix

| Operation Type | Runtime | File Pattern |
|---------------|---------|--------------|
| Database CRUD | V8 | `*.ts` (no directive) |
| External APIs | Node.js | `*Actions.ts` with `"use node"` |
| File System | Node.js | `*Actions.ts` with `"use node"` |
| Crypto Operations | Node.js | `*Actions.ts` with `"use node"` |
| Simple Utils | V8 | `*.ts` (prefer V8 for performance) |

### 3. Action → Mutation Pattern

**Recommended Flow**:
1. **Action** calls external API (Node.js runtime)
2. **Action** calls **Mutation** to store results (V8 runtime)
3. Never attempt complex operations in wrong runtime

```typescript
// agentActions.ts ("use node")
export const generateResponse = action({
  handler: async (ctx, args) => {
    // 1. Call OpenRouter API (Node.js)
    const response = await callOpenRouterAPI(args.message);
    
    // 2. Store in database (V8 via mutation)
    await ctx.runMutation(api.agent.createChatMessage, {
      content: response.content,
      // ... other fields
    });
    
    return response;
  }
});

// agent.ts (V8 runtime)
export const createChatMessage = internalMutation({
  // Pure database operation
});
```

## Architectural Lessons Learned

### What Worked Well

1. **Clear Runtime Separation**: Once separated, each runtime performed optimally
2. **Action Pattern**: External APIs in actions, database ops in mutations
3. **Simple Fallbacks**: V8-compatible alternatives for common operations
4. **Documentation**: Convex docs clearly explain these constraints

### Predictability Assessment

**YES - This issue was completely predictable because:**

1. **Well-Documented Constraints**: Convex documentation clearly states runtime rules
2. **Clear Error Messages**: Deployment errors explicitly mention runtime violations  
3. **Architectural Pattern**: Other Convex projects follow action/mutation separation
4. **Build-Time Validation**: Convex build process enforces these rules

### Prevention Checklist

**Before Writing Convex Functions:**

- [ ] Will this function call external APIs? → Use Action with `"use node"`
- [ ] Will this function use Node.js modules? → Use Action with `"use node"`
- [ ] Is this purely database operations? → Use Mutation/Query (V8 runtime)
- [ ] Do I need both? → Separate into different files

**During Development:**

- [ ] Test deployment early and often
- [ ] Use `bunx convex dev` to catch runtime errors quickly
- [ ] Follow established file naming patterns (`*Actions.ts` for Node.js)

**Code Review:**

- [ ] No `"use node"` files with mutations/queries
- [ ] No Node.js module imports in V8 runtime files
- [ ] External API calls only in actions
- [ ] Database operations only in mutations/queries

## Pattern Documentation for Future Reference

### Convex Runtime Separation Pattern

**Intent**: Separate Node.js and V8 runtime code to comply with Convex constraints

**Structure**:
```
// V8 Runtime Files (mutations/queries)
entity.ts              // Database operations only
entityQueries.ts       // Complex queries if needed

// Node.js Runtime Files (actions)  
entityActions.ts       // External APIs + file operations
entityIntegrations.ts  // Third-party service integrations
```

**Benefits**:
- Clear separation of concerns
- Optimal performance for each runtime
- Predictable deployment behavior
- Easy to reason about and maintain

**When to Use**: Always for Convex development

## Technical Debt Assessment

### ✅ Well-Architected Areas

- **Clear file separation** following runtime constraints
- **Consistent naming patterns** (*Actions.ts for Node.js runtime)
- **Simple fallback implementations** for V8 runtime limitations
- **Action → Mutation pattern** for external API → database flow

### 📚 Knowledge Gaps Addressed

- **Runtime constraint documentation** now embedded in team knowledge
- **Prevention checklist** for future Convex development
- **Architectural decision matrix** for runtime selection
- **Pattern examples** for common operations

### 🔄 Future Considerations

- **Build-time validation**: Could add custom linting rules to catch violations early
- **Template scaffolding**: Code generation templates that follow correct patterns
- **Team training**: Ensure all developers understand Convex runtime constraints

## Conclusion

The Convex runtime violations in Story 4.2 were entirely preventable through proper architectural planning. The constraints are well-documented and the error messages are clear. This experience highlights the critical importance of:

1. **Reading platform documentation thoroughly** before architectural decisions
2. **Understanding runtime constraints** for hybrid platforms like Convex
3. **Planning file organization** around platform capabilities
4. **Testing deployment early** to catch constraint violations

**Key Insight**: Convex's V8/Node.js runtime separation is a feature, not a limitation. It optimizes performance by using the right runtime for each operation type. The architectural pattern of actions → mutations provides both performance and reliability benefits.

**Total Refactoring Required**: ~4 hours to separate files and adapt implementations  
**Prevention Cost**: 30 minutes of architectural planning  
**Knowledge Generated**: Clear patterns for all future Convex development

This story demonstrates how platform-specific constraints, when understood and embraced, lead to better architectural decisions and more maintainable code.