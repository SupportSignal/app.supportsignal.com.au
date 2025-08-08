'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Badge } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  BarChart3
} from 'lucide-react';

export interface NarrativeSection {
  id: string;
  title: string;
  isRequired: boolean;
  isComplete: boolean;
  wordCount?: number;
  minWords?: number;
  maxWords?: number;
  quality?: 'excellent' | 'good' | 'needs_improvement' | 'incomplete';
  lastUpdated?: Date;
}

export interface NarrativeProgressProps {
  sections: NarrativeSection[];
  overallProgress: number;
  qualityScore?: number;
  totalWordCount?: number;
  targetWordCount?: number;
  estimatedTimeRemaining?: number;
  showDetails?: boolean;
  showQuality?: boolean;
  showWordCounts?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

const defaultSections: NarrativeSection[] = [
  {
    id: 'before-event',
    title: 'Before the Event',
    isRequired: true,
    isComplete: true,
    wordCount: 124,
    minWords: 50,
    maxWords: 300,
    quality: 'good',
    lastUpdated: new Date(Date.now() - 3600000),
  },
  {
    id: 'during-event',
    title: 'During the Event',
    isRequired: true,
    isComplete: true,
    wordCount: 256,
    minWords: 100,
    maxWords: 500,
    quality: 'excellent',
    lastUpdated: new Date(Date.now() - 1800000),
  },
  {
    id: 'end-event',
    title: 'End of Event',
    isRequired: true,
    isComplete: false,
    wordCount: 43,
    minWords: 50,
    maxWords: 200,
    quality: 'needs_improvement',
    lastUpdated: new Date(Date.now() - 900000),
  },
  {
    id: 'post-event',
    title: 'Post-Event Actions',
    isRequired: true,
    isComplete: false,
    wordCount: 0,
    minWords: 30,
    maxWords: 200,
    quality: 'incomplete',
  },
];

export const NarrativeProgress = React.forwardRef<HTMLDivElement, NarrativeProgressProps>(({
  sections = defaultSections,
  overallProgress,
  qualityScore = 75,
  totalWordCount,
  targetWordCount = 400,
  estimatedTimeRemaining = 8,
  showDetails = true,
  showQuality = true,
  showWordCounts = true,
  variant = 'default',
  className,
}, ref) => {
  const completedSections = sections.filter(s => s.isComplete).length;
  const requiredSections = sections.filter(s => s.isRequired).length;
  const calculatedProgress = overallProgress ?? Math.round((completedSections / sections.length) * 100);
  const calculatedWordCount = totalWordCount ?? sections.reduce((sum, s) => sum + (s.wordCount || 0), 0);

  const getQualityConfig = (quality?: string) => {
    switch (quality) {
      case 'excellent':
        return { color: 'text-ss-success', bg: 'bg-ss-success/10', label: 'Excellent' };
      case 'good':
        return { color: 'text-ss-teal', bg: 'bg-ss-teal/10', label: 'Good' };
      case 'needs_improvement':
        return { color: 'text-ss-alert', bg: 'bg-ss-alert/10', label: 'Needs Work' };
      case 'incomplete':
        return { color: 'text-gray-400', bg: 'bg-gray-50', label: 'Incomplete' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-50', label: 'Unknown' };
    }
  };

  const getOverallQualityConfig = () => {
    if (qualityScore >= 85) return { color: 'text-ss-success', label: 'Excellent' };
    if (qualityScore >= 70) return { color: 'text-ss-teal', label: 'Good' };
    if (qualityScore >= 50) return { color: 'text-ss-alert', label: 'Fair' };
    return { color: 'text-red-600', label: 'Needs Improvement' };
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-4', className)}>
        <div className="flex items-center">
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - calculatedProgress / 100)}`}
                className="text-ss-teal transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-healthcare-sm font-bold text-ss-teal">
                {calculatedProgress}%
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <div className="text-healthcare-base font-semibold text-healthcare-primary">
            {completedSections}/{sections.length} Sections Complete
          </div>
          {showWordCounts && (
            <div className="text-healthcare-sm text-gray-600">
              {calculatedWordCount}/{targetWordCount} words
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card ref={ref} className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 relative">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - calculatedProgress / 100)}`}
                    className="text-ss-teal transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-healthcare-xs font-bold text-ss-teal">
                    {calculatedProgress}%
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-healthcare-base font-semibold text-healthcare-primary">
                  Narrative Progress
                </div>
                <div className="text-healthcare-sm text-gray-600">
                  {completedSections} of {sections.length} sections complete
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {showQuality && (
                <div className={cn('text-healthcare-sm font-medium', getOverallQualityConfig().color)}>
                  {getOverallQualityConfig().label}
                </div>
              )}
              {showWordCounts && (
                <div className="text-healthcare-xs text-gray-500">
                  {calculatedWordCount} words
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-ss-teal" />
            <span>Narrative Progress</span>
          </div>
          <Badge className="bg-ss-teal text-white">
            {calculatedProgress}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-ss-teal/5 rounded-lg">
            <div className="text-2xl font-bold text-ss-teal mb-1">{completedSections}</div>
            <div className="text-healthcare-sm text-gray-600">Completed</div>
          </div>
          
          {showWordCounts && (
            <div className="text-center p-4 bg-ss-cta-blue/5 rounded-lg">
              <div className="text-2xl font-bold text-ss-cta-blue mb-1">{calculatedWordCount}</div>
              <div className="text-healthcare-sm text-gray-600">Total Words</div>
            </div>
          )}
          
          {showQuality && (
            <div className="text-center p-4 bg-ss-success/5 rounded-lg">
              <div className={cn('text-2xl font-bold mb-1', getOverallQualityConfig().color)}>
                {qualityScore}%
              </div>
              <div className="text-healthcare-sm text-gray-600">Quality Score</div>
            </div>
          )}
        </div>

        {/* Section Details */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="text-healthcare-base font-semibold text-healthcare-primary">
              Section Progress
            </h4>
            
            {sections.map((section) => {
              const qualityConfig = getQualityConfig(section.quality);
              
              return (
                <div
                  key={section.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    section.isComplete ? 'bg-ss-success/5 border-ss-success/20' : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    {section.isComplete ? (
                      <CheckCircle className="w-5 h-5 text-ss-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-healthcare-sm font-medium text-healthcare-primary">
                          {section.title}
                        </span>
                        {section.isRequired && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      
                      {showWordCounts && section.wordCount !== undefined && (
                        <div className="text-healthcare-xs text-gray-600">
                          {section.wordCount} words
                          {section.minWords && (
                            <span className={cn(
                              'ml-1',
                              section.wordCount < section.minWords ? 'text-ss-alert' : 'text-gray-500'
                            )}>
                              (min: {section.minWords})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {showQuality && section.quality && (
                      <Badge className={cn('text-xs', qualityConfig.bg, qualityConfig.color)}>
                        {qualityConfig.label}
                      </Badge>
                    )}
                    
                    {section.lastUpdated && (
                      <span className="text-healthcare-xs text-gray-400">
                        {new Date(section.lastUpdated).toLocaleTimeString('en-AU', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estimate */}
        {estimatedTimeRemaining > 0 && (
          <div className="flex items-center justify-between p-3 bg-ss-alert/5 rounded-lg border border-ss-alert/20">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-ss-alert" />
              <span className="text-healthcare-sm font-medium text-healthcare-primary">
                Estimated time remaining
              </span>
            </div>
            <span className="text-healthcare-sm font-semibold text-ss-alert">
              {estimatedTimeRemaining} minutes
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

NarrativeProgress.displayName = 'NarrativeProgress';