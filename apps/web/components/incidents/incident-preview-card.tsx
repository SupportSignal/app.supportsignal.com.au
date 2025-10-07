'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Progress } from '@starter/ui/progress';
import { Clock, User, FileText, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface IncidentPreview {
  _id: string;
  participant_name: string;
  created_at: number;
  updated_at: number;
  current_step?: number;
  step_description?: string;
  content_preview?: string;
  overall_status: 'capture_pending' | 'analysis_pending' | 'completed';
  capture_status: 'draft' | 'in_progress' | 'completed';
}

interface IncidentPreviewCardProps {
  incident: IncidentPreview;
  onContinue: (incidentId: string, step?: number) => void;
}

const getProgressPercentage = (step?: number): number => {
  if (!step) return 0;
  return Math.round((step / 7) * 100);
};

const getStepDescription = (step?: number): string => {
  const stepMap: Record<number, string> = {
    1: "Basic Information",
    2: "Before Event",
    3: "During Event", 
    4: "After Event",
    5: "Q&A Session",
    6: "AI Enhancement",
    7: "Review & Submit"
  };
  return step ? stepMap[step] || "Unknown Step" : "Getting Started";
};

export const IncidentPreviewCard: React.FC<IncidentPreviewCardProps> = ({ 
  incident, 
  onContinue 
}) => {
  const progressPercentage = getProgressPercentage(incident.current_step);
  const stepDescription = incident.step_description || getStepDescription(incident.current_step);
  
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              <User className="inline-block w-4 h-4 mr-2 text-blue-600" />
              {incident.participant_name}
            </CardTitle>
            <CardDescription className="flex items-center mt-1 text-sm text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              Started {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <Badge variant={incident.capture_status === 'draft' ? 'secondary' : 'default'}>
            {incident.capture_status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {incident.current_step || 1} of 7 - {stepDescription}
            </span>
            <span className="text-sm text-gray-500">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full h-2" />
        </div>

        {/* Content Preview */}
        {incident.content_preview && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start">
              <FileText className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 line-clamp-2">
                {incident.content_preview}...
              </p>
            </div>
          </div>
        )}

        {/* Last Modified */}
        <div className="mb-4">
          <p className="text-xs text-gray-500">
            Last modified {formatDistanceToNow(new Date(incident.updated_at), { addSuffix: true })}
          </p>
        </div>

        {/* Continue Button */}
        <Button
          onClick={() => onContinue(incident._id, incident.current_step)}
          className="w-full"
          variant="outline"
          data-testid={`continue-incident-${incident._id}`}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Continue Work
        </Button>
      </CardContent>
    </Card>
  );
};

export default IncidentPreviewCard;