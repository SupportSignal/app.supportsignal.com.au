'use client';

import { useState, useEffect } from 'react';
import { Button } from '@starter/ui/button';
import { Input } from '@starter/ui/input';
import { Label } from '@starter/ui/label';
import { Checkbox } from '@starter/ui/checkbox';
import { Card } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Clock, Copy, TestTube } from 'lucide-react';

interface TraceSearchFormProps {
  onSearch: (traceId: string, systemFilters: string[]) => void;
  loading: boolean;
  showTestGenerator: boolean;
  onToggleTestGenerator: () => void;
}

const SYSTEM_OPTIONS = [
  { id: 'browser', label: 'Browser', color: 'bg-blue-500' },
  { id: 'convex', label: 'Convex', color: 'bg-green-500' },
  { id: 'worker', label: 'Worker', color: 'bg-purple-500' },
  { id: 'manual', label: 'Manual', color: 'bg-orange-500' }
];

export default function TraceSearchForm({ onSearch, loading, showTestGenerator, onToggleTestGenerator }: TraceSearchFormProps) {
  const [traceId, setTraceId] = useState('');
  const [systemFilters, setSystemFilters] = useState<string[]>([]);
  const [currentBrowserTrace, setCurrentBrowserTrace] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Get current browser trace ID on component mount and refresh periodically
  useEffect(() => {
    const updateTraceId = () => {
      try {
        // Access the global ConsoleLogger if available
        const consoleLogger = (window as unknown as { ConsoleLogger?: { getTraceId: () => string } }).ConsoleLogger;
        if (consoleLogger && typeof consoleLogger.getTraceId === 'function') {
          const traceId = consoleLogger.getTraceId();
          setCurrentBrowserTrace(traceId);
        }
      } catch (error) {
        // Silently fail if ConsoleLogger is not available
      }
    };

    // Initial load
    updateTraceId();
    
    // Refresh every 2 seconds to stay synchronized with LoggingStatus widget
    const interval = setInterval(updateTraceId, 2000);
    
    return () => clearInterval(interval);
  }, []);

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

  const useCurrentTrace = () => {
    if (currentBrowserTrace) {
      setTraceId(currentBrowserTrace);
    }
  };

  const debugCurrentSession = () => {
    if (currentBrowserTrace) {
      onSearch(currentBrowserTrace, systemFilters);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (traceId.trim()) {
      onSearch(traceId.trim(), systemFilters);
    }
  };

  const handleSystemFilterChange = (systemId: string, checked: boolean) => {
    setSystemFilters(prev => 
      checked 
        ? [...prev, systemId]
        : prev.filter(id => id !== systemId)
    );
  };

  const clearFilters = () => {
    setSystemFilters([]);
  };

  return (
    <div className="space-y-4">
      {/* Current Browser Session */}
      {currentBrowserTrace && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Current Browser Session</p>
                <p className="text-xs text-blue-600 font-mono">{currentBrowserTrace}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentBrowserTrace)}
                className="h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useCurrentTrace}
                className="h-8"
              >
                Use This ID
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={debugCurrentSession}
                disabled={loading}
                className="h-8"
              >
                Debug Now
              </Button>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="traceId">Trace ID</Label>
          <Input
            id="traceId"
            type="text"
            placeholder="Enter trace ID to search logs..."
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
            disabled={loading}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Enter the correlation ID from your logs to fetch related entries
          </p>
        </div>

        <div className="space-y-2">
          <Label>System Filters</Label>
          <Card className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {SYSTEM_OPTIONS.map((system) => (
                <div key={system.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={system.id}
                    checked={systemFilters.includes(system.id)}
                    onCheckedChange={(checked) => 
                      handleSystemFilterChange(system.id, !!checked)
                    }
                    disabled={loading}
                  />
                  <Label 
                    htmlFor={system.id}
                    className="flex items-center space-x-2 text-sm cursor-pointer"
                  >
                    <div className={`w-3 h-3 rounded-full ${system.color}`} />
                    <span>{system.label}</span>
                  </Label>
                </div>
              ))}
            </div>
            {systemFilters.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={loading}
                  className="text-xs"
                >
                  Clear Filters ({systemFilters.length})
                </Button>
              </div>
            )}
          </Card>
          <p className="text-xs text-muted-foreground">
            Filter logs by system origin (leave empty for all systems)
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            type="submit" 
            disabled={loading || !traceId.trim()}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Searching...
              </>
            ) : (
              'Search Logs'
            )}
          </Button>
          
          {traceId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setTraceId('')}
              disabled={loading}
            >
              Clear
            </Button>
          )}
        </div>
        
        <Button
          type="button"
          variant={showTestGenerator ? "default" : "outline"}
          size="sm"
          onClick={onToggleTestGenerator}
          title={showTestGenerator ? "Hide Test Log Generator" : "Show Test Log Generator"}
        >
          <TestTube className="h-4 w-4" />
        </Button>
      </div>

      {systemFilters.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Filtering by: {systemFilters.join(', ')}
        </div>
      )}
    </form>
    </div>
  );
}