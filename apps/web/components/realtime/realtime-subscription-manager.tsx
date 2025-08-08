'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { Button } from '@starter/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  Zap, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Pause, 
  Play,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Users,
  FileText,
  BarChart3,
  Bell,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Monitor,
  Smartphone,
  Globe,
  Signal,
  Cloud,
  Server,
  X
} from 'lucide-react';

export interface Subscription {
  id: string;
  name: string;
  resourceType: 'incident' | 'analysis' | 'user' | 'workflow' | 'notification' | 'system';
  resourceId?: string;
  resourcePattern?: string; // For pattern-based subscriptions
  eventTypes: string[];
  status: 'active' | 'paused' | 'error' | 'reconnecting';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  lastEvent?: Date;
  eventCount: number;
  retryCount?: number;
  metadata?: Record<string, any>;
}

export interface ConnectionMetrics {
  status: 'connected' | 'disconnected' | 'unstable' | 'reconnecting';
  latency: number; // milliseconds
  uptime: number; // percentage
  totalEvents: number;
  eventsPerSecond: number;
  errorRate: number; // percentage
  reconnectCount: number;
  lastReconnect?: Date;
  bandwidth: {
    incoming: number; // bytes/sec
    outgoing: number; // bytes/sec
  };
}

export interface RealTimeConfig {
  autoReconnect: boolean;
  reconnectDelay: number; // milliseconds
  maxReconnectAttempts: number;
  heartbeatInterval: number; // milliseconds
  eventBufferSize: number;
  compressionEnabled: boolean;
  batchUpdates: boolean;
  batchDelay: number; // milliseconds
}

export interface RealTimeSubscriptionManagerProps {
  subscriptions: Subscription[];
  metrics: ConnectionMetrics;
  config: RealTimeConfig;
  onSubscriptionAdd?: (subscription: Omit<Subscription, 'id' | 'createdAt' | 'eventCount'>) => void;
  onSubscriptionRemove?: (subscriptionId: string) => void;
  onSubscriptionPause?: (subscriptionId: string) => void;
  onSubscriptionResume?: (subscriptionId: string) => void;
  onSubscriptionEdit?: (subscriptionId: string, updates: Partial<Subscription>) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onConfigUpdate?: (config: Partial<RealTimeConfig>) => void;
  showMetrics?: boolean;
  showConfig?: boolean;
  showControls?: boolean;
  variant?: 'full' | 'compact' | 'minimal' | 'dashboard';
  className?: string;
}

const subscriptionTypeConfig = {
  incident: {
    icon: FileText,
    label: 'Incident',
    color: 'text-ss-teal',
    bgColor: 'bg-ss-teal/10',
    borderColor: 'border-ss-teal/20',
  },
  analysis: {
    icon: BarChart3,
    label: 'Analysis',
    color: 'text-ss-cta-blue',
    bgColor: 'bg-ss-cta-blue/10',
    borderColor: 'border-ss-cta-blue/20',
  },
  user: {
    icon: Users,
    label: 'User',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  workflow: {
    icon: Activity,
    label: 'Workflow',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  notification: {
    icon: Bell,
    label: 'Notification',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  system: {
    icon: Server,
    label: 'System',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const statusConfig = {
  active: {
    icon: CheckCircle,
    label: 'Active',
    color: 'text-ss-success',
    bgColor: 'bg-ss-success/10',
    badgeColor: 'bg-ss-success text-white',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-500 text-white',
  },
  error: {
    icon: AlertTriangle,
    label: 'Error',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    badgeColor: 'bg-red-600 text-white',
  },
  reconnecting: {
    icon: RefreshCw,
    label: 'Reconnecting',
    color: 'text-ss-alert',
    bgColor: 'bg-ss-alert/10',
    badgeColor: 'bg-ss-alert text-black',
    animate: true,
  },
};

const connectionStatusConfig = {
  connected: {
    icon: Wifi,
    label: 'Connected',
    color: 'text-ss-success',
    bgColor: 'bg-ss-success/10',
  },
  disconnected: {
    icon: WifiOff,
    label: 'Disconnected',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  unstable: {
    icon: Signal,
    label: 'Unstable',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  reconnecting: {
    icon: RefreshCw,
    label: 'Reconnecting',
    color: 'text-ss-alert',
    bgColor: 'bg-ss-alert/10',
    animate: true,
  },
};

export const RealTimeSubscriptionManager = React.forwardRef<HTMLDivElement, RealTimeSubscriptionManagerProps>(({
  subscriptions,
  metrics,
  config,
  onSubscriptionAdd,
  onSubscriptionRemove,
  onSubscriptionPause,
  onSubscriptionResume,
  onSubscriptionEdit,
  onConnect,
  onDisconnect,
  onReconnect,
  onConfigUpdate,
  showMetrics = true,
  showConfig = false,
  showControls = true,
  variant = 'full',
  className,
}, ref) => {
  const [showConfigPanel, setShowConfigPanel] = React.useState(false);
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const pausedSubscriptions = subscriptions.filter(s => s.status === 'paused');
  const errorSubscriptions = subscriptions.filter(s => s.status === 'error');

  const connectionInfo = connectionStatusConfig[metrics.status];
  const ConnectionIcon = connectionInfo.icon;

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleReconnect = async () => {
    if (onReconnect) {
      setIsReconnecting(true);
      await onReconnect();
      setIsReconnecting(false);
    }
  };

  const handleSubscriptionAction = (subscription: Subscription, action: string) => {
    switch (action) {
      case 'pause':
        if (onSubscriptionPause) onSubscriptionPause(subscription.id);
        break;
      case 'resume':
        if (onSubscriptionResume) onSubscriptionResume(subscription.id);
        break;
      case 'remove':
        if (onSubscriptionRemove) onSubscriptionRemove(subscription.id);
        break;
      default:
        break;
    }
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-4', className)}>
        <div className="flex items-center space-x-2">
          <ConnectionIcon className={cn('w-4 h-4', connectionInfo.color, connectionInfo.animate && 'animate-spin')} />
          <span className="text-healthcare-sm font-medium text-healthcare-primary">
            {activeSubscriptions.length} active
          </span>
        </div>
        
        {errorSubscriptions.length > 0 && (
          <Badge className="bg-red-100 text-red-700 text-xs">
            {errorSubscriptions.length} errors
          </Badge>
        )}
        
        <div className="text-healthcare-xs text-gray-600">
          {metrics.eventsPerSecond.toFixed(1)} events/s
        </div>
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div ref={ref} className={cn('grid grid-cols-1 md:grid-cols-4 gap-4', className)}>
        {/* Connection Status */}
        <Card className={cn('border-l-4', connectionInfo.bgColor, 
          metrics.status === 'connected' ? 'border-l-ss-success' : 
          metrics.status === 'disconnected' ? 'border-l-red-500' :
          'border-l-ss-alert')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ConnectionIcon className={cn('w-5 h-5', connectionInfo.color, connectionInfo.animate && 'animate-spin')} />
              <div>
                <div className="font-semibold text-healthcare-base text-healthcare-primary">
                  {connectionInfo.label}
                </div>
                <div className="text-healthcare-xs text-gray-600">
                  {metrics.latency}ms latency
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-ss-teal">
                {activeSubscriptions.length}
              </div>
              <div className="text-healthcare-xs text-gray-600">Active Subscriptions</div>
            </div>
          </CardContent>
        </Card>

        {/* Events/Second */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-ss-cta-blue">
                {metrics.eventsPerSecond.toFixed(1)}
              </div>
              <div className="text-healthcare-xs text-gray-600">Events/Second</div>
            </div>
          </CardContent>
        </Card>

        {/* Error Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className={cn('text-2xl font-bold', metrics.errorRate > 5 ? 'text-red-600' : 'text-ss-success')}>
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-healthcare-xs text-gray-600">Error Rate</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-ss-teal" />
            <div>
              <span>Real-time Subscriptions</span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={cn('text-xs', connectionInfo.bgColor, connectionInfo.color)}>
                  <ConnectionIcon className={cn('w-3 h-3 mr-1', connectionInfo.animate && 'animate-spin')} />
                  {connectionInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {activeSubscriptions.length} active
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showConfig && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConfigPanel(!showConfigPanel)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            
            {showControls && (
              <>
                {metrics.status === 'disconnected' && onReconnect && (
                  <Button
                    size="sm"
                    onClick={handleReconnect}
                    disabled={isReconnecting}
                    className="bg-ss-teal hover:bg-ss-teal-deep"
                  >
                    <RefreshCw className={cn('w-4 h-4 mr-1', isReconnecting && 'animate-spin')} />
                    Reconnect
                  </Button>
                )}
                
                {metrics.status === 'connected' && onDisconnect && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDisconnect}
                  >
                    <WifiOff className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics */}
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-ss-teal/5 rounded-lg">
              <div className="text-healthcare-lg font-semibold text-ss-teal">
                {metrics.latency}ms
              </div>
              <div className="text-healthcare-xs text-gray-600">Latency</div>
            </div>
            
            <div className="text-center p-3 bg-ss-cta-blue/5 rounded-lg">
              <div className="text-healthcare-lg font-semibold text-ss-cta-blue">
                {metrics.eventsPerSecond.toFixed(1)}
              </div>
              <div className="text-healthcare-xs text-gray-600">Events/Sec</div>
            </div>
            
            <div className="text-center p-3 bg-ss-success/5 rounded-lg">
              <div className="text-healthcare-lg font-semibold text-ss-success">
                {metrics.uptime.toFixed(1)}%
              </div>
              <div className="text-healthcare-xs text-gray-600">Uptime</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-healthcare-lg font-semibold text-red-600">
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-healthcare-xs text-gray-600">Error Rate</div>
            </div>
          </div>
        )}

        {/* Bandwidth */}
        {showMetrics && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-green-600" />
                <div>
                  <div className="font-semibold text-green-700">
                    {formatBytes(metrics.bandwidth.incoming)}/s
                  </div>
                  <div className="text-healthcare-xs text-gray-600">Incoming</div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-700">
                    {formatBytes(metrics.bandwidth.outgoing)}/s
                  </div>
                  <div className="text-healthcare-xs text-gray-600">Outgoing</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Config Panel */}
        {showConfigPanel && (
          <Card className="border-ss-teal/20 bg-ss-teal/5">
            <CardContent className="p-4 space-y-4">
              <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                Connection Configuration
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-healthcare-sm font-medium text-gray-700">
                    Auto Reconnect
                  </label>
                  <button
                    onClick={() => onConfigUpdate?.({ autoReconnect: !config.autoReconnect })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors mt-1',
                      config.autoReconnect ? 'bg-ss-teal' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      config.autoReconnect ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
                
                <div>
                  <label className="text-healthcare-sm font-medium text-gray-700">
                    Batch Updates
                  </label>
                  <button
                    onClick={() => onConfigUpdate?.({ batchUpdates: !config.batchUpdates })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors mt-1',
                      config.batchUpdates ? 'bg-ss-teal' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      config.batchUpdates ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-healthcare-sm font-medium text-gray-700">
                    Reconnect Delay (ms)
                  </label>
                  <input
                    type="number"
                    value={config.reconnectDelay}
                    onChange={(e) => onConfigUpdate?.({ reconnectDelay: parseInt(e.target.value) })}
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-healthcare-sm"
                  />
                </div>
                
                <div>
                  <label className="text-healthcare-sm font-medium text-gray-700">
                    Buffer Size
                  </label>
                  <input
                    type="number"
                    value={config.eventBufferSize}
                    onChange={(e) => onConfigUpdate?.({ eventBufferSize: parseInt(e.target.value) })}
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-healthcare-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscriptions List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
              Active Subscriptions
            </h4>
            {onSubscriptionAdd && (
              <Button
                size="sm"
                onClick={() => onSubscriptionAdd({
                  name: 'New Subscription',
                  resourceType: 'incident',
                  eventTypes: ['created', 'updated'],
                  status: 'active',
                  priority: 'medium',
                  eventCount: 0,
                })}
                className="bg-ss-teal hover:bg-ss-teal-deep"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Subscription
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-healthcare-base">No subscriptions configured</p>
                <p className="text-healthcare-sm mt-1">Add subscriptions to receive real-time updates</p>
              </div>
            ) : (
              subscriptions.map((subscription) => {
                const typeConfig = subscriptionTypeConfig[subscription.resourceType];
                const statusInfo = statusConfig[subscription.status];
                const TypeIcon = typeConfig.icon;
                const StatusIcon = statusInfo.icon;

                return (
                  <Card
                    key={subscription.id}
                    className={cn(
                      'border-l-4 transition-all duration-200',
                      typeConfig.borderColor,
                      subscription.status === 'error' && 'bg-red-50/50'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
                            <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-healthcare-base text-healthcare-primary">
                                {subscription.name}
                              </h4>
                              
                              <Badge className={cn('text-xs', statusInfo.badgeColor)}>
                                <StatusIcon className={cn('w-3 h-3 mr-1', statusInfo.animate && 'animate-spin')} />
                                {statusInfo.label}
                              </Badge>
                              
                              <Badge variant="outline" className="text-xs">
                                {typeConfig.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1 text-healthcare-xs text-gray-600">
                              <span>{subscription.eventCount} events</span>
                              {subscription.lastEvent && (
                                <span>Last: {formatDuration(subscription.lastEvent)}</span>
                              )}
                              <span>Events: {subscription.eventTypes.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {subscription.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSubscriptionAction(subscription, 'pause')}
                              className="w-8 h-8 p-0 hover:bg-gray-200"
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSubscriptionAction(subscription, 'resume')}
                              className="w-8 h-8 p-0 hover:bg-gray-200"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSubscriptionAction(subscription, 'remove')}
                            className="w-8 h-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

RealTimeSubscriptionManager.displayName = 'RealTimeSubscriptionManager';