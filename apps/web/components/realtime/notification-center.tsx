'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { Button } from '@starter/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Bell, 
  BellOff, 
  X, 
  Check, 
  Clock, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  User,
  Users,
  FileText,
  Activity,
  MessageSquare,
  Calendar,
  Zap,
  Filter,
  Search,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

export interface Notification {
  id: string;
  type: 'workflow_handoff' | 'incident_assigned' | 'analysis_complete' | 'comment_added' | 'deadline_approaching' | 'system_alert' | 'user_mention';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'workflow' | 'incident' | 'system' | 'collaboration' | 'deadline';
  timestamp: Date;
  isRead: boolean;
  isArchived: boolean;
  resourceId?: string;
  resourceType?: 'incident' | 'analysis' | 'report' | 'workflow';
  fromUser?: {
    id: string;
    name: string;
    avatar?: string;
  };
  actionRequired?: boolean;
  dueDate?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: {
    workflow: boolean;
    incident: boolean;
    system: boolean;
    collaboration: boolean;
    deadline: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

export interface NotificationCenterProps {
  notifications: Notification[];
  settings: NotificationSettings;
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (notificationId: string) => void;
  onNotificationArchive?: (notificationId: string) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll?: () => void;
  onSettingsChange?: (settings: NotificationSettings) => void;
  onAction?: (notificationId: string, action: string) => void;
  showArchived?: boolean;
  showSettings?: boolean;
  maxVisible?: number;
  variant?: 'full' | 'compact' | 'minimal' | 'dropdown';
  className?: string;
}

const notificationTypeConfig = {
  workflow_handoff: {
    icon: ArrowRight,
    label: 'Workflow Handoff',
    color: 'text-ss-cta-blue',
    bgColor: 'bg-ss-cta-blue/10',
    borderColor: 'border-ss-cta-blue/20',
  },
  incident_assigned: {
    icon: FileText,
    label: 'Incident Assigned',
    color: 'text-ss-teal',
    bgColor: 'bg-ss-teal/10',
    borderColor: 'border-ss-teal/20',
  },
  analysis_complete: {
    icon: CheckCircle,
    label: 'Analysis Complete',
    color: 'text-ss-success',
    bgColor: 'bg-ss-success/10',
    borderColor: 'border-ss-success/20',
  },
  comment_added: {
    icon: MessageSquare,
    label: 'New Comment',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  deadline_approaching: {
    icon: Clock,
    label: 'Deadline Approaching',
    color: 'text-ss-alert',
    bgColor: 'bg-ss-alert/10',
    borderColor: 'border-ss-alert/20',
  },
  system_alert: {
    icon: AlertTriangle,
    label: 'System Alert',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  user_mention: {
    icon: User,
    label: 'You were mentioned',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

const priorityConfig = {
  low: {
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    badgeColor: 'bg-gray-100 text-gray-700',
  },
  medium: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    badgeColor: 'bg-red-100 text-red-700',
  },
};

export const NotificationCenter = React.forwardRef<HTMLDivElement, NotificationCenterProps>(({
  notifications,
  settings,
  onNotificationClick,
  onNotificationDismiss,
  onNotificationArchive,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSettingsChange,
  onAction,
  showArchived = false,
  showSettings = false,
  maxVisible = 50,
  variant = 'full',
  className,
}, ref) => {
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSettingsPanel, setShowSettingsPanel] = React.useState(false);

  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;

    // Archive filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (filter === 'archived') {
      filtered = filtered.filter(n => n.isArchived);
    } else {
      filtered = filtered.filter(n => !n.isArchived);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.fromUser?.name.toLowerCase().includes(query)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filtered.slice(0, maxVisible);
  }, [notifications, filter, categoryFilter, searchQuery, maxVisible]);

  const unreadCount = notifications.filter(n => !n.isRead && !n.isArchived).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead && !n.isArchived).length;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationAction = (notification: Notification, action: string) => {
    if (action === 'dismiss') {
      onNotificationDismiss?.(notification.id);
    } else if (action === 'archive') {
      onNotificationArchive?.(notification.id);
    } else if (action === 'read') {
      onMarkAsRead?.(notification.id);
    } else if (onAction) {
      onAction(notification.id, action);
    }
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-2', className)}>
        <div className="relative">
          <Bell className={cn('w-5 h-5', unreadCount > 0 ? 'text-ss-cta-blue' : 'text-gray-600')} />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
        {criticalCount > 0 && (
          <Badge className="bg-red-100 text-red-700 text-xs">
            {criticalCount} urgent
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'dropdown') {
    return (
      <Card ref={ref} className={cn('w-80 max-h-96', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-healthcare-base">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-ss-teal" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge className="bg-ss-cta-blue text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {onMarkAllAsRead && unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 max-h-64 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-healthcare-sm">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => {
                const typeConfig = notificationTypeConfig[notification.type];
                const TypeIcon = typeConfig.icon;
                const priorityInfo = priorityConfig[notification.priority];

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors',
                      !notification.isRead && 'bg-blue-50/50'
                    )}
                    onClick={() => {
                      if (!notification.isRead && onMarkAsRead) {
                        onMarkAsRead(notification.id);
                      }
                      onNotificationClick?.(notification);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn('p-1 rounded-full mt-0.5', typeConfig.bgColor)}>
                        <TypeIcon className={cn('w-3 h-3', typeConfig.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className={cn(
                            'text-healthcare-sm font-medium text-healthcare-primary truncate',
                            !notification.isRead && 'font-semibold'
                          )}>
                            {notification.title}
                          </h4>
                          {notification.priority === 'critical' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        
                        <p className="text-healthcare-xs text-gray-600 mt-0.5 truncate">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-healthcare-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {notification.fromUser && (
                            <span className="text-healthcare-xs text-gray-500">
                              by {notification.fromUser.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-ss-cta-blue rounded-full" />
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationAction(notification, 'dismiss');
                          }}
                          className="w-6 h-6 p-0 hover:bg-gray-200"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-ss-teal" />
            <div>
              <span>Notification Center</span>
              {unreadCount > 0 && (
                <Badge className="bg-ss-cta-blue text-white ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {showSettings && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
            
            {onMarkAllAsRead && unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkAllAsRead}
              >
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
            
            {onClearAll && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClearAll}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'ghost'}
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-ss-teal hover:bg-ss-teal-deep' : ''}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'unread' ? 'default' : 'ghost'}
              onClick={() => setFilter('unread')}
              className={filter === 'unread' ? 'bg-ss-teal hover:bg-ss-teal-deep' : ''}
            >
              Unread ({unreadCount})
            </Button>
            {showArchived && (
              <Button
                size="sm"
                variant={filter === 'archived' ? 'default' : 'ghost'}
                onClick={() => setFilter('archived')}
                className={filter === 'archived' ? 'bg-ss-teal hover:bg-ss-teal-deep' : ''}
              >
                Archived
              </Button>
            )}
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-healthcare-sm"
          >
            <option value="all">All Categories</option>
            <option value="workflow">Workflow</option>
            <option value="incident">Incident</option>
            <option value="system">System</option>
            <option value="collaboration">Collaboration</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-healthcare-sm focus:ring-2 focus:ring-ss-teal focus:border-ss-teal"
          />
        </div>

        {/* Settings Panel */}
        {showSettingsPanel && (
          <Card className="border-ss-teal/20 bg-ss-teal/5">
            <CardContent className="p-4 space-y-4">
              <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                Notification Settings
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-healthcare-sm">Enable notifications</span>
                  <button
                    onClick={() => onSettingsChange?.({
                      ...settings,
                      enabled: !settings.enabled
                    })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      settings.enabled ? 'bg-ss-teal' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.enabled ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-healthcare-sm">Sound notifications</span>
                  <button
                    onClick={() => onSettingsChange?.({
                      ...settings,
                      sound: !settings.sound
                    })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      settings.sound ? 'bg-ss-teal' : 'bg-gray-200'
                    )}
                  >
                    <span className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      settings.sound ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-healthcare-base text-gray-600">No notifications found</p>
              <p className="text-healthcare-sm text-gray-500 mt-1">
                {filter === 'unread' ? 'All caught up!' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const typeConfig = notificationTypeConfig[notification.type];
              const TypeIcon = typeConfig.icon;
              const priorityInfo = priorityConfig[notification.priority];

              return (
                <Card
                  key={notification.id}
                  className={cn(
                    'border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md',
                    typeConfig.borderColor,
                    !notification.isRead && 'bg-blue-50/50',
                    notification.priority === 'critical' && 'ring-2 ring-red-200'
                  )}
                  onClick={() => {
                    if (!notification.isRead && onMarkAsRead) {
                      onMarkAsRead(notification.id);
                    }
                    onNotificationClick?.(notification);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={cn('p-2 rounded-lg mt-0.5', typeConfig.bgColor)}>
                          <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className={cn(
                              'text-healthcare-base font-medium text-healthcare-primary',
                              !notification.isRead && 'font-semibold'
                            )}>
                              {notification.title}
                            </h4>
                            
                            <Badge className={cn('text-xs', priorityInfo.badgeColor)}>
                              {notification.priority}
                            </Badge>
                            
                            {notification.actionRequired && (
                              <Badge className="bg-ss-alert/10 text-ss-alert text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-healthcare-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-healthcare-xs text-gray-500">
                            <span>{formatTimestamp(notification.timestamp)}</span>
                            
                            {notification.fromUser && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{notification.fromUser.name}</span>
                              </div>
                            )}
                            
                            {notification.dueDate && (
                              <div className="flex items-center space-x-1 text-ss-alert">
                                <Clock className="w-3 h-3" />
                                <span>Due {formatTimestamp(notification.dueDate)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-ss-cta-blue rounded-full" />
                        )}
                        
                        <div className="flex items-center space-x-1">
                          {onNotificationArchive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationAction(notification, 'archive');
                              }}
                              className="w-8 h-8 p-0 hover:bg-gray-200"
                            >
                              <Archive className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationAction(notification, 'dismiss');
                            }}
                            className="w-8 h-8 p-0 hover:bg-gray-200"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
});

NotificationCenter.displayName = 'NotificationCenter';