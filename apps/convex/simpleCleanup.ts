// Simple cleanup - just delete all old logging data
// Convex doesn't have DROP TABLE, so we delete all records manually

import { mutation } from './_generated/server';

export const deleteAllLoggingData = mutation({
  args: {},
  handler: async (ctx) => {
    let totalDeleted = 0;

    try {
      // Delete all records from each old logging table
      const tables = ['log_queue', 'recent_log_entries', 'rate_limit_state', 'message_fingerprints'];
      
      for (const tableName of tables) {
        try {
          const records = await ctx.db.query(tableName as any).collect();
          for (const record of records) {
            await ctx.db.delete(record._id);
            totalDeleted++;
          }
          console.log(`Deleted ${records.length} records from ${tableName}`);
        } catch (error) {
          // Table might not exist or already be empty
          console.log(`Skipped ${tableName}: ${error}`);
        }
      }

      return {
        success: true,
        totalDeleted,
        message: `Deleted ${totalDeleted} records. Tables are now empty and will be ignored by Convex.`
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalDeleted
      };
    }
  }
});