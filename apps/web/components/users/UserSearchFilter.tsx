'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Select } from '@starter/ui/select';
import { Badge } from '@starter/ui/badge';
import { Card, CardContent } from '@starter/ui/card';
import { 
  Search, 
  Filter, 
  X, 
  Users, 
  Building2,
  Loader2,
  SlidersHorizontal 
} from 'lucide-react';

interface SearchFilters {
  searchTerm: string;
  roleFilter: string;
  companyFilter?: string;
  llmAccessFilter: string;
}

interface Company {
  _id: string;
  name: string;
  status: string;
}

interface UserSearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  companies?: Company[];
  showCompanyFilter?: boolean;
  loading?: boolean;
  resultCount?: number;
  className?: string;
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'system_admin', label: 'System Admin' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'frontline_worker', label: 'Frontline Worker' }
];

const LLM_ACCESS_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'enabled', label: 'LLM Enabled' },
  { value: 'disabled', label: 'LLM Disabled' }
];

/**
 * Advanced search and filter component for user management
 * Story 2.6 AC 2.6.1 & AC 2.6.2: User search and filtering
 */
export function UserSearchFilter({
  filters,
  onFiltersChange,
  companies = [],
  showCompanyFilter = false,
  loading = false,
  resultCount,
  className = ''
}: UserSearchFilterProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>();

  // Sync local search term with filters when filters change externally
  useEffect(() => {
    setLocalSearchTerm(filters.searchTerm);
  }, [filters.searchTerm]);

  // Debounced search
  const debouncedSearchChange = useCallback((value: string) => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      onFiltersChange({
        ...filters,
        searchTerm: value
      });
    }, 300);
    
    setSearchDebounce(timeout);
  }, [filters, onFiltersChange, searchDebounce]);

  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  const handleSearchChange = (value: string) => {
    // Update local state immediately for responsive UI
    setLocalSearchTerm(value);
    debouncedSearchChange(value);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      roleFilter: 'all',
      companyFilter: showCompanyFilter ? 'all' : undefined,
      llmAccessFilter: 'all'
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.roleFilter !== 'all') count++;
    if (filters.companyFilter && filters.companyFilter !== 'all') count++;
    if (filters.llmAccessFilter !== 'all') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Primary Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={localSearchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
              />
              {localSearchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLocalSearchTerm('');
                    handleFilterChange('searchTerm', '');
                  }}
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Quick Role Filter */}
            <div className="relative min-w-[180px]">
              <Select 
                value={filters.roleFilter} 
                onValueChange={(value) => handleFilterChange('roleFilter', value)}
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Advanced Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {isAdvancedOpen && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Company Filter */}
                {showCompanyFilter && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company
                    </label>
                    <Select
                      value={filters.companyFilter || 'all'}
                      onValueChange={(value) => handleFilterChange('companyFilter', value)}
                    >
                      <option value="all">All Companies</option>
                      {companies.map(company => (
                        <option key={company._id} value={company._id}>
                          {company.name} ({company.status})
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {/* LLM Access Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    LLM Access
                  </label>
                  <Select
                    value={filters.llmAccessFilter}
                    onValueChange={(value) => handleFilterChange('llmAccessFilter', value)}
                  >
                    {LLM_ACCESS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  {resultCount !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Users className="h-4 w-4" />
                          {resultCount} user{resultCount !== 1 ? 's' : ''} found
                        </>
                      )}
                    </div>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Active Filter Badges */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &quot;{filters.searchTerm}&quot;
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('searchTerm', '')}
                    className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
              
              {filters.roleFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Role: {ROLE_OPTIONS.find(r => r.value === filters.roleFilter)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('roleFilter', 'all')}
                    className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {filters.companyFilter && filters.companyFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Company: {companies.find(c => c._id === filters.companyFilter)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('companyFilter', 'all')}
                    className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}

              {filters.llmAccessFilter !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  LLM: {LLM_ACCESS_OPTIONS.find(o => o.value === filters.llmAccessFilter)?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFilterChange('llmAccessFilter', 'all')}
                    className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}