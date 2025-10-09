'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@starter/ui/dropdown-menu';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { Building2, Plus, AlertCircle, ChevronDown, Users } from 'lucide-react';
import Link from 'next/link';

export default function CompaniesPage() {
  const { user, sessionToken } = useAuth();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Use real API query for ALL companies (not just active)
  const companies = useQuery(api.companies.listAllCompanies) || [];

  // Mutation to update company status
  const updateCompanyStatus = useMutation(api.companies.updateCompanyStatus);

  // Change company status
  const handleChangeStatus = async (companyId: string, newStatus: string) => {
    if (!sessionToken) return;

    setIsUpdating(companyId);
    try {

      console.log('🔍 FRONTEND - CHANGING COMPANY STATUS', {
        companyId,
        newStatus,
        timestamp: new Date().toISOString()
      });

      const result = await updateCompanyStatus({
        companyId,
        status: newStatus,
        sessionToken,
      });

      if (result.success) {
        console.log('🔍 FRONTEND - STATUS TOGGLE SUCCESS:', result.message);
      }
    } catch (error) {
      console.error('🔍 FRONTEND - STATUS TOGGLE ERROR:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  // Check if user is system admin
  if (!user || user.role !== 'system_admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              System administrator access required to view companies.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Company Management"
        description="Manage organizations in the SupportSignal platform"
        icon={<Building2 className="h-6 w-6" />}
      />

      <div className="flex justify-end">
          <Link href="/admin/companies/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Company
            </Button>
          </Link>
        </div>

      <div>
          <Card>
            <CardHeader>
              <CardTitle>All Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {!companies ? (
                <div className="text-center py-8 text-gray-500">
                  Loading companies...
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No companies found. Create your first company to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {companies.map((company: any) => (
                    <div
                      key={company._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">
                            {company.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {company.contact_email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Slug: {company.slug}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/companies/${company._id}/users`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Manage Users
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                                company.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : company.status === 'trial'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : company.status === 'test'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {isUpdating === company._id ? (
                                  <>
                                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    {company.status}
                                    <ChevronDown className="h-3 w-3" />
                                  </>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {company.status !== 'active' && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeStatus(company._id, 'active')}
                                  disabled={isUpdating === company._id}
                                  className="text-green-700"
                                >
                                  Set to Active
                                </DropdownMenuItem>
                              )}
                              {company.status !== 'trial' && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeStatus(company._id, 'trial')}
                                  disabled={isUpdating === company._id}
                                  className="text-blue-700"
                                >
                                  Set to Trial
                                </DropdownMenuItem>
                              )}
                              {company.status !== 'suspended' && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeStatus(company._id, 'suspended')}
                                  disabled={isUpdating === company._id}
                                  className="text-gray-700"
                                >
                                  Set to Suspended
                                </DropdownMenuItem>
                              )}
                              {company.status !== 'test' && (
                                <DropdownMenuItem
                                  onClick={() => handleChangeStatus(company._id, 'test')}
                                  disabled={isUpdating === company._id}
                                  className="text-yellow-700"
                                >
                                  Set to Test
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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