'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowRight, 
  Play,
  AlertCircle,
  FileText,
  Search,
  CheckSquare
} from 'lucide-react';
import { StatusBadge } from '../shared';
import type { Incident } from '@/types/api';

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'skipped';
  icon?: React.ComponentType<{ className?: string }>;
  estimatedTime?: string;
  completedAt?: number;
}

export interface WorkflowProgressProps {
  incident: Incident;
  showStepDetails?: boolean;
  showTimestamps?: boolean;
  showEstimates?: boolean;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
  onStepClick?: (stepId: string) => void;
}

// Define the standard incident workflow steps
const getWorkflowSteps = (incident: Incident): WorkflowStep[] => [
  {
    id: 'capture_start',
    title: 'Incident Reported',
    description: 'Basic incident details captured',
    status: 'completed', // Always completed if incident exists
    icon: FileText,
    estimatedTime: '2 min',
    completedAt: incident.created_at,
  },
  {
    id: 'narrative_capture',
    title: 'Narrative Collection',
    description: 'Multi-phase incident narrative',
    status: incident.capture_status === 'completed' ? 'completed' :
            incident.capture_status === 'in_progress' ? 'in_progress' : 'pending',
    icon: FileText,
    estimatedTime: '10-15 min',
  },
  {
    id: 'questions_generation',
    title: 'AI Questions',
    description: 'Clarification questions generated',
    status: incident.questions_generated ? 'completed' : 
            incident.capture_status === 'in_progress' ? 'in_progress' : 'pending',
    icon: Search,
    estimatedTime: '30 sec',
  },
  {
    id: 'narrative_enhancement',
    title: 'AI Enhancement',
    description: 'Narrative enhanced with AI',
    status: incident.narrative_enhanced ? 'completed' : 
            incident.capture_status === 'completed' ? 'in_progress' : 'pending',
    icon: CheckSquare,
    estimatedTime: '1 min',
  },
  {
    id: 'analysis_start',
    title: 'Analysis Phase',
    description: 'Team lead analysis begins',
    status: incident.analysis_status === 'completed' ? 'completed' :
            incident.analysis_status === 'in_progress' ? 'in_progress' :
            incident.capture_status === 'completed' ? 'pending' : 'pending',
    icon: Search,
    estimatedTime: '5-10 min',
  },
  {
    id: 'analysis_complete',
    title: 'Analysis Complete',
    description: 'Incident fully processed',
    status: incident.analysis_generated && incident.overall_status === 'completed' ? 'completed' :
            incident.analysis_status === 'in_progress' ? 'in_progress' : 'pending',
    icon: CheckCircle2,
    estimatedTime: '2 min',
  },
];

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  incident,
  showStepDetails = true,
  showTimestamps = false,
  showEstimates = false,
  orientation = 'horizontal',
  variant = 'full',
  className,
  onStepClick,
}) => {
  const steps = getWorkflowSteps(incident);
  const isCompact = variant === 'compact';
  const isMinimal = variant === 'minimal';
  const isVertical = orientation === 'vertical';

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStepIcon = (step: WorkflowStep) => {
    const IconComponent = step.icon || Circle;
    
    switch (step.status) {
      case 'completed':
        return CheckCircle2;
      case 'in_progress':
        return Play;
      case 'pending':
        return Circle;
      case 'skipped':
        return AlertCircle;
      default:
        return IconComponent;
    }
  };

  const getStepStyles = (step: WorkflowStep, index: number) => {
    const isLast = index === steps.length - 1;
    const isClickable = !!onStepClick;
    
    return {
      container: cn(
        'flex items-center',
        isVertical ? 'w-full' : 'flex-1',
        isClickable && 'cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors',
        {
          'mb-4': isVertical && !isLast,
        }
      ),
      iconContainer: cn(
        'flex items-center justify-center rounded-full border-2 flex-shrink-0 z-10',
        'w-8 h-8 transition-colors',
        {
          'bg-ss-success border-ss-success text-white': step.status === 'completed',
          'bg-ss-cta-blue border-ss-cta-blue text-white': step.status === 'in_progress',
          'bg-gray-100 border-gray-300 text-gray-400': step.status === 'pending',
          'bg-ss-alert border-ss-alert text-black': step.status === 'skipped',
        }
      ),
      content: cn(
        'flex-1',
        isVertical ? 'ml-4' : 'mt-2',
        isMinimal && 'hidden'
      ),
    };
  };

  const currentStep = steps.find(step => step.status === 'in_progress');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (isMinimal) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-ss-success h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-healthcare-xs text-gray-600 whitespace-nowrap">
          {completedSteps}/{steps.length}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('bg-healthcare-surface', className)}>
      {/* Progress Summary */}
      {!isCompact && (
        <div className="mb-ss-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-healthcare-primary text-healthcare-lg">
              Workflow Progress
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={incident.overall_status} size="sm" />
              <span className="text-healthcare-xs text-gray-600">
                {completedSteps}/{steps.length} steps
              </span>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-ss-teal h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {currentStep && (
            <p className="text-healthcare-sm text-gray-600">
              Currently: <span className="font-medium text-healthcare-primary">
                {currentStep.title}
              </span>
              {showEstimates && currentStep.estimatedTime && (
                <span className="text-gray-500"> • Est. {currentStep.estimatedTime}</span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Step Timeline */}
      <div className={cn(
        isVertical ? 'space-y-4' : 'flex items-center justify-between'
      )}>
        {steps.map((step, index) => {
          const styles = getStepStyles(step, index);
          const StepIcon = getStepIcon(step);
          const isLast = index === steps.length - 1;

          return (
            <div 
              key={step.id} 
              className="flex items-center"
              onClick={() => onStepClick?.(step.id)}
            >
              <div className="flex flex-col items-center">
                {/* Step Icon */}
                <div className={styles.iconContainer}>
                  <StepIcon className="w-4 h-4" />
                </div>

                {/* Step Content */}
                {showStepDetails && (
                  <div className="text-center mt-2 max-w-24">
                    <h4 className="font-medium text-healthcare-xs text-healthcare-primary leading-tight">
                      {step.title}
                    </h4>
                    
                    {!isCompact && (
                      <p className="text-healthcare-xs text-gray-600 mt-1 leading-tight">
                        {step.description}
                      </p>
                    )}
                    
                    {/* Status Badge */}
                    {step.status === 'in_progress' && (
                      <StatusBadge 
                        status="in_progress" 
                        size="sm" 
                        variant="outline"
                        customLabel="Active"
                        className="mt-1"
                      />
                    )}
                    
                    {/* Estimates */}
                    {showEstimates && step.estimatedTime && (
                      <div className="text-healthcare-xs text-gray-500 mt-1">
                        Est. {step.estimatedTime}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Connector Arrow */}
              {!isLast && !isVertical && (
                <ArrowRight className="w-4 h-4 text-gray-300 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {!isCompact && !isMinimal && (
        <div className="mt-ss-lg pt-ss-lg border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-ss-md text-center">
            <div>
              <div className="text-healthcare-lg font-semibold text-ss-success">
                {completedSteps}
              </div>
              <div className="text-healthcare-xs text-gray-600">Completed</div>
            </div>
            
            <div>
              <div className="text-healthcare-lg font-semibold text-ss-cta-blue">
                {steps.filter(s => s.status === 'in_progress').length}
              </div>
              <div className="text-healthcare-xs text-gray-600">In Progress</div>
            </div>
            
            <div>
              <div className="text-healthcare-lg font-semibold text-gray-400">
                {steps.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-healthcare-xs text-gray-600">Pending</div>
            </div>
            
            <div>
              <div className="text-healthcare-lg font-semibold text-healthcare-primary">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-healthcare-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};