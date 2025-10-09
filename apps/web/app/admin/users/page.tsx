'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { UserTable } from '@/components/users/user-table';
import { UserSearchFilter } from '@/components/users/user-search-filter';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { Button } from '@starter/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle
} from '@starter/ui/alert-dialog';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import {
  Users,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  UserCheck,
  Crown
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'system_admin' | 'demo_admin' | 'company_admin' | 'team_lead' | 'frontline_worker';
  company_id?: string;
  companyName?: string;
  protection?: {
    isProtected: boolean;
    isOwner: boolean;
    protectionReason?: string;
    displayBadge: boolean;
    disableActions: string[];
  };
  _creationTime: number;
}

interface SearchFilters {
  searchTerm: string;
  roleFilter: string;
  companyFilter?: string;
}

/**
 * Global Admin User Management Page
 * Story 2.6 AC 2.6.2: Global System Admin User Management
 * Story 2.6 AC 2.6.4: Role-Based Access Control
 */
export default function GlobalUserManagementPage() {
  const { user: currentUser, sessionToken } = useAuth();
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    roleFilter: 'all',
    companyFilter: 'all'
  });
  const [demoteConfirm, setDemoteConfirm] = useState<User | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Check if user is system admin
  const isSystemAdmin = currentUser?.role === 'system_admin';

  // Query all users with filters
  const users = useQuery(
    api.adminUsers.listAllUsers,
    isSystemAdmin && sessionToken ? {
      sessionToken,
      searchTerm: filters.searchTerm || undefined,
      roleFilter: filters.roleFilter !== 'all' ? filters.roleFilter : undefined,
      companyFilter: (filters.companyFilter !== 'all' ? filters.companyFilter : undefined) as any,
      limit: 100,
      offset: 0
    } : 'skip'
  );

  // Query user statistics
  const userStats = useQuery(
    api.adminUsers.getUserStats,
    isSystemAdmin && sessionToken ? { sessionToken } : 'skip'
  );

  // Query companies for filtering
  const companies = useQuery(
    api.adminUsers.getCompanyList,
    isSystemAdmin && sessionToken ? { sessionToken } : 'skip'
  );

  // Admin mutations
  // Note: promoteToSystemAdmin is deprecated - use invitation system (Story 7.2)
  const demoteUserMutation = useMutation(api.adminUsers.demoteSystemAdmin);

  const [loading, setLoading] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDemoteUser = async (user: User, newRole: string) => {
    if (!sessionToken) return;
    
    setLoading(true);
    try {
      await demoteUserMutation({
        sessionToken,
        userId: user._id as any,
        newRole: newRole as any,
        reason: `Demoted by ${currentUser?.name || 'system admin'}`
      });
      
      setDemoteConfirm(null);
      showNotification('success', `${user.name} demoted from System Administrator`);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to demote user');
    } finally {
      setLoading(false);
    }
  };

  // Permission check
  if (!isSystemAdmin) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access global user management. 
            System administrator access required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Global User Management"
        description="Manage users across all companies and system administrators"
        icon={<Globe className="h-6 w-6" />}
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

      {/* User Statistics */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{userStats.totalUsers}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-red-600" />
                <span className="text-2xl font-bold">{userStats.roleDistribution.system_admin}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{userStats.totalCompanies}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-600" />
                <span className="text-2xl font-bold">{userStats.totalUsers - userStats.usersWithoutCompany}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <UserSearchFilter
        filters={filters}
        onFiltersChange={setFilters}
        companies={companies?.companies || []}
        showCompanyFilter={true}
        loading={users === undefined}
        resultCount={users?.total}
      />

      {/* User Table */}
      <UserTable
        users={users?.users || []}
        loading={users === undefined}
        searchTerm={filters.searchTerm}
        roleFilter={filters.roleFilter}
        onSearchChange={(search) => setFilters(prev => ({ ...prev, searchTerm: search }))}
        onRoleFilterChange={(role) => setFilters(prev => ({ ...prev, roleFilter: role }))}
        onEditUser={(user) => {
          // Only allow demoting system admins - promotion is now via invitation system
          if (user.role === 'system_admin') {
            setDemoteConfirm(user);
          }
        }}
        showCreateButton={false}
        showCompanyColumn={true}
        showSearchControls={false}
        title={`Global Users (${users?.total || 0})`}
      />

      {/* Demote System Admin Dialog */}
      <AlertDialog open={!!demoteConfirm} onOpenChange={(open: boolean) => !open && setDemoteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Demote System Administrator
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          {demoteConfirm && (
            <div className="space-y-4">
              <p>
                Demote <strong>{demoteConfirm.name}</strong> ({demoteConfirm.email}) from System Administrator to:
              </p>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => handleDemoteUser(demoteConfirm, 'company_admin')}
                  disabled={loading}
                  className="w-full justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Company Administrator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoteUser(demoteConfirm, 'team_lead')}
                  disabled={loading}
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team Lead
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDemoteUser(demoteConfirm, 'frontline_worker')}
                  disabled={loading}
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Frontline Worker
                </Button>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDemoteConfirm(null)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}