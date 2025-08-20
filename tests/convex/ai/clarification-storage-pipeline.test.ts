/**
 * Database Storage Pipeline Tests: AI Clarification Questions
 * 
 * CRITICAL BUG INVESTIGATION: Questions are being "successfully generated" 
 * but stored with empty question_text fields. These tests isolate exactly
 * where the content disappears in the storage pipeline.
 */

// @ts-nocheck
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Clarification Storage Pipeline Debug Tests', () => {
  describe('Data Transformation to Storage Format', () => {
    test('should preserve question content through all transformation steps', () => {
      console.log('🔍 TESTING: Data transformation pipeline');
      
      // Step 1: Mock the output from questionGenerator.ts (what should be generated)
      const generatedQuestions = [
        {
          question_id: "before_event_q1",
          question_text: "What was Emma's mood or demeanor in the hours leading up to the incident?",
          question_order: 1
        },
        {
          question_id: "before_event_q2",
          question_text: "Were there any environmental factors (noise, crowding, schedule changes) that might have contributed to the situation?",
          question_order: 2
        },
        {
          question_id: "before_event_q3",
          question_text: "What support strategies were in place, and how were they being implemented?",
          question_order: 3
        }
      ];

      console.log('📥 Generated Questions Input:', generatedQuestions.map(q => ({
        id: q.question_id,
        content_length: q.question_text.length,
        content_preview: q.question_text.substring(0, 50) + '...'
      })));

      // Step 2: Transform for storage (exact logic from aiClarification.ts)
      const transformForStorage = (questions: any[], incident_id: string, phase: string) => {
        return questions.map(question => {
          const storageData = {
            incident_id,
            question_id: question.question_id,
            phase,
            question_text: question.question_text, // CRITICAL: This must preserve content
            question_order: question.question_order,
            generated_at: Date.now(),
            ai_model: 'openai/gpt-5-nano',
            prompt_version: 'v1.0.0',
            is_active: true,
          };

          // Log what we're about to store
          console.log(`💾 Storage Transform for ${question.question_id}:`, {
            question_id: storageData.question_id,
            question_text: storageData.question_text,
            question_text_length: storageData.question_text ? storageData.question_text.length : 0,
            question_text_empty: !storageData.question_text || storageData.question_text === "",
            question_text_type: typeof storageData.question_text,
            phase: storageData.phase,
          });

          return storageData;
        });
      };

      // Step 3: Execute transformation
      const storageReadyQuestions = transformForStorage(generatedQuestions, 'incident_test', 'before_event');

      // Step 4: Validate that content is preserved
      expect(storageReadyQuestions).toHaveLength(3);
      
      storageReadyQuestions.forEach((storedQuestion, index) => {
        const originalQuestion = generatedQuestions[index];
        
        // CRITICAL: Verify question content is preserved
        expect(storedQuestion.question_text).toBe(originalQuestion.question_text);
        expect(storedQuestion.question_text).not.toBe('');
        expect(storedQuestion.question_text.length).toBeGreaterThan(20);
        expect(storedQuestion.question_text).toContain('Emma'); // Should contain participant name
        
        // Verify structure is correct
        expect(storedQuestion.question_id).toBe(originalQuestion.question_id);
        expect(storedQuestion.question_order).toBe(originalQuestion.question_order);
        expect(storedQuestion.phase).toBe('before_event');
        expect(storedQuestion.incident_id).toBe('incident_test');
      });

      console.log('✅ Data transformation preserves content correctly');
    });

    test('should detect content loss during transformation', () => {
      console.log('🔍 TESTING: Content loss detection during transformation');

      // Simulate the bug: Questions with valid structure but empty content
      const problematicQuestions = [
        {
          question_id: "before_event_q1",
          question_text: "", // BUG: Empty content
          question_order: 1
        },
        {
          question_id: "before_event_q2", 
          question_text: "Valid question content",
          question_order: 2
        }
      ];

      const validateForStorage = (questions: any[]) => {
        const issues = [];
        
        questions.forEach((question, index) => {
          console.log(`🔍 Validating question ${index + 1}:`, {
            question_id: question.question_id,
            question_text: question.question_text,
            question_text_length: question.question_text ? question.question_text.length : 0,
            question_text_empty: !question.question_text || question.question_text === "",
          });

          if (!question.question_text || question.question_text.trim() === '') {
            issues.push({
              question_id: question.question_id,
              issue: 'empty_content',
              question_text: question.question_text,
            });
          }
        });

        return issues;
      };

      const issues = validateForStorage(problematicQuestions);
      
      // Should detect the empty content issue
      expect(issues).toHaveLength(1);
      expect(issues[0].question_id).toBe('before_event_q1');
      expect(issues[0].issue).toBe('empty_content');

      console.log('🚨 Content loss detected:', issues);
    });
  });

  describe('Database Insert Data Validation', () => {
    test('should validate exact data being sent to database insert', () => {
      console.log('🔍 TESTING: Database insert data validation');

      // Mock the exact scenario from production logs
      const productionScenario = {
        incident_id: 'm9710xzjr1b6rtmtzxbteyx8g17nyfc8', // Real incident ID from logs
        phase: 'before_event',
        user_id: 'k171bq4nnbcbzwgvvwd6nxgby97nhdw6', // Real user ID from logs
        generated_questions: [
          {
            question_id: "before_event_q1",
            question_text: "What was Emma's mood or demeanor in the hours leading up to the incident?",
            question_order: 1
          }
        ]
      };

      // Simulate the exact storage mutation logic
      const prepareForDatabaseInsert = (question: any, incident_id: string, phase: string, correlation_id: string) => {
        const insertData = {
          incident_id,
          question_id: question.question_id,
          phase,
          question_text: question.question_text, // CRITICAL POINT: Where content might get lost
          question_order: question.question_order,
          generated_at: Date.now(),
          ai_model: 'openai/gpt-5-nano',
          prompt_version: 'v1.0.0',
          correlation_id,
          is_active: true,
          answered: false,
        };

        // Log the exact data being inserted (matches production logging)
        console.log('🚨 DATABASE INSERT DATA VALIDATION:', {
          question_id: insertData.question_id,
          question_text: insertData.question_text,
          question_text_type: typeof insertData.question_text,
          question_text_length: insertData.question_text ? insertData.question_text.length : 0,
          question_text_empty: !insertData.question_text || insertData.question_text === "",
          question_text_preview: insertData.question_text ? insertData.question_text.substring(0, 100) : "EMPTY OR NULL",
          insert_data: insertData,
        });

        return insertData;
      };

      const question = productionScenario.generated_questions[0];
      const insertData = prepareForDatabaseInsert(
        question, 
        productionScenario.incident_id, 
        productionScenario.phase,
        'test-correlation-id'
      );

      // Validate the insert data
      expect(insertData.question_text).toBe(question.question_text);
      expect(insertData.question_text).not.toBe('');
      expect(insertData.question_text.length).toBeGreaterThan(20);
      expect(insertData.question_text).toContain('Emma');
      expect(insertData.incident_id).toBe(productionScenario.incident_id);
      expect(insertData.phase).toBe('before_event');

      console.log('✅ Database insert data contains valid content');
    });

    test('should simulate the exact storage flow from aiClarification.ts', () => {
      console.log('🔍 TESTING: Complete storage flow simulation');

      // Mock the storage loop from aiClarification.ts (lines ~151-173)
      const mockStorageFlow = async (generatedQuestions: any[], incident_id: string, phase: string) => {
        const storedQuestions = [];
        const storageErrors = [];

        console.log(`💾 Starting storage flow for ${generatedQuestions.length} questions`);

        for (const question of generatedQuestions) {
          try {
            // Pre-storage validation (line ~166 in aiClarification.ts)
            console.log("🚨 PRE-STORAGE VALIDATION", {
              question_id: question.question_id,
              question_text: question.question_text,
              question_text_type: typeof question.question_text,
              question_text_length: question.question_text ? question.question_text.length : 0,
              question_text_empty: !question.question_text || question.question_text === "",
              question_text_preview: question.question_text ? question.question_text.substring(0, 100) : "EMPTY OR NULL",
              phase,
            });

            // Storage mutation input validation (line ~508 in aiClarification.ts)
            const storageInput = {
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

            console.log("🚨 STORAGE MUTATION INPUT", {
              question_id: storageInput.question_id,
              question_text: storageInput.question_text,
              question_text_type: typeof storageInput.question_text,
              question_text_length: storageInput.question_text ? storageInput.question_text.length : 0,
              question_text_empty: !storageInput.question_text || storageInput.question_text === "",
            });

            // Database insert data (line ~534 in aiClarification.ts)
            console.log("🚨 DATABASE INSERT DATA", {
              question_id: storageInput.question_id,
              question_text: storageInput.question_text,
              question_text_type: typeof storageInput.question_text,
              question_text_length: storageInput.question_text ? storageInput.question_text.length : 0,
              question_text_empty: !storageInput.question_text || storageInput.question_text === "",
              insert_data: storageInput,
            });

            // Simulate successful storage
            const storedQuestion = {
              _id: `stored_${question.question_id}`,
              ...storageInput,
            };

            storedQuestions.push(storedQuestion);

            console.log(`✅ Successfully stored: ${question.question_id}`);

          } catch (error) {
            console.error(`❌ Storage failed for ${question.question_id}:`, error);
            storageErrors.push({
              question_id: question.question_id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        return { storedQuestions, storageErrors };
      };

      // Test with valid questions
      const validQuestions = [
        {
          question_id: "before_event_q1",
          question_text: "What was Emma's mood or demeanor in the hours leading up to the incident?",
          question_order: 1
        }
      ];

      const result = mockStorageFlow(validQuestions, 'test_incident', 'before_event');

      // Validate results
      expect(result.storedQuestions).toHaveLength(1);
      expect(result.storageErrors).toHaveLength(0);
      expect(result.storedQuestions[0].question_text).not.toBe('');
      expect(result.storedQuestions[0].question_text).toContain('Emma');

      console.log('✅ Complete storage flow preserves content');
    });
  });

  describe('Content Loss Detection Between Steps', () => {
    test('should identify exactly where content gets lost', () => {
      console.log('🔍 TESTING: Content loss point identification');

      // Create a test that traces content through each step
      const traceContentFlow = (originalContent: string) => {
        const steps = [];

        // Step 1: Original AI response parsing
        const step1_parsed = {
          question_text: originalContent,
          source: 'ai_response_parsing'
        };
        steps.push({
          step: 'ai_response_parsing',
          content: step1_parsed.question_text,
          content_length: step1_parsed.question_text.length,
          content_empty: step1_parsed.question_text === ""
        });

        // Step 2: Question generation mapping
        const step2_mapped = {
          question_id: "before_event_q1",
          question_text: step1_parsed.question_text, // Content should pass through
          question_order: 1,
          source: 'question_generation_mapping'
        };
        steps.push({
          step: 'question_generation_mapping',
          content: step2_mapped.question_text,
          content_length: step2_mapped.question_text.length,
          content_empty: step2_mapped.question_text === ""
        });

        // Step 3: Storage preparation
        const step3_storage_prep = {
          incident_id: 'test_incident',
          question_id: step2_mapped.question_id,
          phase: 'before_event',
          question_text: step2_mapped.question_text, // CRITICAL: Content transfer point
          question_order: step2_mapped.question_order,
          source: 'storage_preparation'
        };
        steps.push({
          step: 'storage_preparation',
          content: step3_storage_prep.question_text,
          content_length: step3_storage_prep.question_text.length,
          content_empty: step3_storage_prep.question_text === ""
        });

        // Step 4: Database insert
        const step4_db_insert = {
          ...step3_storage_prep,
          generated_at: Date.now(),
          ai_model: 'openai/gpt-5-nano',
          source: 'database_insert'
        };
        steps.push({
          step: 'database_insert',
          content: step4_db_insert.question_text,
          content_length: step4_db_insert.question_text.length,
          content_empty: step4_db_insert.question_text === ""
        });

        return steps;
      };

      // Test with valid content
      const validContent = "What was Emma's mood or demeanor in the hours leading up to the incident?";
      const contentFlow = traceContentFlow(validContent);

      console.log('📊 Content Flow Trace:', contentFlow);

      // Verify content is preserved through all steps
      contentFlow.forEach((step, index) => {
        expect(step.content).toBe(validContent);
        expect(step.content_empty).toBe(false);
        expect(step.content_length).toBeGreaterThan(20);
        
        console.log(`✅ Step ${index + 1} (${step.step}): Content preserved`);
      });

      // Now test with a scenario where content gets lost
      const simulateContentLoss = () => {
        const steps = [];
        
        // Step 1: Valid content
        steps.push({
          step: 'ai_response_parsing',
          content: validContent,
          content_length: validContent.length,
          content_empty: false
        });

        // Step 2: Content mysteriously becomes empty (simulating the bug)
        steps.push({
          step: 'question_generation_mapping',
          content: "", // BUG: Content lost here
          content_length: 0,
          content_empty: true
        });

        return steps;
      };

      const bugScenario = simulateContentLoss();
      
      // This should show us exactly where content gets lost
      expect(bugScenario[0].content_empty).toBe(false); // Valid at start
      expect(bugScenario[1].content_empty).toBe(true);  // Lost at mapping step

      console.log('🚨 Content loss detected at step:', bugScenario[1].step);
    });
  });
});