import { mutation, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import bcrypt from 'bcryptjs';

// =============================================================================
// ACTIVE UTILITY FUNCTIONS
// These functions provide ongoing administrative value and should be retained
// =============================================================================

// Reset a specific user's password
export const resetUserPassword = mutation({
  args: {
    email: v.string(),
    newPassword: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: { email: string; newPassword: string }
  ) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password (using sync version for Convex)
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(args.newPassword, saltRounds);

    await ctx.db.patch(user._id, {
      password: hashedPassword,
    });

    return { message: `Password reset for ${args.email}` };
  },
});

// NOTE: These migration functions are no longer needed since has_llm_access concept has been removed
// Commented out to preserve migration history

// // Grant LLM access to any user by email
// export const grantLLMAccessByEmail = mutation({
//   args: {
//     email: v.string(),
//   },
//   handler: async (ctx: MutationCtx, args) => {
//     return {
//       message: 'LLM access migration no longer needed - access granted to all users',
//       updated: false
//     };
//   },
// });

// // Set default LLM access for all users without it set
// export const setDefaultLLMAccess = mutation({
//   args: {
//     defaultAccess: v.boolean(),
//   },
//   handler: async (ctx: MutationCtx, args: { defaultAccess: boolean }) => {
//     return {
//       message: 'LLM access migration no longer needed - access granted to all users',
//       updated: 0,
//     };
//   },
// });

// Remove has_llm_access field from all users (cleanup after schema change)
export const removeHasLLMAccessField = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const users = await ctx.db.query('users').collect();
    let updated = 0;

    for (const user of users) {
      if ('has_llm_access' in user) {
        // Create a new object without has_llm_access field
        const { has_llm_access, ...cleanUser } = user as any;
        
        // Replace the entire document with clean data
        await ctx.db.replace(user._id, cleanUser);
        updated++;
      }
    }

    console.log(`✅ Removed has_llm_access field from ${updated} users`);
    return {
      message: `Removed has_llm_access field from ${updated} users`,
      updated,
    };
  },
});

// Set all user passwords to "password" for development
export const setAllPasswordsToPassword = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    console.log("🔄 Setting all user passwords to 'password'...");
    
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    // Hash the standard password (using sync version for Convex)
    const newPassword = 'password';
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(newPassword, saltRounds);
    
    let updatedCount = 0;
    const errors: string[] = [];
    
    for (const user of users) {
      try {
        await ctx.db.patch(user._id, {
          password: hashedPassword,
        });
        
        console.log(`✅ Updated password for ${user.email} (${user.role})`);
        updatedCount++;
      } catch (error) {
        const errorMsg = `Failed to update password for ${user.email}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log(`✅ Password update complete. Updated ${updatedCount} users.`);
    
    return {
      success: errors.length === 0,
      updatedCount,
      totalUsers: users.length,
      errors,
      message: `Updated passwords for ${updatedCount} users to 'password'`,
      newPassword: newPassword
    };
  },
});

// Debug company date issues including _creationTime
export const debugCompanyDates = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    console.log("🔍 Debugging company date issues...");
    
    const companies = await ctx.db.query("companies").collect();
    const currentTimestamp = Date.now();
    const currentDate = new Date(currentTimestamp);
    
    const results = companies.map((company) => {
      const createdAt = company.created_at;
      const creationTime = company._creationTime;
      
      const createdAtDate = new Date(createdAt);
      const creationTimeDate = new Date(creationTime);
      
      const isValidCreatedAt = !isNaN(createdAtDate.getTime());
      const isValidCreationTime = !isNaN(creationTimeDate.getTime());
      
      const createdAtFormatted = isValidCreatedAt ? createdAtDate.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Invalid Date';
      
      const creationTimeFormatted = isValidCreationTime ? creationTimeDate.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Invalid Date';
      
      return {
        id: company._id,
        name: company.name,
        created_at: createdAt,
        created_at_type: typeof createdAt,
        created_at_formatted: createdAtFormatted,
        is_valid_created_at: isValidCreatedAt,
        _creation_time: creationTime,
        _creation_time_type: typeof creationTime,
        _creation_time_formatted: creationTimeFormatted,
        is_valid_creation_time: isValidCreationTime,
        created_by: company.created_by || 'undefined',
        days_ago_created_at: Math.round((currentTimestamp - createdAt) / (1000 * 60 * 60 * 24)),
        days_ago_creation_time: isValidCreationTime ? Math.round((currentTimestamp - creationTime) / (1000 * 60 * 60 * 24)) : 'N/A'
      };
    });
    
    console.log("📊 Company Date Analysis:", results);
    console.log("🕐 Current timestamp:", currentTimestamp);
    console.log("📅 Current date:", currentDate.toISOString());
    
    return {
      companies: results,
      totalCompanies: companies.length,
      invalidCreatedAt: results.filter(r => !r.is_valid_created_at).length,
      invalidCreationTime: results.filter(r => !r.is_valid_creation_time).length,
      currentTimestamp,
      currentDateISO: currentDate.toISOString(),
    };
  },
});

/**
 * Backfill site_id for all existing incidents
 * Story 7.6 - Phase 2
 *
 * Logic:
 * 1. If incident has participant with site_id, use participant's site
 * 2. Otherwise, use company's Primary site as fallback
 * 3. Update incident with site_id
 */
export const backfillIncidentSites = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    console.log('🔧 MIGRATION START: Backfill incident site_id');

    // Get all incidents
    const allIncidents = await ctx.db.query('incidents').collect();
    console.log(`📊 Found ${allIncidents.length} total incidents`);

    const updated: any[] = [];
    const errors: any[] = [];
    let skipped = 0;

    for (const incident of allIncidents) {
      try {
        // Skip if already has site_id
        if ('site_id' in incident && incident.site_id) {
          skipped++;
          continue;
        }

        let siteId: any = null;

        // Try to get site from participant first
        if (incident.participant_id) {
          const participant = await ctx.db.get(incident.participant_id);
          if (participant?.site_id) {
            siteId = participant.site_id;
            console.log(`✅ Using participant's site for incident ${incident._id}`);
          }
        }

        // Fallback to company's Primary site
        if (!siteId) {
          const primarySite = await ctx.db
            .query('sites')
            .withIndex('by_company', q => q.eq('company_id', incident.company_id))
            .filter(q => q.eq(q.field('name'), 'Primary'))
            .first();

          if (!primarySite) {
            errors.push({
              incidentId: incident._id,
              error: 'No Primary site found for company',
              companyId: incident.company_id,
            });
            continue;
          }

          siteId = primarySite._id;
          console.log(`✅ Using Primary site for incident ${incident._id}`);
        }

        // Update incident with site_id
        await ctx.db.patch(incident._id, {
          site_id: siteId,
          updated_at: Date.now(),
        });

        updated.push({
          incidentId: incident._id,
          siteId,
          participantBased: !!incident.participant_id,
        });
      } catch (error: any) {
        errors.push({
          incidentId: incident._id,
          error: error.message,
        });
        console.error(`❌ Error backfilling incident ${incident._id}:`, error);
      }
    }

    const summary = {
      total: allIncidents.length,
      updated: updated.length,
      skipped,
      errors: errors.length,
      updatedDetails: updated.slice(0, 10), // Show first 10
      errorDetails: errors,
    };

    console.log('🔧 MIGRATION COMPLETE', summary);

    return summary;
  },
});

/**
 * Fix participants missing site_id
 * Story 7.6 - Phase 0 Prerequisite
 *
 * Assigns participants without site_id to their company's Primary site.
 * This is a prerequisite for making site_id required in the incidents schema.
 */
export const fixParticipantSites = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    console.log('🔧 MIGRATION START: Fix participants missing site_id');

    // Get all participants without site_id
    const allParticipants = await ctx.db.query('participants').collect();
    const participantsWithoutSite = allParticipants.filter(p => !p.site_id);

    console.log(`📊 Found ${participantsWithoutSite.length} participants without site_id`);

    const fixed: any[] = [];
    const errors: any[] = [];

    for (const participant of participantsWithoutSite) {
      try {
        // Find Primary site for participant's company
        const primarySite = await ctx.db
          .query('sites')
          .withIndex('by_company', q => q.eq('company_id', participant.company_id))
          .filter(q => q.eq(q.field('name'), 'Primary'))
          .first();

        if (!primarySite) {
          errors.push({
            participantId: participant._id,
            participantName: `${participant.first_name} ${participant.last_name}`,
            error: 'No Primary site found for company',
            companyId: participant.company_id,
          });
          continue;
        }

        // Update participant with Primary site
        await ctx.db.patch(participant._id, {
          site_id: primarySite._id,
          updated_at: Date.now(),
        });

        fixed.push({
          participantId: participant._id,
          participantName: `${participant.first_name} ${participant.last_name}`,
          siteId: primarySite._id,
          siteName: primarySite.name,
          companyId: participant.company_id,
        });

        console.log(`✅ Fixed: ${participant.first_name} ${participant.last_name} -> ${primarySite.name}`);
      } catch (error: any) {
        errors.push({
          participantId: participant._id,
          participantName: `${participant.first_name} ${participant.last_name}`,
          error: error.message,
        });
        console.error(`❌ Error fixing participant ${participant._id}:`, error);
      }
    }

    const summary = {
      totalWithoutSite: participantsWithoutSite.length,
      fixed: fixed.length,
      errors: errors.length,
      fixedDetails: fixed,
      errorDetails: errors,
    };

    console.log('🔧 MIGRATION COMPLETE', summary);

    return summary;
  },
});

/**
 * Backfill baseline_max_tokens for all existing ai_prompts
 * Story 6.9 - Phase 3: Adaptive Token Management
 *
 * Logic:
 * 1. For each ai_prompts record that has max_tokens but no baseline_max_tokens
 * 2. Set baseline_max_tokens = current max_tokens value
 * 3. This preserves the original token limit before any adaptive adjustments
 */
export const backfillAIPromptBaselineTokens = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    console.log('🔧 MIGRATION START: Backfill ai_prompts baseline_max_tokens');

    // Get all ai_prompts records
    const allPrompts = await ctx.db.query('ai_prompts').collect();
    console.log(`📊 Found ${allPrompts.length} total ai_prompts`);

    const updated: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];

    for (const prompt of allPrompts) {
      try {
        // Skip if already has baseline_max_tokens
        if ('baseline_max_tokens' in prompt && prompt.baseline_max_tokens !== undefined) {
          skipped.push({
            promptId: prompt._id,
            promptName: prompt.prompt_name,
            reason: 'Already has baseline_max_tokens',
          });
          continue;
        }

        // Skip if no max_tokens to copy from
        if (!prompt.max_tokens) {
          skipped.push({
            promptId: prompt._id,
            promptName: prompt.prompt_name,
            reason: 'No max_tokens to copy',
          });
          continue;
        }

        // Backfill baseline_max_tokens with current max_tokens
        await ctx.db.patch(prompt._id, {
          baseline_max_tokens: prompt.max_tokens,
        });

        updated.push({
          promptId: prompt._id,
          promptName: prompt.prompt_name,
          baselineMaxTokens: prompt.max_tokens,
        });

        console.log(`✅ Backfilled: ${prompt.prompt_name} -> baseline_max_tokens: ${prompt.max_tokens}`);
      } catch (error: any) {
        errors.push({
          promptId: prompt._id,
          promptName: prompt.prompt_name,
          error: error.message,
        });
        console.error(`❌ Error backfilling prompt ${prompt._id}:`, error);
      }
    }

    const summary = {
      total: allPrompts.length,
      updated: updated.length,
      skipped: skipped.length,
      errors: errors.length,
      updatedDetails: updated,
      skippedDetails: skipped,
      errorDetails: errors,
    };

    console.log('🔧 MIGRATION COMPLETE', summary);

    return summary;
  },
});

// =============================================================================
// ARCHIVED MIGRATIONS (COMPLETED)
// These were one-time migrations that have been completed successfully.
// They are kept here for historical reference but should not be run again.
// =============================================================================
//
// ✅ migrateUsersWithDefaultPassword - Set default passwords (completed)
// ✅ grantLLMAccessToDavid - Granted LLM access to david@ideasmen.com.au (completed)
// ✅ migrateUserRoles - Migrated "user" role to "frontline_worker" (completed)
// ✅ normalizeClassificationEnums - Normalized classification enums to snake_case (completed)
// ✅ cleanupCompanySlugField - Removed slug field from company records (completed)
// ✅ forceCleanupCompanySlugField - Aggressive cleanup of company records (completed)
// ✅ fixUserCompanyAssociations - Fixed user-company associations after ID regeneration (completed)
//
// Total migrations completed: 7