'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { Button } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  RotateCcw,
  Info
} from 'lucide-react';

export interface EnhancementIndicatorProps {
  type: 'enhanced' | 'generated' | 'processing' | 'pending' | 'error';
  content?: string;
  confidence?: number;
  timestamp?: Date;
  showDetails?: boolean;
  showActions?: boolean;
  onView?: () => void;
  onRevert?: () => void;
  onRetry?: () => void;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export const EnhancementIndicator = React.forwardRef<HTMLDivElement, EnhancementIndicatorProps>(({
  type,
  content,
  confidence,
  timestamp,
  showDetails = false,
  showActions = false,
  onView,
  onRevert,
  onRetry,
  variant = 'default',
  className,
}, ref) => {
  const getIndicatorConfig = () => {
    switch (type) {
      case 'enhanced':
        return {
          icon: Bot,
          label: 'AI Enhanced',
          description: 'Content improved by AI analysis',
          color: 'text-ss-teal',
          bgColor: 'bg-ss-teal/10',
          borderColor: 'border-ss-teal/20',
          badgeColor: 'bg-ss-teal text-white',
        };
      case 'generated':
        return {
          icon: Sparkles,
          label: 'AI Generated',
          description: 'Content created by AI analysis',
          color: 'text-ss-cta-blue',
          bgColor: 'bg-ss-cta-blue/10',
          borderColor: 'border-ss-cta-blue/20',
          badgeColor: 'bg-ss-cta-blue text-white',
        };
      case 'processing':
        return {
          icon: Clock,
          label: 'Processing',
          description: 'AI enhancement in progress',
          color: 'text-ss-alert',
          bgColor: 'bg-ss-alert/10',
          borderColor: 'border-ss-alert/20',
          badgeColor: 'bg-ss-alert text-black',
        };
      case 'pending':
        return {
          icon: Clock,
          label: 'Enhancement Pending',
          description: 'Waiting for AI enhancement',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-200 text-gray-700',
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Enhancement Failed',
          description: 'AI enhancement encountered an error',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeColor: 'bg-red-600 text-white',
        };
      default:
        return {
          icon: Info,
          label: 'Unknown',
          description: 'Status unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-200 text-gray-700',
        };
    }
  };

  const config = getIndicatorConfig();
  const IconComponent = config.icon;

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('inline-flex items-center', className)}>
        <IconComponent className={cn('w-4 h-4 mr-1', config.color)} />
        <span className={cn('text-healthcare-xs font-medium', config.color)}>
          {config.label}
        </span>
        {confidence && (
          <span className="text-healthcare-xs text-gray-500 ml-1">
            ({Math.round(confidence)}%)
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div ref={ref} className={cn('inline-flex items-center', className)}>
        <Badge className={cn('text-xs', config.badgeColor)}>
          <IconComponent className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
        {confidence && (
          <span className="text-healthcare-xs text-gray-500 ml-2">
            {Math.round(confidence)}% confidence
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        'p-4 rounded-lg border',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn('flex-shrink-0 p-2 rounded-full', config.bgColor)}>
            <IconComponent className={cn('w-5 h-5', config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={cn('text-healthcare-base font-semibold', config.color)}>
                {config.label}
              </h4>
              {confidence && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(confidence)}% confidence
                </Badge>
              )}
            </div>
            
            <p className="text-healthcare-sm text-gray-600">
              {config.description}
            </p>
            
            {timestamp && (
              <p className="text-healthcare-xs text-gray-500 mt-1">
                {formatTimestamp(timestamp)}
              </p>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            {onView && (
              <Button
                size="sm"
                variant="outline"
                onClick={onView}
                className="text-healthcare-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
            
            {onRevert && type !== 'pending' && type !== 'processing' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRevert}
                className="text-healthcare-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Revert
              </Button>
            )}
            
            {onRetry && type === 'error' && (
              <Button
                size="sm"
                onClick={onRetry}
                className="bg-ss-cta-blue hover:bg-ss-cta-blue/90 text-healthcare-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {showDetails && content && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-healthcare-sm font-medium text-healthcare-primary mb-2">
            Enhanced Content Preview:
          </h5>
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-healthcare-sm text-gray-700 line-clamp-3">
              {content}
            </p>
          </div>
        </div>
      )}

      {type === 'processing' && (
        <div className="mt-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-ss-alert border-t-transparent"></div>
            <span className="text-healthcare-xs text-gray-600">
              AI is analyzing and enhancing your content...
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

EnhancementIndicator.displayName = 'EnhancementIndicator';