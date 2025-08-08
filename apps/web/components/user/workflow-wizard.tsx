'use client';

import React from 'react';
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
  Play,
  Pause,
  RotateCcw,
  Save,
  Eye,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component?: React.ReactNode;
  isComplete: boolean;
  isOptional?: boolean;
  isSkippable?: boolean;
  canNavigateBack?: boolean;
  validation?: () => boolean | string;
  estimatedTime?: number; // in minutes
  helpContent?: string;
  dependencies?: string[];
}

export interface WorkflowWizardProps {
  steps: WizardStep[];
  currentStepIndex: number;
  onStepChange: (stepIndex: number) => void;
  onComplete: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onStepComplete: (stepId: string) => void;
  onStepSkip?: (stepId: string) => void;
  title?: string;
  description?: string;
  showProgress?: boolean;
  showEstimates?: boolean;
  showHelp?: boolean;
  allowNonLinear?: boolean;
  autoSave?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export const WorkflowWizard = React.forwardRef<HTMLDivElement, WorkflowWizardProps>(({
  steps,
  currentStepIndex,
  onStepChange,
  onComplete,
  onCancel,
  onSave,
  onStepComplete,
  onStepSkip,
  title = 'Workflow Wizard',
  description,
  showProgress = true,
  showEstimates = true,
  showHelp = true,
  allowNonLinear = false,
  autoSave = false,
  variant = 'full',
  className,
}, ref) => {
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [showingHelp, setShowingHelp] = React.useState(false);

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.isComplete).length;
  const progressPercentage = (completedSteps / totalSteps) * 100;
  
  const canGoNext = currentStepIndex < steps.length - 1;
  const canGoPrevious = currentStepIndex > 0 && (currentStep?.canNavigateBack !== false);
  const isLastStep = currentStepIndex === steps.length - 1;
  const allStepsComplete = steps.every(step => step.isComplete || step.isOptional);

  const totalEstimatedTime = React.useMemo(() => {
    return steps.reduce((total, step) => total + (step.estimatedTime || 0), 0);
  }, [steps]);

  const remainingTime = React.useMemo(() => {
    return steps.slice(currentStepIndex).reduce((total, step) => {
      return total + (step.isComplete ? 0 : (step.estimatedTime || 0));
    }, 0);
  }, [steps, currentStepIndex]);

  const validateCurrentStep = () => {
    if (!currentStep.validation) return true;
    
    const result = currentStep.validation();
    if (typeof result === 'string') {
      setValidationError(result);
      return false;
    }
    
    setValidationError(null);
    return result;
  };

  const handleNext = () => {
    if (validateCurrentStep() && canGoNext) {
      onStepChange(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      setValidationError(null);
      onStepChange(currentStepIndex - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (allowNonLinear || stepIndex <= currentStepIndex || steps[stepIndex].isComplete) {
      setValidationError(null);
      onStepChange(stepIndex);
    }
  };

  const handleCompleteStep = () => {
    if (validateCurrentStep()) {
      onStepComplete(currentStep.id);
      if (autoSave && onSave) {
        onSave();
      }
    }
  };

  const handleSkipStep = () => {
    if (currentStep.isSkippable && onStepSkip) {
      onStepSkip(currentStep.id);
      if (canGoNext) {
        onStepChange(currentStepIndex + 1);
      }
    }
  };

  const handleComplete = () => {
    if (allStepsComplete || isLastStep) {
      if (validateCurrentStep()) {
        onComplete();
      }
    }
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Progress */}
        <div className="flex items-center justify-between">
          <h3 className="text-healthcare-base font-semibold text-healthcare-primary">
            {title}
          </h3>
          <Badge className="bg-ss-teal text-white">
            Step {currentStepIndex + 1} of {totalSteps}
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-ss-teal h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          
          <Button
            size="sm"
            onClick={isLastStep ? handleComplete : handleNext}
            className="bg-ss-teal hover:bg-ss-teal-deep"
            disabled={!currentStep.isComplete && !isLastStep}
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-healthcare-lg font-semibold text-healthcare-primary">
              {title}
            </h2>
            {description && (
              <p className="text-healthcare-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showEstimates && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {remainingTime}m remaining
              </Badge>
            )}
            
            <Badge className="bg-ss-teal text-white">
              Step {currentStepIndex + 1} of {totalSteps}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {showProgress && (
          <div>
            <div className="flex items-center justify-between text-healthcare-sm text-gray-600 mb-2">
              <span>Progress: {Math.round(progressPercentage)}%</span>
              <span>{completedSteps} of {totalSteps} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-ss-teal h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Step Navigation */}
        <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isClickable = allowNonLinear || index <= currentStepIndex || step.isComplete;
            
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center cursor-pointer transition-all duration-200',
                  isClickable ? 'hover:opacity-80' : 'cursor-not-allowed opacity-50'
                )}
                onClick={() => isClickable && handleStepClick(index)}
              >
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-all duration-200',
                  step.isComplete 
                    ? 'bg-ss-success border-ss-success text-white'
                    : isActive 
                      ? 'bg-ss-teal border-ss-teal text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                )}>
                  {step.isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-8 h-0.5 mx-1 transition-all duration-200',
                    step.isComplete ? 'bg-ss-success' : 'bg-gray-300'
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step */}
        <Card className="border-l-4 border-l-ss-teal bg-ss-teal/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-healthcare-lg font-semibold text-healthcare-primary">
                    {currentStep.title}
                  </h3>
                  
                  {currentStep.isOptional && (
                    <Badge variant="outline" className="text-xs">Optional</Badge>
                  )}
                  
                  {currentStep.isComplete && (
                    <Badge className="bg-ss-success text-white text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                  
                  {showEstimates && currentStep.estimatedTime && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      ~{currentStep.estimatedTime}m
                    </Badge>
                  )}
                </div>
                
                <p className="text-healthcare-sm text-gray-600 mb-4">
                  {currentStep.description}
                </p>
                
                {/* Step Component */}
                {currentStep.component && (
                  <div className="mb-4">
                    {currentStep.component}
                  </div>
                )}
                
                {/* Validation Error */}
                {validationError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-healthcare-sm text-red-700 font-medium">
                        {validationError}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Help */}
              {showHelp && currentStep.helpContent && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowingHelp(!showingHelp)}
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Help Content */}
            {showingHelp && currentStep.helpContent && (
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
            
            {onSave && (
              <Button
                variant="outline"
                onClick={onSave}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Progress
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStep.isSkippable && onStepSkip && (
              <Button
                variant="outline"
                onClick={handleSkipStep}
              >
                Skip Step
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            {!currentStep.isComplete && (
              <Button
                onClick={handleCompleteStep}
                className="bg-ss-success hover:bg-ss-success/90"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete Step
              </Button>
            )}
            
            <Button
              onClick={isLastStep ? handleComplete : handleNext}
              className="bg-ss-teal hover:bg-ss-teal-deep"
              disabled={!currentStep.isComplete && !isLastStep}
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Complete Workflow
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

        {/* Summary */}
        {variant === 'full' && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-ss-success/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-success">
                  {completedSteps}
                </div>
                <div className="text-healthcare-xs text-gray-600">Completed</div>
              </div>
              
              <div className="p-3 bg-ss-cta-blue/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-cta-blue">
                  {totalSteps - completedSteps}
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
  );
});

WorkflowWizard.displayName = 'WorkflowWizard';