// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)
'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex-api';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CompanyEditPage() {
  const params = useParams();
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const companyId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    contact_email: '',
    status: 'active' as 'active' | 'trial' | 'suspended' | 'test',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch company data
  const company = useQuery(
    api.companies.admin.getCompanyForEdit,
    sessionToken ? { sessionToken, companyId } : 'skip'
  );

  const updateCompany = useMutation(api.companies.admin.updateCompany);

  // Populate form when company loads
  useEffect(() => {
    if (company) {
      console.log('[CompanyEdit] Loading company data:', {
        companyId: company._id,
        name: company.name,
        status: company.status,
        currentFormStatus: formData.status,
        currentErrors: errors
      });

      setFormData({
        name: company.name,
        contact_email: company.contact_email,
        status: company.status,
      });

      // Clear any validation errors when loading existing data (Story 7.4 pattern)
      setErrors({});

      console.log('[CompanyEdit] Form data updated:', {
        newStatus: company.status,
        errorsCleared: true
      });
    }
  }, [company]);

  // Redirect if not system admin
  if (user && user.role !== 'system_admin' && user.role !== 'demo_admin') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              System administrator access required for company editing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin">
              <Button variant="outline">Back to Admin</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Company name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Company name must be 100 characters or less';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.contact_email || !emailRegex.test(formData.contact_email)) {
      newErrors.contact_email = 'Valid email address is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

    if (!sessionToken) {
      toast.error('Please log in to edit company');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCompany({
        sessionToken,
        companyId,
        updates: {
          name: formData.name,
          contact_email: formData.contact_email,
          status: formData.status,
        },
      });

      toast.success('Company updated successfully');
      router.push('/admin/companies');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/companies');
  };

  // Handle loading and deleted company states
  if (company === undefined) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (company === null) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Not Found</CardTitle>
            <CardDescription>
              This company may have been deleted or you may not have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/companies">
              <Button>Return to Company Listing</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/companies">
          <Button variant="outline" size="sm">
            ← Back to Companies
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Company</CardTitle>
          <CardDescription>
            Update company information and settings
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) {
                    setErrors({ ...errors, name: '' });
                  }
                }}
                placeholder="Support Signal"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => {
                  setFormData({ ...formData, contact_email: e.target.value });
                  if (errors.contact_email) {
                    setErrors({ ...errors, contact_email: '' });
                  }
                }}
                placeholder="contact@company.com"
                className={errors.contact_email ? 'border-red-500' : ''}
              />
              {errors.contact_email && (
                <p className="text-sm text-red-500">{errors.contact_email}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  console.log('[CompanyEdit] Status changed by user:', value);
                  // Only update if value is valid (not empty)
                  if (value) {
                    setFormData({ ...formData, status: value as 'active' | 'trial' | 'suspended' | 'test' });
                    if (errors.status) {
                      setErrors({ ...errors, status: '' });
                    }
                  }
                }}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status}</p>
              )}
              {/* Debug info */}
              <p className="text-xs text-gray-400">
                Debug: formData.status = "{formData.status}", errors.status = "{errors.status || 'none'}"
              </p>
            </div>

            {/* Read-only fields */}
            <div className="space-y-2">
              <Label>Slug (Read-only)</Label>
              <Input
                value={company.slug}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500">Slug cannot be changed after creation</p>
            </div>

            <div className="space-y-2">
              <Label>Created Date</Label>
              <Input
                value={new Date(company.created_at).toLocaleString()}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
