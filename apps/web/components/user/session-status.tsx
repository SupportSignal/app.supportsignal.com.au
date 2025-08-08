'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Button } from '@starter/ui';
import { Badge } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Wifi,
  WifiOff,
  Save,
  Trash2,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Database,
  CloudOff,
  Zap
} from 'lucide-react';

export interface WorkflowState {
  incidentId?: string;
  currentStep: string;
  stepData: Record<string, any>;
  lastSaved: Date;
  autoSaveEnabled: boolean;
  unsavedChanges: boolean;
}

export interface SessionInfo {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  isActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  workflowState?: WorkflowState;
  deviceInfo: {
    browser: string;
    os: string;
    ip: string;
  };
  permissions: string[];
  expiresAt: Date;
  warningThreshold: number; // minutes before expiry to show warning
}

export interface SessionStatusProps {
  session: SessionInfo;
  onReconnect?: () => void;
  onSaveSession?: () => void;
  onRestoreWorkflow?: (workflowState: WorkflowState) => void;
  onClearWorkflow?: () => void;
  onExtendSession?: () => void;
  onLogout?: () => void;
  showDeviceInfo?: boolean;
  showWorkflowState?: boolean;
  showPermissions?: boolean;
  autoReconnect?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

export const SessionStatus = React.forwardRef<HTMLDivElement, SessionStatusProps>(({
  session,
  onReconnect,
  onSaveSession,
  onRestoreWorkflow,
  onClearWorkflow,
  onExtendSession,
  onLogout,
  showDeviceInfo = false,
  showWorkflowState = true,
  showPermissions = false,
  autoReconnect = true,
  variant = 'full',
  className,
}, ref) => {
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  const getConnectionConfig = () => {
    switch (session.connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Connected',
          color: 'text-ss-success',
          bgColor: 'bg-ss-success/10',
          badgeColor: 'bg-ss-success text-white',
          description: 'Session is active and synchronized',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          label: 'Disconnected',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badgeColor: 'bg-red-600 text-white',
          description: 'Connection lost - data may not be saved',
        };
      case 'reconnecting':
        return {
          icon: RefreshCw,
          label: 'Reconnecting',
          color: 'text-ss-alert',
          bgColor: 'bg-ss-alert/10',
          badgeColor: 'bg-ss-alert text-black',
          description: 'Attempting to restore connection...',
          animate: true,
        };
      case 'error':
        return {
          icon: AlertTriangle,
          label: 'Connection Error',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badgeColor: 'bg-red-600 text-white',
          description: 'Authentication or network error occurred',
        };
      default:
        return {
          icon: WifiOff,
          label: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          badgeColor: 'bg-gray-500 text-white',
          description: 'Connection status unknown',
        };
    }
  };

  const connectionConfig = getConnectionConfig();
  const ConnectionIcon = connectionConfig.icon;

  const formatDuration = (start: Date, end: Date = new Date()) => {
    const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m`;
    return `${Math.floor(diffInMinutes / 1440)}d ${Math.floor((diffInMinutes % 1440) / 60)}h`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTimeUntilExpiry = () => {
    const now = new Date();
    const diffInMinutes = Math.floor((session.expiresAt.getTime() - now.getTime()) / (1000 * 60));
    return Math.max(0, diffInMinutes);
  };

  const minutesUntilExpiry = getTimeUntilExpiry();
  const isExpiringSoon = minutesUntilExpiry <= session.warningThreshold;
  const hasExpired = minutesUntilExpiry <= 0;

  const handleReconnect = async () => {
    if (onReconnect) {
      setIsReconnecting(true);
      await onReconnect();
      setIsReconnecting(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-2', className)}>
        <ConnectionIcon 
          className={cn('w-4 h-4', connectionConfig.color, connectionConfig.animate && 'animate-spin')} 
        />
        <span className={cn('text-healthcare-sm font-medium', connectionConfig.color)}>
          {connectionConfig.label}
        </span>
        {session.workflowState?.unsavedChanges && (
          <Badge className="bg-ss-alert/10 text-ss-alert text-xs">
            Unsaved
          </Badge>
        )}
        {isExpiringSoon && !hasExpired && (
          <Badge className="bg-red-100 text-red-700 text-xs">
            {minutesUntilExpiry}m left
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card ref={ref} className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('p-2 rounded-lg', connectionConfig.bgColor)}>
                <ConnectionIcon 
                  className={cn('w-5 h-5', connectionConfig.color, connectionConfig.animate && 'animate-spin')} 
                />
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                    Session Active
                  </h4>
                  <Badge className={cn('text-xs', connectionConfig.badgeColor)}>
                    {connectionConfig.label}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-healthcare-xs text-gray-600 mt-1">
                  <span>Duration: {formatDuration(session.startTime)}</span>
                  {!hasExpired && (
                    <span className={cn(isExpiringSoon && 'text-red-600 font-medium')}>
                      Expires in {minutesUntilExpiry}m
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {session.connectionStatus === 'disconnected' && onReconnect && (
                <Button
                  size="sm"
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="bg-ss-teal hover:bg-ss-teal-deep"
                >
                  <RefreshCw className={cn('w-3 h-3 mr-1', isReconnecting && 'animate-spin')} />
                  Reconnect
                </Button>
              )}
              
              {isExpiringSoon && onExtendSession && (
                <Button
                  size="sm"
                  onClick={onExtendSession}
                  className="bg-ss-cta-blue hover:bg-ss-cta-blue/90"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Extend
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-ss-teal" />
            <span>Session Status</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={cn('text-sm', connectionConfig.badgeColor)}>
              <ConnectionIcon className={cn('w-4 h-4 mr-1', connectionConfig.animate && 'animate-spin')} />
              {connectionConfig.label}
            </Badge>
            
            {hasExpired ? (
              <Badge className="bg-red-600 text-white">Expired</Badge>
            ) : isExpiringSoon ? (
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {minutesUntilExpiry}m left
              </Badge>
            ) : (
              <Badge className="bg-ss-success/10 text-ss-success">Active</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className={cn('p-4 rounded-lg border', connectionConfig.bgColor)}>
          <div className="flex items-start space-x-3">
            <ConnectionIcon 
              className={cn('w-5 h-5 mt-0.5', connectionConfig.color, connectionConfig.animate && 'animate-spin')} 
            />
            <div className="flex-1">
              <h4 className={cn('font-semibold text-healthcare-base', connectionConfig.color)}>
                {connectionConfig.label}
              </h4>
              <p className="text-healthcare-sm text-gray-600 mt-1">
                {connectionConfig.description}
              </p>
              
              {session.connectionStatus === 'disconnected' && onReconnect && (
                <div className="mt-3">
                  <Button
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className="bg-ss-teal hover:bg-ss-teal-deep"
                  >
                    <RefreshCw className={cn('w-4 h-4 mr-1', isReconnecting && 'animate-spin')} />
                    {isReconnecting ? 'Reconnecting...' : 'Reconnect Now'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Session Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Session Details
            </h4>
            <div className="space-y-2 text-healthcare-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Session ID:</span>
                <span className="text-gray-700 font-mono text-xs">{session.id.substring(0, 8)}...</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Started:</span>
                <span className="text-gray-700">{formatTimestamp(session.startTime)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="text-gray-700">{formatDuration(session.startTime)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Activity:</span>
                <span className="text-gray-700">{formatTimestamp(session.lastActivity)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Session Expiry
            </h4>
            <div className="space-y-2 text-healthcare-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Expires At:</span>
                <span className="text-gray-700">{formatTimestamp(session.expiresAt)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time Left:</span>
                <span className={cn('font-medium', hasExpired ? 'text-red-600' : isExpiringSoon ? 'text-ss-alert' : 'text-ss-success')}>
                  {hasExpired ? 'Expired' : `${minutesUntilExpiry} minutes`}
                </span>
              </div>
              
              {!hasExpired && onExtendSession && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    onClick={onExtendSession}
                    className="bg-ss-cta-blue hover:bg-ss-cta-blue/90 w-full"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    Extend Session
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workflow State Recovery */}
        {showWorkflowState && session.workflowState && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Workflow Recovery
            </h4>
            
            <Card className="border-l-4 border-l-ss-teal bg-ss-teal/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Save className="w-4 h-4 text-ss-teal" />
                      <span className="font-medium text-healthcare-base text-healthcare-primary">
                        Unsaved Workflow Detected
                      </span>
                      {session.workflowState.unsavedChanges && (
                        <Badge className="bg-ss-alert/10 text-ss-alert text-xs">
                          Unsaved Changes
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-healthcare-sm text-gray-600">
                      <p>Current Step: <span className="text-healthcare-primary font-medium">{session.workflowState.currentStep}</span></p>
                      {session.workflowState.incidentId && (
                        <p>Incident: <span className="text-healthcare-primary font-medium">{session.workflowState.incidentId}</span></p>
                      )}
                      <p>Last Saved: <span className="text-healthcare-primary">{formatTimestamp(session.workflowState.lastSaved)}</span></p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {onRestoreWorkflow && (
                      <Button
                        size="sm"
                        onClick={() => onRestoreWorkflow(session.workflowState!)}
                        className="bg-ss-teal hover:bg-ss-teal-deep"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    )}
                    
                    {onClearWorkflow && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onClearWorkflow}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Device Information */}
        {showDeviceInfo && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Device Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-healthcare-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Browser:</span>
                <span className="text-gray-700">{session.deviceInfo.browser}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">OS:</span>
                <span className="text-gray-700">{session.deviceInfo.os}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">IP:</span>
                <span className="text-gray-700 font-mono text-xs">{session.deviceInfo.ip}</span>
              </div>
            </div>
          </div>
        )}

        {/* Permissions */}
        {showPermissions && session.permissions.length > 0 && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Session Permissions
            </h4>
            <div className="flex flex-wrap gap-2">
              {session.permissions.map((permission, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {onSaveSession && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSaveSession}
              >
                <Database className="w-3 h-3 mr-1" />
                Save Session
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {hasExpired && onLogout && (
              <Button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                Session Expired - Login Again
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SessionStatus.displayName = 'SessionStatus';