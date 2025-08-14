'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@starter/ui/select';
import { Checkbox } from '@starter/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@starter/ui/card';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { 
  User, 
  Mail, 
  Shield, 
  Crown, 
  Users, 
  TestTube,
  AlertCircle,
  X,
  Save,
  Loader2 
} from 'lucide-react';

interface UserFormData {
  name: string;
  email: string;
  role: 'system_admin' | 'demo_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  has_llm_access: boolean;
}

interface UserFormProps {
  user?: {
    _id: string;
    name: string;
    email: string;
    role: 'system_admin' | 'demo_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
    has_llm_access?: boolean;
    protection?: {
      isProtected: boolean;
      protectionReason?: string;
    };
  };
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  canCreateSystemAdmin?: boolean;
  title?: string;
  className?: string;
}

const ROLE_OPTIONS = [
  { 
    value: 'frontline_worker', 
    label: 'Frontline Worker',
    icon: User,
    description: 'Basic incident creation and editing'
  },
  { 
    value: 'team_lead', 
    label: 'Team Lead',
    icon: Users,
    description: 'Team management and incident analysis'
  },
  { 
    value: 'company_admin', 
    label: 'Company Admin',
    icon: Shield,
    description: 'Full company user and data management'
  },
  { 
    value: 'demo_admin', 
    label: 'Demo Admin',
    icon: TestTube,
    description: 'Company admin with demonstration and testing capabilities'
  },
  { 
    value: 'system_admin', 
    label: 'System Admin',
    icon: Crown,
    description: 'Global system access and configuration'
  }
];

/**
 * User creation and editing form component
 * Story 2.6 AC 2.6.1: Company-Level User Management
 * Story 2.6 AC 2.6.5: User Interface Requirements
 */
export function UserForm({
  user,
  onSubmit,
  onCancel,
  loading = false,
  canCreateSystemAdmin = false,
  title,
  className = ''
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'frontline_worker',
    has_llm_access: user?.has_llm_access || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!user;
  const isProtected = user?.protection?.isProtected || false;
  const protectionReason = user?.protection?.protectionReason;

  // Auto-save draft (simplified for this implementation)
  useEffect(() => {
    const draft = localStorage.getItem('userFormDraft');
    if (draft && !isEditing) {
      try {
        const draftData = JSON.parse(draft);
        setFormData(draftData);
      } catch (e) {
        // Ignore invalid draft
      }
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('userFormDraft', JSON.stringify(formData));
    }
  }, [formData, isEditing]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Owner email protection
    if (formData.email === 'david@ideasmen.com.au' && !isEditing) {
      newErrors.email = 'Cannot create user with owner email address';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Clear draft on successful submission
      if (!isEditing) {
        localStorage.removeItem('userFormDraft');
      }
    } catch (error) {
      // Error handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCancel = () => {
    if (!isEditing) {
      localStorage.removeItem('userFormDraft');
    }
    onCancel();
  };

  const getDefaultTitle = () => {
    return isEditing ? `Edit User: ${user?.name}` : 'Create New User';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {title || getDefaultTitle()}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {isProtected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {protectionReason}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting || isProtected}
              className={errors.name ? 'border-red-500' : ''}
              placeholder="Enter user's full name"
            />
            {errors.name && (
              <div className="text-sm text-red-600">{errors.name}</div>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isSubmitting || isProtected}
              className={errors.email ? 'border-red-500' : ''}
              placeholder="user@company.com"
            />
            {errors.email && (
              <div className="text-sm text-red-600">{errors.email}</div>
            )}
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
              disabled={isSubmitting || isProtected}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(option => {
                  // Hide system_admin option if user can't create system admins
                  if (option.value === 'system_admin' && !canCreateSystemAdmin) {
                    return null;
                  }
                  
                  const IconComponent = option.icon;
                  
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {/* Role Description Display */}
            {formData.role && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const selectedRole = ROLE_OPTIONS.find(r => r.value === formData.role);
                    if (!selectedRole) return null;
                    const IconComponent = selectedRole.icon;
                    return (
                      <>
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{selectedRole.label}</span>
                      </>
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ROLE_OPTIONS.find(r => r.value === formData.role)?.description}
                </p>
              </div>
            )}
            
            {errors.role && (
              <div className="text-sm text-red-600">{errors.role}</div>
            )}
          </div>

          {/* LLM Access Field */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="llm_access"
              checked={formData.has_llm_access}
              onCheckedChange={(checked) => handleInputChange('has_llm_access', checked)}
              disabled={isSubmitting || isProtected}
            />
            <Label htmlFor="llm_access" className="flex-1">
              <div>Enable AI/LLM Access</div>
              <div className="text-xs text-muted-foreground">
                Allow this user to access AI-powered features and analysis
              </div>
            </Label>
          </div>

          {/* System Admin Warning */}
          {formData.role === 'system_admin' && (
            <Alert>
              <Crown className="h-4 w-4" />
              <AlertDescription>
                <strong>System Administrator Access:</strong> This role grants full system access 
                including user management across all companies. Only assign to trusted users.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || isProtected}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update User' : 'Create User'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}