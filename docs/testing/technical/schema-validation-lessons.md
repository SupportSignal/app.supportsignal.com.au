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