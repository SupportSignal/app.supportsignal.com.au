'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { cn } from '@/lib/utils';
import { Clock, MapPin, User, AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import type { Incident } from '@/types/api';

export interface IncidentCardProps {
  incident: Incident;
  onView?: (incidentId: string) => void;
  onEdit?: (incidentId: string) => void;
  onDelete?: (incidentId: string) => void;
  showActions?: boolean;
  userRole?: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  canEdit?: boolean;
  canDelete?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

// Status configuration for visual consistency
const STATUS_CONFIG = {
  capture_pending: {
    label: 'Capture Pending',
    color: 'bg-workflow-progress text-white',
    icon: Clock3,
    description: 'Incident needs narrative capture',
  },
  analysis_pending: {
    label: 'Analysis Pending', 
    color: 'bg-ss-cta-blue text-white',
    icon: AlertCircle,
    description: 'Ready for team lead analysis',
  },
  completed: {
    label: 'Completed',
    color: 'bg-workflow-completed text-white',
    icon: CheckCircle2,
    description: 'Incident fully processed',
  },
} as const;

// Capture status indicators
const CAPTURE_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-workflow-draft text-white' },
  in_progress: { label: 'In Progress', color: 'bg-workflow-progress text-white' },
  completed: { label: 'Captured', color: 'bg-workflow-completed text-white' },
} as const;

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  userRole,
  canEdit = true,
  canDelete = false,
  className,
  variant = 'default',
}) => {
  const statusConfig = STATUS_CONFIG[incident.overall_status];
  const captureConfig = CAPTURE_STATUS_CONFIG[incident.capture_status];
  const StatusIcon = statusConfig.icon;

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTimeString;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(timestamp).toLocaleDateString('en-AU');
  };

  const handleView = () => {
    onView?.(incident._id);
  };

  const handleEdit = () => {
    if (canEdit) {
      onEdit?.(incident._id);
    }
  };

  const handleDelete = () => {
    if (canDelete) {
      onDelete?.(incident._id);
    }
  };

  const cardClassName = cn(
    'ss-card hover:shadow-lg transition-all duration-200 border border-gray-200',
    'bg-healthcare-surface relative group',
    {
      'hover:border-ss-teal-light cursor-pointer': !!onView,
      'opacity-75': incident.overall_status === 'completed',
    },
    className
  );

  const compactLayout = variant === 'compact';
  const detailedLayout = variant === 'detailed';

  return (
    <Card 
      className={cardClassName}
      onClick={onView ? handleView : undefined}
      role="article"
      aria-label={`Incident involving ${incident.participant_name}`}
    >
      <CardHeader className={cn('pb-ss-sm', compactLayout && 'pb-2')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-ss-sm">
            <StatusIcon className="w-4 h-4 text-healthcare-primary" />
            <div className="space-y-1">
              <h3 className="font-semibold text-healthcare-primary leading-tight">
                {incident.participant_name}
              </h3>
              {!compactLayout && (
                <p className="text-healthcare-xs text-gray-600">
                  Reported by {incident.reporter_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs font-medium', statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('space-y-ss-sm', compactLayout && 'pt-0')}>
        {/* Incident Metadata */}
        <div className="grid grid-cols-2 gap-ss-sm text-healthcare-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{formatDateTime(incident.event_date_time)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-3 h-3" />
            <span className="truncate" title={incident.location}>
              {incident.location}
            </span>
          </div>
        </div>

        {/* Progress Indicators */}
        {!compactLayout && (
          <div className="flex items-center gap-ss-md pt-ss-sm border-t border-gray-100">
            <div className="flex-1">
              <div className="flex items-center justify-between text-healthcare-xs mb-1">
                <span className="text-gray-600">Capture</span>
                <Badge className={cn('text-xs', captureConfig.color)}>
                  {captureConfig.label}
                </Badge>
              </div>
            </div>
            
            {detailedLayout && (
              <div className="flex-1">
                <div className="flex items-center justify-between text-healthcare-xs mb-1">
                  <span className="text-gray-600">Analysis</span>
                  <Badge className={cn('text-xs', 
                    incident.analysis_status === 'completed' ? 'bg-workflow-completed text-white' :
                    incident.analysis_status === 'in_progress' ? 'bg-workflow-progress text-white' :
                    'bg-workflow-draft text-white'
                  )}>
                    {incident.analysis_status === 'not_started' ? 'Pending' : 
                     incident.analysis_status === 'in_progress' ? 'In Progress' : 'Complete'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Enhancement Indicators */}
        {detailedLayout && (
          <div className="flex items-center gap-ss-md pt-ss-sm text-healthcare-xs">
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                incident.narrative_enhanced ? 'bg-ss-success' : 'bg-gray-300'
              )} />
              <span className="text-gray-600">Enhanced</span>
            </div>
            
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                incident.questions_generated ? 'bg-ss-success' : 'bg-gray-300'
              )} />
              <span className="text-gray-600">Questions</span>
            </div>
            
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full', 
                incident.analysis_generated ? 'bg-ss-success' : 'bg-gray-300'
              )} />
              <span className="text-gray-600">Analysis</span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center justify-between pt-ss-sm border-t border-gray-100">
          <span className="text-healthcare-xs text-gray-500">
            Updated {formatRelativeTime(incident.updated_at)}
          </span>
          
          {showActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleView();
                }}
                className="h-8 px-2 text-healthcare-xs hover:bg-ss-teal-light/10"
              >
                View
              </Button>
              
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  className="h-8 px-2 text-healthcare-xs hover:bg-ss-cta-blue/10"
                >
                  Edit
                </Button>
              )}
              
              {canDelete && userRole && ['system_admin', 'company_admin'].includes(userRole) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="h-8 px-2 text-healthcare-xs hover:bg-destructive/10 text-destructive"
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};