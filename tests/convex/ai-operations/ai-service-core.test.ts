// @ts-nocheck
/**
 * Unit tests for AI service core classes
 * Tests RateLimiter, CostTracker, CircuitBreaker, and FallbackHandler
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  RateLimiter,
  CostTracker,
  CircuitBreaker,
  FallbackHandler,
  generateCorrelationId,
} from '@/ai-service';
import {
  RATE_LIMIT_SCENARIOS,
  COST_TRACKING_SCENARIOS,
  CIRCUIT_BREAKER_SCENARIOS,
  MOCK_INCIDENT_DATA,
  MOCK_CLARIFICATION_ANSWERS,
} from './fixtures';

describe('AI Service Core Classes', () => {
  describe('generateCorrelationId', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      
      expect(id1).toMatch(/^ai-\d{13}-[a-z0-9]{9}$/);
      expect(id2).toMatch(/^ai-\d{13}-[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });

    it('should always start with ai- prefix', () => {
      const id = generateCorrelationId();
      expect(id).toMatch(/^ai-/);
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(60000, 10); // 10 requests per minute
    });

    it('should allow requests under the limit', () => {
      const testKey = 'test-user';
      
      // Make 5 requests - should all be allowed
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed(testKey)).toBe(true);
      }
      
      expect(rateLimiter.getRemainingRequests(testKey)).toBe(5);
    });

    it('should block requests at the limit', () => {
      const testKey = 'test-user';
      
      // Make 10 requests - should all be allowed
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.isAllowed(testKey)).toBe(true);
      }
      
      // 11th request should be blocked
      expect(rateLimiter.isAllowed(testKey)).toBe(false);
      expect(rateLimiter.getRemainingRequests(testKey)).toBe(0);
    });

    it('should handle multiple users independently', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      // User 1 makes requests up to limit
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.isAllowed(user1)).toBe(true);
      }
      expect(rateLimiter.isAllowed(user1)).toBe(false);
      
      // User 2 should still be able to make requests
      expect(rateLimiter.isAllowed(user2)).toBe(true);
      expect(rateLimiter.getRemainingRequests(user2)).toBe(9);
    });

    it('should reset window correctly', () => {
      const rateLimiterShortWindow = new RateLimiter(100, 2); // 2 requests per 100ms
      const testKey = 'test-user';
      
      // Use up the limit
      expect(rateLimiterShortWindow.isAllowed(testKey)).toBe(true);
      expect(rateLimiterShortWindow.isAllowed(testKey)).toBe(true);
      expect(rateLimiterShortWindow.isAllowed(testKey)).toBe(false);
      
      // Wait for window to reset
      setTimeout(() => {
        expect(rateLimiterShortWindow.isAllowed(testKey)).toBe(true);
      }, 150);
    });

    it('should handle edge cases correctly', () => {
      const testKey = 'edge-case-user';
      
      // Test with empty string key
      expect(rateLimiter.isAllowed('')).toBe(true);
      
      // Test with undefined key (should be converted to string)
      expect(rateLimiter.isAllowed(undefined as any)).toBe(true);
      
      // Test remaining requests for non-existent key
      expect(rateLimiter.getRemainingRequests('non-existent')).toBe(10);
    });
  });

  describe('CostTracker', () => {
    let costTracker: CostTracker;

    beforeEach(() => {
      costTracker = new CostTracker(100); // $100 daily limit
    });

    it('should track costs under the budget', () => {
      costTracker.trackRequest(25.50);
      costTracker.trackRequest(0.75);
      
      expect(costTracker.isWithinDailyLimit()).toBe(true);
      
      const metrics = costTracker.getMetrics();
      expect(metrics.totalCost).toBe(26.25);
      expect(metrics.requestCount).toBe(2);
      expect(metrics.remainingBudget).toBe(73.75);
    });

    it('should detect when over budget', () => {
      costTracker.trackRequest(99.50);
      expect(costTracker.isWithinDailyLimit()).toBe(true);
      
      costTracker.trackRequest(1.00);
      expect(costTracker.isWithinDailyLimit()).toBe(false);
      
      const metrics = costTracker.getMetrics();
      expect(metrics.totalCost).toBe(100.50);
      expect(metrics.remainingBudget).toBe(-0.50);
    });

    it('should track requests without cost', () => {
      costTracker.trackRequest(); // No cost provided
      costTracker.trackRequest(undefined);
      
      const metrics = costTracker.getMetrics();
      expect(metrics.totalCost).toBe(0);
      expect(metrics.requestCount).toBe(2);
      expect(metrics.remainingBudget).toBe(100);
    });

    it('should handle zero and negative costs', () => {
      costTracker.trackRequest(0);
      costTracker.trackRequest(-5); // This shouldn't happen but let's be defensive
      
      const metrics = costTracker.getMetrics();
      expect(metrics.totalCost).toBe(-5);
      expect(metrics.requestCount).toBe(2);
    });

    it('should handle edge case budget limits', () => {
      const zeroBudget = new CostTracker(0);
      expect(zeroBudget.isWithinDailyLimit()).toBe(false);
      
      const negativeBudget = new CostTracker(-10);
      expect(negativeBudget.isWithinDailyLimit()).toBe(false);
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(3, 2, 1000); // 3 failures, 2 successes, 1 second timeout
    });

    it('should start in CLOSED state and allow execution', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should transition to OPEN after failure threshold', () => {
      // Record failures up to threshold
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.canExecute()).toBe(true);
      
      // Third failure should open the circuit
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should transition from OPEN to HALF_OPEN after timeout', () => {
      // Force circuit to OPEN state
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Mock time passage for timeout
      const originalDateNow = Date.now;
      let currentTime = originalDateNow();
      Date.now = jest.fn(() => currentTime);
      
      // Still in timeout period
      expect(circuitBreaker.canExecute()).toBe(false);
      
      // After timeout period
      currentTime += 1500; // 1.5 seconds later
      expect(circuitBreaker.canExecute()).toBe(true);
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      
      Date.now = originalDateNow;
    });

    it('should transition from HALF_OPEN to CLOSED after success threshold', () => {
      // Force to HALF_OPEN state
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }
      
      // Mock timeout passage
      const originalDateNow = Date.now;
      let currentTime = originalDateNow();
      Date.now = jest.fn(() => currentTime + 2000);
      circuitBreaker.canExecute(); // Triggers HALF_OPEN
      Date.now = originalDateNow;
      
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      
      // Record successes
      circuitBreaker.recordSuccess();
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      
      circuitBreaker.recordSuccess(); // Second success should close
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });

    it('should transition from HALF_OPEN to OPEN on failure', () => {
      // Get to HALF_OPEN state
      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure();
      }
      
      const originalDateNow = Date.now;
      let currentTime = originalDateNow();
      Date.now = jest.fn(() => currentTime + 2000);
      circuitBreaker.canExecute();
      Date.now = originalDateNow;
      
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      
      // Any failure in HALF_OPEN should go back to OPEN
      circuitBreaker.recordFailure();
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('should provide accurate metrics', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe('CLOSED');
      expect(metrics.failureCount).toBe(2);
      expect(metrics.successCount).toBe(0);
      expect(metrics.lastFailureTime).toBeGreaterThan(0);
    });

    it('should reset failure count on success in CLOSED state', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();
      
      let metrics = circuitBreaker.getMetrics();
      expect(metrics.failureCount).toBe(2);
      
      circuitBreaker.recordSuccess();
      
      metrics = circuitBreaker.getMetrics();
      expect(metrics.failureCount).toBe(0);
    });
  });

  describe('FallbackHandler', () => {
    describe('generateClarificationQuestionsFallback', () => {
      it('should generate fallback clarification questions', () => {
        const input = {
          participant_name: MOCK_INCIDENT_DATA.participant_name,
          reporter_name: MOCK_INCIDENT_DATA.reporter_name,
          event_datetime: MOCK_INCIDENT_DATA.event_datetime,
          location: MOCK_INCIDENT_DATA.location,
        };
        
        const result = FallbackHandler.generateClarificationQuestionsFallback(input);
        
        expect(result).toHaveProperty('clarification_questions');
        expect(result).toHaveProperty('metadata');
        
        const questions = result.clarification_questions;
        expect(questions).toHaveProperty('before_event');
        expect(questions).toHaveProperty('during_event');
        expect(questions).toHaveProperty('end_of_event');
        expect(questions).toHaveProperty('post_event_support');
        
        // Each phase should have questions
        expect(Array.isArray(questions.before_event)).toBe(true);
        expect(questions.before_event.length).toBeGreaterThan(0);
        expect(questions.during_event.length).toBeGreaterThan(0);
        
        // Metadata should be populated correctly
        expect(result.metadata.status).toBe('fallback_response');
        expect(result.metadata.report_context.participant_name).toBe(input.participant_name);
        expect(result.metadata.fallback_reason).toContain('AI service unavailable');
        expect(result.metadata.correlation_id).toMatch(/^ai-/);
        expect(result.metadata.cost).toBe(0);
        expect(result.metadata.tokens_used).toBe(0);
      });
    });

    describe('enhanceNarrativeContentFallback', () => {
      it('should format Q&A pairs as fallback narrative', () => {
        const input = {
          phase: 'during_event',
          instruction: 'Enhance the narrative with clarification details',
          answers: MOCK_CLARIFICATION_ANSWERS,
        };
        
        const result = FallbackHandler.enhanceNarrativeContentFallback(input);
        
        expect(result).toHaveProperty('output');
        expect(result).toHaveProperty('narrative');
        expect(result).toHaveProperty('metadata');
        
        // Output should contain formatted Q&A pairs
        expect(result.output).toContain('Q: What specific activity was taking place');
        expect(result.output).toContain('A: The participants were engaged');
        expect(result.narrative).toBe(result.output); // Should be identical
        
        // Metadata should reflect the processing
        expect(result.metadata.status).toBe('fallback_response');
        expect(result.metadata.phase).toBe(input.phase);
        expect(result.metadata.answers_processed).toBe(input.answers.length);
        expect(result.metadata.fallback_reason).toContain('returning formatted Q&A pairs');
      });

      it('should handle empty or invalid answers', () => {
        const input = {
          phase: 'before_event',
          instruction: 'Test instruction',
          answers: [
            { question: '', answer: 'Valid answer' }, // Empty question
            { question: 'Valid question?', answer: '' }, // Empty answer
            { question: '  ', answer: '  ' }, // Whitespace only
          ],
        };
        
        const result = FallbackHandler.enhanceNarrativeContentFallback(input);
        
        // Should return default message for no valid pairs
        expect(result.output).toBe('No valid question-answer pairs provided.');
        expect(result.metadata.answers_processed).toBe(0);
      });
    });

    describe('analyzeContributingConditionsFallback', () => {
      it('should provide fallback analysis message', () => {
        const input = {
          participant_name: MOCK_INCIDENT_DATA.participant_name,
          reporter_name: MOCK_INCIDENT_DATA.reporter_name,
          event_datetime: MOCK_INCIDENT_DATA.event_datetime,
          location: MOCK_INCIDENT_DATA.location,
        };
        
        const result = FallbackHandler.analyzeContributingConditionsFallback(input);
        
        expect(result).toHaveProperty('analysis');
        expect(result).toHaveProperty('metadata');
        
        // Analysis should contain fallback message
        expect(result.analysis).toContain('Unable to Complete AI Analysis');
        expect(result.analysis).toContain('Manual Analysis Required');
        expect(result.analysis).toContain('fallback response');
        
        // Should provide guidance for manual analysis
        expect(result.analysis).toContain('Review the incident narrative');
        expect(result.analysis).toContain('environmental, procedural');
        
        // Metadata should capture incident context
        expect(result.metadata.status).toBe('fallback_response');
        expect(result.metadata.incident_context.participant_name).toBe(input.participant_name);
        expect(result.metadata.fallback_reason).toContain('manual analysis required');
      });
    });

    describe('generateMockAnswersFallback', () => {
      it('should provide fallback for mock answers', () => {
        const input = {
          phase: 'during_event',
          questions: JSON.stringify(['Question 1?', 'Question 2?']),
        };
        
        const result = FallbackHandler.generateMockAnswersFallback(input);
        
        expect(result).toHaveProperty('mock_answers');
        expect(result).toHaveProperty('metadata');
        
        // Mock answers should contain error message
        expect(result.mock_answers.output).toContain('fallback-001');
        expect(result.mock_answers.output).toContain('AI service is currently unavailable');
        
        // Should be valid JSON structure
        const parsedOutput = JSON.parse(result.mock_answers.output);
        expect(parsedOutput).toHaveProperty('answers');
        expect(Array.isArray(parsedOutput.answers)).toBe(true);
        
        // Metadata should indicate failure
        expect(result.metadata.status).toBe('fallback_response');
        expect(result.metadata.phase).toBe(input.phase);
        expect(result.metadata.questions_answered).toBe(0);
        expect(result.metadata.fallback_reason).toContain('cannot generate mock content');
      });
    });

    it('should generate consistent correlation IDs across fallback methods', () => {
      const input = {
        participant_name: 'Test Participant',
        reporter_name: 'Test Reporter', 
        event_datetime: '2024-01-01T10:00:00Z',
        location: 'Test Location',
      };
      
      const clarificationResult = FallbackHandler.generateClarificationQuestionsFallback(input);
      const analysisResult = FallbackHandler.analyzeContributingConditionsFallback(input);
      
      // Both should have correlation IDs
      expect(clarificationResult.metadata.correlation_id).toMatch(/^ai-/);
      expect(analysisResult.metadata.correlation_id).toMatch(/^ai-/);
      
      // IDs should be unique
      expect(clarificationResult.metadata.correlation_id)
        .not.toBe(analysisResult.metadata.correlation_id);
    });
  });
});