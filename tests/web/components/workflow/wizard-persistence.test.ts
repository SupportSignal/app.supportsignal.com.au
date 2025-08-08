// @ts-nocheck
import { WizardPersistence, DebouncedAutoSave } from '@/components/workflow/wizard-persistence';
import { WizardSession, WizardConfig, WizardState } from '@/components/workflow/wizard-types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('WizardPersistence', () => {
  let persistence: WizardPersistence;
  const wizardId = 'test-wizard';

  beforeEach(() => {
    jest.clearAllMocks();
    persistence = new WizardPersistence(wizardId);
  });

  describe('Session Management', () => {
    const mockSession: WizardSession = {
      wizardId,
      currentStep: 1,
      stepData: { field1: 'value1', field2: 'value2' },
      lastSaved: Date.now(),
      completedSteps: ['step1'],
      validationState: {},
      metadata: {
        startedAt: Date.now() - 10000,
        updatedAt: Date.now(),
        version: '1.0.0',
      },
    };

    it('saves session to localStorage successfully', async () => {
      const result = await persistence.saveSession(mockSession);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `wizard_session_${wizardId}`,
        expect.stringContaining(wizardId)
      );
    });

    it('handles save errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await persistence.saveSession(mockSession);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save wizard session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('restores valid session from localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSession));
      
      const result = await persistence.restoreSession();
      
      expect(result).toEqual(expect.objectContaining({
        wizardId,
        currentStep: 1,
        stepData: mockSession.stepData,
        completedSteps: mockSession.completedSteps,
      }));
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(`wizard_session_${wizardId}`);
    });

    it('returns null for non-existent session', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = await persistence.restoreSession();
      
      expect(result).toBeNull();
    });

    it('handles invalid JSON gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await persistence.restoreSession();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to restore wizard session:', expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`wizard_session_${wizardId}`);
      
      consoleSpy.mockRestore();
    });

    it('clears outdated session versions', async () => {
      const outdatedSession = { ...mockSession, metadata: { ...mockSession.metadata, version: '0.9.0' } };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(outdatedSession));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await persistence.restoreSession();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Wizard session version mismatch, clearing session');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`wizard_session_${wizardId}`);
      
      consoleSpy.mockRestore();
    });

    it('validates session structure', async () => {
      const invalidSession = { wizardId, invalidField: 'invalid', metadata: { version: '1.0.0' } };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidSession));
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await persistence.restoreSession();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Invalid wizard session structure, clearing session');
      
      consoleSpy.mockRestore();
    });

    it('clears session successfully', async () => {
      await persistence.clearSession();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`wizard_session_${wizardId}`);
    });

    it('handles clear errors gracefully', async () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Remove failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await persistence.clearSession();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear wizard session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('checks if session exists', () => {
      mockLocalStorage.getItem.mockReturnValue('some data');
      expect(persistence.hasSession()).toBe(true);
      
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(persistence.hasSession()).toBe(false);
    });
  });

  describe('Session Creation and Updates', () => {
    const mockConfig: WizardConfig = {
      id: wizardId,
      steps: [],
      onComplete: jest.fn(),
      autoSave: true,
      allowBackNavigation: true,
      persistSession: true,
      debounceMs: 300,
    };

    const mockState: WizardState = {
      currentStepIndex: 1,
      stepData: { field1: 'value1' },
      completedSteps: new Set(['step1']),
      validationErrors: new Map(),
      isLoading: false,
      hasUnsavedChanges: true,
      sessionId: 'session123',
    };

    it('creates new session from config and state', () => {
      const session = persistence.createSession(mockConfig, mockState);
      
      expect(session).toEqual({
        wizardId,
        currentStep: 1,
        stepData: { field1: 'value1' },
        lastSaved: expect.any(Number),
        completedSteps: ['step1'],
        validationState: {},
        metadata: {
          startedAt: expect.any(Number),
          updatedAt: expect.any(Number),
          version: '1.0.0',
        },
      });
    });

    it('updates existing session with new state', () => {
      const existingSession: WizardSession = {
        wizardId,
        currentStep: 0,
        stepData: { oldField: 'oldValue' },
        lastSaved: Date.now() - 5000,
        completedSteps: [],
        validationState: {},
        metadata: {
          startedAt: Date.now() - 10000,
          updatedAt: Date.now() - 5000,
          version: '1.0.0',
        },
      };

      const updatedSession = persistence.updateSession(existingSession, mockState);
      
      expect(updatedSession).toEqual({
        ...existingSession,
        currentStep: 1,
        stepData: { field1: 'value1' },
        completedSteps: ['step1'],
        lastSaved: expect.any(Number),
        metadata: {
          ...existingSession.metadata,
          updatedAt: expect.any(Number),
        },
      });
      
      expect(updatedSession.lastSaved).toBeGreaterThan(existingSession.lastSaved);
      expect(updatedSession.metadata.updatedAt).toBeGreaterThan(existingSession.metadata.updatedAt);
    });
  });

  describe('SSR Safety', () => {
    const originalWindow = global.window;

    afterAll(() => {
      global.window = originalWindow;
    });

    it('handles SSR environment gracefully', async () => {
      // Simulate SSR environment
      delete (global as any).window;
      
      const ssrPersistence = new WizardPersistence('test');
      
      const saveResult = await ssrPersistence.saveSession({} as WizardSession);
      expect(saveResult).toBe(false);
      
      const restoreResult = await ssrPersistence.restoreSession();
      expect(restoreResult).toBeNull();
      
      expect(ssrPersistence.hasSession()).toBe(false);
      
      await expect(ssrPersistence.clearSession()).resolves.not.toThrow();
    });
  });
});

describe('DebouncedAutoSave', () => {
  let autoSave: DebouncedAutoSave;
  let mockSaveFunction: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    mockSaveFunction = jest.fn().mockResolvedValue(undefined);
    autoSave = new DebouncedAutoSave(mockSaveFunction, 300);
  });

  afterEach(() => {
    jest.useRealTimers();
    autoSave.destroy();
  });

  it('debounces save calls correctly', async () => {
    // Trigger multiple saves quickly
    autoSave.trigger();
    autoSave.trigger();
    autoSave.trigger();
    
    // Should not have called save function yet
    expect(mockSaveFunction).not.toHaveBeenCalled();
    
    // Fast-forward through debounce period
    jest.advanceTimersByTime(300);
    
    // Wait for async operation
    await Promise.resolve();
    
    // Should have called save function only once
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
  });

  it('resets debounce timer on subsequent triggers', async () => {
    autoSave.trigger();
    
    // Advance time partially
    jest.advanceTimersByTime(150);
    expect(mockSaveFunction).not.toHaveBeenCalled();
    
    // Trigger again, resetting the timer
    autoSave.trigger();
    
    // Advance the remaining time from first trigger
    jest.advanceTimersByTime(150);
    expect(mockSaveFunction).not.toHaveBeenCalled();
    
    // Advance the full debounce time from second trigger
    jest.advanceTimersByTime(150);
    await Promise.resolve();
    
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
  });

  it('cancels pending saves', async () => {
    autoSave.trigger();
    autoSave.cancel();
    
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    
    expect(mockSaveFunction).not.toHaveBeenCalled();
  });

  it('flushes immediately on demand', async () => {
    autoSave.trigger();
    
    // Flush immediately without waiting for debounce
    await autoSave.flush();
    
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    
    // Advancing timer should not trigger again
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
  });

  it('handles save function errors gracefully', async () => {
    mockSaveFunction.mockRejectedValueOnce(new Error('Save failed'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    autoSave.trigger();
    jest.advanceTimersByTime(300);
    
    // Wait for promise to resolve and error handling
    await Promise.resolve();
    
    expect(consoleSpy).toHaveBeenCalledWith('Auto-save failed:', expect.any(Error));
    
    consoleSpy.mockRestore();
  }, 10000); // Increase timeout

  it('cleans up resources on destroy', () => {
    autoSave.trigger();
    
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    autoSave.destroy();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    // Advancing timer should not trigger save after destroy
    jest.advanceTimersByTime(300);
    expect(mockSaveFunction).not.toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });

  it('uses custom debounce time', async () => {
    const customAutoSave = new DebouncedAutoSave(mockSaveFunction, 500);
    
    customAutoSave.trigger();
    
    // Should not trigger at 300ms
    jest.advanceTimersByTime(300);
    await Promise.resolve();
    expect(mockSaveFunction).not.toHaveBeenCalled();
    
    // Should trigger at 500ms
    jest.advanceTimersByTime(200);
    await Promise.resolve();
    expect(mockSaveFunction).toHaveBeenCalledTimes(1);
    
    customAutoSave.destroy();
  });
});