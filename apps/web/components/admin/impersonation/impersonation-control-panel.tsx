// @ts-nocheck
'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Textarea } from '@starter/ui/textarea';
import { Badge } from '@starter/ui/badge';
import { AlertTriangle, Users, Clock, Shield, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { useAuth } from '@/components/auth/auth-provider';
import { ImpersonationSearchResult } from '@/types/impersonation';
import { UserSearchInput } from './user-search-input';
import { ImpersonationConfirmDialog } from './impersonation-confirm-dialog';
import { ActiveSessionsManager } from './active-sessions-manager';

export function ImpersonationControlPanel() {
  const { user, sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ImpersonationSearchResult | null>(null);
  const [reason, setReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convex mutations and queries
  const startImpersonation = useMutation(api.impersonation.startImpersonation);
  const searchUsers = useQuery(api.impersonation.searchUsersForImpersonation, {
    admin_session_token: sessionToken || '',
    search_term: searchTerm || undefined,
    limit: 10,
  });
  const activeSessions = useQuery(api.impersonation.getActiveImpersonationSessions, {
    admin_session_token: sessionToken || '',
  });

  const handleUserSelect = useCallback((user: ImpersonationSearchResult) => {
    setSelectedUser(user);
    setError(null);
  }, []);

  const handleStartImpersonation = useCallback(async () => {
    if (!selectedUser || !reason.trim() || !sessionToken) {
      setError('Please select a user and provide a reason for impersonation');
      return;
    }

    setShowConfirmDialog(true);
  }, [selectedUser, reason, sessionToken]);

  const handleConfirmImpersonation = useCallback(async () => {
    if (!selectedUser || !reason.trim() || !sessionToken) return;

    try {
      setIsImpersonating(true);
      setError(null);
      setShowConfirmDialog(false);

      const result = await startImpersonation({
        admin_session_token: sessionToken,
        target_user_email: selectedUser.email,
        reason: reason.trim(),
      });

      if (result.success && result.impersonation_token) {
        // Store the impersonation token and redirect to use it
        window.location.href = `/?impersonate_token=${result.impersonation_token}`;
      } else {
        setError('Failed to start impersonation session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start impersonation session');
    } finally {
      setIsImpersonating(false);
    }
  }, [selectedUser, reason, sessionToken, startImpersonation]);

  const handleCancelImpersonation = useCallback(() => {
    setShowConfirmDialog(false);
    setError(null);
  }, []);

  const handleResetForm = useCallback(() => {
    setSelectedUser(null);
    setReason('');
    setSearchTerm('');
    setError(null);
  }, []);

  if (!user) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Authentication required. Please log in to access impersonation features.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Warning */}
      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Security Notice:</strong> User impersonation is a powerful administrative feature. 
          All impersonation sessions are logged and audited. Use responsibly and only for legitimate 
          testing and support purposes.
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Start Impersonation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Start Impersonation Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Search */}
            <div className="space-y-2">
              <Label htmlFor="user-search">Select User to Impersonate</Label>
              <UserSearchInput
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                searchResults={searchUsers || []}
                selectedUser={selectedUser}
                onUserSelect={handleUserSelect}
              />
              {selectedUser && (
                <div className="mt-2 p-3 border rounded-lg bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedUser.role}</Badge>
                        {selectedUser.company_name && (
                          <Badge variant="secondary">{selectedUser.company_name}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetForm}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Impersonation</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Testing user workflow, reproducing reported bug, providing customer support..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be logged for audit purposes
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleStartImpersonation}
                disabled={!selectedUser || !reason.trim() || isImpersonating}
                className="flex-1"
              >
                {isImpersonating ? 'Starting...' : 'Start Impersonation'}
              </Button>
              <Button
                variant="outline"
                onClick={handleResetForm}
                disabled={isImpersonating}
              >
                Clear
              </Button>
            </div>

            {/* Session Info */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Sessions auto-expire after 30 minutes
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Shield className="h-4 w-4" />
                Maximum 3 concurrent sessions per admin
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions Manager */}
        <ActiveSessionsManager 
          activeSessions={activeSessions || []}
          sessionToken={sessionToken || ''}
        />
      </div>

      {/* Confirmation Dialog */}
      <ImpersonationConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        targetUser={selectedUser}
        reason={reason}
        onConfirm={handleConfirmImpersonation}
        onCancel={handleCancelImpersonation}
        isLoading={isImpersonating}
      />
    </div>
  );
}