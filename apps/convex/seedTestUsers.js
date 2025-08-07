/**
 * Simple Test User Creation
 * Creates individual test users with pre-hashed password for "password"
 * 
 * Usage: bunx convex run seedTestUsers:createUser '{"role": "system_admin"}'
 */

import { mutation } from './_generated/server.js';
import { v } from 'convex/values';

// Pre-hashed password for "password" (bcrypt rounds=12)
const HASHED_PASSWORD = '$2b$12$LHfLmOGHqPHFE8V1RdrydepoVCGbAM59lIJiiLzXz.BYgAGDu3k4K';

export const createUser = mutation({
  args: {
    role: v.union(
      v.literal('system_admin'),
      v.literal('company_admin'), 
      v.literal('team_lead'),
      v.literal('frontline_worker')
    )
  },
  handler: async (ctx, { role }) => {
    const email = `${role}@ndis.com.au`;
    const name = role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Find or create the NDIS test company
    let company = await ctx.db
      .query('companies')
      .filter((q) => q.eq(q.field('slug'), 'ndis-test'))
      .first();

    if (!company) {
      const companyId = await ctx.db.insert('companies', {
        name: 'NDIS Test Company',
        slug: 'ndis-test',
        contact_email: 'admin@ndis.com.au',
        status: 'active',
        created_at: Date.now(),
      });
      company = await ctx.db.get(companyId);
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('email'), email))
      .first();

    if (existingUser) {
      return {
        success: false,
        message: `User ${email} already exists`,
        userId: existingUser._id,
        email: existingUser.email,
        role: existingUser.role
      };
    }

    // Create user with pre-hashed password
    const userId = await ctx.db.insert('users', {
      name,
      email: email.toLowerCase(),
      password: HASHED_PASSWORD,
      role,
      company_id: company._id,
      has_llm_access: role === 'system_admin' || role === 'company_admin' || role === 'team_lead',
    });

    return {
      success: true,
      message: `Created user: ${email}`,
      userId,
      email,
      name,
      role,
      password: 'password' // For reference only
    };
  }
});

export const createAllTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const roles = ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'];
    const results = [];

    for (const role of roles) {
      try {
        const result = await createUser(ctx, { role });
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          message: `Failed to create ${role}@ndis.com.au: ${error.message}`,
          role
        });
      }
    }

    return {
      success: true,
      message: 'Batch user creation complete',
      results,
      summary: {
        total: results.length,
        created: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }
});