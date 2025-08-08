# Schema Validation Lessons Learned

## Critical Learning: Always Validate Against Actual Database Schema

### Context
During Story 1.4 creation, incorrect database schema definitions were included in the story documentation without validating against the actual Convex database schema.

### The Problem
**What Happened**: Story documentation included invented field names and schema structures that didn't match the actual database schema.

**Specific Issues Identified**:
- Used invented field names like `reporterName`, `eventDateTime`, `createdAt` 
- Should have used actual field names like `reporter_name`, `event_date_time`, `created_at`
- Failed to use available Convex MCP tools to verify schema accuracy

### The Solution
**ALWAYS use Convex MCP for schema validation**:

```typescript
// Use these MCP commands to get actual schema
mcp__convex__status       // Get deployment info
mcp__convex__tables       // Get actual table schemas and field names
```

**Key Principle**: Whatever you document MUST match the actual schema, regardless of naming conventions or preferences.

### Updated Workflow
1. **Before documenting any schema**: Use Convex MCP to get actual table structures
2. **Copy exact field names**: Don't invent or "correct" field naming - use what exists
3. **Verify types and constraints**: Match actual field types and optional/required status
4. **Document source**: Always specify "[Source: Actual Convex Database Schema via MCP]"

### Prevention Rules
- **Never invent schema definitions** - always verify against actual database
- **Use MCP tools proactively** when any database schema is referenced
- **Field names are facts, not preferences** - match exactly what exists
- **Schema consistency is critical** for developer success

### Impact
This lesson prevents:
- Developer confusion when implementing APIs
- Runtime errors from mismatched field names
- Wasted time debugging non-existent schema issues
- Loss of developer trust in documentation accuracy

### Documentation Standard
When documenting database schemas, ALWAYS:
1. Use Convex MCP to get current schema
2. Copy field names exactly as they exist
3. Include full type definitions with unions and optionals
4. Note the verification source in comments
5. **Flag schema inconsistencies** when discovered

### Schema Consistency Issues Discovered
During Story 1.4 validation, identified naming convention inconsistencies:

**Issue**: `incident_classifications` table uses PascalCase for enum values:
- `incident_type: "Behavioural" | "Environmental" | "Medical" | "Communication" | "Other"`
- `severity: "Low" | "Medium" | "High"`

**Expected Convention**: Should use lowercase snake_case like other status fields:
- `capture_status: "draft" | "in_progress" | "completed"`
- `analysis_status: "not_started" | "in_progress" | "completed"`

**Documentation Approach**: 
- Document current schema exactly as it exists
- Add inline comments noting the inconsistency
- Flag for future schema normalization

**Resolution in Story 1.4**:
Schema normalization was incorporated into Story 1.4 (Core API Layer) to address the inconsistency:
- Updated enum values to use consistent lowercase naming convention
- Created data migration to convert existing records
- Updated all affected code from Stories 1.2 and 1.3

This ensures documentation matches reality while identifying improvements needed.

## Story 1.4 Schema Migration Critical Learning

### The Migration Challenge
**Problem Discovered**: Production data contained 21 `incident_classifications` records with PascalCase enum values conflicting with new snake_case schema.

**Critical Error**: 
```
Document with ID 'n1701v1n9cw56drs52va3xb0kwh7n7yym' in table 'incident_classifications' 
does not match the schema
```

### The 3-Step Migration Solution

**Step 1**: Relax Schema Validation (Temporary)
```typescript
// Allow both old and new enum formats during migration
incident_type: v.union(
  v.literal("behavioural"), v.literal("environmental"), // New format
  v.literal("Behavioural"), v.literal("Environmental")  // Old format (temp)
)
```

**Step 2**: Deploy Functions & Migrate Data
```javascript
// Migration script updated 21 records
const records = await ctx.db.query("incident_classifications").collect();
const updates = records.map(record => ({
  ...record,
  incident_type: record.incident_type.toLowerCase(),
  severity: record.severity.toLowerCase()
}));
```

**Step 3**: Restore Strict Schema
```typescript
// Final schema with only new format
incident_type: v.union(
  v.literal("behavioural"), v.literal("environmental"),
  v.literal("medical"), v.literal("communication"), v.literal("other")
)
```

### Integration Impact on Story 1.4 Testing

**Before Migration**: API testing completely blocked
- Integration tests failed with schema validation errors
- Unable to assess actual API implementation status
- Could not distinguish between schema vs implementation issues

**After Migration**: Clear API assessment possible  
- Enabled 70.4% success rate testing with real authentication
- Discovered 87% API implementation complete (not 66.7% as initially thought)
- Allowed proper Story 1.4 completion assessment

### Future Schema Migration Best Practices

1. **Plan for Production Data**: Always assume production contains data in old format
2. **3-Step Migration Pattern**: Relax → Deploy/Migrate → Restore strict validation
3. **Test Migration Scripts**: Validate against realistic data volumes
4. **Migration as Deployment Requirement**: Schema changes require data migration planning
5. **Enum Consistency**: Establish and enforce naming conventions across all enum fields

### Connection to API Testing Methodology

The schema migration enabled the multi-phase API testing methodology:
- **Without schema fix**: No API testing possible
- **With schema fix**: Full API existence, authentication, and workflow testing possible

This demonstrates how foundational issues (schema validation) can completely mask implementation assessment, making systematic problem-solving approach critical for accurate project status evaluation.