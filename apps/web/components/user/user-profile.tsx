'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Button } from '@starter/ui';
import { Badge } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  User, 
  Crown, 
  Shield, 
  Users, 
  UserCheck,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Settings,
  LogOut,
  Edit,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';

export interface UserRole {
  id: string;
  name: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  label: string;
  permissions: string[];
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  company: {
    id: string;
    name: string;
  };
  department?: string;
  title?: string;
  location?: string;
  joinedAt: Date;
  lastActive: Date;
  isOnline: boolean;
  stats: {
    incidentsReported: number;
    incidentsAnalyzed: number;
    averageResponseTime: number; // in minutes
    completionRate: number; // 0-100
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    darkMode: boolean;
    language: string;
  };
}

export interface UserProfileProps {
  user: UserProfile;
  currentUserId?: string;
  onEdit?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  onViewPermissions?: () => void;
  showStats?: boolean;
  showPreferences?: boolean;
  showActions?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const roleConfig = {
  system_admin: {
    label: 'System Administrator',
    description: 'Full system access and management',
    icon: Crown,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    badgeColor: 'bg-purple-600 text-white',
  },
  company_admin: {
    label: 'Company Administrator',
    description: 'Company-wide management and oversight',
    icon: Shield,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    badgeColor: 'bg-blue-600 text-white',
  },
  team_lead: {
    label: 'Team Leader',
    description: 'Team management and workflow oversight',
    icon: Users,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    badgeColor: 'bg-green-600 text-white',
  },
  frontline_worker: {
    label: 'Frontline Worker',
    description: 'Direct participant support and incident reporting',
    icon: UserCheck,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    badgeColor: 'bg-gray-600 text-white',
  },
};

export const UserProfile = React.forwardRef<HTMLDivElement, UserProfileProps>(({
  user,
  currentUserId,
  onEdit,
  onSettings,
  onLogout,
  onViewPermissions,
  showStats = true,
  showPreferences = false,
  showActions = true,
  variant = 'full',
  className,
}, ref) => {
  const roleInfo = roleConfig[user.role.name];
  const RoleIcon = roleInfo.icon;
  const isCurrentUser = currentUserId === user.id;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return formatDate(date);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-3', className)}>
        <div className="relative">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-ss-teal flex items-center justify-center">
              <span className="text-white text-healthcare-xs font-semibold">
                {getInitials(user.name)}
              </span>
            </div>
          )}
          {user.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-ss-success rounded-full border-2 border-white" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-healthcare-sm font-medium text-healthcare-primary truncate">
            {user.name}
          </p>
          <p className="text-healthcare-xs text-gray-600 truncate">
            {roleInfo.label}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card ref={ref} className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-ss-teal flex items-center justify-center">
                    <span className="text-white text-healthcare-base font-semibold">
                      {getInitials(user.name)}
                    </span>
                  </div>
                )}
                {user.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-ss-success rounded-full border-2 border-white" />
                )}
              </div>
              
              <div>
                <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                  {user.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <Badge className={cn('text-xs', roleInfo.badgeColor)}>
                    <RoleIcon className="w-3 h-3 mr-1" />
                    {roleInfo.label}
                  </Badge>
                </div>
                <p className="text-healthcare-xs text-gray-600 mt-1">
                  {user.company.name} • Last active {formatLastActive(user.lastActive)}
                </p>
              </div>
            </div>
            
            {showActions && isCurrentUser && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSettings}
              >
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
            )}
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
            <User className="w-5 h-5 text-ss-teal" />
            <span>User Profile</span>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-2">
              {isCurrentUser && onSettings && (
                <Button size="sm" variant="outline" onClick={onSettings}>
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              )}
              {isCurrentUser && onEdit && (
                <Button size="sm" onClick={onEdit} className="bg-ss-teal hover:bg-ss-teal-deep">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {isCurrentUser && onLogout && (
                <Button size="sm" variant="outline" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Profile Overview */}
        <div className="flex items-start space-x-4">
          <div className="relative">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-ss-teal flex items-center justify-center">
                <span className="text-white text-healthcare-lg font-semibold">
                  {getInitials(user.name)}
                </span>
              </div>
            )}
            {user.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-ss-success rounded-full border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-healthcare-lg font-semibold text-healthcare-primary mb-1">
              {user.name}
            </h3>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={cn('text-sm', roleInfo.badgeColor)}>
                <RoleIcon className="w-4 h-4 mr-1" />
                {roleInfo.label}
              </Badge>
              
              {user.isOnline ? (
                <Badge className="bg-ss-success/10 text-ss-success">
                  <div className="w-2 h-2 bg-ss-success rounded-full mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Last seen {formatLastActive(user.lastActive)}
                </Badge>
              )}
              
              {onViewPermissions && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onViewPermissions}
                  className="text-healthcare-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View Permissions
                </Button>
              )}
            </div>
            
            <p className="text-healthcare-sm text-gray-600">
              {roleInfo.description}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
            Contact Information
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-healthcare-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{user.email}</span>
            </div>
            
            {user.phone && (
              <div className="flex items-center space-x-2 text-healthcare-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{user.phone}</span>
              </div>
            )}
            
            {user.location && (
              <div className="flex items-center space-x-2 text-healthcare-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{user.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Organization Information */}
        <div>
          <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
            Organization
          </h4>
          <div className="space-y-2">
            <div className="text-healthcare-sm">
              <span className="text-gray-600">Company:</span>
              <span className="text-gray-700 ml-2">{user.company.name}</span>
            </div>
            
            {user.department && (
              <div className="text-healthcare-sm">
                <span className="text-gray-600">Department:</span>
                <span className="text-gray-700 ml-2">{user.department}</span>
              </div>
            )}
            
            {user.title && (
              <div className="text-healthcare-sm">
                <span className="text-gray-600">Title:</span>
                <span className="text-gray-700 ml-2">{user.title}</span>
              </div>
            )}
            
            <div className="text-healthcare-sm">
              <span className="text-gray-600">Member since:</span>
              <span className="text-gray-700 ml-2">{formatDate(user.joinedAt)}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {showStats && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Performance Statistics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-ss-teal/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-teal">
                  {user.stats.incidentsReported}
                </div>
                <div className="text-healthcare-xs text-gray-600">Incidents Reported</div>
              </div>
              
              <div className="text-center p-3 bg-ss-cta-blue/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-cta-blue">
                  {user.stats.incidentsAnalyzed}
                </div>
                <div className="text-healthcare-xs text-gray-600">Incidents Analyzed</div>
              </div>
              
              <div className="text-center p-3 bg-ss-success/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-success">
                  {user.stats.averageResponseTime}m
                </div>
                <div className="text-healthcare-xs text-gray-600">Avg Response Time</div>
              </div>
              
              <div className="text-center p-3 bg-ss-alert/5 rounded-lg">
                <div className="text-healthcare-lg font-semibold text-ss-alert">
                  {user.stats.completionRate}%
                </div>
                <div className="text-healthcare-xs text-gray-600">Completion Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        {showPreferences && isCurrentUser && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Preferences
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-healthcare-sm text-gray-700">Email Notifications</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className={cn('w-4 h-4', user.preferences.emailNotifications ? 'text-ss-success' : 'text-gray-300')} />
                  <span className="text-healthcare-xs text-gray-600">
                    {user.preferences.emailNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-healthcare-sm text-gray-700">SMS Notifications</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className={cn('w-4 h-4', user.preferences.smsNotifications ? 'text-ss-success' : 'text-gray-300')} />
                  <span className="text-healthcare-xs text-gray-600">
                    {user.preferences.smsNotifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-healthcare-sm text-gray-700">Dark Mode</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className={cn('w-4 h-4', user.preferences.darkMode ? 'text-ss-success' : 'text-gray-300')} />
                  <span className="text-healthcare-xs text-gray-600">
                    {user.preferences.darkMode ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-healthcare-sm text-gray-700">Language</span>
                <span className="text-healthcare-sm text-gray-700">{user.preferences.language}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

UserProfile.displayName = 'UserProfile';