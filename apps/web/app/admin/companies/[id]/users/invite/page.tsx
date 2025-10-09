'use client';

import React, { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@starter/ui/select';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { UserPlus, Check, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';

interface InviteUserPageProps {
  params: {
    id: Id<'companies'>;
  };
}

interface FormData {
  email: string;
  role: 'company_admin' | 'team_lead' | 'frontline_worker';
}

interface FormErrors {
  email?: string;
  role?: string;
}

export default function InviteUserPage({ params }: InviteUserPageProps) {
  const { user, sessionToken } = useAuth();
  const router = useRouter();

  const company = useQuery(api["companies/getCompanyDetails"].default, {
    companyId: params.id,
    sessionToken: sessionToken || '',
  });

  const sendInvitation = useAction(api["users/invite/sendUserInvitation"].default);

  const [formData, setFormData] = useState<FormData>({
    email: '',
    role: 'frontline_worker',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Permission check
  if (!user || !['system_admin', 'company_admin'].includes(user.role)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to invite users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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
    setError(null);
    setSuccess(null);

    try {
      const result = await sendInvitation({
        email: formData.email,
        role: formData.role,
        companyId: params.id,
        sessionToken: sessionToken || '',
      });

      setSuccess(`Invitation sent successfully to ${formData.email}! They will receive an email with instructions to create their account.`);

      // Reset form
      setFormData({
        email: '',
        role: 'frontline_worker',
      });

      // Redirect to user management page after 3 seconds
      setTimeout(() => {
        router.push(`/admin/companies/${params.id}/users`);
      }, 3000);

    } catch (err: any) {
      console.error('Invitation failed:', err);
      const errorMessage = err.message || 'Failed to send invitation. Please try again.';

      // Handle specific error cases
      if (errorMessage.includes('already registered with a company')) {
        setError(
          'This email address is already registered with a company. ' +
          'Each user can only belong to one company in the system.'
        );
      } else if (errorMessage.includes('invitation has already been sent')) {
        setError(
          'An invitation has already been sent to this email address. ' +
          'You can revoke the existing invitation from the user management page and send a new one.'
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title={`Invite User - ${company?.name || 'Loading...'}`}
        description="Send an email invitation to a new team member"
        icon={<UserPlus className="h-6 w-6" />}
      />

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              User Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                <Check className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="user@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                  autoFocus
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  The user will receive an email with an invitation link to create their account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontline_worker">Frontline Worker</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Frontline workers capture incidents. Team leads analyze incidents. Company admins manage the organization.
                </p>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/companies/${params.id}/users`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
