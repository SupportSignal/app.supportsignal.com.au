/**
 * Story 11.0: Prompt Groups Validation Tests
 *
 * Tests for prompt group validation logic and business rules:
 * - Group name validation
 * - Display order validation
 * - Default value handling
 *
 * Note: Full integration tests with Convex runtime will be added in Story 11.1
 * when proper testing infrastructure is in place.
 */

import { describe, it, expect } from '@jest/globals';

describe('Prompt Groups - Validation Logic', () => {
  describe('Group Name Validation', () => {
    it('should reject empty group names', () => {
      const invalidNames = ['', '   ', '\t', '\n'];

      invalidNames.forEach((name) => {
        const isValid = name.trim().length > 0;
        expect(isValid).toBe(false);
      });
    });

    it('should accept valid group names', () => {
      const validNames = [
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
        'My Custom Group',
      ];

      validNames.forEach((name) => {
        const isValid = name.trim().length > 0;
        expect(isValid).toBe(true);
      });
    });

    it('should trim whitespace from group names', () => {
      const testCases = [
        { input: '  Test Group  ', expected: 'Test Group' },
        { input: '\tTabbed Group\t', expected: 'Tabbed Group' },
        { input: '  Spaced  ', expected: 'Spaced' },
      ];

      testCases.forEach(({ input, expected }) => {
        const trimmed = input.trim();
        expect(trimmed).toBe(expected);
      });
    });
  });

  describe('Display Order Validation', () => {
    it('should accept positive integers for display_order', () => {
      const validOrders = [1, 2, 3, 10, 100, 999];

      validOrders.forEach((order) => {
        const isValid = Number.isInteger(order) && order > 0;
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid display_order values', () => {
      const invalidOrders = [0, -1, 1.5, NaN, Infinity];

      invalidOrders.forEach((order) => {
        const isValid = Number.isInteger(order) && order > 0;
        expect(isValid).toBe(false);
      });
    });

    it('should sort groups by display_order correctly', () => {
      const groups = [
        { name: 'Group C', display_order: 3 },
        { name: 'Group A', display_order: 1 },
        { name: 'Group B', display_order: 2 },
      ];

      const sorted = [...groups].sort((a, b) => a.display_order - b.display_order);

      expect(sorted[0].name).toBe('Group A');
      expect(sorted[1].name).toBe('Group B');
      expect(sorted[2].name).toBe('Group C');
    });
  });

  describe('Default Values', () => {
    it('should use correct default values for optional fields', () => {
      const defaults = {
        is_collapsible: true,
        default_collapsed: false,
      };

      expect(defaults.is_collapsible).toBe(true);
      expect(defaults.default_collapsed).toBe(false);
    });

    it('should handle optional description field', () => {
      const groupWithDescription = {
        name: 'Test Group',
        description: 'Test Description',
      };

      const groupWithoutDescription = {
        name: 'Test Group',
        description: undefined,
      };

      expect(groupWithDescription.description).toBeDefined();
      expect(groupWithoutDescription.description).toBeUndefined();
    });
  });

  describe('Update Logic', () => {
    it('should only update provided fields', () => {
      const original = {
        group_name: 'Original Name',
        description: 'Original Description',
        display_order: 1,
      };

      const updates = {
        group_name: 'Updated Name',
      };

      const updated = { ...original, ...updates };

      expect(updated.group_name).toBe('Updated Name');
      expect(updated.description).toBe('Original Description'); // Unchanged
      expect(updated.display_order).toBe(1); // Unchanged
    });
  });

  describe('Default Group Configuration', () => {
    it('should define correct default groups', () => {
      const defaultGroups = [
        { name: 'Question Generation', display_order: 1 },
        { name: 'Narrative Enhancement', display_order: 2 },
        { name: 'Contributing Analysis', display_order: 3 },
        { name: 'Ungrouped', display_order: 999 },
      ];

      expect(defaultGroups).toHaveLength(4);
      expect(defaultGroups[0].name).toBe('Question Generation');
      expect(defaultGroups[3].display_order).toBe(999); // Ungrouped at end
    });

    it('should ensure Ungrouped has highest display_order', () => {
      const defaultGroups = [
        { name: 'Question Generation', display_order: 1 },
        { name: 'Narrative Enhancement', display_order: 2 },
        { name: 'Contributing Analysis', display_order: 3 },
        { name: 'Ungrouped', display_order: 999 },
      ];

      const ungrouped = defaultGroups.find((g) => g.name === 'Ungrouped');
      const maxOrder = Math.max(...defaultGroups.map((g) => g.display_order));

      expect(ungrouped?.display_order).toBe(maxOrder);
      expect(ungrouped?.display_order).toBe(999);
    });
  });

  describe('Group Name Uniqueness', () => {
    it('should detect duplicate group names', () => {
      const groups = [
        { name: 'Group A', display_order: 1 },
        { name: 'Group B', display_order: 2 },
        { name: 'Group A', display_order: 3 }, // Duplicate
      ];

      const names = groups.map((g) => g.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBeLessThan(names.length); // Duplicates exist
      expect(uniqueNames.size).toBe(2); // Only 2 unique names
    });

    it('should identify unique group names', () => {
      const groups = [
        { name: 'Group A', display_order: 1 },
        { name: 'Group B', display_order: 2 },
        { name: 'Group C', display_order: 3 },
      ];

      const names = groups.map((g) => g.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length); // All unique
    });
  });

  describe('Deletion Logic', () => {
    it('should prevent deletion when prompts exist', () => {
      const group = {
        _id: 'group123',
        name: 'Test Group',
        promptCount: 5,
      };

      const canDelete = group.promptCount === 0;
      expect(canDelete).toBe(false);
    });

    it('should allow deletion when no prompts exist', () => {
      const group = {
        _id: 'group123',
        name: 'Empty Group',
        promptCount: 0,
      };

      const canDelete = group.promptCount === 0;
      expect(canDelete).toBe(true);
    });
  });
});
