'use client';

import React, { useState, useEffect } from 'react';
import { Company, CompanyUpdateForm, COMPANY_STATUSES } from '@/types/company';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@starter/ui';
import { Building2, Mail, AlertCircle, Save, X } from 'lucide-react';

interface CompanyEditFormProps {
  company: Company;
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (formData: CompanyUpdateForm) => Promise<void>;
  onCancel: () => void;
}

export function CompanyEditForm({ 
  company, 
  isSubmitting = false, 
  error = null,
  onSubmit, 
  onCancel 
}: CompanyEditFormProps) {
  const [formData, setFormData] = useState<CompanyUpdateForm>({
    name: company.name,
    contact_email: company.contact_email,
    status: company.status,
  });
  
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    contact_email?: string;
  }>({});

  const [hasChanges, setHasChanges] = useState(false);

  // Check for changes
  useEffect(() => {
    const changed = 
      formData.name !== company.name ||
      formData.contact_email !== company.contact_email ||
      formData.status !== company.status;
    setHasChanges(changed);
  }, [formData, company]);

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Company name must be at least 2 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.contact_email.trim()) {
      errors.contact_email = 'Contact email is required';
    } else if (!emailRegex.test(formData.contact_email.trim())) {
      errors.contact_email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        contact_email: formData.contact_email.toLowerCase().trim(),
        status: formData.status,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof CompanyUpdateForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors for the field being edited
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Company Information
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
              Update your organization&apos;s details and settings
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label
              htmlFor="company-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="company-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isSubmitting}
                className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 ${
                  validationErrors.name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter company name"
              />
            </div>
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label
              htmlFor="contact-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Contact Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="contact-email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange('contact_email', e.target.value)}
                disabled={isSubmitting}
                className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 ${
                  validationErrors.contact_email 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter contact email"
              />
            </div>
            {validationErrors.contact_email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {validationErrors.contact_email}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Status *
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select company status" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div>
                      <div className="font-medium">{status.label}</div>
                      <div className="text-sm text-gray-500">{status.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>

          {hasChanges && !isSubmitting && (
            <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              You have unsaved changes
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}