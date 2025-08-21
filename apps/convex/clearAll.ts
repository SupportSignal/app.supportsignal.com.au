import { mutation } from "./_generated/server";
import { v } from "convex/values";


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

// Clear ONLY ai_prompts table (hard delete)
export const clearAiPromptsOnly = mutation({
  args: {},
  handler: async (ctx) => {
    console.log(`🧹 Clearing ONLY ai_prompts table (hard delete)`);
    
    // Get all ai_prompts records
    const prompts = await ctx.db.query("ai_prompts").collect();
    
    console.log(`Found ${prompts.length} ai_prompts records to delete`);
    
    let deletedCount = 0;
    for (const prompt of prompts) {
      await ctx.db.delete(prompt._id);
      deletedCount++;
    }
    
    console.log(`✅ Hard deleted ${deletedCount} ai_prompts records`);
    return {
      deleted_count: deletedCount,
      table_cleared: "ai_prompts",
      message: `Successfully hard deleted ${deletedCount} records from ai_prompts table only`
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