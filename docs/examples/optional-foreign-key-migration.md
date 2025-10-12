# Example: Optional Foreign Key Migration Pattern

**Pattern Name**: Optional Foreign Key Migration
**Use Case**: Adding required relationships to existing data
**Source**: Story 7.4 - Adding site_id to participants table
**Date**: October 2025

## Problem Statement

You need to add a foreign key relationship to an existing table with data, but:
- Cannot make field required immediately (breaks existing records)
- Need time to migrate/populate the data
- Want to eventually enforce the relationship as required

## Solution Pattern

### Three-Phase Approach

**Phase 1: Add Optional Field**
```typescript
// apps/convex/schema.ts
participants: defineTable({
  company_id: v.id("companies"),
  site_id: v.optional(v.id("sites")),  // ← Start as optional
  // ... other fields
})
  .index("by_company", ["company_id"])
  .index("by_site", ["site_id"])  // Can index optional fields
  .index("by_company_and_site", ["company_id", "site_id"])
```

**Phase 2: Migration Script**
```typescript
// apps/convex/participants/migration.ts
import { internalMutation } from '../_generated/server';

export const linkToPrimarySites = internalMutation({
  args: {},
  handler: async (ctx) => {
    const participants = await ctx.db.query('participants').collect();

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const participant of participants) {
      // Skip if already migrated
      if (participant.site_id) {
        skipped++;
        continue;
      }

      try {
        // Find the related entity (site for this company)
        const primarySite = await ctx.db
          .query('sites')
          .withIndex('by_name', (q) =>
            q.eq('company_id', participant.company_id)
             .eq('name', 'Primary')
          )
          .first();

        if (!primarySite) {
          errors.push(`Participant ${participant._id}: No Primary site`);
          continue;
        }

        // Update with foreign key
        await ctx.db.patch(participant._id, {
          site_id: primarySite._id,
          updated_at: Date.now(),
        });

        updated++;
      } catch (error: any) {
        errors.push(`Participant ${participant._id}: ${error.message}`);
      }
    }

    return {
      total: participants.length,
      updated,
      skipped,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
```

**Phase 3: Verify and Enforce (Future)**
```typescript
// After migration is complete, you could make field required:
// participants: defineTable({
//   site_id: v.id("sites"),  // ← Make required in future version
// })

// For now, enforce at application level:
export const createParticipant = mutation({
  args: {
    // ...
    siteId: v.id("sites"),  // Required in API
  },
  handler: async (ctx, args) => {
    // Validation ensures new records always have site_id
    if (!args.siteId) {
      throw new ConvexError({
        message: 'Site is required',
        code: 'SITE_REQUIRED'
      });
    }
    // ...
  }
});
```

## Key Benefits

1. **Zero Downtime**: Existing code continues to work during migration
2. **Gradual Migration**: Can migrate data in batches or with delays
3. **Validation**: Migration script reports errors without breaking
4. **Idempotent**: Can run migration multiple times safely
5. **Rollback Friendly**: Can revert schema changes if needed

## Migration Execution

```bash
# Development
bunx convex run participants/migration:linkToPrimarySites

# Review results (should see: updated: X, skipped: 0, failed: 0)

# Production (after dev testing)
CONVEX_DEPLOYMENT=prod:graceful-shrimp-355 \
  bunx convex run participants/migration:linkToPrimarySites
```

## Best Practices

### ✅ Do This

- Make foreign key optional initially
- Write idempotent migration script (check if already migrated)
- Return detailed summary (updated, skipped, errors)
- Log all operations for audit trail
- Test in development first
- Verify data integrity after migration
- Keep migration script in codebase for reference

### ❌ Don't Do This

- Make field required before data is migrated
- Run migration without testing in dev first
- Silently fail on errors (log everything)
- Delete migration script after running
- Skip error handling in migration
- Forget to update indexes when adding foreign keys

## Alternative Approaches

### Approach 1: Default Value (Not Recommended)
```typescript
// ❌ Bad: Using default value to avoid optional
site_id: v.id("sites").default("some-id")

// Why bad:
// - What if that site doesn't exist?
// - Silently creates invalid relationships
// - Harder to identify records needing migration
```

### Approach 2: Required with Immediate Migration (Risky)
```typescript
// ❌ Risky: Making field required immediately
site_id: v.id("sites")  // Required!

// Then rushing to migrate before deploy
// Why risky:
// - No time to test migration thoroughly
// - If migration fails, entire deploy blocked
// - Rollback is harder
```

### Approach 3: Optional Forever (Not Ideal)
```typescript
// ⚠️ Okay but not ideal: Keep optional forever
site_id: v.optional(v.id("sites"))

// Pros: Most flexible
// Cons: Application code must handle null everywhere
// Better: Optional during migration, then enforce at app level
```

## When to Use This Pattern

Use optional foreign key migration when:
- ✅ Adding relationship to table with existing data
- ✅ Need zero-downtime deployment
- ✅ Want to test migration safely
- ✅ Relationship should eventually be required
- ✅ Can derive foreign key from existing data

Don't use when:
- ❌ Table is empty (just make field required)
- ❌ Relationship is truly optional (keep optional)
- ❌ Cannot derive foreign key value (need manual data entry)

## Real-World Example: Story 7.4

**Context:**
- Participants table already had 11 records in development
- Need to add site_id to organize participants by location
- Story 7.3 created Primary site for each company
- Can derive site_id by linking to company's Primary site

**Implementation:**
1. Made site_id optional in schema
2. Created migration to link all participants to Primary sites
3. Ran migration in dev (updated: 11, skipped: 0, failed: 0)
4. Ran migration in prod (updated: 0, skipped: 0, failed: 0)
5. All new participants require site_id at application level

**Result:**
- Zero downtime
- No data loss
- Clean migration
- All participants now have site associations

## Troubleshooting

### Migration Reports Errors

```bash
# If migration shows errors:
{
  "total": 15,
  "updated": 12,
  "skipped": 0,
  "failed": 3,
  "errors": [
    "Participant xyz: No Primary site",
    ...
  ]
}

# Actions:
# 1. Fix the prerequisite data (create missing sites)
# 2. Run migration again (idempotent - will only update failed ones)
```

### Some Records Already Have Foreign Key

```javascript
// Migration handles this automatically:
if (participant.site_id) {
  skipped++;  // Doesn't double-migrate
  continue;
}
```

### Need to Rollback Migration

```typescript
// Create reverse migration if needed:
export const unlinkSites = internalMutation({
  args: {},
  handler: async (ctx) => {
    const participants = await ctx.db.query('participants').collect();

    for (const participant of participants) {
      await ctx.db.patch(participant._id, {
        site_id: undefined,  // Clear foreign key
      });
    }

    return { updated: participants.length };
  },
});
```

## Related Documentation

- [Migration Script Pattern](../patterns/convex-migration-patterns.md)
- [Schema Evolution Best Practices](../patterns/schema-evolution.md)
- Story 7.4: Initial Participant Setup (real implementation)
- Story 7.3: Site Management (prerequisite)

## Template Code

Use this template for your own optional foreign key migrations:

```typescript
// 1. Schema Update
yourTable: defineTable({
  // Existing fields...
  your_foreign_key: v.optional(v.id("relatedTable")),
})
  .index("by_foreign_key", ["your_foreign_key"])

// 2. Migration Script
export const linkYourForeignKeys = internalMutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query('yourTable').collect();

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const record of records) {
      if (record.your_foreign_key) {
        skipped++;
        continue;
      }

      try {
        // Find related entity based on existing data
        const related = await ctx.db
          .query('relatedTable')
          .withIndex('someIndex', (q) => q.eq('fieldName', record.someField))
          .first();

        if (!related) {
          errors.push(`Record ${record._id}: Related entity not found`);
          continue;
        }

        await ctx.db.patch(record._id, {
          your_foreign_key: related._id,
          updated_at: Date.now(),
        });

        updated++;
      } catch (error: any) {
        errors.push(`Record ${record._id}: ${error.message}`);
      }
    }

    return { total: records.length, updated, skipped, failed: errors.length, errors };
  },
});
```
