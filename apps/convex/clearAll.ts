import { mutation } from "./_generated/server";
import { v } from "convex/values";

// DANGEROUS: Clear all data - requires confirmation
// This function was responsible for accidentally deleting production data
export const clearAllData = mutation({
  args: {
    confirmationCode: v.string()
  },
  handler: async (ctx, args) => {
    // Require explicit confirmation to prevent accidental deletion
    const REQUIRED_CODE = "DELETE-ALL-DATA-PERMANENTLY";
    
    if (args.confirmationCode !== REQUIRED_CODE) {
      throw new Error(`❌ DELETION BLOCKED: Invalid confirmation code. This function deletes ALL DATA permanently. If you really want to proceed, use confirmationCode: "${REQUIRED_CODE}"`);
    }

    console.log("🧹 ⚠️  DANGER: Clearing ALL data with confirmation...");
    
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
    
    console.log(`🎉 All data deleted! ${totalDeleted} total records removed`);
    return { 
      deleted: totalDeleted,
      warning: "ALL DATA HAS BEEN PERMANENTLY DELETED",
      recovery: "Run 'bunx convex run seedSupportSignal:seedAll' to restore test data"
    };
  },
});

// Safe function to clear only test-related data
export const clearTestDataOnly = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🧹 Clearing only test data (incidents, questions, answers)...");
    
    // Only clear test/temporary data, preserve users and companies
    const testTables = [
      "incidents",
      "incident_narratives", 
      "clarification_questions",
      "clarification_answers",
      "incident_analysis",
      "incident_classifications",
      "debug_logs"
    ];
    
    let totalDeleted = 0;
    
    for (const tableName of testTables) {
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
    
    console.log(`✅ Test data cleared! ${totalDeleted} records deleted. Users and companies preserved.`);
    return { 
      deleted: totalDeleted,
      preserved: "Users and companies kept intact",
      cleared: testTables
    };
  },
});