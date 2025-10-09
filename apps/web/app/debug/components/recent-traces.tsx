'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Clock, Search, RefreshCw } from 'lucide-react';

interface RecentTracesProps {
  onSelectTrace: (traceId: string) => void;
  loading: boolean;
}

interface TraceInfo {
  id: string;
  timestamp: number;
  logCount: number;
  systems: string[];
  hasErrors: boolean;
}

export default function RecentTraces({ onSelectTrace, loading }: RecentTracesProps) {
  const [recentTraces, setRecentTraces] = useState<TraceInfo[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentTraces = async () => {
    setFetchLoading(true);
    setError(null);
    
    try {
      const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL || 'http://localhost:8787';
      const response = await fetch(`${workerUrl}/traces/recent?limit=10`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recent traces: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRecentTraces(data.traces || []);
    } catch (err) {
      // Error logged for debugging
      setError(err instanceof Error ? err.message : 'Failed to fetch traces');
      setRecentTraces([]); // Clear traces on error
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentTraces();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentTraces, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Recent Traces</span>
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchRecentTraces}
              disabled={fetchLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${fetchLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            <p className="text-sm font-medium">Failed to load traces</p>
            <p className="text-xs">{error}</p>
            <Button size="sm" variant="outline" onClick={fetchRecentTraces} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentTraces.length === 0 && !fetchLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Recent Traces</span>
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchRecentTraces}
              disabled={fetchLoading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${fetchLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">No recent traces found</p>
            <p className="text-xs">Generate some logs to see traces here</p>
            <Button size="sm" variant="outline" onClick={fetchRecentTraces} className="mt-2">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Recent Traces</span>
            {fetchLoading && <RefreshCw className="h-3 w-3 animate-spin ml-2" />}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{recentTraces.length}</Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchRecentTraces}
              disabled={fetchLoading}
              className="h-8 w-8 p-0"
              title="Refresh recent traces"
            >
              <RefreshCw className={`h-3 w-3 ${fetchLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentTraces.map((trace) => (
            <div 
              key={trace.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {trace.id}
                  </p>
                  {trace.hasErrors && (
                    <Badge variant="destructive" className="text-xs">Error</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span>{formatTimestamp(trace.timestamp)}</span>
                  <span>{trace.logCount} logs</span>
                  <div className="flex space-x-1">
                    {trace.systems.map(system => (
                      <Badge key={system} variant="outline" className="text-xs">
                        {system}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onSelectTrace(trace.id)}
                disabled={loading}
                className="ml-2 h-8 w-8 p-0"
              >
                <Search className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Click the search icon to debug a specific trace, or use &ldquo;Debug Now&rdquo; 
            for your current browser session above. Auto-refreshes every 30s.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}