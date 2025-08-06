# Convex Database Naming Conventions - KDD

**Date**: 2025-08-06  
**Context**: Schema consistency review and standardization  
**Discovery Method**: Codebase analysis + Industry best practices research

## Problem Discovery

### Initial Inconsistency Identified

**Current Schema Analysis** (`apps/convex/schema.ts`):
- **Tables**: Consistently use `snake_case` (✅)
  - `test_messages`, `debug_logs`, `chat_sessions`, `password_reset_tokens`
- **Fields**: Mixed conventions (❌)
  - `snake_case`: `profile_image_url`, `access_token`, `trace_id`, `user_id`, `created_at`
  - `camelCase`: `userId`, `sessionToken`, `rememberMe`, `hasLLMAccess`

**Problem**: Inconsistent field naming creates maintenance burden and confusion.

## Industry Research Findings

### Convex Official Position
- **Documentation**: No explicit naming convention guidance
- **Examples**: Show `camelCase` usage in samples
- **Constraint**: Table names must use alphanumeric + underscores, cannot start with underscore

### Database Industry Best Practices (2025)

#### Arguments for `snake_case`:
1. **Readability**: Easier visual word separation
2. **Accessibility**: Better for non-native English speakers and vision accessibility
3. **SQL Compatibility**: Works across all database systems
4. **Case-Insensitive Safety**: No conflicts with SQL's case-insensitive nature
5. **Disambiguation**: `under_value` vs `undervalue` - clearer meaning

#### Arguments for `camelCase`:
1. **JavaScript Consistency**: Matches TypeScript/JavaScript conventions
2. **Application Alignment**: Consistent with frontend/backend code

### Research Conclusion
**Winner**: `snake_case` for database schemas due to broader compatibility and readability benefits.

## Knowledge Synthesis

### Recommended Standard: `snake_case` for All Database Elements

**Rationale**:
1. **Consistency**: Your project already uses `snake_case` for tables
2. **Future-Proofing**: Safer for potential database migrations
3. **Readability**: Clearer field identification in queries and debugging
4. **Industry Alignment**: Standard practice for database schemas

### Implementation Pattern

```typescript
// ✅ Consistent snake_case pattern
defineSchema({
  // Table names: snake_case
  debug_logs: defineTable({
    // Field names: snake_case
    trace_id: v.string(),
    user_id: v.optional(v.string()),
    system_type: v.union(v.literal("browser"), v.literal("convex")),
    created_at: v.number(),
    synced_at: v.number(),
    raw_data: v.any(),
  })
    .index('by_trace_id', ['trace_id'])
    .index('by_user_id', ['user_id'])
    .index('by_created_at', ['created_at']),
});
```

## Documentation Standards

### Naming Convention Rules

#### Tables
- **Format**: `snake_case`
- **Pattern**: `{entity_name}` (singular or plural based on context)
- **Examples**: `users`, `chat_sessions`, `debug_logs`, `password_reset_tokens`
- **Avoid**: Starting with underscore, special characters beyond underscore

#### Fields
- **Format**: `snake_case`
- **Pattern**: `{descriptive_name}`
- **Examples**: `user_id`, `created_at`, `profile_image_url`, `has_llm_access`
- **Avoid**: Mixing with `camelCase` in same schema

#### Indexes
- **Format**: `by_{field_name}` or `by_{field1}_{field2}`
- **Examples**: `by_user_id`, `by_trace_id`, `by_created_at`

### Migration Strategy for Existing Inconsistencies

**Current Mixed Fields Requiring Standardization**:
```typescript
// ❌ Current inconsistent naming
sessionId: v.id('chat_sessions'),     // → session_id
userId: v.id('users'),               // → user_id  
sessionToken: v.string(),            // → session_token
rememberMe: v.optional(v.boolean()), // → remember_me
hasLLMAccess: v.optional(v.boolean()), // → has_llm_access
providerAccountId: v.string(),       // → provider_account_id
```

**Implementation Approach**:
1. **New Tables/Fields**: Use `snake_case` immediately
2. **Existing Fields**: Gradual migration during natural schema updates
3. **Indexes**: Update to match field name changes
4. **Application Code**: Update queries and mutations to use new field names

## Key Lessons Learned

### Technical Insights
1. **Convex Flexibility**: Supports both conventions but lacks official guidance
2. **Schema Consistency**: More important than specific convention choice
3. **Cross-Platform Safety**: `snake_case` reduces compatibility risks

### Process Insights
1. **Audit First**: Always analyze current state before standardizing
2. **Industry Research**: Consider broader ecosystem best practices
3. **Migration Planning**: Gradual transition reduces risk

### Best Practices Established
1. **All new schemas**: Must use `snake_case` for tables and fields
2. **Documentation**: Update schema comments to reflect naming standards
3. **Code Reviews**: Enforce naming convention consistency
4. **Migration Timeline**: Address inconsistencies during natural updates

## Future Considerations

### Monitoring
- **Schema Reviews**: Include naming convention checks
- **New Feature Development**: Enforce standards in pull requests
- **Documentation Updates**: Keep `docs/architecture/data-models.md` current

### Potential Challenges
- **Existing Application Code**: May need gradual updates to match schema changes
- **Third-Party Integrations**: Verify compatibility with external systems
- **Team Onboarding**: Ensure new developers understand standards

## Implementation Checklist

- [ ] Update schema documentation to reflect `snake_case` standard
- [ ] Create linting rules to enforce naming conventions
- [ ] Plan migration timeline for existing inconsistent fields
- [ ] Update development guidelines in `CLAUDE.md`
- [ ] Train team members on new standards

---

**Repository**: starter-nextjs-convex-ai  
**Impact**: Improved schema consistency and maintainability  
**Next Review**: When adding new tables or during major schema updates