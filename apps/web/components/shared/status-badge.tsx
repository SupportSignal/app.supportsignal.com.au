'use client';

import React from 'react';
import { Badge } from '@starter/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Clock3, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause,
  XCircle,
  Info,
  AlertTriangle,
  Zap
} from 'lucide-react';

export type StatusType = 
  | 'capture_pending' 
  | 'analysis_pending' 
  | 'completed'
  | 'draft'
  | 'in_progress'
  | 'not_started'
  | 'error'
  | 'warning'
  | 'info'
  | 'success';

export type StatusVariant = 'default' | 'outline' | 'pill' | 'dot' | 'minimal';

export interface StatusBadgeProps {
  status: StatusType;
  variant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  customLabel?: string;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
  tooltip?: string;
}

// Status configuration with colors, icons, and labels
const STATUS_CONFIG: Record<StatusType, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  outlineClass: string;
  description: string;
}> = {
  // Incident workflow statuses
  capture_pending: {
    label: 'Capture Pending',
    icon: Clock3,
    colorClass: 'bg-workflow-progress text-white border-workflow-progress',
    outlineClass: 'border-workflow-progress text-workflow-progress bg-workflow-progress/10',
    description: 'Incident needs narrative capture',
  },
  analysis_pending: {
    label: 'Analysis Pending',
    icon: AlertCircle,
    colorClass: 'bg-ss-cta-blue text-white border-ss-cta-blue',
    outlineClass: 'border-ss-cta-blue text-ss-cta-blue bg-ss-cta-blue/10',
    description: 'Ready for team lead analysis',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    colorClass: 'bg-workflow-completed text-white border-workflow-completed',
    outlineClass: 'border-workflow-completed text-workflow-completed bg-workflow-completed/10',
    description: 'Process fully completed',
  },
  
  // Generic workflow statuses
  draft: {
    label: 'Draft',
    icon: Circle,
    colorClass: 'bg-workflow-draft text-white border-workflow-draft',
    outlineClass: 'border-workflow-draft text-workflow-draft bg-workflow-draft/10',
    description: 'In draft state',
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    colorClass: 'bg-workflow-progress text-white border-workflow-progress',
    outlineClass: 'border-workflow-progress text-workflow-progress bg-workflow-progress/10',
    description: 'Currently being processed',
  },
  not_started: {
    label: 'Not Started',
    icon: Pause,
    colorClass: 'bg-gray-500 text-white border-gray-500',
    outlineClass: 'border-gray-400 text-gray-600 bg-gray-50',
    description: 'Has not been started',
  },
  
  // Alert statuses
  error: {
    label: 'Error',
    icon: XCircle,
    colorClass: 'bg-destructive text-white border-destructive',
    outlineClass: 'border-destructive text-destructive bg-destructive/10',
    description: 'An error has occurred',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    colorClass: 'bg-workflow-alert text-black border-workflow-alert',
    outlineClass: 'border-workflow-alert text-amber-700 bg-workflow-alert/10',
    description: 'Requires attention',
  },
  info: {
    label: 'Info',
    icon: Info,
    colorClass: 'bg-blue-500 text-white border-blue-500',
    outlineClass: 'border-blue-400 text-blue-600 bg-blue-50',
    description: 'Informational status',
  },
  success: {
    label: 'Success',
    icon: Zap,
    colorClass: 'bg-ss-success text-white border-ss-success',
    outlineClass: 'border-ss-success text-green-700 bg-ss-success/10',
    description: 'Successfully completed',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 h-5',
  md: 'text-sm px-3 py-1 h-6',
  lg: 'text-base px-4 py-1.5 h-8',
};

const ICON_SIZE_CLASSES = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5', 
  lg: 'w-4 h-4',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  size = 'sm',
  showIcon = true,
  showLabel = true,
  customLabel,
  className,
  onClick,
  ariaLabel,
  tooltip,
}) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  const baseClasses = cn(
    'inline-flex items-center font-medium transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    SIZE_CLASSES[size],
    {
      'cursor-pointer hover:opacity-80': !!onClick,
      'rounded-full': variant === 'pill',
      'rounded-md': variant !== 'pill',
    }
  );

  let variantClasses = '';
  
  if (variant === 'default' || variant === 'pill') {
    variantClasses = cn(config.colorClass, variant === 'pill' ? 'rounded-full' : '');
  } else if (variant === 'outline') {
    variantClasses = cn(config.outlineClass, 'border');
  } else if (variant === 'dot') {
    variantClasses = cn(config.colorClass, 'p-0 w-2 h-2 rounded-full');
  } else if (variant === 'minimal') {
    const textColor = config.outlineClass.split(' ').find(c => c.startsWith('text-')) || 'text-gray-600';
    variantClasses = cn('bg-transparent border-0 px-0', textColor);
  }

  const badgeContent = (
    <>
      {showIcon && variant !== 'dot' && (
        <Icon className={cn(ICON_SIZE_CLASSES[size], showLabel && 'mr-1')} />
      )}
      {showLabel && variant !== 'dot' && (
        <span>{customLabel || config.label}</span>
      )}
    </>
  );

  const badgeProps = {
    className: cn(baseClasses, variantClasses, className),
    onClick,
    role: onClick ? 'button' : 'status',
    'aria-label': ariaLabel || `Status: ${config.label}. ${config.description}`,
    title: tooltip || config.description,
    tabIndex: onClick ? 0 : undefined,
    onKeyDown: onClick ? (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    } : undefined,
  };

  // For dot variant, return minimal Badge
  if (variant === 'dot') {
    return (
      <Badge {...badgeProps}>
        <span className="sr-only">{config.label}</span>
      </Badge>
    );
  }

  return (
    <Badge {...badgeProps}>
      {badgeContent}
    </Badge>
  );
};

// Convenience components for common use cases
export const IncidentStatusBadge: React.FC<Omit<StatusBadgeProps, 'status'> & {
  overallStatus: 'capture_pending' | 'analysis_pending' | 'completed';
}> = ({ overallStatus, ...props }) => (
  <StatusBadge status={overallStatus} {...props} />
);

export const CaptureStatusBadge: React.FC<Omit<StatusBadgeProps, 'status'> & {
  captureStatus: 'draft' | 'in_progress' | 'completed';
}> = ({ captureStatus, ...props }) => (
  <StatusBadge 
    status={captureStatus} 
    customLabel={
      captureStatus === 'completed' ? 'Captured' :
      captureStatus === 'in_progress' ? 'Capturing' :
      'Draft'
    }
    {...props} 
  />
);

export const AnalysisStatusBadge: React.FC<Omit<StatusBadgeProps, 'status'> & {
  analysisStatus: 'not_started' | 'in_progress' | 'completed';
}> = ({ analysisStatus, ...props }) => (
  <StatusBadge 
    status={analysisStatus === 'not_started' ? 'not_started' : 
            analysisStatus === 'in_progress' ? 'in_progress' : 'completed'}
    customLabel={
      analysisStatus === 'completed' ? 'Analyzed' :
      analysisStatus === 'in_progress' ? 'Analyzing' :
      'Pending Analysis'
    }
    {...props} 
  />
);

// Export status configuration for external use
export { STATUS_CONFIG };