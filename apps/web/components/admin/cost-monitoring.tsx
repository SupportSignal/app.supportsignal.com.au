'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Badge } from '@starter/ui';
import { Progress } from '@starter/ui';
import { DollarSign, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

interface CostMonitoringProps {
  refreshTrigger?: number;
}

export function CostMonitoring({ refreshTrigger }: CostMonitoringProps) {
  const costMetrics = useQuery(api.rateLimiter.getCostMetrics);
  
  // Cost metrics refresh automatically via Convex reactivity
  // The refreshTrigger prop is kept for API compatibility but not needed
  useEffect(() => {
    // Note: getCostMetrics automatically updates when the underlying data changes
    // No manual refresh needed due to Convex's reactive queries
  }, [refreshTrigger]);

  if (!costMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost & Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBudgetStatus = (
    percentage: number
  ): {
    status: string;
    color: 'default' | 'destructive' | 'outline' | 'secondary';
    icon: React.ComponentType<{ className?: string }>;
  } => {
    if (percentage >= 95)
      return {
        status: 'critical',
        color: 'destructive' as const,
        icon: AlertTriangle,
      };
    if (percentage >= 80)
      return {
        status: 'warning',
        color: 'secondary' as const,
        icon: TrendingUp,
      };
    return { status: 'healthy', color: 'default' as const, icon: DollarSign };
  };

  const budgetStatus = getBudgetStatus(costMetrics.budgetUsedPercent);
  const StatusIcon = budgetStatus.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cost & Budget Monitoring
        </CardTitle>
        <CardDescription>Monthly usage and cost tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Overview */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Monthly Budget Usage</span>
            <div className="flex items-center gap-2">
              <StatusIcon
                className={`h-4 w-4 ${budgetStatus.status === 'critical' ? 'text-destructive' : budgetStatus.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}
              />
              <Badge variant={budgetStatus.color}>
                {costMetrics.budgetUsedPercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
          <Progress value={costMetrics.budgetUsedPercent} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1">
            ${costMetrics.estimatedCost.toFixed(4)} of $10.00 monthly budget
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="grid gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Writes</span>
            <span className="text-sm">
              {costMetrics.totalWrites.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Estimated Cost</span>
            <span className="text-sm">
              ${costMetrics.estimatedCost.toFixed(4)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Budget Remaining</span>
            <span className="text-sm">
              {costMetrics.budgetRemaining.toLocaleString()} writes
            </span>
          </div>
        </div>

        {/* System Breakdown */}
        <div className="border-t pt-3">
          <h4 className="font-medium mb-2">Usage by System</h4>
          <div className="space-y-2">
            {Object.entries(costMetrics.breakdown).map(([system, writes]) => {
              const writesNum = Number(writes);
              const percentage = (writesNum / costMetrics.totalWrites) * 100;
              return (
                <div key={system} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{system}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm">
                      {writesNum.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alert Information */}
        {costMetrics.budgetUsedPercent >= 80 && (
          <div
            className={`border rounded-lg p-3 ${costMetrics.budgetUsedPercent >= 95 ? 'border-destructive bg-destructive/5' : 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                className={`h-4 w-4 ${costMetrics.budgetUsedPercent >= 95 ? 'text-destructive' : 'text-yellow-600'}`}
              />
              <span className="font-medium text-sm">
                {costMetrics.budgetUsedPercent >= 95
                  ? 'Critical Budget Alert'
                  : 'Budget Warning'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {costMetrics.budgetUsedPercent >= 95
                ? 'Budget nearly exhausted. System may throttle new logs.'
                : 'Monitor usage closely to avoid budget overrun.'}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          Budget resets monthly. Costs calculated at $2.00 per million writes.
        </div>
      </CardContent>
    </Card>
  );
}
