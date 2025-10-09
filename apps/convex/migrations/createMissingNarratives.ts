import { internalMutation } from "../_generated/server";

/**
 * Migration to create missing narrative records for existing incidents
 *
 * Context: Some incidents were created before the narrative initialization logic
 * was added to the frontend. When users navigate directly to Step 2 (narrative)
 * without going through Step 1, the narrative doesn't exist and auto-save crashes.
 *
 * This migration ensures all incidents have a corresponding narrative record.
 */
export const createMissingNarratives = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('🔧 MIGRATION START: Creating missing narrative records');

    // Get all incidents
    const allIncidents = await ctx.db.query("incidents").collect();
    console.log(`📊 Found ${allIncidents.length} total incidents`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const incident of allIncidents) {
      // Check if narrative already exists
      const existingNarrative = await ctx.db
        .query("incident_narratives")
        .withIndex("by_incident", (q) => q.eq("incident_id", incident._id))
        .first();

      if (existingNarrative) {
        skippedCount++;
        continue;
      }

      // Create narrative record with empty fields
      const narrativeId = await ctx.db.insert("incident_narratives", {
        incident_id: incident._id,
        before_event: "",
        during_event: "",
        end_event: "",
        post_event: "",
        created_at: Date.now(),
        updated_at: Date.now(),
        version: 1,
      });

      createdCount++;
      console.log(`✅ Created narrative for incident ${incident._id} (narrative: ${narrativeId})`);
    }

    console.log(`🔧 MIGRATION COMPLETE: Created ${createdCount} narratives, skipped ${skippedCount} existing`);

    return {
      success: true,
      totalIncidents: allIncidents.length,
      created: createdCount,
      skipped: skippedCount
    };
  },
});
