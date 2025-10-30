/**
 * Story 11.0: Prompt Performance Metrics Component
 *
 * Displays timing, token usage, and cost metrics for prompt execution.
 * Supports comparison view for batch testing results.
 *
 * Foundation component - will be enhanced in Story 11.2 for batch comparison.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Zap, Clock, DollarSign, Hash } from 'lucide-react';
import { formatCost } from '@/lib/ai-models';

interface PromptMetrics {
  executionTime: number; // milliseconds
  tokenCount?: number;
  estimatedCost?: number;
  modelUsed: string;
  timestamp: Date;
}

interface PromptPerformanceMetricsProps {
  metrics: PromptMetrics | PromptMetrics[];
  mode?: 'single' | 'comparison';
  className?: string;
}

export function PromptPerformanceMetrics({
  metrics,
  mode = 'single',
  className = '',
}: PromptPerformanceMetricsProps) {
  const metricsArray = Array.isArray(metrics) ? metrics : [metrics];
  const isSingleMode = mode === 'single' || metricsArray.length === 1;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Metrics
          </CardTitle>
          {mode === 'comparison' && (
            <Badge variant="outline" className="text-xs">
              Comparing {metricsArray.length} runs
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isSingleMode ? (
          <SingleMetricsView metrics={metricsArray[0]} />
        ) : (
          <ComparisonMetricsView metrics={metricsArray} />
        )}
      </CardContent>
    </Card>
  );
}

function SingleMetricsView({ metrics }: { metrics: PromptMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Execution Time */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Time</p>
          <p className="text-sm font-medium">{formatTime(metrics.executionTime)}</p>
        </div>
      </div>

      {/* Token Count */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <Hash className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Tokens</p>
          <p className="text-sm font-medium">
            {metrics.tokenCount ? metrics.tokenCount.toLocaleString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Estimated Cost */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Cost</p>
          <p className="text-sm font-medium font-mono">
            {metrics.estimatedCost !== undefined ? formatCost(metrics.estimatedCost) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Model Used */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded">
        <Zap className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Model</p>
          <p className="text-xs font-medium truncate">{metrics.modelUsed}</p>
        </div>
      </div>
    </div>
  );
}

function ComparisonMetricsView({ metrics }: { metrics: PromptMetrics[] }) {
  // Calculate aggregates
  const avgTime =
    metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;
  const totalTokens = metrics.reduce((sum, m) => sum + (m.tokenCount || 0), 0);
  const totalCost = metrics.reduce((sum, m) => sum + (m.estimatedCost || 0), 0);

  return (
    <div className="space-y-3">
      {/* Aggregates */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 bg-muted rounded text-center">
          <p className="text-muted-foreground mb-1">Avg Time</p>
          <p className="font-medium">{formatTime(avgTime)}</p>
        </div>
        <div className="p-2 bg-muted rounded text-center">
          <p className="text-muted-foreground mb-1">Total Tokens</p>
          <p className="font-medium">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="p-2 bg-muted rounded text-center">
          <p className="text-muted-foreground mb-1">Total Cost</p>
          <p className="font-medium font-mono">{formatCost(totalCost)}</p>
        </div>
      </div>

      {/* Individual runs */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Individual Runs:</p>
        {metrics.map((m, index) => (
          <div key={index} className="text-xs p-2 bg-muted/50 rounded">
            <div className="flex items-center justify-between">
              <span className="font-medium">Run {index + 1}</span>
              <span className="text-muted-foreground">{formatTime(m.executionTime)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
