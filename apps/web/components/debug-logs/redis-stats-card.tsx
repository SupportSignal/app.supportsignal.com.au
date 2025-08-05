'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@starter/ui';
import { Button } from '@starter/ui';
import { Badge } from '@starter/ui';
import { RefreshCw, Database, Clock, Activity, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface RedisStats {
  status: string;
  redis_connected: boolean;
  stats: {
    total_logs: number;
    active_traces: number;
    unique_users: number;
    oldest_log_hours: number;
  };
  system_breakdown: {
    browser: number;
    convex: number;
    worker: number;
    manual: number;
  };
  ttl_info: {
    default_ttl_hours: number;
    expires_in_hours: number;
  };
}

interface RedisStatsCardProps {
  refreshTrigger?: number;
  onStatsUpdate?: (stats: RedisStats | null) => void;
}

export function RedisStatsCard({ refreshTrigger, onStatsUpdate }: RedisStatsCardProps) {
  const [stats, setStats] = useState<RedisStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/redis-stats/?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch Redis stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
      setLastRefresh(Date.now());
      onStatsUpdate?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Redis statistics');
      // eslint-disable-next-line no-console
      console.error('Redis stats fetch error:', err);
      onStatsUpdate?.(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchStats();
    }
  }, [refreshTrigger]);

  const handleRefresh = () => {
    fetchStats();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getVolumeWarning = (totalLogs: number) => {
    if (totalLogs < 1000) {
      return {
        level: 'safe' as const,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
        message: 'Safe volume - quick sync recommended',
        badge: 'default' as const
      };
    } else if (totalLogs < 5000) {
      return {
        level: 'moderate' as const,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
        message: 'Moderate volume - consider filtering or expect ~30-60s sync time',
        badge: 'secondary' as const
      };
    } else {
      return {
        level: 'high' as const,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
        message: 'Large volume - filtering strongly recommended or expect 2-5 min sync time',
        badge: 'destructive' as const
      };
    }
  };

  const getConnectionStatus = () => {
    if (loading) return { text: 'Checking...', color: 'secondary' as const };
    if (error) return { text: 'Error', color: 'destructive' as const };
    if (!stats) return { text: 'Unknown', color: 'outline' as const };
    if (stats.redis_connected) return { text: 'Connected', color: 'default' as const };
    return { text: 'Disconnected', color: 'destructive' as const };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Redis Log Buffer Status
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus.color}>
              {connectionStatus.text}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Live statistics from Redis log buffer (no data import)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 border border-destructive/20 bg-destructive/10 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`text-center p-3 border rounded-lg ${getVolumeWarning(stats.stats.total_logs).bgColor}`}>
                <div className={`text-2xl font-bold ${getVolumeWarning(stats.stats.total_logs).color}`}>
                  {formatNumber(stats.stats.total_logs)}
                </div>
                <div className="text-xs text-muted-foreground">Total Logs</div>
                <Badge 
                  variant={getVolumeWarning(stats.stats.total_logs).badge} 
                  className="text-xs mt-1"
                >
                  {getVolumeWarning(stats.stats.total_logs).level.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{formatNumber(stats.stats.active_traces)}</div>
                <div className="text-xs text-muted-foreground">Active Traces</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{formatNumber(stats.stats.unique_users)}</div>
                <div className="text-xs text-muted-foreground">Unique Users</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold">{stats.stats.oldest_log_hours}h</div>
                <div className="text-xs text-muted-foreground">Data Age</div>
              </div>
            </div>

            {/* System Breakdown */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Breakdown
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">{formatNumber(stats.system_breakdown.browser)}</div>
                  <div className="text-xs text-muted-foreground">Browser</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{formatNumber(stats.system_breakdown.convex)}</div>
                  <div className="text-xs text-muted-foreground">Convex</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{formatNumber(stats.system_breakdown.worker)}</div>
                  <div className="text-xs text-muted-foreground">Worker</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{formatNumber(stats.system_breakdown.manual)}</div>
                  <div className="text-xs text-muted-foreground">Manual</div>
                </div>
              </div>
            </div>

            {/* TTL Information */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Data Retention
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-semibold">{stats.ttl_info.default_ttl_hours}h</div>
                  <div className="text-xs text-muted-foreground">Default TTL</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">{stats.ttl_info.expires_in_hours}h</div>
                  <div className="text-xs text-muted-foreground">Expires In</div>
                </div>
              </div>
            </div>

            {/* Volume Warning Message */}
            {stats.stats.total_logs > 0 && (
              <div className={`border rounded-lg p-4 ${getVolumeWarning(stats.stats.total_logs).bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getVolumeWarning(stats.stats.total_logs).level === 'safe' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {getVolumeWarning(stats.stats.total_logs).level === 'moderate' && (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  {getVolumeWarning(stats.stats.total_logs).level === 'high' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${getVolumeWarning(stats.stats.total_logs).color}`}>
                    Sync Volume: {getVolumeWarning(stats.stats.total_logs).level.charAt(0).toUpperCase() + getVolumeWarning(stats.stats.total_logs).level.slice(1)}
                  </span>
                </div>
                <p className={`text-sm ${getVolumeWarning(stats.stats.total_logs).color}`}>
                  {getVolumeWarning(stats.stats.total_logs).message}
                </p>
                {getVolumeWarning(stats.stats.total_logs).level !== 'safe' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Tip: Use trace or user filtering to sync only relevant data
                  </p>
                )}
              </div>
            )}

            {/* Last Updated */}
            {lastRefresh > 0 && (
              <div className="text-xs text-muted-foreground text-center border-t pt-3">
                Last updated: {new Date(lastRefresh).toLocaleTimeString()}
              </div>
            )}
          </>
        )}

        {loading && !stats && (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading Redis statistics...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}