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

// All test users data for both companies
const TEST_USERS_DATA = {
  'support-signal': [
    { name: 'David Cruwys', email: 'david@ideasmen.com.au', role: 'system_admin' },
    { name: 'Rony Kirollos', email: 'rony@kiros.com.au', role: 'company_admin' },
    { name: 'Angela Harvey', email: 'angela@supportingpotential.com.au', role: 'company_admin' },
    { name: 'Sarah Thompson', email: 'sarah@supportsignal.com.au', role: 'team_lead' },
    { name: 'Michael Chen', email: 'michael@supportsignal.com.au', role: 'frontline_worker' },
    { name: 'Emma Rodriguez', email: 'emma@supportsignal.com.au', role: 'frontline_worker' }
  ],
  'ndis-test': [
    { name: 'System Admin', email: 'system_admin@ndis.com.au', role: 'system_admin' },
    { name: 'Company Admin', email: 'company_admin@ndis.com.au', role: 'company_admin' },
    { name: 'Team Lead', email: 'team_lead@ndis.com.au', role: 'team_lead' },
    { name: 'Frontline Worker', email: 'frontline_worker@ndis.com.au', role: 'frontline_worker' }
  ]
};

export const createUser = mutation({
  args: {
    role: v.union(
      v.literal('system_admin'),
      v.literal('demo_admin'),
      v.literal('company_admin'), 
      v.literal('team_lead'),
      v.literal('frontline_worker')
    )
  },
  handler: async (ctx, { role }) => {
    // Get user data from Support Signal users based on role
    let userData;
    if (role === 'system_admin') {
      userData = TEST_USERS_DATA['support-signal'].find(u => u.role === 'system_admin');
    } else if (role === 'demo_admin') {
      // For demo_admin, we'll create a generic user (can be manually updated later)
      userData = { name: 'Demo Admin', email: 'demo_admin@supportsignal.com.au', role: 'demo_admin' };
    } else if (role === 'company_admin') {
      userData = TEST_USERS_DATA['support-signal'].find(u => u.role === 'company_admin') || TEST_USERS_DATA['support-signal'][1]; // Default to Rony
    } else if (role === 'team_lead') {
      userData = TEST_USERS_DATA['support-signal'].find(u => u.role === 'team_lead');
    } else if (role === 'frontline_worker') {
      userData = TEST_USERS_DATA['support-signal'].find(u => u.role === 'frontline_worker');
    }

    const email = userData?.email || `${role}@supportsignal.com.au`;
    const name = userData?.name || role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Find or create Support Signal company
    let company = await ctx.db
      .query('companies')
      .filter((q) => q.eq(q.field('slug'), 'support-signal'))
      .first();

    if (!company) {
      const companyId = await ctx.db.insert('companies', {
        name: 'Support Signal',
        slug: 'support-signal',
        contact_email: 'admin@supportsignal.com.au',
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
      created_at: Date.now(),
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
    const results = [];
    const companySummary = [];

    // Process both companies
    for (const [companySlug, users] of Object.entries(TEST_USERS_DATA)) {
      // Find company
      const company = await ctx.db
        .query('companies')
        .filter((q) => q.eq(q.field('slug'), companySlug))
        .first();

      if (!company) {
        results.push({
          success: false,
          message: `Company ${companySlug} not found. Run companies:seedTestCompanies first.`,
          company_slug: companySlug
        });
        continue;
      }

      companySummary.push({
        name: company.name,
        slug: company.slug,
        users_to_create: users.length
      });

      // Create users for this company
      for (const userData of users) {
        try {
          // Check if user already exists
          const existingUser = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), userData.email.toLowerCase()))
            .first();

          if (existingUser) {
            results.push({
              success: false,
              action: 'exists',
              message: `User ${userData.email} already exists`,
              email: userData.email,
              name: userData.name,
              role: existingUser.role,
              company_slug: companySlug
            });
            continue;
          }

          // Create user
          const userId = await ctx.db.insert('users', {
            name: userData.name,
            email: userData.email.toLowerCase(),
            password: HASHED_PASSWORD,
            role: userData.role,
            company_id: company._id,
            created_at: Date.now(),
          });

          results.push({
            success: true,
            action: 'created',
            message: `Created user: ${userData.email}`,
            userId,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company_slug: companySlug,
            password: 'password'
          });

        } catch (error) {
          results.push({
            success: false,
            action: 'error',
            message: `Failed to create ${userData.email}: ${error.message}`,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company_slug: companySlug,
            error: error.message
          });
        }
      }
    }

    return {
      success: true,
      message: 'All test users creation complete',
      companies: companySummary,
      results,
      summary: {
        total: results.length,
        created: results.filter(r => r.action === 'created').length,
        existed: results.filter(r => r.action === 'exists').length,
        failed: results.filter(r => r.action === 'error').length,
        by_company: {
          'support-signal': results.filter(r => r.company_slug === 'support-signal').length,
          'ndis-test': results.filter(r => r.company_slug === 'ndis-test').length
        }
      }
    };
  }
});