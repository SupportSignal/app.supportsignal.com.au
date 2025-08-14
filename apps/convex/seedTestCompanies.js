/**
 * Test Companies & Users Seed Script
 * Creates both Support Signal and NDIS companies + all their users
 * 
 * Usage: bunx convex run seedTestCompanies:seedAll
 */

import { mutation } from './_generated/server.js';
import { api } from './_generated/api.js';

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    const results = {
      companies: null,
      users: null,
      summary: null
    };

    try {
      console.log('🌱 Starting complete test data seed...');

      // 1. Create both companies first
      console.log('🏢 Creating test companies (Support Signal + NDIS)...');
      results.companies = await ctx.runMutation(api.companies.seedTestCompanies, {});
      
      if (!results.companies.success) {
        return {
          success: false,
          message: 'Failed to create companies',
          results
        };
      }

      // 2. Create all users for both companies
      console.log('👥 Creating all test users...');
      results.users = await ctx.runMutation(api.seedTestUsers.createAllTestUsers, {});

      // 3. Generate comprehensive summary
      const duration = Date.now() - startTime;
      results.summary = {
        duration_ms: duration,
        companies: {
          total: results.companies.summary.total,
          created: results.companies.summary.created,
          existed: results.companies.summary.existed
        },
        users: {
          total: results.users.summary.total,
          created: results.users.summary.created,
          existed: results.users.summary.existed,
          failed: results.users.summary.failed,
          support_signal_users: results.users.summary.by_company['support-signal'],
          ndis_users: results.users.summary.by_company['ndis-test']
        }
      };

      console.log('✅ Seed complete!', {
        companies_created: results.summary.companies.created,
        users_created: results.summary.users.created,
        duration_ms: duration
      });

      return {
        success: true,
        message: 'Complete test data seed successful',
        results,
        data_created: {
          companies: ['Support Signal', 'NDIS Test Company'],
          support_signal_users: ['David Cruwys (system_admin)', 'Rony Kirollos (company_admin)', 'Angela Harvey (company_admin)', 'Sarah Thompson (team_lead)', 'Michael Chen (frontline_worker)', 'Emma Rodriguez (frontline_worker)'],
          ndis_users: ['System Admin', 'Company Admin', 'Team Lead', 'Frontline Worker'],
          total_users: 10,
          all_passwords: 'password'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Seed failed: ${error.message}`,
        error: error.message,
        results,
        duration_ms: Date.now() - startTime
      };
    }
  }
});