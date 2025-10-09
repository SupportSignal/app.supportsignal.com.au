// WorkflowProgress has been unified into WorkflowWizard (variant="display-only")
// Use: import { WorkflowWizard } from '@/components/user';

export { WizardShell, useWizard } from './wizard-shell';
export type {
  WizardShellProps,
  WizardStep,
  WizardConfig,
  WizardState,
  WizardSession,
  WizardStepProps,
  WizardContextValue,
  WizardNavigationEvent,
  ValidationResult,
} from './wizard-types';
export { WizardPersistence, DebouncedAutoSave } from './wizard-persistence';
export * from '@/lib/wizard/wizard-utils';