// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  Hash, 
  Building, 
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import type { Incident } from '@/types/api';
import { StatusBadge } from '@/components/shared';

export interface MetadataDisplayProps {
  incident: Incident;
  showCompanyInfo?: boolean;
  showAuditInfo?: boolean;
  showQualityFlags?: boolean;
  layout?: 'vertical' | 'horizontal' | 'grid';
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
}

export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({
  incident,
  showCompanyInfo = false,
  showAuditInfo = true,
  showQualityFlags = true,
  layout = 'grid',
  className,
  variant = 'full',
}) => {
  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return {
        date: date.toLocaleDateString('en-AU', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        time: date.toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    } catch {
      return { date: dateTimeString, time: '' };
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const eventDateTime = formatDateTime(incident.event_date_time);
  const isCompact = variant === 'compact';
  const isMinimal = variant === 'minimal';

  // Basic incident information
  const basicInfo = [
    {
      icon: User,
      label: 'Participant',
      value: incident.participant_name,
      key: 'participant',
    },
    {
      icon: User,
      label: 'Reporter',
      value: incident.reporter_name,
      key: 'reporter',
    },
    {
      icon: Calendar,
      label: 'Event Date',
      value: eventDateTime.date,
      key: 'date',
    },
    {
      icon: Clock,
      label: 'Event Time',
      value: eventDateTime.time,
      key: 'time',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: incident.location,
      key: 'location',
    },
  ];

  // System information
  const systemInfo = [
    {
      icon: Hash,
      label: 'Incident ID',
      value: incident._id.slice(-8).toUpperCase(),
      key: 'id',
    },
    {
      icon: Calendar,
      label: 'Created',
      value: formatTimestamp(incident.created_at),
      key: 'created',
    },
    {
      icon: Calendar,
      label: 'Last Updated',
      value: formatTimestamp(incident.updated_at),
      key: 'updated',
    },
  ];

  // Quality indicators
  const qualityFlags = [
    {
      label: 'Questions Generated',
      status: incident.questions_generated,
      icon: incident.questions_generated ? CheckCircle2 : AlertCircle,
      key: 'questions',
    },
    {
      label: 'Narrative Enhanced',
      status: incident.narrative_enhanced,
      icon: incident.narrative_enhanced ? CheckCircle2 : AlertCircle,
      key: 'enhanced',
    },
    {
      label: 'Analysis Generated',
      status: incident.analysis_generated,
      icon: incident.analysis_generated ? CheckCircle2 : AlertCircle,
      key: 'analysis',
    },
  ];

  const containerClassName = cn(
    'bg-healthcare-surface',
    {
      'p-0': isMinimal,
    },
    className
  );

  const gridClassName = cn({
    'grid gap-ss-md': layout === 'grid',
    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': layout === 'grid' && !isCompact,
    'grid-cols-2': layout === 'grid' && isCompact,
    'flex flex-col space-y-ss-sm': layout === 'vertical',
    'flex flex-wrap gap-ss-md': layout === 'horizontal',
  });

  const MetadataItem: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    className?: string;
  }> = ({ icon: Icon, label, value, className: itemClassName }) => (
    <div className={cn('flex items-center gap-ss-sm', itemClassName)}>
      <Icon className="w-4 h-4 text-healthcare-primary flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-healthcare-xs text-gray-600 mb-0.5">
          {label}
        </div>
        <div className="font-medium text-healthcare-sm text-healthcare-primary truncate" title={value}>
          {value}
        </div>
      </div>
    </div>
  );

  const QualityFlag: React.FC<{
    label: string;
    status: boolean;
    icon: React.ComponentType<{ className?: string }>;
  }> = ({ label, status, icon: Icon }) => (
    <div className="flex items-center gap-2">
      <Icon className={cn(
        'w-4 h-4',
        status ? 'text-ss-success' : 'text-gray-400'
      )} />
      <span className={cn(
        'text-healthcare-xs',
        status ? 'text-gray-900' : 'text-gray-500'
      )}>
        {label}
      </span>
    </div>
  );

  if (isMinimal) {
    return (
      <div className={containerClassName}>
        <div className="flex items-center justify-between gap-ss-md">
          <div className="flex items-center gap-ss-md">
            <div>
              <h3 className="font-medium text-healthcare-primary">
                {incident.participant_name}
              </h3>
              <p className="text-healthcare-xs text-gray-600">
                {eventDateTime.date} • {incident.location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <StatusBadge status={incident.overall_status} size="sm" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={containerClassName}>
      {!isCompact && (
        <CardHeader className="pb-ss-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-header-h3 text-healthcare-primary font-semibold">
                Incident Metadata
              </h2>
              <p className="text-healthcare-sm text-gray-600 mt-1">
                Details for incident involving {incident.participant_name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusBadge status={incident.capture_status} variant="outline" size="sm" />
              <StatusBadge status={incident.overall_status} size="sm" />
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-ss-lg">
        {/* Basic Information */}
        <div className="space-y-ss-sm">
          {!isCompact && (
            <h3 className="font-semibold text-healthcare-primary text-healthcare-lg border-b border-gray-200 pb-2">
              Incident Information
            </h3>
          )}
          <div className={gridClassName}>
            {basicInfo.map((item) => (
              <MetadataItem key={item.key} {...item} />
            ))}
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-ss-sm">
          {!isCompact && (
            <h3 className="font-semibold text-healthcare-primary text-healthcare-lg border-b border-gray-200 pb-2">
              Workflow Status
            </h3>
          )}
          <div className="flex flex-wrap gap-ss-md">
            <div className="flex items-center gap-2">
              <span className="text-healthcare-xs text-gray-600">Capture:</span>
              <StatusBadge status={incident.capture_status} size="sm" variant="outline" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-healthcare-xs text-gray-600">Analysis:</span>
              <StatusBadge 
                status={incident.analysis_status === 'not_started' ? 'not_started' : 
                        incident.analysis_status === 'in_progress' ? 'in_progress' : 'completed'} 
                size="sm" 
                variant="outline" 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-healthcare-xs text-gray-600">Overall:</span>
              <StatusBadge status={incident.overall_status} size="sm" />
            </div>
          </div>
        </div>

        {/* Quality Flags */}
        {showQualityFlags && !isCompact && (
          <div className="space-y-ss-sm">
            <h3 className="font-semibold text-healthcare-primary text-healthcare-lg border-b border-gray-200 pb-2">
              Data Quality
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-ss-md">
              {qualityFlags.map((flag) => (
                <QualityFlag key={flag.key} {...flag} />
              ))}
            </div>
          </div>
        )}

        {/* System Information */}
        {showAuditInfo && !isCompact && (
          <div className="space-y-ss-sm">
            <h3 className="font-semibold text-healthcare-primary text-healthcare-lg border-b border-gray-200 pb-2">
              System Information
            </h3>
            <div className={gridClassName}>
              {systemInfo.map((item) => (
                <MetadataItem key={item.key} {...item} />
              ))}
            </div>
          </div>
        )}

        {/* Company Information */}
        {showCompanyInfo && !isCompact && (
          <div className="space-y-ss-sm">
            <h3 className="font-semibold text-healthcare-primary text-healthcare-lg border-b border-gray-200 pb-2">
              Company Context
            </h3>
            <MetadataItem
              icon={Building}
              label="Company ID"
              value={incident.company_id}
            />
          </div>
        )}

        {/* Narrative Hash */}
        {incident.narrative_hash && showAuditInfo && !isCompact && (
          <div className="space-y-ss-sm">
            <h3 className="font-semibold text-healthcare-primary text-healthcare-lg border-b border-gray-200 pb-2">
              Data Integrity
            </h3>
            <MetadataItem
              icon={FileText}
              label="Narrative Hash"
              value={incident.narrative_hash.slice(0, 16) + '...'}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};