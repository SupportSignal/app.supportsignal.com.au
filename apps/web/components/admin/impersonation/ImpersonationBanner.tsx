'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  LogOut, 
  Shield,
  X 
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ImpersonationBannerProps {
  sessionToken?: string;
  className?: string;
}

export function ImpersonationBanner({ sessionToken, className }: ImpersonationBannerProps) {
  const { sessionToken: authSessionToken, clearImpersonation } = useAuth();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenToCheck = sessionToken || authSessionToken || '';

  // Get impersonation status
  const impersonationStatus = useQuery(
    api.impersonation.getImpersonationStatus,
    tokenToCheck ? { session_token: tokenToCheck } : 'skip'
  );

  const endImpersonation = useMutation(api.impersonation.endImpersonation);

  // Update current time every second for live countdown
  useEffect(() => {
    if (!impersonationStatus?.isImpersonating) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [impersonationStatus?.isImpersonating]);

  const handleExitImpersonation = useCallback(async () => {
    if (!tokenToCheck || !impersonationStatus?.isImpersonating) return;

    try {
      setIsExiting(true);
      setError(null);

      const result = await endImpersonation({
        impersonation_token: tokenToCheck,
      });

      if (result.success && result.original_session_token) {
        // CRITICAL: Restore the original session token to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_session_token', result.original_session_token);
        }
        
        // Clear impersonation token from sessionStorage
        clearImpersonation();
        
        // Small delay to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect with a full page reload to ensure clean auth state
        window.location.href = `/admin/impersonation?session_restored=true`;
      } else {
        setError(result.error || 'Failed to end impersonation session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end impersonation session');
    } finally {
      setIsExiting(false);
    }
  }, [tokenToCheck, impersonationStatus?.isImpersonating, endImpersonation, clearImpersonation]);

  const formatTimeRemaining = useCallback((timeRemaining: number) => {
    if (timeRemaining <= 0) {
      return 'Expired';
    }

    const minutes = Math.floor(timeRemaining / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getUrgencyLevel = useCallback((timeRemaining: number) => {
    if (timeRemaining <= 0) {
      return 'expired';
    } else if (timeRemaining < 5 * 60 * 1000) { // Less than 5 minutes
      return 'critical';
    } else if (timeRemaining < 15 * 60 * 1000) { // Less than 15 minutes
      return 'warning';
    } else {
      return 'normal';
    }
  }, []);

  // Don't render if not impersonating
  if (!impersonationStatus?.isImpersonating) {
    return null;
  }

  const timeRemaining = impersonationStatus.timeRemaining || 0;
  const urgencyLevel = getUrgencyLevel(timeRemaining);
  const timeDisplay = formatTimeRemaining(timeRemaining);

  return (
    <div className={cn("w-full", className)}>
      {/* Main Banner */}
      <div className={cn(
        "border-b shadow-md transition-colors duration-200 w-full",
        {
          'bg-red-600 border-red-700': urgencyLevel === 'expired',
          'bg-red-500 border-red-600': urgencyLevel === 'critical',
          'bg-orange-500 border-orange-600': urgencyLevel === 'warning',
          'bg-orange-600 border-orange-700': urgencyLevel === 'normal',
        }
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* Left Side - Impersonation Info */}
            <div className="flex items-center space-x-4 text-white">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="font-semibold text-sm">IMPERSONATION ACTIVE</span>
              </div>
              
              <div className="hidden sm:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Impersonating:</span>
                  <strong>{impersonationStatus.targetUser?.name}</strong>
                  <Badge variant="secondary" className="text-xs ml-1">
                    {impersonationStatus.targetUser?.role}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Time remaining:</span>
                  <strong className={cn(
                    "font-mono",
                    urgencyLevel === 'critical' && "animate-pulse"
                  )}>
                    {timeDisplay}
                  </strong>
                </div>
              </div>
            </div>

            {/* Right Side - Exit Button */}
            <Button
              onClick={handleExitImpersonation}
              disabled={isExiting}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
            >
              {isExiting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Exiting...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit Impersonation
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Info - Show simplified version on small screens */}
      <div className="sm:hidden bg-orange-700 border-b border-orange-800 px-4 py-2">
        <div className="flex items-center justify-between text-white text-sm">
          <div>
            <span className="font-medium">{impersonationStatus.targetUser?.name}</span>
            <Badge variant="secondary" className="text-xs ml-2">
              {impersonationStatus.targetUser?.role}
            </Badge>
          </div>
          <div className="flex items-center space-x-1 font-mono">
            <Clock className="h-3 w-3" />
            <span className={cn(
              urgencyLevel === 'critical' && "animate-pulse"
            )}>
              {timeDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border-b border-red-200 px-4 py-2">
          <Alert variant="destructive" className="border-0 bg-transparent p-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800 text-sm ml-2">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Critical Warning */}
      {urgencyLevel === 'critical' && (
        <div className="bg-red-100 border-b border-red-200 px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive" className="border-0 bg-transparent p-0">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800 text-sm ml-2">
                <strong>Warning:</strong> Impersonation session expiring soon. 
                Session will end automatically in {timeDisplay}.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
}