'use client';

import React from 'react';
import { Badge } from '@starter/ui';
import { Button } from '@starter/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Crown, 
  Users, 
  UserCheck, 
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Settings,
  Database,
  FileText,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'company' | 'incidents' | 'analysis' | 'reports' | 'users';
  level: 'read' | 'write' | 'admin' | 'full';
  isGranted: boolean;
  isDangerous?: boolean;
  inheritedFrom?: 'role' | 'direct' | 'group';
}

export interface PermissionIndicatorProps {
  userRole: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  permissions: Permission[];
  onPermissionToggle?: (permissionId: string, granted: boolean) => void;
  onViewDetails?: (permissionId: string) => void;
  showCategories?: boolean;
  showInheritance?: boolean;
  showDangerous?: boolean;
  readOnly?: boolean;
  variant?: 'full' | 'compact' | 'minimal' | 'summary';
  className?: string;
}

const roleConfig = {
  system_admin: {
    label: 'System Administrator',
    icon: Crown,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    badgeColor: 'bg-purple-600 text-white',
    hierarchyLevel: 4,
  },
  company_admin: {
    label: 'Company Administrator', 
    icon: Shield,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    badgeColor: 'bg-blue-600 text-white',
    hierarchyLevel: 3,
  },
  team_lead: {
    label: 'Team Leader',
    icon: Users,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    badgeColor: 'bg-green-600 text-white',
    hierarchyLevel: 2,
  },
  frontline_worker: {
    label: 'Frontline Worker',
    icon: UserCheck,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    badgeColor: 'bg-gray-600 text-white',
    hierarchyLevel: 1,
  },
};

const categoryConfig = {
  system: {
    label: 'System',
    icon: Settings,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  company: {
    label: 'Company',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  incidents: {
    label: 'Incidents',
    icon: FileText,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  analysis: {
    label: 'Analysis',
    icon: BarChart3,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  reports: {
    label: 'Reports',
    icon: Database,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  users: {
    label: 'Users',
    icon: Users,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
};

const levelConfig = {
  read: { label: 'Read Only', color: 'bg-gray-100 text-gray-700' },
  write: { label: 'Read/Write', color: 'bg-blue-100 text-blue-700' },
  admin: { label: 'Admin', color: 'bg-orange-100 text-orange-700' },
  full: { label: 'Full Control', color: 'bg-red-100 text-red-700' },
};

const inheritanceConfig = {
  role: { label: 'Role', color: 'bg-ss-teal/10 text-ss-teal' },
  direct: { label: 'Direct', color: 'bg-ss-cta-blue/10 text-ss-cta-blue' },
  group: { label: 'Group', color: 'bg-ss-success/10 text-ss-success' },
};

export const PermissionIndicator = React.forwardRef<HTMLDivElement, PermissionIndicatorProps>(({
  userRole,
  permissions,
  onPermissionToggle,
  onViewDetails,
  showCategories = true,
  showInheritance = true,
  showDangerous = true,
  readOnly = false,
  variant = 'full',
  className,
}, ref) => {
  const roleInfo = roleConfig[userRole];
  const RoleIcon = roleInfo.icon;

  const grantedPermissions = permissions.filter(p => p.isGranted);
  const dangerousPermissions = permissions.filter(p => p.isDangerous && p.isGranted);
  
  const permissionsByCategory = React.useMemo(() => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }, [permissions]);

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-2', className)}>
        <Shield className={cn('w-4 h-4', roleInfo.color)} />
        <span className="text-healthcare-sm font-medium text-healthcare-primary">
          {grantedPermissions.length} permissions
        </span>
        {dangerousPermissions.length > 0 && (
          <Badge className="bg-red-100 text-red-700 text-xs">
            {dangerousPermissions.length} elevated
          </Badge>
        )}
      </div>
    );
  }

  if (variant === 'summary') {
    return (
      <Card ref={ref} className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('p-2 rounded-lg', roleInfo.bgColor)}>
                <RoleIcon className={cn('w-5 h-5', roleInfo.color)} />
              </div>
              
              <div>
                <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                  {roleInfo.label}
                </h4>
                <p className="text-healthcare-sm text-gray-600">
                  {grantedPermissions.length} active permissions
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-ss-teal">
                {Math.round((grantedPermissions.length / permissions.length) * 100)}%
              </div>
              <div className="text-healthcare-xs text-gray-600">Coverage</div>
            </div>
          </div>
          
          {dangerousPermissions.length > 0 && (
            <div className="mt-3 flex items-center space-x-2 p-2 bg-red-50 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-healthcare-sm text-red-700">
                {dangerousPermissions.length} elevated permissions granted
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <Card ref={ref} className={cn('', className)}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RoleIcon className={cn('w-4 h-4', roleInfo.color)} />
              <span className="font-semibold text-healthcare-base">Permissions</span>
            </div>
            <Badge className={cn('text-xs', roleInfo.badgeColor)}>
              {roleInfo.label}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-ss-success/5 rounded">
              <div className="text-healthcare-base font-semibold text-ss-success">
                {grantedPermissions.length}
              </div>
              <div className="text-healthcare-xs text-gray-600">Granted</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-healthcare-base font-semibold text-gray-600">
                {permissions.length - grantedPermissions.length}
              </div>
              <div className="text-healthcare-xs text-gray-600">Denied</div>
            </div>
            <div className="p-2 bg-red-50 rounded">
              <div className="text-healthcare-base font-semibold text-red-600">
                {dangerousPermissions.length}
              </div>
              <div className="text-healthcare-xs text-gray-600">Elevated</div>
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
            <Shield className="w-5 h-5 text-ss-teal" />
            <span>Permission Management</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={cn('text-sm', roleInfo.badgeColor)}>
              <RoleIcon className="w-4 h-4 mr-1" />
              {roleInfo.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {grantedPermissions.length}/{permissions.length} granted
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-ss-success/5 rounded-lg">
            <div className="text-healthcare-lg font-semibold text-ss-success">
              {grantedPermissions.length}
            </div>
            <div className="text-healthcare-xs text-gray-600">Granted</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-healthcare-lg font-semibold text-gray-600">
              {permissions.length - grantedPermissions.length}
            </div>
            <div className="text-healthcare-xs text-gray-600">Denied</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-healthcare-lg font-semibold text-red-600">
              {dangerousPermissions.length}
            </div>
            <div className="text-healthcare-xs text-gray-600">Elevated</div>
          </div>
          
          <div className="text-center p-3 bg-ss-teal/5 rounded-lg">
            <div className="text-healthcare-lg font-semibold text-ss-teal">
              {Math.round((grantedPermissions.length / permissions.length) * 100)}%
            </div>
            <div className="text-healthcare-xs text-gray-600">Coverage</div>
          </div>
        </div>

        {/* Dangerous Permissions Warning */}
        {showDangerous && dangerousPermissions.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-red-700 mb-2">Elevated Permissions</h5>
                <p className="text-healthcare-sm text-red-600 mb-3">
                  This user has {dangerousPermissions.length} elevated permissions that provide significant system access.
                </p>
                <div className="space-y-1">
                  {dangerousPermissions.map(permission => (
                    <div key={permission.id} className="text-healthcare-sm text-red-700">
                      • {permission.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions by Category */}
        {showCategories && (
          <div className="space-y-4">
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
              Permissions by Category
            </h4>
            
            {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
              const categoryInfo = categoryConfig[category as keyof typeof categoryConfig];
              const CategoryIcon = categoryInfo.icon;
              const grantedInCategory = categoryPermissions.filter(p => p.isGranted).length;

              return (
                <Card key={category} className="border-l-4 border-l-ss-teal bg-healthcare-surface">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className={cn('w-5 h-5', categoryInfo.color)} />
                        <h5 className="font-semibold text-healthcare-base text-healthcare-primary">
                          {categoryInfo.label}
                        </h5>
                        <Badge variant="outline" className="text-xs">
                          {grantedInCategory}/{categoryPermissions.length}
                        </Badge>
                      </div>
                      
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-ss-teal h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(grantedInCategory / categoryPermissions.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {categoryPermissions.map(permission => (
                        <div 
                          key={permission.id}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            {permission.isGranted ? (
                              <CheckCircle className="w-4 h-4 text-ss-success" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400" />
                            )}
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-healthcare-sm font-medium text-healthcare-primary">
                                  {permission.name}
                                </span>
                                
                                <Badge className={cn('text-xs', levelConfig[permission.level].color)}>
                                  {levelConfig[permission.level].label}
                                </Badge>
                                
                                {showInheritance && permission.inheritedFrom && (
                                  <Badge className={cn('text-xs', inheritanceConfig[permission.inheritedFrom].color)}>
                                    {inheritanceConfig[permission.inheritedFrom].label}
                                  </Badge>
                                )}
                                
                                {permission.isDangerous && (
                                  <Badge className="bg-red-100 text-red-700 text-xs">
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Elevated
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-healthcare-xs text-gray-600 mt-0.5">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {onViewDetails && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onViewDetails(permission.id)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {!readOnly && onPermissionToggle && (
                              <Button
                                size="sm"
                                variant={permission.isGranted ? "outline" : "default"}
                                onClick={() => onPermissionToggle(permission.id, !permission.isGranted)}
                                className={permission.isGranted ? "" : "bg-ss-teal hover:bg-ss-teal-deep"}
                              >
                                {permission.isGranted ? (
                                  <Lock className="w-3 h-3 mr-1" />
                                ) : (
                                  <Unlock className="w-3 h-3 mr-1" />
                                )}
                                {permission.isGranted ? 'Revoke' : 'Grant'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PermissionIndicator.displayName = 'PermissionIndicator';