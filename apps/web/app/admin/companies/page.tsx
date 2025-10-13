// @ts-nocheck - Known TypeScript limitation with deep Convex type inference (TS2589)
'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Badge } from '@starter/ui/badge';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { CompanyCleanupDialog } from '@/components/admin/company-cleanup-dialog';
import { UnauthorizedAccessCard } from '@/components/admin/unauthorized-access-card';
import { Building2, Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CompaniesPage() {
  const { user, sessionToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);

  // Fetch companies with counts
  const companies = useQuery(
    api.companies.admin.listAllCompanies,
    sessionToken ? { sessionToken, statusFilter: statusFilter || undefined, searchQuery: searchQuery || undefined } : 'skip'
  );

  // Fetch system metrics
  const metrics = useQuery(
    api.companies.admin.getSystemMetrics,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Check if user is system admin
  if (!user || (user.role !== 'system_admin' && user.role !== 'demo_admin')) {
    return (
      <UnauthorizedAccessCard
        message="System administrator access required to manage companies."
      />
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'; // green
      case 'trial':
        return 'secondary'; // blue
      case 'suspended':
        return 'destructive'; // red
      case 'test':
        return 'outline'; // gray
      default:
        return 'outline';
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
  };

  const handleDeleteClick = (companyId: string, companyName: string) => {
    setSelectedCompany({ id: companyId, name: companyName });
    setCleanupDialogOpen(true);
  };

  const handleCloseCleanupDialog = () => {
    setCleanupDialogOpen(false);
    setSelectedCompany(null);
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Company Management"
        description="Manage organizations in the SupportSignal platform"
        icon={<Building2 className="h-6 w-6" />}
      />

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalCompanies}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalParticipants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalSites}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalIncidents}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by company name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="test">Test</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(statusFilter || searchQuery) && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Create Company */}
        <Link href="/admin/companies/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Company
          </Button>
        </Link>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            {companies ? `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} found` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!companies ? (
            <div className="text-center py-8 text-gray-500">
              Loading companies...
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No companies found. {(statusFilter || searchQuery) ? 'Try adjusting your filters.' : 'Create your first company to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium text-gray-600">Company</th>
                    <th className="pb-3 font-medium text-gray-600">Status</th>
                    <th className="pb-3 font-medium text-gray-600 text-center">Users</th>
                    <th className="pb-3 font-medium text-gray-600 text-center">Participants</th>
                    <th className="pb-3 font-medium text-gray-600 text-center">Sites</th>
                    <th className="pb-3 font-medium text-gray-600 text-center">Active Incidents</th>
                    <th className="pb-3 font-medium text-gray-600">Created</th>
                    <th className="pb-3 font-medium text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company: any) => (
                    <tr key={company._id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-4">
                        <div>
                          <div className="font-medium">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.contact_email}</div>
                          <div className="text-xs text-gray-400">Slug: {company.slug}</div>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant={getStatusBadgeVariant(company.status)}>
                          {company.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-center">
                        <Link href={`/admin/companies/${company._id}/users`} className="text-blue-600 hover:underline">
                          {company.userCount}
                        </Link>
                      </td>
                      <td className="py-4 text-center">
                        <Link href={`/admin/companies/${company._id}/participants`} className="text-blue-600 hover:underline">
                          {company.participantCount}
                        </Link>
                      </td>
                      <td className="py-4 text-center">
                        <Link href={`/admin/companies/${company._id}/sites`} className="text-blue-600 hover:underline">
                          {company.siteCount}
                        </Link>
                      </td>
                      <td className="py-4 text-center">
                        {company.activeIncidentCount}
                      </td>
                      <td className="py-4 text-sm text-gray-500">
                        {new Date(company.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/companies/${company._id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {company.status === 'test' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteClick(company._id, company.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Dialog */}
      {selectedCompany && (
        <CompanyCleanupDialog
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          isOpen={cleanupDialogOpen}
          onClose={handleCloseCleanupDialog}
        />
      )}
    </div>
  );
}
