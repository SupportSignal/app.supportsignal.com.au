'use client';

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
import { Alert, AlertDescription } from '@starter/ui';
import { Database, AlertTriangle, HardDrive, RefreshCw } from 'lucide-react';

interface DatabaseHealthProps {
  refreshTrigger?: number;
}

export function DatabaseHealth({ refreshTrigger }: DatabaseHealthProps) {
  const usage = useQuery(api.monitoring.usage);
  
  // The monitoring.usage query automatically updates via Convex reactivity
  // but we track the refresh trigger for consistency
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      // Force a small visual update - the data will refresh automatically
      console.log('DatabaseHealth refresh triggered');
    }
  }, [refreshTrigger]);

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Health
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

  const getStorageStatus = (
    mb: number
  ): {
    status: string;
    color: 'default' | 'destructive' | 'outline' | 'secondary';
  } => {
    if (mb >= 40) return { status: 'critical', color: 'destructive' as const };
    if (mb >= 25) return { status: 'warning', color: 'secondary' as const };
    return { status: 'healthy', color: 'default' as const };
  };

  const storageStatus = getStorageStatus(usage.estimatedStorageMB);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Health
        </CardTitle>
        <CardDescription>Storage usage and table statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Storage Overview */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              <span className="font-medium">Storage Usage</span>
            </div>
            <Badge variant={storageStatus.color}>
              {usage.estimatedStorageMB} MB
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {usage.estimatedStorageBytes.toLocaleString()} bytes total
          </div>
        </div>

        {/* Record Counts */}
        <div className="space-y-3">
          <h4 className="font-medium">Table Statistics</h4>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Log Queue</span>
              <span className="text-sm font-mono">
                {usage.recordCounts.log_queue_sample.toLocaleString()}
                {usage.recordCounts.log_queue_sample >= 5000 && '+'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Recent Logs</span>
              <span className="text-sm font-mono">
                {usage.recordCounts.recent_log_entries_sample.toLocaleString()}
                {usage.recordCounts.recent_log_entries_sample >= 5000 && '+'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Users</span>
              <span className="text-sm font-mono">
                {usage.recordCounts.users.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sessions</span>
              <span className="text-sm font-mono">
                {usage.recordCounts.sessions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {usage.warnings && usage.warnings.length > 0 && (
          <div className="space-y-2">
            {usage.warnings.map((warning: string, index: number) => (
              <Alert key={index} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {warning}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Cleanup Recommendations */}
        <div className="border-t pt-3">
          <div className="text-sm">
            <strong>Cleanup Status:</strong>
          </div>
          {usage.recordCounts.log_queue_sample > 1000 ||
          usage.recordCounts.recent_log_entries_sample > 1000 ? (
            <div className="text-xs text-muted-foreground">
              Consider running cleanup to optimize storage usage
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Database size is healthy, no cleanup needed
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground border-t pt-3">
          {usage.recordCounts.note}
        </div>
      </CardContent>
    </Card>
  );
}
