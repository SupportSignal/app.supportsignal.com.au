import { WizardStep, WizardConfig, ValidationResult } from '@/components/workflow/wizard-types';

/**
 * Create a wizard step with default values
 */
export function createWizardStep<TData = any>(
  id: string,
  title: string,
  component: React.ComponentType<any>,
  options: Partial<WizardStep<TData>> = {}
): WizardStep<TData> {
  return {
    id,
    title,
    component,
    required: true,
    canNavigateBack: true,
    ...options,
  };
}

/**
 * Create a wizard configuration with defaults
 */
export function createWizardConfig<TData = any>(
  id: string,
  steps: WizardStep<TData>[],
  onComplete: (data: TData) => Promise<void>,
  options: Partial<WizardConfig<TData>> = {}
): WizardConfig<TData> {
  return {
    id,
    steps,
    onComplete,
    autoSave: true,
    allowBackNavigation: true,
    persistSession: true,
    debounceMs: 300,
    ...options,
  };
}

/**
 * Validate that all required steps are completed
 */
export function validateWizardCompletion<TData = any>(
  config: WizardConfig<TData>,
  completedSteps: Set<string>
): ValidationResult {
  const requiredSteps = config.steps.filter(step => step.required && !step.isOptional);
  const missingSteps = requiredSteps.filter(step => !completedSteps.has(step.id));

  if (missingSteps.length > 0) {
    const stepTitles = missingSteps.map(step => step.title).join(', ');
    return {
      isValid: false,
      message: `Please complete the following required steps: ${stepTitles}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate wizard progress statistics
 */
export function calculateWizardProgress<TData = any>(
  config: WizardConfig<TData>,
  completedSteps: Set<string>
): {
  totalSteps: number;
  completedSteps: number;
  requiredSteps: number;
  completedRequired: number;
  optionalSteps: number;
  completedOptional: number;
  percentageComplete: number;
  percentageRequiredComplete: number;
  estimatedTimeRemaining: number;
  estimatedTimeTotal: number;
} {
  const totalSteps = config.steps.length;
  const completed = completedSteps.size;
  
  const requiredSteps = config.steps.filter(step => step.required && !step.isOptional);
  const completedRequired = requiredSteps.filter(step => completedSteps.has(step.id)).length;
  
  const optionalSteps = config.steps.filter(step => step.isOptional);
  const completedOptional = optionalSteps.filter(step => completedSteps.has(step.id)).length;
  
  const percentageComplete = totalSteps > 0 ? (completed / totalSteps) * 100 : 0;
  const percentageRequiredComplete = requiredSteps.length > 0 
    ? (completedRequired / requiredSteps.length) * 100 
    : 100;

  const estimatedTimeTotal = config.steps.reduce(
    (total, step) => total + (step.estimatedTime || 0), 
    0
  );
  
  const estimatedTimeRemaining = config.steps
    .filter(step => !completedSteps.has(step.id))
    .reduce((total, step) => total + (step.estimatedTime || 0), 0);

  return {
    totalSteps,
    completedSteps: completed,
    requiredSteps: requiredSteps.length,
    completedRequired,
    optionalSteps: optionalSteps.length,
    completedOptional,
    percentageComplete,
    percentageRequiredComplete,
    estimatedTimeRemaining,
    estimatedTimeTotal,
  };
}

/**
 * Check if a step can be navigated to based on dependencies
 */
export function canNavigateToStep<TData = any>(
  config: WizardConfig<TData>,
  targetStepId: string,
  completedSteps: Set<string>,
  allowNonLinear: boolean = false
): boolean {
  const targetStep = config.steps.find(step => step.id === targetStepId);
  if (!targetStep) return false;

  const targetIndex = config.steps.indexOf(targetStep);
  
  // If non-linear navigation is allowed, only check dependencies
  if (allowNonLinear) {
    return checkStepDependencies(targetStep, completedSteps);
  }

  // For linear navigation, must be current step or completed
  // TODO: Add current step tracking
  return checkStepDependencies(targetStep, completedSteps);
}

/**
 * Check if step dependencies are satisfied
 */
export function checkStepDependencies<TData = any>(
  step: WizardStep<TData>,
  completedSteps: Set<string>
): boolean {
  if (!step.dependencies || step.dependencies.length === 0) {
    return true;
  }

  return step.dependencies.every(depId => completedSteps.has(depId));
}

/**
 * Get the next available step based on dependencies and completion
 */
export function getNextAvailableStep<TData = any>(
  config: WizardConfig<TData>,
  currentStepIndex: number,
  completedSteps: Set<string>
): number | null {
  for (let i = currentStepIndex + 1; i < config.steps.length; i++) {
    const step = config.steps[i];
    if (checkStepDependencies(step, completedSteps)) {
      return i;
    }
  }
  return null;
}

/**
 * Get wizard validation errors for all steps
 */
export function getAllValidationErrors<TData = any>(
  config: WizardConfig<TData>,
  data: TData
): Map<string, string> {
  const errors = new Map<string, string>();

  config.steps.forEach(step => {
    if (step.validator) {
      try {
        const result = step.validator(data);
        if (!result.isValid && result.message) {
          errors.set(step.id, result.message);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Validation error';
        errors.set(step.id, errorMessage);
      }
    }
  });

  return errors;
}

/**
 * Generate a correlation ID for wizard actions
 */
export function generateCorrelationId(): string {
  return `wizard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format wizard duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Create a deep clone of wizard data to prevent mutations
 */
export function cloneWizardData<TData = any>(data: TData): TData {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Merge wizard data while preserving type safety
 */
export function mergeWizardData<TData extends Record<string, any>>(
  currentData: TData,
  newData: Partial<TData>
): TData {
  return {
    ...currentData,
    ...newData,
  };
}