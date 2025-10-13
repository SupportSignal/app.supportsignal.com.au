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
  MapPin,
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
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { toast } from 'sonner';

// Required for Cloudflare Pages deployment
export const runtime = 'edge';

/**
 * Sites Management Page (Story 7.3)
 *
 * Allows system admins to manage sites (physical locations) for a company.
 * Sites are used to organize participants and incidents by location.
 */
export default function SitesManagementPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as Id<'companies'>;
  const { user, sessionToken } = useAuth();

  // State for dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [siteName, setSiteName] = useState('');

  // Check permission before executing queries
  const hasPermission = user && user.role === 'system_admin';

  // Queries - only execute if user has permission
  const company = useQuery(
    api['companies/getCompanyDetails'].default,
    sessionToken && companyId && hasPermission
      ? { sessionToken, companyId }
      : 'skip'
  );

  // Only fetch sites if company exists (backend returns null for deleted companies)
  const canFetchSites = sessionToken && companyId && hasPermission && company !== null;
  const sites = useQuery(
    api['sites/admin'].listSites,
    canFetchSites ? { sessionToken, companyId } : 'skip'
  );

  // Mutations
  const createSite = useMutation(api['sites/admin'].createSite);
  const updateSite = useMutation(api['sites/admin'].updateSite);
  const deleteSite = useMutation(api['sites/admin'].deleteSite);

  // Check if user is system admin
  if (!user || user.role !== 'system_admin') {
    return (
      <UnauthorizedAccessCard
        message="System administrator access required to manage sites."
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

  // Handle create site
  const handleCreate = async () => {
    if (!sessionToken) return;

    try {
      await createSite({
        sessionToken,
        companyId,
        name: siteName.trim(),
      });

      toast.success('Site created successfully');
      setSiteName('');
      setIsCreateOpen(false);
    } catch (err: any) {
      const errorMessage = err.data?.message || 'Failed to create site';
      toast.error(errorMessage);
    }
  };

  // Handle update site
  const handleUpdate = async () => {
    if (!sessionToken || !selectedSite) return;

    try {
      await updateSite({
        sessionToken,
        siteId: selectedSite._id,
        name: siteName.trim(),
      });

      toast.success('Site updated successfully');
      setSiteName('');
      setSelectedSite(null);
      setIsEditOpen(false);
    } catch (err: any) {
      const errorMessage = err.data?.message || 'Failed to update site';
      toast.error(errorMessage);
    }
  };

  // Handle delete site
  const handleDelete = async () => {
    if (!sessionToken || !selectedSite) return;

    try {
      await deleteSite({
        sessionToken,
        siteId: selectedSite._id,
      });

      toast.success('Site deleted successfully');
      setSelectedSite(null);
      setIsDeleteOpen(false);
    } catch (err: any) {
      const errorMessage = err.data?.message || 'Failed to delete site';
      toast.error(errorMessage);
      setIsDeleteOpen(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (site: any) => {
    setSelectedSite(site);
    setSiteName(site.name);
    setIsEditOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (site: any) => {
    setSelectedSite(site);
    setIsDeleteOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    setSiteName('');
    setIsCreateOpen(true);
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
        title={`Sites - ${company?.name || 'Loading...'}`}
        description="Manage physical locations for this company"
        icon={<MapPin className="h-6 w-6" />}
      />

      <div className="flex justify-end">
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Site
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sites</CardTitle>
        </CardHeader>
        <CardContent>
          {!sites ? (
            <div className="text-center py-8 text-gray-500">Loading sites...</div>
          ) : sites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sites found. Create your first site to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {sites.map((site: any) => (
                <div
                  key={site._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{site.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {site.participant_count} participant(s)
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Created: {new Date(site.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(site)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(site)}
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

      {/* Create Site Dialog */}
      <AlertDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Site</AlertDialogTitle>
            <AlertDialogDescription>
              Add a new physical location for this company.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-site-name">Site Name</Label>
              <Input
                id="create-site-name"
                placeholder="e.g., Main Office, North Branch"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleCreate} disabled={!siteName.trim()}>
              Create Site
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Site Dialog */}
      <AlertDialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Site</AlertDialogTitle>
            <AlertDialogDescription>
              Update the name of this site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-site-name">Site Name</Label>
              <Input
                id="edit-site-name"
                placeholder="e.g., Main Office, North Branch"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <Button onClick={handleUpdate} disabled={!siteName.trim()}>
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Site Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSite?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. You cannot delete the last site for a
                company, and sites with assigned participants cannot be deleted.
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
              Delete Site
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
