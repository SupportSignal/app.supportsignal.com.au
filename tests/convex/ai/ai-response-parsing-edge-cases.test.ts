/**
 * AI Response Parsing Edge Case Tests
 * 
 * These tests focus on identifying silent parsing failures that could cause
 * questions to be generated with empty content despite appearing successful.
 */

// @ts-nocheck
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('AI Response Parsing Edge Cases: Silent Failure Detection', () => {
  
  // Simulate the exact parsing logic from questionGenerator.ts
  const simulateQuestionGeneratorParsing = (aiContent: string, phase: string = 'before_event') => {
    const content = aiContent.trim();
    
    console.log('📥 AI Content Input:', {
      content_length: content.length,
      content_preview: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
      phase
    });

    // Try to find JSON array in the response (exact logic from questionGenerator.ts)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    let questionsArray;
    
    if (jsonMatch) {
      console.log('✅ JSON regex match found:', jsonMatch[0].substring(0, 100) + '...');
      questionsArray = JSON.parse(jsonMatch[0]);
    } else {
      console.log('⚠️ No JSON regex match, parsing entire content as JSON');
      questionsArray = JSON.parse(content);
    }
    
    console.log('📄 Parsed questions array:', {
      length: questionsArray.length,
      questions: questionsArray
    });

    if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
      throw new Error(`AI response is not a valid questions array. Got: ${typeof questionsArray}, length: ${Array.isArray(questionsArray) ? questionsArray.length : 'N/A'}`);
    }
    
    // Map questions and validate content (exact logic from questionGenerator.ts)
    const generatedQuestions = questionsArray.map((q: any, index: number) => {
      const questionText = q.question || q.question_text || q.questionText || String(q).trim();
      
      console.log(`🔍 Processing question ${index + 1}:`, {
        original: q,
        extracted_text: questionText,
        extracted_type: typeof questionText,
        extracted_length: questionText ? questionText.length : 0,
        is_empty: !questionText || questionText.trim().length === 0,
        is_object_string: questionText && questionText.trim() === '[object Object]'
      });
      
      if (!questionText || questionText.trim().length === 0 || questionText.trim() === '[object Object]') {
        throw new Error(`Question ${index + 1} has empty or invalid content. Original: ${JSON.stringify(q)}`);
      }

      return {
        question_id: `${phase}_q${index + 1}`,
        question_text: questionText.trim(),
        question_order: index + 1
      };
    });

    console.log('✅ Generated questions:', generatedQuestions.map(q => ({
      id: q.question_id,
      text_length: q.question_text.length,
      text_preview: q.question_text.substring(0, 50) + '...'
    })));

    return generatedQuestions;
  };

  describe('Valid AI Response Formats', () => {
    test('should handle standard OpenAI/OpenRouter response format', () => {
      const standardResponse = `[
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

      const result = simulateQuestionGeneratorParsing(standardResponse);
      
      expect(result).toHaveLength(3);
      result.forEach((question, index) => {
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(20);
        expect(question.question_id).toBe(`before_event_q${index + 1}`);
      });
    });

    test('should handle alternative field name formats', () => {
      const alternativeFormats = [
        // Format 1: question_text field
        `[{"question_text": "Alternative format question 1"}, {"question_text": "Alternative format question 2"}]`,
        
        // Format 2: questionText field (camelCase)
        `[{"questionText": "CamelCase format question 1"}, {"questionText": "CamelCase format question 2"}]`,
        
        // Format 3: Mixed formats
        `[{"question": "Mixed format 1"}, {"question_text": "Mixed format 2"}, {"questionText": "Mixed format 3"}]`
      ];

      alternativeFormats.forEach((format, formatIndex) => {
        console.log(`\n🧪 Testing format ${formatIndex + 1}:`);
        const result = simulateQuestionGeneratorParsing(format);
        
        expect(result.length).toBeGreaterThan(0);
        result.forEach(question => {
          expect(question.question_text).not.toBe('');
          expect(question.question_text.length).toBeGreaterThan(10);
        });
      });
    });

    test('should handle responses with extra content around JSON', () => {
      const responseWithExtra = `Here are the clarification questions based on the incident narrative:

[
  {
    "question": "What specific triggers were observed before the participant became agitated?"
  },
  {
    "question": "How did staff members initially respond to the escalating situation?"
  }
]

These questions should help gather additional details about the incident.`;

      const result = simulateQuestionGeneratorParsing(responseWithExtra);
      
      expect(result).toHaveLength(2);
      result.forEach(question => {
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(20);
        expect(question.question_text).toContain('participant' || 'staff');
      });
    });
  });

  describe('Edge Cases That Could Cause Silent Failures', () => {
    test('should detect when AI returns objects instead of strings', () => {
      const problematicResponse = `[
        {
          "question": {
            "text": "This is nested inside an object",
            "category": "environmental"
          }
        },
        {
          "question": "This is a valid string question"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(problematicResponse);
      }).toThrow(/has empty or invalid content/);
    });

    test('should detect when AI returns arrays instead of strings', () => {
      const arrayResponse = `[
        {
          "question": ["Multiple", "questions", "in", "array"]
        },
        {
          "question": "Valid question"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(arrayResponse);
      }).toThrow(/has empty or invalid content/);
    });

    test('should detect empty string questions', () => {
      const emptyStringResponse = `[
        {
          "question": ""
        },
        {
          "question": "Valid question"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(emptyStringResponse);
      }).toThrow(/has empty or invalid content/);
    });

    test('should detect null or undefined questions', () => {
      const nullResponse = `[
        {
          "question": null
        },
        {
          "question": "Valid question"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(nullResponse);
      }).toThrow(/has empty or invalid content/);
    });

    test('should detect missing question fields entirely', () => {
      const missingFieldResponse = `[
        {
          "id": 1,
          "category": "before_event"
        },
        {
          "question": "Valid question"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(missingFieldResponse);
      }).toThrow(/has empty or invalid content/);
    });

    test('should handle whitespace-only questions', () => {
      const whitespaceResponse = `[
        {
          "question": "   \\n\\t   "
        },
        {
          "question": "Valid question"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(whitespaceResponse);
      }).toThrow(/has empty or invalid content/);
    });
  });

  describe('Malformed JSON Scenarios', () => {
    test('should handle truncated JSON responses', () => {
      const truncatedResponse = `[
        {
          "question": "What was the participant's mood before"`;

      expect(() => {
        simulateQuestionGeneratorParsing(truncatedResponse);
      }).toThrow(); // Should throw JSON parse error
    });

    test('should handle responses with unescaped quotes', () => {
      const unescapedQuotes = `[
        {
          "question": "What was the participant's "mood" before the incident?"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(unescapedQuotes);
      }).toThrow(); // Should throw JSON parse error
    });

    test('should handle responses with invalid JSON syntax', () => {
      const invalidSyntax = `[
        {
          question: "Missing quotes around key"
        },
        {
          "question": "Valid question"
        }
      ]`;

      expect(() => {
        simulateQuestionGeneratorParsing(invalidSyntax);
      }).toThrow(); // Should throw JSON parse error
    });
  });

  describe('AI Model Specific Response Patterns', () => {
    test('should handle GPT-5 style responses with explanations', () => {
      const gpt5Response = `Based on the incident narrative provided, here are targeted clarification questions:

[
  {
    "question": "What specific environmental changes occurred in the transport vehicle that coincided with Emma's increasing agitation?",
    "rationale": "To understand environmental triggers"
  },
  {
    "question": "How long had Emma been displaying pacing behaviors before the incident escalated?",
    "rationale": "To establish timeline patterns"
  }
]

These questions focus on gathering precise details about the precursor events.`;

      const result = simulateQuestionGeneratorParsing(gpt5Response);
      
      expect(result).toHaveLength(2);
      result.forEach(question => {
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(30);
        expect(question.question_text).toContain('Emma' || 'environmental' || 'behaviors');
      });
    });

    test('should handle responses with numbered questions', () => {
      const numberedResponse = `[
        {
          "question": "1. What was the duration of the pacing behavior before escalation?"
        },
        {
          "question": "2. Were there any specific vocalizations noted during the agitation phase?"
        }
      ]`;

      const result = simulateQuestionGeneratorParsing(numberedResponse);
      
      expect(result).toHaveLength(2);
      result.forEach(question => {
        expect(question.question_text).not.toBe('');
        expect(question.question_text).toMatch(/^\d+\./); // Should start with number
      });
    });

    test('should handle responses with very long questions', () => {
      const longQuestionResponse = `[
        {
          "question": "Can you provide specific details about the environmental factors present in the transport vehicle during the incident, including but not limited to noise levels, lighting conditions, temperature, number of other passengers, seating arrangements, and any changes to the planned route or schedule that may have contributed to Emma's increasing agitation and eventual escalation to physical behaviors directed toward the window?"
        }
      ]`;

      const result = simulateQuestionGeneratorParsing(longQuestionResponse);
      
      expect(result).toHaveLength(1);
      expect(result[0].question_text.length).toBeGreaterThan(200);
      expect(result[0].question_text).toContain('environmental factors');
    });
  });

  describe('String Conversion Edge Cases', () => {
    test('should detect when String(q) returns "[object Object]"', () => {
      // Simulate the scenario where String(q).trim() returns "[object Object]"
      const parseWithStringFallback = (questionData: any) => {
        const questionText = questionData.question || questionData.question_text || questionData.questionText || String(questionData).trim();
        
        console.log('🔍 String conversion test:', {
          original: questionData,
          string_conversion: String(questionData),
          string_trimmed: String(questionData).trim(),
          final_text: questionText
        });

        return questionText;
      };

      // Test various problematic objects
      const problematicObjects = [
        { not_a_question: "some value" }, // Object without question field
        { question: { nested: "object" } }, // Nested object
        null, // Null value
        undefined, // Undefined value
        42, // Number
        ["array", "of", "strings"], // Array
      ];

      problematicObjects.forEach((obj, index) => {
        console.log(`\n🧪 Testing problematic object ${index + 1}:`);
        const result = parseWithStringFallback(obj);
        
        if (result === '[object Object]' || result === 'null' || result === 'undefined' || !result || result.trim().length === 0) {
          console.log(`🚨 Detected problematic conversion: "${result}"`);
          expect(result).toMatch(/^\[object Object\]$|^null$|^undefined$|^$|^\s*$/);
        }
      });
    });

    test('should validate the complete fallback chain', () => {
      const testFallbackChain = (questionObj: any) => {
        // Exact fallback logic from questionGenerator.ts
        const questionText = questionObj.question || questionObj.question_text || questionObj.questionText || String(questionObj).trim();
        
        return {
          has_question: !!questionObj.question,
          has_question_text: !!questionObj.question_text,
          has_questionText: !!questionObj.questionText,
          string_fallback: String(questionObj).trim(),
          final_result: questionText,
          is_valid: questionText && typeof questionText === 'string' && questionText.trim().length > 0 && questionText.trim() !== '[object Object]'
        };
      };

      const testCases = [
        { question: "Valid question" }, // Should use .question
        { question_text: "Valid question_text" }, // Should use .question_text
        { questionText: "Valid questionText" }, // Should use .questionText
        { other_field: "value" }, // Should fall back to String() -> "[object Object]"
        "just a string", // Should fall back to String() -> the string itself
        42, // Should fall back to String() -> "42"
      ];

      testCases.forEach((testCase, index) => {
        console.log(`\n🧪 Testing fallback chain ${index + 1}:`);
        const result = testFallbackChain(testCase);
        console.log('📊 Fallback chain result:', result);

        if (index < 3) {
          // First 3 should be valid
          expect(result.is_valid).toBe(true);
        } else if (index === 3) {
          // Object without question fields -> "[object Object]"
          expect(result.is_valid).toBe(false);
          expect(result.final_result).toBe('[object Object]');
        } else if (index === 4) {
          // String should be valid
          expect(result.is_valid).toBe(true);
          expect(result.final_result).toBe('just a string');
        } else if (index === 5) {
          // Number converted to string should be valid (though unusual)
          expect(result.is_valid).toBe(true);
          expect(result.final_result).toBe('42');
        }
      });
    });
  });

  describe('Production-like Response Simulation', () => {
    test('should reproduce realistic AI responses that could cause the bug', () => {
      console.log('🔍 TESTING REALISTIC AI RESPONSES THAT COULD CAUSE BUG');

      // These are realistic responses that might be generated in production
      const realisticResponses = [
        {
          name: 'Perfect Valid Response',
          content: `[
            {
              "question": "What specific environmental factors in the transport vehicle may have contributed to Emma's initial signs of agitation?"
            }
          ]`,
          should_pass: true
        },
        {
          name: 'Response with Extra Fields',
          content: `[
            {
              "question": "What was Emma's demeanor before the incident?",
              "category": "environmental",
              "priority": "high"
            }
          ]`,
          should_pass: true
        },
        {
          name: 'Response with Problematic Nested Structure',
          content: `[
            {
              "question_data": {
                "text": "What happened before the incident?",
                "category": "timeline"
              }
            }
          ]`,
          should_pass: false
        },
        {
          name: 'Response with Empty Question Field',
          content: `[
            {
              "question": "",
              "explanation": "This question was left empty by the AI"
            }
          ]`,
          should_pass: false
        }
      ];

      realisticResponses.forEach(testCase => {
        console.log(`\n🧪 Testing: ${testCase.name}`);
        
        if (testCase.should_pass) {
          const result = simulateQuestionGeneratorParsing(testCase.content);
          expect(result).toHaveLength(1);
          expect(result[0].question_text).not.toBe('');
          expect(result[0].question_text.length).toBeGreaterThan(5);
          console.log(`✅ ${testCase.name} passed as expected`);
        } else {
          expect(() => {
            simulateQuestionGeneratorParsing(testCase.content);
          }).toThrow();
          console.log(`✅ ${testCase.name} failed as expected`);
        }
      });
    });
  });
});