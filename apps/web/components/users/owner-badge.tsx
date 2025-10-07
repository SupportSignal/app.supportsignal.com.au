'use client';

import React from 'react';
import { Badge } from '@starter/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@starter/ui/tooltip';
import { Crown, Shield, Lock } from 'lucide-react';

interface OwnerBadgeProps {
  isOwner?: boolean;
  protectionReason?: string;
  size?: 'sm' | 'default' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

/**
 * Owner protection badge component
 * Story 2.6 AC 2.6.3: Owner Account Protection
 */
export function OwnerBadge({
  isOwner = false,
  protectionReason,
  size = 'default',
  showTooltip = true,
  className = ''
}: OwnerBadgeProps) {
  if (!isOwner) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    default: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const badge = (
    <Badge 
      className={`
        bg-gradient-to-r from-yellow-100 to-orange-100 
        text-yellow-800 border-yellow-300 
        dark:from-yellow-900 dark:to-orange-900 
        dark:text-yellow-200 dark:border-yellow-700
        font-medium shadow-sm
        ${sizeClasses[size]} 
        ${className}
      `}
    >
      <Crown className={`${iconSize[size]} mr-1 flex-shrink-0`} />
      <span>Owner</span>
      <Lock className={`${iconSize[size]} ml-1 flex-shrink-0 opacity-70`} />
    </Badge>
  );

  if (!showTooltip || !protectionReason) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <div className="font-semibold flex items-center gap-1 mb-1">
              <Shield className="h-3 w-3" />
              Protected Account
            </div>
            <p className="text-sm">{protectionReason}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Owner protection status indicator for form fields
 */
export function OwnerProtectionIndicator({
  isProtected = false,
  reason,
  className = ''
}: {
  isProtected?: boolean;
  reason?: string;
  className?: string;
}) {
  if (!isProtected) return null;

  return (
    <div className={`flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 ${className}`}>
      <Lock className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium">Protected:</span>
      <span>{reason || 'This account is protected from modifications'}</span>
    </div>
  );
}

/**
 * Owner protection warning for dangerous actions
 */
export function OwnerProtectionWarning({
  action,
  className = ''
}: {
  action?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 ${className}`}>
      <Shield className="h-4 w-4 flex-shrink-0" />
      <div>
        <div className="font-medium">Action Blocked</div>
        <div>
          Owner account cannot be {action || 'modified'}. This restriction ensures system integrity and prevents accidental loss of administrative access.
        </div>
      </div>
    </div>
  );
}