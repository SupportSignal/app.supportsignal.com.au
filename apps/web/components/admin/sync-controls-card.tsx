'use client';

import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/lib/convex-api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Button } from '@starter/ui';
import { Input } from '@starter/ui';
import { Badge } from '@starter/ui';
import { Progress } from '@starter/ui';
import { Download, Search, User, RefreshCw, CheckCircle, AlertCircle, Trash2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface SyncControlsCardProps {
  onSyncComplete?: () => void;
  redisStats?: {
    stats?: {
      total_logs: number;
    };
  };
}

interface SyncResult {
  success: boolean;
  totalSynced?: number;
  deletedCount?: number;
  trace_id?: string;
  user_id?: string;
  syncedAt?: number;
  cleared_logs?: number;
  cleared_traces?: number;
  error?: string;
}

export function SyncControlsCard({ onSyncComplete, redisStats }: SyncControlsCardProps) {
  const [traceId, setTraceId] = useState('');
  const [userId, setUserId] = useState('');
  const [syncOperation, setSyncOperation] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const syncAllLogs = useAction(api.workerSync.syncAllLogs);
  const syncByTrace = useAction(api.workerSync.syncByTrace);
  const syncByUser = useAction(api.workerSync.syncByUser);
  const clearRedisAndSync = useAction(api.workerSync.clearRedisAndSync);

  const handleSyncAll = async () => {
    setSyncOperation('all');
    setSyncResult(null);

    try {
      const result = await syncAllLogs({});
      setSyncResult({
        success: true,
        totalSynced: result.totalSynced,
        deletedCount: result.deletedCount || 0,
        syncedAt: result.syncedAt
      });
      // Trigger both logs table refresh AND Redis stats refresh
      onSyncComplete?.();
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setSyncOperation(null);
    }
  };

  const handleSyncByTrace = async () => {
    if (!traceId.trim()) {
      setSyncResult({
        success: false,
        error: 'Trace ID is required'
      });
      return;
    }

    setSyncOperation('trace');
    setSyncResult(null);

    try {
      const result = await syncByTrace({ trace_id: traceId.trim() });
      setSyncResult({
        success: true,
        totalSynced: result.totalSynced,
        deletedCount: result.deletedCount || 0,
        trace_id: result.trace_id,
        syncedAt: result.syncedAt
      });
      // Trigger both logs table refresh AND Redis stats refresh
      onSyncComplete?.();
      setTraceId(''); // Clear input on success
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setSyncOperation(null);
    }
  };

  const handleSyncByUser = async () => {
    if (!userId.trim()) {
      setSyncResult({
        success: false,
        error: 'User ID is required'
      });
      return;
    }

    setSyncOperation('user');
    setSyncResult(null);

    try {
      const result = await syncByUser({ user_id: userId.trim() });
      setSyncResult({
        success: true,
        totalSynced: result.totalSynced,
        deletedCount: result.deletedCount || 0,
        user_id: result.user_id,
        syncedAt: result.syncedAt
      });
      // Trigger both logs table refresh AND Redis stats refresh
      onSyncComplete?.();
      setUserId(''); // Clear input on success
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setSyncOperation(null);
    }
  };

  const handleClearAndSync = async () => {
    setSyncOperation('clear-sync');
    setSyncResult(null);

    try {
      const result = await clearRedisAndSync({});
      setSyncResult({
        success: true,
        totalSynced: result.totalSynced,
        deletedCount: result.deletedCount,
        cleared_logs: result.cleared_logs,
        cleared_traces: result.cleared_traces,
        syncedAt: result.syncedAt
      });
      // Critical: Redis state changed (cleared), must refresh stats
      onSyncComplete?.();
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setSyncOperation(null);
    }
  };

  const clearResult = () => {
    setSyncResult(null);
  };

  const getVolumeWarning = (totalLogs: number) => {
    if (totalLogs < 1000) {
      return {
        level: 'safe' as const,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        message: 'Safe volume - quick sync (~10-30s)',
        variant: 'default' as const
      };
    } else if (totalLogs < 5000) {
      return {
        level: 'moderate' as const,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
        message: 'Moderate volume - expect 30-60s sync time',
        variant: 'secondary' as const
      };
    } else {
      return {
        level: 'high' as const,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
        message: 'Large volume - 2-5 min sync time, filtering recommended',
        variant: 'destructive' as const
      };
    }
  };

  const totalLogs = redisStats?.stats?.total_logs || 0;
  const volumeWarning = getVolumeWarning(totalLogs);

  const isLoading = syncOperation !== null;
  const getLoadingText = () => {
    switch (syncOperation) {
      case 'all': return 'Syncing all logs from Redis...';
      case 'trace': return `Syncing trace ${traceId}...`;
      case 'user': return `Syncing logs for user ${userId}...`;
      case 'clear-sync': return 'Clearing Redis and syncing fresh state...';
      default: return 'Processing...';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Sync Controls
        </CardTitle>
        <CardDescription>
          Pull log data from Redis buffer to Convex for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync All Section */}
        <div className={`border rounded-lg p-4 ${totalLogs > 1000 ? volumeWarning.bgColor : ''}`}>
          <div className="mb-3">
            <h4 className="font-medium flex items-center gap-2">
              Sync All Logs
              {totalLogs > 1000 && (
                <AlertTriangle className={`h-4 w-4 ${volumeWarning.color}`} />
              )}
            </h4>
            <p className="text-sm text-muted-foreground">
              Import all available logs from Redis to Convex
              {totalLogs > 0 && (
                <span className={`block mt-1 ${volumeWarning.color}`}>
                  {totalLogs.toLocaleString()} logs - {volumeWarning.message}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleSyncAll}
            disabled={isLoading}
            variant={totalLogs > 5000 ? 'destructive' : 'default'}
            title={`Sync ${totalLogs.toLocaleString()} logs - ${volumeWarning.message}`}
            className="w-full"
          >
            {syncOperation === 'all' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Sync All
              </>
            )}
          </Button>
        </div>

        {/* Advanced Sync Options */}
        <div className="border rounded-lg p-4">
          <Button
            variant="ghost"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full justify-between p-0 h-auto font-medium"
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Advanced Sync Options
            </div>
            {showAdvancedOptions ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-1">
            Sync by specific trace ID or user ID
          </p>

          {showAdvancedOptions && (
            <div className="mt-4 space-y-4">
              {/* Sync by Trace Section */}
              <div className="border-l-2 border-muted pl-4">
                <div className="mb-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <Search className="h-3 w-3" />
                    Sync by Trace ID
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Import logs for a specific trace correlation ID
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter trace ID..."
                    value={traceId}
                    onChange={(e) => setTraceId(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSyncByTrace}
                    disabled={isLoading || !traceId.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {syncOperation === 'trace' ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <Search className="h-3 w-3 mr-1" />
                        Sync Trace
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Sync by User Section */}
              <div className="border-l-2 border-muted pl-4">
                <div className="mb-3">
                  <h5 className="font-medium flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Sync by User ID
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Import logs for a specific user across all traces
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter user ID..."
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSyncByUser}
                    disabled={isLoading || !userId.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {syncOperation === 'user' ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 mr-1" />
                        Sync User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clear Redis + Auto-Sync Section */}
        <div className="border rounded-lg p-4 border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
          <div className="mb-3">
            <h4 className="font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Clear Redis + Auto-Sync
            </h4>
            <p className="text-sm text-muted-foreground">
              Fresh debugging session: clear all Redis logs, then sync empty state
            </p>
            <div className="text-xs text-orange-700 dark:text-orange-300 mt-2">
              ⚠️ This permanently deletes all Redis logs and creates a clean debugging environment
            </div>
          </div>
          <Button
            onClick={handleClearAndSync}
            disabled={isLoading}
            variant="destructive"
            className="w-full"
          >
            {syncOperation === 'clear-sync' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear & Sync
              </>
            )}
          </Button>
        </div>

        {/* Loading Progress */}
        {isLoading && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="font-medium">Sync in Progress</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{getLoadingText()}</p>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className={`border rounded-lg p-4 ${
            syncResult.success 
              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
              : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">
                  {syncResult.success ? 'Sync Completed' : 'Sync Failed'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearResult}>
                ✕
              </Button>
            </div>
            
            {syncResult.success ? (
              <div className="space-y-1 text-sm">
                {syncResult.cleared_logs !== undefined ? (
                  // Clear + Sync operation result
                  <>
                    <p>
                      <strong>Redis cleared:</strong> {syncResult.cleared_logs} logs, {syncResult.cleared_traces} traces
                    </p>
                    <p>
                      <strong>Convex cleared:</strong> {syncResult.deletedCount} existing logs
                    </p>
                    <p>
                      <strong>Fresh sync:</strong> {syncResult.totalSynced} logs imported
                    </p>
                  </>
                ) : (
                  // Regular sync operation result
                  <>
                    <p>
                      <strong>{syncResult.totalSynced}</strong> logs synced successfully
                      {syncResult.deletedCount !== undefined && syncResult.deletedCount > 0 && (
                        <span className="text-muted-foreground"> (replaced {syncResult.deletedCount} existing)</span>
                      )}
                    </p>
                    {syncResult.trace_id && (
                      <p>Trace ID: <Badge variant="outline">{syncResult.trace_id}</Badge></p>
                    )}
                    {syncResult.user_id && (
                      <p>User ID: <Badge variant="outline">{syncResult.user_id}</Badge></p>
                    )}
                  </>
                )}
                {syncResult.syncedAt && (
                  <p className="text-muted-foreground">
                    Synced at: {new Date(syncResult.syncedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                {syncResult.error}
              </p>
            )}
          </div>
        )}

        {/* Important Notes */}
        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p>• <strong>True Sync:</strong> Convex data exactly mirrors current Redis state</p>
          <p>• Existing logs are replaced with current Redis data (no duplicates)</p>
          <p>• <strong>Clear & Sync:</strong> Creates fresh debugging environment (removes all existing data)</p>
          <p>• Large sync operations may take several minutes to complete</p>
          <p>• Redis data has a 1-hour TTL - sync frequently for data preservation</p>
        </div>
      </CardContent>
    </Card>
  );
}