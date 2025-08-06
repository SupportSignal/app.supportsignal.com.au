import { mutation } from "./_generated/server";

// Temporary function to clear all data for schema migration
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🧹 Clearing all data for schema migration...");
    
    // Get all table names and clear them
    const tables = [
      "ai_prompts",
      "companies", 
      "users",
      "incidents",
      "incident_narratives", 
      "clarification_questions",
      "clarification_answers",
      "incident_analysis",
      "incident_classifications",
      "sessions",
      "chat_sessions",
      "chat_messages",
      "debug_logs",
      "source_documents",
      "document_chunks"
    ];
    
    let totalDeleted = 0;
    
    for (const tableName of tables) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        console.log(`Deleting ${records.length} records from ${tableName}`);
        
        for (const record of records) {
          await ctx.db.delete(record._id);
        }
        
        totalDeleted += records.length;
        console.log(`✅ Cleared ${tableName}: ${records.length} records deleted`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${tableName}:`, error);
      }
    }
    
    console.log(`🎉 Migration complete! Deleted ${totalDeleted} total records`);
    return { deleted: totalDeleted };
  },
});