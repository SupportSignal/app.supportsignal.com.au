/**
 * Integration Testing: AI Question Generator
 * 
 * This test targets the actual questionGenerator function to identify
 * where the empty question_text issue occurs in the real workflow.
 */

// @ts-nocheck
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock all external dependencies first
jest.mock('../../../apps/convex/aiService', () => ({
  generateCorrelationId: jest.fn(() => 'test-correlation-id'),
  RateLimiter: jest.fn().mockImplementation(() => ({
    isAllowed: jest.fn(() => true),
  })),
  CostTracker: jest.fn().mockImplementation(() => ({
    isWithinDailyLimit: jest.fn(() => true),
    trackRequest: jest.fn(),
  })),
  CircuitBreaker: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../../apps/convex/aiMultiProvider', () => ({
  aiManager: {
    sendRequest: jest.fn(),
    getProviderStatus: jest.fn(() => ({})),
    getAvailableModels: jest.fn(() => []),
  },
}));

jest.mock('../../../apps/convex/lib/config', () => ({
  getConfig: jest.fn(() => ({
    llm: {
      defaultModel: 'openai/gpt-5-nano',
    },
  })),
}));

describe('AI Question Generator Integration Tests', () => {
  let mockContext: any;
  let mockAiManager: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Convex context
    mockContext = {
      runQuery: jest.fn(),
      runMutation: jest.fn(),
      runAction: jest.fn(),
    };

    // Get mocked dependencies
    mockAiManager = require('../../../apps/convex/aiMultiProvider').aiManager;
    mockConfig = require('../../../apps/convex/lib/config').getConfig;
  });

  describe('Successful AI Response Processing', () => {
    test('should process AI response and preserve question content', async () => {
      // Set up mock responses
      mockContext.runQuery
        .mockResolvedValueOnce({
          // Mock prompt template response
          prompt_name: 'generate_clarification_questions',
          ai_model: 'openai/gpt-5-nano',
          prompt_template: 'Generate questions for {{participant_name}} regarding {{narrative_phase}}. Context: {{existing_narrative}}',
        });

      mockContext.runMutation
        .mockResolvedValueOnce('hash123') // logAiRequest
        .mockResolvedValueOnce(undefined); // updatePromptUsage

      // Mock successful AI response with questions
      const mockAiResponse = {
        success: true,
        content: `[
          {"question": "What was the participant's mood before the incident?"},
          {"question": "Were there environmental factors involved?"},
          {"question": "What support strategies were in place?"}
        ]`,
        model: 'openai/gpt-5-nano',
        tokensUsed: 150,
        processingTimeMs: 1200,
        cost: 0.002,
        correlationId: 'test-correlation-id',
      };

      mockAiManager.sendRequest.mockResolvedValue(mockAiResponse);

      // Import and test the actual function
      const { generateQuestionsForPhase } = await import('../../../apps/convex/lib/ai/questionGenerator.ts');

      const args = {
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Main Activity Room',
        event_date_time: '2024-01-15 14:30:00',
        phase: 'before_event',
        narrative_content: 'The participant was showing signs of agitation before the scheduled activity.',
        user_id: 'user123',
        incident_id: 'incident456',
      };

      const result = await generateQuestionsForPhase.handler(mockContext, args);

      // Verify the results
      expect(result.questions).toHaveLength(3);
      expect(result.success).toBe(true);
      
      // CRITICAL: Verify questions have non-empty content
      result.questions.forEach((question, index) => {
        expect(question.question_text).toBeDefined();
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(0);
        expect(question.question_id).toBe(`before_event_q${index + 1}`);
        expect(question.question_order).toBe(index + 1);
      });

      // Verify specific question content matches AI response
      expect(result.questions[0].question_text).toBe("What was the participant's mood before the incident?");
      expect(result.questions[1].question_text).toBe("Were there environmental factors involved?");
      expect(result.questions[2].question_text).toBe("What support strategies were in place?");
    });

    test('should handle AI response with different question field names', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        prompt_name: 'generate_clarification_questions',
        ai_model: 'openai/gpt-5-nano',
        prompt_template: 'Generate questions',
      });

      mockContext.runMutation
        .mockResolvedValueOnce('hash123')
        .mockResolvedValueOnce(undefined);

      // Mock AI response with question_text field instead of question
      const mockAiResponse = {
        success: true,
        content: `[
          {"question_text": "What was the participant's emotional state?"},
          {"questionText": "Were there any triggers identified?"}
        ]`,
        model: 'openai/gpt-5-nano',
        tokensUsed: 120,
        processingTimeMs: 1100,
        cost: 0.001,
        correlationId: 'test-correlation-id',
      };

      mockAiManager.sendRequest.mockResolvedValue(mockAiResponse);

      const { generateQuestionsForPhase } = await import('../../../apps/convex/lib/ai/questionGenerator.ts');

      const args = {
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Main Activity Room',
        event_date_time: '2024-01-15 14:30:00',
        phase: 'before_event',
        narrative_content: 'Test narrative',
        user_id: 'user123',
        incident_id: 'incident456',
      };

      const result = await generateQuestionsForPhase.handler(mockContext, args);

      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].question_text).toBe("What was the participant's emotional state?");
      expect(result.questions[1].question_text).toBe("Were there any triggers identified?");
    });
  });

  describe('Error Scenarios That Cause Empty Questions', () => {
    test('should identify when AI returns malformed response structure', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        prompt_name: 'generate_clarification_questions',
        ai_model: 'openai/gpt-5-nano',
        prompt_template: 'Generate questions',
      });

      mockContext.runMutation
        .mockResolvedValueOnce('hash123')
        .mockResolvedValueOnce(undefined);

      // Mock AI response with problematic structure
      const mockAiResponse = {
        success: true,
        content: `[
          {"id": 1, "text": "Missing question field"},
          {"question": ""},
          {"question": null}
        ]`,
        model: 'openai/gpt-5-nano',
        tokensUsed: 100,
        processingTimeMs: 1000,
        cost: 0.001,
        correlationId: 'test-correlation-id',
      };

      mockAiManager.sendRequest.mockResolvedValue(mockAiResponse);

      const { generateQuestionsForPhase } = await import('../../../apps/convex/lib/ai/questionGenerator.ts');

      const args = {
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Main Activity Room',
        event_date_time: '2024-01-15 14:30:00',
        phase: 'before_event',
        narrative_content: 'Test narrative',
        user_id: 'user123',
        incident_id: 'incident456',
      };

      // This should throw an error due to invalid question content
      await expect(
        generateQuestionsForPhase.handler(mockContext, args)
      ).rejects.toThrow(/has empty or invalid content/);
    });

    test('should identify when AI returns empty content', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        prompt_name: 'generate_clarification_questions',
        ai_model: 'openai/gpt-5-nano',
        prompt_template: 'Generate questions',
      });

      mockContext.runMutation
        .mockResolvedValueOnce('hash123')
        .mockResolvedValueOnce(undefined);

      // Mock AI response with empty content
      const mockAiResponse = {
        success: true,
        content: '',
        model: 'openai/gpt-5-nano',
        tokensUsed: 0,
        processingTimeMs: 500,
        cost: 0,
        correlationId: 'test-correlation-id',
      };

      mockAiManager.sendRequest.mockResolvedValue(mockAiResponse);

      const { generateQuestionsForPhase } = await import('../../../apps/convex/lib/ai/questionGenerator.ts');

      const args = {
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Main Activity Room',
        event_date_time: '2024-01-15 14:30:00',
        phase: 'before_event',
        narrative_content: 'Test narrative',
        user_id: 'user123',
        incident_id: 'incident456',
      };

      await expect(
        generateQuestionsForPhase.handler(mockContext, args)
      ).rejects.toThrow(/AI response is empty/);
    });

    test('should handle AI service failure and fallback to mock questions', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        prompt_name: 'generate_clarification_questions',
        ai_model: 'openai/gpt-5-nano',
        prompt_template: 'Generate questions',
      });

      mockContext.runMutation
        .mockResolvedValueOnce('hash123')
        .mockResolvedValueOnce(undefined);

      // Mock AI service failure
      mockAiManager.sendRequest.mockRejectedValue(new Error('AI service unavailable'));

      const { generateQuestionsForPhase } = await import('../../../apps/convex/lib/ai/questionGenerator.ts');

      const args = {
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Main Activity Room',
        event_date_time: '2024-01-15 14:30:00',
        phase: 'before_event',
        narrative_content: 'Test narrative',
        user_id: 'user123',
        incident_id: 'incident456',
      };

      const result = await generateQuestionsForPhase.handler(mockContext, args);

      // Should fallback to mock questions
      expect(result.questions).toHaveLength(3);
      expect(result.success).toBe(false); // AI failed
      expect(result.ai_model_used).toBeDefined();

      // Mock questions should still have valid content
      result.questions.forEach(question => {
        expect(question.question_text).toBeDefined();
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Template Processing', () => {
    test('should correctly process template variables', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        prompt_name: 'generate_clarification_questions',
        ai_model: 'openai/gpt-5-nano',
        prompt_template: 'Generate questions for {{participant_name}} about {{narrative_phase}} at {{incident_location}}. Context: {{existing_narrative}}',
      });

      mockContext.runMutation
        .mockResolvedValueOnce('hash123')
        .mockResolvedValueOnce(undefined);

      // Mock AI response
      const mockAiResponse = {
        success: true,
        content: '[{"question": "Test question"}]',
        model: 'openai/gpt-5-nano',
        tokensUsed: 50,
        processingTimeMs: 800,
        cost: 0.001,
        correlationId: 'test-correlation-id',
      };

      mockAiManager.sendRequest.mockResolvedValue(mockAiResponse);

      const { generateQuestionsForPhase } = await import('../../../apps/convex/lib/ai/questionGenerator.ts');

      const args = {
        participant_name: 'John Doe',
        reporter_name: 'Jane Smith',
        location: 'Main Activity Room',
        event_date_time: '2024-01-15 14:30:00',
        phase: 'before_event',
        narrative_content: 'The participant showed signs of agitation.',
        user_id: 'user123',
        incident_id: 'incident456',
      };

      await generateQuestionsForPhase.handler(mockContext, args);

      // Verify AI manager was called with properly interpolated prompt
      expect(mockAiManager.sendRequest).toHaveBeenCalled();
      const aiRequest = mockAiManager.sendRequest.mock.calls[0][0];
      
      expect(aiRequest.prompt).toContain('John Doe');
      expect(aiRequest.prompt).toContain('before_event');
      expect(aiRequest.prompt).toContain('Main Activity Room');
      expect(aiRequest.prompt).toContain('The participant showed signs of agitation.');
      expect(aiRequest.prompt).not.toMatch(/\{\{.*\}\}/); // No unfilled placeholders
    });
  });
});