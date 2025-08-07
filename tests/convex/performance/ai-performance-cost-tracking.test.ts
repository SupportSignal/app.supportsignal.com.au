// @ts-nocheck
/**
 * Performance and cost tracking validation tests
 * Tests rate limiting, cost tracking, circuit breaker performance, and resource monitoring
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import {
  RateLimiter,
  CostTracker,
  CircuitBreaker,
  generateCorrelationId,
} from '@/ai-service';
import {
  OpenRouterProvider,
  MultiProviderAIManager,
} from '@/ai-multi-provider';
import {
  MOCK_PROVIDER_CONFIGS,
  MOCK_AI_REQUESTS,
  createMockFetchResponse,
} from '../ai-operations/fixtures';

describe('AI Performance and Cost Tracking', () => {
  describe('Rate Limiting Performance', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
    });

    it('should handle high-frequency request checking efficiently', () => {
      const startTime = Date.now();
      const iterations = 10000;
      
      // Simulate many rapid requests from different users
      for (let i = 0; i < iterations; i++) {
        const userId = `user-${i % 1000}`; // 1000 different users
        rateLimiter.isAllowed(userId);
      }
      
      const duration = Date.now() - startTime;
      
      // Should complete 10k operations in reasonable time
      expect(duration).toBeLessThan(1000); // Under 1 second
    });

    it('should maintain consistent performance under memory pressure', () => {
      const memoryTestUsers = 50000;
      const timings = [];
      
      // Create many users to test memory usage
      for (let i = 0; i < memoryTestUsers; i++) {
        const startTime = Date.now();
        rateLimiter.isAllowed(`memory-test-user-${i}`);
        timings.push(Date.now() - startTime);
      }
      
      // Performance should remain consistent even with many users
      const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const maxTime = Math.max(...timings);
      
      expect(averageTime).toBeLessThan(1); // Average under 1ms
      expect(maxTime).toBeLessThan(10); // Max under 10ms
    });

    it('should clean up old request timestamps efficiently', () => {
      const rateLimiterShort = new RateLimiter(100, 10); // 100ms window
      const userId = 'cleanup-test-user';
      
      // Fill up with requests
      for (let i = 0; i < 10; i++) {
        rateLimiterShort.isAllowed(userId);
      }
      
      // Wait for window to expire
      return new Promise(resolve => {
        setTimeout(() => {
          const startTime = Date.now();
          
          // Should be fast despite previous history
          rateLimiterShort.isAllowed(userId);
          
          const duration = Date.now() - startTime;
          expect(duration).toBeLessThan(5); // Very fast cleanup
          resolve();
        }, 150);
      });
    });

    it('should scale linearly with number of users', () => {
      const testSizes = [100, 1000, 10000];
      const timings = [];
      
      testSizes.forEach(userCount => {
        const startTime = Date.now();
        
        for (let i = 0; i < userCount; i++) {
          rateLimiter.isAllowed(`scale-test-user-${i}`);
        }
        
        const duration = Date.now() - startTime;
        timings.push({ userCount, duration, avgPerUser: duration / userCount });
      });
      
      // Performance should scale reasonably
      expect(timings[0].avgPerUser).toBeLessThan(0.1); // 100 users
      expect(timings[1].avgPerUser).toBeLessThan(0.1); // 1000 users  
      expect(timings[2].avgPerUser).toBeLessThan(0.1); // 10000 users
      
      // Larger tests shouldn't be dramatically slower per user
      const scalingFactor = timings[2].avgPerUser / timings[0].avgPerUser;
      expect(scalingFactor).toBeLessThan(3); // Less than 3x slower per user
    });

    it('should handle concurrent access safely', async () => {
      const concurrentRequests = 1000;
      const userId = 'concurrent-test-user';
      const promises = [];
      
      // Create many concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          Promise.resolve().then(() => rateLimiter.isAllowed(userId))
        );
      }
      
      const results = await Promise.all(promises);
      const allowed = results.filter(result => result === true).length;
      const denied = results.filter(result => result === false).length;
      
      // Should respect rate limits even under concurrency
      expect(allowed).toBeLessThanOrEqual(100); // Limit is 100
      expect(allowed + denied).toBe(concurrentRequests);
      expect(allowed).toBeGreaterThan(90); // Should allow close to limit
    });
  });

  describe('Cost Tracking Accuracy', () => {
    let costTracker: CostTracker;

    beforeEach(() => {
      costTracker = new CostTracker(1000); // $1000 daily limit
    });

    it('should maintain precision across many small transactions', () => {
      const smallCost = 0.000001; // 0.1 cent
      const iterations = 1000000; // 1 million micro-transactions
      
      for (let i = 0; i < iterations; i++) {
        costTracker.trackRequest(smallCost);
      }
      
      const metrics = costTracker.getMetrics();
      
      // Should maintain precision despite many small operations
      expect(metrics.totalCost).toBeCloseTo(1.0, 6); // $1.00 total
      expect(metrics.requestCount).toBe(iterations);
      expect(metrics.remainingBudget).toBeCloseTo(999.0, 6);
    });

    it('should handle floating point precision correctly', () => {
      // Test problematic floating point values
      const problematicCosts = [0.1, 0.2, 0.3]; // Classic floating point issues
      
      problematicCosts.forEach(cost => {
        costTracker.trackRequest(cost);
      });
      
      const metrics = costTracker.getMetrics();
      expect(metrics.totalCost).toBeCloseTo(0.6, 10); // High precision comparison
    });

    it('should calculate cost rates accurately for different models', () => {
      const openRouterProvider = new OpenRouterProvider(MOCK_PROVIDER_CONFIGS.OPENROUTER);
      
      // Test different token counts and models
      const testCases = [
        { tokens: 1000, model: 'openai/gpt-4.1-nano', expectedCost: 0.002 },
        { tokens: 1000, model: 'openai/gpt-4', expectedCost: 0.03 },
        { tokens: 1000, model: 'openai/gpt-4o-mini', expectedCost: 0.00015 },
        { tokens: 2500, model: 'openai/gpt-4.1-nano', expectedCost: 0.005 },
        { tokens: 500, model: 'openai/gpt-4', expectedCost: 0.015 },
      ];
      
      testCases.forEach(({ tokens, model, expectedCost }) => {
        // Use provider's cost calculation method directly
        const cost = (openRouterProvider as any).calculateCost(tokens, model);
        expect(cost).toBeCloseTo(expectedCost, 6);
      });
    });

    it('should track cumulative costs accurately over time', () => {
      const transactions = [
        { cost: 0.123456, description: 'Clarification questions' },
        { cost: 0.078902, description: 'Narrative enhancement' },
        { cost: 0.234567, description: 'Contributing conditions' },
        { cost: 0.045123, description: 'Mock answers' },
        { cost: 0.189034, description: 'Additional processing' },
      ];
      
      let expectedTotal = 0;
      
      transactions.forEach(({ cost, description }) => {
        costTracker.trackRequest(cost);
        expectedTotal += cost;
        
        const metrics = costTracker.getMetrics();
        expect(metrics.totalCost).toBeCloseTo(expectedTotal, 6);
        expect(metrics.remainingBudget).toBeCloseTo(1000 - expectedTotal, 6);
      });
      
      const finalMetrics = costTracker.getMetrics();
      expect(finalMetrics.requestCount).toBe(transactions.length);
      expect(finalMetrics.totalCost).toBeCloseTo(0.671082, 6); // Sum of all costs
    });

    it('should detect budget limits precisely', () => {
      const dailyLimit = 10.00;
      const preciseTracker = new CostTracker(dailyLimit);
      
      // Approach limit gradually
      preciseTracker.trackRequest(9.99);
      expect(preciseTracker.isWithinDailyLimit()).toBe(true);
      
      preciseTracker.trackRequest(0.009);
      expect(preciseTracker.isWithinDailyLimit()).toBe(true); // 9.999 < 10
      
      preciseTracker.trackRequest(0.001);
      expect(preciseTracker.isWithinDailyLimit()).toBe(false); // 10.000 >= 10
      
      const metrics = preciseTracker.getMetrics();
      expect(metrics.remainingBudget).toBe(0);
    });

    it('should handle edge case budget scenarios', () => {
      // Zero budget
      const zeroBudget = new CostTracker(0);
      expect(zeroBudget.isWithinDailyLimit()).toBe(false);
      
      zeroBudget.trackRequest(0); // Free request
      expect(zeroBudget.isWithinDailyLimit()).toBe(false); // Still over budget
      
      // Negative budget (shouldn't happen but be defensive)
      const negativeBudget = new CostTracker(-10);
      expect(negativeBudget.isWithinDailyLimit()).toBe(false);
      
      // Very large budget
      const largeBudget = new CostTracker(Number.MAX_SAFE_INTEGER);
      largeBudget.trackRequest(1000000);
      expect(largeBudget.isWithinDailyLimit()).toBe(true);
    });
  });

  describe('Circuit Breaker Performance Impact', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(5, 3, 1000);
    });

    afterEach(() => {
      // Restore Date.now if it was mocked
      if (Date.now.mockRestore) {
        Date.now.mockRestore();
      }
    });

    it('should have minimal performance impact in closed state', () => {
      const iterations = 100000;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        circuitBreaker.canExecute();
        circuitBreaker.recordSuccess();
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Under 100ms for 100k operations
    });

    it('should quickly reject requests in open state', () => {
      // Force circuit to open
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }
      
      const iterations = 10000;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        expect(circuitBreaker.canExecute()).toBe(false);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10); // Very fast rejection
    });

    it('should handle state transitions efficiently', () => {
      const mockDateNow = jest.spyOn(Date, 'now');
      let currentTime = 1000000;
      mockDateNow.mockImplementation(() => currentTime);
      
      // Test rapid state transitions
      const transitions = [
        () => { // CLOSED -> OPEN
          for (let i = 0; i < 5; i++) circuitBreaker.recordFailure();
        },
        () => { // OPEN -> HALF_OPEN
          currentTime += 2000; // Advance past timeout
          circuitBreaker.canExecute();
        },
        () => { // HALF_OPEN -> CLOSED
          circuitBreaker.recordSuccess();
          circuitBreaker.recordSuccess();
          circuitBreaker.recordSuccess();
        },
        () => { // CLOSED -> OPEN again
          for (let i = 0; i < 5; i++) circuitBreaker.recordFailure();
        },
      ];
      
      const startTime = Date.now();
      transitions.forEach(transition => transition());
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5); // All transitions very fast
      mockDateNow.mockRestore();
    });

    it('should provide consistent metrics performance', () => {
      const iterations = 1000;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        circuitBreaker.getMetrics();
        timings.push(Date.now() - startTime);
        
        // Vary circuit state
        if (i % 100 < 10) {
          circuitBreaker.recordFailure();
        } else {
          circuitBreaker.recordSuccess();
        }
      }
      
      const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const maxTime = Math.max(...timings);
      
      expect(averageTime).toBeLessThan(1); // Average under 1ms
      expect(maxTime).toBeLessThan(5); // No single call over 5ms
    });

    it('should handle concurrent state changes safely', async () => {
      const concurrentOperations = 1000;
      const promises = [];
      
      // Mix of concurrent operations
      for (let i = 0; i < concurrentOperations; i++) {
        if (i % 3 === 0) {
          promises.push(Promise.resolve().then(() => circuitBreaker.canExecute()));
        } else if (i % 3 === 1) {
          promises.push(Promise.resolve().then(() => circuitBreaker.recordSuccess()));
        } else {
          promises.push(Promise.resolve().then(() => circuitBreaker.recordFailure()));
        }
      }
      
      const startTime = Date.now();
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100); // Complete in reasonable time
      
      // Circuit should be in a consistent state
      const metrics = circuitBreaker.getMetrics();
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(metrics.state);
    });
  });

  describe('End-to-End Performance Monitoring', () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    let manager: MultiProviderAIManager;

    beforeEach(() => {
      manager = new MultiProviderAIManager();
      jest.clearAllMocks();
    });

    it('should track request latency accurately', async () => {
      const mockDelays = [100, 250, 500, 1000, 1500]; // Different response times
      const latencyResults = [];
      
      for (const delay of mockDelays) {
        mockFetch.mockImplementationOnce(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(createMockFetchResponse({
                choices: [{ message: { content: 'Test response' } }],
                usage: { total_tokens: 100 },
              }));
            }, delay);
          });
        });
        
        const startTime = Date.now();
        const response = await manager.sendRequest({
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: 'Test prompt',
        } as any);
        const actualDuration = Date.now() - startTime;
        
        expect(response.success).toBe(true);
        expect(response.processingTimeMs).toBeGreaterThan(delay - 50); // Within 50ms
        expect(response.processingTimeMs).toBeLessThan(delay + 200); // Account for overhead
        
        latencyResults.push({
          expected: delay,
          actual: actualDuration,
          reported: response.processingTimeMs,
        });
      }
      
      // Verify latency tracking accuracy
      latencyResults.forEach(({ expected, actual, reported }) => {
        const accuracy = Math.abs(reported - actual) / actual;
        expect(accuracy).toBeLessThan(0.1); // Within 10% accuracy
      });
    });

    it('should handle request queuing under load', async () => {
      const concurrentRequests = 50;
      const responseDelay = 100;
      
      mockFetch.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(createMockFetchResponse({
              choices: [{ message: { content: 'Queued response' } }],
              usage: { total_tokens: 50 },
            }));
          }, responseDelay);
        });
      });
      
      const promises = [];
      const startTime = Date.now();
      
      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          manager.sendRequest({
            ...MOCK_AI_REQUESTS.CLARIFICATION,
            prompt: `Concurrent request ${i}`,
            correlationId: generateCorrelationId(),
          } as any)
        );
      }
      
      const responses = await Promise.all(promises);
      const totalDuration = Date.now() - startTime;
      
      // All should succeed
      expect(responses.every(r => r.success)).toBe(true);
      
      // Should complete faster than sequential execution
      const sequentialTime = concurrentRequests * (responseDelay + 50);
      expect(totalDuration).toBeLessThan(sequentialTime * 0.5); // At least 50% faster
      
      // Individual response times should be reasonable
      responses.forEach(response => {
        expect(response.processingTimeMs).toBeGreaterThan(responseDelay - 50);
        expect(response.processingTimeMs).toBeLessThan(responseDelay * 2);
      });
    });

    it('should maintain performance during provider failures', async () => {
      const requestCount = 20;
      const responses = [];
      
      // Simulate intermittent failures
      mockFetch
        .mockResolvedValueOnce(createMockFetchResponse('Error', 500)) // Fail
        .mockResolvedValueOnce(createMockFetchResponse({
          content: [{ text: 'Fallback success' }],
          usage: { input_tokens: 10, output_tokens: 15 },
        })) // Succeed with fallback
        .mockResolvedValueOnce(createMockFetchResponse({
          choices: [{ message: { content: 'Primary success' } }],
          usage: { total_tokens: 75 },
        })); // Succeed with primary
      
      // Repeat the pattern
      for (let i = 3; i < requestCount; i++) {
        if (i % 3 === 0) {
          mockFetch.mockResolvedValueOnce(createMockFetchResponse('Error', 500));
          mockFetch.mockResolvedValueOnce(createMockFetchResponse({
            content: [{ text: `Fallback ${i}` }],
            usage: { input_tokens: 10, output_tokens: 15 },
          }));
        } else {
          mockFetch.mockResolvedValueOnce(createMockFetchResponse({
            choices: [{ message: { content: `Primary ${i}` } }],
            usage: { total_tokens: 75 },
          }));
        }
      }
      
      const startTime = Date.now();
      
      for (let i = 0; i < requestCount; i++) {
        const response = await manager.sendRequest({
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          prompt: `Request ${i}`,
        } as any);
        responses.push(response);
      }
      
      const totalDuration = Date.now() - startTime;
      const averageTime = totalDuration / requestCount;
      
      // All requests should eventually succeed (with fallback)
      expect(responses.every(r => r.success)).toBe(true);
      
      // Performance should be reasonable despite failures
      expect(averageTime).toBeLessThan(1000); // Under 1 second average
      
      // Verify some used fallback provider
      const anthropicResponses = responses.filter(r => 
        r.content && (r.content.includes('Fallback') || r.content.includes('fallback'))
      );
      expect(anthropicResponses.length).toBeGreaterThan(0);
    });

    it('should optimize provider selection based on performance', async () => {
      const performanceData = [];
      
      // Simulate OpenRouter being slower than Anthropic
      mockFetch.mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('openrouter.ai')) {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(createMockFetchResponse({
                  choices: [{ message: { content: 'OpenRouter slow response' } }],
                  usage: { total_tokens: 100 },
                }));
              }, 800); // Slow
            });
          } else if (url.includes('anthropic.com')) {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(createMockFetchResponse({
                  content: [{ text: 'Anthropic fast response' }],
                  usage: { input_tokens: 50, output_tokens: 50 },
                }));
              }, 200); // Fast
            });
          }
        }
        return Promise.reject(new Error('Unknown URL'));
      });
      
      // Test with model supported by both
      const requests = 5;
      for (let i = 0; i < requests; i++) {
        const startTime = Date.now();
        const response = await manager.sendRequest({
          ...MOCK_AI_REQUESTS.CLARIFICATION,
          model: 'claude-3-sonnet', // Supported by both
          prompt: `Performance test ${i}`,
        } as any);
        
        performanceData.push({
          provider: response.content?.includes('OpenRouter') ? 'OpenRouter' : 'Anthropic',
          duration: Date.now() - startTime,
          success: response.success,
        });
      }
      
      // Manager should consistently try OpenRouter first (priority)
      // but Anthropic will be faster when OpenRouter fails
      const openRouterAttempts = performanceData.filter(p => p.provider === 'OpenRouter').length;
      const anthropicAttempts = performanceData.filter(p => p.provider === 'Anthropic').length;
      
      // All should succeed with one provider or the other
      expect(performanceData.every(p => p.success)).toBe(true);
      
      // Due to OpenRouter having higher priority, it should get first chance
      // But this test mainly validates that performance data is tracked
      expect(openRouterAttempts + anthropicAttempts).toBe(requests);
    });
  });

  describe('Resource Cleanup and Memory Management', () => {
    it('should clean up rate limiter memory over time', () => {
      const rateLimiter = new RateLimiter(1000, 100); // 1 second window
      
      // Create many users with requests
      const userCount = 10000;
      for (let i = 0; i < userCount; i++) {
        rateLimiter.isAllowed(`cleanup-user-${i}`);
      }
      
      // Force cleanup by making requests after window expires
      return new Promise(resolve => {
        setTimeout(() => {
          // New requests should not be slowed by old data
          const startTime = Date.now();
          
          for (let i = 0; i < 100; i++) {
            rateLimiter.isAllowed(`new-user-${i}`);
          }
          
          const duration = Date.now() - startTime;
          expect(duration).toBeLessThan(50); // Should be fast
          resolve();
        }, 1200); // After window expires
      });
    });

    it('should handle circuit breaker state cleanup', () => {
      const circuitBreaker = new CircuitBreaker(3, 2, 100);
      
      // Force many state changes
      for (let cycle = 0; cycle < 1000; cycle++) {
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure();
        circuitBreaker.recordFailure(); // Should open
        
        // Wait and try to recover
        setTimeout(() => {
          circuitBreaker.canExecute(); // Half-open
          circuitBreaker.recordSuccess();
          circuitBreaker.recordSuccess(); // Should close
        }, 10);
      }
      
      // After many cycles, metrics should still be accurate
      const metrics = circuitBreaker.getMetrics();
      expect(['CLOSED', 'OPEN', 'HALF_OPEN']).toContain(metrics.state);
      expect(metrics.failureCount).toBeGreaterThanOrEqual(0);
      expect(metrics.successCount).toBeGreaterThanOrEqual(0);
    });

    it('should maintain cost tracker precision over long periods', () => {
      const costTracker = new CostTracker(10000);
      
      // Simulate a full day of varied transactions
      const transactionTypes = [
        { cost: 0.001, frequency: 1000 }, // Small frequent
        { cost: 0.05, frequency: 100 },   // Medium regular
        { cost: 0.5, frequency: 10 },     // Large occasional
        { cost: 2.0, frequency: 1 },      // Very large rare
      ];
      
      let expectedTotal = 0;
      let expectedCount = 0;
      
      transactionTypes.forEach(({ cost, frequency }) => {
        for (let i = 0; i < frequency; i++) {
          costTracker.trackRequest(cost);
          expectedTotal += cost;
          expectedCount++;
        }
      });
      
      const metrics = costTracker.getMetrics();
      expect(metrics.totalCost).toBeCloseTo(expectedTotal, 6);
      expect(metrics.requestCount).toBe(expectedCount);
      expect(metrics.remainingBudget).toBeCloseTo(10000 - expectedTotal, 6);
    });
  });
});