/**
 * AI Response Schemas
 *
 * Zod schemas defining expected AI response formats for structured outputs.
 * These schemas are used with OpenRouter's response_format parameter to guarantee
 * response format compliance across different AI models.
 *
 * Related: Story 6.5 (Model management), Story 6.6 (Schema separation)
 */

import { z } from 'zod';

/**
 * Mock Answer Schema
 * Used for generating mock clarification answers during development/testing
 *
 * IMPORTANT: OpenRouter requires root schema to be an object, not array
 * So we wrap the array in an object with an "answers" property
 */
export const MockAnswerSchema = z.object({
  question_id: z.string().describe('ID of the question being answered'),
  answer: z.string().describe('Generated mock answer text'),
});

// Root must be object for OpenRouter structured outputs
export const MockAnswersResponseSchema = z.object({
  answers: z.array(MockAnswerSchema).describe('Array of mock answers'),
});

/**
 * Type exports for use in code
 */
export type MockAnswer = z.infer<typeof MockAnswerSchema>;
export type MockAnswersResponse = z.infer<typeof MockAnswersResponseSchema>;

/**
 * Clarification Question Schema
 * Used for generating phase-specific clarification questions
 */
export const ClarificationQuestionSchema = z.object({
  question_id: z.string().describe('Unique identifier for the question'),
  question_text: z.string().describe('The question to ask'),
  context: z.string().optional().describe('Additional context for the question'),
  priority: z.enum(['high', 'medium', 'low']).optional().describe('Question importance'),
});

export const ClarificationQuestionsResponseSchema = z.array(ClarificationQuestionSchema);

export type ClarificationQuestion = z.infer<typeof ClarificationQuestionSchema>;
export type ClarificationQuestionsResponse = z.infer<typeof ClarificationQuestionsResponseSchema>;

/**
 * Narrative Enhancement Schema
 * Used for AI-powered narrative enhancement
 */
export const NarrativeEnhancementSchema = z.object({
  enhanced_narrative: z.string().describe('Enhanced narrative text'),
  improvements_made: z.array(z.string()).optional().describe('List of improvements applied'),
  confidence_score: z.number().min(0).max(1).optional().describe('AI confidence in enhancement quality'),
});

export type NarrativeEnhancement = z.infer<typeof NarrativeEnhancementSchema>;

/**
 * Convert Zod schema to JSON Schema format for OpenRouter
 *
 * @param zodSchema - Zod schema to convert
 * @param name - Name for the schema
 * @returns JSON Schema object compatible with OpenRouter's response_format
 */
export function zodToJsonSchema(zodSchema: z.ZodType<any>, name: string) {
  // For now, we'll manually construct JSON schemas
  // In future, we can use zod-to-json-schema library for automatic conversion

  if (zodSchema === MockAnswersResponseSchema) {
    return {
      name,
      strict: true,
      schema: {
        type: 'object',
        properties: {
          answers: {
            type: 'array',
            description: 'Array of mock answers',
            items: {
              type: 'object',
              properties: {
                question_id: {
                  type: 'string',
                  description: 'ID of the question being answered',
                },
                answer: {
                  type: 'string',
                  description: 'Generated mock answer text',
                },
              },
              required: ['question_id', 'answer'],
              additionalProperties: false,
            },
          },
        },
        required: ['answers'],
        additionalProperties: false,
      },
    };
  }

  if (zodSchema === ClarificationQuestionsResponseSchema) {
    return {
      name,
      strict: true,
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question_id: {
              type: 'string',
              description: 'Unique identifier for the question',
            },
            question_text: {
              type: 'string',
              description: 'The question to ask',
            },
            context: {
              type: 'string',
              description: 'Additional context for the question',
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Question importance',
            },
          },
          required: ['question_id', 'question_text'],
          additionalProperties: false,
        },
      },
    };
  }

  if (zodSchema === NarrativeEnhancementSchema) {
    return {
      name,
      strict: true,
      schema: {
        type: 'object',
        properties: {
          enhanced_narrative: {
            type: 'string',
            description: 'Enhanced narrative text',
          },
          improvements_made: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of improvements applied',
          },
          confidence_score: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'AI confidence in enhancement quality',
          },
        },
        required: ['enhanced_narrative'],
        additionalProperties: false,
      },
    };
  }

  // Fallback for unknown schemas
  throw new Error(`No JSON Schema mapping defined for schema: ${name}`);
}
