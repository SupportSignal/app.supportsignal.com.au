// @ts-nocheck
'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { Button } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

export interface ConfidenceIndicatorProps {
  confidence: number; // 0-100
  threshold?: {
    high: number; // e.g., 85
    medium: number; // e.g., 70
  };
  label?: string;
  showPercentage?: boolean;
  showDetails?: boolean;
  showActions?: boolean;
  onViewDetails?: () => void;
  onRecalculate?: () => void;
  onLearnMore?: () => void;
  isRecalculating?: boolean;
  variant?: 'default' | 'compact' | 'minimal' | 'circular';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConfidenceIndicator = React.forwardRef<HTMLDivElement, ConfidenceIndicatorProps>(({
  confidence,
  threshold = { high: 85, medium: 70 },
  label,
  showPercentage = true,
  showDetails = false,
  showActions = false,
  onViewDetails,
  onRecalculate,
  onLearnMore,
  isRecalculating = false,
  variant = 'default',
  size = 'md',
  className,
}, ref) => {
  const getConfidenceLevel = () => {
    if (confidence >= threshold.high) return 'high';
    if (confidence >= threshold.medium) return 'medium';
    return 'low';
  };

  const getConfidenceConfig = () => {
    const level = getConfidenceLevel();
    
    switch (level) {
      case 'high':
        return {
          level: 'high',
          label: 'High Confidence',
          description: 'Analysis is highly reliable',
          icon: CheckCircle,
          color: 'text-ss-success',
          bgColor: 'bg-ss-success/10',
          borderColor: 'border-ss-success/20',
          badgeColor: 'bg-ss-success text-white',
          progressColor: 'bg-ss-success',
        };
      case 'medium':
        return {
          level: 'medium',
          label: 'Medium Confidence',
          description: 'Analysis is moderately reliable',
          icon: Activity,
          color: 'text-ss-alert',
          bgColor: 'bg-ss-alert/10',
          borderColor: 'border-ss-alert/20',
          badgeColor: 'bg-ss-alert text-black',
          progressColor: 'bg-ss-alert',
        };
      case 'low':
        return {
          level: 'low',
          label: 'Low Confidence',
          description: 'Analysis may need review',
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeColor: 'bg-red-600 text-white',
          progressColor: 'bg-red-500',
        };
      default:
        return {
          level: 'unknown',
          label: 'Unknown',
          description: 'Confidence level unknown',
          icon: HelpCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeColor: 'bg-gray-500 text-white',
          progressColor: 'bg-gray-400',
        };
    }
  };

  const config = getConfidenceConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: {
      icon: 'w-3 h-3',
      text: 'text-healthcare-xs',
      circle: 'w-12 h-12',
      progress: 'h-1',
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-healthcare-sm',
      circle: 'w-16 h-16',
      progress: 'h-2',
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-healthcare-base',
      circle: 'w-20 h-20',
      progress: 'h-3',
    },
  };

  const currentSize = sizeClasses[size];

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('inline-flex items-center space-x-1', className)}>
        <IconComponent className={cn(currentSize.icon, config.color)} />
        {showPercentage && (
          <span className={cn('font-medium', currentSize.text, config.color)}>
            {confidence}%
          </span>
        )}
        {label && (
          <span className={cn(currentSize.text, 'text-gray-600')}>
            {label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div ref={ref} className={cn('inline-flex items-center space-x-2', className)}>
        <Badge className={cn('text-xs', config.badgeColor)}>
          <IconComponent className="w-3 h-3 mr-1" />
          {showPercentage ? `${confidence}%` : config.label}
        </Badge>
        {label && (
          <span className={cn(currentSize.text, 'text-gray-600')}>
            {label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'circular') {
    const radius = size === 'sm' ? 20 : size === 'lg' ? 36 : 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (confidence / 100) * circumference;

    return (
      <div ref={ref} className={cn('flex flex-col items-center', className)}>
        <div className="relative">
          <svg className={currentSize.circle} viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn('transition-all duration-500', config.color)}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <IconComponent className={cn(currentSize.icon, config.color)} />
            {showPercentage && (
              <span className={cn('font-bold', currentSize.text, config.color)}>
                {confidence}%
              </span>
            )}
          </div>
        </div>
        
        {(label || showDetails) && (
          <div className="text-center mt-2">
            {label && (
              <div className={cn('font-medium', currentSize.text, 'text-healthcare-primary')}>
                {label}
              </div>
            )}
            {showDetails && (
              <div className="text-healthcare-xs text-gray-600 mt-1">
                {config.label}
              </div>
            )}
          </div>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn('p-2 rounded-full', config.bgColor)}>
            <IconComponent className={cn(currentSize.icon, config.color)} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className={cn('font-semibold', currentSize.text, config.color)}>
                {config.label}
              </h4>
              {showPercentage && (
                <Badge className={cn('text-xs', config.badgeColor)}>
                  {confidence}%
                </Badge>
              )}
            </div>
            
            {label && (
              <p className={cn(currentSize.text, 'text-healthcare-primary mt-1')}>
                {label}
              </p>
            )}
            
            {showDetails && (
              <p className="text-healthcare-xs text-gray-600 mt-1">
                {config.description}
              </p>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewDetails}
                className="text-healthcare-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Details
              </Button>
            )}
            
            {onRecalculate && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRecalculate}
                disabled={isRecalculating}
                className="text-healthcare-xs"
              >
                <RefreshCw className={cn('w-3 h-3 mr-1', isRecalculating && 'animate-spin')} />
                {isRecalculating ? 'Calculating...' : 'Recalculate'}
              </Button>
            )}
            
            {onLearnMore && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onLearnMore}
                className="text-healthcare-xs"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                Learn More
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {variant === 'default' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-healthcare-xs text-gray-600 mb-1">
            <span>Confidence Level</span>
            <span>{confidence}%</span>
          </div>
          <div className={cn('w-full bg-gray-200 rounded-full', currentSize.progress)}>
            <div 
              className={cn(
                'h-full rounded-full transition-all duration-500',
                config.progressColor
              )}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      )}

      {isRecalculating && (
        <div className="mt-3 flex items-center space-x-2 text-healthcare-xs text-gray-600">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Recalculating confidence score...</span>
        </div>
      )}

      {/* Confidence Breakdown */}
      {showDetails && config.level === 'low' && (
        <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-100">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-healthcare-xs font-medium text-red-700 mb-1">
                Low Confidence Detected
              </h5>
              <p className="text-healthcare-xs text-red-600">
                This analysis may benefit from manual review or additional data collection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Tips */}
      {showDetails && (
        <div className="mt-3 text-healthcare-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>
              Confidence scores above {threshold.high}% are considered highly reliable.
              Scores below {threshold.medium}% may require review.
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

ConfidenceIndicator.displayName = 'ConfidenceIndicator';