/**
 * Cleanup Script: Remove orphaned participants (Story 7.4)
 *
 * Purpose: Delete participants linked to non-existent companies (test data cleanup)
 */

import { internalMutation } from '../_generated/server';

export const cleanupOrphanedParticipants = internalMutation({
  args: {},
  handler: async (ctx) => {
    const participants = await ctx.db.query('participants').collect();

    const toDelete: string[] = [];

    for (const participant of participants) {
      const company = await ctx.db.get(participant.company_id);
      if (!company) {
        toDelete.push(participant._id);
        await ctx.db.delete(participant._id);
      }
    }

    return {
      deleted: toDelete.length,
      deletedIds: toDelete
    };
  }
});
