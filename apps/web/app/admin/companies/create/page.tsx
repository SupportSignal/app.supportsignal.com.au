'use client';
// @ts-nocheck - Temporary workaround for complex nested API type issues

import React, { useState } from 'react';
import { useMutation, useAction } from 'convex/react';
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
import { Building2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FormData {
  name: string;
  contactEmail: string;
  adminName: string;
  adminEmail: string;
  status: string;
}

interface FormErrors {
  name?: string;
  contactEmail?: string;
  adminName?: string;
  adminEmail?: string;
}

export default function CreateCompanyPage() {
  const { user, sessionToken } = useAuth();
  const router = useRouter();
  // Use real API mutation for company creation
  // @ts-ignore - Complex nested type issue workaround
  const createCompanyMutation = useMutation((api as any).companies.createCompany);

  // Email action for sending password reset emails (real emails via Cloudflare Worker)
  // @ts-ignore - Complex nested type issue workaround
  const sendPasswordResetEmail = useAction((api as any).email.sendPasswordResetEmail);

  const createCompany = async (args: any) => {
    try {
      const result = await createCompanyMutation(args);

      console.log('🔍 FRONTEND - COMPANY CREATED SUCCESSFULLY', {
        companyName: formData.name,
        status: formData.status,
        result: result,
        timestamp: new Date().toISOString()
      });

      // Send real password reset email via Cloudflare Worker
      if (result.resetToken && result.adminEmail) {
        try {
          console.log('🔍 FRONTEND - SENDING REAL PASSWORD RESET EMAIL', {
            email: result.adminEmail,
            token: result.resetToken
          });

          await sendPasswordResetEmail({
            email: result.adminEmail,
            token: result.resetToken,
          });

          console.log('🔍 FRONTEND - REAL EMAIL SENT SUCCESSFULLY');
        } catch (emailError) {
          console.error('🔍 FRONTEND - REAL EMAIL FAILED:', emailError);
          // Don't block company creation if email fails
        }
      }

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create company');
    }
  };

  const [formData, setFormData] = useState<FormData>({
    name: '',
    contactEmail: '',
    adminName: '',
    adminEmail: '',
    status: 'active',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  // Check if user is system admin
  if (!user || user.role !== 'system_admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              System administrator access required to create companies.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Admin name is required';
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = 'Please enter a valid email address';
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
      const result = await createCompany({
        name: formData.name,
        contactEmail: formData.contactEmail,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        status: formData.status,
        sessionToken,
      });

      setSuccess(`Company "${formData.name}" created successfully! Admin user "${formData.adminName}" has been created.`);

      // Reset form
      setFormData({
        name: '',
        contactEmail: '',
        adminName: '',
        adminEmail: '',
        status: 'active',
      });

      // Redirect to company list after 3 seconds
      setTimeout(() => {
        router.push('/admin/companies');
      }, 3000);

    } catch (error: any) {
      console.error('Company creation failed:', error);
      const errorMessage = error.message || 'Failed to create company. Please try again.';

      // Handle specific error cases with helpful guidance
      if (errorMessage.includes('already exists in the system')) {
        setError(
          'The admin email address is already registered in the system. ' +
          'Please use a different email address for the company administrator. ' +
          'If you need to transfer an existing user to this company, please contact support.'
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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Create New Company"
        description="Add a new organization to the SupportSignal platform"
        icon={<Building2 className="h-6 w-6" />}
      />

      <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      placeholder="e.g. ABC NDIS Provider"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Company Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleInputChange('contactEmail')}
                      placeholder="contact@company.com"
                      className={errors.contactEmail ? 'border-red-500' : ''}
                    />
                    {errors.contactEmail && (
                      <p className="text-sm text-red-500">{errors.contactEmail}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Company Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Initial Administrator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Admin Name *</Label>
                      <Input
                        id="adminName"
                        type="text"
                        value={formData.adminName}
                        onChange={handleInputChange('adminName')}
                        placeholder="John Doe"
                        className={errors.adminName ? 'border-red-500' : ''}
                      />
                      {errors.adminName && (
                        <p className="text-sm text-red-500">{errors.adminName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Admin Email *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={handleInputChange('adminEmail')}
                        placeholder="admin@company.com"
                        className={errors.adminEmail ? 'border-red-500' : ''}
                      />
                      {errors.adminEmail && (
                        <p className="text-sm text-red-500">{errors.adminEmail}</p>
                      )}
                    </div>
                  </div>
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
                      <Building2 className="h-4 w-4" />
                    )}
                    {isSubmitting ? 'Creating Company...' : 'Create Company'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/companies')}
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