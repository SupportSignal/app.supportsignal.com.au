import { mutation, MutationCtx } from './_generated/server';
import { v } from 'convex/values';
import bcrypt from 'bcryptjs';

// Migration to set default password for existing users
export const migrateUsersWithDefaultPassword = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    // Get all users without passwords
    const users = await ctx.db.query('users').collect();
    const usersWithoutPasswords = users.filter(
      (user: { password?: string }) => !user.password
    );

    if (usersWithoutPasswords.length === 0) {
      return { message: 'No users need password migration', updated: 0 };
    }

    // Hash the default password (using sync version for Convex)
    const defaultPassword = 'testpass123';
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(defaultPassword, saltRounds);

    // Update each user without a password
    for (const user of usersWithoutPasswords) {
      await ctx.db.patch(user._id, {
        password: hashedPassword,
      });
    }

    return {
      message: `Migration complete: ${usersWithoutPasswords.length} users updated with default password`,
      updated: usersWithoutPasswords.length,
      defaultPassword: defaultPassword,
    };
  },
});

// Helper function to reset a specific user's password
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

// Migration to grant LLM access to david@ideasmen.com.au (Story 4.2)
export const grantLLMAccessToDavid = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const targetEmail = 'david@ideasmen.com.au';
    
    // Find the user
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', targetEmail))
      .first();

    if (!user) {
      return { 
        message: `User ${targetEmail} not found. Please create user account first.`,
        updated: false 
      };
    }

    // Check if already has LLM access
    if (user.hasLLMAccess === true) {
      return { 
        message: `User ${targetEmail} already has LLM access`,
        updated: false 
      };
    }

    // Grant LLM access
    await ctx.db.patch(user._id, {
      hasLLMAccess: true,
    });

    console.log(`✅ Granted LLM access to ${targetEmail}`);

    return {
      message: `Successfully granted LLM access to ${targetEmail}`,
      updated: true,
      userId: user._id,
    };
  },
});

// Generic migration to grant LLM access to any user by email
export const grantLLMAccessByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx: MutationCtx, args) => {
    const targetEmail = args.email.toLowerCase().trim();
    
    // Find the user
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', targetEmail))
      .first();

    if (!user) {
      return { 
        message: `User ${targetEmail} not found. Please create user account first.`,
        updated: false 
      };
    }

    // Check if already has LLM access
    if (user.hasLLMAccess === true) {
      return { 
        message: `User ${targetEmail} already has LLM access`,
        updated: false 
      };
    }

    // Grant LLM access
    await ctx.db.patch(user._id, {
      hasLLMAccess: true,
    });

    console.log(`✅ Granted LLM access to ${targetEmail}`);

    return {
      message: `✅ Successfully granted LLM access to ${targetEmail}`,
      updated: true,
      userId: user._id,
    };
  },
});

// Migration to set default LLM access for all existing users (optional)
export const setDefaultLLMAccess = mutation({
  args: {
    defaultAccess: v.boolean(),
  },
  handler: async (ctx: MutationCtx, args: { defaultAccess: boolean }) => {
    // Get all users without hasLLMAccess set
    const users = await ctx.db.query('users').collect();
    const usersToUpdate = users.filter(
      (user: { hasLLMAccess?: boolean }) => user.hasLLMAccess === undefined
    );

    if (usersToUpdate.length === 0) {
      return { 
        message: 'No users need LLM access migration', 
        updated: 0 
      };
    }

    // Update each user
    for (const user of usersToUpdate) {
      await ctx.db.patch(user._id, {
        hasLLMAccess: args.defaultAccess,
      });
    }

    console.log(`✅ Set LLM access to ${args.defaultAccess} for ${usersToUpdate.length} users`);

    return {
      message: `Migration complete: ${usersToUpdate.length} users updated with hasLLMAccess=${args.defaultAccess}`,
      updated: usersToUpdate.length,
    };
  },
});
