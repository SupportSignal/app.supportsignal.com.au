'use client';

import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { Users, Mail, AlertCircle, Check, XCircle, Clock, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';

interface UserManagementPageProps {
  params: {
    id: Id<'companies'>;
  };
}

export default function UserManagementPage({ params }: UserManagementPageProps) {
  const { user, sessionToken } = useAuth();
  const router = useRouter();

  const company = useQuery(api["companies/getCompanyDetails"].default, {
    companyId: params.id,
    sessionToken: sessionToken || '',
  });

  const users = useQuery(api["users/listUsersForCompany"].default, {
    companyId: params.id,
    sessionToken: sessionToken || '',
  });

  const pendingInvitations = useQuery(api["users/invite/listPendingInvitations"].default, {
    companyId: params.id,
    sessionToken: sessionToken || '',
  });

  const revokeInvitation = useMutation(api["users/invite/revokeInvitation"].default);

  const [revoking, setRevoking] = React.useState<Id<'user_invitations'> | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Permission check
  if (!user || !['system_admin', 'company_admin'].includes(user.role)) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to manage users.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleRevokeInvitation = async (invitationId: Id<'user_invitations'>) => {
    setRevoking(invitationId);
    setError(null);
    setSuccess(null);

    try {
      await revokeInvitation({
        invitationId,
        sessionToken: sessionToken || '',
      });

      setSuccess('Invitation revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke invitation');
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title={`User Management - ${company?.name || 'Loading...'}`}
        description="Manage users and invitations for this company"
        icon={<Users className="h-6 w-6" />}
      />

      <div className="flex gap-4">
        <Button
          onClick={() => router.push(`/admin/companies/${params.id}/users/invite`)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/companies')}
        >
          Back to Companies
        </Button>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Users ({users?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!users && <div className="text-sm text-muted-foreground">Loading users...</div>}
            {users && users.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No users found. Invite your first user to get started.
              </div>
            )}
            {users && users.length > 0 && (
              <div className="space-y-3">
                {users.map((u: any) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-sm text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {u.role.replace('_', ' ')}
                      </span>
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({pendingInvitations?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pendingInvitations && (
              <div className="text-sm text-muted-foreground">Loading invitations...</div>
            )}
            {pendingInvitations && pendingInvitations.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No pending invitations.
              </div>
            )}
            {pendingInvitations && pendingInvitations.length > 0 && (
              <div className="space-y-3">
                {pendingInvitations.map((inv: any) => (
                  <div
                    key={inv._id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{inv.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited by {inv.inviter_name} on{' '}
                        {new Date(inv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {inv.role.replace('_', ' ')}
                      </span>
                      {inv.is_expired ? (
                        <span className="flex items-center gap-1 text-sm text-amber-600">
                          <Clock className="h-4 w-4" />
                          Expired
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-orange-600">
                          <Clock className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeInvitation(inv._id)}
                        disabled={revoking === inv._id}
                      >
                        {revoking === inv._id ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 animate-spin" />
                            Revoking...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Revoke
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
