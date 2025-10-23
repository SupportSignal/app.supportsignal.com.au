// @ts-nocheck - Convex deep instantiation issues with filtering components
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@starter/ui/popover';
import { Calendar } from '@starter/ui/calendar';
import { CalendarIcon, XIcon } from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface IncidentFilter {
  status?: string;
  dateRange?: { start: number; end: number };
  participantId?: string;
  userId?: string;
  siteId?: string; // Story 7.6: Filter by site
  searchText?: string;
}

interface IncidentFiltersProps {
  filters: IncidentFilter;
  onFilterChange: (filters: Partial<IncidentFilter>) => void;
  hasCompanyAccess: boolean;
}

export function IncidentFilters({ 
  filters, 
  onFilterChange, 
  hasCompanyAccess 
}: IncidentFiltersProps) {
  const { sessionToken } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Load participants for filter (if user has company access)
  const participantsData = useQuery(
    api.participants.list.listParticipants,
    hasCompanyAccess && sessionToken ? { sessionToken } : "skip"
  );

  // Load users for filter (if user has company access)
  const usersData = useQuery(
    api.users.listCompanyUsers,
    hasCompanyAccess && sessionToken ? { sessionToken } : "skip"
  );

  // Story 7.6: Load sites for filter
  const sitesData = useQuery(
    api.sites.list.listCompanySites,
    sessionToken ? { sessionToken } : "skip"
  );

  // Update local date range when filters change
  useEffect(() => {
    if (filters.dateRange) {
      setDateRange({
        from: new Date(filters.dateRange.start),
        to: new Date(filters.dateRange.end)
      });
    } else {
      setDateRange(undefined);
    }
  }, [filters.dateRange]);

  const handleStatusChange = (value: string) => {
    onFilterChange({ 
      status: value === "all" ? undefined : value 
    });
  };

  const handleParticipantChange = (value: string) => {
    onFilterChange({ 
      participantId: value === "all" ? undefined : value 
    });
  };

  const handleUserChange = (value: string) => {
    onFilterChange({
      userId: value === "all" ? undefined : value
    });
  };

  // Story 7.6: Handle site filter change
  const handleSiteChange = (value: string) => {
    onFilterChange({
      siteId: value === "all" ? undefined : value
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFilterChange({
        dateRange: {
          start: range.from.getTime(),
          end: range.to.getTime()
        }
      });
    } else {
      onFilterChange({ dateRange: undefined });
    }
  };

  const handleQuickDateFilter = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    
    const range = { from: start, to: end };
    setDateRange(range);
    onFilterChange({
      dateRange: {
        start: start.getTime(),
        end: end.getTime()
      }
    });
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
    onFilterChange({ dateRange: undefined });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="capture_pending">Capture Pending</SelectItem>
            <SelectItem value="analysis_pending">Analysis Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                  : "Select dates"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickDateFilter(7)}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickDateFilter(30)}
                  >
                    Last 30 days
                  </Button>
                </div>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearDateFilter}
              className="px-2"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Participant Filter - Only for users with company access */}
      {hasCompanyAccess && participantsData?.participants && (
        <div className="space-y-2">
          <Label>Participant</Label>
          <Select value={filters.participantId || "all"} onValueChange={handleParticipantChange}>
            <SelectTrigger>
              <SelectValue placeholder="All participants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Participants</SelectItem>
              {participantsData.participants.map((participant) => (
                <SelectItem key={participant._id} value={participant._id}>
                  {participant.first_name} {participant.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* User/Reporter Filter - Only for users with company access */}
      {hasCompanyAccess && usersData?.users && (
        <div className="space-y-2">
          <Label>Reporter</Label>
          <Select value={filters.userId || "all"} onValueChange={handleUserChange}>
            <SelectTrigger>
              <SelectValue placeholder="All reporters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reporters</SelectItem>
              {usersData.users.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Story 7.6: Site Filter - Available for all users */}
      {sitesData && sitesData.length > 0 && (
        <div className="space-y-2">
          <Label>Site</Label>
          <Select value={filters.siteId || "all"} onValueChange={handleSiteChange}>
            <SelectTrigger>
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sitesData.map((site) => (
                <SelectItem key={site._id} value={site._id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}