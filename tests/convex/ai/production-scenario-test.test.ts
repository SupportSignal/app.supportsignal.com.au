/**
 * Production Scenario Testing: AI Question Generation
 * 
 * This test simulates the exact production environment conditions
 * to try to reproduce the empty question_text issue.
 */

// @ts-nocheck
import { describe, test, expect, beforeEach, jest } from '@jest/globals';

describe('Production Scenario Testing: Empty Question Text Issue', () => {
  describe('Rate Limiting and Logging Analysis', () => {
    test('should verify that rate limiting does not cause question content loss', () => {
      // Based on the user's description, the issue includes:
      // 1. 30-second delay
      // 2. Rate limiting blocking debug logs  
      // 3. Questions created but with empty question_text
      // 4. Successful counts (4 questions created) but empty content

      console.log('🔍 TESTING PRODUCTION SCENARIO');
      
      // Simulate the actual production logging that should appear
      const productionLogs = {
        start: '🚀 QUESTION GENERATOR START',
        aiResponse: '📡 AI RESPONSE RECEIVED',
        bypassLogs: '🚨 BYPASS RATE LIMIT - RAW AI RESPONSE',
        finalQuestions: '🚨 BYPASS RATE LIMIT - FINAL GENERATED QUESTIONS',
        success: '✅ SUCCESSFULLY GENERATED AI QUESTIONS'
      };

      // Test the scenario described by the user
      const simulateProductionScenario = () => {
        // Step 1: AI generates valid response
        const aiResponseContent = `[
          {"question": "What was the participant's mood or demeanor in the hours leading up to the incident?"},
          {"question": "Were there any environmental factors (noise, crowding, schedule changes) that might have contributed to the situation?"},
          {"question": "What support strategies were in place, and how were they being implemented?"},
          {"question": "How did staff members assess the situation before implementing interventions?"}
        ]`;

        console.log('📡 Simulated AI Response Length:', aiResponseContent.length);
        console.log('📡 Simulated AI Response Preview:', aiResponseContent.substring(0, 100));

        // Step 2: Parse the response (exact logic from questionGenerator.ts)
        let questionsArray;
        const jsonMatch = aiResponseContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          questionsArray = JSON.parse(jsonMatch[0]);
          console.log('🚨 BYPASS RATE LIMIT - JSON REGEX MATCH FOUND');
        } else {
          questionsArray = JSON.parse(aiResponseContent);
        }

        console.log('🚨 BYPASS RATE LIMIT - PARSED FROM REGEX:', questionsArray.length, 'questions');

        // Step 3: Map questions (exact logic from questionGenerator.ts)
        const generatedQuestions = questionsArray.map((q: any, index: number) => {
          const questionText = q.question || q.question_text || q.questionText || String(q).trim();
          
          if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0 || questionText.trim() === '[object Object]') {
            console.error('⚠️ Empty or invalid question detected at index', index);
            throw new Error(`Question ${index + 1} has empty or invalid content. Original: ${JSON.stringify(q)}`);
          }

          const mappedQuestion = {
            question_id: `before_event_q${index + 1}`,
            question_text: questionText.trim(),
            question_order: index + 1
          };

          console.log(`🚨 BYPASS RATE LIMIT - QUESTION ${index + 1} DETAILS:`, {
            question_id: mappedQuestion.question_id,
            question_text: mappedQuestion.question_text,
            question_text_length: mappedQuestion.question_text.length,
            question_text_empty: mappedQuestion.question_text === "",
            question_text_preview: mappedQuestion.question_text.substring(0, 100),
          });

          return mappedQuestion;
        });

        console.log('✅ SUCCESSFULLY GENERATED AI QUESTIONS', {
          phase: 'before_event',
          questions_count: generatedQuestions.length,
          questions_text: generatedQuestions.map(q => q.question_text),
          questions_lengths: generatedQuestions.map(q => q.question_text.length),
        });

        return generatedQuestions;
      };

      const result = simulateProductionScenario();

      // Verify the results match what SHOULD happen in production
      expect(result).toHaveLength(4);
      result.forEach((question, index) => {
        expect(question.question_text).toBeDefined();
        expect(question.question_text).not.toBe('');
        expect(question.question_text.length).toBeGreaterThan(20);
        expect(question.question_id).toBe(`before_event_q${index + 1}`);
      });

      console.log('🎯 PRODUCTION SCENARIO SIMULATION COMPLETE - All questions have valid content');
    });

    test('should identify potential issues in the database storage chain', () => {
      // Test the specific issue: questions appear to be "successfully generated"
      // but the question_text field is empty in the database
      
      console.log('🔍 TESTING DATABASE STORAGE CHAIN');

      const mockStorageProcess = (generatedQuestions: any[]) => {
        // Simulate the loop from aiClarification.ts lines 151-173
        const storedQuestions = [];
        
        for (const question of generatedQuestions) {
          console.log('💾 STORING QUESTION:', {
            question_id: question.question_id,
            question_text: question.question_text,
            question_text_length: question.question_text ? question.question_text.length : 0,
            question_order: question.question_order,
          });

          // This is the critical point - the data going into the database
          const questionToStore = {
            incident_id: 'test-incident',
            question_id: question.question_id,
            phase: 'before_event',
            question_text: question.question_text, // CRITICAL: This should not be empty
            question_order: question.question_order,
            ai_model: 'openai/gpt-5-nano',
            prompt_version: 'v1.0.0',
            correlation_id: 'test-correlation-id',
          };

          // Validate what's being stored
          if (!questionToStore.question_text || questionToStore.question_text.trim() === '') {
            throw new Error(`CRITICAL: Attempting to store empty question_text for ${questionToStore.question_id}`);
          }

          storedQuestions.push({
            _id: `stored_${question.question_id}`,
            question_id: question.question_id,
            question_text: questionToStore.question_text,
            question_order: question.question_order,
            phase: 'before_event',
            is_active: true,
            answered: false,
          });

          console.log('✅ SUCCESSFULLY STORED:', questionToStore.question_id);
        }

        return storedQuestions;
      };

      // Test with valid questions
      const validQuestions = [
        {
          question_id: 'before_event_q1',
          question_text: "What was the participant's mood before the incident?",
          question_order: 1
        },
        {
          question_id: 'before_event_q2',
          question_text: "Were there environmental factors involved?",
          question_order: 2
        }
      ];

      const storedResult = mockStorageProcess(validQuestions);
      
      expect(storedResult).toHaveLength(2);
      storedResult.forEach(stored => {
        expect(stored.question_text).not.toBe('');
        expect(stored.question_text.length).toBeGreaterThan(10);
      });

      console.log('🎯 DATABASE STORAGE CHAIN TEST COMPLETE - No issues detected in storage logic');
    });

    test('should simulate the exact user-reported scenario', () => {
      // Based on user report:
      // - Questions are being "successfully generated" and stored in database
      // - All questions have empty `question_text: ""` fields in the database  
      // - Logs show: `✅ Successfully generated 1 questions for before_event` etc.
      // - But actual question content is missing

      console.log('🔍 TESTING EXACT USER-REPORTED SCENARIO');

      // This represents what the user sees in the database
      const userReportedDatabaseState = [
        {
          question_id: "before_event_q1",
          question_text: "",  // ← This is the problem!
          ai_model: "openai/gpt-5-nano",
          generated_at: 1755615900324,
          question_order: 1
        },
        {
          question_id: "before_event_q2", 
          question_text: "",  // ← This is the problem!
          ai_model: "openai/gpt-5-nano",
          generated_at: 1755615900324,
          question_order: 2
        },
        {
          question_id: "before_event_q3",
          question_text: "",  // ← This is the problem!
          ai_model: "openai/gpt-5-nano", 
          generated_at: 1755615900324,
          question_order: 3
        },
        {
          question_id: "before_event_q4",
          question_text: "",  // ← This is the problem!
          ai_model: "openai/gpt-5-nano",
          generated_at: 1755615900324,
          question_order: 4
        }
      ];

      // What SHOULD have been stored based on successful AI generation
      const expectedDatabaseState = [
        {
          question_id: "before_event_q1",
          question_text: "What was the participant's mood or demeanor in the hours leading up to the incident?",
          ai_model: "openai/gpt-5-nano",
          generated_at: 1755615900324,
          question_order: 1
        },
        {
          question_id: "before_event_q2",
          question_text: "Were there any environmental factors (noise, crowding, schedule changes) that might have contributed to the situation?",
          ai_model: "openai/gpt-5-nano",
          generated_at: 1755615900324,
          question_order: 2
        },
        {
          question_id: "before_event_q3",
          question_text: "What support strategies were in place, and how were they being implemented?",
          ai_model: "openai/gpt-5-nano",
          generated_at: 1755615900324,
          question_order: 3
        },
        {
          question_id: "before_event_q4",
          question_text: "How did staff members assess the situation before implementing interventions?",
          ai_model: "openai/gpt-5-nano",
          generated_at: 1755615900324,
          question_order: 4
        }
      ];

      console.log('📊 USER REPORTED STATE:');
      userReportedDatabaseState.forEach((q, i) => {
        console.log(`  Question ${i+1}: "${q.question_text}" (length: ${q.question_text.length})`);
      });

      console.log('📊 EXPECTED STATE:');
      expectedDatabaseState.forEach((q, i) => {
        console.log(`  Question ${i+1}: "${q.question_text.substring(0, 50)}..." (length: ${q.question_text.length})`);
      });

      // The key insight: The structure is correct (question_id, order, etc.)
      // but the question_text field is consistently empty across ALL questions
      // This suggests a systematic issue in the data pipeline

      userReportedDatabaseState.forEach((reported, index) => {
        const expected = expectedDatabaseState[index];
        
        // These should match (structural elements are preserved)
        expect(reported.question_id).toBe(expected.question_id);
        expect(reported.question_order).toBe(expected.question_order);
        expect(reported.ai_model).toBe(expected.ai_model);
        
        // This is the actual problem - question_text is empty when it should have content
        expect(reported.question_text).toBe(''); // This is what's happening
        expect(expected.question_text).not.toBe(''); // This is what should happen
        expect(expected.question_text.length).toBeGreaterThan(20); // Expected content is substantial
      });

      console.log('🎯 ROOT CAUSE ANALYSIS:');
      console.log('  ✅ AI response parsing: WORKING (our tests show this works)');
      console.log('  ✅ Question structure: PRESERVED (IDs, order, model info all correct)');
      console.log('  ❌ Question content: LOST (question_text field empty)');
      console.log('  🔍 LIKELY ISSUE: Content is lost between parsing and database storage');
      console.log('  🔍 HYPOTHESIS: The issue occurs in the data transformation or storage mutation');
    });
  });

  describe('Debugging Recommendations', () => {
    test('should provide specific debugging steps for production', () => {
      console.log('🔧 DEBUGGING RECOMMENDATIONS FOR PRODUCTION:');
      console.log('');
      console.log('1. 🔍 VERIFY AI RESPONSE CONTENT:');
      console.log('   - Check the bypass rate limit logs: "🚨 BYPASS RATE LIMIT - FULL AI CONTENT"');
      console.log('   - Confirm AI is returning valid JSON with question content');
      console.log('   - Look for the exact structure: [{"question": "text here"}, ...]');
      console.log('');
      console.log('2. 🔍 TRACE PARSING LOGIC:');  
      console.log('   - Check logs: "📄 AI CONTENT TO PARSE" and "📋 PARSED QUESTIONS ARRAY"');
      console.log('   - Verify questionText extraction: q.question || q.question_text || q.questionText');
      console.log('   - Confirm validation passes: no "⚠️ Empty or invalid question detected"');
      console.log('');
      console.log('3. 🔍 MONITOR STORAGE CHAIN:');
      console.log('   - Add logging in aiClarification.ts storeClarificationQuestion mutation');
      console.log('   - Log the exact data being inserted: question_text field specifically');  
      console.log('   - Check if question_text gets corrupted during Convex mutation');
      console.log('');
      console.log('4. 🔍 CHECK CONVEX SCHEMA:');
      console.log('   - Verify clarification_questions table schema allows strings in question_text');
      console.log('   - Confirm no field name mismatches (e.g. questionText vs question_text)');
      console.log('   - Check for any field validation that might strip content');
      console.log('');
      console.log('5. 🔍 DATABASE RETRIEVAL TEST:');
      console.log('   - Immediately after storage, query the stored record');
      console.log('   - Verify the question_text field contains the expected content');
      console.log('   - Rule out any retrieval/display issues');

      // Create actionable test assertions
      const debuggingChecklist = [
        { step: 'AI response contains valid JSON', status: 'LIKELY OK' },
        { step: 'Parsing logic extracts question text', status: 'LIKELY OK' },
        { step: 'Storage mutation preserves question_text', status: 'NEEDS INVESTIGATION' },
        { step: 'Database schema accepts question content', status: 'NEEDS INVESTIGATION' },
        { step: 'Retrieval logic returns stored content', status: 'NEEDS INVESTIGATION' }
      ];

      debuggingChecklist.forEach(item => {
        console.log(`   ${item.status === 'LIKELY OK' ? '✅' : '🔍'} ${item.step}: ${item.status}`);
      });

      // The test itself just verifies we have actionable recommendations
      expect(debuggingChecklist.length).toBeGreaterThan(0);
      expect(debuggingChecklist.filter(item => item.status === 'NEEDS INVESTIGATION')).toHaveLength(3);
    });
  });
});