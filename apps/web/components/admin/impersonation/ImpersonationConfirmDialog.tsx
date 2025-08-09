'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from '@starter/ui/alert-dialog';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { AlertTriangle, Clock, Shield, User, Building } from 'lucide-react';
import { ImpersonationSearchResult } from '@/types/impersonation';

interface ImpersonationConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: ImpersonationSearchResult | null;
  reason: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ImpersonationConfirmDialog({
  open,
  onOpenChange,
  targetUser,
  reason,
  onConfirm,
  onCancel,
  isLoading = false,
}: ImpersonationConfirmDialogProps) {
  const handleCancel = () => {
    if (!isLoading) {
      onCancel();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading && !newOpen) {
      onCancel();
    }
    onOpenChange(newOpen);
  };

  if (!targetUser) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Confirm User Impersonation
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to start an impersonation session. Please review the details below.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Security Warning */}
          <Alert className="border-orange-200 bg-orange-50">
            <Shield className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 text-sm">
              This action will be logged for security auditing. You will assume all permissions 
              and access of the target user.
            </AlertDescription>
          </Alert>

          {/* Target User Details */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Target User
            </h4>
            <div className="space-y-2">
              <p className="font-medium">{targetUser.name}</p>
              <p className="text-sm text-muted-foreground">{targetUser.email}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {targetUser.role}
                </Badge>
                {targetUser.company_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building className="h-3 w-3" />
                    {targetUser.company_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-sm mb-2">Reason for Impersonation</h4>
            <p className="text-sm text-muted-foreground">{reason}</p>
          </div>

          {/* Session Details */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Session will expire automatically after 30 minutes
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              You can end the session at any time using the impersonation banner
            </div>
          </div>

          {/* Final Warning */}
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <strong>Final Warning:</strong> You will have full access to this user&apos;s account 
              and data. Use this responsibly and only for legitimate purposes.
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? 'Starting Impersonation...' : 'Confirm & Start Impersonation'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}