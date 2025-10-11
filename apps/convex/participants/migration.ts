/**
 * Migration Script: Link Participants to Primary Sites (Story 7.4)
 *
 * Purpose: Add site_id to existing participants by linking them to their company's Primary site.
 * This migration is part of Epic 7 Phase 3 - adding site organization to participants.
 *
 * Prerequisites:
 * - Story 7.3 must be complete (all companies have at least one site)
 * - Schema must have site_id as optional field
 *
 * Usage:
 *   bunx convex run participants/migration:linkToPrimarySites
 */

import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

export const linkToPrimarySites = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Query all participants
    const participants = await ctx.db.query('participants').collect();

    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 2. Process each participant
    for (const participant of participants) {
      // Skip if already has site_id
      if (participant.site_id) {
        skipped++;
        continue;
      }

      try {
        // 3. Find participant's company
        const company = await ctx.db.get(participant.company_id);
        if (!company) {
          errors.push(`Participant ${participant._id}: Company ${participant.company_id} not found`);
          continue;
        }

        // 4. Find company's Primary site
        const primarySite = await ctx.db
          .query('sites')
          .withIndex('by_name', (q) => q.eq('company_id', participant.company_id).eq('name', 'Primary'))
          .first();

        if (!primarySite) {
          errors.push(`Participant ${participant._id}: No Primary site found for company ${company.name}`);
          continue;
        }

        // 5. Update participant with site_id
        await ctx.db.patch(participant._id, {
          site_id: primarySite._id,
          updated_at: Date.now(),
          // Keep same updated_by since this is a system migration
        });

        updated++;
      } catch (error: any) {
        errors.push(`Participant ${participant._id}: ${error.message}`);
      }
    }

    // 6. Return summary
    const summary = {
      total: participants.length,
      updated,
      skipped,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('Migration Summary:', JSON.stringify(summary, null, 2));

    return summary;
  },
});
