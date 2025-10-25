"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@starter/ui/select';
import { Label } from '@starter/ui/label';
import { Badge } from '@starter/ui/badge';
import { Sparkles } from 'lucide-react';

// Available AI models for prompts
// Keep this in sync with environment configuration defaults
export const AVAILABLE_MODELS = [
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'Highest quality, best for complex reasoning',
    recommended: true,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'High quality, multimodal capabilities',
    recommended: false,
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and cost-effective, good for simple tasks',
    recommended: false,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Excellent for writing and analysis',
    recommended: false,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fast and efficient for straightforward tasks',
    recommended: false,
  },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

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
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === value);

  return (
    <div className={className}>
      {label && (
        <Label className="text-xs font-medium text-gray-700 mb-1 block">
          {label}
        </Label>
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
          {AVAILABLE_MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id} className="text-xs">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{model.name}</span>
                  {model.recommended && (
                    <Badge variant="outline" className="text-xs px-1 py-0 border-yellow-300 text-yellow-600">
                      Recommended
                    </Badge>
                  )}
                </div>
                <span className="text-gray-500 text-xs">{model.provider}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showDescription && selectedModel && (
        <p className="text-xs text-gray-500 mt-1">
          {selectedModel.description}
        </p>
      )}
    </div>
  );
}
