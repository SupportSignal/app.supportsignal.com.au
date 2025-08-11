// @ts-nocheck
import { convexTest } from 'convex-test';
import { expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import schema from '@convex/schema';

/**
 * Incident Capture Workflow Test Suite
 * 
 * Comprehensive tests for the complete incident capture workflow covering:
 * - Step 1: Metadata collection and incident creation
 * - Step 2: Narrative collection (4-phase narrative grid)
 * - Step 3-6: AI clarification questions for each phase
 * - Error scenarios and edge cases
 * - Integration between frontend navigation and backend state
 */
describe('Incident Capture Workflow Integration', () => {
  let t: any;
  let userId: Id<'users'>;
  let incidentId: Id<'incidents'>;
  let sessionToken: string;

  beforeEach(async () => {
    t = convexTest(schema);
    
    // Create test user for workflow
    userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'workflow.tester@test.com',
        name: 'Workflow Tester',
        role: 'frontline_worker',
        company_id: 'test-company-id' as Id<'companies'>,
        profile_image_url: null,
        _creationTime: Date.now(),
      });
    });

    // Create session for user
    sessionToken = await t.run(async (ctx: any) => {
      const sessionId = await ctx.db.insert('sessions', {
        user_id: userId,
        session_token: `test-session-${Date.now()}-${Math.random()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        created_at: Date.now(),
      });
      
      const session = await ctx.db.get(sessionId);
      return session?.session_token || '';
    });

    // Seed AI prompt template to avoid "No active prompt template found" error
    await t.run(async (ctx: any) => {
      await ctx.db.insert('ai_prompts', {
        prompt_name: 'generate_clarification_questions',
        prompt_version: 'v1.0.0',
        prompt_template: `You are analyzing an incident narrative to generate clarification questions.

Context:
- Participant: {{participant_name}}
- Reporter: {{reporter_name}}
- Location: {{location}}
- Event Date: {{event_date_time}}

Current Phase: {{phase}}
Narrative Content: {{narrative_content}}

Generate 2-4 specific, open-ended clarification questions for the "{{phase}}" phase.

Return response as JSON:
{
  "questions": [
    {
      "question_id": "{{phase}}_q1",
      "question_text": "Specific question here?",
      "question_order": 1
    }
  ]
}`,
        description: 'Generate phase-specific clarification questions for incident narratives',
        workflow_step: 'clarification_questions',
        subsystem: 'incidents',
        ai_model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.3,
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

  describe('Step 1: Incident Metadata Creation', () => {
    test('should create incident with metadata successfully', async () => {
      const incidentData = {
        sessionToken,
        participant_name: 'Test Participant',
        reporter_name: 'Test Reporter',
        event_date_time: new Date().toISOString(),
        location: 'Test Location - Room A',
        severity: 'medium' as const,
        capture_status: 'draft' as const,
      };

      incidentId = await t.mutation(api.incidents.createIncident, incidentData);
      
      expect(incidentId).toBeDefined();
      
      // Verify incident was created with correct metadata
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident).toMatchObject({
        participant_name: 'Test Participant',
        reporter_name: 'Test Reporter',
        location: 'Test Location - Room A',
        severity: 'medium',
        capture_status: 'draft',
      });
      expect(incident.reported_by).toBe(userId);
      expect(incident.incident).toBeTruthy(); // Auto-generated incident object
    });

    test('should handle metadata validation errors', async () => {
      const invalidData = {
        sessionToken,
        participant_name: '', // Invalid empty name
        reporter_name: 'Test Reporter',
        event_date_time: 'invalid-date',
        location: 'Test Location',
        severity: 'invalid' as any,
        capture_status: 'draft' as const,
      };

      await expect(
        t.mutation(api.incidents.createIncident, invalidData)
      ).rejects.toThrow();
    });

    test('should auto-generate incident ID and timestamps', async () => {
      const incidentData = {
        sessionToken,
        participant_name: 'Auto Gen Test',
        reporter_name: 'Test Reporter',
        event_date_time: new Date().toISOString(),
        location: 'Test Location',
        severity: 'low' as const,
        capture_status: 'draft' as const,
      };

      const startTime = Date.now();
      incidentId = await t.mutation(api.incidents.createIncident, incidentData);
      const endTime = Date.now();
      
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.incident).toMatch(/^incident_[a-z0-9]+$/); // Auto-generated ID format
      expect(incident._creationTime).toBeGreaterThanOrEqual(startTime);
      expect(incident._creationTime).toBeLessThanOrEqual(endTime);
    });
  });

  describe('Step 2: Narrative Collection', () => {
    beforeEach(async () => {
      // Create incident for narrative tests
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        participant_name: 'Narrative Test Participant',
        reporter_name: 'Narrative Test Reporter',
        event_date_time: new Date().toISOString(),
        location: 'Test Location - Narrative Room',
        severity: 'medium' as const,
        capture_status: 'draft' as const,
      });
    });

    test('should create narrative with all four phases', async () => {
      const narrativeData = {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Before event narrative content',
        during_event: 'During event narrative content', 
        end_event: 'End event narrative content',
        post_event: 'Post event narrative content',
      };

      const narrativeId = await t.mutation(api.incidents.createIncidentNarrative, narrativeData);
      
      expect(narrativeId).toBeDefined();
      
      // Verify narrative phases were stored correctly
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.narrative).toMatchObject({
        before_event: 'Before event narrative content',
        during_event: 'During event narrative content',
        end_event: 'End event narrative content', 
        post_event: 'Post event narrative content',
      });
    });

    test('should handle partial narrative completion', async () => {
      // Start with just before_event
      const partialNarrative = {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Only before event content',
        during_event: '',
        end_event: '',
        post_event: '',
      };

      await t.mutation(api.incidents.createIncidentNarrative, partialNarrative);
      
      let incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.narrative.before_event).toBe('Only before event content');
      expect(incident.narrative.during_event).toBe('');
      
      // Update with more content
      const updateData = {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Only before event content',
        during_event: 'Now during event content',
        end_event: 'Now end event content',
        post_event: '',
      };

      await t.mutation(api.incidents.updateIncidentNarrative, updateData);
      
      incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.narrative.during_event).toBe('Now during event content');
      expect(incident.narrative.end_event).toBe('Now end event content');
      expect(incident.narrative.post_event).toBe('');
    });

    test('should update capture status when narrative is complete', async () => {
      const completeNarrative = {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Complete before event narrative with sufficient detail',
        during_event: 'Complete during event narrative with sufficient detail',
        end_event: 'Complete end event narrative with sufficient detail',
        post_event: 'Complete post event narrative with sufficient detail',
      };

      await t.mutation(api.incidents.createIncidentNarrative, completeNarrative);
      
      // Status should progress from draft to in_progress
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      // Capture status should progress when narrative is substantial
      expect(incident.capture_status).toBe('in_progress');
    });
  });

  describe('Steps 3-6: AI Clarification Questions', () => {
    beforeEach(async () => {
      // Create incident with narrative for clarification tests
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        participant_name: 'Clarification Test Participant',
        reporter_name: 'Clarification Test Reporter',
        event_date_time: new Date().toISOString(),
        location: 'Test Location - Clarification Room',
        severity: 'medium' as const,
        capture_status: 'draft' as const,
      });

      // Add narrative content
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Detailed before event narrative for question generation',
        during_event: 'Detailed during event narrative for question generation',
        end_event: 'Detailed end event narrative for question generation',
        post_event: 'Detailed post event narrative for question generation',
      });
    });

    const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;

    phases.forEach(phase => {
      test(`should generate clarification questions for ${phase} phase`, async () => {
        const result = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: `Detailed ${phase} narrative for question generation`,
        });
        
        expect(result.questions).toBeDefined();
        expect(result.questions.length).toBeGreaterThan(0);
        expect(result.cached).toBe(false); // First generation
        expect(result.correlation_id).toBeTruthy();
        
        // Verify questions have proper structure
        result.questions.forEach((question: any, index: number) => {
          expect(question.question_id).toMatch(new RegExp(`^${phase}_q\\d+$`));
          expect(question.question_text).toBeTruthy();
          expect(question.question_order).toBe(index + 1);
          expect(question.phase).toBe(phase);
        });
      });

      test(`should retrieve generated questions for ${phase} phase`, async () => {
        // First generate questions
        await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: `Detailed ${phase} narrative for question generation`,
        });
        
        // Then retrieve them
        const questions = await t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
        });
        
        expect(questions.length).toBeGreaterThan(0);
        expect(questions[0].phase).toBe(phase);
        expect(questions[0].answered).toBe(false);
        expect(questions[0].answer_text).toBe('');
      });

      test(`should submit and retrieve answers for ${phase} phase`, async () => {
        // Generate questions first
        const generationResult = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: `Detailed ${phase} narrative for question generation`,
        });
        
        const firstQuestion = generationResult.questions[0];
        const answerText = `Test answer for ${phase} question`;
        
        // Submit answer
        const answerResult = await t.mutation(api.aiClarification.submitClarificationAnswer, {
          sessionToken,
          incident_id: incidentId,
          question_id: firstQuestion.question_id,
          answer_text: answerText,
          phase,
        });
        
        expect(answerResult.success).toBe(true);
        expect(answerResult.metrics.character_count).toBe(answerText.length);
        expect(answerResult.metrics.word_count).toBeGreaterThan(0);
        
        // Verify answer was stored
        const questions = await t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
        });
        
        const answeredQuestion = questions.find(q => q.question_id === firstQuestion.question_id);
        expect(answeredQuestion.answered).toBe(true);
        expect(answeredQuestion.answer_text).toBe(answerText);
      });
    });

    test('should cache questions when narrative hash unchanged', async () => {
      const phase = 'before_event';
      const narrativeContent = 'Same narrative content for caching test';
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase,
        narrative_content: narrativeContent,
      });
      
      expect(result1.cached).toBe(false);
      
      // Second generation with same content should be cached
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase,
        narrative_content: narrativeContent,
      });
      
      expect(result2.cached).toBe(true);
      expect(result2.questions.length).toBe(result1.questions.length);
    });
  });

  describe('Error Scenarios', () => {
    test('should handle missing prompt template error gracefully', async () => {
      // Remove the prompt template to simulate the error
      await t.run(async (ctx: any) => {
        const prompts = await ctx.db
          .query('ai_prompts')
          .filter(q => q.eq(q.field('prompt_name'), 'generate_clarification_questions'))
          .collect();
        
        for (const prompt of prompts) {
          await ctx.db.delete(prompt._id);
        }
      });
      
      // Create test incident
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        participant_name: 'Error Test Participant',
        reporter_name: 'Error Test Reporter',
        event_date_time: new Date().toISOString(),
        location: 'Test Location',
        severity: 'medium' as const,
        capture_status: 'draft' as const,
      });
      
      // Try to generate questions - should fail with specific error
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase: 'before_event',
          narrative_content: 'Test narrative content',
        })
      ).rejects.toThrow('No active prompt template found for clarification questions');
    });

    test('should handle invalid session token', async () => {
      const invalidToken = 'invalid-session-token';
      
      await expect(
        t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken: invalidToken,
          incident_id: 'invalid-id' as Id<'incidents'>,
          phase: 'before_event',
        })
      ).rejects.toThrow('Authentication required');
    });

    test('should handle non-existent incident', async () => {
      const nonExistentId = 'non_existent_incident_id' as Id<'incidents'>;
      
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: nonExistentId,
          phase: 'before_event',
          narrative_content: 'Test content',
        })
      ).rejects.toThrow('Incident not found');
    });
  });

  describe('Workflow State Transitions', () => {
    test('should track complete workflow progression', async () => {
      // Step 1: Create incident
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        participant_name: 'Full Workflow Test',
        reporter_name: 'Test Reporter',
        event_date_time: new Date().toISOString(),
        location: 'Test Location',
        severity: 'medium' as const,
        capture_status: 'draft' as const,
      });
      
      let incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      expect(incident.capture_status).toBe('draft');
      
      // Step 2: Add narrative
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Complete before event narrative with substantial detail',
        during_event: 'Complete during event narrative with substantial detail',
        end_event: 'Complete end event narrative with substantial detail',
        post_event: 'Complete post event narrative with substantial detail',
      });
      
      incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      expect(incident.capture_status).toBe('in_progress');
      
      // Steps 3-6: Generate and answer clarification questions for each phase
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      
      for (const phase of phases) {
        // Generate questions
        const result = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: `Complete ${phase} narrative with substantial detail`,
        });
        
        // Answer first question of each phase
        if (result.questions.length > 0) {
          await t.mutation(api.aiClarification.submitClarificationAnswer, {
            sessionToken,
            incident_id: incidentId,
            question_id: result.questions[0].question_id,
            answer_text: `Answer for ${phase} clarification question`,
            phase,
          });
        }
      }
      
      // Verify all phases have questions and some answers
      for (const phase of phases) {
        const questions = await t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
        });
        
        expect(questions.length).toBeGreaterThan(0);
        expect(questions[0].answered).toBe(true);
      }
      
      // Final incident should reflect completion of clarification phase
      incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      // Should have narrative and questions completed
      expect(incident.narrative).toBeTruthy();
      expect(incident.capture_status).toBe('in_progress'); // Would be 'completed' after review
    });
  });
});
