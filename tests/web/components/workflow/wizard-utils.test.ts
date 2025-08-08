// @ts-nocheck
import {
  createWizardStep,
  createWizardConfig,
  validateWizardCompletion,
  calculateWizardProgress,
  canNavigateToStep,
  checkStepDependencies,
  getNextAvailableStep,
  getAllValidationErrors,
  generateCorrelationId,
  formatDuration,
  cloneWizardData,
  mergeWizardData,
} from '@/lib/wizard/wizard-utils';
import { WizardStep, WizardConfig } from '@/components/workflow/wizard-types';

// Mock component for testing
const MockComponent = () => null;

describe('Wizard Utils', () => {
  describe('createWizardStep', () => {
    it('creates wizard step with required properties', () => {
      const step = createWizardStep('test-step', 'Test Step', MockComponent);
      
      expect(step).toEqual({
        id: 'test-step',
        title: 'Test Step',
        component: MockComponent,
        required: true,
        canNavigateBack: true,
      });
    });

    it('merges custom options', () => {
      const step = createWizardStep('test-step', 'Test Step', MockComponent, {
        required: false,
        isOptional: true,
        estimatedTime: 5,
        helpContent: 'Help text',
      });
      
      expect(step).toEqual({
        id: 'test-step',
        title: 'Test Step',
        component: MockComponent,
        required: false,
        canNavigateBack: true,
        isOptional: true,
        estimatedTime: 5,
        helpContent: 'Help text',
      });
    });
  });

  describe('createWizardConfig', () => {
    const mockSteps: WizardStep[] = [
      createWizardStep('step1', 'Step 1', MockComponent),
      createWizardStep('step2', 'Step 2', MockComponent),
    ];
    const mockOnComplete = jest.fn();

    it('creates wizard config with required properties', () => {
      const config = createWizardConfig('test-wizard', mockSteps, mockOnComplete);
      
      expect(config).toEqual({
        id: 'test-wizard',
        steps: mockSteps,
        onComplete: mockOnComplete,
        autoSave: true,
        allowBackNavigation: true,
        persistSession: true,
        debounceMs: 300,
      });
    });

    it('merges custom options', () => {
      const config = createWizardConfig('test-wizard', mockSteps, mockOnComplete, {
        autoSave: false,
        debounceMs: 500,
        title: 'Custom Title',
        onCancel: jest.fn(),
      });
      
      expect(config).toEqual({
        id: 'test-wizard',
        steps: mockSteps,
        onComplete: mockOnComplete,
        autoSave: false,
        allowBackNavigation: true,
        persistSession: true,
        debounceMs: 500,
        title: 'Custom Title',
        onCancel: expect.any(Function),
      });
    });
  });

  describe('validateWizardCompletion', () => {
    const mockConfig: WizardConfig = {
      id: 'test-wizard',
      steps: [
        { id: 'step1', title: 'Step 1', component: MockComponent, required: true },
        { id: 'step2', title: 'Step 2', component: MockComponent, required: true },
        { id: 'step3', title: 'Step 3', component: MockComponent, required: false, isOptional: true },
      ],
      onComplete: jest.fn(),
      autoSave: true,
      allowBackNavigation: true,
      persistSession: true,
      debounceMs: 300,
    };

    it('validates successful completion', () => {
      const completedSteps = new Set(['step1', 'step2']);
      const result = validateWizardCompletion(mockConfig, completedSteps);
      
      expect(result.isValid).toBe(true);
    });

    it('identifies missing required steps', () => {
      const completedSteps = new Set(['step1']);
      const result = validateWizardCompletion(mockConfig, completedSteps);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please complete the following required steps: Step 2');
    });

    it('allows optional steps to be incomplete', () => {
      const completedSteps = new Set(['step1', 'step2']);
      const result = validateWizardCompletion(mockConfig, completedSteps);
      
      expect(result.isValid).toBe(true);
    });

    it('lists multiple missing steps', () => {
      const completedSteps = new Set<string>();
      const result = validateWizardCompletion(mockConfig, completedSteps);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Please complete the following required steps: Step 1, Step 2');
    });
  });

  describe('calculateWizardProgress', () => {
    const mockConfig: WizardConfig = {
      id: 'test-wizard',
      steps: [
        { id: 'step1', title: 'Step 1', component: MockComponent, required: true, estimatedTime: 10 },
        { id: 'step2', title: 'Step 2', component: MockComponent, required: true, estimatedTime: 15 },
        { id: 'step3', title: 'Step 3', component: MockComponent, required: false, isOptional: true, estimatedTime: 5 },
      ],
      onComplete: jest.fn(),
      autoSave: true,
      allowBackNavigation: true,
      persistSession: true,
      debounceMs: 300,
    };

    it('calculates progress correctly', () => {
      const completedSteps = new Set(['step1']);
      const progress = calculateWizardProgress(mockConfig, completedSteps);
      
      expect(progress).toEqual({
        totalSteps: 3,
        completedSteps: 1,
        requiredSteps: 2,
        completedRequired: 1,
        optionalSteps: 1,
        completedOptional: 0,
        percentageComplete: 33.33333333333333,
        percentageRequiredComplete: 50,
        estimatedTimeRemaining: 20, // 15 + 5
        estimatedTimeTotal: 30, // 10 + 15 + 5
      });
    });

    it('handles completed wizard', () => {
      const completedSteps = new Set(['step1', 'step2', 'step3']);
      const progress = calculateWizardProgress(mockConfig, completedSteps);
      
      expect(progress.percentageComplete).toBe(100);
      expect(progress.percentageRequiredComplete).toBe(100);
      expect(progress.estimatedTimeRemaining).toBe(0);
    });

    it('handles wizard with no estimated times', () => {
      const configWithoutTimes = {
        ...mockConfig,
        steps: mockConfig.steps.map(step => ({ ...step, estimatedTime: undefined }))
      };
      
      const completedSteps = new Set(['step1']);
      const progress = calculateWizardProgress(configWithoutTimes, completedSteps);
      
      expect(progress.estimatedTimeRemaining).toBe(0);
      expect(progress.estimatedTimeTotal).toBe(0);
    });
  });

  describe('checkStepDependencies', () => {
    it('allows steps with no dependencies', () => {
      const step: WizardStep = {
        id: 'step1',
        title: 'Step 1',
        component: MockComponent,
        required: true,
      };
      
      const completedSteps = new Set<string>();
      const result = checkStepDependencies(step, completedSteps);
      
      expect(result).toBe(true);
    });

    it('checks satisfied dependencies', () => {
      const step: WizardStep = {
        id: 'step2',
        title: 'Step 2',
        component: MockComponent,
        required: true,
        dependencies: ['step1'],
      };
      
      const completedSteps = new Set(['step1']);
      const result = checkStepDependencies(step, completedSteps);
      
      expect(result).toBe(true);
    });

    it('checks unsatisfied dependencies', () => {
      const step: WizardStep = {
        id: 'step2',
        title: 'Step 2',
        component: MockComponent,
        required: true,
        dependencies: ['step1'],
      };
      
      const completedSteps = new Set<string>();
      const result = checkStepDependencies(step, completedSteps);
      
      expect(result).toBe(false);
    });

    it('checks multiple dependencies', () => {
      const step: WizardStep = {
        id: 'step3',
        title: 'Step 3',
        component: MockComponent,
        required: true,
        dependencies: ['step1', 'step2'],
      };
      
      // Only one dependency satisfied
      let completedSteps = new Set(['step1']);
      let result = checkStepDependencies(step, completedSteps);
      expect(result).toBe(false);
      
      // All dependencies satisfied
      completedSteps = new Set(['step1', 'step2']);
      result = checkStepDependencies(step, completedSteps);
      expect(result).toBe(true);
    });
  });

  describe('canNavigateToStep', () => {
    const mockConfig: WizardConfig = {
      id: 'test-wizard',
      steps: [
        { id: 'step1', title: 'Step 1', component: MockComponent, required: true },
        { id: 'step2', title: 'Step 2', component: MockComponent, required: true, dependencies: ['step1'] },
        { id: 'step3', title: 'Step 3', component: MockComponent, required: true },
      ],
      onComplete: jest.fn(),
      autoSave: true,
      allowBackNavigation: true,
      persistSession: true,
      debounceMs: 300,
    };

    it('allows navigation to first step', () => {
      const completedSteps = new Set<string>();
      const result = canNavigateToStep(mockConfig, 'step1', completedSteps);
      
      expect(result).toBe(true);
    });

    it('checks dependencies in non-linear navigation', () => {
      const completedSteps = new Set<string>();
      const result = canNavigateToStep(mockConfig, 'step2', completedSteps, true);
      
      expect(result).toBe(false);
    });

    it('allows navigation when dependencies are satisfied', () => {
      const completedSteps = new Set(['step1']);
      const result = canNavigateToStep(mockConfig, 'step2', completedSteps, true);
      
      expect(result).toBe(true);
    });

    it('returns false for non-existent step', () => {
      const completedSteps = new Set<string>();
      const result = canNavigateToStep(mockConfig, 'nonexistent', completedSteps);
      
      expect(result).toBe(false);
    });
  });

  describe('getNextAvailableStep', () => {
    const mockConfig: WizardConfig = {
      id: 'test-wizard',
      steps: [
        { id: 'step1', title: 'Step 1', component: MockComponent, required: true },
        { id: 'step2', title: 'Step 2', component: MockComponent, required: true, dependencies: ['step3'] }, // Blocked by step3
        { id: 'step3', title: 'Step 3', component: MockComponent, required: true },
        { id: 'step4', title: 'Step 4', component: MockComponent, required: true },
      ],
      onComplete: jest.fn(),
      autoSave: true,
      allowBackNavigation: true,
      persistSession: true,
      debounceMs: 300,
    };

    it('finds next available step without dependencies', () => {
      const completedSteps = new Set<string>();
      const nextStep = getNextAvailableStep(mockConfig, 0, completedSteps);
      
      expect(nextStep).toBe(2); // step3 at index 2
    });

    it('finds step after dependencies are satisfied', () => {
      const completedSteps = new Set(['step3']);
      const nextStep = getNextAvailableStep(mockConfig, 0, completedSteps);
      
      expect(nextStep).toBe(1); // step2 at index 1 is now available
    });

    it('returns null when no steps are available', () => {
      const blockingConfig: WizardConfig = {
        ...mockConfig,
        steps: [
          { id: 'step1', title: 'Step 1', component: MockComponent, required: true },
          { id: 'step2', title: 'Step 2', component: MockComponent, required: true, dependencies: ['step3'] },
          { id: 'step3', title: 'Step 3', component: MockComponent, required: true, dependencies: ['step2'] }, // Circular dependency
        ],
      };
      
      const completedSteps = new Set<string>();
      const nextStep = getNextAvailableStep(blockingConfig, 0, completedSteps);
      
      expect(nextStep).toBeNull();
    });
  });

  describe('getAllValidationErrors', () => {
    const mockValidator = jest.fn();
    const mockConfig: WizardConfig = {
      id: 'test-wizard',
      steps: [
        { id: 'step1', title: 'Step 1', component: MockComponent, required: true, validator: mockValidator },
        { id: 'step2', title: 'Step 2', component: MockComponent, required: true },
        { id: 'step3', title: 'Step 3', component: MockComponent, required: true, validator: mockValidator },
      ],
      onComplete: jest.fn(),
      autoSave: true,
      allowBackNavigation: true,
      persistSession: true,
      debounceMs: 300,
    };

    afterEach(() => {
      mockValidator.mockReset();
    });

    it('collects validation errors from all steps', () => {
      mockValidator
        .mockReturnValueOnce({ isValid: false, message: 'Error in step 1' })
        .mockReturnValueOnce({ isValid: false, message: 'Error in step 3' });
      
      const data = { field1: 'value1' };
      const errors = getAllValidationErrors(mockConfig, data);
      
      expect(errors.size).toBe(2);
      expect(errors.get('step1')).toBe('Error in step 1');
      expect(errors.get('step3')).toBe('Error in step 3');
    });

    it('excludes valid steps from error collection', () => {
      mockValidator
        .mockReturnValueOnce({ isValid: true })
        .mockReturnValueOnce({ isValid: false, message: 'Error in step 3' });
      
      const data = { field1: 'value1' };
      const errors = getAllValidationErrors(mockConfig, data);
      
      expect(errors.size).toBe(1);
      expect(errors.get('step1')).toBeUndefined();
      expect(errors.get('step3')).toBe('Error in step 3');
    });

    it('handles validation exceptions', () => {
      mockValidator
        .mockImplementationOnce(() => { throw new Error('Validation crashed'); })
        .mockReturnValueOnce({ isValid: true });
      
      const data = { field1: 'value1' };
      const errors = getAllValidationErrors(mockConfig, data);
      
      expect(errors.size).toBe(1);
      expect(errors.get('step1')).toBe('Validation crashed');
    });

    it('handles generic error objects', () => {
      mockValidator.mockImplementationOnce(() => { throw 'String error'; });
      
      const data = { field1: 'value1' };
      const errors = getAllValidationErrors(mockConfig, data);
      
      expect(errors.get('step1')).toBe('Validation error');
    });
  });

  describe('generateCorrelationId', () => {
    it('generates unique correlation IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      
      expect(id1).toMatch(/^wizard_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^wizard_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatDuration', () => {
    it('formats minutes correctly', () => {
      expect(formatDuration(30)).toBe('30m');
      expect(formatDuration(5)).toBe('5m');
    });

    it('formats hours correctly', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('formats hours and minutes correctly', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(125)).toBe('2h 5m');
    });

    it('handles edge cases', () => {
      expect(formatDuration(0)).toBe('0m');
      expect(formatDuration(1)).toBe('1m');
    });
  });

  describe('cloneWizardData', () => {
    it('creates deep clone of data', () => {
      const originalData = {
        field1: 'value1',
        nested: {
          field2: 'value2',
          array: [1, 2, 3],
        },
      };
      
      const clonedData = cloneWizardData(originalData);
      
      expect(clonedData).toEqual(originalData);
      expect(clonedData).not.toBe(originalData);
      expect(clonedData.nested).not.toBe(originalData.nested);
      expect(clonedData.nested.array).not.toBe(originalData.nested.array);
    });

    it('handles null and undefined values', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        validValue: 'test',
      };
      
      const cloned = cloneWizardData(data);
      
      expect(cloned.nullValue).toBeNull();
      expect(cloned.undefinedValue).toBeUndefined();
      expect(cloned.validValue).toBe('test');
    });
  });

  describe('mergeWizardData', () => {
    it('merges data correctly', () => {
      const currentData = {
        field1: 'value1',
        field2: 'value2',
        nested: {
          nestedField1: 'nestedValue1',
        },
      };
      
      const newData = {
        field2: 'updatedValue2',
        field3: 'value3',
      };
      
      const merged = mergeWizardData(currentData, newData);
      
      expect(merged).toEqual({
        field1: 'value1',
        field2: 'updatedValue2',
        nested: {
          nestedField1: 'nestedValue1',
        },
        field3: 'value3',
      });
    });

    it('overwrites with new values', () => {
      const currentData = { field1: 'oldValue' };
      const newData = { field1: 'newValue' };
      
      const merged = mergeWizardData(currentData, newData);
      
      expect(merged.field1).toBe('newValue');
    });

    it('handles empty updates', () => {
      const currentData = { field1: 'value1' };
      const newData = {};
      
      const merged = mergeWizardData(currentData, newData);
      
      expect(merged).toEqual(currentData);
      expect(merged).not.toBe(currentData); // Should still create new object
    });
  });
});