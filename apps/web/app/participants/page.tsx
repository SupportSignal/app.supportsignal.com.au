// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { ParticipantList, ParticipantForm, Participant } from '@/components/participants';
import { Card, CardHeader, CardTitle, CardContent } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

/**
 * NDIS Participants Management Page
 * Implements Story 2.3 requirements for participant management
 * 
 * Features:
 * - Role-based access control (team_lead+)
 * - Searchable participant list
 * - Create/Edit participant forms
 * - Mobile-responsive interface
 */
export default function ParticipantsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  // Check authentication and authorization
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    } else if (user && !['system_admin', 'company_admin', 'team_lead'].includes(user.role)) {
      // Redirect unauthorized users
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleCreateParticipant = () => {
    setSelectedParticipant(null);
    setViewMode('create');
  };

  const handleEditParticipant = (participant: Participant) => {
    setSelectedParticipant(participant);
    setViewMode('edit');
  };

  const handleViewParticipant = (participant: Participant) => {
    setSelectedParticipant(participant);
    setViewMode('view');
  };

  const handleFormSuccess = (participantId: string) => {
    // On successful create/edit, return to list view
    setViewMode('list');
    setSelectedParticipant(null);
    // TODO: Show success message
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedParticipant(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Check if user has required permissions
  if (!['system_admin', 'company_admin', 'team_lead'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You don&apos;t have permission to access participant management. 
                Only team leads, company administrators, and system administrators can manage participants.
              </p>
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline">Return to Dashboard</Button>
                </Link>
                <Link href="/">
                  <Button>Go Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getUserRoleBadge = () => {
    const roleConfig = {
      system_admin: { label: 'System Admin', color: 'bg-red-100 text-red-800' },
      company_admin: { label: 'Company Admin', color: 'bg-purple-100 text-purple-800' },
      team_lead: { label: 'Team Lead', color: 'bg-blue-100 text-blue-800' },
    };
    
    const config = roleConfig[user.role as keyof typeof roleConfig];
    return config ? (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <span className="mr-1">←</span>
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-900 dark:text-white">Participants</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {getUserRoleBadge()}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.name}
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                NDIS Participants
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Manage NDIS participant records for your organization
              </p>
            </div>
            
            {viewMode === 'list' && (
              <Button
                onClick={handleCreateParticipant}
                className="whitespace-nowrap"
              >
                + Add Participant
              </Button>
            )}
            
            {viewMode !== 'list' && (
              <Button
                variant="outline"
                onClick={() => setViewMode('list')}
                className="whitespace-nowrap"
              >
                ← Back to List
              </Button>
            )}
          </div>

          {/* View Mode Indicator */}
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
            <span>Current view:</span>
            <Badge variant="outline">
              {viewMode === 'list' && '📋 Participant List'}
              {viewMode === 'create' && '➕ Create New Participant'}
              {viewMode === 'edit' && `✏️ Edit ${selectedParticipant?.first_name} ${selectedParticipant?.last_name}`}
              {viewMode === 'view' && `👁️ View ${selectedParticipant?.first_name} ${selectedParticipant?.last_name}`}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {viewMode === 'list' && (
            <ParticipantList
              onCreateParticipant={handleCreateParticipant}
              onEditParticipant={handleEditParticipant}
              onViewParticipant={handleViewParticipant}
              showCreateButton={false} // Already have create button in header
            />
          )}

          {viewMode === 'create' && (
            <div className="flex justify-center">
              <ParticipantForm
                mode="create"
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          )}

          {viewMode === 'edit' && selectedParticipant && (
            <div className="flex justify-center">
              <ParticipantForm
                participant={selectedParticipant}
                mode="edit"
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          )}

          {viewMode === 'view' && selectedParticipant && (
            <div className="flex justify-center">
              <Card className="w-full max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Participant Details
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditParticipant(selectedParticipant)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">First Name</label>
                        <p className="text-gray-900">{selectedParticipant.first_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Name</label>
                        <p className="text-gray-900">{selectedParticipant.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-gray-900">
                          {new Date(selectedParticipant.date_of_birth).toLocaleDateString('en-AU')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">NDIS Number</label>
                        <p className="text-gray-900">{selectedParticipant.ndis_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="text-gray-900">{selectedParticipant.contact_phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                        <p className="text-gray-900">{selectedParticipant.emergency_contact || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Care Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Care Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Support Level</label>
                        <p className="text-gray-900 capitalize">{selectedParticipant.support_level}</p>
                      </div>
                      {selectedParticipant.care_notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Care Notes</label>
                          <p className="text-gray-900">{selectedParticipant.care_notes}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <p className="text-gray-900 capitalize">{selectedParticipant.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Organization</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="text-gray-900">{user?.company_id ? 'Associated with your organization' : 'No company association'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Participants are isolated by company for data security and privacy
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Record Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="text-gray-900">
                          {new Date(selectedParticipant.created_at).toLocaleString('en-AU')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-gray-900">
                          {new Date(selectedParticipant.updated_at).toLocaleString('en-AU')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Help Text for Role Permissions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Participant Management Permissions
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>Your access level ({user.role}):</strong></p>
            <ul className="ml-4 space-y-1 list-disc">
              <li>Create and manage NDIS participant records</li>
              <li>Edit participant information and status</li>
              <li>Search and filter participants within your company</li>
              <li>Associate participants with incident reports</li>
              {user.role === 'system_admin' && <li>Access participants across all companies</li>}
              {(user.role === 'system_admin' || user.role === 'company_admin') && <li>Manage user roles and permissions</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}