'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { UserTable } from '@/components/users/UserTable';
import { UserForm } from '@/components/users/UserForm';
import { OwnerProtectionWarning } from '@/components/users/OwnerBadge';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { Button } from '@starter/ui/button';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogAction
} from '@starter/ui/alert-dialog';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { 
  Users, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Plus 
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'system_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  has_llm_access?: boolean;
  company_id?: string;
  protection?: {
    isProtected: boolean;
    isOwner: boolean;
    protectionReason?: string;
    displayBadge: boolean;
    disableActions: string[];
  };
  _creationTime: number;
}

/**
 * Company User Management Page
 * Story 2.6 AC 2.6.1: Company-Level User Management
 * Story 2.6 AC 2.6.4: Role-Based Access Control
 * Story 2.6 AC 2.6.5: User Interface Requirements
 */
export default function UsersPage() {
  const { user: currentUser, sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Query company users
  const users = useQuery(
    api.users.listCompanyUsers,
    sessionToken ? {
      sessionToken,
      searchTerm: searchTerm || undefined,
      roleFilter: roleFilter !== 'all' ? roleFilter : undefined,
      limit: 100
    } : 'skip'
  );

  // User management mutations
  const createUserMutation = useMutation(api.users.createUser);
  const updateUserMutation = useMutation(api.users.updateUser);
  const updateRoleMutation = useMutation(api.users.updateRole);
  const deleteUserMutation = useMutation(api.users.deleteUser);

  const [loading, setLoading] = useState(false);

  // Check permissions
  const canManageUsers = currentUser?.role === 'company_admin' || currentUser?.role === 'system_admin';
  const canCreateSystemAdmin = currentUser?.role === 'system_admin';

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateUser = async (userData: any) => {
    if (!sessionToken) return;
    
    setLoading(true);
    try {
      await createUserMutation({
        sessionToken,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        has_llm_access: userData.has_llm_access,
      });
      
      setShowCreateForm(false);
      showNotification('success', 'User created successfully');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (userData: any) => {
    if (!sessionToken || !editingUser) return;
    
    setLoading(true);
    try {
      // Update user details
      await updateUserMutation({
        sessionToken,
        userId: editingUser._id,
        name: userData.name,
        email: userData.email,
        has_llm_access: userData.has_llm_access,
      });

      // Update role if changed
      if (userData.role !== editingUser.role) {
        await updateRoleMutation({
          sessionToken,
          userId: editingUser._id,
          newRole: userData.role,
        });
      }
      
      setEditingUser(null);
      showNotification('success', 'User updated successfully');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!sessionToken) return;
    
    setLoading(true);
    try {
      await deleteUserMutation({
        sessionToken,
        userId: user._id,
      });
      
      setDeleteConfirm(null);
      showNotification('success', 'User deleted successfully');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Permission check
  if (!canManageUsers) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access user management. 
            Contact your administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Manage users within your company"
        icon={<Users className="h-6 w-6" />}
      />

      {/* Notification */}
      {notification && (
        <Alert className={notification.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {notification.type === 'error' ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={notification.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {notification.message}
          </AlertDescription>
        </Alert>
      )}

      {/* User Table */}
      <UserTable
        users={users?.users || []}
        loading={users === undefined}
        searchTerm={searchTerm}
        roleFilter={roleFilter}
        onSearchChange={setSearchTerm}
        onRoleFilterChange={setRoleFilter}
        onCreateUser={() => setShowCreateForm(true)}
        onEditUser={handleEditUser}
        onDeleteUser={(user) => setDeleteConfirm(user)}
        showCreateButton={canManageUsers}
        title={`Company Users (${users?.total || 0})`}
      />

      {/* Create User Dialog */}
      <AlertDialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <UserForm
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
            canCreateSystemAdmin={canCreateSystemAdmin}
            title="Create New User"
          />
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <AlertDialog open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUpdateUser}
              onCancel={() => setEditingUser(null)}
              loading={loading}
              canCreateSystemAdmin={canCreateSystemAdmin}
              title={`Edit User: ${editingUser.name}`}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open: boolean) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Confirm Delete User
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {deleteConfirm && (
            <div className="space-y-4">
              {deleteConfirm.protection?.isOwner ? (
                <OwnerProtectionWarning action="deleted" />
              ) : (
                <>
                  <p>
                    Are you sure you want to delete <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email})?
                  </p>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This action cannot be undone. The user will lose access to the system immediately.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirm(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteUser(deleteConfirm)}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Delete User'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}