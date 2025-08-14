// @ts-nocheck
import { convexTest } from 'convex-test';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import schema from '@/convex/schema';

/**
 * Helper class for Convex backend testing
 * Provides common setup and utilities for testing Convex functions
 */
export class ConvexTestingHelper {
  public t: any;
  public userId: Id<'users'> | null = null;
  public sessionToken: string = '';

  async setup() {
    this.t = convexTest(schema);
    
    // Create test user
    this.userId = await this.t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'test.user@example.com',
        name: 'Test User',
        role: 'frontline_worker',
        company_id: 'test-company-id' as Id<'companies'>,
        profile_image_url: null,
        _creationTime: Date.now(),
      });
    });

    // Create session token
    this.sessionToken = await this.t.run(async (ctx: any) => {
      const sessionId = await ctx.db.insert('sessions', {
        user_id: this.userId!,
        session_token: `test-session-${Date.now()}-${Math.random()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        created_at: Date.now(),
      });
      
      const session = await ctx.db.get(sessionId);
      return session?.session_token || '';
    });
  }

  async runAction(actionPath: string, args: any) {
    const [module, functionName] = actionPath.split('.');
    return await this.t.action(api[module][functionName], args);
  }

  async runQuery(queryPath: string, args: any) {
    const [module, functionName] = queryPath.split('.');
    return await this.t.query(api[module][functionName], args);
  }

  async runMutation(mutationPath: string, args: any) {
    const [module, functionName] = mutationPath.split('.');
    return await this.t.mutation(api[module][functionName], args);
  }

  async createTestIncident(incidentData: Partial<any>): Promise<Id<"incidents">> {
    return await this.t.run(async (ctx: any) => {
      return await ctx.db.insert('incidents', {
        reporter_name: incidentData.reporter_name || 'Test Reporter',
        participant_name: incidentData.participant_name || 'Test Participant',
        event_date_time: incidentData.event_date_time || new Date().toISOString(),
        location: incidentData.location || 'Test Location',
        
        // Narrative fields
        narrative_before_event: incidentData.narrative_before_event || '',
        narrative_during_event: incidentData.narrative_during_event || '',
        narrative_end_event: incidentData.narrative_end_event || '',
        narrative_post_event: incidentData.narrative_post_event || '',
        
        // Optional fields
        clarification_responses: incidentData.clarification_responses || null,
        enhanced_narrative_id: incidentData.enhanced_narrative_id || null,
        handoff_status: incidentData.handoff_status || null,
        completion_checklist: incidentData.completion_checklist || null,
        
        // System fields
        created_by: this.userId!,
        created_at: Date.now(),
        updated_at: Date.now(),
        _creationTime: Date.now(),
      });
    });
  }

  async cleanup() {
    // Cleanup is handled automatically by convex-test
  }
}