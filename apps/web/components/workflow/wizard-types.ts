import { ReactNode, ComponentType } from 'react';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface WizardStepProps<TData = any> {
  data: TData;
  onDataChange: (data: Partial<TData>) => void;
  onValidationChange: (isValid: boolean, message?: string) => void;
  isActive: boolean;
  wizardId: string;
}

export interface WizardStep<TData = any> {
  id: string;
  title: string;
  description?: string;
  component: ComponentType<WizardStepProps<TData>>;
  validator?: (data: TData) => ValidationResult;
  required: boolean;
  canNavigateBack?: boolean;
  isOptional?: boolean;
  isSkippable?: boolean;
  estimatedTime?: number;
  helpContent?: string;
  dependencies?: string[];
}

export interface WizardConfig<TData = any> {
  id: string;
  steps: WizardStep<TData>[];
  onComplete: (data: TData) => Promise<void>;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  autoSave: boolean;
  allowBackNavigation: boolean;
  persistSession: boolean;
  debounceMs: number;
  title?: string;
  description?: string;
}

export interface WizardSession<TData = any> {
  wizardId: string;
  currentStep: number;
  stepData: TData;
  lastSaved: number;
  completedSteps: string[];
  validationState: Record<string, ValidationResult>;
  metadata: {
    startedAt: number;
    updatedAt: number;
    version: string;
  };
}

export interface WizardState<TData = any> {
  currentStepIndex: number;
  stepData: TData;
  completedSteps: Set<string>;
  validationErrors: Map<string, string>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  sessionId: string | null;
}

export interface WizardShellProps<TData = any> {
  config: WizardConfig<TData>;
  initialData?: Partial<TData>;
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showProgress?: boolean;
  showEstimates?: boolean;
  showHelp?: boolean;
  allowNonLinear?: boolean;
  onStepChange?: (stepIndex: number, stepId: string) => void;
  onDataChange?: (data: Partial<TData>) => void;
  onSessionRestore?: (session: WizardSession<TData>) => void;
}

export type WizardNavigationDirection = 'next' | 'previous' | 'jump';

export interface WizardNavigationEvent<TData = any> {
  direction: WizardNavigationDirection;
  fromStepIndex: number;
  toStepIndex: number;
  fromStepId: string;
  toStepId: string;
  data: TData;
  timestamp: number;
}

export interface WizardContextValue<TData = any> {
  config: WizardConfig<TData>;
  state: WizardState<TData>;
  actions: {
    navigateToStep: (stepIndex: number) => Promise<boolean>;
    nextStep: () => Promise<boolean>;
    previousStep: () => Promise<boolean>;
    updateData: (data: Partial<TData>) => void;
    completeStep: (stepId: string) => void;
    skipStep: (stepId: string) => void;
    validateCurrentStep: () => Promise<ValidationResult>;
    saveSession: () => Promise<void>;
    restoreSession: () => Promise<WizardSession<TData> | null>;
    clearSession: () => void;
  };
}