'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { RedisStatsCard } from '@/components/debug-logs/redis-stats-card';
import { SyncControlsCard } from '@/components/debug-logs/sync-controls-card';
import { DebugLogsTable } from '@/components/debug-logs/debug-logs-table';
import { ExportControlsCard } from '@/components/debug-logs/export-controls-card';
import { SuppressionRulesPanel } from '@/components/debug-logs/suppression-rules-panel';
import { Button } from '@starter/ui';
import { RefreshCw, PanelLeft, PanelLeftClose, AlertTriangle, Bug } from 'lucide-react';

export default function DebugLogsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [redisStats, setRedisStats] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSyncComplete = () => {
    // Refresh all components when sync completes
    setRefreshKey(prev => prev + 1);
  };

  const handleRedisStatsUpdate = useCallback((stats: any) => {
    setRedisStats(stats);
  }, []);

  // Development environment check
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Development Only</h1>
          <p className="text-muted-foreground mb-4">
            Debug logs are only available in development environment.
          </p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-[420px]' : 'w-0'} transition-all duration-300 overflow-hidden border-r bg-muted/30`}>
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-muted-foreground">CONTROLS</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              title="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* Compact Redis Stats */}
          <RedisStatsCard refreshTrigger={refreshKey} onStatsUpdate={handleRedisStatsUpdate} />

          {/* Sync Controls */}
          <SyncControlsCard onSyncComplete={handleSyncComplete} redisStats={redisStats} />

          {/* Suppression Rules Panel */}
          <SuppressionRulesPanel />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  title="Open sidebar"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Debug Logs Dashboard</h2>
                <div className="text-sm text-muted-foreground">
                  <Link
                    href="/admin"
                    className="inline-flex items-center hover:text-foreground transition-colors"
                  >
                    <span className="mr-1">←</span>
                    Back to Admin Tools
                  </Link>
                </div>
              </div>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <DebugLogsTable refreshTrigger={refreshKey} />
          
          {/* Export Controls - Full Width */}
          <ExportControlsCard refreshTrigger={refreshKey} />
        </div>
      </div>
    </div>
  );
}