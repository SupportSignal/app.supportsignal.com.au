/**
 * Database Export System for Claude Code Analysis
 *
 * Provides full database export capabilities for external analysis workflows.
 * System admin access only for security.
 */

import { query } from './_generated/server';
import { v } from 'convex/values';
import { getUserFromSession } from './lib/sessionResolver';

/**
 * Generate full database export in JSON format
 *
 * Security: System admin role required
 * Performance: Handles large datasets (500+ incidents, 100+ participants)
 * Privacy: Excludes password fields and debug logs
 */
export const generateDatabaseExport = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate system admin role
    const user = await getUserFromSession(ctx, args.sessionToken);

    if (!user) {
      throw new Error('Authentication required. Please log in.');
    }

    if (user.role !== 'system_admin') {
      throw new Error('Unauthorized. System admin access required for database exports.');
    }

    // 2. Query all tables (excluding debug_logs per requirements)
    const [
      companies,
      users,
      userInvitations,
      sites,
      sessions,
      accounts,
      passwordResetTokens,
      impersonationSessions,
      participants,
      incidents,
      incidentNarratives,
      clarificationQuestions,
      clarificationAnswers,
      incidentAnalysis,
      incidentClassifications,
      aiPrompts,
      aiRequestLogs,
      workflowHandoffs,
    ] = await Promise.all([
      ctx.db.query('companies').collect(),
      ctx.db.query('users').collect(),
      ctx.db.query('user_invitations').collect(),
      ctx.db.query('sites').collect(),
      ctx.db.query('sessions').collect(),
      ctx.db.query('accounts').collect(),
      ctx.db.query('password_reset_tokens').collect(),
      ctx.db.query('impersonation_sessions').collect(),
      ctx.db.query('participants').collect(),
      ctx.db.query('incidents').collect(),
      ctx.db.query('incident_narratives').collect(),
      ctx.db.query('clarification_questions').collect(),
      ctx.db.query('clarification_answers').collect(),
      ctx.db.query('incident_analysis').collect(),
      ctx.db.query('incident_classifications').collect(),
      ctx.db.query('ai_prompts').collect(),
      ctx.db.query('ai_request_logs').collect(),
      ctx.db.query('workflow_handoffs').collect(),
    ]);

    // 3. Remove password field from users for security
    const sanitizedUsers = users.map(({ password, ...user }) => user);

    // 4. Calculate record counts
    const recordCounts = {
      companies: companies.length,
      users: sanitizedUsers.length,
      user_invitations: userInvitations.length,
      sites: sites.length,
      sessions: sessions.length,
      accounts: accounts.length,
      password_reset_tokens: passwordResetTokens.length,
      impersonation_sessions: impersonationSessions.length,
      participants: participants.length,
      incidents: incidents.length,
      incident_narratives: incidentNarratives.length,
      clarification_questions: clarificationQuestions.length,
      clarification_answers: clarificationAnswers.length,
      incident_analysis: incidentAnalysis.length,
      incident_classifications: incidentClassifications.length,
      ai_prompts: aiPrompts.length,
      ai_request_logs: aiRequestLogs.length,
      workflow_handoffs: workflowHandoffs.length,
    };

    const totalRecords = Object.values(recordCounts).reduce((sum, count) => sum + count, 0);

    // 5. Return structured export
    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportType: 'full' as const,
        version: '1.0',
        recordCounts,
        totalRecords,
        exportedBy: user._id,
      },
      data: {
        companies,
        users: sanitizedUsers,
        user_invitations: userInvitations,
        sites,
        sessions,
        accounts,
        password_reset_tokens: passwordResetTokens,
        impersonation_sessions: impersonationSessions,
        participants,
        incidents,
        incident_narratives: incidentNarratives,
        clarification_questions: clarificationQuestions,
        clarification_answers: clarificationAnswers,
        incident_analysis: incidentAnalysis,
        incident_classifications: incidentClassifications,
        ai_prompts: aiPrompts,
        ai_request_logs: aiRequestLogs,
        workflow_handoffs: workflowHandoffs,
      },
    };
  },
});
