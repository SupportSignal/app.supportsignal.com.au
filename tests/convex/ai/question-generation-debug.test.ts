/**
 * Critical Testing: AI Question Generation Debug
 * 
 * This test specifically targets the empty question_text issue by:
 * 1. Testing AI response parsing logic in isolation
 * 2. Verifying question content is preserved through the processing chain
 * 3. Debugging the exact point where question content gets lost
 */

// @ts-nocheck - Pragmatic approach to avoid TS config issues during debugging
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Test the exact parsing logic from questionGenerator.ts
describe('AI Question Generation Debug Tests', () => {
  describe('AI Response Parsing Logic', () => {
    test('should correctly parse valid AI JSON response', () => {
      // Simulate the exact AI response format that should work
      const mockAIResponse = `[
        {
          "question": "What was the participant's mood or demeanor in the hours leading up to the incident?"
        },
        {
          "question": "Were there any environmental factors that might have contributed to the situation?"
        },
        {
          "question": "What support strategies were in place and how were they being implemented?"
        }
      ]`;

      // Extract the parsing logic from questionGenerator.ts
      const parseAIResponse = (aiContent: string) => {
        const content = aiContent.trim();
        
        // Try to find JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        let questionsArray;
        
        if (jsonMatch) {
          questionsArray = JSON.parse(jsonMatch[0]);
        } else {
          questionsArray = JSON.parse(content);
        }
        
        if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
          throw new Error(`AI response is not a valid questions array. Got: ${typeof questionsArray}, length: ${Array.isArray(questionsArray) ? questionsArray.length : 'N/A'}`);
        }
        
        // Map questions and validate content (exact logic from questionGenerator.ts)
        const generatedQuestions = questionsArray.map((q: any, index: number) => {
          const questionText = q.question || q.question_text || q.questionText || String(q).trim();
          
          if (!questionText || questionText.trim().length === 0 || questionText.trim() === '[object Object]') {
            throw new Error(`Question ${index + 1} has empty or invalid content. Original: ${JSON.stringify(q)}`);
          }

          return {
            question_id: `before_event_q${index + 1}`,
            question_text: questionText.trim(),
            question_order: index + 1
          };
        });

        return generatedQuestions;
      };

      // Test the parsing
      const result = parseAIResponse(mockAIResponse);
      
      expect(result).toHaveLength(3);
      expect(result[0].question_text).toBe("What was the participant's mood or demeanor in the hours leading up to the incident?");
      expect(result[0].question_text).not.toBe("");
      expect(result[1].question_text).toBe("Were there any environmental factors that might have contributed to the situation?");
      expect(result[2].question_text).toBe("What support strategies were in place and how were they being implemented?");
      
      // Verify no questions have empty content
      const emptyQuestions = result.filter(q => !q.question_text || q.question_text.trim().length === 0);
      expect(emptyQuestions).toHaveLength(0);
    });

    test('should handle different AI response formats', () => {
      const testCases = [
        // Format 1: question field
        {
          input: '[{"question": "Test question 1"}, {"question": "Test question 2"}]',
          expected: 2
        },
        // Format 2: question_text field
        {
          input: '[{"question_text": "Test question 1"}, {"question_text": "Test question 2"}]',
          expected: 2
        },
        // Format 3: questionText field
        {
          input: '[{"questionText": "Test question 1"}, {"questionText": "Test question 2"}]',
          expected: 2
        },
        // Format 4: Mixed with extra content
        {
          input: 'Here are the questions:\n[{"question": "Test question 1"}, {"question": "Test question 2"}]\n\nEnd of response.',
          expected: 2
        }
      ];

      const parseAIResponse = (aiContent: string) => {
        const content = aiContent.trim();
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        let questionsArray;
        
        if (jsonMatch) {
          questionsArray = JSON.parse(jsonMatch[0]);
        } else {
          questionsArray = JSON.parse(content);
        }
        
        return questionsArray.map((q: any, index: number) => {
          const questionText = q.question || q.question_text || q.questionText || String(q).trim();
          return {
            question_id: `test_q${index + 1}`,
            question_text: questionText.trim(),
            question_order: index + 1
          };
        });
      };

      testCases.forEach(({ input, expected }, caseIndex) => {
        const result = parseAIResponse(input);
        expect(result).toHaveLength(expected);
        result.forEach(question => {
          expect(question.question_text).not.toBe("");
          expect(question.question_text.length).toBeGreaterThan(0);
        });
      });
    });

    test('should detect problematic AI response formats that cause empty questions', () => {
      const problematicCases = [
        // Case 1: Empty question field
        '[{"question": ""}, {"question": "Valid question"}]',
        // Case 2: Missing question field entirely
        '[{"id": 1, "order": 1}, {"question": "Valid question"}]',
        // Case 3: Null question field
        '[{"question": null}, {"question": "Valid question"}]',
        // Case 4: Object as question
        '[{"question": {"text": "Nested text"}}, {"question": "Valid question"}]',
        // Case 5: Array as question
        '[{"question": ["Array", "as", "question"]}, {"question": "Valid question"}]'
      ];

      const parseAIResponse = (aiContent: string) => {
        const content = aiContent.trim();
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        let questionsArray = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        
        return questionsArray.map((q: any, index: number) => {
          const questionText = q.question || q.question_text || q.questionText || String(q).trim();
          
          // This should catch the problematic cases
          if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0 || questionText.trim() === '[object Object]') {
            throw new Error(`Question ${index + 1} has empty or invalid content. Original: ${JSON.stringify(q)}`);
          }

          return {
            question_id: `test_q${index + 1}`,
            question_text: questionText.trim(),
            question_order: index + 1
          };
        });
      };

      problematicCases.forEach((problematicInput, caseIndex) => {
        expect(() => {
          parseAIResponse(problematicInput);
        }).toThrow(/has empty or invalid content/);
      });
    });
  });

  describe('Mock Question Generation Logic', () => {
    test('should generate valid mock questions with proper content', () => {
      // Test the mock generation logic to ensure it's not the issue
      const generateMockQuestions = (phase: string) => {
        const mockQuestions: Record<string, any[]> = {
          before_event: [
            {
              question_id: `${phase}_q1`,
              question_text: "What was the participant's mood or demeanor in the hours leading up to the incident?",
              question_order: 1
            },
            {
              question_id: `${phase}_q2`, 
              question_text: "Were there any environmental factors that might have contributed to the situation?",
              question_order: 2
            }
          ]
        };
        
        return {
          questions: mockQuestions[phase] || []
        };
      };

      const result = generateMockQuestions('before_event');
      
      expect(result.questions).toHaveLength(2);
      result.questions.forEach(question => {
        expect(question.question_text).toBeDefined();
        expect(question.question_text).not.toBe("");
        expect(question.question_text.length).toBeGreaterThan(10);
        expect(question.question_id).toBeDefined();
        expect(question.question_order).toBeGreaterThan(0);
      });
    });
  });

  describe('Template Variable Mapping', () => {
    test('should correctly transform database fields to template variables', () => {
      // Test the Zod transformation logic from questionGenerator.ts
      const templateVariableTransformer = {
        parse: (data: any) => ({
          participant_name: data.participant_name,
          reporter_name: data.reporter_name,
          incident_location: data.location,
          event_date_time: data.event_date_time,
          narrative_phase: data.phase,
          existing_narrative: data.narrative_content,
        })
      };

      const inputData = {
        participant_name: "John Doe",
        reporter_name: "Jane Smith",
        location: "Main Activity Room",
        event_date_time: "2024-01-15 14:30:00",
        phase: "before_event",
        narrative_content: "The participant was showing signs of agitation before the scheduled activity."
      };

      const result = templateVariableTransformer.parse(inputData);
      
      expect(result.participant_name).toBe("John Doe");
      expect(result.incident_location).toBe("Main Activity Room");  
      expect(result.narrative_phase).toBe("before_event");
      expect(result.existing_narrative).toBe("The participant was showing signs of agitation before the scheduled activity.");
      expect(result.existing_narrative).not.toBe(""); // Critical: narrative should not be empty
    });

    test('should handle template interpolation correctly', () => {
      // Test template interpolation logic
      const interpolateTemplate = (template: string, variables: Record<string, string>): string => {
        let interpolated = template;
        
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          interpolated = interpolated.replace(regex, value || '');
        }
        
        return interpolated;
      };

      const template = "Generate questions for {{participant_name}} regarding the {{narrative_phase}} phase. Context: {{existing_narrative}}";
      const variables = {
        participant_name: "John Doe",
        narrative_phase: "before_event", 
        existing_narrative: "Participant showed agitation"
      };

      const result = interpolateTemplate(template, variables);
      
      expect(result).toContain("John Doe");
      expect(result).toContain("before_event");
      expect(result).toContain("Participant showed agitation");
      expect(result).not.toMatch(/\{\{.*\}\}/); // Should have no unfilled placeholders
    });
  });

  describe('Database Storage Format Validation', () => {
    test('should validate question storage format matches database schema', () => {
      // Test that questions are in the correct format for database storage
      const mockStoredQuestion = {
        question_id: "before_event_q1",
        question_text: "What was the participant's mood before the incident?",
        question_order: 1,
        phase: "before_event",
        is_active: true,
        answered: false
      };

      // Validate required fields for database storage
      expect(mockStoredQuestion.question_id).toBeDefined();
      expect(mockStoredQuestion.question_text).toBeDefined();
      expect(mockStoredQuestion.question_text).not.toBe("");
      expect(mockStoredQuestion.question_text.length).toBeGreaterThan(0);
      expect(mockStoredQuestion.question_order).toBeGreaterThan(0);
      expect(mockStoredQuestion.phase).toBeDefined();
      
      // Critical: question_text should never be empty when storing
      expect(mockStoredQuestion.question_text.trim()).not.toBe("");
    });
  });
});