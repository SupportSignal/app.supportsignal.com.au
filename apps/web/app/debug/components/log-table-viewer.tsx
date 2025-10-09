'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff } from 'lucide-react';
import type { RedisLogEntry } from '@/app/debug/lib/debug-api';

interface LogTableViewerProps {
  logs: RedisLogEntry[];
  systemFilter: string[];
  onSystemFilterChange: (filters: string[]) => void;
}

export default function LogTableViewer({ logs, systemFilter, onSystemFilterChange }: LogTableViewerProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showStackTraces, setShowStackTraces] = useState(false);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      case 'warn': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'debug': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSystemColor = (system: string) => {
    switch (system) {
      case 'browser': return 'bg-blue-500';
      case 'convex': return 'bg-green-500';
      case 'worker': return 'bg-purple-500';
      case 'manual': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const toggleRowExpansion = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Silent failure for clipboard
    }
  };

  const filteredLogs = systemFilter.length > 0 
    ? logs.filter(log => systemFilter.includes(log.system))
    : logs;

  if (filteredLogs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">No logs to display</h3>
            <p className="text-sm">
              {systemFilter.length > 0 
                ? `No logs found for selected systems: ${systemFilter.join(', ')}`
                : 'No logs found for this trace ID'
              }
            </p>
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
            <span>Log Table</span>
            <Badge variant="secondary">{filteredLogs.length} entries</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStackTraces(!showStackTraces)}
            >
              {showStackTraces ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showStackTraces ? 'Hide' : 'Show'} Stack Traces
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-sm w-20">Time</th>
                <th className="text-left p-3 font-medium text-sm w-20">Source</th>
                <th className="text-left p-3 font-medium text-sm w-16">Level</th>
                <th className="text-left p-3 font-medium text-sm flex-1">Message</th>
                <th className="text-left p-3 font-medium text-sm w-16">Data</th>
                <th className="text-left p-3 font-medium text-sm w-12">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => {
                const logId = `${log.trace_id}-${index}`;
                const isExpanded = expandedRows.has(logId);
                const hasAdditionalData = log.context || log.stack;

                return (
                  <tr key={logId} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getSystemColor(log.system)}`} />
                        <span className="text-sm font-medium capitalize">{log.system}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getLevelColor(log.level)} border`}
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <p className="text-sm leading-relaxed">{log.message}</p>
                        {isExpanded && log.context && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            <p className="font-medium mb-1">Context:</p>
                            <pre className="whitespace-pre-wrap text-muted-foreground">
                              {typeof log.context === 'object' 
                                ? JSON.stringify(log.context, null, 2)
                                : log.context
                              }
                            </pre>
                          </div>
                        )}
                        {isExpanded && log.stack && showStackTraces && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            <p className="font-medium mb-1">Stack Trace:</p>
                            <pre className="whitespace-pre-wrap text-muted-foreground font-mono text-xs">
                              {log.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {hasAdditionalData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(logId)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                        className="h-6 w-6 p-0"
                        title="Copy log entry"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <p>
            💡 Click the arrow to expand logs with additional context or stack traces. 
            Use &ldquo;Show Stack Traces&rdquo; to display error stack traces in expanded rows.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}