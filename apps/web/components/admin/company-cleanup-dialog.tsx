// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from '@/components/auth/auth-provider';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@starter/ui/alert-dialog';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Trash2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompanyCleanupDialogProps {
  companyId: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyCleanupDialog({
  companyId,
  companyName,
  isOpen,
  onClose,
}: CompanyCleanupDialogProps) {
  const { sessionToken } = useAuth();
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview cleanup query
  const previewData = useQuery(
    api.companies.admin.previewTestCompanyCleanup,
    sessionToken && showPreview ? { sessionToken, companyId } : 'skip'
  );

  // Execute cleanup mutation
  const executeCleanup = useMutation(api.companies.admin.executeTestCompanyCleanup);

  const handleShowPreview = () => {
    setShowPreview(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToken) {
      toast.error('Please log in to delete company');
      return;
    }

    if (confirmationText !== companyName) {
      toast.error('Company name does not match');
      return;
    }

    setIsDeleting(true);

    try {
      const result = await executeCleanup({
        sessionToken,
        companyId,
      });

      toast.success(`Company "${result.companyName}" and all related data deleted successfully`);
      onClose();
      router.push('/admin/companies');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete company');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setShowPreview(false);
    setConfirmationText('');
    onClose();
  };

  const handleAutoFill = () => {
    setConfirmationText(companyName);
    toast.success('Auto-filled confirmation text');
  };

  const isConfirmationValid = confirmationText === companyName;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Test Company
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the company and all related data.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Company Info */}
          <Alert>
            <AlertDescription>
              <strong>Company:</strong> {companyName}
            </AlertDescription>
          </Alert>

          {/* Preview Section */}
          {!showPreview ? (
            <div className="flex justify-center py-4">
              <Button variant="outline" onClick={handleShowPreview}>
                Preview Data to be Deleted
              </Button>
            </div>
          ) : !previewData ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Data to be deleted:</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sites:</span>
                  <span className="font-medium">{previewData.sites.count}</span>
                </div>
                {previewData.sites.count > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                    {previewData.sites.names.join(', ')}
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Users:</span>
                  <span className="font-medium">{previewData.users.count}</span>
                </div>
                {previewData.users.count > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                    {previewData.users.emails.join(', ')}
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Participants:</span>
                  <span className="font-medium">{previewData.participants.count}</span>
                </div>
                {previewData.participants.count > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 pl-4">
                    {previewData.participants.names.join(', ')}
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Incidents:</span>
                  <span className="font-medium">{previewData.incidents.count}</span>
                </div>

                <div className="flex justify-between">
                  <span>User Invitations:</span>
                  <span className="font-medium">{previewData.userInvitations.count}</span>
                </div>

                <div className="flex justify-between">
                  <span>Sessions:</span>
                  <span className="font-medium">{previewData.sessions.count}</span>
                </div>

                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Total Records:</span>
                  <span className="text-red-600">{previewData.totalRecords}</span>
                </div>
              </div>

              {/* Confirmation Input */}
              <div className="space-y-2 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmation">
                    Type <strong>{companyName}</strong> to confirm deletion:
                  </Label>
                  {isDevelopment && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAutoFill}
                      disabled={isDeleting}
                      className="h-7 text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      title="Auto-fill confirmation (dev only)"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Auto-fill
                    </Button>
                  )}
                </div>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={companyName}
                  disabled={isDeleting}
                />
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          {showPreview && previewData && (
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!isConfirmationValid || isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Confirm Deletion
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
