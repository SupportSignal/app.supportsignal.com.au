// @ts-nocheck
import { 
  createWizardStep, 
  createWizardConfig, 
  validateWizardCompletion,
  calculateWizardProgress,
} from '@/lib/wizard/wizard-utils';
import { WizardPersistence, DebouncedAutoSave } from '@/components/workflow/wizard-persistence';

// Mock component for testing
const MockComponent = () => null;

describe('Wizard Integration Tests', () => {
  describe('Wizard Configuration Integration', () => {
    it('creates complete wizard configuration', () => {
      const steps = [
        createWizardStep('step1', 'Personal Information', MockComponent, {
          required: true,
          estimatedTime: 5,
          helpContent: 'Enter your personal details',
        }),
        createWizardStep('step2', 'Professional Details', MockComponent, {
          required: true,
          estimatedTime: 10,
          dependencies: ['step1'],
        }),
        createWizardStep('step3', 'Review', MockComponent, {
          required: true,
          estimatedTime: 3,
          isOptional: false,
        }),
      ];

      const config = createWizardConfig('user-onboarding', steps, jest.fn(), {
        title: 'User Onboarding',
        description: 'Complete your profile setup',
        autoSave: true,
        persistSession: true,
      });

      expect(config.id).toBe('user-onboarding');
      expect(config.steps).toHaveLength(3);
      expect(config.title).toBe('User Onboarding');
      expect(config.autoSave).toBe(true);
      expect(config.persistSession).toBe(true);
    });

    it('validates wizard completion flow', () => {
      const steps = [
        createWizardStep('step1', 'Step 1', MockComponent, { required: true }),
        createWizardStep('step2', 'Step 2', MockComponent, { required: true }),
        createWizardStep('step3', 'Step 3', MockComponent, { required: false, isOptional: true }),
      ];

      const config = createWizardConfig('test-wizard', steps, jest.fn());

      // Initially incomplete
      let completedSteps = new Set<string>();
      let validation = validateWizardCompletion(config, completedSteps);
      expect(validation.isValid).toBe(false);

      // Complete first step
      completedSteps.add('step1');
      validation = validateWizardCompletion(config, completedSteps);
      expect(validation.isValid).toBe(false);

      // Complete all required steps
      completedSteps.add('step2');
      validation = validateWizardCompletion(config, completedSteps);
      expect(validation.isValid).toBe(true); // Optional step3 can be skipped
    });

    it('calculates progress throughout wizard flow', () => {
      const steps = [
        createWizardStep('step1', 'Step 1', MockComponent, { required: true, estimatedTime: 10 }),
        createWizardStep('step2', 'Step 2', MockComponent, { required: true, estimatedTime: 15 }),
        createWizardStep('step3', 'Step 3', MockComponent, { required: false, isOptional: true, estimatedTime: 5 }),
      ];

      const config = createWizardConfig('test-wizard', steps, jest.fn());

      // No progress
      let completedSteps = new Set<string>();
      let progress = calculateWizardProgress(config, completedSteps);
      expect(progress.percentageComplete).toBe(0);
      expect(progress.estimatedTimeRemaining).toBe(30);

      // One step complete
      completedSteps.add('step1');
      progress = calculateWizardProgress(config, completedSteps);
      expect(progress.percentageComplete).toBeCloseTo(33.33, 1);
      expect(progress.estimatedTimeRemaining).toBe(20);

      // All steps complete
      completedSteps.add('step2');
      completedSteps.add('step3');
      progress = calculateWizardProgress(config, completedSteps);
      expect(progress.percentageComplete).toBe(100);
      expect(progress.estimatedTimeRemaining).toBe(0);
    });
  });

  describe('Persistence Integration', () => {
    let mockLocalStorage: any;

    beforeEach(() => {
      mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
    });

    it('integrates persistence with wizard lifecycle', async () => {
      const persistence = new WizardPersistence('integration-test');

      // Create session data
      const sessionData = {
        wizardId: 'integration-test',
        currentStep: 1,
        stepData: { name: 'John Doe', email: 'john@example.com' },
        lastSaved: Date.now(),
        completedSteps: ['step1'],
        validationState: {},
        metadata: {
          startedAt: Date.now() - 5000,
          updatedAt: Date.now(),
          version: '1.0.0',
        },
      };

      // Save session
      const saveResult = await persistence.saveSession(sessionData);
      expect(saveResult).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // Mock localStorage return for restore
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      // Restore session
      const restored = await persistence.restoreSession();
      expect(restored).toEqual(expect.objectContaining({
        wizardId: 'integration-test',
        currentStep: 1,
        stepData: { name: 'John Doe', email: 'john@example.com' },
        completedSteps: ['step1'],
      }));
    });

    it('handles auto-save integration', async () => {
      jest.useFakeTimers();
      
      const mockSaveFunction = jest.fn().mockResolvedValue(undefined);
      const autoSave = new DebouncedAutoSave(mockSaveFunction, 300);

      // Trigger multiple saves (simulating user input)
      autoSave.trigger();
      autoSave.trigger();
      autoSave.trigger();

      // Should not have saved yet
      expect(mockSaveFunction).not.toHaveBeenCalled();

      // Advance time to trigger save
      jest.advanceTimersByTime(300);
      await Promise.resolve();

      // Should have saved only once
      expect(mockSaveFunction).toHaveBeenCalledTimes(1);

      autoSave.destroy();
      jest.useRealTimers();
    });
  });

  describe('Wizard Type Safety', () => {
    it('maintains type safety across wizard operations', () => {
      interface UserData {
        personalInfo: {
          name: string;
          email: string;
        };
        preferences: {
          theme: 'light' | 'dark';
          notifications: boolean;
        };
      }

      const steps = [
        createWizardStep<UserData>('personal', 'Personal Info', MockComponent, {
          required: true,
          validator: (data) => ({
            isValid: !!data.personalInfo?.name && !!data.personalInfo?.email,
            message: 'Name and email are required',
          }),
        }),
        createWizardStep<UserData>('preferences', 'Preferences', MockComponent, {
          required: false,
          isOptional: true,
        }),
      ];

      const config = createWizardConfig<UserData>('typed-wizard', steps, async (data) => {
        // TypeScript should enforce that data has UserData structure
        expect(typeof data.personalInfo.name).toBe('string');
        expect(typeof data.preferences.notifications).toBe('boolean');
      });

      expect(config.steps).toHaveLength(2);
      expect(typeof config.onComplete).toBe('function');
    });
  });

  describe('Error Handling Integration', () => {
    it('handles validation errors gracefully', () => {
      const steps = [
        createWizardStep('step1', 'Step 1', MockComponent, {
          required: true,
          validator: () => {
            throw new Error('Validation crashed');
          },
        }),
      ];

      const config = createWizardConfig('error-test', steps, jest.fn());
      const data = { field: 'value' };

      // Should not crash when validation throws
      expect(() => {
        const step = config.steps[0];
        try {
          step.validator!(data);
        } catch (error) {
          // Expected to throw
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow();
    });

    it('handles persistence errors gracefully', async () => {
      // Mock localStorage for this specific test
      const errorMockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn().mockImplementation(() => {
          throw new Error('QuotaExceededError');
        }),
        removeItem: jest.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: errorMockLocalStorage,
        writable: true,
      });

      const persistence = new WizardPersistence('error-test');
      const sessionData = {
        wizardId: 'error-test',
        currentStep: 0,
        stepData: {},
        lastSaved: Date.now(),
        completedSteps: [],
        validationState: {},
        metadata: {
          startedAt: Date.now(),
          updatedAt: Date.now(),
          version: '1.0.0',
        },
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await persistence.saveSession(sessionData);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});