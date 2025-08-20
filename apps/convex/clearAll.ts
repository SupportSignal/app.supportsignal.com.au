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

// Clear questions for a specific incident to bypass caching
export const clearIncidentQuestions = mutation({
  args: {
    incident_id: v.id("incidents")
  },
  handler: async (ctx, args) => {
    console.log(`🧹 Clearing questions for incident: ${args.incident_id}`);
    
    // Delete clarification questions for this incident
    const questions = await ctx.db
      .query("clarification_questions")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .collect();
    
    console.log(`Found ${questions.length} questions to delete`);
    
    let deletedQuestions = 0;
    for (const question of questions) {
      await ctx.db.delete(question._id);
      deletedQuestions++;
    }
    
    // Also delete clarification answers for this incident
    const answers = await ctx.db
      .query("clarification_answers")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .collect();
      
    console.log(`Found ${answers.length} answers to delete`);
    
    let deletedAnswers = 0;
    for (const answer of answers) {
      await ctx.db.delete(answer._id);
      deletedAnswers++;
    }
    
    console.log(`✅ Cleared questions and answers for incident ${args.incident_id}`);
    return {
      incident_id: args.incident_id,
      deleted_questions: deletedQuestions,
      deleted_answers: deletedAnswers,
      total_deleted: deletedQuestions + deletedAnswers
    };
  },
});

// Clear ALL narrative hashes to force fresh question generation  
export const clearNarrativeHashes = mutation({
  args: {},
  handler: async (ctx) => {
    console.log(`🧹 Clearing ALL narrative hashes to bypass content-based caching`);
    
    // Delete all incident narratives (which contain narrative_hash)
    const narratives = await ctx.db.query("incident_narratives").collect();
    
    console.log(`Found ${narratives.length} narrative records to clear hashes from`);
    
    let clearedHashes = 0;
    for (const narrative of narratives) {
      // Update to remove narrative_hash, forcing fresh generation
      await ctx.db.patch(narrative._id, {
        narrative_hash: undefined
      });
      clearedHashes++;
    }
    
    console.log(`✅ Cleared ${clearedHashes} narrative hashes`);
    return {
      cleared_hashes: clearedHashes,
      message: "All narrative hashes cleared - fresh question generation will occur"
    };
  },
});