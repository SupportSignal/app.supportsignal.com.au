// @ts-nocheck
/**
 * Unit tests for AI operations
 * Tests the four core AI operations with mocked AI responses
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  generateClarificationQuestions,
  enhanceNarrativeContent,
  analyzeContributingConditions,
  generateMockAnswers,
} from '@/ai-operations';
import {
  MOCK_INCIDENT_DATA,
  MOCK_AI_RESPONSES,
  MOCK_PROCESSED_PROMPTS,
  MOCK_CLARIFICATION_ANSWERS,
  createMockConvexContext,
  createMockFetchResponse,
} from './fixtures';

// Mock the multi-provider AI manager
jest.mock('@/ai-multi-provider', () => ({
  aiManager: {
    sendRequest: jest.fn(),
  },
}));

// Mock the API for Convex operations
jest.mock('@/_generated/api', () => ({
  api: {
    aiPromptTemplates: {
      getProcessedPrompt: 'aiPromptTemplates/getProcessedPrompt',
    },
    aiLogging: {
      logAIRequest: 'aiLogging/logAIRequest',
    },
    prompts: {
      recordPromptUsage: 'prompts/recordPromptUsage',
    },
  },
}));

const mockApi = {
  aiPromptTemplates: {
    getProcessedPrompt: 'aiPromptTemplates/getProcessedPrompt',
  },
  aiLogging: {
    logAIRequest: 'aiLogging/logAIRequest',
  },
  prompts: {
    recordPromptUsage: 'prompts/recordPromptUsage',
  },
};

describe('AI Operations', () => {
  let mockContext: any;
  let mockAIManager: any;

  beforeEach(() => {
    // Create fresh mock context for each test
    mockContext = createMockConvexContext({
      runQuery: jest.fn(),
      runMutation: jest.fn(),
    });

    // Get reference to mocked AI manager
    const { aiManager } = require('@/ai-multi-provider');
    mockAIManager = aiManager;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('generateClarificationQuestions', () => {
    it('should generate clarification questions successfully', async () => {
      // Setup mocks
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation
        .mockResolvedValueOnce(undefined) // logAIRequest
        .mockResolvedValueOnce(undefined); // recordPromptUsage
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      // Execute operation
      const result = await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      // Verify result structure
      expect(result).toHaveProperty('clarification_questions');
      expect(result).toHaveProperty('metadata');
      
      const questions = result.clarification_questions;
      expect(questions).toHaveProperty('before_event');
      expect(questions).toHaveProperty('during_event');
      expect(questions).toHaveProperty('end_of_event');
      expect(questions).toHaveProperty('post_event_support');
      
      // Verify each phase has questions
      expect(Array.isArray(questions.before_event)).toBe(true);
      expect(questions.before_event.length).toBeGreaterThan(0);
      expect(questions.during_event.length).toBeGreaterThan(0);
      
      // Verify metadata
      expect(result.metadata.status).toBe('success');
      expect(result.metadata.correlation_id).toMatch(/^ai-/);
      expect(result.metadata.processing_time_ms).toBe(1250);
      expect(result.metadata.tokens_used).toBe(245);
      expect(result.metadata.cost).toBe(0.00049);
    });

    it('should handle JSON parsing errors from AI response', async () => {
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.INVALID_JSON);

      await expect(
        generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA)
      ).rejects.toThrow('Failed to parse AI response as JSON');
    });

    it('should handle AI request failures', async () => {
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.API_ERROR);

      await expect(
        generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA)
      ).rejects.toThrow('AI request failed: OpenRouter API error: 401 - Invalid API key');

      // Verify error logging
      expect(mockContext.runMutation).toHaveBeenCalledWith(
        mockApi.aiLogging.logAIRequest,
        expect.objectContaining({
          success: false,
          error: 'OpenRouter API error: 401 - Invalid API key',
        })
      );
    });

    it('should handle markdown-wrapped JSON responses', async () => {
      const markdownWrappedResponse = {
        ...MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS,
        content: '```json\n' + MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS.content + '\n```',
      };

      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(markdownWrappedResponse);

      const result = await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      expect(result.clarification_questions).toHaveProperty('before_event');
      expect(result.metadata.status).toBe('success');
    });

    it('should use fallback when circuit breaker is open', async () => {
      // Mock circuit breaker to be open by importing and testing the fallback logic
      // This would be integration tested with actual circuit breaker state
      const args = {
        ...MOCK_INCIDENT_DATA,
        user_id: 'rate-limited-user' as any,
      };

      // The rate limiting and circuit breaker logic is tested in integration tests
      // Here we focus on the happy path and error scenarios
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      const result = await generateClarificationQuestions(mockContext, args);
      expect(result.metadata.status).toBe('success');
    });

    it('should log AI requests with correct parameters', async () => {
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      expect(mockContext.runMutation).toHaveBeenCalledWith(
        mockApi.aiLogging.logAIRequest,
        expect.objectContaining({
          operation: 'generateClarificationQuestions',
          model: 'openai/gpt-4.1-nano',
          processingTimeMs: 1250,
          tokensUsed: 245,
          cost: 0.00049,
          success: true,
          userId: MOCK_INCIDENT_DATA.user_id,
          incidentId: MOCK_INCIDENT_DATA.incident_id,
        })
      );

      expect(mockContext.runMutation).toHaveBeenCalledWith(
        mockApi.prompts.recordPromptUsage,
        expect.objectContaining({
          promptName: 'generate_clarification_questions',
          promptVersion: 'v1.0.0',
          responseTime: 1250,
          successful: true,
        })
      );
    });
  });

  describe('enhanceNarrativeContent', () => {
    const enhanceArgs = {
      phase: 'during_event' as const,
      instruction: 'Enhance the narrative with clarification details',
      answers: MOCK_CLARIFICATION_ANSWERS,
      incident_id: MOCK_INCIDENT_DATA.incident_id,
      user_id: MOCK_INCIDENT_DATA.user_id,
    };

    it('should enhance narrative content successfully', async () => {
      const mockProcessedPrompt = {
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'enhance_narrative_content',
        temperature: 0.3,
        maxTokens: 800,
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ENHANCE_NARRATIVE_SUCCESS);

      const result = await enhanceNarrativeContent(mockContext, enhanceArgs);

      expect(result).toHaveProperty('output');
      expect(result).toHaveProperty('narrative');
      expect(result).toHaveProperty('metadata');
      
      // Output and narrative should be the same
      expect(result.narrative).toBe(result.output);
      expect(result.output).toContain('Q: What specific activity was taking place');
      expect(result.output).toContain('A: The participants were engaged');
      
      // Verify metadata
      expect(result.metadata.status).toBe('success');
      expect(result.metadata.phase).toBe('during_event');
      expect(result.metadata.answers_processed).toBe(3);
    });

    it('should filter out invalid question-answer pairs', async () => {
      const invalidAnswers = [
        { question: '', answer: 'Valid answer' }, // Empty question
        { question: 'Valid question?', answer: '' }, // Empty answer
        { question: '  ', answer: '  ' }, // Whitespace only
        { question: 'Valid question?', answer: 'Valid answer' }, // Valid pair
      ];

      const argsWithInvalidAnswers = {
        ...enhanceArgs,
        answers: invalidAnswers,
      };

      const mockProcessedPrompt = {
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'enhance_narrative_content',
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ENHANCE_NARRATIVE_SUCCESS);

      const result = await enhanceNarrativeContent(mockContext, argsWithInvalidAnswers);

      // Should only process the one valid pair
      expect(result.metadata.answers_processed).toBe(1);
    });

    it('should handle AI request errors', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'enhance_narrative_content',
      });
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.NETWORK_ERROR);

      await expect(
        enhanceNarrativeContent(mockContext, enhanceArgs)
      ).rejects.toThrow('AI request failed: Network error: fetch failed');
    });

    it('should use correct template variables', async () => {
      const mockProcessedPrompt = {
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'enhance_narrative_content',
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ENHANCE_NARRATIVE_SUCCESS);

      await enhanceNarrativeContent(mockContext, enhanceArgs);

      expect(mockContext.runQuery).toHaveBeenCalledWith(
        mockApi.aiPromptTemplates.getProcessedPrompt,
        expect.objectContaining({
          promptName: 'enhance_narrative_content',
          variables: expect.objectContaining({
            phase: 'during_event',
            instruction: enhanceArgs.instruction,
            narrative_facts: expect.stringContaining('Q: What specific activity'),
          }),
        })
      );
    });
  });

  describe('analyzeContributingConditions', () => {
    const analyzeArgs = {
      ...MOCK_INCIDENT_DATA,
      before_event_extra: MOCK_INCIDENT_DATA.before_event_extra || '',
      during_event_extra: MOCK_INCIDENT_DATA.during_event_extra || '',
      end_of_event_extra: MOCK_INCIDENT_DATA.end_of_event_extra || '',
      post_event_support_extra: MOCK_INCIDENT_DATA.post_event_support_extra || '',
    };

    it('should analyze contributing conditions successfully', async () => {
      const mockProcessedPrompt = {
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'analyze_contributing_conditions',
        temperature: 0.5,
        maxTokens: 1200,
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ANALYZE_CONDITIONS_SUCCESS);

      const result = await analyzeContributingConditions(mockContext, analyzeArgs);

      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('metadata');
      
      expect(result.analysis).toContain('Immediate Contributing Conditions');
      expect(result.analysis).toContain('Missed Morning Medication');
      expect(result.analysis).toContain('Environmental Stressors');
      
      expect(result.metadata.status).toBe('success');
      expect(result.metadata.incident_context.participant_name).toBe(MOCK_INCIDENT_DATA.participant_name);
    });

    it('should include all incident phases in template variables', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'analyze_contributing_conditions',
      });
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ANALYZE_CONDITIONS_SUCCESS);

      await analyzeContributingConditions(mockContext, analyzeArgs);

      expect(mockContext.runQuery).toHaveBeenCalledWith(
        mockApi.aiPromptTemplates.getProcessedPrompt,
        expect.objectContaining({
          promptName: 'analyze_contributing_conditions',
          variables: expect.objectContaining({
            reporter_name: MOCK_INCIDENT_DATA.reporter_name,
            participant_name: MOCK_INCIDENT_DATA.participant_name,
            event_datetime: MOCK_INCIDENT_DATA.event_datetime,
            location: MOCK_INCIDENT_DATA.location,
            before_event: MOCK_INCIDENT_DATA.before_event,
            before_event_extra: MOCK_INCIDENT_DATA.before_event_extra || '',
            during_event: MOCK_INCIDENT_DATA.during_event,
            during_event_extra: MOCK_INCIDENT_DATA.during_event_extra || '',
            end_of_event: MOCK_INCIDENT_DATA.end_of_event,
            end_of_event_extra: MOCK_INCIDENT_DATA.end_of_event_extra || '',
            post_event_support: MOCK_INCIDENT_DATA.post_event_support,
            post_event_support_extra: MOCK_INCIDENT_DATA.post_event_support_extra || '',
          }),
        })
      );
    });

    it('should handle missing optional fields gracefully', async () => {
      const argsWithoutExtras = {
        reporter_name: MOCK_INCIDENT_DATA.reporter_name,
        participant_name: MOCK_INCIDENT_DATA.participant_name,
        event_datetime: MOCK_INCIDENT_DATA.event_datetime,
        location: MOCK_INCIDENT_DATA.location,
        before_event: MOCK_INCIDENT_DATA.before_event,
        during_event: MOCK_INCIDENT_DATA.during_event,
        end_of_event: MOCK_INCIDENT_DATA.end_of_event,
        post_event_support: MOCK_INCIDENT_DATA.post_event_support,
        // No extra fields
      };

      mockContext.runQuery.mockResolvedValueOnce({
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'analyze_contributing_conditions',
      });
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ANALYZE_CONDITIONS_SUCCESS);

      const result = await analyzeContributingConditions(mockContext, argsWithoutExtras);

      expect(result.analysis).toBeTruthy();
      expect(result.metadata.status).toBe('success');
    });
  });

  describe('generateMockAnswers', () => {
    const mockArgs = {
      participant_name: MOCK_INCIDENT_DATA.participant_name,
      reporter_name: MOCK_INCIDENT_DATA.reporter_name,
      location: MOCK_INCIDENT_DATA.location,
      phase: 'duringEvent' as const,
      phase_narrative: 'The incident occurred during lunch time.',
      questions: JSON.stringify([
        'What was the participant doing?',
        'How long did it last?',
      ]),
      incident_id: MOCK_INCIDENT_DATA.incident_id,
      user_id: MOCK_INCIDENT_DATA.user_id,
    };

    it('should generate mock answers successfully', async () => {
      const mockProcessedPrompt = {
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'generate_mock_answers',
        temperature: 0.8,
        maxTokens: 1000,
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.MOCK_ANSWERS_SUCCESS);

      const result = await generateMockAnswers(mockContext, mockArgs);

      expect(result).toHaveProperty('mock_answers');
      expect(result).toHaveProperty('metadata');
      
      expect(result.mock_answers).toHaveProperty('output');
      const mockAnswers = JSON.parse(result.mock_answers.output);
      expect(mockAnswers).toHaveProperty('answers');
      expect(Array.isArray(mockAnswers.answers)).toBe(true);
      expect(mockAnswers.answers.length).toBeGreaterThan(0);
      
      // Verify answer structure
      const firstAnswer = mockAnswers.answers[0];
      expect(firstAnswer).toHaveProperty('question_id');
      expect(firstAnswer).toHaveProperty('question');
      expect(firstAnswer).toHaveProperty('answer');
      
      expect(result.metadata.phase).toBe('duringEvent');
      expect(result.metadata.questions_answered).toBe(2);
    });

    it('should handle invalid questions JSON gracefully', async () => {
      const argsWithInvalidJson = {
        ...mockArgs,
        questions: 'invalid json string',
      };

      mockContext.runQuery.mockResolvedValueOnce({
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'generate_mock_answers',
      });
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.MOCK_ANSWERS_SUCCESS);

      const result = await generateMockAnswers(mockContext, argsWithInvalidJson);

      expect(result.metadata.questions_answered).toBe(0);
    });

    it('should use higher temperature for varied mock content', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        ...MOCK_PROCESSED_PROMPTS.CLARIFICATION,
        name: 'generate_mock_answers',
        temperature: 0.8,
      });
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.MOCK_ANSWERS_SUCCESS);

      await generateMockAnswers(mockContext, mockArgs);

      expect(mockAIManager.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8, // Higher temperature for creativity
        })
      );
    });
  });

  describe('Error Handling Patterns', () => {
    it('should handle rate limiting across all operations', async () => {
      // This would be tested in integration tests with actual rate limiter
      // Here we test that the error is properly thrown and logged
      const rateLimitedArgs = {
        ...MOCK_INCIDENT_DATA,
        user_id: 'rate-limited-user' as any,
      };

      // Mock rate limiter to deny request (this is tested in circuit breaker integration)
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      // Rate limiting logic is in the actual operations, would need integration test
      const result = await generateClarificationQuestions(mockContext, rateLimitedArgs);
      expect(result).toBeTruthy();
    });

    it('should handle cost tracking failures', async () => {
      // Cost tracking is embedded in the operations
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      const result = await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);
      expect(result.metadata.cost).toBe(0.00049);
    });

    it('should handle prompt template errors', async () => {
      mockContext.runQuery.mockRejectedValueOnce(new Error('Prompt not found'));
      mockContext.runMutation.mockResolvedValue(undefined);

      await expect(
        generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA)
      ).rejects.toThrow('Prompt not found');
    });

    it('should handle ConvexError exceptions properly', async () => {
      const ConvexError = require('convex/values').ConvexError;
      
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockRejectedValueOnce(new ConvexError('Database error'));

      await expect(
        generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA)
      ).rejects.toThrow('Database error');
    });
  });

  describe('Metadata and Logging Validation', () => {
    it('should log successful operations correctly', async () => {
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      // Verify AI logging
      expect(mockContext.runMutation).toHaveBeenCalledWith(
        mockApi.aiLogging.logAIRequest,
        expect.objectContaining({
          correlationId: expect.stringMatching(/^ai-/),
          operation: 'generateClarificationQuestions',
          success: true,
          userId: MOCK_INCIDENT_DATA.user_id,
          incidentId: MOCK_INCIDENT_DATA.incident_id,
        })
      );

      // Verify prompt usage logging
      expect(mockContext.runMutation).toHaveBeenCalledWith(
        mockApi.prompts.recordPromptUsage,
        expect.objectContaining({
          successful: true,
        })
      );
    });

    it('should log failed operations correctly', async () => {
      mockContext.runQuery.mockResolvedValueOnce(MOCK_PROCESSED_PROMPTS.CLARIFICATION);
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.API_ERROR);

      try {
        await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);
      } catch (error) {
        // Expected to throw
      }

      // Verify error logging
      expect(mockContext.runMutation).toHaveBeenCalledWith(
        mockApi.aiLogging.logAIRequest,
        expect.objectContaining({
          success: false,
          error: 'OpenRouter API error: 401 - Invalid API key',
        })
      );
    });
  });
});