/**
 * Story 11.0: Enhanced Model Selector with Cost Indicators
 *
 * Model selector dropdown component for AI prompt configuration.
 * Displays available AI models with capabilities, recommendations, and cost estimates.
 */

"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Label } from '@starter/ui/label';
import { Badge } from '@starter/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@starter/ui/tooltip';
import { Sparkles, Info } from 'lucide-react';
import { AI_MODELS, calculatePromptCost, formatCost } from '@/lib/ai-models';

// Re-export for backward compatibility
export const AVAILABLE_MODELS = AI_MODELS;
export type ModelId = typeof AI_MODELS[number]['id'];

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  showDescription?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  label = 'AI Model',
  showDescription = true,
  disabled = false,
  className = '',
}: ModelSelectorProps) {
  const selectedModel = AI_MODELS.find(m => m.id === value);
  const selectedModelCost = selectedModel ? calculatePromptCost(selectedModel.id) : 0;

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center gap-2 mb-1">
          <Label className="text-xs font-medium text-gray-700">
            {label}
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Cost estimates based on average prompt size (~1000 tokens).
                  Actual costs vary by prompt length and response complexity.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full text-xs">
          <SelectValue placeholder="Select AI model">
            {selectedModel && (
              <div className="flex items-center gap-2">
                <span>{selectedModel.name}</span>
                {selectedModel.recommended && (
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AI_MODELS.map((model) => {
            const cost = calculatePromptCost(model.id);
            return (
              <SelectItem key={model.id} value={model.id} className="text-xs">
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {model.recommended && (
                      <Badge variant="outline" className="text-xs px-1 py-0 border-yellow-300 text-yellow-600">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs font-mono">
                    {formatCost(cost)}/prompt
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {showDescription && selectedModel && (
        <div className="mt-1 space-y-1">
          <p className="text-xs text-gray-500">
            {selectedModel.description}
          </p>
          <p className="text-xs text-gray-400 font-mono">
            Est. cost: {formatCost(selectedModelCost)} per prompt
          </p>
        </div>
      )}
    </div>
  );
}
