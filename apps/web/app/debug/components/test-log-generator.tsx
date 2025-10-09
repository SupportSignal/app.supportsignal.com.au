'use client';

import { useState } from 'react';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Trash2, TestTube, Zap, AlertTriangle, Info, Bug } from 'lucide-react';

interface TestLogGeneratorProps {
  onLogsGenerated?: () => void;
  onLogsCleared?: () => void;
}

const SAMPLE_MESSAGES = {
  browser: [
    'User clicked navigation menu',
    'Form validation completed successfully',
    'Image loaded from CDN',
    'Local storage updated with user preferences',
    'Page scroll position changed',
    'Click event registered on submit button',
    'Browser cache cleared for session',
    'Viewport size changed to mobile',
  ],
  convex: [
    'Database query executed in 45ms',
    'User authentication validated',
    'Real-time subscription established',
    'Mutation processed successfully',
    'Schema validation passed',
    'Cache invalidation triggered',
    'Background job queued for processing',
    'Rate limit check passed',
  ],
  worker: [
    'Log ingestion request received',
    'Rate limiting policy enforced',
    'Redis connection established',
    'Background task scheduled',
    'Cache warmup completed',
    'API request forwarded to upstream',
    'Webhook payload validated',
    'Edge function invoked successfully',
  ],
  manual: [
    'Manual intervention: Database backup initiated',
    'System maintenance window started',
    'Configuration update applied',
    'Performance monitoring threshold adjusted',
    'Security scan completed',
    'Data migration script executed',
    'Feature flag toggled',
    'Emergency rollback procedure initiated',
  ]
};

const LOG_LEVELS = ['log', 'info', 'warn', 'error'] as const;

export default function TestLogGenerator({ onLogsGenerated, onLogsCleared }: TestLogGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const generateRandomLogs = async (system: keyof typeof SAMPLE_MESSAGES, count: number = 3) => {
    setIsGenerating(true);
    
    try {
      const messages = SAMPLE_MESSAGES[system];
      const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL;
      
      if (!workerUrl) {
        throw new Error('Worker URL not configured');
      }

      // Get current trace ID and generate a unique test trace ID to avoid rate limits
      const currentTraceId = (window as any).ConsoleLogger?.getTraceId();
      const testTraceId = `trace_${Date.now()}_test_${system}`;
      
      // Log test trace generation for debugging

      const logPromises = Array.from({ length: count }, async (_, i) => {
        const message = messages[Math.floor(Math.random() * messages.length)];
        const level = LOG_LEVELS[Math.floor(Math.random() * LOG_LEVELS.length)];

        const payload = {
          trace_id: testTraceId,
          message: `[TEST] ${message}`,
          level,
          system,
          user_id: 'test-user',
          stack: `Test stack trace for ${system} system`,
          context: {
            timestamp: Date.now() + (i * 100), // Slight delay for ordering
            url: window.location.href,
            userAgent: navigator.userAgent,
            testGenerated: true,
            systemType: system,
          },
        };

        const response = await fetch(`${workerUrl}/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to create test log: ${response.statusText}`);
        }

        return await response.json();
      });

      const results = await Promise.all(logPromises);
      // Generated test logs successfully
      setLastGenerated(`Generated ${count} ${system} logs. Trace ID: ${testTraceId.substring(0, 20)}...`);
      onLogsGenerated?.();
      
    } catch (error) {
      // Error handling for test log generation
      setLastGenerated(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAllLogs = async () => {
    setIsClearing(true);
    
    const workerUrl = process.env.NEXT_PUBLIC_LOG_WORKER_URL;
    const finalWorkerUrl = workerUrl || 'http://localhost:8787';
    
    try {
      // Minimal logging to avoid rate limit issues
      const clearUrl = `${finalWorkerUrl}/logs/clear`;

      const response = await fetch(clearUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
      }

      const result = await response.json();
      
      setLastGenerated(`✅ Cleared ${result.deleted} log collections from Redis`);
      onLogsCleared?.(); // Call the cleared callback to reset UI
      
    } catch (error) {
      // Error handling for log clearing
      
      // More detailed error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = `Network error: Cannot reach worker at ${finalWorkerUrl}. Is the worker running?`;
        } else {
          errorMessage = error.message;
        }
      }
      
      setLastGenerated(`❌ Clear failed: ${errorMessage}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5" />
          <span>Test Log Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Generate sample logs for testing the debug interface. Each system generates different types of realistic log messages.
        </div>

        {/* Generate Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => generateRandomLogs('browser')}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Browser Logs
            <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
              browser
            </Badge>
          </Button>

          <Button
            onClick={() => generateRandomLogs('convex')}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <Info className="h-4 w-4 mr-2" />
            Generate Convex Logs
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
              convex
            </Badge>
          </Button>

          <Button
            onClick={() => generateRandomLogs('worker')}
            disabled={isGenerating}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <Bug className="h-4 w-4 mr-2" />
            Generate Worker Logs
            <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-800">
              worker
            </Badge>
          </Button>

          <Button
            onClick={() => generateRandomLogs('manual')}
            disabled={isGenerating}
            variant="outline"
            size="sm" 
            className="justify-start"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Generate Manual Logs
            <Badge variant="secondary" className="ml-auto bg-orange-100 text-orange-800">
              manual
            </Badge>
          </Button>
        </div>

        {/* Bulk Actions */}
        <div className="flex space-x-2 pt-2 border-t">
          <Button
            onClick={() => {
              Promise.all([
                generateRandomLogs('browser', 2),
                generateRandomLogs('convex', 2),
                generateRandomLogs('worker', 2),
              ]);
            }}
            disabled={isGenerating}
            variant="secondary"
            size="sm"
          >
            Generate Mixed Logs
          </Button>

          <Button
            onClick={clearAllLogs}
            disabled={isClearing}
            variant="destructive"
            size="sm"
            className="ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearing ? 'Clearing...' : 'Clear All Logs'}
          </Button>
        </div>

        {/* Status */}
        {lastGenerated && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            {lastGenerated}
          </div>
        )}
      </CardContent>
    </Card>
  );
}