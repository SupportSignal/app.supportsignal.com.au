// @ts-nocheck
/**
 * Story 3.4: Workflow Auto-Completion Tests
 * 
 * Test Coverage:
 * - autoCompleteWorkflow mutation functionality
 * - backfillWorkflowCompletions data migration
 * - Updated modal query exclusions
 * - Permission and boundary validations
 */

import { convexTest } from 'convex-test';
import { api } from '../../../apps/convex/_generated/api';
import { Id } from '../../../apps/convex/_generated/dataModel';
import schema from '../../../apps/convex/schema';

describe('Story 3.4: Workflow Auto-Completion', () => {
  
  describe('autoCompleteWorkflow mutation', () => {
    
    test('should auto-complete workflow when all conditions are met', async () => {
      const t = convexTest(schema);

      // Setup test data
      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert('companies', {
          name: 'Test Company',
          domain: 'test.com',
          created_at: Date.now(),
          updated_at: Date.now()
        });
      });

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          email: 'test@test.com',
          company_id: companyId,
          role: 'frontline_worker',
          permissions: ['CREATE_INCIDENT', 'UPDATE_INCIDENT'],
          created_at: Date.now(),
          updated_at: Date.now()
        });
      });

      const sessionToken = 'test-session-token';
      await t.run(async (ctx) => {
        await ctx.db.insert('user_sessions', {
          session_token: sessionToken,
          user_id: userId,
          expires_at: Date.now() + 86400000,
          created_at: Date.now()
        });
      });

      // Create enhanced narrative
      const enhancedNarrativeId = await t.run(async (ctx) => {
        return await ctx.db.insert('enhanced_narratives', {
          incident_id: null, // Will be updated after incident creation
          enhanced_content: 'Test enhanced narrative content',
          enhancement_version: 1,
          user_edited: false,
          created_at: Date.now(),
          updated_at: Date.now()
        });
      });

      // Create incident ready for auto-completion
      const incidentId = await t.run(async (ctx) => {
        const id = await ctx.db.insert('incidents', {
          company_id: companyId,
          created_by: userId,
          reporter_name: 'Test Reporter',
          participant_name: 'Test Participant',
          event_date_time: 'Today at 2:00 PM',
          location: 'Test Location',
          
          capture_status: 'completed',
          analysis_status: 'not_started',
          overall_status: 'analysis_pending', // Ready for auto-completion
          
          enhanced_narrative_id: enhancedNarrativeId,
          
          created_at: Date.now(),
          updated_at: Date.now()
        });

        // Update enhanced narrative with incident ID
        await ctx.db.patch(enhancedNarrativeId, {
          incident_id: id
        });

        return id;
      });

      // Test auto-completion
      const result = await t.mutation(api.incidents.autoCompleteWorkflow, {
        sessionToken,
        incident_id: incidentId,
        correlation_id: 'test-correlation'
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('ready_for_analysis');
      expect(result.workflow_completed_at).toBeDefined();
      expect(typeof result.workflow_completed_at).toBe('number');

      // Verify incident was updated
      const updatedIncident = await t.run(async (ctx) => {
        return await ctx.db.get(incidentId);
      });

      expect(updatedIncident.overall_status).toBe('ready_for_analysis');
      expect(updatedIncident.workflow_completed_at).toBeDefined();
      expect(updatedIncident.updated_at).toBeDefined();
    });

    test('should return already_completed for incidents already auto-completed', async () => {
      const t = convexTest(schema);

      // Setup similar to above but with already completed incident
      const { companyId, userId, sessionToken, incidentId } = await setupTestData(t);

      await t.run(async (ctx) => {
        await ctx.db.patch(incidentId, {
          overall_status: 'ready_for_analysis',
          workflow_completed_at: Date.now()
        });
      });

      const result = await t.mutation(api.incidents.autoCompleteWorkflow, {
        sessionToken,
        incident_id: incidentId,
      });

      expect(result.success).toBe(true);
      expect(result.already_completed).toBe(true);
      expect(result.current_status).toBe('ready_for_analysis');
    });

    test('should fail if incident has no enhanced narrative', async () => {
      const t = convexTest(schema);

      const { companyId, userId, sessionToken } = await setupTestData(t);

      // Create incident without enhanced narrative
      const incidentId = await t.run(async (ctx) => {
        return await ctx.db.insert('incidents', {
          company_id: companyId,
          created_by: userId,
          reporter_name: 'Test Reporter',
          participant_name: 'Test Participant',
          event_date_time: 'Today at 2:00 PM',
          location: 'Test Location',
          
          capture_status: 'completed',
          analysis_status: 'not_started',
          overall_status: 'analysis_pending',
          
          // No enhanced_narrative_id
          
          created_at: Date.now(),
          updated_at: Date.now()
        });
      });

      await expect(
        t.mutation(api.incidents.autoCompleteWorkflow, {
          sessionToken,
          incident_id: incidentId,
        })
      ).rejects.toThrow('Cannot auto-complete - workflow not fully finished');
    });

    test('should fail for wrong company boundary', async () => {
      const t = convexTest(schema);

      const { sessionToken, incidentId } = await setupTestData(t);

      // Create different company
      const otherCompanyId = await t.run(async (ctx) => {
        return await ctx.db.insert('companies', {
          name: 'Other Company',
          domain: 'other.com',
          created_at: Date.now(),
          updated_at: Date.now()
        });
      });

      // Move incident to different company
      await t.run(async (ctx) => {
        await ctx.db.patch(incidentId, {
          company_id: otherCompanyId
        });
      });

      await expect(
        t.mutation(api.incidents.autoCompleteWorkflow, {
          sessionToken,
          incident_id: incidentId,
        })
      ).rejects.toThrow('Access denied - incident belongs to different company');
    });

  });

  describe('backfillWorkflowCompletions mutation', () => {

    test('should backfill historical incidents with completed workflows', async () => {
      const t = convexTest(schema);

      // Setup company and admin user
      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert('companies', {
          name: 'Test Company',
          domain: 'test.com',
          created_at: Date.now(),
          updated_at: Date.now()
        });
      });

      const adminUserId = await t.run(async (ctx) => {
        return await ctx.db.insert('users', {
          email: 'admin@test.com',
          company_id: companyId,
          role: 'company_admin',
          permissions: ['ADMIN'], // Admin permission for backfill
          created_at: Date.now(),
          updated_at: Date.now()
        });
      });

      const sessionToken = 'admin-session-token';
      await t.run(async (ctx) => {
        await ctx.db.insert('user_sessions', {
          session_token: sessionToken,
          user_id: adminUserId,
          expires_at: Date.now() + 86400000,
          created_at: Date.now()
        });
      });

      // Create 3 incidents that should be backfilled
      const incidentIds = [];
      for (let i = 0; i < 3; i++) {
        const enhancedNarrativeId = await t.run(async (ctx) => {
          return await ctx.db.insert('enhanced_narratives', {
            incident_id: null,
            enhanced_content: `Test content ${i}`,
            enhancement_version: 1,
            user_edited: false,
            created_at: Date.now(),
            updated_at: Date.now()
          });
        });

        const incidentId = await t.run(async (ctx) => {
          const id = await ctx.db.insert('incidents', {
            company_id: companyId,
            created_by: adminUserId,
            reporter_name: `Reporter ${i}`,
            participant_name: `Participant ${i}`,
            event_date_time: 'Yesterday',
            location: 'Test Location',
            
            capture_status: 'completed',
            analysis_status: 'not_started',
            overall_status: 'analysis_pending', // Should be backfilled
            enhanced_narrative_id: enhancedNarrativeId,
            
            created_at: Date.now() - 86400000, // Yesterday
            updated_at: Date.now() - 86400000,
          });

          await ctx.db.patch(enhancedNarrativeId, {
            incident_id: id
          });

          return id;
        });

        incidentIds.push(incidentId);
      }

      // Run backfill
      const result = await t.mutation(api.incidents.backfillWorkflowCompletions, {
        sessionToken,
        limit: 10,
        correlation_id: 'test-backfill'
      });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(3);
      expect(result.updated).toBe(3);
      expect(result.hasMore).toBe(false);

      // Verify all incidents were updated
      for (const incidentId of incidentIds) {
        const incident = await t.run(async (ctx) => {
          return await ctx.db.get(incidentId);
        });

        expect(incident.overall_status).toBe('ready_for_analysis');
        expect(incident.workflow_completed_at).toBeDefined();
      }
    });

    test('should require admin permissions for backfill', async () => {
      const t = convexTest(schema);

      const { sessionToken } = await setupTestData(t); // Regular user, not admin

      await expect(
        t.mutation(api.incidents.backfillWorkflowCompletions, {
          sessionToken,
        })
      ).rejects.toThrow('Insufficient permissions');
    });

  });

  describe('getMyIncompleteIncidents query', () => {

    test('should exclude ready_for_analysis incidents from incomplete list', async () => {
      const t = convexTest(schema);

      const { companyId, userId, sessionToken } = await setupTestData(t);

      // Create incidents with different statuses
      const incidentStatuses = [
        'capture_pending',
        'analysis_pending',
        'ready_for_analysis', // Should be excluded
        'completed' // Should be excluded
      ];

      const incidentIds = [];
      for (const status of incidentStatuses) {
        const incidentId = await t.run(async (ctx) => {
          return await ctx.db.insert('incidents', {
            company_id: companyId,
            created_by: userId,
            reporter_name: 'Test Reporter',
            participant_name: 'Test Participant',
            event_date_time: 'Today',
            location: 'Test Location',
            
            capture_status: status === 'capture_pending' ? 'draft' : 'completed',
            analysis_status: 'not_started',
            overall_status: status,
            
            created_at: Date.now(),
            updated_at: Date.now()
          });
        });

        incidentIds.push({ id: incidentId, status });
      }

      // Query incomplete incidents
      const result = await t.query(api.incidents_listing.getMyIncompleteIncidents, {
        sessionToken
      });

      expect(result.totalCount).toBe(2); // Only capture_pending and analysis_pending
      expect(result.incidents).toHaveLength(2);

      // Verify excluded statuses are not returned
      const returnedStatuses = result.incidents.map(i => i.overall_status);
      expect(returnedStatuses).not.toContain('ready_for_analysis');
      expect(returnedStatuses).not.toContain('completed');
      expect(returnedStatuses).toContain('capture_pending');
      expect(returnedStatuses).toContain('analysis_pending');
    });

  });

});

// Helper function to setup basic test data
async function setupTestData(t) {
  const companyId = await t.run(async (ctx) => {
    return await ctx.db.insert('companies', {
      name: 'Test Company',
      domain: 'test.com',
      created_at: Date.now(),
      updated_at: Date.now()
    });
  });

  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      email: 'test@test.com',
      company_id: companyId,
      role: 'frontline_worker',
      permissions: ['CREATE_INCIDENT', 'UPDATE_INCIDENT'],
      created_at: Date.now(),
      updated_at: Date.now()
    });
  });

  const sessionToken = 'test-session-token';
  await t.run(async (ctx) => {
    await ctx.db.insert('user_sessions', {
      session_token: sessionToken,
      user_id: userId,
      expires_at: Date.now() + 86400000,
      created_at: Date.now()
    });
  });

  const enhancedNarrativeId = await t.run(async (ctx) => {
    return await ctx.db.insert('enhanced_narratives', {
      incident_id: null,
      enhanced_content: 'Test enhanced narrative content',
      enhancement_version: 1,
      user_edited: false,
      created_at: Date.now(),
      updated_at: Date.now()
    });
  });

  const incidentId = await t.run(async (ctx) => {
    const id = await ctx.db.insert('incidents', {
      company_id: companyId,
      created_by: userId,
      reporter_name: 'Test Reporter',
      participant_name: 'Test Participant',
      event_date_time: 'Today at 2:00 PM',
      location: 'Test Location',
      
      capture_status: 'completed',
      analysis_status: 'not_started',
      overall_status: 'analysis_pending',
      
      enhanced_narrative_id: enhancedNarrativeId,
      
      created_at: Date.now(),
      updated_at: Date.now()
    });

    await ctx.db.patch(enhancedNarrativeId, {
      incident_id: id
    });

    return id;
  });

  return {
    companyId,
    userId,
    sessionToken,
    enhancedNarrativeId,
    incidentId
  };
}