'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from '@/components/auth/auth-provider';
import { CompanyDetailsView } from './CompanyDetailsView';
import { CompanyEditForm } from './CompanyEditForm';
import { Company, CompanyUpdateForm } from '@/types/company';
import { 
  Card,
  CardContent,
  Button,
  Alert,
  AlertDescription,
} from '@starter/ui';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

interface CompanyManagementPageProps {
  backUrl?: string;
  backLabel?: string;
}

export function CompanyManagementPage({ 
  backUrl = '/dashboard', 
  backLabel = 'Back to Dashboard' 
}: CompanyManagementPageProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Get current user's company information
  const companyData = useQuery(
    api.companies.getCompany.getCurrentUserCompany,
    user?.sessionToken ? { sessionToken: user.sessionToken } : 'skip'
  );

  // Company update mutation
  const updateCompany = useMutation(api.companies.updateCompany.updateCompany);

  // Clear success message after a few seconds
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => setUpdateSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  const handleEditClick = () => {
    setIsEditing(true);
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUpdateError(null);
  };

  const handleUpdateSubmit = async (formData: CompanyUpdateForm) => {
    if (!user?.sessionToken) {
      setUpdateError('Authentication required. Please log in again.');
      return;
    }

    try {
      setUpdateError(null);
      await updateCompany({
        sessionToken: user.sessionToken,
        name: formData.name,
        contact_email: formData.contact_email,
        status: formData.status,
      });
      
      setIsEditing(false);
      setUpdateSuccess(true);
    } catch (error) {
      console.error('Error updating company:', error);
      setUpdateError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while updating company information'
      );
    }
  };

  // Loading state
  if (companyData === undefined) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading company information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (companyData === null) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-400">
            Unable to load company information. Please ensure you have the necessary permissions and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const company = companyData as Company;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => window.location.href = backUrl}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
      </div>

      {/* Success Message */}
      {updateSuccess && (
        <div className="mb-6">
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/30 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Company information updated successfully!
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      {isEditing ? (
        <CompanyEditForm
          company={company}
          error={updateError}
          onSubmit={handleUpdateSubmit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <CompanyDetailsView
          company={company}
          canEdit={true} // Role-based access is handled by the backend
          onEditClick={handleEditClick}
        />
      )}
    </div>
  );
}