'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useAllPrompts } from '@/lib/prompts/prompt-template-service';

/**
 * Story 6.9 - Task 9: Admin Alert Widget for High Token Usage
 *
 * Dashboard widget showing prompts with adjusted token limits for proactive monitoring.
 */

// Type definitions
interface AIPromptTemplate {
  name: string;
  category: string;
  max_tokens?: number;
  baseline_max_tokens?: number;
  adjusted_at?: number;
  adjustment_reason?: string;
}

interface AdjustedPrompt {
  name: string;
  category: string;
  maxTokens: number;
  baselineTokens: number;
  difference: number;
  adjustedAt: Date | null;
  adjustmentReason: string | undefined;
}

export function TokenUsageAlertWidget() {
  const { user } = useAuth();
  const templates = useAllPrompts(user?.sessionToken);

  // Find prompts with adjusted token limits that haven't been acknowledged
  const adjustedPrompts = React.useMemo(() => {
    if (!templates) return [];

    return templates
      .filter((template: any) => {
        const baselineTokens = template.baseline_max_tokens;
        const maxTokens = template.max_tokens;
        const acknowledgedAt = template.acknowledged_at;
        // Only show if adjusted AND not yet acknowledged
        return baselineTokens && maxTokens && maxTokens > baselineTokens && !acknowledgedAt;
      })
      .map((template: any): AdjustedPrompt => {
        const baselineTokens = template.baseline_max_tokens!;
        const maxTokens = template.max_tokens!;
        const adjustedAt = template.adjusted_at;
        const adjustmentReason = template.adjustment_reason;

        return {
          name: template.name,
          category: template.category,
          maxTokens,
          baselineTokens,
          difference: maxTokens - baselineTokens,
          adjustedAt: adjustedAt ? new Date(adjustedAt) : null,
          adjustmentReason,
        };
      })
      .sort((a: AdjustedPrompt, b: AdjustedPrompt) => b.difference - a.difference); // Sort by highest difference first
  }, [templates]);

  // Don't show widget if no adjusted prompts
  if (adjustedPrompts.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-600 dark:text-orange-400" size={20} />
            <CardTitle className="text-lg text-orange-900 dark:text-orange-100">
              Token Limit Adjustments
            </CardTitle>
          </div>
          <Badge variant="secondary" className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
            {adjustedPrompts.length} {adjustedPrompts.length === 1 ? 'Prompt' : 'Prompts'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-orange-800 dark:text-orange-300 mb-4">
          The following AI prompts have had their token limits automatically adjusted due to truncation events:
        </p>

        <div className="space-y-3">
          {adjustedPrompts.slice(0, 5).map((prompt: AdjustedPrompt) => (
            <div
              key={prompt.name}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {prompt.name}
                    </h4>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                      <TrendingUp size={10} className="mr-1" />
                      +{prompt.difference}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>Baseline: {prompt.baselineTokens}</span>
                    <span>Current: {prompt.maxTokens}</span>
                  </div>
                  {prompt.adjustmentReason && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {prompt.adjustmentReason}
                    </p>
                  )}
                  {prompt.adjustedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Adjusted: {prompt.adjustedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {adjustedPrompts.length > 5 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center pt-2">
              ... and {adjustedPrompts.length - 5} more
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
          <Link href="/admin/ai-prompts">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900"
            >
              <ExternalLink size={14} className="mr-2" />
              Manage AI Prompt Templates
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
