'use client';

import React from 'react';
import { Card, CardContent } from '@starter/ui/card';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Button } from '@starter/ui/button';
import { 
  ParticipantListFilters,
  SUPPORT_LEVELS,
  PARTICIPANT_STATUS 
} from '@/types/participants';

interface ParticipantSearchProps {
  filters: ParticipantListFilters;
  onFiltersChange: (filters: ParticipantListFilters) => void;
  className?: string;
}

/**
 * Advanced search and filter controls for participants
 * Implements comprehensive filtering capabilities for participant management
 */
export function ParticipantSearch({ 
  filters,
  onFiltersChange,
  className = ''
}: ParticipantSearchProps) {
  const handleFilterChange = (key: keyof ParticipantListFilters, value: string | number) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      support_level: 'all',
      limit: 50,
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || 
    (filters.status && filters.status !== 'all') || 
    (filters.support_level && filters.support_level !== 'all')
  );

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Advanced Search & Filters</h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Text Search */}
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm">
                Search Text
              </Label>
              <Input
                id="search"
                placeholder="Name, NDIS number, phone..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Searches name, NDIS number, phone, and notes
              </p>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm">
                Status
              </Label>
              <select
                id="status"
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full text-sm border rounded-md px-3 py-2 bg-background"
              >
                <option value="all">All Status</option>
                {Object.values(PARTICIPANT_STATUS).map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.icon} {status.label} - {status.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Support Level Filter */}
            <div className="space-y-2">
              <Label htmlFor="support_level" className="text-sm">
                Support Level
              </Label>
              <select
                id="support_level"
                value={filters.support_level || 'all'}
                onChange={(e) => handleFilterChange('support_level', e.target.value)}
                className="w-full text-sm border rounded-md px-3 py-2 bg-background"
              >
                <option value="all">All Support Levels</option>
                {Object.values(SUPPORT_LEVELS).map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label} - {level.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Limit */}
            <div className="space-y-2">
              <Label htmlFor="limit" className="text-sm">
                Results Limit
              </Label>
              <select
                id="limit"
                value={filters.limit || 50}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                className="w-full text-sm border rounded-md px-3 py-2 bg-background"
              >
                <option value={25}>25 results</option>
                <option value={50}>50 results</option>
                <option value={100}>100 results</option>
                <option value={200}>200 results</option>
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Active filters:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.search && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">
                      Text: &quot;{filters.search}&quot;
                    </span>
                  )}
                  
                  {filters.status && filters.status !== 'all' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                      Status: {PARTICIPANT_STATUS[filters.status as keyof typeof PARTICIPANT_STATUS]?.label}
                    </span>
                  )}
                  
                  {filters.support_level && filters.support_level !== 'all' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs">
                      Support: {SUPPORT_LEVELS[filters.support_level as keyof typeof SUPPORT_LEVELS]?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}