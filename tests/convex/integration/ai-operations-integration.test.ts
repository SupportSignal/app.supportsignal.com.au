// @ts-nocheck
/**
 * Integration tests for AI operations workflows
 * Tests complete AI operation workflows with real Convex database operations
 * Uses mocked AI services but real Convex database layer
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
  MOCK_CLARIFICATION_ANSWERS,
  createMockConvexContext,
} from '../ai-operations/fixtures';

// Mock AI manager but use real Convex operations
jest.mock('@/ai-multi-provider', () => ({
  aiManager: {
    sendRequest: jest.fn(),
  },
}));

describe('AI Operations Integration Tests', () => {
  let mockContext: any;
  let mockAIManager: any;

  beforeEach(() => {
    // Create mock context that simulates real Convex database operations
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

  describe('Complete AI Operations Workflow', () => {
    it('should execute full clarification questions workflow', async () => {
      // Setup database responses for complete workflow
      const mockPromptData = {
        prompt_name: 'generate_clarification_questions',
        prompt_version: 'v1.0.0',
        prompt_template: `You are preparing clarification questions for {{ participant_name }} 
reported by {{ reporter_name }} at {{ location }} on {{ event_datetime }}.

<before_event>{{ before_event }}</before_event>
<during_event>{{ during_event }}</during_event>
<end_of_event>{{ end_of_event }}</end_of_event>
<post_event_support>{{ post_event_support }}</post_event_support>

Output as JSON with before_event, during_event, end_of_event, post_event_support arrays.`,
        ai_model: 'openai/gpt-4.1-nano',
        max_tokens: 1000,
        temperature: 0.7,
        is_active: true,
      };

      // Mock Convex query for prompt template
      mockContext.runQuery.mockResolvedValueOnce({
        name: mockPromptData.prompt_name,
        version: mockPromptData.prompt_version,
        processedTemplate: mockPromptData.prompt_template
          .replace('{{ participant_name }}', MOCK_INCIDENT_DATA.participant_name)
          .replace('{{ reporter_name }}', MOCK_INCIDENT_DATA.reporter_name)
          .replace('{{ location }}', MOCK_INCIDENT_DATA.location)
          .replace('{{ event_datetime }}', MOCK_INCIDENT_DATA.event_datetime)
          .replace('{{ before_event }}', MOCK_INCIDENT_DATA.before_event)
          .replace('{{ during_event }}', MOCK_INCIDENT_DATA.during_event)
          .replace('{{ end_of_event }}', MOCK_INCIDENT_DATA.end_of_event)
          .replace('{{ post_event_support }}', MOCK_INCIDENT_DATA.post_event_support),
        originalTemplate: mockPromptData.prompt_template,
        substitutions: {
          participant_name: MOCK_INCIDENT_DATA.participant_name,
          reporter_name: MOCK_INCIDENT_DATA.reporter_name,
          location: MOCK_INCIDENT_DATA.location,
          event_datetime: MOCK_INCIDENT_DATA.event_datetime,
        },
        model: mockPromptData.ai_model,
        maxTokens: mockPromptData.max_tokens,
        temperature: mockPromptData.temperature,
      });

      // Mock Convex mutations for logging
      mockContext.runMutation
        .mockResolvedValueOnce(undefined) // AI logging
        .mockResolvedValueOnce(undefined); // Prompt usage logging

      // Mock AI service response
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      // Execute the operation
      const result = await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      // Verify the complete workflow executed correctly
      expect(result).toHaveProperty('clarification_questions');
      expect(result).toHaveProperty('metadata');

      // Verify database interactions
      expect(mockContext.runQuery).toHaveBeenCalledWith(
        'aiPromptTemplates/getProcessedPrompt',
        expect.objectContaining({
          promptName: 'generate_clarification_questions',
          variables: expect.objectContaining({
            participant_name: MOCK_INCIDENT_DATA.participant_name,
            reporter_name: MOCK_INCIDENT_DATA.reporter_name,
          }),
        })
      );

      // Verify AI logging mutation was called
      expect(mockContext.runMutation).toHaveBeenCalledWith(
        'aiLogging/logAIRequest',
        expect.objectContaining({
          operation: 'generateClarificationQuestions',
          model: 'openai/gpt-4.1-nano',
          success: true,
          processingTimeMs: 1250,
          tokensUsed: 245,
          cost: 0.00049,
        })
      );

      // Verify prompt usage tracking
      expect(mockContext.runMutation).toHaveBeenCalledWith(
        'prompts/recordPromptUsage',
        expect.objectContaining({
          promptName: 'generate_clarification_questions',
          promptVersion: 'v1.0.0',
          successful: true,
        })
      );

      // Verify AI service was called with correct request
      expect(mockAIManager.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: expect.stringMatching(/^ai-/),
          model: 'openai/gpt-4.1-nano',
          temperature: 0.7,
          maxTokens: 1000,
          metadata: expect.objectContaining({
            operation: 'generateClarificationQuestions',
            incident_id: MOCK_INCIDENT_DATA.incident_id,
            user_id: MOCK_INCIDENT_DATA.user_id,
          }),
        })
      );
    });

    it('should execute full narrative enhancement workflow', async () => {
      const enhanceArgs = {
        phase: 'during_event' as const,
        instruction: 'Enhance the narrative with clarification details',
        answers: MOCK_CLARIFICATION_ANSWERS,
        incident_id: MOCK_INCIDENT_DATA.incident_id,
        user_id: MOCK_INCIDENT_DATA.user_id,
      };

      // Mock processed prompt for narrative enhancement
      const mockProcessedPrompt = {
        name: 'enhance_narrative_content',
        version: 'v1.0.0',
        processedTemplate: `For the "during_event" phase, clean up grammar for these Q&A pairs:
${MOCK_CLARIFICATION_ANSWERS.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n\n')}
Instruction: ${enhanceArgs.instruction}`,
        originalTemplate: 'For the "{{ phase }}" phase...',
        substitutions: {
          phase: 'during_event',
          instruction: enhanceArgs.instruction,
          narrative_facts: 'Q: What specific activity...',
        },
        model: 'openai/gpt-4.1-nano',
        maxTokens: 800,
        temperature: 0.3,
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ENHANCE_NARRATIVE_SUCCESS);

      const result = await enhanceNarrativeContent(mockContext, enhanceArgs);

      // Verify database query was called correctly
      expect(mockContext.runQuery).toHaveBeenCalledWith(
        'aiPromptTemplates/getProcessedPrompt',
        expect.objectContaining({
          promptName: 'enhance_narrative_content',
          variables: expect.objectContaining({
            phase: 'during_event',
            instruction: enhanceArgs.instruction,
            narrative_facts: expect.stringContaining('Q: What specific activity'),
          }),
        })
      );

      // Verify result structure
      expect(result.output).toContain('Q: What specific activity was taking place');
      expect(result.narrative).toBe(result.output);
      expect(result.metadata.phase).toBe('during_event');
      expect(result.metadata.answers_processed).toBe(3);

      // Verify AI request was configured correctly for narrative enhancement
      expect(mockAIManager.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3, // Lower temperature for consistent formatting
          maxTokens: 800,
          metadata: expect.objectContaining({
            operation: 'enhanceNarrativeContent',
            phase: 'during_event',
            answers_count: 3,
          }),
        })
      );
    });

    it('should execute full contributing conditions analysis workflow', async () => {
      const analyzeArgs = {
        ...MOCK_INCIDENT_DATA,
        before_event_extra: MOCK_INCIDENT_DATA.before_event_extra || '',
        during_event_extra: MOCK_INCIDENT_DATA.during_event_extra || '',
        end_of_event_extra: MOCK_INCIDENT_DATA.end_of_event_extra || '',
        post_event_support_extra: MOCK_INCIDENT_DATA.post_event_support_extra || '',
      };

      const mockProcessedPrompt = {
        name: 'analyze_contributing_conditions',
        version: 'v1.0.0',
        processedTemplate: `Analyze incident for ${MOCK_INCIDENT_DATA.participant_name} 
reported by ${MOCK_INCIDENT_DATA.reporter_name}.
Before: ${MOCK_INCIDENT_DATA.before_event}
During: ${MOCK_INCIDENT_DATA.during_event}
End: ${MOCK_INCIDENT_DATA.end_of_event}
Support: ${MOCK_INCIDENT_DATA.post_event_support}
Identify immediate contributing conditions...`,
        originalTemplate: 'Analyze incident for {{ participant_name }}...',
        substitutions: {
          participant_name: MOCK_INCIDENT_DATA.participant_name,
          reporter_name: MOCK_INCIDENT_DATA.reporter_name,
        },
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1200,
        temperature: 0.5,
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ANALYZE_CONDITIONS_SUCCESS);

      const result = await analyzeContributingConditions(mockContext, analyzeArgs);

      // Verify comprehensive incident data was passed to template
      expect(mockContext.runQuery).toHaveBeenCalledWith(
        'aiPromptTemplates/getProcessedPrompt',
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

      // Verify result structure
      expect(result.analysis).toContain('Immediate Contributing Conditions');
      expect(result.analysis).toContain('Missed Morning Medication');
      expect(result.metadata.incident_context.participant_name).toBe(MOCK_INCIDENT_DATA.participant_name);

      // Verify AI configuration for analysis
      expect(mockAIManager.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5, // Medium temperature for balanced analysis
          maxTokens: 1200, // Higher token limit for detailed analysis
        })
      );
    });

    it('should execute full mock answers generation workflow', async () => {
      const mockArgs = {
        participant_name: MOCK_INCIDENT_DATA.participant_name,
        reporter_name: MOCK_INCIDENT_DATA.reporter_name,
        location: MOCK_INCIDENT_DATA.location,
        phase: 'duringEvent' as const,
        phase_narrative: 'The incident occurred during lunch time in the main dining area.',
        questions: JSON.stringify([
          'What was the participant doing when the incident began?',
          'How long did the incident last?',
          'Were other participants affected?',
        ]),
        incident_id: MOCK_INCIDENT_DATA.incident_id,
        user_id: MOCK_INCIDENT_DATA.user_id,
      };

      const mockProcessedPrompt = {
        name: 'generate_mock_answers',
        version: 'v1.0.0',
        processedTemplate: `Generate realistic mock answers for ${MOCK_INCIDENT_DATA.participant_name}
Phase: duringEvent
Context: The incident occurred during lunch time in the main dining area.
Questions: ["What was the participant doing when the incident began?", ...]
Provide realistic JSON response with answers array...`,
        originalTemplate: 'Generate realistic mock answers for {{ participant_name }}...',
        substitutions: {
          participant_name: MOCK_INCIDENT_DATA.participant_name,
          phase: 'duringEvent',
          phase_narrative: 'The incident occurred during lunch time...',
          questions: mockArgs.questions,
        },
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.8,
      };

      mockContext.runQuery.mockResolvedValueOnce(mockProcessedPrompt);
      mockContext.runMutation
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.MOCK_ANSWERS_SUCCESS);

      const result = await generateMockAnswers(mockContext, mockArgs);

      // Verify comprehensive mock generation data passed
      expect(mockContext.runQuery).toHaveBeenCalledWith(
        'aiPromptTemplates/getProcessedPrompt',
        expect.objectContaining({
          promptName: 'generate_mock_answers',
          variables: expect.objectContaining({
            participant_name: MOCK_INCIDENT_DATA.participant_name,
            reporter_name: MOCK_INCIDENT_DATA.reporter_name,
            location: MOCK_INCIDENT_DATA.location,
            phase: 'duringEvent',
            phase_narrative: mockArgs.phase_narrative,
            questions: mockArgs.questions,
          }),
        })
      );

      // Verify mock answers structure
      expect(result.mock_answers.output).toBeTruthy();
      const parsedOutput = JSON.parse(result.mock_answers.output);
      expect(parsedOutput.answers).toBeDefined();
      expect(Array.isArray(parsedOutput.answers)).toBe(true);
      expect(result.metadata.questions_answered).toBe(2);

      // Verify AI configuration for mock generation
      expect(mockAIManager.sendRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8, // Higher temperature for varied mock content
          maxTokens: 1000,
          metadata: expect.objectContaining({
            operation: 'generateMockAnswers',
            phase: 'duringEvent',
          }),
        })
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database query failures gracefully', async () => {
      // Mock database query failure
      mockContext.runQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(
        generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA)
      ).rejects.toThrow('Database connection failed');

      // Should not call AI service if database query fails
      expect(mockAIManager.sendRequest).not.toHaveBeenCalled();
    });

    it('should handle logging failures without affecting main operation', async () => {
      // Setup successful main operation
      mockContext.runQuery.mockResolvedValueOnce({
        name: 'generate_clarification_questions',
        version: 'v1.0.0',
        processedTemplate: 'Test template',
        originalTemplate: 'Test template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
      });

      // Mock logging failure
      mockContext.runMutation
        .mockRejectedValueOnce(new Error('Logging service unavailable')) // AI logging fails
        .mockResolvedValueOnce(undefined); // Prompt usage logging succeeds

      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      const result = await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      // Main operation should still succeed
      expect(result.clarification_questions).toBeTruthy();
      expect(result.metadata.status).toBe('success');
    });

    it('should handle AI service failures with proper error propagation', async () => {
      mockContext.runQuery.mockResolvedValueOnce({
        name: 'generate_clarification_questions',
        version: 'v1.0.0',
        processedTemplate: 'Test template',
        originalTemplate: 'Test template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
      });
      mockContext.runMutation.mockResolvedValue(undefined);

      // AI service fails
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.API_ERROR);

      await expect(
        generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA)
      ).rejects.toThrow('AI request failed');

      // Should still attempt to log the failure
      expect(mockContext.runMutation).toHaveBeenCalledWith(
        'aiLogging/logAIRequest',
        expect.objectContaining({
          success: false,
          error: 'OpenRouter API error: 401 - Invalid API key',
        })
      );
    });

    it('should maintain transaction-like behavior on failures', async () => {
      // Setup to fail during AI processing
      mockContext.runQuery.mockResolvedValueOnce({
        name: 'generate_clarification_questions',
        version: 'v1.0.0',
        processedTemplate: 'Test template',
        originalTemplate: 'Test template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
      });

      // Mock to track call order
      const mutationCalls = [];
      mockContext.runMutation.mockImplementation((api, args) => {
        mutationCalls.push({ api, args });
        return Promise.resolve();
      });

      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.API_ERROR);

      try {
        await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);
      } catch (error) {
        // Expected to throw
      }

      // Should still log even on failure (for debugging/monitoring)
      expect(mutationCalls.length).toBeGreaterThan(0);
      expect(mutationCalls.some(call => call.api === 'aiLogging/logAIRequest')).toBe(true);
    });
  });

  describe('Cross-Operation Data Flow', () => {
    it('should handle complete incident processing workflow', async () => {
      // Step 1: Generate clarification questions
      mockContext.runQuery.mockResolvedValueOnce({
        name: 'generate_clarification_questions',
        version: 'v1.0.0',
        processedTemplate: 'Generate questions template',
        originalTemplate: 'Template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
      });
      mockContext.runMutation.mockResolvedValue(undefined);
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);

      const questionsResult = await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      // Step 2: Use questions result to enhance narrative
      const enhanceArgs = {
        phase: 'during_event' as const,
        instruction: 'Enhance narrative with details',
        answers: MOCK_CLARIFICATION_ANSWERS,
        incident_id: MOCK_INCIDENT_DATA.incident_id,
        user_id: MOCK_INCIDENT_DATA.user_id,
      };

      mockContext.runQuery.mockResolvedValueOnce({
        name: 'enhance_narrative_content',
        version: 'v1.0.0',
        processedTemplate: 'Enhance narrative template',
        originalTemplate: 'Template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 800,
        temperature: 0.3,
      });
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ENHANCE_NARRATIVE_SUCCESS);

      const narrativeResult = await enhanceNarrativeContent(mockContext, enhanceArgs);

      // Step 3: Analyze contributing conditions with enhanced narrative
      const analyzeArgs = {
        ...MOCK_INCIDENT_DATA,
        during_event: narrativeResult.output, // Use enhanced narrative
        before_event_extra: '',
        during_event_extra: '',
        end_of_event_extra: '',
        post_event_support_extra: '',
      };

      mockContext.runQuery.mockResolvedValueOnce({
        name: 'analyze_contributing_conditions',
        version: 'v1.0.0',
        processedTemplate: 'Analyze conditions template',
        originalTemplate: 'Template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1200,
        temperature: 0.5,
      });
      mockAIManager.sendRequest.mockResolvedValueOnce(MOCK_AI_RESPONSES.ANALYZE_CONDITIONS_SUCCESS);

      const analysisResult = await analyzeContributingConditions(mockContext, analyzeArgs);

      // Verify the workflow progression
      expect(questionsResult.clarification_questions).toBeTruthy();
      expect(narrativeResult.output).toContain('Q: What specific activity');
      expect(analysisResult.analysis).toContain('Immediate Contributing Conditions');

      // Verify all operations were logged
      expect(mockContext.runMutation).toHaveBeenCalledTimes(6); // 2 calls per operation (logging + usage)
    });

    it('should maintain correlation across related operations', async () => {
      const correlationTracker = [];

      // Mock AI manager to track correlation IDs
      mockAIManager.sendRequest.mockImplementation((request) => {
        correlationTracker.push(request.correlationId);
        return Promise.resolve(MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS);
      });

      // Execute multiple operations
      mockContext.runQuery.mockResolvedValue({
        name: 'test_prompt',
        version: 'v1.0.0',
        processedTemplate: 'Template',
        originalTemplate: 'Template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
      });
      mockContext.runMutation.mockResolvedValue(undefined);

      await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);
      await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);

      // Each operation should have a unique correlation ID
      expect(correlationTracker).toHaveLength(2);
      expect(correlationTracker[0]).not.toBe(correlationTracker[1]);
      expect(correlationTracker[0]).toMatch(/^ai-/);
      expect(correlationTracker[1]).toMatch(/^ai-/);
    });
  });

  describe('Performance and Resource Management', () => {
    it('should track resource usage across operations', async () => {
      const resourceTracking = {
        totalTokens: 0,
        totalCost: 0,
        totalTime: 0,
      };

      // Mock AI responses with resource usage
      const responses = [
        { ...MOCK_AI_RESPONSES.CLARIFICATION_SUCCESS, tokensUsed: 245, cost: 0.00049, processingTimeMs: 1250 },
        { ...MOCK_AI_RESPONSES.ENHANCE_NARRATIVE_SUCCESS, tokensUsed: 156, cost: 0.000312, processingTimeMs: 890 },
        { ...MOCK_AI_RESPONSES.ANALYZE_CONDITIONS_SUCCESS, tokensUsed: 278, cost: 0.000556, processingTimeMs: 1450 },
      ];

      mockContext.runQuery.mockResolvedValue({
        name: 'test_prompt',
        version: 'v1.0.0',
        processedTemplate: 'Template',
        originalTemplate: 'Template',
        substitutions: {},
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
      });

      mockContext.runMutation.mockImplementation((api, args) => {
        if (api === 'aiLogging/logAIRequest' && args.success) {
          resourceTracking.totalTokens += args.tokensUsed || 0;
          resourceTracking.totalCost += args.cost || 0;
          resourceTracking.totalTime += args.processingTimeMs || 0;
        }
        return Promise.resolve();
      });

      // Execute operations with different resource usage
      mockAIManager.sendRequest
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2]);

      await generateClarificationQuestions(mockContext, MOCK_INCIDENT_DATA);
      
      const enhanceArgs = {
        phase: 'during_event' as const,
        instruction: 'Test',
        answers: MOCK_CLARIFICATION_ANSWERS,
        incident_id: MOCK_INCIDENT_DATA.incident_id,
        user_id: MOCK_INCIDENT_DATA.user_id,
      };
      await enhanceNarrativeContent(mockContext, enhanceArgs);

      const analyzeArgs = {
        ...MOCK_INCIDENT_DATA,
        before_event_extra: '',
        during_event_extra: '',
        end_of_event_extra: '',
        post_event_support_extra: '',
      };
      await analyzeContributingConditions(mockContext, analyzeArgs);

      // Verify resource tracking
      expect(resourceTracking.totalTokens).toBe(245 + 156 + 278);
      expect(resourceTracking.totalCost).toBeCloseTo(0.00049 + 0.000312 + 0.000556, 6);
      expect(resourceTracking.totalTime).toBe(1250 + 890 + 1450);
    });
  });
});