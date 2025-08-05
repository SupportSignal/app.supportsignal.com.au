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
import { Input } from '@starter/ui';
import { Badge } from '@starter/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@starter/ui';
import {
  Settings,
  ChevronDown,
  ChevronRight,
  TestTube,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

declare global {
  interface Window {
    ConsoleLogger: {
      getSuppressedPatterns: () => string[];
      isEnabled: () => boolean;
      getStatus: () => unknown;
    };
  }
}

interface SuppressionRulesPanelProps {
  className?: string;
}

export function SuppressionRulesPanel({
  className,
}: SuppressionRulesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<{
    suppressed: boolean;
    matchedPattern?: string;
  } | null>(null);
  const [consoleStatus, setConsoleStatus] = useState<{
    enabled?: boolean;
    traceId?: string;
    userId?: string;
  } | null>(null);

  const loadPatterns = () => {
    if (typeof window !== 'undefined' && window.ConsoleLogger) {
      const currentPatterns = window.ConsoleLogger.getSuppressedPatterns();
      setPatterns(currentPatterns);

      const status = window.ConsoleLogger.getStatus();
      setConsoleStatus(
        status as {
          enabled?: boolean;
          traceId?: string;
          userId?: string;
        } | null
      );
    }
  };

  useEffect(() => {
    loadPatterns();
  }, [isOpen]);

  // Read-only - patterns are hardcoded in console-override.ts

  const handleTestMessage = () => {
    if (!testMessage.trim()) return;

    // Simple client-side test - check if message matches any pattern
    const matchedPattern = patterns.find(pattern =>
      testMessage.toLowerCase().includes(pattern.toLowerCase())
    );

    setTestResult({
      suppressed: !!matchedPattern,
      matchedPattern,
    });
  };

  const getPatternCategory = (pattern: string) => {
    const devPatterns = ['[HMR]', 'webpack', '[Fast Refresh]', 'hot-update'];
    const reactPatterns = ['React DevTools', 'DevTools detected'];
    const browserPatterns = [
      'Received an error',
      'Non-Error promise rejection',
    ];

    if (devPatterns.some(p => pattern.includes(p)))
      return { label: 'Development', color: 'secondary' as const };
    if (reactPatterns.some(p => pattern.includes(p)))
      return { label: 'React', color: 'default' as const };
    if (browserPatterns.some(p => pattern.includes(p)))
      return { label: 'Browser', color: 'outline' as const };
    return { label: 'Custom', color: 'destructive' as const };
  };

  const isEnabled = consoleStatus?.enabled ?? false;

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Console Override Settings
                <Badge variant={isEnabled ? 'default' : 'secondary'}>
                  {isEnabled ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CardTitle>
            <CardDescription>
              Manage log suppression patterns and console override behavior
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold">{patterns.length}</div>
                <div className="text-xs text-muted-foreground">Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {isEnabled ? 'ON' : 'OFF'}
                </div>
                <div className="text-xs text-muted-foreground">Override</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {consoleStatus?.traceId?.slice(-8) || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Trace ID</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {consoleStatus?.userId || 'anonymous'}
                </div>
                <div className="text-xs text-muted-foreground">User ID</div>
              </div>
            </div>

            {/* Current Patterns (Read-Only) */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                Suppressed Patterns (Hardcoded)
              </h4>
              {patterns.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Loading suppression patterns...
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {patterns.map((pattern, index) => {
                    const category = getPatternCategory(pattern);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded"
                      >
                        <Badge variant={category.color} className="text-xs">
                          {category.label}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                          {pattern}
                        </code>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                These patterns are hardcoded in console-override.ts - modify
                source code to change them
              </p>
            </div>

            {/* Test Message Suppression */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Test Message Suppression
              </h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a test message to check if it would be suppressed..."
                    value={testMessage}
                    onChange={e => setTestMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTestMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTestMessage}
                    disabled={!testMessage.trim()}
                    variant="outline"
                  >
                    <TestTube className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                </div>

                {testResult && (
                  <div
                    className={`border rounded p-3 ${
                      testResult.suppressed
                        ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                        : 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {testResult.suppressed ? (
                        <>
                          <EyeOff className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-600">
                            This message would be SUPPRESSED
                          </span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">
                            This message would be LOGGED
                          </span>
                        </>
                      )}
                    </div>
                    {testResult.matchedPattern && (
                      <p className="text-sm text-muted-foreground">
                        Blocked by pattern:{' '}
                        <code className="bg-muted px-1 rounded font-medium">
                          {testResult.matchedPattern}
                        </code>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  How Suppression Works
                </span>
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>
                  • Patterns are checked before logs are sent to Redis/Convex
                </li>
                <li>
                  • If a log message contains any pattern, it&apos;s completely
                  filtered out
                </li>
                <li>
                  • System logs (Convex) are auto-categorized, not suppressed
                </li>
                <li>
                  • To modify patterns, edit <code>console-override.ts</code>{' '}
                  suppressedPatterns
                </li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}