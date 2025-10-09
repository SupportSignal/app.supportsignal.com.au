'use client';

import { useState } from 'react';
import { Card, CardContent } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import type { RedisLogEntry } from '@/app/debug/lib/debug-api';

interface LogEntryCardProps {
  log: RedisLogEntry;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  relativeTime: string;
  formattedTime: string;
  systemConfig: {
    label: string;
    color: string;
    textColor: string;
    bgColor: string;
  };
  levelConfig: {
    color: string;
    label: string;
  };
}

export default function LogEntryCard({
  log,
  isExpanded,
  onToggleExpanded,
  relativeTime,
  formattedTime,
  systemConfig,
  levelConfig
}: LogEntryCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Silent failure for clipboard - not critical
    }
  };

  const copyLogEntry = () => {
    const logText = JSON.stringify(log, null, 2);
    copyToClipboard(logText);
  };

  const formatContextValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <Card className={`transition-all duration-200 ${isExpanded ? 'ring-2 ring-primary/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Timeline dot */}
          <div className={`w-3 h-3 rounded-full ${systemConfig.color} mt-2 flex-shrink-0`} />
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className={`${systemConfig.bgColor} ${systemConfig.textColor} border-0`}
                >
                  {systemConfig.label}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${levelConfig.color} text-white border-0`}
                >
                  {levelConfig.label}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground">
                  {relativeTime}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyLogEntry}
                  className="h-6 w-6 p-0"
                  title="Copy log entry"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpanded}
                  className="h-6 w-6 p-0"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Message */}
            <div className="mb-2">
              <p className="text-sm leading-relaxed break-words">
                {log.message}
              </p>
            </div>

            {/* Stack trace preview */}
            {log.stack && !isExpanded && (
              <div className="mb-2">
                <div className="text-xs text-destructive font-mono bg-destructive/10 p-2 rounded border-l-2 border-destructive">
                  <div className="line-clamp-2">
                    {log.stack.split('\n')[0]}
                  </div>
                </div>
              </div>
            )}

            {/* Expanded content */}
            {isExpanded && (
              <div className="space-y-3 pt-2 border-t">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-muted-foreground">Timestamp:</span>
                    <p className="font-mono">{formattedTime}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Log ID:</span>
                    <p className="font-mono break-all">{log.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Trace ID:</span>
                    <p className="font-mono break-all">{log.trace_id}</p>
                  </div>
                  {log.user_id && (
                    <div>
                      <span className="font-medium text-muted-foreground">User ID:</span>
                      <p className="font-mono break-all">{log.user_id}</p>
                    </div>
                  )}
                </div>

                {/* Stack trace */}
                {log.stack && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs">Stack Trace:</span>
                    <pre className="text-xs text-destructive font-mono bg-destructive/10 p-3 rounded border-l-2 border-destructive overflow-x-auto whitespace-pre-wrap">
                      {log.stack}
                    </pre>
                  </div>
                )}

                {/* Context */}
                {log.context && Object.keys(log.context).length > 0 && (
                  <div>
                    <span className="font-medium text-muted-foreground text-xs">Context:</span>
                    <div className="bg-muted/50 p-3 rounded border">
                      {Object.entries(log.context).map(([key, value]) => (
                        <div key={key} className="mb-2 last:mb-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-xs text-muted-foreground">
                              {key}:
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(formatContextValue(value))}
                              className="h-4 w-4 p-0"
                              title="Copy value"
                            >
                              <Copy className="h-2 w-2" />
                            </Button>
                          </div>
                          <pre className="text-xs font-mono mt-1 whitespace-pre-wrap break-all">
                            {formatContextValue(value)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Copy feedback */}
        {copied && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            Copied!
          </div>
        )}
      </CardContent>
    </Card>
  );
}