// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui';
import { Button } from '@starter/ui';
import { Textarea } from '@starter/ui';
import { Badge } from '@starter/ui';
import { Input } from '@starter/ui';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  X, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Save,
  RotateCcw,
  Lightbulb,
  Target,
  Users
} from 'lucide-react';

export interface ContributingCondition {
  id: string;
  type: 'environmental' | 'behavioral' | 'behavioural' | 'medical' | 'communication' | 'procedural' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  isModifiable: boolean;
  recommendedActions?: string[];
  status: 'identified' | 'confirmed' | 'addressed' | 'ongoing';
}

export interface ConditionsEditorProps {
  conditions: ContributingCondition[];
  onConditionAdd: (condition: Omit<ContributingCondition, 'id'>) => void;
  onConditionEdit: (id: string, condition: Partial<ContributingCondition>) => void;
  onConditionRemove: (id: string) => void;
  onConditionStatusChange: (id: string, status: ContributingCondition['status']) => void;
  readOnly?: boolean;
  showSuggestions?: boolean;
  maxConditions?: number;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

const conditionTypes = [
  { 
    value: 'environmental', 
    label: 'Environmental', 
    description: 'Physical environment factors',
    color: 'bg-blue-100 text-blue-800',
    icon: Target
  },
  { 
    value: 'behavioral', 
    label: 'Behavioral', 
    description: 'Participant behavior patterns',
    color: 'bg-purple-100 text-purple-800',
    icon: Users
  },
  { 
    value: 'behavioural', 
    label: 'Behavioural', 
    description: 'Participant behaviour patterns',
    color: 'bg-purple-100 text-purple-800',
    icon: Users
  },
  { 
    value: 'medical', 
    label: 'Medical', 
    description: 'Health-related conditions',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle
  },
  { 
    value: 'communication', 
    label: 'Communication', 
    description: 'Communication barriers',
    color: 'bg-green-100 text-green-800',
    icon: Users
  },
  { 
    value: 'procedural', 
    label: 'Procedural', 
    description: 'Process or procedure issues',
    color: 'bg-yellow-100 text-yellow-800',
    icon: CheckCircle
  },
  { 
    value: 'other', 
    label: 'Other', 
    description: 'Other contributing factors',
    color: 'bg-gray-100 text-gray-800',
    icon: Lightbulb
  },
];

const severityConfig = {
  low: { label: 'Low Impact', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium Impact', color: 'bg-ss-alert/10 text-ss-alert' },
  high: { label: 'High Impact', color: 'bg-red-100 text-red-800' },
};

const statusConfig = {
  identified: { label: 'Identified', color: 'bg-ss-cta-blue/10 text-ss-cta-blue' },
  confirmed: { label: 'Confirmed', color: 'bg-ss-teal/10 text-ss-teal' },
  addressed: { label: 'Addressed', color: 'bg-ss-success/10 text-ss-success' },
  ongoing: { label: 'Ongoing', color: 'bg-ss-alert/10 text-ss-alert' },
};

export const ConditionsEditor = React.forwardRef<HTMLDivElement, ConditionsEditorProps>(({
  conditions,
  onConditionAdd,
  onConditionEdit,
  onConditionRemove,
  onConditionStatusChange,
  readOnly = false,
  showSuggestions = true,
  maxConditions = 10,
  variant = 'full',
  className,
}, ref) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newCondition, setNewCondition] = React.useState<Partial<ContributingCondition>>({
    type: 'environmental',
    title: '',
    description: '',
    severity: 'medium',
    isModifiable: true,
    status: 'identified',
  });

  const handleAddCondition = () => {
    if (newCondition.title && newCondition.description && newCondition.type) {
      onConditionAdd(newCondition as Omit<ContributingCondition, 'id'>);
      setNewCondition({
        type: 'environmental',
        title: '',
        description: '',
        severity: 'medium',
        isModifiable: true,
        status: 'identified',
      });
      setIsAdding(false);
    }
  };

  const getTypeConfig = (type: string) => {
    return conditionTypes.find(t => t.value === type) || conditionTypes[0];
  };

  const canAddMore = conditions.length < maxConditions;

  if (variant === 'minimal') {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-healthcare-base font-semibold text-healthcare-primary">
            Contributing Conditions ({conditions.length})
          </h4>
          {!readOnly && canAddMore && (
            <Button
              size="sm"
              onClick={() => setIsAdding(true)}
              className="bg-ss-teal hover:bg-ss-teal-deep text-white"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {conditions.map((condition) => {
            const typeConfig = getTypeConfig(condition.type);
            return (
              <Badge 
                key={condition.id} 
                className={cn('text-xs', typeConfig.color)}
              >
                {condition.title}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card ref={ref} className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-ss-alert" />
            <span>Contributing Conditions</span>
            <Badge variant="outline" className="text-xs">
              {conditions.length}/{maxConditions}
            </Badge>
          </div>
          
          {!readOnly && canAddMore && (
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-ss-teal hover:bg-ss-teal-deep text-white"
              disabled={isAdding}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Condition
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add New Condition Form */}
        {isAdding && !readOnly && (
          <Card className="border-ss-teal/20 bg-ss-teal/5">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-healthcare-primary">Add New Contributing Condition</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAdding(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-healthcare-sm font-medium text-healthcare-primary mb-1">
                    Condition Type *
                  </label>
                  <select
                    value={newCondition.type}
                    onChange={(e) => setNewCondition(prev => ({ 
                      ...prev, 
                      type: e.target.value as ContributingCondition['type'] 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-ss-teal focus:ring-ss-teal text-healthcare-sm"
                  >
                    {conditionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-healthcare-sm font-medium text-healthcare-primary mb-1">
                    Severity *
                  </label>
                  <select
                    value={newCondition.severity}
                    onChange={(e) => setNewCondition(prev => ({ 
                      ...prev, 
                      severity: e.target.value as ContributingCondition['severity'] 
                    }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-ss-teal focus:ring-ss-teal text-healthcare-sm"
                  >
                    <option value="low">Low Impact</option>
                    <option value="medium">Medium Impact</option>
                    <option value="high">High Impact</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-healthcare-sm font-medium text-healthcare-primary mb-1">
                  Condition Title *
                </label>
                <Input
                  value={newCondition.title || ''}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the contributing condition"
                  className="border-gray-300 focus:border-ss-teal focus:ring-ss-teal"
                />
              </div>
              
              <div>
                <label className="block text-healthcare-sm font-medium text-healthcare-primary mb-1">
                  Detailed Description *
                </label>
                <Textarea
                  value={newCondition.description || ''}
                  onChange={(e) => setNewCondition(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed explanation of how this condition contributed to the incident"
                  className="min-h-20 border-gray-300 focus:border-ss-teal focus:ring-ss-teal"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newCondition.isModifiable || false}
                    onChange={(e) => setNewCondition(prev => ({ ...prev, isModifiable: e.target.checked }))}
                    className="rounded border-gray-300 text-ss-teal focus:ring-ss-teal"
                  />
                  <span className="text-healthcare-sm text-healthcare-primary">
                    This condition can be modified/prevented
                  </span>
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleAddCondition}
                  className="bg-ss-teal hover:bg-ss-teal-deep"
                  disabled={!newCondition.title || !newCondition.description}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Add Condition
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Conditions */}
        <div className="space-y-3">
          {conditions.map((condition) => {
            const typeConfig = getTypeConfig(condition.type);
            const severityConfig_ = severityConfig[condition.severity];
            const statusConfig_ = statusConfig[condition.status];
            const IconComponent = typeConfig.icon;

            return (
              <Card 
                key={condition.id} 
                className="border-l-4 border-l-ss-teal bg-healthcare-surface"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <IconComponent className="w-5 h-5 text-ss-teal" />
                        
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-healthcare-base text-healthcare-primary">
                            {condition.title}
                          </h4>
                          
                          <Badge className={cn('text-xs', typeConfig.color)}>
                            {typeConfig.label}
                          </Badge>
                          
                          <Badge className={cn('text-xs', severityConfig_.color)}>
                            {severityConfig_.label}
                          </Badge>
                          
                          <Badge className={cn('text-xs', statusConfig_.color)}>
                            {statusConfig_.label}
                          </Badge>
                          
                          {condition.isModifiable && (
                            <Badge className="bg-ss-success/10 text-ss-success text-xs">
                              Modifiable
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-healthcare-sm text-gray-700 mb-3">
                        {condition.description}
                      </p>
                      
                      {condition.recommendedActions && condition.recommendedActions.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-healthcare-sm font-medium text-healthcare-primary mb-1">
                            Recommended Actions:
                          </h5>
                          <ul className="text-healthcare-sm text-gray-600 space-y-1">
                            {condition.recommendedActions.map((action, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-1.5 h-1.5 bg-ss-teal rounded-full mt-2 mr-2 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {!readOnly && (
                      <div className="flex items-center space-x-2 ml-4">
                        <select
                          value={condition.status}
                          onChange={(e) => onConditionStatusChange(condition.id, e.target.value as ContributingCondition['status'])}
                          className="text-healthcare-xs p-1 border border-gray-300 rounded"
                        >
                          <option value="identified">Identified</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="addressed">Addressed</option>
                          <option value="ongoing">Ongoing</option>
                        </select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(condition.id)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onConditionRemove(condition.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {conditions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-healthcare-base mb-2">No contributing conditions identified yet</p>
            <p className="text-healthcare-sm">
              Add conditions that may have contributed to this incident
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ConditionsEditor.displayName = 'ConditionsEditor';