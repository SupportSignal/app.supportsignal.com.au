// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Button } from '@starter/ui';
import { Badge } from '@starter/ui';
import { Textarea } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Circle, 
  Play, 
  Clock, 
  ArrowRight,
  AlertTriangle,
  Search,
  FileText,
  BarChart3,
  Users,
  Eye,
  Edit,
  Save,
  RotateCcw
} from 'lucide-react';

export interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'skipped' | 'blocked';
  assignedRole: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  requiredPermissions?: string[];
  estimatedTime?: string;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  dependencies?: string[];
  isOptional?: boolean;
}

export interface AnalysisWorkflowProps {
  steps: AnalysisStep[];
  currentStep?: string;
  overallStatus: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  onStepStart: (stepId: string) => void;
  onStepComplete: (stepId: string, notes?: string) => void;
  onStepSkip: (stepId: string, reason: string) => void;
  onStepEdit: (stepId: string) => void;
  userRole?: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  readOnly?: boolean;
  showTimestamps?: boolean;
  showAssignments?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const defaultSteps: AnalysisStep[] = [
  {
    id: 'initial_review',
    title: 'Initial Review',
    description: 'Review incident narrative and basic information',
    status: 'completed',
    assignedRole: 'team_lead',
    estimatedTime: '5 min',
    completedAt: new Date(Date.now() - 3600000),
    completedBy: 'Sarah Wilson',
  },
  {
    id: 'conditions_analysis',
    title: 'Contributing Conditions',
    description: 'Identify and analyze contributing conditions',
    status: 'in_progress',
    assignedRole: 'team_lead',
    estimatedTime: '15 min',
    dependencies: ['initial_review'],
  },
  {
    id: 'classification',
    title: 'Incident Classification',
    description: 'Classify incident type, severity, and risk level',
    status: 'pending',
    assignedRole: 'team_lead',
    estimatedTime: '10 min',
    dependencies: ['conditions_analysis'],
  },
  {
    id: 'recommendations',
    title: 'Recommendations',
    description: 'Develop prevention and improvement recommendations',
    status: 'pending',
    assignedRole: 'company_admin',
    estimatedTime: '20 min',
    dependencies: ['classification'],
  },
  {
    id: 'final_review',
    title: 'Final Review',
    description: 'Review all analysis components and approve',
    status: 'pending',
    assignedRole: 'company_admin',
    estimatedTime: '10 min',
    dependencies: ['recommendations'],
  },
];

const roleHierarchy = {
  system_admin: 4,
  company_admin: 3,
  team_lead: 2,
  frontline_worker: 1,
};

export const AnalysisWorkflow = React.forwardRef<HTMLDivElement, AnalysisWorkflowProps>(({
  steps = defaultSteps,
  currentStep,
  overallStatus,
  onStepStart,
  onStepComplete,
  onStepSkip,
  onStepEdit,
  userRole,
  readOnly = false,
  showTimestamps = true,
  showAssignments = true,
  variant = 'full',
  className,
}, ref) => {
  const [editingStepId, setEditingStepId] = React.useState<string | null>(null);
  const [stepNotes, setStepNotes] = React.useState<Record<string, string>>({});

  const getStepIcon = (step: AnalysisStep) => {
    switch (step.status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Play;
      case 'pending':
        return Circle;
      case 'skipped':
        return ArrowRight;
      case 'blocked':
        return AlertTriangle;
      default:
        return Circle;
    }
  };

  const getStepStyles = (step: AnalysisStep) => {
    switch (step.status) {
      case 'completed':
        return {
          iconColor: 'text-ss-success',
          bgColor: 'bg-ss-success/10',
          borderColor: 'border-ss-success/20',
        };
      case 'in_progress':
        return {
          iconColor: 'text-ss-cta-blue',
          bgColor: 'bg-ss-cta-blue/10',
          borderColor: 'border-ss-cta-blue/20',
        };
      case 'pending':
        return {
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
      case 'skipped':
        return {
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
      case 'blocked':
        return {
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      default:
        return {
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'bg-purple-100 text-purple-800';
      case 'company_admin':
        return 'bg-blue-100 text-blue-800';
      case 'team_lead':
        return 'bg-green-100 text-green-800';
      case 'frontline_worker':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canUserAccessStep = (step: AnalysisStep) => {
    if (!userRole) return true;
    return roleHierarchy[userRole] >= roleHierarchy[step.assignedRole];
  };

  const canUserStartStep = (step: AnalysisStep) => {
    if (readOnly || !canUserAccessStep(step)) return false;
    if (step.status !== 'pending') return false;
    
    // Check dependencies
    if (step.dependencies) {
      return step.dependencies.every(depId => {
        const depStep = steps.find(s => s.id === depId);
        return depStep?.status === 'completed';
      });
    }
    
    return true;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-healthcare-base font-semibold text-healthcare-primary">
            Analysis Progress
          </h4>
          <span className="text-healthcare-sm text-gray-600">
            {completedSteps}/{totalSteps}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-ss-teal h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex items-center space-x-2 text-healthcare-xs text-gray-600">
          <span>Current: {steps.find(s => s.status === 'in_progress')?.title || 'None'}</span>
        </div>
      </div>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-ss-teal" />
            <span>Analysis Workflow</span>
            <Badge className="bg-ss-teal text-white">
              {Math.round(progressPercentage)}% Complete
            </Badge>
          </div>
          
          <div className="text-right">
            <div className="text-healthcare-sm text-gray-600">
              {completedSteps} of {totalSteps} steps completed
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-ss-teal h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-healthcare-sm text-gray-600">
            <span>Progress: {Math.round(progressPercentage)}%</span>
            <span>Status: {overallStatus.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const styles = getStepStyles(step);
            const StepIcon = getStepIcon(step);
            const canAccess = canUserAccessStep(step);
            const canStart = canUserStartStep(step);
            const isEditing = editingStepId === step.id;

            return (
              <Card 
                key={step.id}
                className={cn(
                  'border-l-4 transition-all duration-200',
                  styles.borderColor,
                  styles.bgColor,
                  !canAccess && 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={cn('p-1 rounded-full mt-1', styles.bgColor)}>
                        <StepIcon className={cn('w-5 h-5', styles.iconColor)} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                            {step.title}
                          </h4>
                          
                          {showAssignments && (
                            <Badge className={cn('text-xs', getRoleBadgeColor(step.assignedRole))}>
                              {step.assignedRole.replace('_', ' ')}
                            </Badge>
                          )}
                          
                          {step.isOptional && (
                            <Badge variant="outline" className="text-xs">Optional</Badge>
                          )}
                        </div>
                        
                        <p className="text-healthcare-sm text-gray-600 mb-2">
                          {step.description}
                        </p>
                        
                        {/* Step Details */}
                        <div className="flex items-center space-x-4 text-healthcare-xs text-gray-500">
                          {step.estimatedTime && step.status !== 'completed' && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Est. {step.estimatedTime}</span>
                            </div>
                          )}
                          
                          {showTimestamps && step.completedAt && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Completed {formatTimestamp(step.completedAt)}</span>
                            </div>
                          )}
                          
                          {step.completedBy && (
                            <span>by {step.completedBy}</span>
                          )}
                        </div>
                        
                        {/* Dependencies */}
                        {step.dependencies && step.dependencies.length > 0 && (
                          <div className="mt-2 text-healthcare-xs text-gray-500">
                            <span>Depends on: </span>
                            {step.dependencies.map((depId, i) => {
                              const depStep = steps.find(s => s.id === depId);
                              return (
                                <span key={depId}>
                                  {depStep?.title}
                                  {i < step.dependencies!.length - 1 && ', '}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Notes */}
                        {step.notes && (
                          <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                            <p className="text-healthcare-xs text-gray-700">{step.notes}</p>
                          </div>
                        )}
                        
                        {/* Editing Form */}
                        {isEditing && !readOnly && (
                          <div className="mt-3 p-3 bg-white rounded border border-ss-teal/20">
                            <Textarea
                              placeholder="Add notes about this step..."
                              value={stepNotes[step.id] || ''}
                              onChange={(e) => setStepNotes(prev => ({ 
                                ...prev, 
                                [step.id]: e.target.value 
                              }))}
                              className="mb-2"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  onStepComplete(step.id, stepNotes[step.id]);
                                  setEditingStepId(null);
                                }}
                                className="bg-ss-success hover:bg-ss-success/90"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingStepId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    {canAccess && !readOnly && (
                      <div className="flex items-center space-x-2 ml-4">
                        {step.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStepEdit(step.id)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        )}
                        
                        {step.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => setEditingStepId(step.id)}
                            className="bg-ss-cta-blue hover:bg-ss-cta-blue/90"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        
                        {canStart && (
                          <Button
                            size="sm"
                            onClick={() => onStepStart(step.id)}
                            className="bg-ss-teal hover:bg-ss-teal-deep"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        
                        {step.status === 'pending' && step.isOptional && canAccess && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStepSkip(step.id, 'Optional step skipped')}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Skip
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

AnalysisWorkflow.displayName = 'AnalysisWorkflow';