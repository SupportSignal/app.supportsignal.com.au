import { WizardSession, WizardConfig, WizardState } from './wizard-types';

const STORAGE_KEY_PREFIX = 'wizard_session_';
const SESSION_VERSION = '1.0.0';

export class WizardPersistence<TData = any> {
  private storageKey: string;

  constructor(wizardId: string) {
    this.storageKey = `${STORAGE_KEY_PREFIX}${wizardId}`;
  }

  /**
   * Save wizard session to localStorage with error handling
   */
  async saveSession(session: WizardSession<TData>): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        return false; // SSR safety
      }

      const sessionData = {
        ...session,
        metadata: {
          ...session.metadata,
          updatedAt: Date.now(),
          version: SESSION_VERSION,
        },
      };

      localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Failed to save wizard session:', error);
      return false;
    }
  }

  /**
   * Restore wizard session from localStorage
   */
  async restoreSession(): Promise<WizardSession<TData> | null> {
    try {
      if (typeof window === 'undefined') {
        return null; // SSR safety
      }

      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }

      const session: WizardSession<TData> = JSON.parse(stored);
      
      // Version compatibility check
      if (session.metadata?.version !== SESSION_VERSION) {
        console.warn('Wizard session version mismatch, clearing session');
        await this.clearSession();
        return null;
      }

      // Validate session structure
      if (!this.isValidSession(session)) {
        console.warn('Invalid wizard session structure, clearing session');
        await this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to restore wizard session:', error);
      await this.clearSession();
      return null;
    }
  }

  /**
   * Clear wizard session from localStorage
   */
  async clearSession(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear wizard session:', error);
    }
  }

  /**
   * Check if session exists
   */
  hasSession(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }
      return localStorage.getItem(this.storageKey) !== null;
    } catch {
      return false;
    }
  }

  /**
   * Create a new session from current state
   */
  createSession<TData>(
    config: WizardConfig<TData>,
    state: WizardState<TData>
  ): WizardSession<TData> {
    return {
      wizardId: config.id,
      currentStep: state.currentStepIndex,
      stepData: state.stepData,
      lastSaved: Date.now(),
      completedSteps: Array.from(state.completedSteps),
      validationState: {},
      metadata: {
        startedAt: Date.now(),
        updatedAt: Date.now(),
        version: SESSION_VERSION,
      },
    };
  }

  /**
   * Update existing session with current state
   */
  updateSession<TData>(
    existingSession: WizardSession<TData>,
    state: WizardState<TData>
  ): WizardSession<TData> {
    return {
      ...existingSession,
      currentStep: state.currentStepIndex,
      stepData: state.stepData,
      completedSteps: Array.from(state.completedSteps),
      lastSaved: Date.now(),
      metadata: {
        ...existingSession.metadata,
        updatedAt: Date.now(),
      },
    };
  }

  /**
   * Validate session structure
   */
  private isValidSession(session: any): session is WizardSession<TData> {
    return (
      session &&
      typeof session.wizardId === 'string' &&
      typeof session.currentStep === 'number' &&
      session.stepData !== undefined &&
      typeof session.lastSaved === 'number' &&
      Array.isArray(session.completedSteps) &&
      session.metadata &&
      typeof session.metadata.startedAt === 'number' &&
      typeof session.metadata.updatedAt === 'number' &&
      typeof session.metadata.version === 'string'
    );
  }
}

/**
 * Debounced auto-save utility
 */
export class DebouncedAutoSave {
  private timeoutId: number | null = null;
  private saveFunction: () => Promise<void>;
  private debounceMs: number;

  constructor(saveFunction: () => Promise<void>, debounceMs: number = 300) {
    this.saveFunction = saveFunction;
    this.debounceMs = debounceMs;
  }

  /**
   * Trigger auto-save with debouncing
   */
  trigger(): void {
    this.cancel();
    this.timeoutId = window.setTimeout(async () => {
      try {
        await this.saveFunction();
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, this.debounceMs);
  }

  /**
   * Cancel pending auto-save
   */
  cancel(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Force immediate save
   */
  async flush(): Promise<void> {
    this.cancel();
    await this.saveFunction();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cancel();
  }
}