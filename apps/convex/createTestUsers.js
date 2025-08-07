/**
 * Create Test Users Script
 * 
 * Creates test users for each role in the authentication system:
 * - system_admin@ndis.com.au
 * - company_admin@ndis.com.au  
 * - team_lead@ndis.com.au
 * - frontline_worker@ndis.com.au
 * - viewer@ndis.com.au
 * - support@ndis.com.au
 * 
 * All users created with password: "password"
 * 
 * Usage: bunx convex run create-test-users.js
 */

import { mutation } from './_generated/server.js';
import { v } from 'convex/values';

// Define the roles to create
const ROLES_TO_CREATE = [
  'system_admin',
  'company_admin', 
  'team_lead',
  'frontline_worker'
];

export const createTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('🚀 Creating test users for all roles...');

    // First, find or create the NDIS test company
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
      console.log('✅ Created test company:', companyId);
    } else {
      console.log('✅ Using existing company:', company._id);
    }

    const createdUsers = [];
    const results = [];

    for (const role of ROLES_TO_CREATE) {
      const email = `${role}@ndis.com.au`;
      const name = role.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      try {
        // Check if user already exists
        const existingUser = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('email'), email))
          .first();

        if (existingUser) {
          results.push({
            email,
            status: 'exists',
            role: existingUser.role,
            userId: existingUser._id
          });
          continue;
        }

        // Create user using bcrypt for password hashing
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('password', 12);

        const userId = await ctx.db.insert('users', {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          company_id: company._id,
          has_llm_access: role === 'system_admin' || role === 'company_admin' || role === 'team_lead',
        });

        createdUsers.push({
          id: userId,
          email,
          name,
          role,
          password: 'password'
        });

        results.push({
          email,
          status: 'created',
          role,
          userId
        });

      } catch (error) {
        results.push({
          email,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('\n🎉 Test user creation complete!');
    console.log('\n📋 Results Summary:');
    console.log('===================');
    
    results.forEach(result => {
      const status = result.status === 'created' ? '✅ CREATED' : 
                    result.status === 'exists' ? '⚠️  EXISTS' : '❌ ERROR';
      console.log(`${result.email.padEnd(30)} | ${status.padEnd(10)} | ${result.role || 'N/A'}`);
    });

    console.log('\n📧 Login Instructions:');
    console.log('======================');
    console.log('Visit: http://localhost:3000/login');
    console.log('Email: [role]@ndis.com.au');
    console.log('Password: password');
    
    console.log('\n🔑 Available Roles:');
    console.log('==================');
    console.log('system_admin@ndis.com.au     - Full system access');
    console.log('company_admin@ndis.com.au    - Company management');  
    console.log('team_lead@ndis.com.au        - Team incident management');
    console.log('frontline_worker@ndis.com.au - Basic incident creation');

    return {
      success: true,
      created: createdUsers.length,
      total: results.length,
      results
    };
  }
});