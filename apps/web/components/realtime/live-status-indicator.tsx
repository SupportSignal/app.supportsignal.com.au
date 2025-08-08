'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { Card, CardContent } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Database,
  CloudOff,
  Pause,
  Play,
  X,
  Eye,
  Edit3,
  MessageSquare,
  Bell,
  Signal
} from 'lucide-react';

export interface LiveStatus {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting' | 'unstable';
  lastUpdate: Date;
  updateFrequency: number; // seconds
  dataSource: string;
  subscriberCount?: number;
  errorCount?: number;
  latency?: number; // milliseconds
  retryCount?: number;
}

export interface LiveEvent {
  id: string;
  type: 'incident_created' | 'incident_updated' | 'user_joined' | 'user_left' | 'analysis_complete' | 'notification';
  timestamp: Date;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userName?: string;
}

export interface LiveStatusIndicatorProps {
  status: LiveStatus;
  recentEvents?: LiveEvent[];
  onReconnect?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onClearEvents?: () => void;
  showEvents?: boolean;
  showMetrics?: boolean;
  showControls?: boolean;
  autoReconnect?: boolean;
  maxEvents?: number;
  variant?: 'full' | 'compact' | 'minimal' | 'indicator';
  className?: string;
}

export const LiveStatusIndicator = React.forwardRef<HTMLDivElement, LiveStatusIndicatorProps>(({
  status,
  recentEvents = [],
  onReconnect,
  onPause,
  onResume,
  onClearEvents,
  showEvents = true,
  showMetrics = true,
  showControls = false,
  autoReconnect = true,
  maxEvents = 10,
  variant = 'full',
  className,
}, ref) => {
  const [isPaused, setIsPaused] = React.useState(false);
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  const getStatusConfig = () => {
    switch (status.connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          label: 'Live',
          color: 'text-ss-success',
          bgColor: 'bg-ss-success/10',
          badgeColor: 'bg-ss-success text-white',
          description: 'Real-time updates active',
          pulseColor: 'bg-ss-success',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          label: 'Offline',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badgeColor: 'bg-red-600 text-white',
          description: 'Connection lost - updates paused',
          pulseColor: 'bg-red-600',
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
          pulseColor: 'bg-ss-alert',
        };
      case 'unstable':
        return {
          icon: Signal,
          label: 'Unstable',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          badgeColor: 'bg-orange-600 text-white',
          description: 'Connection unstable - some updates may be delayed',
          pulseColor: 'bg-orange-600',
        };
      default:
        return {
          icon: WifiOff,
          label: 'Unknown',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          badgeColor: 'bg-gray-500 text-white',
          description: 'Connection status unknown',
          pulseColor: 'bg-gray-500',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - status.lastUpdate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return formatTimestamp(status.lastUpdate);
  };

  const getEventIcon = (eventType: LiveEvent['type']) => {
    switch (eventType) {
      case 'incident_created':
      case 'incident_updated':
        return Edit3;
      case 'user_joined':
      case 'user_left':
        return Users;
      case 'analysis_complete':
        return CheckCircle;
      case 'notification':
        return Bell;
      default:
        return Activity;
    }
  };

  const getEventColor = (priority: LiveEvent['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-ss-cta-blue';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleReconnect = async () => {
    if (onReconnect) {
      setIsReconnecting(true);
      await onReconnect();
      setIsReconnecting(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (onPause) onPause();
  };

  const handleResume = () => {
    setIsPaused(false);
    if (onResume) onResume();
  };

  if (variant === 'indicator') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-2', className)}>
        <div className="relative">
          <StatusIcon className={cn('w-4 h-4', statusConfig.color, statusConfig.animate && 'animate-spin')} />
          {status.connectionStatus === 'connected' && (
            <div className="absolute -top-1 -right-1 w-2 h-2">
              <div className={cn('w-2 h-2 rounded-full animate-pulse', statusConfig.pulseColor)} />
            </div>
          )}
        </div>
        <span className={cn('text-healthcare-xs font-medium', statusConfig.color)}>
          {statusConfig.label}
        </span>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center justify-between p-2', className)}>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <StatusIcon className={cn('w-4 h-4', statusConfig.color, statusConfig.animate && 'animate-spin')} />
            {status.connectionStatus === 'connected' && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2">
                <div className={cn('w-2 h-2 rounded-full animate-pulse', statusConfig.pulseColor)} />
              </div>
            )}
          </div>
          <Badge className={cn('text-xs', statusConfig.badgeColor)}>
            {statusConfig.label}
          </Badge>
        </div>
        <span className="text-healthcare-xs text-gray-600">
          {getTimeSinceUpdate()}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card ref={ref} className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('p-2 rounded-lg relative', statusConfig.bgColor)}>
                <StatusIcon className={cn('w-5 h-5', statusConfig.color, statusConfig.animate && 'animate-spin')} />
                {status.connectionStatus === 'connected' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3">
                    <div className={cn('w-3 h-3 rounded-full animate-pulse', statusConfig.pulseColor)} />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                    Live Status
                  </h4>
                  <Badge className={cn('text-xs', statusConfig.badgeColor)}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-healthcare-xs text-gray-600 mt-1">
                  {statusConfig.description}
                </p>
              </div>
            </div>
            
            {showMetrics && (
              <div className="text-right text-healthcare-xs text-gray-600">
                <div>Last: {getTimeSinceUpdate()}</div>
                {status.subscriberCount !== undefined && (
                  <div>{status.subscriberCount} subscribers</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardContent className="p-6 space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-3 rounded-lg relative', statusConfig.bgColor)}>
              <StatusIcon className={cn('w-6 h-6', statusConfig.color, statusConfig.animate && 'animate-spin')} />
              {status.connectionStatus === 'connected' && (
                <div className="absolute -top-1 -right-1 w-4 h-4">
                  <div className={cn('w-4 h-4 rounded-full animate-pulse', statusConfig.pulseColor)} />
                </div>
              )}
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-healthcare-lg text-healthcare-primary">
                  Real-time Status
                </h3>
                <Badge className={cn('text-sm', statusConfig.badgeColor)}>
                  {statusConfig.label}
                </Badge>
                {isPaused && (
                  <Badge className="bg-gray-100 text-gray-700 text-xs">
                    <Pause className="w-3 h-3 mr-1" />
                    Paused
                  </Badge>
                )}
              </div>
              <p className="text-healthcare-sm text-gray-600 mt-1">
                {statusConfig.description}
              </p>
            </div>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              {status.connectionStatus === 'disconnected' && (
                <button
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="p-2 text-ss-teal hover:bg-ss-teal/10 rounded-md transition-colors"
                >
                  <RefreshCw className={cn('w-4 h-4', isReconnecting && 'animate-spin')} />
                </button>
              )}
              
              {status.connectionStatus === 'connected' && (
                <button
                  onClick={isPaused ? handleResume : handlePause}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
              )}
              
              {recentEvents.length > 0 && onClearEvents && (
                <button
                  onClick={onClearEvents}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Metrics */}
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-ss-teal/5 rounded-lg">
              <div className="text-healthcare-lg font-semibold text-ss-teal">
                {getTimeSinceUpdate()}
              </div>
              <div className="text-healthcare-xs text-gray-600">Last Update</div>
            </div>
            
            <div className="text-center p-3 bg-ss-cta-blue/5 rounded-lg">
              <div className="text-healthcare-lg font-semibold text-ss-cta-blue">
                {status.updateFrequency}s
              </div>
              <div className="text-healthcare-xs text-gray-600">Frequency</div>
            </div>
            
            {status.subscriberCount !== undefined && (
              <div className="text-center p-3 bg-ss-success/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-success">
                  {status.subscriberCount}
                </div>
                <div className="text-healthcare-xs text-gray-600">Subscribers</div>
              </div>
            )}
            
            {status.latency !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-gray-700">
                  {status.latency}ms
                </div>
                <div className="text-healthcare-xs text-gray-600">Latency</div>
              </div>
            )}
          </div>
        )}

        {/* Connection Info */}
        <div className="flex items-center justify-between text-healthcare-sm">
          <div>
            <span className="text-gray-600">Source:</span>
            <span className="text-healthcare-primary ml-2">{status.dataSource}</span>
          </div>
          {status.errorCount !== undefined && status.errorCount > 0 && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{status.errorCount} errors</span>
            </div>
          )}
        </div>

        {/* Recent Events */}
        {showEvents && recentEvents.length > 0 && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Recent Activity
            </h4>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentEvents.slice(0, maxEvents).map((event) => {
                const EventIcon = getEventIcon(event.type);
                const eventColor = getEventColor(event.priority);
                
                return (
                  <div
                    key={event.id}
                    className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <EventIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', eventColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-healthcare-sm text-healthcare-primary">
                        {event.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-healthcare-xs text-gray-600">
                          {formatTimestamp(event.timestamp)}
                        </span>
                        {event.userName && (
                          <span className="text-healthcare-xs text-gray-600">
                            by {event.userName}
                          </span>
                        )}
                        <Badge className={cn('text-xs px-1 py-0', 
                          event.priority === 'critical' ? 'bg-red-100 text-red-700' :
                          event.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          event.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {event.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

LiveStatusIndicator.displayName = 'LiveStatusIndicator';