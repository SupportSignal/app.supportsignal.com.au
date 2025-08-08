'use client';

import React from 'react';
import { Button } from '@starter/ui';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant for different action types
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Icon to display (Lucide React icon)
   */
  icon?: LucideIcon;
  
  /**
   * Icon position
   */
  iconPosition?: 'left' | 'right' | 'only';
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * User role for permission checking
   */
  userRole?: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  
  /**
   * Required permission to show this button
   */
  requiredPermission?: string[];
  
  /**
   * Whether the button should be visible (permission check result)
   */
  visible?: boolean;
  
  /**
   * Healthcare action type for styling
   */
  actionType?: 'create' | 'edit' | 'delete' | 'approve' | 'review' | 'generate';
  
  children?: React.ReactNode;
}

const permissionHierarchy = {
  system_admin: 4,
  company_admin: 3,
  team_lead: 2,
  frontline_worker: 1,
};

const actionPermissions = {
  create: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
  edit: ['system_admin', 'company_admin', 'team_lead', 'frontline_worker'],
  delete: ['system_admin', 'company_admin'],
  approve: ['system_admin', 'company_admin', 'team_lead'],
  review: ['system_admin', 'company_admin', 'team_lead'],
  generate: ['system_admin', 'company_admin', 'team_lead'],
};

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(({
  className,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  userRole,
  requiredPermission,
  visible = true,
  actionType,
  children,
  disabled,
  ...props
}, ref) => {
  // Permission checking
  const hasPermission = React.useMemo(() => {
    if (!userRole) return true; // No role check required
    
    if (requiredPermission) {
      return requiredPermission.includes(userRole);
    }
    
    if (actionType) {
      return actionPermissions[actionType]?.includes(userRole) ?? true;
    }
    
    return true;
  }, [userRole, requiredPermission, actionType]);
  
  // Don't render if not visible or no permission
  if (!visible || !hasPermission) {
    return null;
  }
  
  // Healthcare action styling
  const getActionStyles = () => {
    switch (actionType) {
      case 'create':
        return 'bg-ss-cta-blue hover:bg-ss-cta-blue/90 text-white';
      case 'edit':
        return 'bg-ss-teal hover:bg-ss-teal-deep text-white';
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'approve':
        return 'bg-ss-success hover:bg-ss-success/90 text-white';
      case 'review':
        return 'bg-ss-navy hover:bg-ss-navy/90 text-white';
      case 'generate':
        return 'bg-ss-teal hover:bg-ss-teal-deep text-white';
      default:
        return '';
    }
  };
  
  const sizeClasses = {
    sm: 'h-8 px-3 text-healthcare-xs',
    md: 'h-9 px-4 text-healthcare-sm',
    lg: 'h-10 px-6 text-healthcare-base',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  const showText = iconPosition !== 'only' && children;
  const showIcon = Icon && !loading;
  
  const buttonContent = (
    <>
      {loading && (
        <div className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          iconSizes[size],
          showText && (iconPosition === 'left' ? 'mr-2' : 'ml-2')
        )} />
      )}
      
      {showIcon && iconPosition === 'left' && (
        <Icon className={cn(iconSizes[size], showText && 'mr-2')} />
      )}
      
      {showText && children}
      
      {showIcon && iconPosition === 'right' && (
        <Icon className={cn(iconSizes[size], showText && 'ml-2')} />
      )}
      
      {showIcon && iconPosition === 'only' && (
        <Icon className={iconSizes[size]} />
      )}
    </>
  );
  
  return (
    <Button
      ref={ref}
      variant={variant === 'primary' ? 'default' : variant}
      disabled={disabled || loading}
      className={cn(
        sizeClasses[size],
        'transition-all duration-200 font-medium',
        actionType && getActionStyles(),
        loading && 'cursor-not-allowed opacity-75',
        className
      )}
      {...props}
    >
      {buttonContent}
    </Button>
  );
});

ActionButton.displayName = 'ActionButton';