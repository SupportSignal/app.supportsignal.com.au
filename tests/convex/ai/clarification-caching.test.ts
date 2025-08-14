// @ts-nocheck
import { convexTest } from 'convex-test';
import { expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import schema from '@convex/schema';

/**
 * AI Clarification Caching System Tests
 * 
 * Tests the caching mechanism for AI-generated clarification questions
 * to ensure performance optimization and reduce unnecessary AI API calls.
 */
describe('AI Clarification Caching System', () => {
  let t: any;
  let userId: Id<'users'>;
  let incidentId: Id<'incidents'>;
  let sessionToken: string;

  beforeEach(async () => {
    t = convexTest(schema);
    
    // Create test user
    userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'caching.test@test.com',
        name: 'Caching Test User',
        role: 'frontline_worker',
        company_id: 'test-company-id' as Id<'companies'>,
        profile_image_url: null,
        _creationTime: Date.now(),
      });
    });

    // Create session
    sessionToken = await t.run(async (ctx: any) => {
      const sessionId = await ctx.db.insert('sessions', {
        user_id: userId,
        session_token: `caching-session-${Date.now()}-${Math.random()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        created_at: Date.now(),
      });
      
      const session = await ctx.db.get(sessionId);
      return session?.session_token || '';
    });

    // Create test incident with narrative
    incidentId = await t.mutation(api.incidents.createIncident, {
      sessionToken,
      participant_name: 'Cache Test Participant',
      reporter_name: 'Cache Test Reporter', 
      event_date_time: new Date().toISOString(),
      location: 'Cache Test Location',
      severity: 'medium' as const,
      capture_status: 'draft' as const,
    });

    await t.mutation(api.incidents.createIncidentNarrative, {
      sessionToken,
      incident_id: incidentId,
      before_event: 'Detailed before event narrative for caching tests',
      during_event: 'Detailed during event narrative for caching tests',
      end_event: 'Detailed end event narrative for caching tests',
      post_event: 'Detailed post event narrative for caching tests',
    });

    // Seed AI prompt template
    await t.run(async (ctx: any) => {
      await ctx.db.insert('ai_prompts', {
        prompt_name: 'generate_clarification_questions',
        prompt_version: 'v1.0.0',
        prompt_template: `Generate clarification questions for {{phase}} phase with content: {{narrative_content}}`,
        description: 'Test prompt for caching',
        workflow_step: 'clarification_questions',
        subsystem: 'incidents',
        ai_model: 'claude-3-haiku-20240307',
        is_active: true,
        created_at: Date.now(),
      });
    });
  });

  afterEach(async () => {
    if (t) {
      await t.finishAll();
    }
  });

  describe('Cache Hit Behavior', () => {
    test('should return cached result for identical narrative content', async () => {
      const narrativeContent = 'Identical narrative content for caching test';
      
      // First generation - should not be cached
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result1.success).toBe(true);
      expect(result1.cached).toBe(false);
      expect(result1.questions.length).toBeGreaterThan(0);
      
      // Second generation with identical content - should be cached
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result2.success).toBe(true);
      expect(result2.cached).toBe(true);
      expect(result2.questions.length).toBe(result1.questions.length);
      
      // Should have same question content
      expect(result2.questions[0].question_text).toBe(result1.questions[0].question_text);
    });

    test('should cache independently for different phases', async () => {
      const narrativeContent = 'Same narrative for different phases';
      
      // Generate for before_event
      const beforeResult = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(beforeResult.cached).toBe(false);
      
      // Generate for during_event - should not be cached (different phase)
      const duringResult = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'during_event',
        narrative_content: narrativeContent,
      });
      
      expect(duringResult.cached).toBe(false);
      
      // Generate for before_event again - should be cached
      const beforeResult2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(beforeResult2.cached).toBe(true);
    });

    test('should respect cache across different incidents for same narrative', async () => {
      const narrativeContent = 'Cross-incident narrative content';
      
      // Generate for first incident
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result1.cached).toBe(false);
      
      // Create second incident
      const incidentId2 = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        participant_name: 'Second Incident',
        reporter_name: 'Second Reporter',
        event_date_time: new Date().toISOString(),
        location: 'Second Location',
        severity: 'low' as const,
        capture_status: 'draft' as const,
      });
      
      // Generate for second incident with same narrative - should be cached
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId2,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result2.cached).toBe(true);
      expect(result2.questions.length).toBe(result1.questions.length);
    });
  });

  describe('Cache Miss Behavior', () => {
    test('should not cache when narrative content differs', async () => {
      const narrative1 = 'First narrative content';
      const narrative2 = 'Second narrative content';
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrative1,
      });
      
      expect(result1.cached).toBe(false);
      
      // Second generation with different content
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrative2,
      });
      
      expect(result2.cached).toBe(false);
    });

    test('should not cache when minor whitespace differences exist', async () => {
      const narrative1 = 'Narrative with spaces';
      const narrative2 = 'Narrative  with  spaces'; // Extra spaces
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrative1,
      });
      
      expect(result1.cached).toBe(false);
      
      // Second generation with different whitespace
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrative2,
      });
      
      expect(result2.cached).toBe(false);
    });

    test('should not cache when case differs', async () => {
      const narrative1 = 'narrative content';
      const narrative2 = 'Narrative Content'; // Different case
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrative1,
      });
      
      expect(result1.cached).toBe(false);
      
      // Second generation with different case
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrative2,
      });
      
      expect(result2.cached).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    test('should generate consistent cache keys for identical inputs', async () => {
      const narrativeContent = 'Consistent narrative for cache key testing';
      
      // Generate twice with identical inputs
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(true);
      
      // Should have correlation IDs indicating cache hit
      expect(result2.correlation_id).toBeDefined();
    });

    test('should handle empty narrative content consistently', async () => {
      const emptyNarrative = '';
      
      // First generation with empty content
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: emptyNarrative,
      });
      
      expect(result1.success).toBe(true);
      expect(result1.cached).toBe(false);
      
      // Second generation with empty content - should be cached
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: emptyNarrative,
      });
      
      expect(result2.cached).toBe(true);
    });

    test('should handle unicode and special characters in cache keys', async () => {
      const unicodeNarrative = 'Narrative with émojis 🎉 and spëcial characters';
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: unicodeNarrative,
      });
      
      expect(result1.cached).toBe(false);
      
      // Second generation - should be cached
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: unicodeNarrative,
      });
      
      expect(result2.cached).toBe(true);
    });
  });

  describe('Cache Performance', () => {
    test('should improve response time for cached requests', async () => {
      const narrativeContent = 'Performance test narrative content';
      
      // First generation - measure time
      const start1 = Date.now();
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      const time1 = Date.now() - start1;
      
      expect(result1.cached).toBe(false);
      
      // Second generation - should be faster
      const start2 = Date.now();
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      const time2 = Date.now() - start2;
      
      expect(result2.cached).toBe(true);
      
      // Cached request should be significantly faster
      expect(time2).toBeLessThan(time1);
      expect(result2.processing_time_ms).toBeLessThan(result1.processing_time_ms);
    });

    test('should handle multiple concurrent cache requests', async () => {
      const narrativeContent = 'Concurrent cache test narrative';
      
      // Generate once to prime cache
      await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      // Make multiple concurrent requests for cached content
      const promises = Array.from({ length: 5 }, () =>
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase: 'before_event',
          narrative_content: narrativeContent,
        })
      );
      
      const results = await Promise.all(promises);
      
      // All should be cached
      results.forEach(result => {
        expect(result.cached).toBe(true);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate cache when prompt template changes', async () => {
      const narrativeContent = 'Template change test narrative';
      
      // First generation with current template
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result1.cached).toBe(false);
      
      // Update prompt template
      await t.run(async (ctx: any) => {
        const existingPrompt = await ctx.db
          .query('ai_prompts')
          .filter(q => q.eq(q.field('prompt_name'), 'generate_clarification_questions'))
          .filter(q => q.eq(q.field('is_active'), true))
          .first();
        
        if (existingPrompt) {
          await ctx.db.patch(existingPrompt._id, {
            is_active: false,
          });
        }
        
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v2.0.0',
          prompt_template: 'Updated template for {{phase}} with {{narrative_content}}',
          description: 'Updated prompt template',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });
      
      // Second generation should not use cache due to template change
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result2.cached).toBe(false);
    });
  });

  describe('Cache Limitations and Boundaries', () => {
    test('should handle very large narrative content', async () => {
      const largeNarrative = 'Large narrative content: ' + 'A'.repeat(5000);
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: largeNarrative,
      });
      
      expect(result1.success).toBe(true);
      expect(result1.cached).toBe(false);
      
      // Second generation - should be cached even with large content
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: largeNarrative,
      });
      
      expect(result2.cached).toBe(true);
    });

    test('should handle cache for all supported phases', async () => {
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      const narrativeContent = 'Multi-phase cache test';
      
      // Generate for all phases
      for (const phase of phases) {
        const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: narrativeContent,
        });
        
        expect(result1.cached).toBe(false);
        
        // Second generation for same phase should be cached
        const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: narrativeContent,
        });
        
        expect(result2.cached).toBe(true);
      }
    });
  });

  describe('Cache Monitoring and Metrics', () => {
    test('should provide cache hit/miss metrics in response', async () => {
      const narrativeContent = 'Metrics test narrative';
      
      // First generation - cache miss
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result1.cached).toBe(false);
      expect(result1.processing_time_ms).toBeGreaterThan(0);
      
      // Second generation - cache hit
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result2.cached).toBe(true);
      expect(result2.processing_time_ms).toBeLessThan(result1.processing_time_ms);
    });

    test('should maintain correlation IDs for cache operations', async () => {
      const narrativeContent = 'Correlation ID test narrative';
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result1.correlation_id).toBeDefined();
      expect(result1.correlation_id).toMatch(/^clarify_\d+_[a-z0-9]+$/);
      
      // Second generation - different correlation ID but cached
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result2.correlation_id).toBeDefined();
      expect(result2.correlation_id).not.toBe(result1.correlation_id);
      expect(result2.cached).toBe(true);
    });
  });
});