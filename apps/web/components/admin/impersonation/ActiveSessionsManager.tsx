'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { 
  Activity, 
  Clock, 
  User, 
  AlertTriangle, 
  Shield, 
  Trash2,
  RefreshCw,
  LogIn
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ActiveSession {
  sessionId: string;
  adminUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reason: string;
  created_at: number;
  expires: number;
  timeRemaining: number;
  correlation_id: string;
}

interface ActiveSessionsManagerProps {
  activeSessions: ActiveSession[];
  sessionToken: string;
}

export function ActiveSessionsManager({ activeSessions, sessionToken }: ActiveSessionsManagerProps) {
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);
  const [terminatingAll, setTerminatingAll] = useState(false);
  const [resumingSessionId, setResumingSessionId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const emergencyTerminateAll = useMutation(api.impersonation.emergencyTerminateAllSessions);
  
  // Get current user to determine session ownership
  const currentUser = useQuery(
    api.users.getCurrentUser,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check if current user owns this session
  const isOwnSession = useCallback((session: ActiveSession) => {
    if (!currentUser) return false;
    return session.adminUser?.id === currentUser._id;
  }, [currentUser]);

  const handleEmergencyTerminateAll = useCallback(async () => {
    try {
      setTerminatingAll(true);
      await emergencyTerminateAll({
        admin_session_token: sessionToken,
      });
      // Note: The UI will update automatically via Convex reactivity
    } catch (error) {
      console.error('Failed to terminate all sessions:', error);
    } finally {
      setTerminatingAll(false);
    }
  }, [emergencyTerminateAll, sessionToken]);

  // Resume an impersonation session
  const handleResumeSession = useCallback(async (sessionId: string) => {
    const session = activeSessions.find(s => s.sessionId === sessionId);
    
    if (!session) {
      console.error('❌ IMPERSONATION: Session not found:', sessionId);
      return;
    }
    
    // Check if session is expired
    if (session.expires <= Date.now()) {
      console.error('❌ IMPERSONATION: Cannot resume expired session:', sessionId);
      alert('This session has expired and cannot be resumed.');
      return;
    }
    
    // Check ownership
    if (!isOwnSession(session)) {
      console.error('❌ IMPERSONATION: Cannot resume session owned by another admin:', sessionId);
      alert('You can only resume sessions that you created.');
      return;
    }
    
    try {
      setResumingSessionId(sessionId);
      const impersonationUrl = `/?impersonate_token=${sessionId}`;
      console.log('🔄 IMPERSONATION: Resuming session via URL:', impersonationUrl);
      window.location.href = impersonationUrl;
    } catch (error) {
      console.error('❌ IMPERSONATION: Error resuming session:', error);
      alert('Failed to resume session. Please try again.');
      setResumingSessionId(null);
    }
  }, [activeSessions, isOwnSession]);

  const formatTimeRemaining = (expires: number) => {
    const remaining = expires - currentTime;
    if (remaining <= 0) {
      return 'Expired';
    }

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSessionStatus = (expires: number) => {
    const remaining = expires - currentTime;
    
    if (remaining <= 0) {
      return { status: 'expired', variant: 'destructive' as const };
    } else if (remaining < 5 * 60 * 1000) { // Less than 5 minutes
      return { status: 'expiring', variant: 'destructive' as const };
    } else if (remaining < 15 * 60 * 1000) { // Less than 15 minutes
      return { status: 'warning', variant: 'secondary' as const };
    } else {
      return { status: 'active', variant: 'default' as const };
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Impersonation Sessions
            {activeSessions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeSessions.length}
              </Badge>
            )}
          </CardTitle>
          {activeSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmergencyTerminateAll}
              disabled={terminatingAll}
              className="flex items-center gap-2"
            >
              {terminatingAll ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {terminatingAll ? 'Terminating...' : 'Terminate All'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeSessions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active impersonation sessions</p>
            <p className="text-sm mt-1">
              Sessions will appear here when started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Emergency Warning */}
            {activeSessions.length > 1 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm">
                  Multiple active sessions detected. Consider terminating unused sessions 
                  for security.
                </AlertDescription>
              </Alert>
            )}

            {/* Session List */}
            {activeSessions.map((session) => {
              const { status, variant } = getSessionStatus(session.expires);
              
              return (
                <div
                  key={session.sessionId}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Session Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {session.targetUser?.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {session.targetUser?.role}
                      </Badge>
                    </div>
                    <Badge variant={variant} className="text-xs">
                      {formatTimeRemaining(session.expires)}
                    </Badge>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-0 w-20">Email:</span>
                      <span className="font-mono text-xs break-all">
                        {session.targetUser?.email}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-0 w-20">Admin:</span>
                      <span className="text-xs">
                        {session.adminUser?.name} ({session.adminUser?.email})
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-0 w-20">Reason:</span>
                      <span className="text-xs">{session.reason}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-0 w-20">Started:</span>
                      <span className="text-xs">
                        {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')} 
                        ({formatDistanceToNow(new Date(session.created_at), { addSuffix: true })})
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground min-w-0 w-20">Trace ID:</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {session.correlation_id}
                      </span>
                    </div>
                  </div>

                  {/* Resume Session Button - only for own sessions that aren't expired */}
                  {isOwnSession(session) && status !== 'expired' && (
                    <div className="pt-2 border-t">
                      <Button
                        onClick={() => handleResumeSession(session.sessionId)}
                        disabled={resumingSessionId === session.sessionId}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50 disabled:opacity-50"
                      >
                        {resumingSessionId === session.sessionId ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Resuming...
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4" />
                            Resume Session
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Session Status Indicator */}
                  {status === 'expired' && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        This session has expired and will be cleaned up automatically
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {status === 'expiring' && (
                    <Alert variant="destructive" className="py-2">
                      <Clock className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        This session is expiring soon
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}

            {/* Footer Info */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Auto-cleanup runs every 5 minutes
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  All sessions are logged and audited
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}