'use client';

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Button } from '@starter/ui';
import { Badge } from '@starter/ui';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Circle,
  ArrowRight,
  AlertTriangle,
  Info,
  HelpCircle,
  Save,
  Clock,
  CheckCircle,
  X,
  RotateCcw,
} from 'lucide-react';

import {
  WizardShellProps,
  WizardState,
  WizardSession,
  WizardNavigationEvent,
  ValidationResult,
  WizardContextValue,
} from './wizard-types';
import { WizardPersistence, DebouncedAutoSave } from './wizard-persistence';

// Create React Context for wizard state
const WizardContext = React.createContext<WizardContextValue | null>(null);

export const useWizard = <TData = any>() => {
  const context = React.useContext(WizardContext) as WizardContextValue<TData> | null;
  if (!context) {
    throw new Error('useWizard must be used within a WizardShell');
  }
  return context;
};

export const WizardShell = <TData extends Record<string, any> = Record<string, any>>({
  config,
  initialData = {},
  className,
  variant = 'full',
  showProgress = true,
  showEstimates = true,
  showHelp = true,
  allowNonLinear = false,
  onStepChange,
  onDataChange,
  onSessionRestore,
}: WizardShellProps<TData>) => {
  // State management
  const [state, setState] = useState<WizardState<TData>>(() => ({
    currentStepIndex: 0,
    stepData: { ...initialData } as TData,
    completedSteps: new Set<string>(),
    validationErrors: new Map<string, string>(),
    isLoading: false,
    hasUnsavedChanges: false,
    sessionId: null,
  }));

  const [showingHelp, setShowingHelp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Refs
  const persistenceRef = useRef(new WizardPersistence<TData>(config.id));
  const autoSaveRef = useRef<DebouncedAutoSave | null>(null);
  const isInitializedRef = useRef(false);

  // Computed values
  const currentStep = config.steps[state.currentStepIndex];
  const totalSteps = config.steps.length;
  const completedCount = state.completedSteps.size;
  const progressPercentage = (completedCount / totalSteps) * 100;
  const canGoNext = state.currentStepIndex < totalSteps - 1;
  const canGoPrevious = state.currentStepIndex > 0 && 
    (config.allowBackNavigation && currentStep?.canNavigateBack !== false);
  const isLastStep = state.currentStepIndex === totalSteps - 1;
  const allStepsComplete = config.steps.every(step => 
    state.completedSteps.has(step.id) || step.isOptional
  );

  const currentValidationError = state.validationErrors.get(currentStep?.id);

  // Total estimated time
  const totalEstimatedTime = useMemo(() => {
    return config.steps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
  }, [config.steps]);

  // Remaining time calculation
  const remainingTime = useMemo(() => {
    return config.steps.slice(state.currentStepIndex).reduce((total, step) => {
      return total + (state.completedSteps.has(step.id) ? 0 : (step.estimatedTime || 0));
    }, 0);
  }, [config.steps, state.currentStepIndex, state.completedSteps]);

  // Session management
  const saveSession = useCallback(async (): Promise<void> => {
    if (!config.persistSession) return;

    const session = persistenceRef.current.createSession(config, state);
    const success = await persistenceRef.current.saveSession(session);
    
    if (success) {
      setState(prev => ({ ...prev, hasUnsavedChanges: false }));
    }
  }, [config, state]);

  const restoreSession = useCallback(async (): Promise<WizardSession<TData> | null> => {
    if (!config.persistSession) return null;

    try {
      setIsRestoring(true);
      const session = await persistenceRef.current.restoreSession();
      
      if (session && onSessionRestore) {
        onSessionRestore(session);
      }

      if (session) {
        setState(prev => ({
          ...prev,
          currentStepIndex: Math.min(session.currentStep, totalSteps - 1),
          stepData: { ...prev.stepData, ...session.stepData },
          completedSteps: new Set(session.completedSteps),
          sessionId: session.wizardId,
        }));
      }

      return session;
    } finally {
      setIsRestoring(false);
    }
  }, [config.persistSession, onSessionRestore, totalSteps]);

  const clearSession = useCallback(async (): Promise<void> => {
    await persistenceRef.current.clearSession();
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      sessionId: null,
    }));
  }, []);

  // Validation
  const validateCurrentStep = useCallback(async (): Promise<ValidationResult> => {
    if (!currentStep?.validator) {
      return { isValid: true };
    }

    try {
      const result = currentStep.validator(state.stepData);
      
      setState(prev => {
        const newErrors = new Map(prev.validationErrors);
        if (result.isValid) {
          newErrors.delete(currentStep.id);
        } else {
          newErrors.set(currentStep.id, result.message || 'Validation failed');
        }
        return { ...prev, validationErrors: newErrors };
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation error';
      setState(prev => {
        const newErrors = new Map(prev.validationErrors);
        newErrors.set(currentStep.id, errorMessage);
        return { ...prev, validationErrors: newErrors };
      });
      return { isValid: false, message: errorMessage };
    }
  }, [currentStep, state.stepData]);

  // Navigation functions
  const navigateToStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    if (stepIndex < 0 || stepIndex >= totalSteps) return false;

    const targetStep = config.steps[stepIndex];
    // Allow navigation if:
    // 1. Non-linear navigation is enabled, OR
    // 2. Going to previous/current steps, OR  
    // 3. Going to already completed steps, OR
    // 4. Going to the immediate next step (linear progression)
    const canNavigate = allowNonLinear || 
      stepIndex <= state.currentStepIndex || 
      state.completedSteps.has(targetStep.id) ||
      stepIndex === state.currentStepIndex + 1; // Allow next step in sequence

    if (!canNavigate) return false;

    // Validate current step before navigation
    if (stepIndex > state.currentStepIndex) {
      const validation = await validateCurrentStep();
      if (!validation.isValid && currentStep?.required) {
        return false;
      }
    }

    setState(prev => ({ ...prev, currentStepIndex: stepIndex }));
    
    if (onStepChange) {
      onStepChange(stepIndex, targetStep.id);
    }

    return true;
  }, [totalSteps, config.steps, allowNonLinear, state.currentStepIndex, state.completedSteps, validateCurrentStep, currentStep, onStepChange]);

  const nextStep = useCallback(async (): Promise<boolean> => {
    if (!canGoNext) return false;
    return navigateToStep(state.currentStepIndex + 1);
  }, [canGoNext, navigateToStep, state.currentStepIndex]);

  const previousStep = useCallback(async (): Promise<boolean> => {
    if (!canGoPrevious) return false;
    return navigateToStep(state.currentStepIndex - 1);
  }, [canGoPrevious, navigateToStep, state.currentStepIndex]);

  // Data management
  const updateData = useCallback((newData: Partial<TData>) => {
    setState(prev => ({
      ...prev,
      stepData: { ...prev.stepData, ...newData },
      hasUnsavedChanges: true,
    }));

    if (onDataChange) {
      onDataChange(newData);
    }

    // Trigger auto-save
    if (config.autoSave && autoSaveRef.current) {
      autoSaveRef.current.trigger();
    }
  }, [onDataChange, config.autoSave]);

  const completeStep = useCallback((stepId: string) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, stepId]),
      hasUnsavedChanges: true,
    }));
  }, []);

  const skipStep = useCallback((stepId: string) => {
    const step = config.steps.find(s => s.id === stepId);
    if (step?.isSkippable) {
      completeStep(stepId);
      nextStep();
    }
  }, [config.steps, completeStep, nextStep]);

  // Auto-save setup
  useEffect(() => {
    if (config.autoSave) {
      autoSaveRef.current = new DebouncedAutoSave(saveSession, config.debounceMs || 300);
      return () => {
        autoSaveRef.current?.destroy();
      };
    }
  }, [config.autoSave, config.debounceMs, saveSession]);

  // Initialize session
  useEffect(() => {
    if (!isInitializedRef.current && config.persistSession) {
      isInitializedRef.current = true;
      restoreSession();
    }
  }, [config.persistSession, restoreSession]);

  // Context value
  const contextValue: WizardContextValue<TData> = useMemo(() => ({
    config,
    state,
    actions: {
      navigateToStep,
      nextStep,
      previousStep,
      updateData,
      completeStep,
      skipStep,
      validateCurrentStep,
      saveSession,
      restoreSession,
      clearSession,
    },
  }), [config, state, navigateToStep, nextStep, previousStep, updateData, completeStep, skipStep, validateCurrentStep, saveSession, restoreSession, clearSession]);

  // Event handlers (defined first to avoid hoisting issues)
  const handleComplete = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (allStepsComplete || isLastStep) {
        const validation = await validateCurrentStep();
        if (validation.isValid) {
          await config.onComplete(state.stepData);
          await clearSession();
        }
      }
    } catch (error) {
      if (config.onError) {
        config.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [allStepsComplete, isLastStep, validateCurrentStep, config, state.stepData, clearSession]);

  const handleCancel = useCallback(() => {
    if (config.onCancel) {
      config.onCancel();
    }
  }, [config.onCancel]);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Don't handle keys when inside form inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement).contentEditable === 'true'
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        previousStep();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextStep();
        break;
      case 'Enter':
      case ' ':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (isLastStep) {
            handleComplete();
          } else {
            nextStep();
          }
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleCancel();
        break;
      case 'Home':
        event.preventDefault();
        navigateToStep(0);
        break;
      case 'End':
        event.preventDefault();
        navigateToStep(totalSteps - 1);
        break;
    }
  }, [previousStep, nextStep, isLastStep, handleComplete, handleCancel, navigateToStep, totalSteps]);

  // Event handlers
  const handleStepClick = (stepIndex: number) => {
    navigateToStep(stepIndex);
  };

  const handleStepKeyDown = (stepIndex: number, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToStep(stepIndex);
    }
  };

  const handleCompleteStep = async () => {
    const validation = await validateCurrentStep();
    if (validation.isValid) {
      completeStep(currentStep.id);
    }
  };

  const handleSkipStep = () => {
    if (currentStep?.isSkippable) {
      skipStep(currentStep.id);
    }
  };


  if (isRestoring) {
    return (
      <Card className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center space-y-4">
          <RotateCcw className="w-8 h-8 animate-spin text-ss-teal mx-auto" />
          <p className="text-healthcare-sm text-gray-600">Restoring your progress...</p>
        </div>
      </Card>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <WizardContext.Provider value={contextValue}>
        <div 
          className={cn('space-y-4', className)}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
          role="application"
          aria-label={config.title || 'Wizard'}
          aria-describedby={`wizard-${config.id}-description`}
        >
          {/* Progress */}
          <div className="flex items-center justify-between">
            <h3 
              className="text-healthcare-base font-semibold text-healthcare-primary"
              id={`wizard-${config.id}-title`}
            >
              {config.title || 'Wizard'}
            </h3>
            <Badge 
              className="bg-ss-teal text-white"
              role="status"
              aria-label={`Current step ${state.currentStepIndex + 1} of ${totalSteps}`}
            >
              Step {state.currentStepIndex + 1} of {totalSteps}
            </Badge>
          </div>
          
          {/* Screen reader instructions */}
          <div id={`wizard-${config.id}-description`} className="sr-only">
            Use arrow keys to navigate between steps. Press Ctrl+Enter to proceed, Escape to cancel.
            {config.description && ` ${config.description}`}
          </div>
          
          <div 
            className="w-full bg-gray-200 rounded-full h-2"
            role="progressbar"
            aria-valuenow={Math.round(progressPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Wizard progress: ${Math.round(progressPercentage)}% complete`}
          >
            <div 
              className="bg-ss-teal h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Current step component */}
          {currentStep && (
            <currentStep.component
              data={state.stepData}
              onDataChange={updateData}
              onValidationChange={(isValid, message) => {
                setState(prev => {
                  const newErrors = new Map(prev.validationErrors);
                  if (isValid) {
                    newErrors.delete(currentStep.id);
                  } else {
                    newErrors.set(currentStep.id, message || 'Validation failed');
                  }
                  return { ...prev, validationErrors: newErrors };
                });
              }}
              isActive={true}
              wizardId={config.id}
            />
          )}
          
          {/* Navigation */}
          <nav role="navigation" aria-label="Wizard navigation">
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={previousStep}
                disabled={!canGoPrevious}
                aria-label={`Go to previous step${config.steps[state.currentStepIndex - 1]?.title ? `: ${config.steps[state.currentStepIndex - 1].title}` : ''}`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              
              <Button
                size="sm"
                onClick={isLastStep ? handleComplete : nextStep}
                className="bg-ss-teal hover:bg-ss-teal-deep"
                disabled={state.isLoading || !!(currentValidationError && currentStep?.required)}
                aria-label={isLastStep 
                  ? 'Complete wizard' 
                  : `Go to next step${config.steps[state.currentStepIndex + 1]?.title ? `: ${config.steps[state.currentStepIndex + 1].title}` : ''}`
                }
              >
                {isLastStep ? 'Complete' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </nav>
        </div>
      </WizardContext.Provider>
    );
  }

  // Full variant
  return (
    <WizardContext.Provider value={contextValue}>
      <Card 
        className={cn('', className)}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        role="application"
        aria-label={config.title || 'Wizard'}
        aria-describedby={`wizard-${config.id}-full-description`}
      >
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 
                className="text-healthcare-lg font-semibold text-healthcare-primary truncate"
                id={`wizard-${config.id}-full-title`}
              >
                {config.title || 'Wizard'}
              </h2>
              {config.description && (
                <p className="text-healthcare-sm text-gray-600 mt-1 line-clamp-2">{config.description}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0">
              {showEstimates && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">{remainingTime}m remaining</span>
                  <span className="sm:hidden">{remainingTime}m</span>
                </Badge>
              )}
              
              <Badge className="bg-ss-teal text-white">
                <span className="hidden sm:inline">Step {state.currentStepIndex + 1} of {totalSteps}</span>
                <span className="sm:hidden">{state.currentStepIndex + 1}/{totalSteps}</span>
              </Badge>

              {state.hasUnsavedChanges && (
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                  <span className="hidden sm:inline">Unsaved changes</span>
                  <span className="sm:hidden">Unsaved</span>
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Screen reader instructions */}
          <div id={`wizard-${config.id}-full-description`} className="sr-only">
            Wizard with {totalSteps} steps. Use arrow keys to navigate, Ctrl+Enter to proceed, Escape to cancel.
            Currently on step {state.currentStepIndex + 1}: {currentStep?.title}.
            {config.description && ` ${config.description}`}
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div role="region" aria-labelledby={`wizard-${config.id}-progress-label`}>
              <div id={`wizard-${config.id}-progress-label`} className="flex items-center justify-between text-healthcare-sm text-gray-600 mb-2">
                <span>Progress: {Math.round(progressPercentage)}%</span>
                <span>{completedCount} of {totalSteps} completed</span>
              </div>
              <div 
                className="w-full bg-gray-200 rounded-full h-3"
                role="progressbar"
                aria-valuenow={Math.round(progressPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Wizard progress: ${completedCount} of ${totalSteps} steps completed`}
              >
                <div 
                  className="bg-ss-teal h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Step Navigation */}
          <nav role="navigation" aria-label="Wizard steps">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 overflow-x-auto pb-2 px-4 sm:px-0">
              {config.steps.map((step, index) => {
                const isActive = index === state.currentStepIndex;
                const isComplete = state.completedSteps.has(step.id);
                const isClickable = allowNonLinear || index <= state.currentStepIndex || isComplete;
                
                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center transition-all duration-200 flex-shrink-0',
                      isClickable ? 'cursor-pointer hover:opacity-80 active:scale-95' : 'cursor-not-allowed opacity-50'
                    )}
                    onClick={() => isClickable && handleStepClick(index)}
                    onKeyDown={(e) => isClickable && handleStepKeyDown(index, e)}
                    tabIndex={isClickable ? 0 : -1}
                    role="button"
                    aria-label={`Step ${index + 1}: ${step.title}${isComplete ? ' (completed)' : ''}${isActive ? ' (current)' : ''}`}
                    aria-current={isActive ? 'step' : undefined}
                    aria-disabled={!isClickable}
                  >
                    <div className={cn(
                      'flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 text-xs sm:text-sm font-semibold transition-all duration-200 touch-manipulation',
                      isComplete 
                        ? 'bg-ss-success border-ss-success text-white'
                        : isActive 
                          ? 'bg-ss-teal border-ss-teal text-white'
                          : 'bg-white border-gray-300 text-gray-500'
                    )}>
                      {isComplete ? (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    
                    {index < config.steps.length - 1 && (
                      <div 
                        className={cn(
                          'w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 transition-all duration-200',
                          isComplete ? 'bg-ss-success' : 'bg-gray-300'
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Current Step */}
          <Card 
            className="border-l-4 border-l-ss-teal bg-ss-teal/5"
            role="region"
            aria-labelledby={`wizard-${config.id}-current-step-title`}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 
                      className="text-healthcare-lg font-semibold text-healthcare-primary"
                      id={`wizard-${config.id}-current-step-title`}
                    >
                      {currentStep?.title}
                    </h3>
                    
                    {currentStep?.isOptional && (
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                    )}
                    
                    {state.completedSteps.has(currentStep?.id || '') && (
                      <Badge className="bg-ss-success text-white text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    
                    {showEstimates && currentStep?.estimatedTime && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        ~{currentStep.estimatedTime}m
                      </Badge>
                    )}
                  </div>
                  
                  {currentStep?.description && (
                    <p className="text-healthcare-sm text-gray-600 mb-4">
                      {currentStep.description}
                    </p>
                  )}
                  
                  {/* Step Component */}
                  {currentStep && (
                    <div className="mb-4">
                      <currentStep.component
                        data={state.stepData}
                        onDataChange={updateData}
                        onValidationChange={(isValid, message) => {
                          setState(prev => {
                            const newErrors = new Map(prev.validationErrors);
                            if (isValid) {
                              newErrors.delete(currentStep.id);
                            } else {
                              newErrors.set(currentStep.id, message || 'Validation failed');
                            }
                            return { ...prev, validationErrors: newErrors };
                          });
                        }}
                        isActive={true}
                        wizardId={config.id}
                      />
                    </div>
                  )}
                  
                  {/* Validation Error */}
                  {currentValidationError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="text-healthcare-sm text-red-700 font-medium">
                          {currentValidationError}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Help */}
                {showHelp && currentStep?.helpContent && (
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowingHelp(!showingHelp)}
                      className="touch-manipulation"
                      aria-label="Show help for this step"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Help Content */}
              {showingHelp && currentStep?.helpContent && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-healthcare-sm text-blue-700">
                      {currentStep.helpContent}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step Actions */}
          <nav role="navigation" aria-label="Wizard actions">
            {/* Mobile Layout - Stack vertically */}
            <div className="sm:hidden space-y-3">
              {/* Primary Actions - Always visible on mobile */}
              <div className="flex items-center justify-between space-x-2">
                <Button
                  variant="outline"
                  onClick={previousStep}
                  disabled={!canGoPrevious || state.isLoading}
                  aria-label={`Go to previous step${config.steps[state.currentStepIndex - 1]?.title ? `: ${config.steps[state.currentStepIndex - 1].title}` : ''}`}
                  size="sm"
                  className="flex-1 touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  onClick={isLastStep ? handleComplete : nextStep}
                  className="bg-ss-teal hover:bg-ss-teal-deep flex-1 touch-manipulation"
                  disabled={state.isLoading || !!(currentValidationError && currentStep?.required)}
                  aria-label={isLastStep 
                    ? 'Complete entire wizard' 
                    : `Go to next step${config.steps[state.currentStepIndex + 1]?.title ? `: ${config.steps[state.currentStepIndex + 1].title}` : ''}`
                  }
                  size="sm"
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
              
              {/* Secondary Actions - Horizontal scroll on mobile */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {!state.completedSteps.has(currentStep?.id || '') && (
                  <Button
                    onClick={handleCompleteStep}
                    className="bg-ss-success hover:bg-ss-success/90 flex-shrink-0 touch-manipulation"
                    disabled={!!currentValidationError}
                    aria-label={`Mark step as complete: ${currentStep?.title}`}
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete Step
                  </Button>
                )}
                
                {currentStep?.isSkippable && (
                  <Button
                    variant="outline"
                    onClick={handleSkipStep}
                    disabled={state.isLoading}
                    aria-label={`Skip step: ${currentStep.title}`}
                    size="sm"
                    className="flex-shrink-0 touch-manipulation"
                  >
                    Skip Step
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                
                {config.autoSave && (
                  <Button
                    variant="outline"
                    onClick={saveSession}
                    disabled={!state.hasUnsavedChanges}
                    aria-label={state.hasUnsavedChanges ? "Save current progress" : "No changes to save"}
                    size="sm"
                    className="flex-shrink-0 touch-manipulation"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                )}
                
                {config.onCancel && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={state.isLoading}
                    aria-label="Cancel wizard and exit"
                    size="sm"
                    className="flex-shrink-0 touch-manipulation"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop Layout - Original horizontal layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {config.onCancel && (
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={state.isLoading}
                    aria-label="Cancel wizard and exit"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
                
                {config.autoSave && (
                  <Button
                    variant="outline"
                    onClick={saveSession}
                    disabled={!state.hasUnsavedChanges}
                    aria-label={state.hasUnsavedChanges ? "Save current progress" : "No changes to save"}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save Progress
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {currentStep?.isSkippable && (
                  <Button
                    variant="outline"
                    onClick={handleSkipStep}
                    disabled={state.isLoading}
                    aria-label={`Skip step: ${currentStep.title}`}
                  >
                    Skip Step
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={previousStep}
                  disabled={!canGoPrevious || state.isLoading}
                  aria-label={`Go to previous step${config.steps[state.currentStepIndex - 1]?.title ? `: ${config.steps[state.currentStepIndex - 1].title}` : ''}`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                {!state.completedSteps.has(currentStep?.id || '') && (
                  <Button
                    onClick={handleCompleteStep}
                    className="bg-ss-success hover:bg-ss-success/90"
                    disabled={!!currentValidationError}
                    aria-label={`Mark step as complete: ${currentStep?.title}`}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete Step
                  </Button>
                )}
                
                <Button
                  onClick={isLastStep ? handleComplete : nextStep}
                  className="bg-ss-teal hover:bg-ss-teal-deep"
                  disabled={state.isLoading || !!(currentValidationError && currentStep?.required)}
                  aria-label={isLastStep 
                    ? 'Complete entire wizard' 
                    : `Go to next step${config.steps[state.currentStepIndex + 1]?.title ? `: ${config.steps[state.currentStepIndex + 1].title}` : ''}`
                  }
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Complete Wizard
                    </>
                  ) : (
                    <>
                      Next Step
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </nav>

          {/* Summary */}
          {variant === 'full' && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-ss-success/5 rounded-lg">
                  <div className="text-healthcare-lg font-semibold text-ss-success">
                    {completedCount}
                  </div>
                  <div className="text-healthcare-xs text-gray-600">Completed</div>
                </div>
                
                <div className="p-3 bg-ss-cta-blue/5 rounded-lg">
                  <div className="text-healthcare-lg font-semibold text-ss-cta-blue">
                    {totalSteps - completedCount}
                  </div>
                  <div className="text-healthcare-xs text-gray-600">Remaining</div>
                </div>
                
                <div className="p-3 bg-ss-alert/5 rounded-lg">
                  <div className="text-healthcare-lg font-semibold text-ss-alert">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-healthcare-xs text-gray-600">Progress</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </WizardContext.Provider>
  );
};

WizardShell.displayName = 'WizardShell';