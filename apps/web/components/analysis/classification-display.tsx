'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Badge } from '@starter/ui';
import { Button } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Shield, 
  Heart, 
  MessageCircle, 
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  AlertCircle,
  Info,
  Edit
} from 'lucide-react';

export interface IncidentClassification {
  incidentType: 'behavioral' | 'behavioural' | 'environmental' | 'medical' | 'communication' | 'other';
  severity: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  supportingEvidence: string[];
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'extreme';
  recommendedActions: string[];
  reviewRequired: boolean;
  aiGenerated: boolean;
  lastUpdated: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ClassificationDisplayProps {
  classification: IncidentClassification;
  onEdit?: () => void;
  onReview?: () => void;
  onApprove?: () => void;
  showDetails?: boolean;
  showActions?: boolean;
  readOnly?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const incidentTypeConfig = {
  behavioral: {
    label: 'Behavioral',
    description: 'Related to participant behavior patterns',
    icon: Activity,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  behavioural: {
    label: 'Behavioural', 
    description: 'Related to participant behavior patterns',
    icon: Activity,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  environmental: {
    label: 'Environmental',
    description: 'Related to physical environment factors',
    icon: Shield,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  medical: {
    label: 'Medical',
    description: 'Related to health and medical conditions',
    icon: Heart,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
  communication: {
    label: 'Communication',
    description: 'Related to communication barriers or issues',
    icon: MessageCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  other: {
    label: 'Other',
    description: 'Does not fit standard categories',
    icon: HelpCircle,
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
};

const severityConfig = {
  low: {
    label: 'Low Severity',
    description: 'Minor impact, routine follow-up',
    icon: TrendingDown,
    color: 'text-ss-success',
    bgColor: 'bg-ss-success/10',
    borderColor: 'border-ss-success/20',
  },
  medium: {
    label: 'Medium Severity',
    description: 'Moderate impact, requires attention',
    icon: Activity,
    color: 'text-ss-alert',
    bgColor: 'bg-ss-alert/10',
    borderColor: 'border-ss-alert/20',
  },
  high: {
    label: 'High Severity',
    description: 'Significant impact, immediate action required',
    icon: TrendingUp,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
};

const riskLevelConfig = {
  minimal: { label: 'Minimal Risk', color: 'bg-gray-100 text-gray-800' },
  low: { label: 'Low Risk', color: 'bg-ss-success/10 text-ss-success' },
  moderate: { label: 'Moderate Risk', color: 'bg-ss-alert/10 text-ss-alert' },
  high: { label: 'High Risk', color: 'bg-red-100 text-red-700' },
  extreme: { label: 'Extreme Risk', color: 'bg-red-600 text-white' },
};

export const ClassificationDisplay = React.forwardRef<HTMLDivElement, ClassificationDisplayProps>(({
  classification,
  onEdit,
  onReview,
  onApprove,
  showDetails = true,
  showActions = true,
  readOnly = false,
  variant = 'full',
  className,
}, ref) => {
  const typeConfig = incidentTypeConfig[classification.incidentType];
  const severityConfig_ = severityConfig[classification.severity];
  const riskConfig = riskLevelConfig[classification.riskLevel];
  
  const TypeIcon = typeConfig.icon;
  const SeverityIcon = severityConfig_.icon;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-ss-success';
    if (confidence >= 70) return 'text-ss-alert';
    return 'text-red-600';
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-AU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('flex items-center space-x-3', className)}>
        <div className="flex items-center space-x-2">
          <TypeIcon className={cn('w-4 h-4', typeConfig.color)} />
          <span className="text-healthcare-sm font-medium text-healthcare-primary">
            {typeConfig.label}
          </span>
        </div>
        
        <Badge className={cn('text-xs', severityConfig_.bgColor, severityConfig_.color)}>
          {severityConfig_.label}
        </Badge>
        
        <Badge className={cn('text-xs', riskConfig.color)}>
          {riskConfig.label}
        </Badge>
        
        <span className={cn('text-healthcare-xs font-medium', getConfidenceColor(classification.confidence))}>
          {classification.confidence}% confidence
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card ref={ref} className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
                <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                    {typeConfig.label} Incident
                  </h4>
                  <Badge className={cn('text-xs', severityConfig_.bgColor, severityConfig_.color)}>
                    {severityConfig_.label}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={cn('text-xs', riskConfig.color)}>
                    {riskConfig.label}
                  </Badge>
                  
                  <span className={cn('text-healthcare-xs', getConfidenceColor(classification.confidence))}>
                    {classification.confidence}% confidence
                  </span>
                  
                  {classification.aiGenerated && (
                    <Badge className="bg-ss-teal/10 text-ss-teal text-xs">AI Generated</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {showActions && !readOnly && (
              <div className="flex items-center space-x-2">
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg', typeConfig.bgColor)}>
              <TypeIcon className={cn('w-6 h-6', typeConfig.color)} />
            </div>
            
            <div>
              <h3 className="text-healthcare-lg font-semibold text-healthcare-primary">
                Incident Classification
              </h3>
              <p className="text-healthcare-sm text-gray-600">
                AI-powered analysis with {classification.confidence}% confidence
              </p>
            </div>
          </div>
          
          {showActions && !readOnly && (
            <div className="flex items-center space-x-2">
              {onReview && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onReview}
                  className="border-ss-cta-blue text-ss-cta-blue"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Review
                </Button>
              )}
              
              {onEdit && (
                <Button 
                  size="sm" 
                  onClick={onEdit}
                  className="bg-ss-teal hover:bg-ss-teal-deep"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Classification Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cn('border-l-4', typeConfig.borderColor, typeConfig.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
                <div>
                  <h4 className={cn('font-semibold text-healthcare-base', typeConfig.color)}>
                    {typeConfig.label}
                  </h4>
                  <p className="text-healthcare-xs text-gray-600">
                    {typeConfig.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn('border-l-4', severityConfig_.borderColor, severityConfig_.bgColor)}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <SeverityIcon className={cn('w-5 h-5', severityConfig_.color)} />
                <div>
                  <h4 className={cn('font-semibold text-healthcare-base', severityConfig_.color)}>
                    {severityConfig_.label}
                  </h4>
                  <p className="text-healthcare-xs text-gray-600">
                    {severityConfig_.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-ss-teal bg-ss-teal/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="text-2xl font-bold text-ss-teal">
                    {classification.confidence}%
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-healthcare-base text-ss-teal">
                    Confidence
                  </h4>
                  <p className="text-healthcare-xs text-gray-600">
                    AI classification confidence
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Assessment */}
        <div>
          <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
            Risk Assessment
          </h4>
          <div className="flex items-center space-x-4">
            <Badge className={cn('text-sm px-3 py-1', riskConfig.color)}>
              {riskConfig.label}
            </Badge>
            
            {classification.reviewRequired && (
              <div className="flex items-center space-x-1 text-ss-alert">
                <AlertCircle className="w-4 h-4" />
                <span className="text-healthcare-sm font-medium">Review Required</span>
              </div>
            )}
            
            {classification.aiGenerated && (
              <Badge className="bg-ss-cta-blue/10 text-ss-cta-blue">
                AI Generated
              </Badge>
            )}
          </div>
        </div>

        {/* Supporting Evidence */}
        {showDetails && classification.supportingEvidence.length > 0 && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Supporting Evidence
            </h4>
            <ul className="space-y-2">
              {classification.supportingEvidence.map((evidence, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-ss-success mt-0.5 flex-shrink-0" />
                  <span className="text-healthcare-sm text-gray-700">{evidence}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Actions */}
        {showDetails && classification.recommendedActions.length > 0 && (
          <div>
            <h4 className="font-semibold text-healthcare-base text-healthcare-primary mb-3">
              Recommended Actions
            </h4>
            <ul className="space-y-2">
              {classification.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-ss-teal rounded-full mt-2 flex-shrink-0" />
                  <span className="text-healthcare-sm text-gray-700">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Review Information */}
        {(classification.reviewedBy || classification.reviewedAt) && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4 text-healthcare-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Info className="w-4 h-4" />
                <span>Last updated: {formatTimestamp(classification.lastUpdated)}</span>
              </div>
              
              {classification.reviewedBy && (
                <span>Reviewed by: {classification.reviewedBy}</span>
              )}
              
              {classification.reviewedAt && (
                <span>Review date: {formatTimestamp(classification.reviewedAt)}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ClassificationDisplay.displayName = 'ClassificationDisplay';