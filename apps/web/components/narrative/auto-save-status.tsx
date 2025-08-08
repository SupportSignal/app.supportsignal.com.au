'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  Wifi,
  WifiOff,
  Save
} from 'lucide-react';

export interface AutoSaveStatusProps {
  status: 'saved' | 'saving' | 'error' | 'offline' | 'pending' | 'conflict';
  lastSaved?: Date;
  error?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showTimestamp?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const AutoSaveStatus = React.forwardRef<HTMLDivElement, AutoSaveStatusProps>(({
  status,
  lastSaved,
  error,
  variant = 'default',
  showTimestamp = true,
  showDetails = false,
  className,
}, ref) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saved':
        return {
          icon: CheckCircle,
          label: 'Auto-saved',
          description: 'All changes have been saved',
          color: 'text-ss-success',
          bgColor: 'bg-ss-success/10',
          borderColor: 'border-ss-success/20',
          badgeColor: 'bg-ss-success text-white',
          textColor: 'text-ss-success',
        };
      case 'saving':
        return {
          icon: Loader2,
          label: 'Saving...',
          description: 'Changes are being saved',
          color: 'text-ss-cta-blue',
          bgColor: 'bg-ss-cta-blue/10',
          borderColor: 'border-ss-cta-blue/20',
          badgeColor: 'bg-ss-cta-blue text-white',
          textColor: 'text-ss-cta-blue',
          animate: true,
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending save',
          description: 'Changes will be saved shortly',
          color: 'text-ss-alert',
          bgColor: 'bg-ss-alert/10',
          borderColor: 'border-ss-alert/20',
          badgeColor: 'bg-ss-alert text-black',
          textColor: 'text-ss-alert',
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Save failed',
          description: error || 'Unable to save changes',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeColor: 'bg-red-600 text-white',
          textColor: 'text-red-600',
        };
      case 'offline':
        return {
          icon: WifiOff,
          label: 'Offline',
          description: 'Changes will sync when connection is restored',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-500 text-white',
          textColor: 'text-gray-500',
        };
      case 'conflict':
        return {
          icon: AlertCircle,
          label: 'Sync conflict',
          description: 'Content was modified elsewhere - review needed',
          color: 'text-ss-alert',
          bgColor: 'bg-ss-alert/10',
          borderColor: 'border-ss-alert/20',
          badgeColor: 'bg-ss-alert text-black',
          textColor: 'text-ss-alert',
        };
      default:
        return {
          icon: Save,
          label: 'Unknown',
          description: 'Save status unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-200 text-gray-700',
          textColor: 'text-gray-500',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return diffInSeconds < 10 ? 'just now' : `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('inline-flex items-center', className)}>
        <IconComponent 
          className={cn(
            'w-3 h-3 mr-1', 
            config.color,
            config.animate && 'animate-spin'
          )} 
        />
        <span className={cn('text-healthcare-xs', config.textColor)}>
          {config.label}
        </span>
        {showTimestamp && lastSaved && status === 'saved' && (
          <span className="text-healthcare-xs text-gray-400 ml-1">
            ({formatTimestamp(lastSaved)})
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div ref={ref} className={cn('inline-flex items-center space-x-2', className)}>
        <Badge className={cn('text-xs', config.badgeColor)}>
          <IconComponent 
            className={cn(
              'w-3 h-3 mr-1', 
              config.animate && 'animate-spin'
            )} 
          />
          {config.label}
        </Badge>
        
        {showTimestamp && lastSaved && (
          <span className="text-healthcare-xs text-gray-500">
            {formatTimestamp(lastSaved)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center p-3 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-center space-x-3 flex-1">
        <IconComponent 
          className={cn(
            'w-5 h-5 flex-shrink-0', 
            config.color,
            config.animate && 'animate-spin'
          )} 
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className={cn('text-healthcare-sm font-medium', config.textColor)}>
              {config.label}
            </span>
            
            {showTimestamp && lastSaved && (
              <span className="text-healthcare-xs text-gray-500 flex-shrink-0">
                {formatTimestamp(lastSaved)}
              </span>
            )}
          </div>
          
          {showDetails && (
            <p className="text-healthcare-xs text-gray-600 mt-1">
              {config.description}
            </p>
          )}
        </div>
      </div>

      {/* Connection indicator */}
      <div className="flex items-center ml-3">
        {status === 'offline' ? (
          <WifiOff className="w-4 h-4 text-gray-400" />
        ) : (
          <Wifi className="w-4 h-4 text-ss-success" />
        )}
      </div>
    </div>
  );
});

AutoSaveStatus.displayName = 'AutoSaveStatus';