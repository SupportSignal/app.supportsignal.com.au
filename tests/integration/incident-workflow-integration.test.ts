// @ts-nocheck
import { convexTest } from 'convex-test';
import { expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import schema from '@convex/schema';

/**
 * End-to-End Incident Capture Workflow Integration Tests
 * 
 * These tests simulate the complete user journey through the incident capture workflow:
 * 1. Frontend component state transitions
 * 2. Backend Convex function calls
 * 3. Database state changes
 * 4. Error handling and recovery
 * 5. Real-world scenarios including the "No active prompt template found" error
 */
describe('Incident Workflow Integration', () => {
  let t: any;
  let userId: Id<'users'>;
  let sessionToken: string;
  let incidentId: Id<'incidents'>;

  // Test data representing what would come from the frontend
  const testIncidentData = {
    participant_name: 'Integration Test Participant',
    reporter_name: 'Integration Test Reporter',
    event_date_time: '2024-01-15T10:30:00Z',
    location: 'Integration Test Location - Main Hall',
    severity: 'medium' as const,
  };

  const testNarrativeData = {
    before_event: 'Comprehensive before event narrative describing the circumstances leading up to the incident. This includes environmental factors, participant mood, and any triggers that may have been present.',
    during_event: 'Detailed during event narrative explaining exactly what happened during the incident. This covers actions taken, responses observed, and the sequence of events as they unfolded.',
    end_event: 'Thorough end event narrative describing how the incident was resolved and what factors contributed to bringing it to a close. This includes interventions that worked and participant responses.',
    post_event: 'Complete post event narrative covering the immediate aftermath, support provided, and any follow-up actions taken. This includes monitoring of participant wellbeing and plan adjustments.',
  };

  beforeEach(async () => {
    t = convexTest(schema);
    
    // Set up user and session (simulating authenticated user)
    userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'integration.test@example.com',
        name: 'Integration Test User',
        role: 'frontline_worker',
        company_id: 'integration-test-company' as Id<'companies'>,
        profile_image_url: null,
        _creationTime: Date.now(),
      });
    });

    sessionToken = await t.run(async (ctx: any) => {
      const sessionId = await ctx.db.insert('sessions', {
        user_id: userId,
        session_token: `integration-session-${Date.now()}-${Math.random()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        created_at: Date.now(),
      });
      
      const session = await ctx.db.get(sessionId);
      return session?.session_token || '';
    });
  });

  afterEach(async () => {
    if (t) {
      await t.finishAll();
    }
  });

  describe('Complete Workflow: Success Path', () => {
    test('should complete entire workflow from start to finish', async () => {
      // Step 1: Create incident (what happens when "Next" is clicked in Step 1)
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });

      expect(incidentId).toBeDefined();
      
      // Verify incident creation
      let incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident).toMatchObject({
        participant_name: testIncidentData.participant_name,
        reporter_name: testIncidentData.reporter_name,
        capture_status: 'draft',
        reported_by: userId,
      });

      // Step 2: Add narrative content (what happens during narrative collection)
      const narrativeId = await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        ...testNarrativeData,
      });
      
      expect(narrativeId).toBeDefined();
      
      // Verify narrative was added and status progressed
      incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.narrative).toMatchObject(testNarrativeData);
      expect(incident.capture_status).toBe('in_progress');

      // Steps 3-6: Process clarification questions for each phase
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      
      // First, seed the AI prompt template (critical for avoiding the error)
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

Generate 2-4 specific clarification questions for the "{{phase}}" phase.

Return response as JSON:
{
  "questions": [
    {
      "question_id": "{{phase}}_q1",
      "question_text": "Question text here?",
      "question_order": 1
    }
  ]
}`,
          description: 'Generate phase-specific clarification questions',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          temperature: 0.3,
          is_active: true,
          created_at: Date.now(),
        });
      });
      
      // Process each clarification phase
      const allQuestionsAndAnswers: Array<{
        phase: string;
        questions: any[];
        answers: any[];
      }> = [];
      
      for (const phase of phases) {
        // Generate questions (what happens when user navigates to clarification step)
        const generationResult = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: testNarrativeData[phase],
        });
        
        expect(generationResult.success).toBe(true);
        expect(generationResult.questions.length).toBeGreaterThan(0);
        expect(generationResult.cached).toBe(false); // First generation
        
        // Retrieve questions (what happens when ClarificationStep component loads)
        const questions = await t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
        });
        
        expect(questions.length).toBe(generationResult.questions.length);
        expect(questions[0].phase).toBe(phase);
        
        // Simulate user answering some questions
        const answers = [];
        for (let i = 0; i < Math.min(2, questions.length); i++) {
          const question = questions[i];
          const answerText = `Integration test answer for ${phase} question ${i + 1}: This is a detailed response providing specific information about the ${phase} phase of the incident.`;
          
          const answerResult = await t.mutation(api.aiClarification.submitClarificationAnswer, {
            sessionToken,
            incident_id: incidentId,
            question_id: question.question_id,
            answer_text: answerText,
            phase,
          });
          
          expect(answerResult.success).toBe(true);
          answers.push({
            question_id: question.question_id,
            answer_text: answerText,
          });
        }
        
        allQuestionsAndAnswers.push({
          phase,
          questions,
          answers,
        });
      }
      
      // Verify all phases have questions and some answers
      expect(allQuestionsAndAnswers.length).toBe(4);
      allQuestionsAndAnswers.forEach(phaseData => {
        expect(phaseData.questions.length).toBeGreaterThan(0);
        expect(phaseData.answers.length).toBeGreaterThan(0);
      });
      
      // Final verification: Check complete workflow state
      const finalIncident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(finalIncident).toMatchObject({
        participant_name: testIncidentData.participant_name,
        capture_status: 'in_progress', // Would be 'completed' after review step
      });
      
      expect(finalIncident.narrative).toBeTruthy();
      expect(finalIncident.narrative.before_event).toBe(testNarrativeData.before_event);
      
      // Verify we can retrieve all clarification data
      const allQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
      });
      
      expect(allQuestions.length).toBeGreaterThanOrEqual(4); // At least one per phase
      
      // Verify some questions are answered
      const answeredQuestions = allQuestions.filter(q => q.answered);
      expect(answeredQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('Error Scenario: Missing AI Prompt Template', () => {
    test('should reproduce the "No active prompt template found" error', async () => {
      // Step 1: Create incident successfully
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      // Step 2: Add narrative successfully
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        ...testNarrativeData,
      });
      
      // Step 3: Try to generate clarification questions WITHOUT AI prompt template
      // This simulates the exact error scenario you're experiencing
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase: 'before_event',
          narrative_content: testNarrativeData.before_event,
        })
      ).rejects.toThrow('No active prompt template found for clarification questions');
      
      // Verify the incident and narrative are still intact (workflow should be recoverable)
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident).toBeTruthy();
      expect(incident.narrative).toBeTruthy();
      expect(incident.capture_status).toBe('in_progress');
    });

    test('should handle recovery from missing prompt template', async () => {
      // Create incident and narrative
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        ...testNarrativeData,
      });
      
      // First attempt fails (no prompt template)
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase: 'before_event',
          narrative_content: testNarrativeData.before_event,
        })
      ).rejects.toThrow('No active prompt template found for clarification questions');
      
      // Seed the prompt template (simulating system administrator fixing the issue)
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: `Recovery test template for {{phase}}`,
          description: 'Recovery test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });
      
      // Second attempt succeeds
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: testNarrativeData.before_event,
      });
      
      expect(result.success).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);
    });
  });

  describe('Frontend-Backend Integration Scenarios', () => {
    test('should handle rapid step transitions gracefully', async () => {
      // Simulate user quickly clicking through steps
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      // Simulate quick narrative updates (auto-save scenario)
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Initial before event...',
        during_event: '',
        end_event: '',
        post_event: '',
      });
      
      // Update with more content
      await t.mutation(api.incidents.updateIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Updated before event with more detail...',
        during_event: 'Now adding during event content...',
        end_event: '',
        post_event: '',
      });
      
      // Final update
      await t.mutation(api.incidents.updateIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        ...testNarrativeData,
      });
      
      // Verify final state is correct
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.narrative).toMatchObject(testNarrativeData);
    });

    test('should handle concurrent question generation requests', async () => {
      // Set up incident and narrative
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        ...testNarrativeData,
      });
      
      // Seed prompt template
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Concurrent test template for {{phase}}',
          description: 'Test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });
      
      // Simulate user rapidly navigating between clarification steps
      const phases = ['before_event', 'during_event'] as const;
      
      const results = await Promise.all(
        phases.map(phase =>
          t.action(api.aiClarification.generateClarificationQuestions, {
            sessionToken,
            incident_id: incidentId,
            phase,
            narrative_content: testNarrativeData[phase],
          })
        )
      );
      
      // Both should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.questions.length).toBeGreaterThan(0);
        result.questions.forEach(q => {
          expect(q.question_id).toMatch(new RegExp(`^${phases[index]}_q\\d+$`));
        });
      });
    });

    test('should handle session expiration gracefully', async () => {
      // Create incident with valid session
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      // Simulate expired session
      const expiredToken = 'expired-session-token';
      
      await expect(
        t.query(api.incidents.getDraftIncident, {
          sessionToken: expiredToken,
          incidentId,
        })
      ).rejects.toThrow('Authentication required');
      
      // Valid session should still work
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident).toBeTruthy();
    });
  });

  describe('Data Integrity and Consistency', () => {
    test('should maintain data consistency across workflow steps', async () => {
      // Create incident
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      const originalIncident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      // Add narrative
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        ...testNarrativeData,
      });
      
      // Verify incident metadata unchanged, but narrative added
      const updatedIncident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(updatedIncident.participant_name).toBe(originalIncident.participant_name);
      expect(updatedIncident.reporter_name).toBe(originalIncident.reporter_name);
      expect(updatedIncident.location).toBe(originalIncident.location);
      expect(updatedIncident.narrative).toBeTruthy();
      expect(updatedIncident._creationTime).toBe(originalIncident._creationTime);
    });

    test('should handle narrative updates without data loss', async () => {
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      // Initial narrative
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Initial before event',
        during_event: 'Initial during event',
        end_event: '',
        post_event: '',
      });
      
      // Partial update
      await t.mutation(api.incidents.updateIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        before_event: 'Updated before event',
        during_event: 'Initial during event', // Unchanged
        end_event: 'New end event',
        post_event: '',
      });
      
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.narrative.before_event).toBe('Updated before event');
      expect(incident.narrative.during_event).toBe('Initial during event');
      expect(incident.narrative.end_event).toBe('New end event');
      expect(incident.narrative.post_event).toBe('');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large narrative content efficiently', async () => {
      const largeNarrativeContent = {
        before_event: 'Large before event narrative: ' + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50),
        during_event: 'Large during event narrative: ' + 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(50),
        end_event: 'Large end event narrative: ' + 'Ut enim ad minim veniam, quis nostrud exercitation. '.repeat(50),
        post_event: 'Large post event narrative: ' + 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum. '.repeat(50),
      };
      
      incidentId = await t.mutation(api.incidents.createIncident, {
        sessionToken,
        ...testIncidentData,
        capture_status: 'draft',
      });
      
      const startTime = Date.now();
      
      await t.mutation(api.incidents.createIncidentNarrative, {
        sessionToken,
        incident_id: incidentId,
        ...largeNarrativeContent,
      });
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(5000); // 5 seconds
      
      // Verify data integrity
      const incident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });
      
      expect(incident.narrative.before_event).toContain('Large before event narrative:');
      expect(incident.narrative.before_event.length).toBeGreaterThan(2000);
    });
  });
});
