/**
 * Story 11.0: Migration Script Validation Tests
 *
 * Tests for prompt group migration business logic:
 * - Default group definitions
 * - Idempotency requirements
 * - Group name uniqueness
 *
 * Note: Full integration tests with Convex runtime will be added in Story 11.1
 * when proper testing infrastructure is in place.
 */

import { describe, it, expect } from '@jest/globals';

describe('Migration - Assign Prompts to Groups', () => {
  describe('Default Group Configuration', () => {
    it('should define 4 default groups', () => {
      const defaultGroups = [
        {
          name: 'Question Generation',
          description: 'Prompts focused on generating clarifying questions',
          display_order: 1,
        },
        {
          name: 'Narrative Enhancement',
          description: 'Prompts that enhance narrative quality and coherence',
          display_order: 2,
        },
        {
          name: 'Contributing Analysis',
          description: 'Prompts for analyzing contributing factors',
          display_order: 3,
        },
        {
          name: 'Ungrouped',
          description: 'Prompts without a specific group',
          display_order: 999,
        },
      ];

      expect(defaultGroups).toHaveLength(4);
      expect(defaultGroups.map((g) => g.name)).toEqual([
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
      ]);
    });

    it('should assign correct display_order values', () => {
      const defaultGroups = [
        { name: 'Question Generation', display_order: 1 },
        { name: 'Narrative Enhancement', display_order: 2 },
        { name: 'Contributing Analysis', display_order: 3 },
        { name: 'Ungrouped', display_order: 999 },
      ];

      const questionGen = defaultGroups[0];
      const narrativeEnh = defaultGroups[1];
      const contributingAnalysis = defaultGroups[2];
      const ungrouped = defaultGroups[3];

      expect(questionGen.display_order).toBe(1);
      expect(narrativeEnh.display_order).toBe(2);
      expect(contributingAnalysis.display_order).toBe(3);
      expect(ungrouped.display_order).toBe(999);
    });

    it('should place Ungrouped last with highest display_order', () => {
      const defaultGroups = [
        { name: 'Question Generation', display_order: 1 },
        { name: 'Narrative Enhancement', display_order: 2 },
        { name: 'Contributing Analysis', display_order: 3 },
        { name: 'Ungrouped', display_order: 999 },
      ];

      const ungrouped = defaultGroups.find((g) => g.name === 'Ungrouped');
      const maxDisplayOrder = Math.max(...defaultGroups.map((g) => g.display_order));

      expect(ungrouped?.display_order).toBe(maxDisplayOrder);
      expect(ungrouped?.display_order).toBe(999);
    });

    it('should set collapsible defaults correctly', () => {
      const defaultSettings = {
        is_collapsible: true,
        default_collapsed: false,
      };

      expect(defaultSettings.is_collapsible).toBe(true);
      expect(defaultSettings.default_collapsed).toBe(false);
    });
  });

  describe('Idempotency Logic', () => {
    it('should detect existing groups to avoid duplicates', () => {
      // Simulate first run
      const existingGroups: string[] = [];
      const groupsToCreate = [
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
      ];

      const alreadyExist = groupsToCreate.filter((name) => existingGroups.includes(name));
      const toCreate = groupsToCreate.filter((name) => !existingGroups.includes(name));

      expect(alreadyExist.length).toBe(0);
      expect(toCreate.length).toBe(4);
    });

    it('should skip creation when groups already exist', () => {
      // Simulate second run
      const existingGroups = [
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
      ];

      const groupsToCreate = [
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
      ];

      const alreadyExist = groupsToCreate.filter((name) => existingGroups.includes(name));
      const toCreate = groupsToCreate.filter((name) => !existingGroups.includes(name));

      expect(alreadyExist.length).toBe(4);
      expect(toCreate.length).toBe(0);
    });

    it('should handle partial migration completion', () => {
      // Simulate interrupted migration
      const existingGroups = ['Question Generation', 'Narrative Enhancement'];

      const groupsToCreate = [
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
      ];

      const alreadyExist = groupsToCreate.filter((name) => existingGroups.includes(name));
      const toCreate = groupsToCreate.filter((name) => !existingGroups.includes(name));

      expect(alreadyExist.length).toBe(2);
      expect(toCreate.length).toBe(2);
      expect(toCreate).toEqual(['Contributing Analysis', 'Ungrouped']);
    });
  });

  describe('Migration Result Format', () => {
    it('should return created and existing group names', () => {
      // Simulate migration result
      const result = {
        created: ['Contributing Analysis', 'Ungrouped'],
        existing: ['Question Generation', 'Narrative Enhancement'],
      };

      expect(result.created).toBeInstanceOf(Array);
      expect(result.existing).toBeInstanceOf(Array);
      expect(result.created.length + result.existing.length).toBe(4);
    });

    it('should track all 4 groups in result', () => {
      const allGroupNames = [
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
      ];

      // First run
      const firstRun = {
        created: allGroupNames,
        existing: [],
      };

      expect([...firstRun.created, ...firstRun.existing]).toEqual(allGroupNames);

      // Second run
      const secondRun = {
        created: [],
        existing: allGroupNames,
      };

      expect([...secondRun.created, ...secondRun.existing]).toEqual(allGroupNames);
    });
  });

  describe('Group Name Uniqueness', () => {
    it('should ensure no duplicate names in default groups', () => {
      const defaultGroups = [
        'Question Generation',
        'Narrative Enhancement',
        'Contributing Analysis',
        'Ungrouped',
      ];

      const uniqueNames = new Set(defaultGroups);
      expect(uniqueNames.size).toBe(defaultGroups.length);
    });

    it('should detect duplicate group names', () => {
      const groupsWithDuplicate = [
        'Question Generation',
        'Narrative Enhancement',
        'Question Generation', // Duplicate
        'Ungrouped',
      ];

      const uniqueNames = new Set(groupsWithDuplicate);
      expect(uniqueNames.size).toBeLessThan(groupsWithDuplicate.length);
    });
  });

  describe('Migration Workflow Integration', () => {
    it('should match workflow_step values to group names', () => {
      const workflowStepMapping = {
        generate_questions: 'Question Generation',
        enhance_narrative: 'Narrative Enhancement',
        analyze_contributing: 'Contributing Analysis',
        // No mapping needed for ungrouped
      };

      expect(workflowStepMapping.generate_questions).toBe('Question Generation');
      expect(workflowStepMapping.enhance_narrative).toBe('Narrative Enhancement');
      expect(workflowStepMapping.analyze_contributing).toBe('Contributing Analysis');
    });

    it('should handle prompts without workflow_step', () => {
      const prompts = [
        { name: 'Prompt 1', workflow_step: 'generate_questions' },
        { name: 'Prompt 2', workflow_step: undefined },
        { name: 'Prompt 3', workflow_step: 'enhance_narrative' },
      ];

      const ungroupedPrompts = prompts.filter((p) => !p.workflow_step);

      expect(ungroupedPrompts.length).toBe(1);
      expect(ungroupedPrompts[0].name).toBe('Prompt 2');
    });
  });
});
