"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Separator } from '@starter/ui/separator';
import { CalendarDays, MapPin, User, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

interface ExportPreviewProps {
  incident_id: Id<"incidents">;
  enhancedNarrative: {
    _id: Id<"enhanced_narratives">;
    enhanced_content: string;
    user_edited: boolean;
    user_edits?: string;
    created_at: number;
    updated_at: number;
    enhancement_version: number;
  };
}

export function ExportPreview({ 
  incident_id, 
  enhancedNarrative 
}: ExportPreviewProps) {
  const { user } = useAuth();
  
  // Fetch incident details
  const incident = useQuery(
    api.incidents.getById,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      id: incident_id 
    } : "skip"
  );

  if (!incident) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading incident details...
      </div>
    );
  }

  const finalNarrative = enhancedNarrative.user_edited 
    ? enhancedNarrative.user_edits 
    : enhancedNarrative.enhanced_content;

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return format(date, 'PPP p');
    } catch {
      return dateTimeString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <h3 className="font-semibold">Analysis Workflow Export Preview</h3>
          <p className="text-sm text-muted-foreground">
            How this incident will appear in the team leader&apos;s analysis dashboard
          </p>
        </div>
        <Badge variant="outline">Ready for Analysis</Badge>
      </div>

      {/* Incident Summary Card (as it would appear in analysis workflow) */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Incident Report</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                ID: {incident_id.slice(-8)}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                Enhanced v{enhancedNarrative.enhancement_version}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Reporter:</span>
                <span>{incident.reporter_name}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Participant:</span>
                <span>{incident.participant_name}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date & Time:</span>
                <span>{formatDateTime(incident.event_date_time)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{incident.location}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Enhanced Narrative */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-semibold">Enhanced Incident Narrative</h4>
              {enhancedNarrative.user_edited && (
                <Badge variant="outline">
                  User Modified
                </Badge>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="p-4 bg-background border rounded-lg">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {finalNarrative}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Enhanced: {format(enhancedNarrative.created_at, 'MMM d, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Status: Ready for Analysis
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>
                Version: {enhancedNarrative.enhancement_version}
              </span>
            </div>
          </div>

          {/* Analysis Placeholder */}
          <div className="p-4 bg-muted/30 border border-dashed rounded-lg">
            <div className="text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Analysis Section</p>
              <p className="text-sm">
                Contributing conditions and analysis will be added by team leaders in the analysis workflow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Notes */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Export Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• This incident will be available for team leader analysis</li>
          <li>• All original content is preserved for audit purposes</li>
          <li>• Enhancement version tracking enables change history</li>
          <li>• Handoff notifications will alert appropriate team leaders</li>
        </ul>
      </div>
    </div>
  );
}