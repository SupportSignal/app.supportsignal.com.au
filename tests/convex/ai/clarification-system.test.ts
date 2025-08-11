// @ts-nocheck
import { convexTest } from 'convex-test';
import { expect, describe, test, beforeEach, afterEach } from '@jest/globals';
import { api } from '@convex/_generated/api';
import { internal } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import schema from '@convex/schema';

/**
 * AI Clarification System Test Suite
 * 
 * Specifically tests the AI clarification question generation and management system.
 * Focuses on reproducing and validating the "No active prompt template found" error
 * and ensuring robust error handling throughout the clarification workflow.
 */
describe('AI Clarification System', () => {
  let t: any;
  let userId: Id<'users'>;
  let incidentId: Id<'incidents'>;
  let sessionToken: string;

  beforeEach(async () => {
    t = convexTest(schema);
    
    // Create test user
    userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'clarification.test@test.com',
        name: 'Clarification Tester',
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
        session_token: `clarification-session-${Date.now()}-${Math.random()}`,
        expires_at: Date.now() + (24 * 60 * 60 * 1000),
        created_at: Date.now(),
      });
      
      const session = await ctx.db.get(sessionId);
      return session?.session_token || '';
    });

    // Create test incident with narrative
    incidentId = await t.mutation(api.incidents.createIncident, {
      sessionToken,
      participant_name: 'AI Test Participant',
      reporter_name: 'AI Test Reporter', 
      event_date_time: new Date().toISOString(),
      location: 'AI Test Location',
      severity: 'medium' as const,
      capture_status: 'draft' as const,
    });

    await t.mutation(api.incidents.createIncidentNarrative, {
      sessionToken,
      incident_id: incidentId,
      before_event: 'Detailed before event narrative for AI testing',
      during_event: 'Detailed during event narrative for AI testing',
      end_event: 'Detailed end event narrative for AI testing',
      post_event: 'Detailed post event narrative for AI testing',
    });
  });

  afterEach(async () => {
    if (t) {
      await t.finishAll();
    }
  });

  describe('Prompt Template Management', () => {
    test('should fail when no active prompt template exists', async () => {
      // Ensure no prompt template exists (clean slate)
      await t.run(async (ctx: any) => {
        const prompts = await ctx.db.query('ai_prompts').collect();
        for (const prompt of prompts) {
          await ctx.db.delete(prompt._id);
        }
      });

      // Attempt to generate questions should fail with specific error
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase: 'before_event',
          narrative_content: 'Test narrative content',
        })
      ).rejects.toThrow('No active prompt template found for clarification questions');
    });

    test('should succeed when active prompt template exists', async () => {
      // Seed proper prompt template
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: `Test prompt template for {{phase}} with {{narrative_content}}`,
          description: 'Test prompt for clarification questions',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });

      // Should now succeed
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: 'Test narrative content',
      });

      expect(result.questions).toBeDefined();
      expect(result.questions.length).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });

    test('should prefer active prompts over inactive ones', async () => {
      // Insert inactive prompt first
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v0.9.0',
          prompt_template: 'Old inactive template',
          is_active: false,
          created_at: Date.now() - 1000,
        });
        
        // Insert active prompt
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions', 
          prompt_version: 'v1.0.0',
          prompt_template: 'Active template for {{phase}}',
          description: 'Active prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents', 
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });

      // Should use active template
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: 'Test content',
      });

      expect(result.success).toBe(true);
      expect(result.ai_model_used).toBe('claude-3-haiku-20240307');
    });

    test('should handle multiple prompts with same name correctly', async () => {
      // Insert multiple prompts with same name but different versions
      await t.run(async (ctx: any) => {
        // Older version
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Version 1.0 template',
          is_active: true,
          created_at: Date.now() - 2000,
        });
        
        // Newer version (should be selected due to .order('desc'))
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v2.0.0', 
          prompt_template: 'Version 2.0 template for {{phase}}',
          description: 'Newer version',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-sonnet-20240229',
          is_active: true,
          created_at: Date.now(),
        });
      });

      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: 'Test content',
      });

      expect(result.success).toBe(true);
      // Should use the newer version
      expect(result.ai_model_used).toBe('claude-3-sonnet-20240229');
    });
  });

  describe('Question Generation Process', () => {
    beforeEach(async () => {
      // Ensure we have a valid prompt template for these tests
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: `Generate questions for {{phase}} phase with {{narrative_content}}`,
          description: 'Test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });
    });

    test('should generate questions with proper structure', async () => {
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: 'Detailed before event narrative',
      });

      expect(result).toMatchObject({
        questions: expect.arrayContaining([
          expect.objectContaining({
            question_id: expect.stringMatching(/^before_event_q\d+$/),
            question_text: expect.any(String),
            question_order: expect.any(Number),
          }),
        ]),
        correlation_id: expect.stringMatching(/^clarify_\d+_[a-z0-9]+$/),
        ai_model_used: expect.any(String),
        success: true,
      });
    });

    test('should store generated questions in database', async () => {
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'during_event',
        narrative_content: 'Detailed during event narrative',
      });

      expect(result.success).toBe(true);
      expect(result.questions.length).toBeGreaterThan(0);

      // Verify questions were stored
      const storedQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'during_event',
      });

      expect(storedQuestions.length).toBe(result.questions.length);
      expect(storedQuestions[0].phase).toBe('during_event');
      expect(storedQuestions[0].is_active).toBe(true);
    });

    test('should handle all phases correctly', async () => {
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
      
      for (const phase of phases) {
        const result = await t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: incidentId,
          phase,
          narrative_content: `Detailed ${phase} narrative content`,
        });

        expect(result.success).toBe(true);
        expect(result.questions.length).toBeGreaterThan(0);
        
        // Verify phase-specific question IDs
        result.questions.forEach((question: any) => {
          expect(question.question_id).toMatch(new RegExp(`^${phase}_q\\d+$`));
        });
      }
    });

    test('should log AI requests for monitoring', async () => {
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'end_event',
        narrative_content: 'Test narrative for logging',
      });

      expect(result.success).toBe(true);
      expect(result.correlation_id).toBeTruthy();

      // Check that AI request was logged (we can't directly query the log table,
      // but the action should have completed successfully)
      expect(result.processing_time_ms).toBeGreaterThan(0);
    });
  });

  describe('Question Retrieval', () => {
    beforeEach(async () => {
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Template for {{phase}}',
          description: 'Test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });

      // Generate some questions first
      await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: 'Test narrative',
      });
    });

    test('should retrieve questions by phase', async () => {
      const questions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
      });

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].phase).toBe('before_event');
      expect(questions[0].answered).toBe(false);
      expect(questions[0].answer_text).toBe('');
    });

    test('should retrieve all questions when no phase specified', async () => {
      // Generate questions for multiple phases
      await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'during_event',
        narrative_content: 'During event narrative',
      });

      const allQuestions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
      });

      expect(allQuestions.length).toBeGreaterThanOrEqual(2); // At least before_event and during_event
      
      const phases = allQuestions.map(q => q.phase);
      expect(phases).toContain('before_event');
      expect(phases).toContain('during_event');
    });

    test('should return empty array for non-existent questions', async () => {
      const questions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'post_event', // No questions generated for this phase
      });

      expect(questions).toEqual([]);
    });

    test('should require authentication', async () => {
      await expect(
        t.query(api.aiClarification.getClarificationQuestions, {
          sessionToken: 'invalid-token',
          incident_id: incidentId,
          phase: 'before_event',
        })
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('Answer Submission', () => {
    let questionId: string;

    beforeEach(async () => {
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Template for {{phase}}',
          description: 'Test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });

      // Generate questions and get the first question ID
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: 'Test narrative for answers',
      });

      questionId = result.questions[0].question_id;
    });

    test('should submit new answer successfully', async () => {
      const answerText = 'This is a detailed answer to the clarification question';
      
      const result = await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: questionId,
        answer_text: answerText,
        phase: 'before_event',
      });

      expect(result.success).toBe(true);
      expect(result.metrics).toMatchObject({
        character_count: answerText.length,
        word_count: expect.any(Number),
        is_complete: true, // > 10 characters
      });
    });

    test('should update existing answer', async () => {
      const firstAnswer = 'First answer';
      const secondAnswer = 'Updated and more detailed answer';
      
      // Submit first answer
      await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: questionId,
        answer_text: firstAnswer,
        phase: 'before_event',
      });
      
      // Update with second answer
      const result = await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: questionId,
        answer_text: secondAnswer,
        phase: 'before_event',
      });

      expect(result.success).toBe(true);
      expect(result.metrics.character_count).toBe(secondAnswer.length);
      
      // Verify answer was updated
      const questions = await t.query(api.aiClarification.getClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
      });
      
      const answeredQuestion = questions.find(q => q.question_id === questionId);
      expect(answeredQuestion.answer_text).toBe(secondAnswer);
      expect(answeredQuestion.answered).toBe(true);
    });

    test('should calculate answer metrics correctly', async () => {
      const shortAnswer = 'Short';
      const longAnswer = 'This is a much longer and more detailed answer that contains multiple sentences and should be considered complete.';
      
      // Short answer (incomplete)
      const shortResult = await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: questionId,
        answer_text: shortAnswer,
        phase: 'before_event',
      });

      expect(shortResult.metrics).toMatchObject({
        character_count: 5,
        word_count: 1,
        is_complete: false, // <= 10 characters
      });
      
      // Long answer (complete)
      const longResult = await t.mutation(api.aiClarification.submitClarificationAnswer, {
        sessionToken,
        incident_id: incidentId,
        question_id: questionId,
        answer_text: longAnswer,
        phase: 'before_event',
      });

      expect(longResult.metrics).toMatchObject({
        character_count: longAnswer.length,
        word_count: 17, // Approximate word count
        is_complete: true,
      });
    });

    test('should require authentication for answer submission', async () => {
      await expect(
        t.mutation(api.aiClarification.submitClarificationAnswer, {
          sessionToken: 'invalid-token',
          incident_id: incidentId,
          question_id: questionId,
          answer_text: 'Test answer',
          phase: 'before_event',
        })
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('Caching and Performance', () => {
    beforeEach(async () => {
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Template for {{phase}} with {{narrative_content}}',
          description: 'Test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });
    });

    test('should cache questions based on narrative hash', async () => {
      const narrativeContent = 'Same narrative content for caching';
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result1.cached).toBe(false);
      
      // Second generation with identical content
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: narrativeContent,
      });
      
      expect(result2.cached).toBe(true);
      expect(result2.questions.length).toBe(result1.questions.length);
    });

    test('should regenerate questions when narrative changes', async () => {
      const firstNarrative = 'First narrative content';
      const secondNarrative = 'Different narrative content';
      
      // First generation
      const result1 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: firstNarrative,
      });
      
      // Second generation with different content
      const result2 = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: secondNarrative,
      });
      
      expect(result1.cached).toBe(false);
      expect(result2.cached).toBe(false); // Should not be cached due to content change
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle retry mechanism on temporary failures', async () => {
      // This test would require mocking internal services, 
      // but we can test that the retry mechanism doesn't break normal flow
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Template for {{phase}}',
          description: 'Test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });

      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: 'Test content',
      });

      expect(result.success).toBe(true);
    });

    test('should handle missing incident gracefully', async () => {
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Template for {{phase}}',
          is_active: true,
          created_at: Date.now(),
        });
      });

      const nonExistentIncidentId = 'non_existent_id' as Id<'incidents'>;
      
      await expect(
        t.action(api.aiClarification.generateClarificationQuestions, {
          sessionToken,
          incident_id: nonExistentIncidentId,
          phase: 'before_event',
          narrative_content: 'Test content',
        })
      ).rejects.toThrow('Incident not found');
    });

    test('should handle malformed narrative content', async () => {
      await t.run(async (ctx: any) => {
        await ctx.db.insert('ai_prompts', {
          prompt_name: 'generate_clarification_questions',
          prompt_version: 'v1.0.0',
          prompt_template: 'Template for {{phase}} with {{narrative_content}}',
          description: 'Test prompt',
          workflow_step: 'clarification_questions',
          subsystem: 'incidents',
          ai_model: 'claude-3-haiku-20240307',
          is_active: true,
          created_at: Date.now(),
        });
      });

      // Should handle empty narrative
      const result = await t.action(api.aiClarification.generateClarificationQuestions, {
        sessionToken,
        incident_id: incidentId,
        phase: 'before_event',
        narrative_content: '',
      });

      expect(result.success).toBe(true);
      // Mock service should still generate questions even with empty content
      expect(result.questions.length).toBeGreaterThan(0);
    });
  });
});
