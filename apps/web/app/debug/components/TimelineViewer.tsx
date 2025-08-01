'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import LogEntryCard from './LogEntryCard';
import type { RedisLogEntry } from '../lib/debug-api';

interface TimelineViewerProps {
  logs: RedisLogEntry[];
  systemFilter: string[];
  onSystemFilterChange: (filters: string[]) => void;
}

const SYSTEM_CONFIG = {
  browser: { label: 'Browser', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  convex: { label: 'Convex', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  worker: { label: 'Worker', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
  manual: { label: 'Manual', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' }
};

const LEVEL_CONFIG = {
  log: { color: 'bg-gray-500', label: 'LOG' },
  info: { color: 'bg-blue-500', label: 'INFO' },
  warn: { color: 'bg-yellow-500', label: 'WARN' },
  error: { color: 'bg-red-500', label: 'ERROR' }
};

export default function TimelineViewer({ logs, systemFilter, onSystemFilterChange }: TimelineViewerProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const filteredLogs = useMemo(() => {
    if (systemFilter.length === 0) return logs;
    return logs.filter(log => systemFilter.includes(log.system));
  }, [logs, systemFilter]);

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredLogs]);

  const systemStats = useMemo(() => {
    const stats = logs.reduce((acc, log) => {
      acc[log.system] = (acc[log.system] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  }, [logs]);

  const toggleExpanded = (logId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const toggleSystemFilter = (system: string) => {
    const newFilters = systemFilter.includes(system)
      ? systemFilter.filter(s => s !== system)
      : [...systemFilter, system];
    onSystemFilterChange(newFilters);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${dateStr}.${ms}`;
  };

  const getRelativeTime = (timestamp: number, baseTimestamp: number) => {
    const diff = timestamp - baseTimestamp;
    if (diff < 1000) return `+${diff}ms`;
    if (diff < 60000) return `+${(diff / 1000).toFixed(1)}s`;
    return `+${(diff / 60000).toFixed(1)}m`;
  };

  const baseTimestamp = sortedLogs[0]?.timestamp || 0;

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">No logs found</p>
            <p className="text-sm">Search for a trace ID to view log entries</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Timeline ({sortedLogs.length} entries)</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSystemFilterChange([])}
              disabled={systemFilter.length === 0}
            >
              Clear Filters
            </Button>
          </div>
        </div>
        
        {/* System filter badges */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(systemStats).map(([system, count]) => {
            const config = SYSTEM_CONFIG[system as keyof typeof SYSTEM_CONFIG];
            const isActive = systemFilter.length === 0 || systemFilter.includes(system);
            
            return (
              <Button
                key={system}
                variant="ghost"
                size="sm"
                onClick={() => toggleSystemFilter(system)}
                className={`h-auto p-2 ${isActive ? config.bgColor : 'opacity-50'}`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <span className={`font-medium ${config.textColor}`}>
                    {config.label}
                  </span>
                  <Badge variant="secondary" className="ml-1">
                    {count}
                  </Badge>
                </div>
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {sortedLogs.map((log, index) => {
            const isExpanded = expandedEntries.has(log.id);
            const config = SYSTEM_CONFIG[log.system];
            const levelConfig = LEVEL_CONFIG[log.level];
            
            return (
              <div key={log.id} className="relative">
                {/* Timeline connector */}
                {index > 0 && (
                  <div className="absolute left-4 -top-2 w-0.5 h-4 bg-border" />
                )}
                
                <LogEntryCard
                  log={log}
                  isExpanded={isExpanded}
                  onToggleExpanded={() => toggleExpanded(log.id)}
                  relativeTime={getRelativeTime(log.timestamp, baseTimestamp)}
                  formattedTime={formatTimestamp(log.timestamp)}
                  systemConfig={config}
                  levelConfig={levelConfig}
                />
              </div>
            );
          })}
        </div>

        {filteredLogs.length === 0 && systemFilter.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-lg font-medium">No logs match the current filters</p>
            <p className="text-sm">Try adjusting your system filters or search criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}