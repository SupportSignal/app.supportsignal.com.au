// @ts-nocheck
import { convexTest } from 'convex-test';
import { expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import schema from '@convex/schema';

/**
 * Steps 3-6 Clarification Workflow Integration Tests
 * 
 * Tests the complete AI-powered clarification workflow covering:
 * - Step 3: Before Event Clarification
 * - Step 4: During Event Clarification  
 * - Step 5: End Event Clarification
 * - Step 6: Post Event Clarification
 * 
 * Validates end-to-end functionality including:
 * - Question generation for each phase
 * - Answer submission and validation
 * - Caching behavior across phases
 * - Error handling and recovery
 * - Performance considerations
 */
describe('Steps 3-6 Clarification Workflow Integration', () => {
  let t: any;
  let userId: Id<'users'>;
  let sessionToken: string;
  let incidentId: Id<'incidents'>;

  // Test narrative data representing realistic incident content
  const testNarrativeData = {
    before_event: `
      Before the incident, the participant had been engaging well in the morning activities. 
      They had successfully completed their personal care routine with minimal support and 
      enjoyed breakfast in the dining area with their peers. Staff noted that the participant 
      seemed in good spirits and was communicating clearly with both staff and other participants.
      The participant had expressed excitement about the planned craft activity scheduled for later 
      in the morning. There were no observable signs of distress, confusion, or agitation at this time.
    `.trim(),
    
    during_event: `
      During the incident, the participant became visibly agitated when asked to transition from 
      the common area to the craft room. They began raising their voice and refusing to move, 
      stating they didn't want to participate anymore. When staff attempted to provide gentle 
      encouragement, the participant pushed away from the staff member and knocked over a chair. 
      They then sat on the floor and began crying, expressing that they felt overwhelmed and 
      wanted to go home. Other participants in the area became concerned and some moved away from 
      the disturbance. Staff immediately implemented de-escalation techniques.
    `.trim(),
    
    end_event: `
      The incident concluded when the participant was able to regulate their emotions with support 
      from staff. A familiar staff member sat nearby and spoke in calm, reassuring tones while 
      offering the participant their favorite comfort item - a small stuffed animal. After approximately 
      10 minutes, the participant's crying subsided and they were able to communicate their feelings 
      more clearly. They accepted a drink of water and agreed to move to a quieter area. The participant 
      apologized for their behavior and expressed feeling better. The craft activity was modified to 
      be a one-on-one session in a calmer environment.
    `.trim(),
    
    post_event: `
      Following the incident, the participant remained in the quieter area for 30 minutes with 1:1 
      support from staff. They successfully engaged in a modified craft activity and seemed to regain 
      their composure completely. The participant was able to rejoin the group for lunch without any 
      further issues. Staff documented the incident and identified that the participant may have been 
      overstimulated by the busy common area. A plan was put in place to provide more transition 
      warnings and consider the participant's sensory needs during future activities. The participant's 
      family was notified of the incident as per policy.
    `.trim(),
  };

  beforeEach(async () => {
    t = convexTest(schema);
    
    // Create test user
    userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'workflow.test@test.com',
        name: 'Workflow Test User',
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
        session_token: `workflow-session-${Date.now()}-${Math.random()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        created_at: Date.now(),
      });
      
      const session = await ctx.db.get(sessionId);
      return session?.session_token || '';
    });

    // Create test incident
    incidentId = await t.mutation(api.incidents.createIncident, {
      sessionToken,
      participant_name: 'Workflow Test Participant',
      reporter_name: 'Workflow Test Reporter',
      event_date_time: new Date().toISOString(),
      location: 'Integration Test Location',
      severity: 'medium' as const,
      capture_status: 'draft' as const,
    });

    // Add narrative content
    await t.mutation(api.incidents.createIncidentNarrative, {
      sessionToken,
      incident_id: incidentId,
      ...testNarrativeData,
    });

    // Seed AI prompt template
    await t.run(async (ctx: any) => {
      await ctx.db.insert('ai_prompts', {
        prompt_name: 'generate_clarification_questions',
        prompt_version: 'v1.0.0',
        prompt_template: `You are analyzing an incident narrative to generate clarification questions.

Context:
- Phase: {{phase}}
- Narrative: {{narrative_content}}

Generate 3-4 specific clarification questions for this phase that would help gather additional important details.

Return response as JSON:
{
  "questions": [
    {
      "question_id": "{{phase}}_q1",
      "question_text": "Specific question about the {{phase}} phase?",
      "question_order": 1
    }
  ]
}`,
        description: 'Integration test prompt template',
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

  describe('Complete Workflow Execution', () => {
    test('should execute all 4 clarification steps successfully', async () => {
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      const phaseResults: Record<string, any> = {};

      // Step 3-6: Execute clarification for each phase
      for (const phase of phases) {
        console.log(`Testing phase: ${phase}`);
        
        // Generate questions for this phase
        const generationResult = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: testNarrativeData[phase],
        });

        expect(generationResult.success).toBe(true);
        expect(generationResult.questions.length).toBeGreaterThan(0);
        expect(generationResult.cached).toBe(false); // First generation

        // Retrieve questions to verify storage
        const questions = await t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
        });

        expect(questions.length).toBe(generationResult.questions.length);
        expect(questions[0].phase).toBe(phase);

        // Answer some questions for this phase
        const answers = [];
        for (let i = 0; i < Math.min(2, questions.length); i++) {
          const question = questions[i];
          const answerText = `Integration test answer for ${phase} question ${i + 1}: This provides specific details about the ${phase} phase of the incident based on the narrative content.`;

          const answerResult = await t.mutation(api.aiClarification.submitClarificationAnswer, {
            sessionToken,
            incident_id: incidentId,
            question_id: question.question_id,
            answer_text: answerText,
            phase,
          });

          expect(answerResult.success).toBe(true);
          expect(answerResult.metrics.character_count).toBe(answerText.length);
          expect(answerResult.metrics.is_complete).toBe(true);

          answers.push({
            question_id: question.question_id,
            answer_text: answerText,
          });
        }

        phaseResults[phase] = {
          questions,
          answers,
          generationResult,
        };
      }

      // Verify all phases were processed
      expect(Object.keys(phaseResults)).toEqual(['before_event', 'during_event', 'end_event', 'post_event']);

      // Verify cross-phase data integrity
      for (const phase of phases) {
        const result = phaseResults[phase];
        expect(result.questions.length).toBeGreaterThan(0);
        expect(result.answers.length).toBeGreaterThan(0);
      }

      // Verify we can retrieve all questions across phases
      const allQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
      });

      expect(allQuestions.length).toBeGreaterThanOrEqual(phases.length); // At least one per phase
      
      // Verify all phases are represented
      const phasesInQuestions = [...new Set(allQuestions.map(q => q.phase))];
      expect(phasesInQuestions.sort()).toEqual(phases.sort());
    });

    test('should handle partial workflow completion gracefully', async () => {
      // Complete only first two phases
      const completedPhases = ['before_event', 'during_event'] as const;
      
      for (const phase of completedPhases) {
        await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: testNarrativeData[phase],
        });
      }

      // Verify partial completion
      const allQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
      });

      const phasesWithQuestions = [...new Set(allQuestions.map(q => q.phase))];
      expect(phasesWithQuestions.sort()).toEqual(completedPhases.sort());

      // Should be able to continue with remaining phases
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'end_event',
        narrative_content: testNarrativeData.end_event,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Question Generation Quality', () => {
    test('should generate phase-appropriate questions', async () => {
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      
      for (const phase of phases) {
        const result = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: testNarrativeData[phase],
        });

        expect(result.success).toBe(true);
        
        // All questions should have correct phase prefix
        result.questions.forEach((question: any) => {
          expect(question.question_id).toMatch(new RegExp(`^${phase}_q\\d+$`));
          expect(question.question_order).toBeGreaterThan(0);
          expect(question.question_text.length).toBeGreaterThan(10);
        });
      }
    });

    test('should generate different questions for different phases', async () => {
      const beforeResult = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: testNarrativeData.before_event,
      });

      const duringResult = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'during_event',
        narrative_content: testNarrativeData.during_event,
      });

      expect(beforeResult.success).toBe(true);
      expect(duringResult.success).toBe(true);

      // Questions should be different between phases
      const beforeQuestionTexts = beforeResult.questions.map((q: any) => q.question_text);
      const duringQuestionTexts = duringResult.questions.map((q: any) => q.question_text);

      expect(beforeQuestionTexts).not.toEqual(duringQuestionTexts);
    });
  });

  describe('Answer Management', () => {
    test('should handle comprehensive answer submission across phases', async () => {
      // Generate questions for all phases
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      const questionsByPhase: Record<string, any[]> = {};

      for (const phase of phases) {
        const result = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: testNarrativeData[phase],
        });

        const questions = await t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
        });

        questionsByPhase[phase] = questions;
      }

      // Submit answers for each phase with different answer qualities
      const answerPatterns = [
        'Very detailed answer with extensive information about the specific circumstances and context.',
        'Medium length answer providing adequate detail.',
        'Short answer.',
        '', // Empty answer
      ];

      let answerIndex = 0;
      for (const phase of phases) {
        const questions = questionsByPhase[phase];
        
        for (const question of questions.slice(0, 2)) { // Answer first 2 questions per phase
          const answerText = answerPatterns[answerIndex % answerPatterns.length];
          
          const result = await t.mutation(api.aiClarification.submitClarificationAnswer, {
            sessionToken,
            incident_id: incidentId,
            question_id: question.question_id,
            answer_text: answerText,
            phase,
          });

          expect(result.success).toBe(true);
          expect(result.metrics.character_count).toBe(answerText.length);
          expect(result.metrics.is_complete).toBe(answerText.length > 10);

          answerIndex++;
        }
      }

      // Verify all answers were stored correctly
      const allQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
      });

      const answeredQuestions = allQuestions.filter(q => q.answered || q.answer_text.length > 0);
      expect(answeredQuestions.length).toBe(8); // 2 questions per phase, 4 phases
    });

    test('should handle answer updates correctly', async () => {
      // Generate questions
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: testNarrativeData.before_event,
      });

      const questions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
      });

      const questionId = questions[0].question_id;

      // Submit initial answer
      const initialAnswer = 'Initial answer text';
      await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: questionId,
        answer_text: initialAnswer,
        phase: 'before_event',
      });

      // Update answer
      const updatedAnswer = 'Updated answer with more detailed information';
      const updateResult = await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: questionId,
        answer_text: updatedAnswer,
        phase: 'before_event',
      });

      expect(updateResult.success).toBe(true);

      // Verify answer was updated
      const updatedQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
      });

      const updatedQuestion = updatedQuestions.find(q => q.question_id === questionId);
      expect(updatedQuestion.answer_text).toBe(updatedAnswer);
      expect(updatedQuestion.answered).toBe(true);
    });
  });

  describe('Caching Behavior Across Workflow', () => {
    test('should cache questions appropriately across workflow execution', async () => {
      const narrativeContent = testNarrativeData.before_event;

      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });

      expect(result1.cached).toBe(false);

      // Second generation with same content - should be cached
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });

      expect(result2.cached).toBe(true);
      expect(result2.questions.length).toBe(result1.questions.length);

      // Different phase should not be cached
      const result3 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'during_event',
        narrative_content: narrativeContent,
      });

      expect(result3.cached).toBe(false);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle missing prompt template gracefully', async () => {
      // Remove prompt template
      await t.run(async (ctx: any) => {
        const prompts = await ctx.db.query('ai_prompts').collect();
        for (const prompt of prompts) {
          await ctx.db.delete(prompt._id);
        }
      });

      // Should fail with specific error
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase: 'before_event',
          narrative_content: testNarrativeData.before_event,
        })
      ).rejects.toThrow('No active prompt template found for clarification questions');
    });

    test('should handle workflow recovery after error', async () => {
      // Start workflow successfully
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: testNarrativeData.before_event,
      });

      expect(result1.success).toBe(true);

      // Temporarily break the system (remove prompts)
      const promptsToRestore = await t.run(async (ctx: any) => {
        const prompts = await ctx.db.query('ai_prompts').collect();
        for (const prompt of prompts) {
          await ctx.db.delete(prompt._id);
        }
        return prompts;
      });

      // Should fail for second phase
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase: 'during_event',
          narrative_content: testNarrativeData.during_event,
        })
      ).rejects.toThrow();

      // Restore system
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.1.0',
          prompt_template: 'Restored template for {{phase}} with {{narrative_content}}',
          description: 'Restored prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });

      // Should now work for second phase
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'during_event',
        narrative_content: testNarrativeData.during_event,
      });

      expect(result2.success).toBe(true);

      // First phase data should still be intact
      const beforeQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
      });

      expect(beforeQuestions.length).toBeGreaterThan(0);
    });

    test('should handle invalid incident ID gracefully', async () => {
      const invalidIncidentId = 'invalid-incident-id' as Id<'incidents'>;

      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: invalidIncidentId,
          phase: 'before_event',
          narrative_content: testNarrativeData.before_event,
        })
      ).rejects.toThrow('Incident not found');
    });

    test('should handle authentication errors', async () => {
      const invalidToken = 'invalid-session-token';

      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken: invalidToken,
          incident_id: incidentId,
          phase: 'before_event',
          narrative_content: testNarrativeData.before_event,
        })
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle workflow completion within reasonable time', async () => {
      const startTime = Date.now();
      
      // Execute complete workflow
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      
      for (const phase of phases) {
        await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: testNarrativeData[phase],
        });
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should complete workflow in reasonable time (adjust threshold as needed)
      expect(totalTime).toBeLessThan(30000); // 30 seconds for complete workflow
    });

    test('should handle large narrative content efficiently', async () => {
      const largeNarrative = testNarrativeData.before_event + ' ' + 'Additional content. '.repeat(200);
      
      const startTime = Date.now();
      
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: largeNarrative,
      });
      
      const processingTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(15000); // 15 seconds for large content
    });
  });

  describe('Data Integrity and Consistency', () => {
    test('should maintain data consistency throughout workflow', async () => {
      // Execute complete workflow
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      const originalIncident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });

      for (const phase of phases) {
        await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: testNarrativeData[phase],
        });
      }

      // Verify incident metadata is unchanged
      const finalIncident = await t.query(api.incidents.getDraftIncident, {
        sessionToken,
        incidentId,
      });

      expect(finalIncident.participant_name).toBe(originalIncident.participant_name);
      expect(finalIncident.reporter_name).toBe(originalIncident.reporter_name);
      expect(finalIncident.location).toBe(originalIncident.location);
      expect(finalIncident._creationTime).toBe(originalIncident._creationTime);

      // Verify all clarification data is properly linked
      const allQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
      });

      allQuestions.forEach(question => {
        expect(question.incident_id).toBe(incidentId);
        expect(question.is_active).toBe(true);
        expect(phases).toContain(question.phase as any);
      });
    });

    test('should maintain question ordering within phases', async () => {
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: testNarrativeData.before_event,
      });

      const questions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
      });

      // Questions should be ordered correctly
      for (let i = 0; i < questions.length - 1; i++) {
        expect(questions[i].question_order).toBeLessThan(questions[i + 1].question_order);
      }

      // Question orders should start from 1
      expect(questions[0].question_order).toBe(1);
    });
  });
});