'use client';

import { useState } from 'react';
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
import { Badge } from '@starter/ui';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@starter/ui';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@starter/ui';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@starter/ui';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  RefreshCw,
  Calendar,
  User,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface DebugLog {
  _id: string;
  id: string;
  trace_id: string;
  user_id?: string;
  system: 'browser' | 'convex' | 'worker' | 'manual';
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  context?: any;
  stack?: string;
  raw_data: any;
  synced_at: number;
}

interface DebugLogsTableProps {
  refreshTrigger?: number;
}

export function DebugLogsTable({}: DebugLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [traceFilter, setTraceFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(100);
  const [chronological, setChronological] = useState(false); // false = newest first, true = oldest first

  // Build query args based on filters
  const queryArgs = {
    limit,
    chronological,
    ...(traceFilter && { trace_id: traceFilter }),
    ...(userFilter && { user_id: userFilter }),
    ...(systemFilter !== 'all' && { system: systemFilter as 'browser' | 'convex' | 'worker' | 'manual' }),
    ...(levelFilter !== 'all' && { level: levelFilter as 'log' | 'info' | 'warn' | 'error' }),
    ...(searchTerm && { search: searchTerm })
  };

  const logs = useQuery(api.debugLogs.listLogs, queryArgs);
  const stats = useQuery(api.debugLogs.getLogStats, {});

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSystemFilter('all');
    setLevelFilter('all');
    setTraceFilter('');
    setUserFilter('');
  };

  const toggleSortOrder = () => {
    setChronological(!chronological);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive' as const;
      case 'warn': return 'secondary' as const;
      case 'info': return 'default' as const;
      case 'log': return 'outline' as const;
      default: return 'outline' as const;
    }
  };

  const getSystemBadgeVariant = (system: string) => {
    switch (system) {
      case 'browser': return 'default' as const;
      case 'convex': return 'secondary' as const;
      case 'worker': return 'outline' as const;
      case 'manual': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const hasActiveFilters = searchTerm || systemFilter !== 'all' || levelFilter !== 'all' || traceFilter || userFilter;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Debug Logs Table
          </div>
          <div className="flex items-center gap-2">
            {stats && (
              <Badge variant="outline">
                {stats.totalLogs.toLocaleString()} total logs
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          {chronological ? 'Chronological' : 'Reverse chronological'} view of synced log data with filtering and search
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* System Filter */}
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger>
              <SelectValue placeholder="System" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              <SelectItem value="browser">Browser</SelectItem>
              <SelectItem value="convex">Convex</SelectItem>
              <SelectItem value="worker">Worker</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="log">Log</SelectItem>
            </SelectContent>
          </Select>

          {/* Trace Filter */}
          <Input
            placeholder="Trace ID..."
            value={traceFilter}
            onChange={(e) => setTraceFilter(e.target.value)}
          />

          {/* User Filter */}
          <Input
            placeholder="User ID..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              title={chronological ? 'Sort: Oldest First (click for Newest First)' : 'Sort: Newest First (click for Oldest First)'}
            >
              {chronological ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              {chronological ? 'Oldest' : 'Newest'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSystemFilter('browser')}
              disabled={systemFilter === 'browser'}
              title="Show only browser/application logs (exclude system logs)"
            >
              <User className="h-4 w-4 mr-1" />
              App Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Timestamp
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">System</TableHead>
                <TableHead className="w-[80px]">Level</TableHead>
                <TableHead className="w-[120px]">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    User
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">Trace ID</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs === undefined ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? 'No logs match your filters' : 'No logs synced yet'}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: DebugLog) => (
                  <Collapsible key={log._id} asChild>
                    <>
                      <TableRow className="group">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(log._id)}
                            >
                              {expandedRows.has(log._id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSystemBadgeVariant(log.system)}>
                            {log.system}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLevelBadgeVariant(log.level)}>
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.user_id ? (
                            <Badge variant="outline" className="text-xs">
                              {log.user_id.length > 8 ? `${log.user_id.slice(0, 8)}...` : log.user_id}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <Badge variant="outline" className="text-xs">
                            {log.trace_id.length > 8 ? `${log.trace_id.slice(0, 8)}...` : log.trace_id}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={log.message}>
                            {log.message}
                          </div>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow className="bg-muted/50">
                          <TableCell colSpan={7} className="py-4">
                            <div className="space-y-3">
                              {/* Full Message */}
                              <div>
                                <h5 className="font-medium mb-1">Full Message:</h5>
                                <pre className="text-sm bg-background p-3 rounded border overflow-auto">
                                  {log.message}
                                </pre>
                              </div>

                              {/* Context */}
                              {log.context && (
                                <div>
                                  <h5 className="font-medium mb-1">Context:</h5>
                                  <pre className="text-sm bg-background p-3 rounded border overflow-auto">
                                    {JSON.stringify(log.context, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* Stack Trace */}
                              {log.stack && (
                                <div>
                                  <h5 className="font-medium mb-1">Stack Trace:</h5>
                                  <pre className="text-sm bg-background p-3 rounded border overflow-auto text-red-600 dark:text-red-400">
                                    {log.stack}
                                  </pre>
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                                <div>
                                  <strong>Full Trace ID:</strong><br />
                                  <code>{log.trace_id}</code>
                                </div>
                                {log.user_id && (
                                  <div>
                                    <strong>Full User ID:</strong><br />
                                    <code>{log.user_id}</code>
                                  </div>
                                )}
                                <div>
                                  <strong>Original ID:</strong><br />
                                  <code>{log.id}</code>
                                </div>
                                <div>
                                  <strong>Synced At:</strong><br />
                                  {formatTimestamp(log.synced_at)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load More */}
        {logs && logs.length >= limit && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setLimit(limit + 100)}
            >
              Load More Logs
            </Button>
          </div>
        )}

        {/* Footer Stats */}
        {stats && (
          <div className="text-xs text-muted-foreground border-t pt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <strong>Total Logs:</strong> {stats.totalLogs.toLocaleString()}
            </div>
            <div>
              <strong>Unique Traces:</strong> {stats.uniqueTraces.toLocaleString()}
            </div>
            <div>
              <strong>Unique Users:</strong> {stats.uniqueUsers.toLocaleString()}
            </div>
            <div>
              <strong>Showing:</strong> {logs?.length || 0} logs
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}