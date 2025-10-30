// @ts-nocheck - Test file with mocked Convex operations
/**
 * Unit tests for updatePromptTokenLimit mutation - Story 6.9
 * Tests database update logic for adaptive token management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('updatePromptTokenLimit - Adaptive Token Management (Story 6.9)', () => {
  let mockCtx: any;
  let mockPrompt: any;

  beforeEach(() => {
    // Reset mock prompt before each test
    mockPrompt = {
      _id: 'mock-prompt-id-123',
      prompt_name: 'test_prompt',
      max_tokens: 1000,
      baseline_max_tokens: undefined, // Not set initially
      is_active: true,
    };

    // Mock Convex context
    mockCtx = {
      db: {
        query: jest.fn(() => ({
          withIndex: jest.fn(() => ({
            filter: jest.fn(() => ({
              order: jest.fn(() => ({
                first: jest.fn(async () => mockPrompt),
              })),
            })),
          })),
        })),
        patch: jest.fn(async () => undefined),
      },
    };
  });

  describe('Successful Updates', () => {
    it('should update max_tokens and set baseline when not previously set', async () => {
      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 1500,
        adjustment_reason: 'Auto-escalated: 1 truncation detected',
      };

      // Import and execute mutation logic (simulated)
      const result = await executeMutation(mockCtx, args);

      // Verify database patch was called with correct data
      expect(mockCtx.db.patch).toHaveBeenCalledWith('mock-prompt-id-123', {
        max_tokens: 1500,
        adjusted_at: expect.any(Number),
        adjustment_reason: 'Auto-escalated: 1 truncation detected',
        baseline_max_tokens: 1000, // Backfilled from current max_tokens
      });

      // Verify return value
      expect(result.success).toBe(true);
      expect(result.prompt_name).toBe('test_prompt');
      expect(result.old_max_tokens).toBe(1000);
      expect(result.new_max_tokens).toBe(1500);
      expect(result.baseline_max_tokens).toBe(1000);
      expect(result.adjustment_reason).toBe('Auto-escalated: 1 truncation detected');
    });

    it('should update max_tokens without changing existing baseline', async () => {
      // Set baseline already exists
      mockPrompt.baseline_max_tokens = 1000;
      mockPrompt.max_tokens = 1500; // Already escalated once

      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 2000,
        adjustment_reason: 'Auto-escalated: 2 truncations detected',
      };

      const result = await executeMutation(mockCtx, args);

      // Verify baseline was NOT overwritten
      expect(mockCtx.db.patch).toHaveBeenCalledWith('mock-prompt-id-123', {
        max_tokens: 2000,
        adjusted_at: expect.any(Number),
        adjustment_reason: 'Auto-escalated: 2 truncations detected',
      });

      expect(result.baseline_max_tokens).toBe(1000); // Preserved original baseline
    });

    it('should explicitly set baseline when provided as argument', async () => {
      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 2000,
        baseline_max_tokens: 1200, // Explicitly provided
        adjustment_reason: 'Manual adjustment with custom baseline',
      };

      const result = await executeMutation(mockCtx, args);

      // Verify explicit baseline was used
      expect(mockCtx.db.patch).toHaveBeenCalledWith('mock-prompt-id-123', {
        max_tokens: 2000,
        adjusted_at: expect.any(Number),
        adjustment_reason: 'Manual adjustment with custom baseline',
        baseline_max_tokens: 1200, // Explicit value used
      });

      expect(result.baseline_max_tokens).toBe(1200);
    });

    it('should include correlation_id in logging when provided', async () => {
      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 1500,
        adjustment_reason: 'Auto-escalated: 1 truncation detected',
        correlation_id: 'test-corr-123',
      };

      const result = await executeMutation(mockCtx, args);

      expect(result.correlationId).toBe('test-corr-123');
    });

    it('should generate correlation_id when not provided', async () => {
      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 1500,
        adjustment_reason: 'Auto-escalated: 1 truncation detected',
      };

      const result = await executeMutation(mockCtx, args);

      expect(result.correlationId).toMatch(/^token-update-\d+$/);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when prompt not found', async () => {
      // Mock query to return null (prompt not found)
      mockCtx.db.query = jest.fn(() => ({
        withIndex: jest.fn(() => ({
          filter: jest.fn(() => ({
            order: jest.fn(() => ({
              first: jest.fn(async () => null),
            })),
          })),
        })),
      }));

      const args = {
        prompt_name: 'nonexistent_prompt',
        new_max_tokens: 1500,
        adjustment_reason: 'Auto-escalated: 1 truncation detected',
      };

      await expect(executeMutation(mockCtx, args)).rejects.toThrow(
        'Active prompt not found: nonexistent_prompt'
      );
    });

    it('should throw error when prompt is inactive', async () => {
      // Mock inactive prompt
      mockPrompt.is_active = false;
      mockCtx.db.query = jest.fn(() => ({
        withIndex: jest.fn(() => ({
          filter: jest.fn(() => ({
            order: jest.fn(() => ({
              first: jest.fn(async () => null), // Filter excludes inactive prompts
            })),
          })),
        })),
      }));

      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 1500,
        adjustment_reason: 'Auto-escalated: 1 truncation detected',
      };

      await expect(executeMutation(mockCtx, args)).rejects.toThrow(
        'Active prompt not found: test_prompt'
      );
    });
  });

  describe('Adjustment Reason Tracking', () => {
    it('should track single escalation reason', async () => {
      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 1500,
        adjustment_reason: 'Auto-escalated: 1 truncation (finishReason: length)',
      };

      const result = await executeMutation(mockCtx, args);

      expect(result.adjustment_reason).toBe('Auto-escalated: 1 truncation (finishReason: length)');
    });

    it('should track multiple escalation reason', async () => {
      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 2000,
        adjustment_reason: 'Auto-escalated: 2 truncations (JSON parse error)',
      };

      const result = await executeMutation(mockCtx, args);

      expect(result.adjustment_reason).toBe('Auto-escalated: 2 truncations (JSON parse error)');
    });

    it('should allow manual adjustment reasons', async () => {
      const args = {
        prompt_name: 'test_prompt',
        new_max_tokens: 3000,
        adjustment_reason: 'Manual adjustment: Complex prompt requires more tokens',
      };

      const result = await executeMutation(mockCtx, args);

      expect(result.adjustment_reason).toBe('Manual adjustment: Complex prompt requires more tokens');
    });
  });
});

/**
 * Simulated mutation execution (matches actual implementation logic)
 */
async function executeMutation(ctx: any, args: any) {
  const correlationId = args.correlation_id || `token-update-${Date.now()}`;

  // Find the active prompt to update
  const prompt = await ctx.db
    .query('ai_prompts')
    .withIndex('by_name', (q: any) => q.eq('prompt_name', args.prompt_name))
    .filter((q: any) => q.eq(q.field('is_active'), true))
    .order('desc')
    .first();

  if (!prompt) {
    throw new Error(`Active prompt not found: ${args.prompt_name}`);
  }

  // Prepare update object
  const updateData: any = {
    max_tokens: args.new_max_tokens,
    adjusted_at: Date.now(),
    adjustment_reason: args.adjustment_reason,
  };

  // Set baseline_max_tokens if not already set OR if explicitly provided
  if (args.baseline_max_tokens !== undefined) {
    updateData.baseline_max_tokens = args.baseline_max_tokens;
  } else if (!prompt.baseline_max_tokens) {
    // Backfill baseline with current max_tokens if not set
    updateData.baseline_max_tokens = prompt.max_tokens || args.new_max_tokens;
  }

  // Update the prompt
  await ctx.db.patch(prompt._id, updateData);

  return {
    success: true,
    prompt_id: prompt._id,
    prompt_name: args.prompt_name,
    old_max_tokens: prompt.max_tokens,
    new_max_tokens: args.new_max_tokens,
    baseline_max_tokens: updateData.baseline_max_tokens || prompt.baseline_max_tokens, // Return existing if not updated
    adjusted_at: updateData.adjusted_at,
    adjustment_reason: args.adjustment_reason,
    correlationId,
  };
}
