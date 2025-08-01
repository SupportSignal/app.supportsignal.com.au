'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { AlertTriangle, TrendingUp, Workflow, Copy, HelpCircle } from 'lucide-react';
import type { CorrelationAnalysis } from '../lib/debug-api';

interface CorrelationPanelProps {
  correlationAnalysis: CorrelationAnalysis;
  traceId: string;
}

// Simple tooltip component
const HelpTooltip = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap max-w-xs z-50">
      {title}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

export default function CorrelationPanel({ correlationAnalysis, traceId }: CorrelationPanelProps) {
  const { errorChains, performanceInsights, systemFlow } = correlationAnalysis;

  const formatDuration = (duration: number | undefined) => {
    if (!duration) return 'N/A';
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  const copyAnalysis = async () => {
    const analysisText = `Trace Analysis: ${traceId}

Error Chains (${errorChains.length}):
${errorChains.map((chain, i) => 
  `${i + 1}. ${chain.pattern} (${chain.entries.length} entries)`
).join('\n')}

Performance Insights (${performanceInsights.length}):
${performanceInsights.map((insight, i) => 
  `${i + 1}. ${insight.metric}: ${insight.value} - ${insight.context}`
).join('\n')}

System Flow (${systemFlow.length} systems):
${systemFlow.map((flow, i) => 
  `${i + 1}. ${flow.system} at ${formatTimestamp(flow.timestamp)} (${formatDuration(flow.duration)})`
).join('\n')}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(analysisText);
      }
    } catch {
      // Silent failure for clipboard - not critical
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">Correlation Analysis</CardTitle>
              <HelpTooltip title="Automated log analysis (Currently Mocked) - Real implementation would analyze log patterns to detect error cascades, performance bottlenecks, and request flows across systems.">
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </HelpTooltip>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyAnalysis}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Automated analysis for trace: <code className="font-mono">{traceId}</code>
          </p>
        </CardHeader>
      </Card>

      {/* Error Chains */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <CardTitle className="text-base">Error Chains</CardTitle>
            <Badge variant="secondary">{errorChains.length}</Badge>
            <HelpTooltip title="Error Chain Detection (Currently Mocked) - Links related errors across systems to identify cascading failures. Example: Browser error → API failure → Database timeout">
              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent>
          {errorChains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No error chains detected</p>
          ) : (
            <div className="space-y-3">
              {errorChains.map((chain, index) => (
                <div key={index} className="border rounded-lg p-3 bg-destructive/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-destructive">
                      {chain.pattern}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {chain.entries.length} entries
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {chain.entries.slice(0, 3).map((entry, entryIndex) => (
                      <div key={entryIndex} className="text-xs text-muted-foreground">
                        <span className="font-mono">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="capitalize">{entry.system}</span>
                        <span className="mx-2">•</span>
                        <span className="line-clamp-1">{entry.message}</span>
                      </div>
                    ))}
                    {chain.entries.length > 3 && (
                      <div className="text-xs text-muted-foreground italic">
                        ... and {chain.entries.length - 3} more entries
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-warning" />
            <CardTitle className="text-base">Performance Insights</CardTitle>
            <Badge variant="secondary">{performanceInsights.length}</Badge>
            <HelpTooltip title="Performance Analysis (Currently Mocked) - Detects slow operations, timeouts, and bottlenecks across trace. Example: Slow database queries, API timeouts, excessive rendering">
              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent>
          {performanceInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No performance issues detected</p>
          ) : (
            <div className="space-y-3">
              {performanceInsights.map((insight, index) => (
                <div key={index} className="border rounded-lg p-3 bg-warning/5">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{insight.metric}</h4>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {typeof insight.value === 'number' && insight.value < 1000
                        ? `${insight.value}ms`
                        : typeof insight.value === 'number'
                        ? `${(insight.value / 1000).toFixed(1)}s`
                        : insight.value
                      }
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.context}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Flow */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Workflow className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">System Flow</CardTitle>
            <Badge variant="secondary">{systemFlow.length}</Badge>
            <HelpTooltip title="System Flow Mapping (Currently Mocked) - Maps how requests flow between systems with timing analysis. Example: Browser → Convex → Worker → External API">
              <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
            </HelpTooltip>
          </div>
        </CardHeader>
        <CardContent>
          {systemFlow.length === 0 ? (
            <p className="text-sm text-muted-foreground">No system flow data available</p>
          ) : (
            <div className="space-y-2">
              {systemFlow.map((flow, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      flow.system === 'browser' ? 'bg-blue-500' :
                      flow.system === 'convex' ? 'bg-green-500' :
                      flow.system === 'worker' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">{flow.system}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-muted-foreground">
                      {formatTimestamp(flow.timestamp)}
                    </p>
                    {flow.duration && (
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(flow.duration)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}