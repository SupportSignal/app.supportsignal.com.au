// @ts-nocheck
'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { Button } from '@starter/ui';
import { Card, CardContent } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Users, 
  User, 
  Eye, 
  Edit3, 
  Crown, 
  Shield, 
  UserCheck,
  Clock,
  Activity,
  MessageSquare,
  Mouse,
  Keyboard,
  Circle,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';

export interface CollaboratingUser {
  id: string;
  name: string;
  role: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  avatar?: string;
  isCurrentUser?: boolean;
  activity: 'viewing' | 'editing' | 'typing' | 'idle' | 'away';
  lastSeen: Date;
  location?: {
    section: string;
    field?: string;
  };
  hasConflict?: boolean;
  permissions: {
    canEdit: boolean;
    canView: boolean;
    canComment: boolean;
  };
}

export interface CollaborationSession {
  id: string;
  resourceId: string;
  resourceType: 'incident' | 'analysis' | 'report' | 'workflow';
  startTime: Date;
  isLocked?: boolean;
  lockOwner?: string;
  maxCollaborators?: number;
  conflictCount?: number;
}

export interface CollaborationBadgeProps {
  users: CollaboratingUser[];
  session?: CollaborationSession;
  currentUserId?: string;
  onUserClick?: (userId: string) => void;
  onViewUsers?: () => void;
  onResolveConflict?: (userId: string) => void;
  onRequestAccess?: () => void;
  showActivity?: boolean;
  showRoles?: boolean;
  showConflicts?: boolean;
  showPermissions?: boolean;
  maxVisible?: number;
  variant?: 'full' | 'compact' | 'minimal' | 'count';
  className?: string;
}

const roleConfig = {
  system_admin: {
    label: 'System Admin',
    icon: Crown,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  company_admin: {
    label: 'Company Admin',
    icon: Shield,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  team_lead: {
    label: 'Team Lead',
    icon: Users,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  frontline_worker: {
    label: 'Frontline Worker',
    icon: UserCheck,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
};

const activityConfig = {
  viewing: {
    icon: Eye,
    label: 'Viewing',
    color: 'text-ss-teal',
    bgColor: 'bg-ss-teal/10',
    description: 'Reading content',
  },
  editing: {
    icon: Edit3,
    label: 'Editing',
    color: 'text-ss-cta-blue',
    bgColor: 'bg-ss-cta-blue/10',
    description: 'Making changes',
    animate: true,
  },
  typing: {
    icon: Keyboard,
    label: 'Typing',
    color: 'text-ss-success',
    bgColor: 'bg-ss-success/10',
    description: 'Actively typing',
    animate: true,
  },
  idle: {
    icon: Clock,
    label: 'Idle',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    description: 'No recent activity',
  },
  away: {
    icon: Circle,
    label: 'Away',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    description: 'Temporarily away',
  },
};

export const CollaborationBadge = React.forwardRef<HTMLDivElement, CollaborationBadgeProps>(({
  users,
  session,
  currentUserId,
  onUserClick,
  onViewUsers,
  onResolveConflict,
  onRequestAccess,
  showActivity = true,
  showRoles = false,
  showConflicts = true,
  showPermissions = false,
  maxVisible = 3,
  variant = 'compact',
  className,
}, ref) => {
  const activeUsers = users.filter(user => 
    user.activity !== 'away' && 
    (new Date().getTime() - user.lastSeen.getTime()) < 300000 // 5 minutes
  );
  
  const editingUsers = users.filter(user => user.activity === 'editing');
  const viewingUsers = users.filter(user => user.activity === 'viewing');
  const conflictUsers = users.filter(user => user.hasConflict);
  
  const currentUser = users.find(user => user.id === currentUserId);
  const otherUsers = users.filter(user => user.id !== currentUserId);
  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, otherUsers.length - maxVisible);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (variant === 'count') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-1', className)}>
        <Users className="w-4 h-4 text-gray-600" />
        <span className="text-healthcare-sm text-gray-700">
          {users.length}
        </span>
        {conflictUsers.length > 0 && showConflicts && (
          <AlertTriangle className="w-3 h-3 text-ss-alert ml-1" />
        )}
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-2', className)}>
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => {
            const roleInfo = roleConfig[user.role];
            const activityInfo = activityConfig[user.activity];
            
            return (
              <div
                key={user.id}
                className={cn(
                  'relative w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium cursor-pointer transition-transform hover:scale-110',
                  roleInfo.bgColor,
                  roleInfo.color,
                  user.hasConflict && 'ring-2 ring-red-500'
                )}
                onClick={() => onUserClick?.(user.id)}
                title={`${user.name} - ${activityInfo.label}`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(user.name)
                )}
                
                {showActivity && (
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white',
                    activityInfo.bgColor,
                    activityInfo.animate && 'animate-pulse'
                  )} />
                )}
              </div>
            );
          })}
          
          {hiddenCount > 0 && (
            <div
              className="w-6 h-6 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={onViewUsers}
              title={`${hiddenCount} more users`}
            >
              +{hiddenCount}
            </div>
          )}
        </div>
        
        {conflictUsers.length > 0 && showConflicts && (
          <Badge className="bg-red-100 text-red-700 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Conflicts
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
              <div className="flex -space-x-3">
                {visibleUsers.map((user) => {
                  const roleInfo = roleConfig[user.role];
                  const activityInfo = activityConfig[user.activity];
                  
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        'relative w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-healthcare-sm font-medium cursor-pointer transition-transform hover:scale-110',
                        roleInfo.bgColor,
                        roleInfo.color,
                        user.hasConflict && 'ring-2 ring-red-500'
                      )}
                      onClick={() => onUserClick?.(user.id)}
                      title={`${user.name} - ${activityInfo.label}`}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(user.name)
                      )}
                      
                      {showActivity && (
                        <div className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                          activityInfo.bgColor,
                          activityInfo.animate && 'animate-pulse'
                        )}>
                          <activityInfo.icon className="w-2 h-2 text-current" />
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {hiddenCount > 0 && (
                  <div
                    className="w-8 h-8 bg-gray-100 border-2 border-white rounded-full flex items-center justify-center text-healthcare-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={onViewUsers}
                    title={`${hiddenCount} more users`}
                  >
                    +{hiddenCount}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                    Collaborating
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {users.length} active
                  </Badge>
                </div>
                
                {showActivity && (
                  <p className="text-healthcare-xs text-gray-600 mt-1">
                    {editingUsers.length > 0 && `${editingUsers.length} editing`}
                    {editingUsers.length > 0 && viewingUsers.length > 0 && ' • '}
                    {viewingUsers.length > 0 && `${viewingUsers.length} viewing`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {conflictUsers.length > 0 && showConflicts && (
                <Badge className="bg-red-100 text-red-700 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {conflictUsers.length} conflict{conflictUsers.length !== 1 ? 's' : ''}
                </Badge>
              )}
              
              {session?.isLocked && (
                <Badge className="bg-ss-alert/10 text-ss-alert text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-ss-teal" />
            <div>
              <h3 className="font-semibold text-healthcare-lg text-healthcare-primary">
                Active Collaborators
              </h3>
              <p className="text-healthcare-sm text-gray-600">
                {users.length} user{users.length !== 1 ? 's' : ''} currently working on this {session?.resourceType || 'document'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {session?.isLocked && (
              <Badge className="bg-ss-alert/10 text-ss-alert">
                <Lock className="w-4 h-4 mr-1" />
                Document Locked
              </Badge>
            )}
            
            {conflictUsers.length > 0 && showConflicts && (
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle className="w-4 h-4 mr-1" />
                {conflictUsers.length} Conflict{conflictUsers.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Active Users List */}
        <div className="space-y-3">
          {users.map((user) => {
            const roleInfo = roleConfig[user.role];
            const activityInfo = activityConfig[user.activity];
            const RoleIcon = roleInfo.icon;
            const ActivityIcon = activityInfo.icon;
            
            return (
              <div
                key={user.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  user.isCurrentUser ? 'bg-ss-teal/5 border-ss-teal/20' : 'bg-gray-50 border-gray-200',
                  user.hasConflict && 'border-red-200 bg-red-50',
                  onUserClick && 'cursor-pointer hover:bg-gray-100'
                )}
                onClick={() => onUserClick?.(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-healthcare-sm font-medium',
                        roleInfo.bgColor,
                        roleInfo.color
                      )}>
                        {getInitials(user.name)}
                      </div>
                    )}
                    
                    <div className={cn(
                      'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center',
                      activityInfo.bgColor,
                      activityInfo.animate && 'animate-pulse'
                    )}>
                      <ActivityIcon className={cn('w-2.5 h-2.5', activityInfo.color)} />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-healthcare-base text-healthcare-primary">
                        {user.name}
                        {user.isCurrentUser && (
                          <span className="text-healthcare-sm text-ss-teal ml-1">(You)</span>
                        )}
                      </h4>
                      
                      {showRoles && (
                        <Badge className={cn('text-xs', 
                          user.role === 'system_admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'company_admin' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'team_lead' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {roleInfo.label}
                        </Badge>
                      )}
                      
                      {user.hasConflict && showConflicts && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Conflict
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={cn('text-healthcare-sm', activityInfo.color)}>
                        {activityInfo.label}
                        {user.location && ` in ${user.location.section}`}
                      </span>
                      
                      <span className="text-healthcare-xs text-gray-600">
                        {formatLastSeen(user.lastSeen)}
                      </span>
                      
                      {showPermissions && (
                        <div className="flex items-center space-x-1">
                          {user.permissions.canEdit ? (
                            <Edit3 className="w-3 h-3 text-ss-success" title="Can edit" />
                          ) : user.permissions.canView ? (
                            <Eye className="w-3 h-3 text-gray-500" title="Can view" />
                          ) : (
                            <Lock className="w-3 h-3 text-red-500" title="No access" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {user.hasConflict && onResolveConflict && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolveConflict(user.id);
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Resolve
                    </Button>
                  )}
                  
                  {!user.permissions.canEdit && onRequestAccess && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestAccess();
                      }}
                      className="text-ss-teal border-ss-teal hover:bg-ss-teal/10"
                    >
                      Request Access
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Session Info */}
        {session && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-ss-teal/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-teal">
                  {activeUsers.length}
                </div>
                <div className="text-healthcare-xs text-gray-600">Active</div>
              </div>
              
              <div className="p-3 bg-ss-cta-blue/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-cta-blue">
                  {editingUsers.length}
                </div>
                <div className="text-healthcare-xs text-gray-600">Editing</div>
              </div>
              
              <div className="p-3 bg-ss-success/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-success">
                  {viewingUsers.length}
                </div>
                <div className="text-healthcare-xs text-gray-600">Viewing</div>
              </div>
              
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-red-600">
                  {conflictUsers.length}
                </div>
                <div className="text-healthcare-xs text-gray-600">Conflicts</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CollaborationBadge.displayName = 'CollaborationBadge';