// @ts-nocheck - Test file with mocked adaptive token escalation scenarios
/**
 * Unit tests for retryWithAdaptiveTokens - Story 6.9
 * Tests adaptive token escalation logic with truncation detection
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { retryWithAdaptiveTokens } from '@/aiClarification';

describe('retryWithAdaptiveTokens - Adaptive Token Escalation (Story 6.9)', () => {
  let mockCtx: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variable for each test
    delete process.env.MAX_TOKEN_ESCALATION_CAP;

    // Mock Convex context for database updates (Story 6.9 - Task 6)
    mockCtx = {
      runMutation: jest.fn().mockResolvedValue({
        success: true,
        prompt_name: 'test_prompt',
        old_max_tokens: 1000,
        new_max_tokens: 1500,
        baseline_max_tokens: 1000,
      }),
    };
  });

  describe('Baseline Success (no escalation)', () => {
    it('should succeed on first attempt with baseline tokens', async () => {
      // Mock operation that succeeds immediately
      const mockOperation = jest.fn(async (maxTokens: number) => {
        return {
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop', // Normal completion
        };
      });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-123',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify no escalations occurred
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith(1000); // Called with baseline

      // Verify result
      expect(result.result).toEqual({ questions: ['Q1', 'Q2', 'Q3'] });
      expect(result.final_max_tokens).toBe(1000);
      expect(result.escalations_used).toBe(0); // No escalations
      expect(result.finishReason).toBe('stop');
    });
  });

  describe('Single Escalation (+500)', () => {
    it('should escalate once on truncation then succeed', async () => {
      // Mock operation: fail with "length" on first call, succeed on second
      const mockOperation = jest.fn()
        .mockResolvedValueOnce({
          result: { questions: [] },
          finishReason: 'length', // Truncated
        })
        .mockResolvedValueOnce({
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop', // Success
        });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-456',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify 2 attempts (baseline + 1 escalation)
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOperation).toHaveBeenNthCalledWith(1, 1000); // Baseline
      expect(mockOperation).toHaveBeenNthCalledWith(2, 1500); // +500

      // Verify result
      expect(result.result).toEqual({ questions: ['Q1', 'Q2', 'Q3'] });
      expect(result.final_max_tokens).toBe(1500);
      expect(result.escalations_used).toBe(1); // 1 escalation
      expect(result.finishReason).toBe('stop');
    });

    it('should escalate once on JSON parse error then succeed', async () => {
      // Mock operation: throw JSON parse error first, then succeed
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failed to parse AI response as JSON: Unexpected token'))
        .mockResolvedValueOnce({
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop',
        });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-json',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify 2 attempts
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockOperation).toHaveBeenNthCalledWith(1, 1000); // Baseline
      expect(mockOperation).toHaveBeenNthCalledWith(2, 1500); // +500

      expect(result.escalations_used).toBe(1);
      expect(result.final_max_tokens).toBe(1500);
    });
  });

  describe('Multiple Escalations (+500, +1000)', () => {
    it('should escalate twice before succeeding', async () => {
      // Mock operation: fail twice with "length", succeed on third
      const mockOperation = jest.fn()
        .mockResolvedValueOnce({
          result: { questions: [] },
          finishReason: 'length', // Truncated attempt 1
        })
        .mockResolvedValueOnce({
          result: { questions: [] },
          finishReason: 'length', // Truncated attempt 2
        })
        .mockResolvedValueOnce({
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop', // Success attempt 3
        });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-multi',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify 3 attempts (baseline + 2 escalations)
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockOperation).toHaveBeenNthCalledWith(1, 1000); // Baseline
      expect(mockOperation).toHaveBeenNthCalledWith(2, 1500); // +500
      expect(mockOperation).toHaveBeenNthCalledWith(3, 2000); // +1000

      // Verify result
      expect(result.result).toEqual({ questions: ['Q1', 'Q2', 'Q3'] });
      expect(result.final_max_tokens).toBe(2000);
      expect(result.escalations_used).toBe(2); // 2 escalations
      expect(result.finishReason).toBe('stop');
    });
  });

  describe('Maximum Escalations Reached', () => {
    it('should fail after max_escalations attempts (default: 3)', async () => {
      // Mock operation: always return truncation
      const mockOperation = jest.fn().mockResolvedValue({
        result: { questions: [] },
        finishReason: 'length', // Always truncated
      });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-max',
      };

      // Expect it to throw after max attempts
      await expect(retryWithAdaptiveTokens(mockCtx, mockOperation, context)).rejects.toThrow(
        /Content truncated after 4 attempts/
      );

      // Verify 4 attempts (baseline + 3 escalations)
      expect(mockOperation).toHaveBeenCalledTimes(4);
      expect(mockOperation).toHaveBeenNthCalledWith(1, 1000); // Baseline
      expect(mockOperation).toHaveBeenNthCalledWith(2, 1500); // +500
      expect(mockOperation).toHaveBeenNthCalledWith(3, 2000); // +1000
      expect(mockOperation).toHaveBeenNthCalledWith(4, 2500); // +1500
    });
  });

  describe('Token Cap Enforcement', () => {
    it('should enforce default token cap (10000)', async () => {
      // Mock operation: always return truncation
      const mockOperation = jest.fn().mockResolvedValue({
        result: { questions: [] },
        finishReason: 'length',
      });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 9800, // Close to cap
        correlation_id: 'test-corr-cap',
      };

      // Expect it to throw when cap is reached
      await expect(retryWithAdaptiveTokens(mockCtx, mockOperation, context)).rejects.toThrow(
        /Token limit exceeded.*10000/
      );

      // Should attempt baseline (9800), then escalation would be 10300 (exceeds cap)
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenNthCalledWith(1, 9800);
    });

    it('should enforce custom token cap from environment variable', async () => {
      // Set custom cap
      process.env.MAX_TOKEN_ESCALATION_CAP = '5000';

      const mockOperation = jest.fn().mockResolvedValue({
        result: { questions: [] },
        finishReason: 'length',
      });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 4800, // Close to custom cap
        correlation_id: 'test-corr-custom-cap',
      };

      // Expect it to throw when custom cap is reached
      await expect(retryWithAdaptiveTokens(mockCtx, mockOperation, context)).rejects.toThrow(
        /Token limit exceeded.*5000/
      );

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenNthCalledWith(1, 4800);
    });
  });

  describe('Non-Truncation Errors', () => {
    it('should throw immediately on non-truncation errors (auth)', async () => {
      // Mock operation: throw auth error
      const mockOperation = jest.fn().mockRejectedValue(
        new Error('Authentication failed: Invalid session token')
      );

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-auth',
      };

      // Expect it to throw immediately (no retries)
      await expect(retryWithAdaptiveTokens(mockCtx, mockOperation, context)).rejects.toThrow(
        /Authentication failed/
      );

      // Verify only 1 attempt (no escalations for non-truncation errors)
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should throw immediately on network errors', async () => {
      // Mock operation: throw network error
      const mockOperation = jest.fn().mockRejectedValue(
        new Error('Network request failed: ECONNREFUSED')
      );

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-network',
      };

      await expect(retryWithAdaptiveTokens(mockCtx, mockOperation, context)).rejects.toThrow(
        /Network request failed/
      );

      // No escalations for network errors
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Early Exit on Normal Completion', () => {
    it('should not escalate if finish_reason is "stop"', async () => {
      // Mock operation: return stop immediately
      const mockOperation = jest.fn().mockResolvedValue({
        result: { questions: ['Q1', 'Q2'] },
        finishReason: 'stop', // Normal completion
      });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-early-exit',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify no escalations
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(result.escalations_used).toBe(0);
      expect(result.finishReason).toBe('stop');
    });

    it('should not escalate if finish_reason is "content_filter"', async () => {
      // Mock operation: return content_filter (not a truncation issue)
      const mockOperation = jest.fn().mockResolvedValue({
        result: { questions: [] },
        finishReason: 'content_filter', // Policy violation, not truncation
      });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-filter',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify no escalations (content_filter is not "length")
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(result.escalations_used).toBe(0);
      expect(result.finishReason).toBe('content_filter');
    });
  });

  describe('Database Update Integration (Story 6.9 - Task 6)', () => {
    it('should update database after successful escalation', async () => {
      // Mock operation: fail with "length" on first call, succeed on second
      const mockOperation = jest.fn()
        .mockResolvedValueOnce({
          result: { questions: [] },
          finishReason: 'length', // Truncated
        })
        .mockResolvedValueOnce({
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop', // Success
        });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-db-update',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify escalation occurred
      expect(result.escalations_used).toBe(1);
      expect(result.final_max_tokens).toBe(1500);

      // Verify database update was called
      expect(mockCtx.runMutation).toHaveBeenCalledTimes(1);
      expect(mockCtx.runMutation).toHaveBeenCalledWith(
        expect.anything(), // api.promptManager.updatePromptTokenLimit
        {
          prompt_name: 'test_prompt',
          new_max_tokens: 1500,
          adjustment_reason: expect.stringContaining('Auto-escalated: 1 truncation(s) detected'),
          correlation_id: 'test-corr-db-update',
        }
      );
    });

    it('should NOT update database when no escalation occurs', async () => {
      // Mock operation: succeed immediately
      const mockOperation = jest.fn().mockResolvedValue({
        result: { questions: ['Q1', 'Q2', 'Q3'] },
        finishReason: 'stop',
      });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-no-db-update',
      };

      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify no escalations
      expect(result.escalations_used).toBe(0);

      // Verify database update was NOT called
      expect(mockCtx.runMutation).not.toHaveBeenCalled();
    });

    it('should handle database update failure gracefully (non-blocking)', async () => {
      // Mock database update failure
      mockCtx.runMutation = jest.fn().mockRejectedValue(
        new Error('Database connection timeout')
      );

      // Mock operation: fail with "length" on first call, succeed on second
      const mockOperation = jest.fn()
        .mockResolvedValueOnce({
          result: { questions: [] },
          finishReason: 'length',
        })
        .mockResolvedValueOnce({
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop',
        });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-db-fail',
      };

      // Should NOT throw - database update is non-blocking
      const result = await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify operation succeeded despite database failure
      expect(result.result).toEqual({ questions: ['Q1', 'Q2', 'Q3'] });
      expect(result.escalations_used).toBe(1);
      expect(result.final_max_tokens).toBe(1500);

      // Verify database update was attempted
      expect(mockCtx.runMutation).toHaveBeenCalledTimes(1);
    });

    it('should generate correct adjustment_reason for finish_reason="length"', async () => {
      // Mock operation: truncate twice, then succeed
      const mockOperation = jest.fn()
        .mockResolvedValueOnce({
          result: { questions: [] },
          finishReason: 'length',
        })
        .mockResolvedValueOnce({
          result: { questions: [] },
          finishReason: 'length',
        })
        .mockResolvedValueOnce({
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop',
        });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-reason-length',
      };

      await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify adjustment_reason mentions finish_reason: length
      expect(mockCtx.runMutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adjustment_reason: 'Auto-escalated: 2 truncation(s) detected (finish_reason: length)',
        })
      );
    });

    it('should generate correct adjustment_reason for JSON parse error', async () => {
      // Mock operation: throw JSON parse error, then succeed
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Failed to parse AI response as JSON'))
        .mockResolvedValueOnce({
          result: { questions: ['Q1', 'Q2', 'Q3'] },
          finishReason: 'stop',
        });

      const context = {
        prompt_name: 'test_prompt',
        baseline_max_tokens: 1000,
        correlation_id: 'test-corr-reason-json',
      };

      await retryWithAdaptiveTokens(mockCtx, mockOperation, context);

      // Verify adjustment_reason mentions JSON parse error
      expect(mockCtx.runMutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adjustment_reason: 'Auto-escalated: 1 truncation(s) detected (JSON parse error)',
        })
      );
    });
  });
});
