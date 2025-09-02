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
      .withIndex('by_email', q => q.eq('email', args.email))
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