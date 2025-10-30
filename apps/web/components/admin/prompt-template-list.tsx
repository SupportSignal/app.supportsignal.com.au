"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Checkbox } from '@starter/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@starter/ui/tooltip';
import { useAllPrompts } from '@/lib/prompts/prompt-template-service';
import { AIPromptTemplate, TEMPLATE_CATEGORIES, CATEGORY_LABELS, AIPrompt } from '@/types/prompt-templates';
import { useAuth } from '@/components/auth/auth-provider';
import { Search, Eye, Check, TrendingUp, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@starter/ui/alert-dialog';
import { ModelSelector, AVAILABLE_MODELS } from './model-selector';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

interface PromptTemplateListProps {
  onPreview?: (template: AIPromptTemplate) => void;
}

export function PromptTemplateList({
  onPreview
}: PromptTemplateListProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
  const [bulkModel, setBulkModel] = useState<string>(AVAILABLE_MODELS[0].id);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false);
  const [resetTargetPrompt, setResetTargetPrompt] = useState<AIPromptTemplate | null>(null);

  const bulkUpdateModels = useMutation(api.promptManager.bulkUpdatePromptModels);
  const resetPromptToBaseline = useMutation(api.promptManager.resetPromptToBaseline);
  const acknowledgePromptAdjustment = useMutation(api.promptManager.acknowledgePromptAdjustment);
  // No longer need expandedPrompts state - all templates show as textareas
  
  const rawPrompts = useAllPrompts(user?.sessionToken, filterCategory === 'all' ? undefined : filterCategory);
  const loading = rawPrompts === undefined;
  const error = rawPrompts === null;

  // Transform ai_prompts data to AIPromptTemplate format for compatibility
  const templates: AIPromptTemplate[] = React.useMemo(() => {
    if (!rawPrompts) return [];
    
    return rawPrompts.map((prompt: AIPrompt): AIPromptTemplate => ({
      ...prompt,
      name: prompt.prompt_name,
      category: (prompt.subsystem as any) || 'general',
      variables: [], // ai_prompts doesn't store structured variables like the old system
      version: parseFloat(prompt.prompt_version?.replace('v', '') || '1.0') || 1.0,
      updated_at: prompt.created_at, // Use created_at as updated_at since we don't track updates yet
    }));
  }, [rawPrompts]);

  // Filter templates based on search and category
  const filteredTemplates = React.useMemo(() => {
    if (!templates) return [];

    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [templates, searchTerm, filterCategory]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredTemplates.map(t => t._id));
      setSelectedPromptIds(allIds);
    } else {
      setSelectedPromptIds(new Set());
    }
  };

  const handleSelectPrompt = (promptId: string, checked: boolean) => {
    const newSelected = new Set(selectedPromptIds);
    if (checked) {
      newSelected.add(promptId);
    } else {
      newSelected.delete(promptId);
    }
    setSelectedPromptIds(newSelected);
  };

  const isAllSelected = filteredTemplates.length > 0 &&
                        filteredTemplates.every(t => selectedPromptIds.has(t._id));
  const isSomeSelected = selectedPromptIds.size > 0 && !isAllSelected;

  // Bulk update handler
  const handleBulkUpdate = async () => {
    if (!user?.sessionToken || selectedPromptIds.size === 0) {
      toast.error('Please select prompts to update');
      return;
    }

    setIsApplyingBulk(true);
    try {
      const promptIdsArray = Array.from(selectedPromptIds) as Id<"ai_prompts">[];
      const result = await bulkUpdateModels({
        sessionToken: user.sessionToken,
        prompt_ids: promptIdsArray,
        ai_model: bulkModel,
      });

      if (result.success) {
        toast.success(
          `Successfully updated ${result.updated} prompt${result.updated !== 1 ? 's' : ''} to ${bulkModel}`,
          {
            description: result.failed > 0
              ? `${result.failed} prompt${result.failed !== 1 ? 's' : ''} failed to update`
              : undefined,
          }
        );

        // Clear selection after successful update
        setSelectedPromptIds(new Set());
      } else {
        toast.error('Bulk update failed', {
          description: 'Check console for details',
        });
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to update prompts', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // Story 6.9 - Task 8: Reset to baseline handlers
  const handleAcknowledgeClick = (template: AIPromptTemplate) => {
    setResetTargetPrompt(template);
    setAcknowledgeDialogOpen(true);
  };

  const handleAcknowledgeConfirm = async () => {
    if (!user?.sessionToken || !resetTargetPrompt) {
      return;
    }

    try {
      const result = await acknowledgePromptAdjustment({
        sessionToken: user.sessionToken,
        prompt_name: resetTargetPrompt.name,
      });

      if (result.success) {
        toast.success(
          `Adjustment acknowledged`,
          {
            description: `${resetTargetPrompt.name}: Token limit increase approved`,
          }
        );
      }
    } catch (error) {
      console.error('Acknowledge error:', error);
      toast.error('Failed to acknowledge adjustment', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setAcknowledgeDialogOpen(false);
      setResetTargetPrompt(null);
    }
  };

  const handleResetClick = (template: AIPromptTemplate) => {
    setResetTargetPrompt(template);
    setResetDialogOpen(true);
  };

  const handleResetConfirm = async () => {
    if (!user?.sessionToken || !resetTargetPrompt) {
      return;
    }

    try {
      const result = await resetPromptToBaseline({
        sessionToken: user.sessionToken,
        prompt_name: resetTargetPrompt.name,
      });

      if (result.success) {
        toast.success(
          `Token limit reset to baseline`,
          {
            description: `${resetTargetPrompt.name}: ${result.old_max_tokens} → ${result.new_max_tokens} tokens`,
          }
        );
      }
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset token limit', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setResetDialogOpen(false);
      setResetTargetPrompt(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Failed to load prompt templates. Please check your permissions or try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // Story 6.9 - Task 7: Token adjustment badge logic
  const getTokenAdjustmentBadge = (template: AIPromptTemplate) => {
    const maxTokens = template.max_tokens;
    const baselineTokens = (template as any).baseline_max_tokens;
    const adjustedAt = (template as any).adjusted_at;
    const adjustmentReason = (template as any).adjustment_reason;
    const acknowledgedAt = (template as any).acknowledged_at;

    // No max_tokens set
    if (!maxTokens) {
      return null;
    }

    // No baseline OR baseline equals current (not adjusted)
    if (!baselineTokens || maxTokens === baselineTokens) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <Check size={12} className="mr-1" />
                Baseline
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Token limit at baseline ({maxTokens} tokens)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Token limit has been adjusted
    const diff = maxTokens - baselineTokens;
    const adjustedDate = adjustedAt ? new Date(adjustedAt).toLocaleString() : 'Unknown';
    const acknowledgedDate = acknowledgedAt ? new Date(acknowledgedAt).toLocaleString() : null;

    // Acknowledged adjustment - shows as blue (reviewed, approved)
    if (acknowledgedAt) {
      return (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block cursor-help">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  <Check size={12} className="mr-1" />
                  +{diff}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="top">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Adjustment Acknowledged</p>
                <p>Baseline: {baselineTokens} tokens</p>
                <p>Current: {maxTokens} tokens (+{diff})</p>
                {adjustmentReason && <p className="text-xs text-gray-600 mt-2">{adjustmentReason}</p>}
                <p className="text-xs text-gray-500 mt-1">Adjusted: {adjustedDate}</p>
                {acknowledgedDate && (
                  <p className="text-xs text-blue-600 mt-1">✓ Acknowledged: {acknowledgedDate}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Needs review - shows as orange (requires admin attention)
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block cursor-help">
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                <TrendingUp size={12} className="mr-1" />
                +{diff}
              </Badge>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs" side="top">
            <div className="space-y-1 text-sm">
              <p className="font-semibold">⚠️ Needs Review</p>
              <p>Baseline: {baselineTokens} tokens</p>
              <p>Current: {maxTokens} tokens (+{diff})</p>
              {adjustmentReason && <p className="text-xs text-gray-600 mt-2">{adjustmentReason}</p>}
              <p className="text-xs text-gray-500 mt-1">Adjusted: {adjustedDate}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };


  return (
    <div className="space-y-6">
      {/* Bulk Action Toolbar - Appears when items are selected */}
      {selectedPromptIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {selectedPromptIds.size} prompt{selectedPromptIds.size !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Apply a model to all selected prompts
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex-1 sm:w-64">
                  <ModelSelector
                    value={bulkModel}
                    onChange={setBulkModel}
                    label=""
                    showDescription={false}
                  />
                </div>
                <Button
                  onClick={handleBulkUpdate}
                  disabled={isApplyingBulk}
                  className="whitespace-nowrap"
                >
                  {isApplyingBulk ? 'Applying...' : 'Apply to Selected'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPromptIds(new Set())}
                  disabled={isApplyingBulk}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search templates by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TEMPLATE_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Summary and Select All */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredTemplates.length} of {templates?.length || 0} templates
          {selectedPromptIds.size > 0 && (
            <span className="ml-2 font-medium text-blue-600">
              ({selectedPromptIds.size} selected)
            </span>
          )}
        </div>
        {filteredTemplates.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className={isSomeSelected ? 'data-[state=checked]:bg-blue-600' : ''}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer select-none"
            >
              Select All
            </label>
          </div>
        )}
      </div>

      {/* Template List */}
      <div className="space-y-4">
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                {searchTerm || filterCategory !== 'all' 
                  ? 'No templates match your search criteria.'
                  : 'No prompt templates found. Create your first template to get started.'
                }
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map(template => {
            const isSelected = selectedPromptIds.has(template._id);
            return (
              <Card
                key={template._id}
                className={`hover:shadow-md transition-all ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        id={`select-${template._id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectPrompt(template._id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(template.is_active !== false)}
                      >
                        {template.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Version: {template.prompt_version}</span>
                      <span>Model: {template.ai_model || 'Not specified'}</span>
                      <span>Created: {new Date(template.created_at).toLocaleDateString()}</span>
                    </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                    {onPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreview(template)}
                        className="flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Preview
                      </Button>
                    )}
                    {/* Story 6.9 - Task 8: Acknowledge and Reset buttons */}
                    {(template as any).baseline_max_tokens &&
                     template.max_tokens &&
                     template.max_tokens > (template as any).baseline_max_tokens && (
                      <>
                        {/* Primary action: Acknowledge (only if not yet acknowledged) */}
                        {!(template as any).acknowledged_at && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAcknowledgeClick(template)}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check size={14} />
                            Acknowledge Adjustment
                          </Button>
                        )}
                        {/* Secondary action: Reset (always available for rollback) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetClick(template)}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <RotateCcw size={14} />
                          Reset to Baseline
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Template Content - Always Visible Textarea */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Template Content:</div>
                  <textarea
                    value={template.prompt_template}
                    readOnly
                    className="w-full h-64 text-sm font-mono bg-white border rounded p-3 resize-y"
                    style={{ fontFamily: 'Monaco, Consolas, "Lucida Console", monospace' }}
                  />
                </div>
                
                {/* Template Metadata */}
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Template Details:</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {template.workflow_step && (
                      <Badge variant="outline" className="text-xs">
                        Step: {template.workflow_step}
                      </Badge>
                    )}
                    {template.subsystem && (
                      <Badge variant="outline" className="text-xs">
                        System: {template.subsystem}
                      </Badge>
                    )}
                    {template.max_tokens && (
                      <Badge variant="outline" className="text-xs">
                        Max Tokens: {template.max_tokens}
                      </Badge>
                    )}
                    {/* Story 6.9 - Task 7: Token adjustment status badge */}
                    {getTokenAdjustmentBadge(template)}
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>

      {/* Story 6.9 - Task 8: Reset to Baseline confirmation dialog */}
      {/* Acknowledge Dialog */}
      <AlertDialog open={acknowledgeDialogOpen} onOpenChange={setAcknowledgeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acknowledge Token Limit Adjustment?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {resetTargetPrompt && (
                <>
                  <p>
                    Acknowledge the automatic token limit increase for{' '}
                    <span className="font-semibold">{resetTargetPrompt.name}</span>.
                  </p>
                  <div className="bg-green-50 rounded-lg p-3 space-y-1 text-sm border border-green-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Baseline Limit:</span>
                      <span className="font-semibold">{(resetTargetPrompt as any).baseline_max_tokens} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Limit:</span>
                      <span className="font-semibold text-green-600">
                        {resetTargetPrompt.max_tokens} tokens
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-green-200">
                      <span className="text-gray-600">Increase:</span>
                      <span className="font-semibold text-green-700">
                        +{(resetTargetPrompt.max_tokens || 0) - (resetTargetPrompt as any).baseline_max_tokens} tokens
                      </span>
                    </div>
                  </div>
                  {(resetTargetPrompt as any).adjustment_reason && (
                    <div className="bg-gray-50 rounded p-2 text-sm">
                      <span className="font-medium">Reason: </span>
                      {(resetTargetPrompt as any).adjustment_reason}
                    </div>
                  )}
                  <p className="text-sm text-gray-500 pt-2">
                    ✓ This acknowledges the adjustment without changing the token limit.
                    The increased limit will remain in effect, and this prompt will be removed from the alert widget.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAcknowledgeConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Acknowledge Adjustment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Token Limit to Baseline?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {resetTargetPrompt && (
                <>
                  <p>
                    You are about to reset the token limit for{' '}
                    <span className="font-semibold">{resetTargetPrompt.name}</span> to its baseline value.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Limit:</span>
                      <span className="font-semibold">{resetTargetPrompt.max_tokens} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Baseline Limit:</span>
                      <span className="font-semibold text-green-600">
                        {(resetTargetPrompt as any).baseline_max_tokens} tokens
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Change:</span>
                      <span className="font-semibold text-orange-600">
                        {(resetTargetPrompt.max_tokens || 0) - (resetTargetPrompt as any).baseline_max_tokens} tokens
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 pt-2">
                    ⚠️ This action will remove the automatic adjustment and restore the original limit.
                    Use this only if the escalation was incorrect.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Reset to Baseline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}