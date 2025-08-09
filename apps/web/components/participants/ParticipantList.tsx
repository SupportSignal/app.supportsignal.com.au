'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@starter/ui/card';
import { Select } from '@starter/ui/select';
import { Badge } from '@starter/ui/badge';
import { ParticipantCard } from './ParticipantCard';
import { ParticipantSearch } from './ParticipantSearch';
import { 
  Participant, 
  ParticipantListFilters,
  SUPPORT_LEVELS,
  PARTICIPANT_STATUS 
} from '@/types/participants';

interface ParticipantListProps {
  onCreateParticipant?: () => void;
  onEditParticipant?: (participant: Participant) => void;
  onViewParticipant?: (participant: Participant) => void;
  showCreateButton?: boolean;
  className?: string;
}

/**
 * Searchable participant list component with filtering capabilities
 * Implements AC4: Searchable participant list scoped to user's company
 * Implements AC7: Mobile-responsive participant management interface
 */
export function ParticipantList({ 
  onCreateParticipant,
  onEditParticipant,
  onViewParticipant,
  showCreateButton = true,
  className = ''
}: ParticipantListProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ParticipantListFilters>({
    search: '',
    status: 'all',
    support_level: 'all',
    limit: 50,
  });

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Get session token from authenticated user
  const sessionToken = user?.sessionToken;
  
  const participants = useQuery(
    api.participants.list.listParticipants,
    sessionToken ? {
      sessionToken,
      search: filters.search || undefined,
      status: filters.status !== 'all' ? filters.status : undefined,
      support_level: filters.support_level !== 'all' ? filters.support_level : undefined,
      limit: filters.limit,
    } : 'skip'
  );

  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleFilterChange = (key: keyof ParticipantListFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
  };

  const toggleSearchExpanded = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  if (!user || !sessionToken) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please sign in to view participants.</p>
        </CardContent>
      </Card>
    );
  }

  if (participants === undefined) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Loading participants...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (participants === null) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-red-500">Error loading participants. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Create Button and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                NDIS Participants
                <Badge variant="secondary" className="text-xs">
                  {participants.totalCount}
                </Badge>
                {participants.company && (
                  <Badge variant="outline" className="text-xs text-blue-600">
                    {participants.company.name}
                  </Badge>
                )}
              </CardTitle>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Quick Search */}
              <div className="flex-1 sm:min-w-[200px]">
                <Input
                  placeholder="Search participants..."
                  value={filters.search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Advanced Search Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSearchExpanded}
                className="whitespace-nowrap"
              >
                {isSearchExpanded ? 'Simple' : 'Advanced'} Search
              </Button>
              
              {/* Create Button */}
              {showCreateButton && onCreateParticipant && (
                <Button 
                  onClick={onCreateParticipant}
                  className="whitespace-nowrap"
                >
                  + Add Participant
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Search */}
          {isSearchExpanded && (
            <ParticipantSearch
              filters={filters}
              onFiltersChange={setFilters}
              className="mt-4"
            />
          )}

          {/* Quick Filters */}
          {!isSearchExpanded && (
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Status</option>
                  {Object.values(PARTICIPANT_STATUS).map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Support:</span>
                <select
                  value={filters.support_level || 'all'}
                  onChange={(e) => handleFilterChange('support_level', e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Levels</option>
                  {Object.values(SUPPORT_LEVELS).map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Results Summary */}
      {(filters.search || filters.status !== 'all' || filters.support_level !== 'all') && (
        <div className="text-sm text-gray-600">
          Showing {participants.totalCount} participant{participants.totalCount !== 1 ? 's' : ''}
          {filters.search && ` matching "${filters.search}"`}
          {filters.status !== 'all' && ` with ${PARTICIPANT_STATUS[filters.status as keyof typeof PARTICIPANT_STATUS]?.label.toLowerCase()} status`}
          {filters.support_level !== 'all' && ` with ${SUPPORT_LEVELS[filters.support_level as keyof typeof SUPPORT_LEVELS]?.label.toLowerCase()} support`}
        </div>
      )}

      {/* Participant Cards */}
      <div className="space-y-3">
        {participants.participants.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="space-y-2">
                <p className="text-gray-500">No participants found.</p>
                {(filters.search || filters.status !== 'all' || filters.support_level !== 'all') ? (
                  <p className="text-sm text-gray-400">Try adjusting your filters or search terms.</p>
                ) : (
                  showCreateButton && onCreateParticipant && (
                    <Button onClick={onCreateParticipant} className="mt-4">
                      Create Your First Participant
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          participants.participants.map((participant) => (
            <ParticipantCard
              key={participant._id}
              participant={participant}
              onEdit={onEditParticipant}
              onView={onViewParticipant}
            />
          ))
        )}
      </div>

      {/* Load More (if applicable) */}
      {participants.participants.length > 0 && participants.participants.length >= (filters.limit || 50) && (
        <Card>
          <CardContent className="p-4 text-center">
            <Button
              variant="outline"
              onClick={() => setFilters(prev => ({ ...prev, limit: (prev.limit || 50) + 25 }))}
            >
              Load More Participants
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}