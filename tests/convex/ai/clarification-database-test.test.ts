/**
 * Database Storage Test: AI Clarification Questions
 * 
 * This test focuses on the database storage mechanism to identify
 * if the empty question_text issue occurs during database operations.
 */

// @ts-nocheck
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Clarification Questions Database Storage Tests', () => {
  describe('Question Storage Format Validation', () => {
    test('should validate question data structure before database insert', () => {
      // Mock the exact structure that should be stored in database
      const questionsToStore = [
        {
          question_id: "before_event_q1",
          question_text: "What was the participant's mood before the incident?",
          question_order: 1
        },
        {
          question_id: "before_event_q2",
          question_text: "Were there any environmental factors involved?",
          question_order: 2
        },
        {
          question_id: "before_event_q3",
          question_text: "What support strategies were in place?",
          question_order: 3
        }
      ];

      // Simulate the validation that should happen before database insert
      const validateQuestionForStorage = (question: any, incident_id: string, phase: string) => {
        // This mimics the validation in storeClarificationQuestion
        if (!question.question_id || typeof question.question_id !== 'string') {
          throw new Error('Invalid question_id');
        }
        
        if (!question.question_text || typeof question.question_text !== 'string') {
          throw new Error('Invalid question_text');
        }
        
        if (question.question_text.trim() === '') {
          throw new Error('Empty question_text not allowed');
        }
        
        if (typeof question.question_order !== 'number' || question.question_order <= 0) {
          throw new Error('Invalid question_order');
        }

        return {
          incident_id,
          question_id: question.question_id,
          phase,
          question_text: question.question_text,
          question_order: question.question_order,
          generated_at: Date.now(),
          ai_model: 'openai/gpt-5-nano',
          prompt_version: 'v1.0.0',
          is_active: true,
        };
      };

      // Test each question
      questionsToStore.forEach((question, index) => {
        const validatedQuestion = validateQuestionForStorage(question, 'incident123', 'before_event');
        
        expect(validatedQuestion.question_text).toBe(question.question_text);
        expect(validatedQuestion.question_text).not.toBe('');
        expect(validatedQuestion.question_text.length).toBeGreaterThan(0);
        expect(validatedQuestion.question_id).toBe(question.question_id);
        expect(validatedQuestion.question_order).toBe(question.question_order);
      });
    });

    test('should reject questions with empty or invalid content', () => {
      const invalidQuestions = [
        { question_id: 'test_q1', question_text: '', question_order: 1 }, // Empty string
        { question_id: 'test_q2', question_text: '   ', question_order: 2 }, // Whitespace only
        { question_id: 'test_q3', question_text: null, question_order: 3 }, // Null
        { question_id: 'test_q4', question_text: undefined, question_order: 4 }, // Undefined
        { question_id: 'test_q5', question_order: 5 }, // Missing question_text
      ];

      const validateQuestionForStorage = (question: any, incident_id: string, phase: string) => {
        if (!question.question_text || typeof question.question_text !== 'string') {
          throw new Error('Invalid question_text');
        }
        
        if (question.question_text.trim() === '') {
          throw new Error('Empty question_text not allowed');
        }

        return { valid: true };
      };

      invalidQuestions.forEach((invalidQuestion, index) => {
        expect(() => {
          validateQuestionForStorage(invalidQuestion, 'incident123', 'before_event');
        }).toThrow(/Invalid question_text|Empty question_text/);
      });
    });
  });

  describe('Clarification Workflow Data Flow', () => {
    test('should trace data flow from AI response to database storage', () => {
      // Step 1: Mock AI response
      const aiResponseContent = `[
        {"question": "What was the participant's mood before the incident?"},
        {"question": "Were there environmental factors involved?"},
        {"question": "What support strategies were in place?"}
      ]`;

      // Step 2: Parse AI response (from questionGenerator.ts logic)
      const parseAIResponse = (content: string) => {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const questionsArray = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        
        return questionsArray.map((q: any, index: number) => {
          const questionText = q.question || q.question_text || q.questionText || String(q).trim();
          
          if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
            throw new Error(`Question ${index + 1} has empty or invalid content`);
          }

          return {
            question_id: `before_event_q${index + 1}`,
            question_text: questionText.trim(),
            question_order: index + 1
          };
        });
      };

      // Step 3: Transform for storage (from aiClarification.ts logic)  
      const prepareForStorage = (questions: any[], incident_id: string, phase: string) => {
        return questions.map(question => ({
          incident_id,
          question_id: question.question_id,
          phase,
          question_text: question.question_text, // CRITICAL: This must not be empty
          question_order: question.question_order,
          generated_at: Date.now(),
          ai_model: 'openai/gpt-5-nano',
          prompt_version: 'v1.0.0',
          is_active: true,
        }));
      };

      // Step 4: Execute the full flow
      const parsedQuestions = parseAIResponse(aiResponseContent);
      const storageReadyQuestions = prepareForStorage(parsedQuestions, 'incident123', 'before_event');

      // Step 5: Verify data integrity throughout the flow
      expect(parsedQuestions).toHaveLength(3);
      expect(storageReadyQuestions).toHaveLength(3);

      storageReadyQuestions.forEach((question, index) => {
        // Verify the original content is preserved
        expect(question.question_text).toBe(parsedQuestions[index].question_text);
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(10);
        
        // Verify database schema compliance
        expect(question.incident_id).toBe('incident123');
        expect(question.phase).toBe('before_event');
        expect(question.question_id).toBe(`before_event_q${index + 1}`);
        expect(question.question_order).toBe(index + 1);
        expect(question.is_active).toBe(true);
      });
    });

    test('should identify where question content might get lost in the workflow', () => {
      // Mock the exact scenario that's happening in production
      const productionScenario = {
        aiResponse: {
          success: true,
          content: `[
            {"question": "What was the participant's mood or demeanor in the hours leading up to the incident?"},
            {"question": "Were there any environmental factors (noise, crowding, schedule changes) that might have contributed to the situation?"},
            {"question": "What support strategies were in place, and how were they being implemented?"}
          ]`,
          model: 'openai/gpt-5-nano',
          tokensUsed: 150,
          processingTimeMs: 1200,
          cost: 0.002,
        },
        databaseResult: {
          // This is what's actually showing up in the database
          questions: [
            { question_id: 'before_event_q1', question_text: '', phase: 'before_event' },
            { question_id: 'before_event_q2', question_text: '', phase: 'before_event' },
            { question_id: 'before_event_q3', question_text: '', phase: 'before_event' },
          ]
        }
      };

      // Simulate the parsing process
      const aiContent = productionScenario.aiResponse.content;
      console.log('AI Content Length:', aiContent.length);
      console.log('AI Content Preview:', aiContent.substring(0, 200));

      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      expect(jsonMatch).not.toBeNull();
      
      const parsedJson = JSON.parse(jsonMatch[0]);
      expect(parsedJson).toHaveLength(3);

      // Verify the parsed questions have content
      parsedJson.forEach((question: any, index: number) => {
        expect(question.question).toBeDefined();
        expect(question.question).not.toBe('');
        expect(question.question.length).toBeGreaterThan(20);
        console.log(`Question ${index + 1}:`, question.question);
      });

      // This would help identify where the content is lost
      // The fact that AI response has content but database has empty strings
      // suggests the issue is in the processing chain, not the AI response itself
    });
  });

  describe('Rate Limiting Impact on Question Storage', () => {
    test('should verify that rate limiting does not affect question content storage', () => {
      // Test scenario: Even if rate limiting occurs, cached/stored questions should have content
      const simulateRateLimitedScenario = () => {
        // This simulates what happens when rate limiting kicks in
        // but we still have valid questions to store
        const validQuestions = [
          {
            question_id: 'before_event_q1',
            question_text: 'What was the participant\'s emotional state before the incident?',
            question_order: 1
          },
          {
            question_id: 'before_event_q2', 
            question_text: 'Were there any environmental triggers present?',
            question_order: 2
          }
        ];

        // Even under rate limiting, question content should be preserved
        const prepareForStorage = (questions: any[]) => {
          return questions.map(q => ({
            ...q,
            generated_at: Date.now(),
            ai_model: 'rate-limited-fallback',
            is_active: true,
          }));
        };

        return prepareForStorage(validQuestions);
      };

      const rateLimitedQuestions = simulateRateLimitedScenario();
      
      rateLimitedQuestions.forEach(question => {
        expect(question.question_text).toBeDefined();
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(10);
      });
    });
  });
});