import { mutation } from '../_generated/server';
import { getConfig } from '../lib/config';

/**
 * Migration: Populate ai_model field for all prompts
 *
 * Purpose: Make ai_model field required by first ensuring all existing prompts have a value.
 * This migration must be run BEFORE making ai_model required in the schema.
 *
 * Strategy:
 * 1. Get default model from environment configuration
 * 2. Find all prompts without ai_model value
 * 3. Update each prompt with default model
 * 4. Validate 100% of prompts now have ai_model
 *
 * Safety: Idempotent - can be run multiple times safely
 */
export default mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Starting prompt model migration...");

    // Get default model from configuration
    const config = getConfig();
    const defaultModel = config.llm.defaultModel;

    console.log(`📋 Default model from config: ${defaultModel}`);

    // Get all prompts
    const prompts = await ctx.db.query("ai_prompts").collect();
    console.log(`📊 Total prompts found: ${prompts.length}`);

    // Count prompts missing ai_model
    const promptsWithoutModel = prompts.filter(p => !p.ai_model);
    console.log(`⚠️  Prompts without ai_model: ${promptsWithoutModel.length}`);

    if (promptsWithoutModel.length === 0) {
      console.log("✅ All prompts already have ai_model - no migration needed");
      return {
        totalPrompts: prompts.length,
        updatedCount: 0,
        defaultModel,
        message: "All prompts already have ai_model",
      };
    }

    // Update prompts without ai_model
    let updatedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const prompt of promptsWithoutModel) {
      try {
        await ctx.db.patch(prompt._id, {
          ai_model: defaultModel,
        });
        updatedCount++;
        console.log(`✅ Updated prompt: ${prompt.prompt_name} (${prompt._id}) with model ${defaultModel}`);
      } catch (error) {
        failedCount++;
        const errorMsg = `Failed to update prompt ${prompt.prompt_name} (${prompt._id}): ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Verify all prompts now have ai_model
    const remainingPromptsWithoutModel = (await ctx.db.query("ai_prompts").collect())
      .filter(p => !p.ai_model);

    const success = remainingPromptsWithoutModel.length === 0;

    console.log("\n📊 Migration Summary:");
    console.log(`   Total prompts: ${prompts.length}`);
    console.log(`   Prompts updated: ${updatedCount}`);
    console.log(`   Failed updates: ${failedCount}`);
    console.log(`   Remaining without model: ${remainingPromptsWithoutModel.length}`);
    console.log(`   Default model used: ${defaultModel}`);
    console.log(`   Status: ${success ? "✅ SUCCESS" : "❌ INCOMPLETE"}`);

    if (errors.length > 0) {
      console.log("\n❌ Errors:");
      errors.forEach(err => console.log(`   ${err}`));
    }

    if (!success) {
      throw new Error(`Migration incomplete: ${remainingPromptsWithoutModel.length} prompts still missing ai_model`);
    }

    console.log("\n✅ Migration complete: All prompts now have ai_model");

    return {
      totalPrompts: prompts.length,
      updatedCount,
      failedCount,
      defaultModel,
      success,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
