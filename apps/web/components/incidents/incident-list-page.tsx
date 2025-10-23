// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Badge } from '@starter/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Skeleton } from '@starter/ui/skeleton';
import { CalendarIcon, SearchIcon, FilterIcon, PlusIcon } from 'lucide-react';
import { IncidentTable } from './incident-table';
import { IncidentFilters } from './incident-filters';
import { IncidentStatusBadge } from './incident-status-badge';

// Types
interface IncidentFilter {
  status?: string;
  dateRange?: { start: number; end: number };
  participantId?: string;
  userId?: string;
  siteId?: string; // Story 7.6: Filter by site
  searchText?: string;
}

interface PaginationState {
  limit: number;
  offset: number;
}

interface SortingState {
  field: "date" | "status" | "participant" | "reporter" | "updated";
  direction: "asc" | "desc";
}

export function IncidentListPage() {
  const router = useRouter();
  const { sessionToken, user } = useAuth();
  const [filters, setFilters] = useState<IncidentFilter>({});
  const [pagination, setPagination] = useState<PaginationState>({ limit: 50, offset: 0 });
  const [sorting, setSorting] = useState<SortingState>({ field: "date", direction: "desc" });
  const [showFilters, setShowFilters] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // 🔍 CLIENT LOGGING: Initial state
  console.log('🔍 INCIDENTS PAGE - INITIAL STATE', {
    timestamp: new Date().toISOString(),
    user: user ? {
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id
    } : null,
    hasSessionToken: !!sessionToken,
    sessionTokenLength: sessionToken?.length || 0
  });

  // Check user permissions to determine which query to use
  const userPermissions = useQuery(
    api.permissions.getUserPermissions,
    sessionToken ? { sessionToken } : "skip"
  );

  const canViewAllCompanyIncidents = userPermissions?.permissions.includes('view_all_company_incidents') || false;
  const canViewMyIncidents = userPermissions?.permissions.includes('view_my_incidents') || false;

  // 🔍 CLIENT LOGGING: Permission evaluation
  console.log('🔍 INCIDENTS PAGE - PERMISSIONS EVALUATED', {
    timestamp: new Date().toISOString(),
    userPermissions: userPermissions ? {
      permissions: userPermissions.permissions,
      role: userPermissions.role,
      reason: userPermissions.reason
    } : 'LOADING/NULL',
    canViewAllCompanyIncidents,
    canViewMyIncidents,
    willQueryCompanyIncidents: !!(sessionToken && canViewAllCompanyIncidents),
    willQueryPersonalIncidents: !!(sessionToken && canViewMyIncidents && !canViewAllCompanyIncidents)
  });

  // Use appropriate query based on permissions
  const companyIncidents = useQuery(
    api.incidents_listing.getAllCompanyIncidents,
    sessionToken && canViewAllCompanyIncidents ? {
      sessionToken,
      filters,
      pagination,
      sorting
    } : "skip"
  );

  const personalIncidents = useQuery(
    api.incidents_listing.getMyIncidents,
    sessionToken && canViewMyIncidents && !canViewAllCompanyIncidents ? {
      sessionToken,
      filters,
      pagination,
      sorting
    } : "skip"
  );

  // Get incident counts for summary cards
  const incidentCounts = useQuery(
    api.incidents_listing.getIncidentCounts,
    sessionToken ? { sessionToken } : "skip"
  );

  // Handle permission errors gracefully
  useEffect(() => {
    if (userPermissions && !canViewAllCompanyIncidents && !canViewMyIncidents) {
      setPermissionError("You don't have permission to view incidents. Please contact your administrator.");
    } else {
      setPermissionError(null);
    }
  }, [userPermissions, canViewAllCompanyIncidents, canViewMyIncidents]);

  const incidents = companyIncidents || personalIncidents;
  const hasCompanyAccess = !!companyIncidents;

  // 🔍 CLIENT LOGGING: Query results
  console.log('🔍 INCIDENTS PAGE - QUERY RESULTS', {
    timestamp: new Date().toISOString(),
    companyIncidents: companyIncidents ? {
      incidentCount: companyIncidents.incidents?.length || 0,
      totalCount: companyIncidents.totalCount,
      hasMore: companyIncidents.hasMore,
      correlationId: companyIncidents.correlationId
    } : companyIncidents, // Will show error, null, or undefined
    personalIncidents: personalIncidents ? {
      incidentCount: personalIncidents.incidents?.length || 0,
      totalCount: personalIncidents.totalCount,
      hasMore: personalIncidents.hasMore,
      correlationId: personalIncidents.correlationId
    } : personalIncidents, // Will show error, null, or undefined
    finalIncidents: incidents ? {
      incidentCount: incidents.incidents?.length || 0,
      totalCount: incidents.totalCount,
      source: hasCompanyAccess ? 'COMPANY' : 'PERSONAL'
    } : incidents
  });

  const handleSearch = (searchText: string) => {
    setFilters(prev => ({ ...prev, searchText: searchText || undefined }));
    setPagination({ limit: 50, offset: 0 }); // Reset pagination on search
  };

  const handleFilterChange = (newFilters: Partial<IncidentFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination({ limit: 50, offset: 0 }); // Reset pagination on filter change
  };

  const handleSortChange = (field: string, direction: "asc" | "desc") => {
    setSorting({ field: field as any, direction });
    setPagination({ limit: 50, offset: 0 }); // Reset pagination on sort change
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination({ limit: 50, offset: 0 });
  };

  if (!sessionToken) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view incidents.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show permission error if user doesn't have any incident viewing permissions
  if (permissionError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-amber-600">
              <span className="text-lg">⚠️</span>
              <p className="text-center">{permissionError}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {hasCompanyAccess ? "Company Incidents" : "My Incidents"}
          </h1>
          <p className="text-muted-foreground">
            {hasCompanyAccess 
              ? "Manage and track all incidents within your company"
              : "View and manage your personal incidents"
            }
          </p>
        </div>
        <Button 
          onClick={() => router.push('/new-incident')}
          className="flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Incident
        </Button>
      </div>

      {/* Summary Cards */}
      {incidentCounts && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incidentCounts.total}</div>
              <p className="text-xs text-muted-foreground">
                {incidentCounts.scope === "company" ? "Company-wide" : "Personal"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capture Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incidentCounts.capture_pending}</div>
              <p className="text-xs text-muted-foreground">
                Needs completion
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analysis Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incidentCounts.analysis_pending}</div>
              <p className="text-xs text-muted-foreground">
                Ready for analysis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incidentCounts.completed}</div>
              <p className="text-xs text-muted-foreground">
                Fully processed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents by participant, reporter, site, or location..."
                className="pl-10"
                value={filters.searchText || ''}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FilterIcon className="w-4 h-4" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {Object.keys(filters).length}
                  </Badge>
                )}
              </Button>
              {Object.keys(filters).length > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <IncidentFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                hasCompanyAccess={hasCompanyAccess}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Incidents
            {incidents && (
              <Badge variant="outline" className="ml-2">
                {incidents.totalCount} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!incidents ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : incidents.incidents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No incidents found.</p>
              <Button 
                className="mt-4" 
                onClick={() => router.push('/new-incident')}
              >
                Create First Incident
              </Button>
            </div>
          ) : (
            <IncidentTable
              incidents={incidents.incidents}
              totalCount={incidents.totalCount}
              sorting={sorting}
              onSortChange={handleSortChange}
              pagination={pagination}
              onPageChange={handlePageChange}
              hasMore={incidents.hasMore}
              currentUser={user}
              hasCompanyAccess={hasCompanyAccess}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}