'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex-api';
import { useEffect } from 'react';
import type { ComponentType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui';
import { Badge } from '@starter/ui';
import { Alert, AlertDescription } from '@starter/ui';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface SystemHealthOverviewProps {
  refreshTrigger?: number;
}

export function SystemHealthOverview({ refreshTrigger }: SystemHealthOverviewProps) {
  const rateLimitState = useQuery(api.rateLimiter.getRateLimitState);
  const costMetrics = useQuery(api.rateLimiter.getCostMetrics);
  const usage = useQuery(api.monitoring.usage);
  
  // Mutations to trigger data refresh
  const updateRateLimit = useMutation(api.rateLimiter.updateRateLimitState);
  
  // Trigger refresh when refreshTrigger prop changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      updateRateLimit({}).catch((error) => {
        console.error('Failed to update rate limit:', error);
      });
      // Note: costMetrics and monitoring.usage update automatically via Convex reactivity
    }
  }, [refreshTrigger, updateRateLimit]);

  if (!rateLimitState || !costMetrics || !usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health Overview
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

  // Calculate overall system health
  const getSystemHealth = () => {
    const issues = [];
    const warnings = [];

    // Check rate limiting
    const globalUsage = (rateLimitState.global.current / rateLimitState.global.limit) * 100;
    if (globalUsage >= 95) {
      issues.push('Rate limiting at critical levels');
    } else if (globalUsage >= 80) {
      warnings.push('Rate limiting approaching limits');
    }

    // Check budget
    if (costMetrics.budgetUsedPercent >= 95) {
      issues.push('Monthly budget nearly exhausted');
    } else if (costMetrics.budgetUsedPercent >= 80) {
      warnings.push('Monthly budget usage high');
    }

    // Check storage
    if (usage.estimatedStorageMB >= 40) {
      issues.push('Database storage approaching limits');
    } else if (usage.estimatedStorageMB >= 25) {
      warnings.push('Database storage usage elevated');
    }

    // Check for high volume logs
    if (usage.recordCounts.log_queue_sample >= 5000) {
      warnings.push('High volume log queue detected');
    }

    return { issues, warnings };
  };

  const health = getSystemHealth();
  const overallStatus = health.issues.length > 0 ? 'critical' : 
                       health.warnings.length > 0 ? 'warning' : 'healthy';

  const getStatusBadge = (): {
    icon: ComponentType<{ className?: string }>;
    color: 'default' | 'destructive' | 'outline' | 'secondary';
    text: string;
  } => {
    switch (overallStatus) {
      case 'critical':
        return { icon: XCircle, color: 'destructive' as const, text: 'Critical Issues' };
      case 'warning':
        return { icon: AlertTriangle, color: 'secondary' as const, text: 'Warnings' };
      default:
        return { icon: CheckCircle, color: 'default' as const, text: 'Healthy' };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health Overview
          </div>
          <Badge variant={statusBadge.color} className="flex items-center gap-1">
            <StatusIcon className="h-4 w-4" />
            {statusBadge.text}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time status of all logging system components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{rateLimitState.global.current}</div>
            <div className="text-xs text-muted-foreground">Active Logs/min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{costMetrics.budgetUsedPercent.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Budget Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{usage.estimatedStorageMB}</div>
            <div className="text-xs text-muted-foreground">Storage (MB)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{costMetrics.totalWrites.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Writes</div>
          </div>
        </div>

        {/* Critical Issues */}
        {health.issues.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Critical Issues Detected:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {health.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {health.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">System Warnings:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {health.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* System Status Indicators */}
        <div className="grid gap-3">
          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Rate Limiting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{rateLimitState.global.current}/{rateLimitState.global.limit}</span>
              {((rateLimitState.global.current / rateLimitState.global.limit) * 100) >= 80 ? 
                <XCircle className="h-4 w-4 text-destructive" /> :
                <CheckCircle className="h-4 w-4 text-green-600" />
              }
            </div>
          </div>

          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Budget Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">${costMetrics.estimatedCost.toFixed(2)}/$10.00</span>
              {costMetrics.budgetUsedPercent >= 80 ? 
                <XCircle className="h-4 w-4 text-destructive" /> :
                <CheckCircle className="h-4 w-4 text-green-600" />
              }
            </div>
          </div>

          <div className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Database Health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">{usage.estimatedStorageMB}MB</span>
              {usage.estimatedStorageMB >= 25 ? 
                <XCircle className="h-4 w-4 text-destructive" /> :
                <CheckCircle className="h-4 w-4 text-green-600" />
              }
            </div>
          </div>
        </div>

        {/* Healthy Status Message */}
        {overallStatus === 'healthy' && (
          <div className="text-center p-4 border-2 border-dashed border-green-200 rounded-lg bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-green-700 dark:text-green-400">
              All Systems Operational
            </div>
            <div className="text-xs text-green-600 dark:text-green-500">
              Logging system is running smoothly with no issues detected
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          Last updated: {new Date().toLocaleTimeString()} • Auto-refresh every 30 seconds
        </div>
      </CardContent>
    </Card>
  );
}