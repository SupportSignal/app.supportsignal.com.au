/**
 * MobileWizardShell - Mobile-optimized wrapper for workflow wizards
 * Story 3.5: Mobile-First Responsive Incident Capture
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/mobile/useViewport';
import { SwipeHandler } from './SwipeHandler';

export interface MobileWizardShellProps {
  title: string;
  description?: string;
  currentStep: number;
  totalSteps: number;
  remainingTime?: number;
  showEstimates?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: React.ReactNode;
  className?: string;
  readonly?: boolean;
}

export function MobileWizardShell({
  title,
  description,
  currentStep,
  totalSteps,
  remainingTime,
  showEstimates = true,
  onSwipeLeft,
  onSwipeRight,
  children,
  className,
  readonly = false
}: MobileWizardShellProps) {
  const viewport = useViewport();

  return (
    <SwipeHandler
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      disabled={readonly || !viewport.isTouchDevice}
      className="w-full"
    >
      <Card className={cn('', className)}>
        <CardHeader className={cn(
          // Mobile: Compressed header with better touch targets
          viewport.isMobile ? "p-3 pb-2" : "p-6"
        )}>
          <CardTitle className={cn(
            "flex items-center",
            viewport.isMobile ? "flex-col space-y-2" : "justify-between"
          )}>
            <div className={cn(viewport.isMobile ? "text-center" : "")}>
              <h2 className={cn(
                "font-semibold text-healthcare-primary",
                viewport.isMobile ? "text-lg" : "text-healthcare-lg"
              )}>
                {title}
              </h2>
              {description && (
                <p className={cn(
                  "text-gray-600 mt-1",
                  viewport.isMobile ? "text-xs" : "text-healthcare-sm"
                )}>{description}</p>
              )}
            </div>
            
            <div className={cn(
              "flex items-center",
              viewport.isMobile ? "space-x-1 text-xs" : "space-x-2"
            )}>
              {showEstimates && remainingTime && !viewport.isMobile && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {remainingTime}m remaining
                </Badge>
              )}
              
              <Badge className={cn(
                "bg-ss-teal text-white",
                viewport.isMobile ? "text-xs px-2 py-1" : ""
              )}>
                {viewport.isMobile ? `${currentStep}/${totalSteps}` : `Step ${currentStep} of ${totalSteps}`}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className={cn(
          // Mobile: Reduced padding and optimized spacing
          viewport.isMobile ? "p-3 pt-0 space-y-4" : "p-6 pt-0 space-y-6"
        )}>
          {/* Mobile hint for swipe gestures */}
          {viewport.isMobile && !readonly && (
            <div className="text-xs text-gray-500 text-center py-1">
              ← Swipe to navigate steps →
            </div>
          )}
          
          {children}
        </CardContent>
      </Card>
    </SwipeHandler>
  );
}