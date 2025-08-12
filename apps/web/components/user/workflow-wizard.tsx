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
  readonly?: boolean;
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
  readonly = false,
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
        {/* Unified Step Navigation - Clean Design with Green Background */}
        <div className="flex items-center bg-gradient-to-r from-ss-teal/10 to-ss-teal/20 border border-ss-teal/30 rounded-lg overflow-hidden">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isClickable = !readonly && (allowNonLinear || index <= currentStepIndex || step.isComplete);
            const isLast = index === steps.length - 1;
            const stepNumber = String(index + 1).padStart(2, '0');
            
            return (
              <div key={step.id} className="relative flex-1">
                {/* Step Container - Transparent to show green background */}
                <div 
                  className={cn(
                    'flex items-center justify-center px-4 py-3 min-h-[60px] w-full bg-transparent',
                    {
                      'hover:bg-white/20 cursor-pointer transition-colors duration-200': isClickable && !readonly,
                      'cursor-default': readonly,
                      'cursor-not-allowed opacity-50': !isClickable && !readonly
                    }
                  )}
                  onClick={() => !readonly && isClickable && handleStepClick(index)}
                >
                  {/* Step Content - Horizontal Layout (Circle Left, Text Right) */}
                  <div className="flex items-center w-full px-4 py-3 text-sm font-medium">
                    {/* Step Number/Icon - Green circle outlines */}
                    <div className={cn(
                      'flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-full text-xs font-medium mr-3 border',
                      {
                        // Completed: Green filled circle with white checkmark
                        'bg-ss-teal border-ss-teal text-white': step.isComplete,
                        // Active: White circle with green outline and green text
                        'bg-white border-ss-teal text-ss-teal': isActive && !step.isComplete,
                        // Future: Transparent background with green outline and green text
                        'bg-transparent border-ss-teal text-ss-teal': !step.isComplete && !isActive
                      }
                    )}>
                      {step.isComplete ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                    
                    {/* Step Title - Green text */}
                    <span className="font-medium text-sm leading-tight text-ss-teal">
                      {step.title}
                    </span>
                  </div>
                </div>

                {/* Original SVG Chevron Separator - Restored from reference */}
                {!isLast && (
                  <div className="absolute right-0 top-0 h-full w-5" aria-hidden="true">
                    <svg className="h-full w-full text-gray-400" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
                      <path d="M0 -2L20 40L0 82" vectorEffect="non-scaling-stroke" stroke="currentColor" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Current Step - Only show in interactive mode */}
        {!readonly && (
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
        )}
      </CardContent>
    </Card>
  );
});

WorkflowWizard.displayName = 'WorkflowWizard';