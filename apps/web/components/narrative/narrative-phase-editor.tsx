'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Button } from '@starter/ui';
import { Textarea } from '@starter/ui';
import { Badge } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  Clock, 
  Bot, 
  Users,
  BarChart3,
  ArrowRight
} from 'lucide-react';

export interface NarrativePhase {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending' | 'active';
  estimatedTime: string;
  content?: string;
  isEnhanced?: boolean;
  isGenerated?: boolean;
}

export interface NarrativePhaseEditorProps {
  phases: NarrativePhase[];
  currentPhase: string;
  onPhaseUpdate: (phaseId: string, content: string) => void;
  onPhaseComplete: (phaseId: string) => void;
  onPhaseSelect: (phaseId: string) => void;
  variant?: 'full' | 'compact' | 'minimal';
  showProgress?: boolean;
  showEstimates?: boolean;
  className?: string;
}

const defaultPhases: NarrativePhase[] = [
  {
    id: 'incident-reported',
    title: 'Incident Reported',
    description: 'Basic incident details captured',
    status: 'completed',
    estimatedTime: 'Completed',
  },
  {
    id: 'narrative-collection',
    title: 'Narrative Collection',
    description: 'Multi-phase incident narrative',
    status: 'active',
    estimatedTime: '10-15 min',
  },
  {
    id: 'ai-questions',
    title: 'AI Questions',
    description: 'Clarification questions generated',
    status: 'completed',
    estimatedTime: 'Completed',
  },
  {
    id: 'ai-enhancement',
    title: 'AI Enhancement',
    description: 'Narrative enhanced with AI',
    status: 'pending',
    estimatedTime: '1 min',
  },
  {
    id: 'analysis-phase',
    title: 'Analysis Phase',
    description: 'Team lead analysis begins',
    status: 'pending',
    estimatedTime: '5-10 min',
  },
  {
    id: 'analysis-complete',
    title: 'Analysis Complete',
    description: 'Incident fully processed',
    status: 'pending',
    estimatedTime: '2 min',
  },
];

export const NarrativePhaseEditor = React.forwardRef<HTMLDivElement, NarrativePhaseEditorProps>(({
  phases = defaultPhases,
  currentPhase,
  onPhaseUpdate,
  onPhaseComplete,
  onPhaseSelect,
  variant = 'full',
  showProgress = true,
  showEstimates = true,
  className,
}, ref) => {
  const getPhaseIcon = (phase: NarrativePhase) => {
    switch (phase.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-ss-success" />;
      case 'in_progress':
      case 'active':
        return <PlayCircle className="w-5 h-5 text-ss-cta-blue" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusBadge = (phase: NarrativePhase) => {
    const statusStyles = {
      completed: 'bg-ss-success text-white',
      in_progress: 'bg-ss-cta-blue text-white',
      active: 'bg-ss-cta-blue text-white',
      pending: 'bg-gray-200 text-gray-700',
    };

    const statusLabels = {
      completed: 'Completed',
      in_progress: 'Active',
      active: 'Active',
      pending: 'Pending',
    };

    return (
      <Badge className={cn('text-xs px-2 py-1', statusStyles[phase.status])}>
        {statusLabels[phase.status]}
      </Badge>
    );
  };

  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase);
  const completedCount = phases.filter(p => p.status === 'completed').length;
  const totalCount = phases.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-healthcare-lg font-semibold text-healthcare-primary">
            Workflow Progress
          </h3>
          {showProgress && (
            <div className="text-right">
              <div className="text-2xl font-bold text-ss-teal">{progressPercentage}%</div>
              <div className="text-healthcare-xs text-gray-500">Complete</div>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {phases.map((phase, index) => (
            <React.Fragment key={phase.id}>
              <div className="flex flex-col items-center">
                {getPhaseIcon(phase)}
                <div className="text-healthcare-xs text-center mt-1 max-w-16">
                  {phase.title.split(' ')[0]}
                </div>
              </div>
              {index < phases.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-300" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('space-y-6', className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-header-h2 font-semibold text-healthcare-primary mb-1">
            Workflow Progress
          </h2>
          <p className="text-healthcare-sm text-gray-600">
            Currently: <span className="font-medium text-ss-teal">
              {phases.find(p => p.status === 'active' || p.status === 'in_progress')?.title}
            </span> • Est. {phases.find(p => p.status === 'active' || p.status === 'in_progress')?.estimatedTime}
          </p>
        </div>
        
        {showProgress && (
          <div className="text-right">
            <div className="text-4xl font-bold text-ss-teal mb-1">{progressPercentage}%</div>
            <div className="text-healthcare-sm text-gray-600">Complete</div>
          </div>
        )}
      </div>

      {/* Phase Timeline */}
      <Card className="border-ss-teal/20">
        <CardContent className="p-6">
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className={cn(
                  'flex items-start space-x-4 p-4 rounded-lg transition-all duration-200',
                  phase.status === 'active' || phase.status === 'in_progress' 
                    ? 'bg-ss-teal/5 border-l-4 border-ss-teal' 
                    : 'bg-transparent hover:bg-healthcare-surface',
                  phase.status === 'completed' && 'opacity-75'
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {getPhaseIcon(phase)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-healthcare-base font-semibold text-healthcare-primary">
                        {phase.title}
                      </h3>
                      {getStatusBadge(phase)}
                    </div>
                    
                    {showEstimates && (
                      <div className="flex items-center text-healthcare-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {phase.estimatedTime}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-healthcare-sm text-gray-600 mb-2">
                    {phase.description}
                  </p>
                  
                  {phase.isEnhanced && (
                    <div className="flex items-center text-healthcare-xs text-ss-teal mb-2">
                      <Bot className="w-3 h-3 mr-1" />
                      AI Enhanced Content
                    </div>
                  )}
                  
                  {phase.isGenerated && (
                    <div className="flex items-center text-healthcare-xs text-ss-cta-blue mb-2">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      AI Generated Analysis
                    </div>
                  )}
                  
                  {(phase.status === 'active' || phase.status === 'in_progress') && variant === 'full' && (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        placeholder={`Enter details for ${phase.title.toLowerCase()}...`}
                        value={phase.content || ''}
                        onChange={(e) => onPhaseUpdate(phase.id, e.target.value)}
                        className="min-h-24 border-gray-300 focus:border-ss-teal focus:ring-ss-teal"
                      />
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => onPhaseComplete(phase.id)}
                          className="bg-ss-cta-blue hover:bg-ss-cta-blue/90"
                          disabled={!phase.content?.trim()}
                        >
                          Complete Phase
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-300"
                        >
                          Save Draft
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-ss-success/10 rounded-lg">
          <div className="text-2xl font-bold text-ss-success">{completedCount}</div>
          <div className="text-healthcare-sm text-gray-600">Completed</div>
        </div>
        <div className="text-center p-4 bg-ss-cta-blue/10 rounded-lg">
          <div className="text-2xl font-bold text-ss-cta-blue">1</div>
          <div className="text-healthcare-sm text-gray-600">In Progress</div>
        </div>
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {totalCount - completedCount - 1}
          </div>
          <div className="text-healthcare-sm text-gray-600">Pending</div>
        </div>
      </div>
    </div>
  );
});

NarrativePhaseEditor.displayName = 'NarrativePhaseEditor';