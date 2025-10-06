'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
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
import { Label } from '@starter/ui';
import { Badge } from '@starter/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@starter/ui';
import { Search, Download, Eye, Clock, User, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SearchParams {
  query?: string;
  trace_id?: string;
  system?: string;
  level?: string;
  limit?: number;
}

interface LogSearchProps {
  refreshTrigger?: number;
}

export function LogSearch({ refreshTrigger }: LogSearchProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    limit: 50,
  });
  const [isSearching, setIsSearching] = useState(false);

  // Handle refresh trigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('LogSearch refresh triggered - recent traces will update automatically');
    }
  }, [refreshTrigger]);

  // Get recent traces for quick selection
  const recentTraces = useQuery(api.logCorrelation.getRecentTraces, {
    limit: 10,
  });

  // Search logs when params change
  const searchResults = useQuery(
    api.logCorrelation.searchLogs,
    searchParams.query || searchParams.trace_id ? searchParams : 'skip'
  );

  const handleSearch = () => {
    setIsSearching(true);
    // The query will automatically re-run due to reactive nature
    window.setTimeout(() => setIsSearching(false), 500);
  };

  const handleQuickTraceSelect = (traceId: string) => {
    setSearchParams(prev => ({ ...prev, trace_id: traceId, query: '' }));
  };

  const exportResults = () => {
    if (!searchResults || searchResults.length === 0) return;

    const csvContent = [
      ['Timestamp', 'Level', 'System', 'Trace ID', 'User ID', 'Message'].join(
        ','
      ),
      ...searchResults.map(
        (log: {
          timestamp: number;
          level: string;
          system_area: string;
          trace_id: string;
          user_id: string;
          message: string;
        }) =>
          [
            new Date(log.timestamp).toISOString(),
            log.level,
            log.system_area,
            log.trace_id,
            log.user_id,
            `"${log.message.replace(/"/g, '""')}"`,
          ].join(',')
      ),
    ].join('\n');

    const blob = new window.Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Log Search & Correlation
        </CardTitle>
        <CardDescription>
          Search logs by content, trace ID, system, or time range
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="query">Search Query</Label>
              <Input
                id="query"
                placeholder="Search message content..."
                value={searchParams.query || ''}
                onChange={e =>
                  setSearchParams(prev => ({
                    ...prev,
                    query: e.target.value,
                    trace_id: e.target.value ? '' : prev.trace_id,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trace_id">Trace ID</Label>
              <Input
                id="trace_id"
                placeholder="Enter specific trace ID..."
                value={searchParams.trace_id || ''}
                onChange={e =>
                  setSearchParams(prev => ({
                    ...prev,
                    trace_id: e.target.value,
                    query: e.target.value ? '' : prev.query,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>System</Label>
              <Select
                value={searchParams.system || 'all'}
                onValueChange={value =>
                  setSearchParams(prev => ({
                    ...prev,
                    system: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All systems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All systems</SelectItem>
                  <SelectItem value="browser">Browser</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Log Level</Label>
              <Select
                value={searchParams.level || 'all'}
                onValueChange={value =>
                  setSearchParams(prev => ({
                    ...prev,
                    level: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="log">Log</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limit</Label>
              <Select
                value={String(searchParams.limit || 50)}
                onValueChange={value =>
                  setSearchParams(prev => ({
                    ...prev,
                    limit: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 results</SelectItem>
                  <SelectItem value="50">50 results</SelectItem>
                  <SelectItem value="100">100 results</SelectItem>
                  <SelectItem value="200">200 results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search Logs'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setSearchParams({ limit: 50 })}
            >
              Clear
            </Button>
            {searchResults && searchResults.length > 0 && (
              <Button variant="outline" onClick={exportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Recent Traces Quick Select */}
        {recentTraces && recentTraces.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Recent Traces (Quick Select)</h4>
            <div className="flex flex-wrap gap-2">
              {recentTraces
                .slice(0, 5)
                .map((trace: { trace_id: string; log_count: number }) => (
                  <Button
                    key={trace.trace_id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTraceSelect(trace.trace_id)}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    {trace.trace_id.length > 20
                      ? `${trace.trace_id.substring(0, 20)}...`
                      : trace.trace_id}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {trace.log_count}
                    </Badge>
                  </Button>
                ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                Search Results ({searchResults.length} matches)
              </h4>
              {searchResults.length > 0 && (
                <Badge variant="outline">
                  Showing {searchResults.length} results
                </Badge>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No logs found matching your search criteria</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map(
                  (log: {
                    id: string;
                    timestamp: number;
                    level: string;
                    message: string;
                    trace_id?: string;
                    user_id?: string;
                    system_area?: string;
                  }) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {log.level}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {log.system_area}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(log.timestamp), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                          <div className="text-sm font-mono break-words">
                            {log.message}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Trace: {log.trace_id}
                            </div>
                            {log.user_id && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                User: {log.user_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          Search across all log tables with real-time correlation. Use trace IDs
          for complete request flows.
        </div>
      </CardContent>
    </Card>
  );
}
