'use client';

import { Badge } from '@starter/ui/badge';
import { Progress } from '@starter/ui/progress';
import { CheckCircleIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';

interface IncidentStatusBadgeProps {
  overallStatus: string;
  captureStatus: string;
  analysisStatus: string;
}

export function IncidentStatusBadge({ 
  overallStatus, 
  captureStatus, 
  analysisStatus 
}: IncidentStatusBadgeProps) {
  
  const getStatusInfo = () => {
    switch (overallStatus) {
      case "capture_pending":
        return {
          label: "Capture Pending",
          variant: "secondary" as const,
          icon: <ClockIcon className="w-3 h-3" />,
          progress: getProgressValue(captureStatus)
        };
      case "analysis_pending":
        return {
          label: "Analysis Pending",
          variant: "default" as const,
          icon: <AlertCircleIcon className="w-3 h-3" />,
          progress: 100
        };
      case "completed":
        return {
          label: "Completed",
          variant: "default" as const,
          icon: <CheckCircleIcon className="w-3 h-3" />,
          progress: 100
        };
      default:
        return {
          label: "Unknown",
          variant: "secondary" as const,
          icon: <ClockIcon className="w-3 h-3" />,
          progress: 0
        };
    }
  };

  const getProgressLabel = (captureStatus: string) => {
    switch (captureStatus) {
      case "draft":
        return "Draft";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Capture Complete";
      default:
        return "Pending";
    }
  };

  const getProgressValue = (captureStatus: string) => {
    switch (captureStatus) {
      case "draft":
        return 20;
      case "in_progress":
        return 60;
      case "completed":
        return 100;
      default:
        return 0;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <Badge 
        variant={statusInfo.variant}
        className="flex items-center gap-1 justify-start"
      >
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
      
      {overallStatus === "capture_pending" && (
        <div className="flex items-center gap-2">
          <Progress 
            value={statusInfo.progress} 
            className="h-1 w-16" 
          />
          <span className="text-xs text-muted-foreground">
            {statusInfo.progress}%
          </span>
        </div>
      )}
    </div>
  );
}