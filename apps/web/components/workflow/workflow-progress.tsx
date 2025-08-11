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
    <div className={cn('bg-white rounded-lg overflow-hidden', className)}>
      {/* Chevron-Style Connected Workflow */}
      <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-lg overflow-hidden">
        {steps.map((step, index) => {
          const stepStyles = getStepStyles(step, index);
          const IconComponent = getStepIcon(step);
          const isLast = index === steps.length - 1;
          const stepNumber = String(index + 1).padStart(2, '0');
          
          return (
            <div key={step.id} className="flex items-center flex-1 relative">
              {/* Step Container */}
              <div 
                className={cn(
                  'flex items-center justify-center px-4 py-3 min-h-[60px] relative flex-1 group transition-all duration-200',
                  {
                    'bg-emerald-500 text-white': step.status === 'completed',
                    'bg-blue-500 text-white': step.status === 'in_progress', 
                    'bg-gray-100 text-gray-600': step.status === 'pending',
                    'hover:bg-opacity-90': onStepClick,
                    'cursor-pointer': onStepClick
                  }
                )}
                onClick={() => onStepClick?.(step.id)}
              >
                {/* Step Content */}
                <div className="flex items-center justify-center space-x-3 relative z-10">
                  {/* Step Number/Icon */}
                  <div className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                    {
                      'bg-white bg-opacity-20': step.status === 'completed' || step.status === 'in_progress',
                      'bg-gray-300': step.status === 'pending'
                    }
                  )}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  
                  {/* Step Title */}
                  <span className="font-medium text-sm whitespace-nowrap">
                    {step.title}
                  </span>
                </div>
                
                {/* Chevron Arrow (except for last step) */}
                {!isLast && (
                  <div className="absolute right-0 top-0 h-full w-0 z-20">
                    <div className={cn(
                      'absolute right-0 top-0 h-full w-4 transform translate-x-2',
                      'border-l-[30px] border-t-[30px] border-b-[30px]',
                      'border-t-transparent border-b-transparent',
                      {
                        'border-l-emerald-500': step.status === 'completed',
                        'border-l-blue-500': step.status === 'in_progress',
                        'border-l-gray-100': step.status === 'pending'
                      }
                    )} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progress Summary */}
      {!isCompact && (
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700 text-sm">
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