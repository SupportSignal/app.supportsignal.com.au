'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex-api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Button } from '@starter/ui';
import { Badge } from '@starter/ui';
import { Progress } from '@starter/ui';
import { AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RateLimitStatusProps {
  refreshTrigger?: number;
}

export function RateLimitStatus({ refreshTrigger }: RateLimitStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rateLimitState = useQuery(api.rateLimiter.getRateLimitState);
  const updateRateLimit = useMutation(api.rateLimiter.updateRateLimitState);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await updateRateLimit({});
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Trigger refresh when refreshTrigger prop changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      handleRefresh();
    }
  }, [refreshTrigger]);

  if (!rateLimitState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rate Limiting Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw
              className="h-6 w-6 animate-spin"
              aria-label="Loading rate limit data"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSystemStatus = (
    current: number,
    limit: number
  ): {
    status: string;
    color: 'default' | 'destructive' | 'outline' | 'secondary';
  } => {
    const usage = (current / limit) * 100;
    if (usage >= 90)
      return { status: 'critical', color: 'destructive' as const };
    if (usage >= 70) return { status: 'warning', color: 'secondary' as const };
    return { status: 'healthy', color: 'default' as const };
  };

  const systems = [
    { name: 'Browser', key: 'browser', ...rateLimitState.browser },
    { name: 'Worker', key: 'worker', ...rateLimitState.worker },
    { name: 'Backend', key: 'backend', ...rateLimitState.backend },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rate Limiting Status
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </CardTitle>
        <CardDescription>
          Current usage across all logging systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Global Status */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Global Limit</span>
            <Badge
              variant={
                getSystemStatus(
                  rateLimitState.global.current,
                  rateLimitState.global.limit
                ).color
              }
            >
              {rateLimitState.global.current}/{rateLimitState.global.limit}
            </Badge>
          </div>
          <Progress
            value={
              (rateLimitState.global.current / rateLimitState.global.limit) *
              100
            }
            className="h-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Budget: {rateLimitState.global.budget.toLocaleString()} total writes
          </div>
        </div>

        {/* System Breakdown */}
        <div className="space-y-3">
          {systems.map(system => {
            const { status, color } = getSystemStatus(
              system.current,
              system.limit
            );
            const resetTime = system.resetTime
              ? new Date(system.resetTime)
              : null;

            return (
              <div key={system.key} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{system.name}</span>
                  <div className="flex items-center gap-2">
                    {status === 'critical' && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge variant={color}>
                      {system.current}/{system.limit}
                    </Badge>
                  </div>
                </div>
                <Progress
                  value={(system.current / system.limit) * 100}
                  className="h-2"
                />
                {resetTime && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Resets {formatDistanceToNow(resetTime, { addSuffix: true })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Summary */}
        <div className="text-xs text-muted-foreground border-t pt-3">
          Rate limits reset every minute. Quota borrowing enabled between
          underutilized systems.
        </div>
      </CardContent>
    </Card>
  );
}
