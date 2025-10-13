/**
 * Company Management - System Admin Operations
 * Story 7.5 - System-Wide Company Management & Editing
 *
 * System admins can manage companies across the entire system.
 * Uses MANAGE_ALL_COMPANIES permission for system-wide operations.
 */

import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';
import { validateCompanyUpdate } from '../lib/validation';

/**
 * Get company details for editing
 */
export const getCompanyForEdit = query({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only (system-wide operation)
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Get company details
    const company = await ctx.db.get(args.companyId);

    // Return null for deleted companies (don't throw - let frontend handle gracefully)
    if (!company) {
      return null;
    }

    return company;
  },
});

/**
 * Update company details
 */
export const updateCompany = mutation({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
    updates: v.object({
      name: v.optional(v.string()),
      contact_email: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal('active'),
        v.literal('trial'),
        v.literal('suspended'),
        v.literal('test')
      )),
    }),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only (system-wide operation)
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Validate updates
    const validation = validateCompanyUpdate(args.updates);
    if (!validation.isValid) {
      throw new ConvexError(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Get existing company
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new ConvexError('Company not found');
    }

    // Update company (slug is immutable - no updated_at in schema)
    await ctx.db.patch(args.companyId, args.updates);

    // Return updated company
    const updatedCompany = await ctx.db.get(args.companyId);
    return updatedCompany;
  },
});

/**
 * List all companies with aggregated counts
 */
export const listAllCompanies = query({
  args: {
    sessionToken: v.string(),
    statusFilter: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only (system-wide operation)
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Get all companies
    let companies = await ctx.db.query('companies').collect();

    // Apply status filter
    if (args.statusFilter) {
      companies = companies.filter(c => c.status === args.statusFilter);
    }

    // Apply search filter
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      companies = companies.filter(c =>
        c.name.toLowerCase().includes(query)
      );
    }

    // Get counts for each company
    const companiesWithCounts = await Promise.all(
      companies.map(async (company) => {
        const [users, participants, sites, incidents] = await Promise.all([
          ctx.db
            .query('users')
            .withIndex('by_company', q => q.eq('company_id', company._id))
            .collect(),
          ctx.db
            .query('participants')
            .withIndex('by_company', q => q.eq('company_id', company._id))
            .collect(),
          ctx.db
            .query('sites')
            .withIndex('by_company', q => q.eq('company_id', company._id))
            .collect(),
          ctx.db
            .query('incidents')
            .withIndex('by_company', q => q.eq('company_id', company._id))
            .collect(),
        ]);

        const activeIncidents = incidents.filter(i => i.overall_status !== 'completed');

        return {
          ...company,
          userCount: users.length,
          participantCount: participants.length,
          siteCount: sites.length,
          activeIncidentCount: activeIncidents.length,
        };
      })
    );

    // Sort by created_at descending (newest first)
    companiesWithCounts.sort((a, b) => b.created_at - a.created_at);

    return companiesWithCounts;
  },
});

/**
 * Get system-wide metrics
 */
export const getSystemMetrics = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only (system-wide operation)
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Get all records
    const [companies, users, participants, sites, incidents] = await Promise.all([
      ctx.db.query('companies').collect(),
      ctx.db.query('users').collect(),
      ctx.db.query('participants').collect(),
      ctx.db.query('sites').collect(),
      ctx.db.query('incidents').collect(),
    ]);

    // Count companies by status
    const companiesByStatus = companies.reduce((acc, company) => {
      acc[company.status] = (acc[company.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCompanies: companies.length,
      totalUsers: users.length,
      totalParticipants: participants.length,
      totalSites: sites.length,
      totalIncidents: incidents.length,
      companiesByStatus,
    };
  },
});

/**
 * Preview test company cleanup
 */
export const previewTestCompanyCleanup = query({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only (system-wide operation)
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Get company and validate it's a test company
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new ConvexError('Company not found');
    }

    if (company.status !== 'test') {
      throw new ConvexError('Only test companies can be deleted. This company has status: ' + company.status);
    }

    // Get all related data
    const [sites, users, participants, incidents, userInvitations, sessions, impersonationSessions] = await Promise.all([
      ctx.db.query('sites').withIndex('by_company', q => q.eq('company_id', args.companyId)).collect(),
      ctx.db.query('users').withIndex('by_company', q => q.eq('company_id', args.companyId)).collect(),
      ctx.db.query('participants').withIndex('by_company', q => q.eq('company_id', args.companyId)).collect(),
      ctx.db.query('incidents').withIndex('by_company', q => q.eq('company_id', args.companyId)).collect(),
      ctx.db.query('user_invitations').withIndex('by_company', q => q.eq('company_id', args.companyId)).collect(),
      ctx.db.query('sessions').collect(), // Will filter by user_id
      ctx.db.query('impersonation_sessions').collect(), // Will filter by user_id
    ]);

    // Filter sessions by company users
    const userIds = users.map(u => u._id);
    const companySessions = sessions.filter(s => userIds.includes(s.userId));
    const companyImpersonationSessions = impersonationSessions.filter(s =>
      userIds.includes(s.admin_user_id) || userIds.includes(s.target_user_id)
    );

    // Calculate total dependent records
    const incidentDependents = incidents.length * 7; // questions, answers, narratives, analysis, classifications, handoffs (estimate)

    const totalRecords =
      sites.length +
      users.length +
      participants.length +
      incidents.length +
      userInvitations.length +
      companySessions.length +
      companyImpersonationSessions.length +
      incidentDependents +
      1; // company itself

    return {
      company: {
        _id: company._id,
        name: company.name,
        status: company.status,
      },
      sites: {
        count: sites.length,
        names: sites.map(s => s.name),
      },
      users: {
        count: users.length,
        emails: users.map(u => u.email),
      },
      participants: {
        count: participants.length,
        names: participants.map(p => `${p.first_name} ${p.last_name}`),
      },
      incidents: {
        count: incidents.length,
      },
      userInvitations: {
        count: userInvitations.length,
      },
      sessions: {
        count: companySessions.length,
      },
      totalRecords,
    };
  },
});

/**
 * Execute test company cleanup
 */
export const executeTestCompanyCleanup = mutation({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only (system-wide operation)
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Get company and validate it's a test company
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new ConvexError('Company not found');
    }

    if (company.status !== 'test') {
      throw new ConvexError('Only test companies can be deleted. This company has status: ' + company.status);
    }

    const deletedCounts: Record<string, number> = {};

    // 1. Delete incidents and all dependent data
    const incidents = await ctx.db
      .query('incidents')
      .withIndex('by_company', q => q.eq('company_id', args.companyId))
      .collect();

    for (const incident of incidents) {
      // Delete clarification questions and answers
      const questions = await ctx.db
        .query('clarification_questions')
        .withIndex('by_incident', q => q.eq('incident_id', incident._id))
        .collect();

      for (const question of questions) {
        const answers = await ctx.db
          .query('clarification_answers')
          .withIndex('by_question', q => q.eq('question_id', question._id))
          .collect();
        for (const answer of answers) {
          await ctx.db.delete(answer._id);
        }
        await ctx.db.delete(question._id);
      }

      // Delete incident narratives
      const narratives = await ctx.db
        .query('incident_narratives')
        .withIndex('by_incident', q => q.eq('incident_id', incident._id))
        .collect();
      for (const narrative of narratives) {
        await ctx.db.delete(narrative._id);
      }

      // Delete incident analysis
      const analyses = await ctx.db
        .query('incident_analysis')
        .withIndex('by_incident', q => q.eq('incident_id', incident._id))
        .collect();
      for (const analysis of analyses) {
        await ctx.db.delete(analysis._id);
      }

      // Delete incident classifications
      const classifications = await ctx.db
        .query('incident_classifications')
        .withIndex('by_incident', q => q.eq('incident_id', incident._id))
        .collect();
      for (const classification of classifications) {
        await ctx.db.delete(classification._id);
      }

      // Delete workflow handoffs
      const handoffs = await ctx.db
        .query('workflow_handoffs')
        .withIndex('by_incident', q => q.eq('incident_id', incident._id))
        .collect();
      for (const handoff of handoffs) {
        await ctx.db.delete(handoff._id);
      }

      // Delete incident
      await ctx.db.delete(incident._id);
    }
    deletedCounts.incidents = incidents.length;

    // 2. Delete participants
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_company', q => q.eq('company_id', args.companyId))
      .collect();
    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }
    deletedCounts.participants = participants.length;

    // 3. Delete sites
    const sites = await ctx.db
      .query('sites')
      .withIndex('by_company', q => q.eq('company_id', args.companyId))
      .collect();
    for (const site of sites) {
      await ctx.db.delete(site._id);
    }
    deletedCounts.sites = sites.length;

    // 4. Delete user invitations
    const userInvitations = await ctx.db
      .query('user_invitations')
      .withIndex('by_company', q => q.eq('company_id', args.companyId))
      .collect();
    for (const invitation of userInvitations) {
      await ctx.db.delete(invitation._id);
    }
    deletedCounts.user_invitations = userInvitations.length;

    // 5. Delete users and their sessions
    const users = await ctx.db
      .query('users')
      .withIndex('by_company', q => q.eq('company_id', args.companyId))
      .collect();

    for (const companyUser of users) {
      // Delete sessions
      const userSessions = await ctx.db
        .query('sessions')
        .withIndex('by_user_id', q => q.eq('userId', companyUser._id))
        .collect();
      for (const session of userSessions) {
        await ctx.db.delete(session._id);
      }

      // Delete impersonation sessions
      const impersonationSessions = await ctx.db
        .query('impersonation_sessions')
        .collect();
      const userImpersonationSessions = impersonationSessions.filter(s =>
        s.admin_user_id === companyUser._id || s.target_user_id === companyUser._id
      );
      for (const session of userImpersonationSessions) {
        await ctx.db.delete(session._id);
      }

      // Delete user
      await ctx.db.delete(companyUser._id);
    }
    deletedCounts.users = users.length;

    // 6. Delete company
    await ctx.db.delete(args.companyId);
    deletedCounts.companies = 1;

    // Log cleanup operation
    console.log('🧹 TEST COMPANY CLEANUP COMPLETE', {
      companyId: args.companyId,
      companyName: company.name,
      deletedBy: user._id,
      deletedCounts,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      deletedCounts,
      companyName: company.name,
    };
  },
});
