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
import { Edit2, AlertCircle, ArrowLeft } from 'lucide-react';
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

/**
 * Edit Participant Page (Story 7.4)
 *
 * Form for system admins to edit existing participants.
 */
export default function EditParticipantPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as Id<'companies'>;
  const participantId = params.participantId as Id<'participants'>;
  const { user, sessionToken } = useAuth();

  // Form state - DO NOT initialize siteId with empty string (causes Select controlled/uncontrolled issue)
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    ndisNumber: string;
    dateOfBirth: string;
    supportLevel: 'high' | 'medium' | 'low';
    siteId: Id<'sites'> | undefined;
    contactPhone: string;
    emergencyContact: string;
    careNotes: string;
    status: 'active' | 'inactive' | 'discharged';
  }>({
    firstName: '',
    lastName: '',
    ndisNumber: '',
    dateOfBirth: '',
    supportLevel: 'medium',
    siteId: undefined, // Changed from '' to undefined
    contactPhone: '',
    emergencyContact: '',
    careNotes: '',
    status: 'active',
  });

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

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

  const participant = useQuery(
    api['participants/admin'].getParticipantById,
    sessionToken && participantId
      ? { sessionToken, participantId }
      : 'skip'
  );

  // LOGGING: Raw participant data from query
  useEffect(() => {
    console.log('🔍 EDIT PAGE - Raw participant query result:', {
      participant,
      participantId,
      isLoaded,
    });
  }, [participant, participantId, isLoaded]);

  // LOGGING: Sites data
  useEffect(() => {
    if (sites) {
      console.log('🔍 EDIT PAGE - Sites loaded:', {
        count: sites.length,
        sites: sites.map((s: any) => ({ id: s._id, name: s.name }))
      });
    }
  }, [sites]);

  // Load participant data into form
  useEffect(() => {
    if (participant && !isLoaded) {
      console.log('🔍 EDIT PAGE - Loading participant data into form:', {
        participant_site_id: participant.site_id,
        participant_site_name: participant.site?.name,
        all_participant_fields: participant,
      });

      const newFormData = {
        firstName: participant.first_name,
        lastName: participant.last_name,
        ndisNumber: participant.ndis_number,
        dateOfBirth: participant.date_of_birth,
        supportLevel: participant.support_level,
        siteId: participant.site_id,
        contactPhone: participant.contact_phone || '',
        emergencyContact: participant.emergency_contact || '',
        careNotes: participant.care_notes || '',
        status: participant.status,
      };

      console.log('🔍 EDIT PAGE - Setting formData to:', newFormData);

      setFormData(newFormData);
      // Clear any validation errors on initial load
      setErrors({});
      setFormError('');
      setIsLoaded(true);
    }
  }, [participant, isLoaded]);

  // LOGGING: Form data changes
  useEffect(() => {
    console.log('🔍 EDIT PAGE - Current formData state:', {
      siteId: formData.siteId,
      siteId_type: typeof formData.siteId,
      siteId_value: formData.siteId,
      all_formData: formData,
    });
  }, [formData]);

  // Mutations
  const updateParticipant = useMutation(api['participants/admin'].updateParticipant);

  // Field validation (runs on blur)
  const validateField = (field: keyof FormErrors, value: any) => {
    console.log('🔍 EDIT PAGE - validateField called:', {
      field,
      value,
      value_type: typeof value,
      current_errors: errors,
    });

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

    console.log('🔍 EDIT PAGE - validateField result:', {
      field,
      newErrors,
      has_error_for_field: !!newErrors[field],
    });

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
              System administrator access required to edit participants.
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
      await updateParticipant({
        sessionToken,
        participantId,
        siteId: formData.siteId as Id<'sites'>,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        ndisNumber: formData.ndisNumber.trim(),
        dateOfBirth: formData.dateOfBirth,
        supportLevel: formData.supportLevel,
        contactPhone: formData.contactPhone.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        careNotes: formData.careNotes.trim() || undefined,
        status: formData.status,
      });

      toast.success('Participant updated successfully');
      router.push(`/admin/companies/${companyId}/participants`);
    } catch (err: any) {
      const errorMessage = err.data?.message || 'Failed to update participant';
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

  // Show loading state
  if (!participant) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-gray-500">Loading participant...</div>
      </div>
    );
  }

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
        title={`Edit Participant - ${participant.first_name} ${participant.last_name}`}
        description={`Company: ${company?.name || 'Loading...'}`}
        icon={<Edit2 className="h-6 w-6" />}
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
                  onChange={(e) => {
                    console.log('🔍 EDIT PAGE - Date of Birth onChange:', {
                      new_value: e.target.value,
                      previous_value: formData.dateOfBirth,
                      isLoaded,
                    });
                    setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }));
                  }}
                  onBlur={(e) => {
                    console.log('🔍 EDIT PAGE - Date of Birth onBlur:', {
                      value: e.target.value,
                      isLoaded,
                    });
                    validateField('dateOfBirth', e.target.value);
                  }}
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
                    console.log('🔍 EDIT PAGE - Site Select onValueChange triggered:', {
                      new_value: value,
                      previous_siteId: formData.siteId,
                      isLoaded,
                    });
                    // Only update if we have a real value (not empty string from component initialization)
                    if (value) {
                      setFormData(prev => ({ ...prev, siteId: value as Id<'sites'> }));
                      // Only validate if data has already loaded (user-initiated change, not initial load)
                      if (isLoaded) {
                        validateField('siteId', value);
                      }
                    }
                  }}
                  disabled={!sites || sites.length === 0}
                >
                  <SelectTrigger id="siteId" className={errors.siteId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a site" />
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
                  onValueChange={(value) => {
                    console.log('🔍 EDIT PAGE - Support Level Select onValueChange:', {
                      new_value: value,
                      previous_value: formData.supportLevel,
                      isLoaded,
                    });
                    // Ignore empty string events from Select component initialization
                    if (value) {
                      setFormData(prev => ({ ...prev, supportLevel: value as 'high' | 'medium' | 'low' }));
                    }
                  }}
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

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  console.log('🔍 EDIT PAGE - Status Select onValueChange:', {
                    new_value: value,
                    previous_value: formData.status,
                    isLoaded,
                  });
                  // Ignore empty string events from Select component initialization
                  if (value) {
                    setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' | 'discharged' }));
                  }
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
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
                Update Participant
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
