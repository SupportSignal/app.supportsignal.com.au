// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { UnauthorizedAccessCard } from '@/components/admin/unauthorized-access-card';
import {
  Users,
  Plus,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@starter/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@starter/ui/select';
import { Label } from '@starter/ui/label';
import { toast } from 'sonner';

// Required for Cloudflare Pages deployment
export const runtime = 'edge';

/**
 * Participants List Page (Story 7.4)
 *
 * Allows system admins to view and manage participants for a company.
 * Includes filtering by site and navigation to create/edit pages.
 */
export default function ParticipantsListPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as Id<'companies'>;
  const { user, sessionToken } = useAuth();

  // State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<Id<'sites'> | 'all'>('all');

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

  const participants = useQuery(
    api['participants/admin'].listParticipants,
    sessionToken && companyId
      ? {
          sessionToken,
          companyId,
          siteId: selectedSiteId === 'all' ? undefined : selectedSiteId,
        }
      : 'skip'
  );

  // Mutations
  const deleteParticipant = useMutation(api['participants/admin'].deleteParticipant);

  // Check if user is system admin
  if (!user || user.role !== 'system_admin') {
    return (
      <UnauthorizedAccessCard
        message="System administrator access required to manage participants."
      />
    );
  }

  // Handle deleted company
  if (company === null) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Not Found</CardTitle>
            <div className="text-sm text-muted-foreground">
              This company may have been deleted or you may not have access to it.
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/admin/companies')}>
              Return to Company Listing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle delete participant
  const handleDelete = async () => {
    if (!sessionToken || !selectedParticipant) return;

    try {
      await deleteParticipant({
        sessionToken,
        participantId: selectedParticipant._id,
      });

      toast.success('Participant deleted successfully');
      setSelectedParticipant(null);
      setIsDeleteOpen(false);
    } catch (err: any) {
      const errorMessage = err.data?.message || 'Failed to delete participant';
      toast.error(errorMessage);
      setIsDeleteOpen(false);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (participant: any) => {
    setSelectedParticipant(participant);
    setIsDeleteOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/companies')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Companies
        </Button>
      </div>

      <AdminPageHeader
        title={`Participants - ${company?.name || 'Loading...'}`}
        description="Manage participants for this company"
        icon={<Users className="h-6 w-6" />}
      />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Label htmlFor="site-filter">Filter by Site</Label>
            <Select
              value={selectedSiteId}
              onValueChange={(value) => setSelectedSiteId(value as Id<'sites'> | 'all')}
            >
              <SelectTrigger id="site-filter">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites?.map((site: any) => (
                  <SelectItem key={site._id} value={site._id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => router.push(`/admin/companies/${companyId}/participants/create`)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Participant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedSiteId === 'all' ? 'All Participants' : `Participants - ${sites?.find((s: any) => s._id === selectedSiteId)?.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!participants ? (
            <div className="text-center py-8 text-gray-500">Loading participants...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No participants found. Add your first participant to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((participant: any) => (
                <div
                  key={participant._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {participant.first_name} {participant.last_name}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>NDIS: {participant.ndis_number}</p>
                        <p>DOB: {new Date(participant.date_of_birth).toLocaleDateString()}</p>
                        <p>Site: {participant.site?.name || 'Unknown'}</p>
                        <p>Support Level: <span className="capitalize">{participant.support_level}</span></p>
                        <p>Status: <span className="capitalize">{participant.status}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/companies/${companyId}/participants/${participant._id}/edit`)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(participant)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Participant Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedParticipant?.first_name} {selectedParticipant?.last_name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. Participants with associated incidents cannot be deleted.
              </AlertDescription>
            </Alert>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Participant
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
