'use client';
// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { UserPlus, AlertCircle, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@starter/ui/select';
import { Textarea } from '@starter/ui/textarea';
import { toast } from 'sonner';

// Required for Cloudflare Pages deployment
export const runtime = 'edge';

/**
 * Create Participant Page (Story 7.4)
 *
 * Form for system admins to create new participants.
 * Includes auto-selection logic: if company has only 1 site, auto-select it.
 */
// Form validation types
interface FormErrors {
  firstName?: string;
  lastName?: string;
  ndisNumber?: string;
  dateOfBirth?: string;
  siteId?: string;
  contactPhone?: string;
  emergencyContact?: string;
  careNotes?: string;
}

export default function CreateParticipantPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as Id<'companies'>;
  const { user, sessionToken } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ndisNumber: '',
    dateOfBirth: '',
    supportLevel: 'medium' as 'high' | 'medium' | 'low',
    siteId: '' as Id<'sites'> | '',
    contactPhone: '',
    emergencyContact: '',
    careNotes: '',
  });

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');

  // Queries
  const company = useQuery(
    api['companies/getCompanyDetails'].default,
    sessionToken && companyId
      ? { sessionToken, companyId }
      : 'skip'
  );

  const sites = useQuery(
    api['sites/admin'].listSites,
    sessionToken && companyId
      ? { sessionToken, companyId }
      : 'skip'
  );

  // Auto-select site if company has exactly one site (AC: 5)
  useEffect(() => {
    if (sites && sites.length === 1 && !formData.siteId) {
      setFormData(prev => ({ ...prev, siteId: sites[0]._id }));
      // Clear any existing site validation error when auto-selecting
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.siteId;
        return newErrors;
      });
    }
  }, [sites, formData.siteId]);

  // Mutations
  const createParticipant = useMutation(api['participants/admin'].createParticipant);

  // Field validation (runs on blur)
  const validateField = (field: keyof FormErrors, value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = 'First name is required';
        } else if (value.trim().length < 2) {
          newErrors.firstName = 'First name must be at least 2 characters';
        } else {
          delete newErrors.firstName;
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = 'Last name is required';
        } else if (value.trim().length < 2) {
          newErrors.lastName = 'Last name must be at least 2 characters';
        } else {
          delete newErrors.lastName;
        }
        break;

      case 'ndisNumber':
        if (!value.trim()) {
          newErrors.ndisNumber = 'NDIS number is required';
        } else if (!/^\d{9}$/.test(value.trim())) {
          newErrors.ndisNumber = 'NDIS number must be exactly 9 digits';
        } else {
          delete newErrors.ndisNumber;
        }
        break;

      case 'dateOfBirth':
        if (!value) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const minDate = new Date('1900-01-01');

          if (birthDate > today) {
            newErrors.dateOfBirth = 'Date of birth cannot be in the future';
          } else if (birthDate < minDate) {
            newErrors.dateOfBirth = 'Date of birth must be after 1900';
          } else {
            delete newErrors.dateOfBirth;
          }
        }
        break;

      case 'siteId':
        if (!value) {
          newErrors.siteId = 'Please select a site';
        } else {
          delete newErrors.siteId;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Form validation (runs on submit)
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.ndisNumber.trim()) {
      newErrors.ndisNumber = 'NDIS number is required';
    } else if (!/^\d{9}$/.test(formData.ndisNumber.trim())) {
      newErrors.ndisNumber = 'NDIS number must be exactly 9 digits';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date('1900-01-01');

      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      } else if (birthDate < minDate) {
        newErrors.dateOfBirth = 'Date of birth must be after 1900';
      }
    }

    if (!formData.siteId) {
      newErrors.siteId = 'Please select a site';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setFormError('Please fix the errors above before submitting');
      return false;
    }

    return true;
  };

  // Check if user is system admin
  if (!user || user.role !== 'system_admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              System administrator access required to create participants.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); // Clear previous form-level errors

    if (!sessionToken) return;

    // Run form validation
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    try {
      await createParticipant({
        sessionToken,
        companyId,
        siteId: formData.siteId as Id<'sites'>,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        ndisNumber: formData.ndisNumber.trim(),
        dateOfBirth: formData.dateOfBirth,
        supportLevel: formData.supportLevel,
        contactPhone: formData.contactPhone.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        careNotes: formData.careNotes.trim() || undefined,
      });

      toast.success('Participant created successfully');
      router.push(`/admin/companies/${companyId}/participants`);
    } catch (err: any) {
      const errorMessage = err.data?.message || 'Failed to create participant';
      setFormError(errorMessage); // Show in alert banner

      // If backend specifies a field error (e.g., duplicate NDIS)
      if (err.data?.field) {
        setErrors(prev => ({
          ...prev,
          [err.data.field === 'ndis_number' ? 'ndisNumber' : err.data.field]: errorMessage
        }));
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/companies/${companyId}/participants`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Participants
        </Button>
      </div>

      <AdminPageHeader
        title={`Add Participant - ${company?.name || 'Loading...'}`}
        description="Create a new participant for this company"
        icon={<UserPlus className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Participant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form-level error banner */}
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  onBlur={(e) => validateField('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  onBlur={(e) => validateField('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ndisNumber">NDIS Number *</Label>
                <Input
                  id="ndisNumber"
                  placeholder="123456789 (9 digits)"
                  value={formData.ndisNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, ndisNumber: e.target.value }))}
                  onBlur={(e) => validateField('ndisNumber', e.target.value)}
                  className={errors.ndisNumber ? 'border-red-500' : ''}
                />
                {errors.ndisNumber && (
                  <p className="text-sm text-red-500">{errors.ndisNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  onBlur={(e) => validateField('dateOfBirth', e.target.value)}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
                )}
              </div>
            </div>

            {/* Site and Support Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteId">Site *</Label>
                <Select
                  value={formData.siteId}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, siteId: value as Id<'sites'> }));
                    validateField('siteId', value);
                  }}
                  disabled={!sites || sites.length === 0}
                >
                  <SelectTrigger id="siteId" className={errors.siteId ? 'border-red-500' : ''}>
                    <SelectValue placeholder={sites && sites.length === 1 ? sites[0].name : "Select a site"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sites?.map((site: any) => (
                      <SelectItem key={site._id} value={site._id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.siteId && (
                  <p className="text-sm text-red-500">{errors.siteId}</p>
                )}
                {sites && sites.length === 1 && !errors.siteId && (
                  <p className="text-xs text-gray-500">
                    Automatically selected (company has only one site)
                  </p>
                )}
                {!sites || sites.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No sites available. Please create a site first.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supportLevel">Support Level *</Label>
                <Select
                  value={formData.supportLevel}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supportLevel: value as 'high' | 'medium' | 'low' }))}
                  required
                >
                  <SelectTrigger id="supportLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Contact Information (Optional)</h3>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="0412 345 678"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Jane Smith (Mother) - 0411 222 333"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careNotes">Care Notes</Label>
                <Textarea
                  id="careNotes"
                  placeholder="Any important care information..."
                  value={formData.careNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, careNotes: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/admin/companies/${companyId}/participants`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!sites || sites.length === 0}
              >
                Create Participant
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
