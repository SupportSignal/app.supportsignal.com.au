"use client";

import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@starter/ui/badge';
import { Progress } from '@starter/ui/progress';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { useViewport } from '@/hooks/mobile/useViewport';
import { cn } from '@/lib/utils';
import type { Id } from '@/convex/_generated/dataModel';

interface CompletionChecklistProps {
  validation: {
    checklist: {
      metadata_complete: boolean;
      narratives_complete: boolean;
      clarifications_complete: boolean;
      enhancement_complete: boolean;
      validation_passed: boolean;
    };
    all_complete: boolean;
    missing_requirements: string[];
  };
  incident_id: Id<"incidents">;
}

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  status: boolean;
  critical?: boolean;
}

export function CompletionChecklist({ validation }: CompletionChecklistProps) {
  const viewport = useViewport();
  
  // Debug logging for validation data
  React.useEffect(() => {
    console.log('CompletionChecklist - Validation data:', validation);
  }, [validation]);

  const checklistItems: ChecklistItem[] = [
    {
      key: 'metadata_complete',
      label: 'Basic Information',
      description: 'Reporter name, participant name, date/time, and location',
      status: validation.checklist.metadata_complete,
      critical: true
    },
    {
      key: 'narratives_complete', 
      label: 'Incident Narratives',
      description: 'Before, during, end, and post-event narratives completed',
      status: validation.checklist.narratives_complete,
      critical: true
    },
    {
      key: 'clarifications_complete',
      label: 'Clarification Questions',
      description: 'AI-generated clarification questions answered',
      status: validation.checklist.clarifications_complete,
      critical: false
    },
    {
      key: 'enhancement_complete',
      label: 'AI Enhancement',
      description: 'Narrative enhanced and reviewed by AI',
      status: validation.checklist.enhancement_complete,
      critical: false
    },
    {
      key: 'validation_passed',
      label: 'Final Validation',
      description: 'All data integrity checks passed',
      status: validation.checklist.validation_passed,
      critical: true
    }
  ];

  const completedCount = checklistItems.filter(item => item.status).length;
  const totalCount = checklistItems.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  const criticalIncomplete = checklistItems
    .filter(item => item.critical && !item.status)
    .length > 0;

  const getStatusIcon = (status: boolean, critical?: boolean) => {
    if (status) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (critical) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = () => {
    if (validation.all_complete) {
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
    } else if (criticalIncomplete) {
      return <Badge variant="destructive">Critical Items Missing</Badge>;
    } else {
      return <Badge variant="secondary">In Progress</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Workflow Progress</h3>
          {getStatusBadge()}
        </div>
        <div className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} completed
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={completionPercentage} className="h-2" />
        <div className="text-xs text-muted-foreground text-center">
          {Math.round(completionPercentage)}% Complete
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div 
            key={item.key}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              item.status 
                ? 'bg-green-50 border-green-200' 
                : item.critical
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(item.status, item.critical)}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{item.label}</h4>
                {item.critical && (
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Missing Requirements Alert */}
      {validation.missing_requirements.length > 0 && (
        <Alert variant={criticalIncomplete ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">
                {criticalIncomplete 
                  ? "Critical requirements missing:" 
                  : "Remaining tasks:"
                }
              </div>
              <ul className="text-sm space-y-1">
                {validation.missing_requirements.map((requirement) => {
                  const item = checklistItems.find(i => i.key === requirement);
                  return (
                    <li key={requirement} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-current rounded-full" />
                      {item?.label || requirement}
                    </li>
                  );
                })}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {validation.all_complete && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All workflow requirements completed. Ready to submit for analysis.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}