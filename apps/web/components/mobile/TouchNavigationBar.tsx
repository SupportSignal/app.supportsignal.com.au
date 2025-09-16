/**
 * TouchNavigationBar - Mobile-optimized navigation with 44px touch targets
 * Story 3.5: Mobile-First Responsive Incident Capture
 */

import React from 'react';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  CheckCircle,
  HelpCircle,
  SkipForward,
  Save
} from 'lucide-react';

export interface TouchNavigationBarProps {
  currentStep: number;
  totalSteps: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  allStepsComplete: boolean;
  isCurrentStepComplete: boolean;
  isCurrentStepSkippable?: boolean;
  showHelp?: boolean;
  isHelpVisible?: boolean;
  readonly?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  onCompleteStep?: () => void;
  onSkipStep?: () => void;
  onToggleHelp?: () => void;
  onSave?: () => void;
  className?: string;
}

export function TouchNavigationBar({
  currentStep,
  totalSteps,
  canGoPrevious,
  canGoNext,
  isLastStep,
  allStepsComplete,
  isCurrentStepComplete,
  isCurrentStepSkippable = false,
  showHelp = false,
  isHelpVisible = false,
  readonly = false,
  onPrevious,
  onNext,
  onComplete,
  onCompleteStep,
  onSkipStep,
  onToggleHelp,
  onSave,
  className
}: TouchNavigationBarProps) {
  return (
    <div className={cn(
      'flex flex-col space-y-3 p-4 bg-white border-t border-gray-200',
      'sticky bottom-0 left-0 right-0 z-10',
      className
    )}>
      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-2 pb-2">
        <Badge className="bg-ss-teal text-white text-sm px-3 py-1">
          Step {currentStep} of {totalSteps}
        </Badge>
        {!isCurrentStepComplete && (
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Primary Action Button - Full width for easy touch */}
      {!readonly && (
        <div className="space-y-2">
          {!isCurrentStepComplete && onCompleteStep && (
            <Button 
              onClick={onCompleteStep}
              className="w-full h-12 bg-ss-teal text-white text-base font-medium"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Complete Step
            </Button>
          )}

          {/* Navigation buttons */}
          <div className="flex space-x-2">
            {canGoPrevious && onPrevious && (
              <Button 
                variant="outline" 
                onClick={onPrevious}
                className="flex-1 h-12 text-base"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Previous
              </Button>
            )}
            
            {canGoNext && onNext && (
              <Button 
                onClick={onNext}
                className="flex-1 h-12 bg-ss-teal text-white text-base"
                size="lg"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            )}
            
            {isLastStep && allStepsComplete && onComplete && (
              <Button 
                onClick={onComplete}
                className="flex-1 h-12 bg-ss-success text-white text-base"
                size="lg"
              >
                <Check className="w-5 h-5 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Secondary Actions - Smaller but still touch-friendly */}
      {!readonly && (
        <div className="flex space-x-2">
          {isCurrentStepSkippable && onSkipStep && (
            <Button 
              variant="ghost" 
              onClick={onSkipStep}
              className="flex-1 h-10 text-sm"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Skip Step
            </Button>
          )}
          
          {showHelp && onToggleHelp && (
            <Button
              variant="ghost"
              onClick={onToggleHelp}
              className="flex-1 h-10 text-sm"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              {isHelpVisible ? 'Hide Help' : 'Show Help'}
            </Button>
          )}
          
          {onSave && (
            <Button
              variant="ghost"
              onClick={onSave}
              className="flex-1 h-10 text-sm"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      )}
    </div>
  );
}