'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@starter/ui/table';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  PlayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BarChart3Icon,
} from 'lucide-react';
import { IncidentStatusBadge } from './IncidentStatusBadge';

// Types
interface Incident {
  _id: string;
  company_id: string;
  participant_name: string;
  reporter_name: string;
  event_date_time: string;
  location: string;
  overall_status: string;
  capture_status: string;
  analysis_status: string;
  created_at: number;
  updated_at: number;
  created_by?: string;
  participant_id?: string;
}

interface IncidentTableProps {
  incidents: Incident[];
  totalCount: number;
  sorting: {
    field: "date" | "status" | "participant" | "reporter" | "updated";
    direction: "asc" | "desc";
  };
  onSortChange: (field: string, direction: "asc" | "desc") => void;
  pagination: {
    limit: number;
    offset: number;
  };
  onPageChange: (newOffset: number) => void;
  hasMore: boolean;
}

export function IncidentTable({
  incidents,
  totalCount,
  sorting,
  onSortChange,
  pagination,
  onPageChange,
  hasMore
}: IncidentTableProps) {
  const router = useRouter();

  const handleSort = (field: string) => {
    const newDirection = 
      sorting.field === field && sorting.direction === "desc" ? "asc" : "desc";
    onSortChange(field, newDirection);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sorting.field !== field) return <ChevronUpIcon className="w-4 h-4 opacity-30" />;
    return sorting.direction === "asc" 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />;
  };

  const getActionButton = (incident: Incident) => {
    // Determine user permissions based on what data we can see
    // If we can see all company incidents, user has VIEW_ALL_COMPANY_INCIDENTS
    const hasCompanyAccess = incidents.some(i => i.created_by !== incident.created_by);
    
    if (incident.overall_status === "completed") {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/incidents/${incident._id}`)}
            className="flex items-center gap-1"
          >
            <EyeIcon className="w-3 h-3" />
            View
          </Button>
          {hasCompanyAccess && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/analysis/${incident._id}`)}
              className="flex items-center gap-1"
            >
              <BarChart3Icon className="w-3 h-3" />
              Analyze
            </Button>
          )}
        </div>
      );
    } else {
      // Incomplete incident
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/incidents/${incident._id}`)}
            className="flex items-center gap-1"
          >
            <EyeIcon className="w-3 h-3" />
            View
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/new-incident?id=${incident._id}`)}
            className="flex items-center gap-1"
          >
            <PlayIcon className="w-3 h-3" />
            Continue
          </Button>
        </div>
      );
    }
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM d, yyyy HH:mm');
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(totalCount / pagination.limit);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("participant")}
                  className="flex items-center gap-1 p-0 h-auto font-medium"
                >
                  Participant
                  <SortIcon field="participant" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("reporter")}
                  className="flex items-center gap-1 p-0 h-auto font-medium"
                >
                  Reporter
                  <SortIcon field="reporter" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1 p-0 h-auto font-medium"
                >
                  Event Date
                  <SortIcon field="date" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 p-0 h-auto font-medium"
                >
                  Status
                  <SortIcon field="status" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("updated")}
                  className="flex items-center gap-1 p-0 h-auto font-medium"
                >
                  Last Modified
                  <SortIcon field="updated" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident._id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{incident.participant_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {incident.location}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{incident.reporter_name}</TableCell>
                <TableCell>{incident.event_date_time}</TableCell>
                <TableCell>
                  <IncidentStatusBadge 
                    overallStatus={incident.overall_status}
                    captureStatus={incident.capture_status}
                    analysisStatus={incident.analysis_status}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(incident.updated_at)}
                </TableCell>
                <TableCell className="text-right">
                  {getActionButton(incident)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, totalCount)} of {totalCount} incidents
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.offset - pagination.limit)}
              disabled={pagination.offset === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.offset + pagination.limit)}
              disabled={!hasMore}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}