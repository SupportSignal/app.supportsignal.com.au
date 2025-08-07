// @ts-nocheck
/**
 * Unit tests for AI prompt template processing and validation
 * Tests processTemplate, validateTemplateVariables, and Convex query operations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  processTemplate,
  validateTemplateVariables,
  getProcessedPrompt,
  getTemplateVariables,
  getABTestPrompt,
  AI_OPERATION_PROMPTS,
} from '@/ai-prompt-templates';
import { createMockConvexContext, MOCK_INCIDENT_DATA } from './fixtures';

describe('AI Prompt Templates', () => {
  describe('processTemplate', () => {
    it('should substitute simple variables correctly', () => {
      const template = 'Hello {{ name }}, welcome to {{ location }}!';
      const variables = {
        name: 'John Smith',
        location: 'Community Center',
      };

      const result = processTemplate(template, variables);

      expect(result.processedTemplate).toBe('Hello John Smith, welcome to Community Center!');
      expect(result.substitutions).toEqual({
        name: 'John Smith',
        location: 'Community Center',
      });
    });

    it('should handle variables with whitespace', () => {
      const template = '{{  participant_name  }} was at {{location }}';
      const variables = {
        participant_name: 'Jane Doe',
        location: 'Main Hall',
      };

      const result = processTemplate(template, variables);

      expect(result.processedTemplate).toBe('Jane Doe was at Main Hall');
      expect(result.substitutions).toEqual({
        participant_name: 'Jane Doe',
        location: 'Main Hall',
      });
    });

    it('should leave unmatched variables as placeholders', () => {
      const template = 'Name: {{ name }}, Age: {{ age }}, City: {{ city }}';
      const variables = {
        name: 'John Smith',
        city: 'Sydney',
        // age is missing
      };

      const result = processTemplate(template, variables);

      expect(result.processedTemplate).toBe('Name: John Smith, Age: {{ age }}, City: Sydney');
      expect(result.substitutions).toEqual({
        name: 'John Smith',
        city: 'Sydney',
        age: '{{ age }}', // Placeholder kept
      });
    });

    it('should handle empty and null values', () => {
      const template = 'Value1: {{ value1 }}, Value2: {{ value2 }}';
      const variables = {
        value1: '',
        value2: null,
      };

      const result = processTemplate(template, variables);

      expect(result.processedTemplate).toBe('Value1: , Value2: null');
      expect(result.substitutions).toEqual({
        value1: '',
        value2: 'null',
      });
    });

    it('should handle numeric and boolean values', () => {
      const template = 'Count: {{ count }}, Active: {{ active }}';
      const variables = {
        count: 42,
        active: true,
      };

      const result = processTemplate(template, variables);

      expect(result.processedTemplate).toBe('Count: 42, Active: true');
      expect(result.substitutions).toEqual({
        count: '42',
        active: 'true',
      });
    });

    it('should handle complex nested variables', () => {
      const template = `
Incident Report:
Participant: {{ participant_name }}
Reporter: {{ reporter_name }}
Date: {{ event_datetime }}

Before Event:
{{ before_event }}

During Event:
{{ during_event }}
      `.trim();

      const result = processTemplate(template, MOCK_INCIDENT_DATA);

      expect(result.processedTemplate).toContain('Participant: John Smith');
      expect(result.processedTemplate).toContain('Reporter: Sarah Wilson');
      expect(result.processedTemplate).toContain('Before Event:\nParticipant was participating');
      expect(result.substitutions.participant_name).toBe('John Smith');
    });

    it('should handle variables that do not exist', () => {
      const template = 'Known: {{ known }}, Unknown: {{ unknown }}';
      const variables = {
        known: 'value',
      };

      const result = processTemplate(template, variables);

      expect(result.processedTemplate).toBe('Known: value, Unknown: {{ unknown }}');
      expect(result.substitutions).toEqual({
        known: 'value',
        unknown: '{{ unknown }}',
      });
    });

    it('should handle malformed template syntax gracefully', () => {
      const template = 'Good: {{ good }}, Bad: {{ bad, Missing: {{ missing }}';
      const variables = {
        good: 'value',
        bad: 'value',
        missing: 'value',
      };

      const result = processTemplate(template, variables);

      // Should only replace well-formed variables
      expect(result.processedTemplate).toContain('Good: value');
      expect(result.processedTemplate).toContain('Missing: value');
      expect(result.processedTemplate).toContain('Bad: {{ bad'); // Malformed left as-is
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate all required variables are provided', () => {
      const template = 'Hello {{ name }}, you are at {{ location }}';
      const providedVariables = {
        name: 'John',
        location: 'Center',
      };

      const result = validateTemplateVariables(template, providedVariables);

      expect(result.isValid).toBe(true);
      expect(result.requiredVariables).toEqual(['name', 'location']);
      expect(result.missingVariables).toEqual([]);
      expect(result.unusedVariables).toEqual([]);
    });

    it('should detect missing variables', () => {
      const template = 'Hello {{ name }}, you are at {{ location }} on {{ date }}';
      const providedVariables = {
        name: 'John',
        location: 'Center',
        // date is missing
      };

      const result = validateTemplateVariables(template, providedVariables);

      expect(result.isValid).toBe(false);
      expect(result.requiredVariables).toEqual(['name', 'location', 'date']);
      expect(result.missingVariables).toEqual(['date']);
      expect(result.unusedVariables).toEqual([]);
    });

    it('should detect unused variables', () => {
      const template = 'Hello {{ name }}';
      const providedVariables = {
        name: 'John',
        location: 'Center', // Not used in template
        age: 30, // Not used in template
      };

      const result = validateTemplateVariables(template, providedVariables);

      expect(result.isValid).toBe(true);
      expect(result.requiredVariables).toEqual(['name']);
      expect(result.missingVariables).toEqual([]);
      expect(result.unusedVariables).toEqual(['location', 'age']);
    });

    it('should handle templates with no variables', () => {
      const template = 'This is a static template with no variables';
      const providedVariables = {
        unused: 'value',
      };

      const result = validateTemplateVariables(template, providedVariables);

      expect(result.isValid).toBe(true);
      expect(result.requiredVariables).toEqual([]);
      expect(result.missingVariables).toEqual([]);
      expect(result.unusedVariables).toEqual(['unused']);
    });

    it('should handle duplicate variables in template', () => {
      const template = 'Hello {{ name }}, nice to meet you {{ name }}!';
      const providedVariables = {
        name: 'John',
      };

      const result = validateTemplateVariables(template, providedVariables);

      expect(result.isValid).toBe(true);
      expect(result.requiredVariables).toEqual(['name']); // Should deduplicate
      expect(result.missingVariables).toEqual([]);
    });

    it('should handle complex variable names', () => {
      const template = 'Data: {{ complex_variable_name }}, More: {{ another-var }}';
      const providedVariables = {
        'complex_variable_name': 'value1',
        'another-var': 'value2',
      };

      const result = validateTemplateVariables(template, providedVariables);

      expect(result.isValid).toBe(true);
      expect(result.requiredVariables).toEqual(['complex_variable_name', 'another-var']);
    });
  });

  describe('getProcessedPrompt (Convex Query)', () => {
    let mockContext: any;

    beforeEach(() => {
      mockContext = createMockConvexContext();
    });

    it('should get and process active prompt successfully', async () => {
      const mockPromptData = {
        prompt_name: 'generate_clarification_questions',
        prompt_version: 'v1.0.0',
        prompt_template: 'Hello {{ name }}, welcome to {{ location }}',
        ai_model: 'openai/gpt-4.1-nano',
        max_tokens: 1000,
        temperature: 0.7,
        is_active: true,
      };

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockPromptData),
          }),
        }),
      });

      const variables = { name: 'John', location: 'Center' };
      const result = await getProcessedPrompt(mockContext, {
        promptName: 'generate_clarification_questions',
        variables,
      });

      expect(result).toEqual({
        name: 'generate_clarification_questions',
        version: 'v1.0.0',
        processedTemplate: 'Hello John, welcome to Center',
        originalTemplate: 'Hello {{ name }}, welcome to {{ location }}',
        substitutions: {
          name: 'John',
          location: 'Center',
        },
        model: 'openai/gpt-4.1-nano',
        maxTokens: 1000,
        temperature: 0.7,
      });
    });

    it('should get specific prompt version', async () => {
      const mockPromptData = {
        prompt_name: 'test_prompt',
        prompt_version: 'v2.0.0',
        prompt_template: 'Version 2 template {{ var }}',
        ai_model: 'claude-3-sonnet',
        max_tokens: 1500,
        temperature: 0.5,
      };

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          first: jest.fn().mockResolvedValue(mockPromptData),
        }),
      });

      const result = await getProcessedPrompt(mockContext, {
        promptName: 'test_prompt',
        variables: { var: 'test' },
        promptVersion: 'v2.0.0',
      });

      expect(result.version).toBe('v2.0.0');
      expect(result.processedTemplate).toBe('Version 2 template test');
      expect(result.model).toBe('claude-3-sonnet');
    });

    it('should throw error when prompt not found', async () => {
      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(
        getProcessedPrompt(mockContext, {
          promptName: 'nonexistent_prompt',
          variables: {},
        })
      ).rejects.toThrow('Prompt not found: nonexistent_prompt');
    });

    it('should use default model when not specified', async () => {
      const mockPromptData = {
        prompt_name: 'test_prompt',
        prompt_version: 'v1.0.0',
        prompt_template: 'Template {{ var }}',
        // ai_model is null/undefined
        max_tokens: null,
        temperature: null,
      };

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockPromptData),
          }),
        }),
      });

      const result = await getProcessedPrompt(mockContext, {
        promptName: 'test_prompt',
        variables: { var: 'value' },
      });

      expect(result.model).toBe('openai/gpt-4.1-nano'); // Default model
      expect(result.maxTokens).toBeNull();
      expect(result.temperature).toBeNull();
    });
  });

  describe('getTemplateVariables (Convex Query)', () => {
    let mockContext: any;

    beforeEach(() => {
      mockContext = createMockConvexContext();
    });

    it('should extract template variables correctly', async () => {
      const mockPromptData = {
        prompt_name: 'test_prompt',
        prompt_version: 'v1.0.0',
        prompt_template: 'Hello {{ name }}, you are {{ age }} years old at {{ location }}',
        input_schema: { name: 'string', age: 'number', location: 'string' },
        output_schema: { greeting: 'string' },
        description: 'A test greeting prompt',
      };

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockPromptData),
          }),
        }),
      });

      const result = await getTemplateVariables(mockContext, {
        promptName: 'test_prompt',
      });

      expect(result).toEqual({
        promptName: 'test_prompt',
        promptVersion: 'v1.0.0',
        requiredVariables: ['name', 'age', 'location'],
        inputSchema: { name: 'string', age: 'number', location: 'string' },
        outputSchema: { greeting: 'string' },
        description: 'A test greeting prompt',
      });
    });

    it('should handle prompts with no variables', async () => {
      const mockPromptData = {
        prompt_name: 'static_prompt',
        prompt_version: 'v1.0.0',
        prompt_template: 'This is a static prompt with no variables',
        input_schema: null,
        output_schema: null,
        description: null,
      };

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(mockPromptData),
          }),
        }),
      });

      const result = await getTemplateVariables(mockContext, {
        promptName: 'static_prompt',
      });

      expect(result.requiredVariables).toEqual([]);
    });

    it('should throw error for nonexistent prompt', async () => {
      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(
        getTemplateVariables(mockContext, {
          promptName: 'nonexistent_prompt',
        })
      ).rejects.toThrow('Prompt not found: nonexistent_prompt');
    });
  });

  describe('getABTestPrompt (Convex Query)', () => {
    let mockContext: any;

    beforeEach(() => {
      mockContext = createMockConvexContext();
    });

    it('should return single prompt when only one active', async () => {
      const mockPromptData = {
        prompt_name: 'test_prompt',
        prompt_version: 'v1.0.0',
        prompt_template: 'Single prompt template',
      };

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            collect: jest.fn().mockResolvedValue([mockPromptData]),
          }),
        }),
      });

      const result = await getABTestPrompt(mockContext, {
        promptName: 'test_prompt',
      });

      expect(result).toEqual(mockPromptData);
    });

    it('should perform A/B testing with multiple active prompts', async () => {
      const mockPromptDataA = {
        prompt_name: 'test_prompt',
        prompt_version: 'v1.0.0',
        prompt_template: 'Version A template',
      };

      const mockPromptDataB = {
        prompt_name: 'test_prompt',
        prompt_version: 'v2.0.0',
        prompt_template: 'Version B template',
      };

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            collect: jest.fn().mockResolvedValue([mockPromptDataA, mockPromptDataB]),
          }),
        }),
      });

      // Test with consistent user ID for predictable results
      const result1 = await getABTestPrompt(mockContext, {
        promptName: 'test_prompt',
        userId: 'consistent-user-id' as any,
        testRatio: 0.5,
      });

      const result2 = await getABTestPrompt(mockContext, {
        promptName: 'test_prompt',
        userId: 'consistent-user-id' as any,
        testRatio: 0.5,
      });

      // Same user should get same result
      expect(result1).toEqual(result2);
      expect([mockPromptDataA, mockPromptDataB]).toContain(result1);
    });

    it('should handle different test ratios', async () => {
      const mockPrompts = [
        { prompt_version: 'v1.0.0', template: 'A' },
        { prompt_version: 'v2.0.0', template: 'B' },
      ];

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            collect: jest.fn().mockResolvedValue(mockPrompts),
          }),
        }),
      });

      // Test with ratio 0 (everyone gets version A)
      const resultRatio0 = await getABTestPrompt(mockContext, {
        promptName: 'test_prompt',
        userId: 'test-user' as any,
        testRatio: 0,
      });

      expect(resultRatio0.prompt_version).toBe('v1.0.0');

      // Test with ratio 1 (everyone gets version B)
      const resultRatio1 = await getABTestPrompt(mockContext, {
        promptName: 'test_prompt',
        userId: 'test-user' as any,
        testRatio: 1,
      });

      expect(resultRatio1.prompt_version).toBe('v2.0.0');
    });

    it('should throw error when no active prompts found', async () => {
      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            collect: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        getABTestPrompt(mockContext, {
          promptName: 'nonexistent_prompt',
        })
      ).rejects.toThrow('No active prompts found for: nonexistent_prompt');
    });

    it('should handle anonymous users consistently', async () => {
      const mockPrompts = [
        { prompt_version: 'v1.0.0' },
        { prompt_version: 'v2.0.0' },
      ];

      mockContext.db.query.mockReturnValue({
        withIndex: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            collect: jest.fn().mockResolvedValue(mockPrompts),
          }),
        }),
      });

      const result1 = await getABTestPrompt(mockContext, {
        promptName: 'test_prompt',
        // No userId - should use 'anonymous'
      });

      const result2 = await getABTestPrompt(mockContext, {
        promptName: 'test_prompt',
        // No userId - should use 'anonymous'
      });

      // Anonymous users should get consistent results
      expect(result1).toEqual(result2);
    });
  });

  describe('AI_OPERATION_PROMPTS Constants', () => {
    it('should have all four core operation prompts', () => {
      expect(AI_OPERATION_PROMPTS).toHaveProperty('generateClarificationQuestions');
      expect(AI_OPERATION_PROMPTS).toHaveProperty('enhanceNarrativeContent');
      expect(AI_OPERATION_PROMPTS).toHaveProperty('analyzeContributingConditions');
      expect(AI_OPERATION_PROMPTS).toHaveProperty('generateMockAnswers');
    });

    it('should have correct structure for clarification questions prompt', () => {
      const prompt = AI_OPERATION_PROMPTS.generateClarificationQuestions;
      
      expect(prompt.name).toBe('generate_clarification_questions');
      expect(prompt.version).toBe('v1.0.0');
      expect(prompt.template).toContain('{{ participant_name }}');
      expect(prompt.template).toContain('{{ reporter_name }}');
      expect(prompt.template).toContain('JSON');
      expect(prompt.variables).toContain('participant_name');
      expect(prompt.variables).toContain('before_event');
      expect(prompt.variables).toContain('during_event');
      expect(prompt.variables).toContain('end_of_event');
      expect(prompt.variables).toContain('post_event_support');
    });

    it('should have correct structure for enhance narrative prompt', () => {
      const prompt = AI_OPERATION_PROMPTS.enhanceNarrativeContent;
      
      expect(prompt.name).toBe('enhance_narrative_content');
      expect(prompt.template).toContain('{{ phase }}');
      expect(prompt.template).toContain('{{ narrative_facts }}');
      expect(prompt.template).toContain('{{ instruction }}');
      expect(prompt.variables).toEqual(['phase', 'narrative_facts', 'instruction']);
    });

    it('should have correct structure for analyze conditions prompt', () => {
      const prompt = AI_OPERATION_PROMPTS.analyzeContributingConditions;
      
      expect(prompt.name).toBe('analyze_contributing_conditions');
      expect(prompt.template).toContain('{{ reporter_name }}');
      expect(prompt.template).toContain('{{ before_event }}');
      expect(prompt.template).toContain('{{ before_event_extra }}');
      expect(prompt.template).toContain('Immediate Contributing Conditions');
      expect(prompt.variables).toContain('before_event_extra');
      expect(prompt.variables).toContain('during_event_extra');
      expect(prompt.variables).toContain('end_of_event_extra');
      expect(prompt.variables).toContain('post_event_support_extra');
    });

    it('should have correct structure for mock answers prompt', () => {
      const prompt = AI_OPERATION_PROMPTS.generateMockAnswers;
      
      expect(prompt.name).toBe('generate_mock_answers');
      expect(prompt.template).toContain('{{ participant_name }}');
      expect(prompt.template).toContain('{{ phase }}');
      expect(prompt.template).toContain('{{ questions }}');
      expect(prompt.template).toContain('```json');
      expect(prompt.variables).toContain('participant_name');
      expect(prompt.variables).toContain('phase_narrative');
    });

    it('should have valid template syntax in all prompts', () => {
      Object.values(AI_OPERATION_PROMPTS).forEach(prompt => {
        // Check that all variables in the template are declared
        const templateVariables = [];
        const matches = prompt.template.match(/\{\{\s*([^}]+)\s*\}\}/g);
        
        if (matches) {
          matches.forEach(match => {
            const variable = match.replace(/\{\{\s*|\s*\}\}/g, '');
            templateVariables.push(variable);
          });
          
          // Remove duplicates
          const uniqueVariables = [...new Set(templateVariables)];
          
          // All template variables should be in the declared variables array
          uniqueVariables.forEach(templateVar => {
            expect(prompt.variables).toContain(templateVar);
          });
        }
      });
    });

    it('should process real incident data correctly', () => {
      const clarificationPrompt = AI_OPERATION_PROMPTS.generateClarificationQuestions;
      
      const result = processTemplate(clarificationPrompt.template, MOCK_INCIDENT_DATA);
      
      expect(result.processedTemplate).toContain('John Smith');
      expect(result.processedTemplate).toContain('Sarah Wilson');
      expect(result.processedTemplate).toContain('Community Day Program');
      expect(result.processedTemplate).toContain('<before_event>Participant was participating');
      expect(result.processedTemplate).toContain('<during_event>An altercation occurred');
      
      // Should not contain any unsubstituted variables
      expect(result.processedTemplate).not.toContain('{{ participant_name }}');
      expect(result.processedTemplate).not.toContain('{{ reporter_name }}');
    });
  });
});