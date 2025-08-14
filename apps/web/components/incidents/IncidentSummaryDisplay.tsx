"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@starter/ui/tabs';
import { 
  FileText, 
  MessageSquare, 
  Bot, 
  User,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';
import { OriginalContentCollapse } from './OriginalContentCollapse';
import { QADisplayCollapse } from './QADisplayCollapse';
import { formatDistanceToNow } from 'date-fns';
import type { Id } from '@/convex/_generated/dataModel';

interface IncidentSummaryDisplayProps {
  incident_id: Id<"incidents">;
  incident: any;
  enhancedNarrative: any;
}

export function IncidentSummaryDisplay({ 
  incident_id, 
  incident,
  enhancedNarrative 
}: IncidentSummaryDisplayProps) {
  const { user } = useAuth();

  // Fetch narratives
  const narratives = useQuery(
    api.narratives.getByIncidentId,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      incident_id 
    } : "skip"
  );

  // Fetch clarification answers
  const clarificationAnswers = useQuery(
    api.clarificationAnswers.listByIncident,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      incident_id 
    } : "skip"
  );

  return (
    <div className="space-y-6">
      {/* Incident Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Incident Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reporter Name</label>
                <p className="text-sm mt-1">{incident.reporter_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Participant Name</label>
                <p className="text-sm mt-1">{incident.participant_name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                <p className="text-sm mt-1">{incident.event_date_time}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-sm mt-1">{incident.location}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Narrative */}
      {enhancedNarrative && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI-Enhanced Incident Narrative
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Generated {formatDistanceToNow(enhancedNarrative.created_at)} ago
              {enhancedNarrative.user_edited && (
                <Badge variant="secondary" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  User Edited
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-md border">
                {enhancedNarrative.user_edited 
                  ? enhancedNarrative.user_edits 
                  : enhancedNarrative.enhanced_content}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Original Content and Clarifications */}
      <div className="space-y-4">
        {narratives && (
          <OriginalContentCollapse 
            originalContent={{
              before_event: narratives.before_event || '',
              during_event: narratives.during_event || '',
              end_event: narratives.end_event || '',
              post_event: narratives.post_event || '',
            }}
            defaultCollapsed={true}
          />
        )}
        
        {clarificationAnswers && clarificationAnswers.length > 0 && (
          <QADisplayCollapse 
            clarificationResponses={clarificationAnswers.map((answer: any) => ({
              question_text: answer.question_text || '',
              answer_text: answer.answer_text || '',
              phase: answer.phase,
            }))}
            defaultCollapsed={true}
          />
        )}
      </div>

      {/* Workflow Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Workflow Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {narratives ? Object.values(narratives).filter((n: any) => n && typeof n === 'string' && n.length > 0).length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Narrative Phases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {clarificationAnswers ? clarificationAnswers.filter((a: any) => a.answer_text && a.answer_text.trim().length > 0).length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Answered Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {enhancedNarrative ? enhancedNarrative.enhancement_version : 0}
              </div>
              <div className="text-sm text-muted-foreground">Enhancement Version</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {enhancedNarrative?.quality_score ? Math.round(enhancedNarrative.quality_score * 100) : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Quality Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
              <span>Incident Created</span>
              <span className="text-muted-foreground">
                {formatDistanceToNow(incident.created_at)} ago
              </span>
            </div>
            
            {narratives && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <span>Narratives Updated</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(narratives.updated_at)} ago
                </span>
              </div>
            )}
            
            {enhancedNarrative && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                <span>AI Enhancement Generated</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(enhancedNarrative.created_at)} ago
                </span>
              </div>
            )}
            
            {incident.workflow_completed_at && (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <span className="font-medium">Workflow Completed</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(incident.workflow_completed_at)} ago
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}