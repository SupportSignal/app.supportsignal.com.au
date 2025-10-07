'use client';

import React from 'react';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Card, CardContent } from '@starter/ui/card';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { 
  User, 
  Users, 
  Shield, 
  Crown, 
  TestTube,
  Check,
  AlertCircle 
} from 'lucide-react';

type Role = 'system_admin' | 'demo_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';

interface RoleOption {
  value: Role;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  permissions: string[];
  color: string;
  bgColor: string;
}

interface RoleSelectorProps {
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
  disabled?: boolean;
  canSelectSystemAdmin?: boolean;
  showPermissions?: boolean;
  className?: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'frontline_worker',
    label: 'Frontline Worker',
    icon: User,
    description: 'Basic incident creation and editing capabilities',
    permissions: [
      'Create incidents',
      'Edit own incidents (capture phase)',
      'View basic reports'
    ],
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200'
  },
  {
    value: 'team_lead',
    label: 'Team Lead',
    icon: Users,
    description: 'Team management and incident analysis',
    permissions: [
      'All Frontline Worker permissions',
      'View team incidents',
      'Perform incident analysis',
      'Generate team reports'
    ],
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200'
  },
  {
    value: 'company_admin',
    label: 'Company Admin',
    icon: Shield,
    description: 'Full company management and user administration',
    permissions: [
      'All Team Lead permissions',
      'Manage company users',
      'View all company incidents',
      'Company configuration',
      'Invite new users'
    ],
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
  },
  {
    value: 'demo_admin',
    label: 'Demo Admin',
    icon: TestTube,
    description: 'Company admin with demonstration and testing capabilities',
    permissions: [
      'All Company Admin permissions',
      'Access sample data for demos',
      'Testing and demonstration features',
      'Full company scope access'
    ],
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
  },
  {
    value: 'system_admin',
    label: 'System Administrator',
    icon: Crown,
    description: 'Global system access and cross-company management',
    permissions: [
      'All Demo Admin permissions',
      'Manage all companies',
      'System configuration',
      'User impersonation',
      'Global reporting and analytics'
    ],
    color: 'text-red-700',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200'
  }
];

/**
 * Role selector component with permission preview
 * Story 2.6 AC 2.6.1: Company-Level User Management
 * Story 2.6 AC 2.6.4: Role-Based Access Control
 */
export function RoleSelector({
  selectedRole,
  onRoleChange,
  disabled = false,
  canSelectSystemAdmin = false,
  showPermissions = false,
  className = ''
}: RoleSelectorProps) {
  
  const handleRoleSelect = (role: Role) => {
    if (disabled) return;
    if (role === 'system_admin' && !canSelectSystemAdmin) return;
    onRoleChange(role);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid gap-3">
        {ROLE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedRole === option.value;
          const isDisabled = disabled || (option.value === 'system_admin' && !canSelectSystemAdmin);
          
          return (
            <Card
              key={option.value}
              className={`transition-all cursor-pointer ${
                isDisabled 
                  ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                  : isSelected
                  ? `${option.bgColor} border-2`
                  : 'hover:bg-gray-50 border'
              }`}
              onClick={() => !isDisabled && handleRoleSelect(option.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${
                    isSelected ? option.bgColor : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isSelected ? option.color : 'text-gray-500'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${
                        isSelected ? option.color : 'text-gray-900'
                      }`}>
                        {option.label}
                      </h3>
                      
                      {isSelected && (
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                      
                      {option.value === 'system_admin' && !canSelectSystemAdmin && (
                        <Badge variant="outline" className="text-xs">
                          Restricted
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {option.description}
                    </p>
                    
                    {showPermissions && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700 mb-2">
                          Key Permissions:
                        </div>
                        <div className="space-y-1">
                          {option.permissions.map((permission, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                              <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0" />
                              {permission}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* System Admin Warning */}
      {selectedRole === 'system_admin' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> System Administrator role grants unrestricted access 
            to all system functions. Only assign to fully trusted users who require 
            cross-company management capabilities.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Restriction Notice */}
      {!canSelectSystemAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> System Administrator role can only be assigned by existing 
            system administrators and is restricted to users from the root company.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}