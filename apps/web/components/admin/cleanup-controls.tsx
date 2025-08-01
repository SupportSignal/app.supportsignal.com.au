'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui';
import { Button } from '@starter/ui';
import { Badge } from '@starter/ui';
import { Alert, AlertDescription } from '@starter/ui';
import { 
  Trash2, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@starter/ui';

interface CleanupResult {
  type: 'safe' | 'force';
  deletedCount?: number;
  deletedRecent?: number;
  deletedQueue?: number;
  totalDeleted?: number;
  message: string;
  timestamp: Date;
}

interface CleanupControlsProps {
  refreshTrigger?: number;
}

export function CleanupControls({ refreshTrigger }: CleanupControlsProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CleanupResult[]>([]);
  
  const cleanupStatus = useQuery(api.cleanup.status);
  const runSafeCleanup = useMutation(api.cleanup.safe);
  const runForceCleanup = useMutation(api.cleanup.force);
  
  // Handle refresh trigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      console.log('CleanupControls refresh triggered - status will update automatically');
    }
  }, [refreshTrigger]);

  const handleSafeCleanup = async () => {
    setIsRunning(true);
    try {
      const result = await runSafeCleanup({});
      setResults(prev => [{
        type: 'safe',
        deletedCount: result.deletedCount,
        message: result.message,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    } catch (error) {
      setResults(prev => [{
        type: 'safe',
        message: `Error: ${error}`,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleForceCleanup = async () => {
    setIsRunning(true);
    try {
      const result = await runForceCleanup({});
      setResults(prev => [{
        type: 'force',
        deletedRecent: result.deletedRecent,
        deletedQueue: result.deletedQueue,
        totalDeleted: result.totalDeleted,
        message: result.message,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    } catch (error) {
      setResults(prev => [{
        type: 'force',
        message: `Error: ${error}`,
        timestamp: new Date()
      }, ...prev.slice(0, 4)]);
    } finally {
      setIsRunning(false);
    }
  };

  if (!cleanupStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Cleanup Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const needsCleanup = cleanupStatus.recommendation.action.includes('cleanup');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Database Cleanup Controls
        </CardTitle>
        <CardDescription>
          Manage database storage and clean up old log entries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Cleanup Status</span>
            <Badge variant={needsCleanup ? 'secondary' : 'default'}>
              {needsCleanup ? 'Cleanup Recommended' : 'Database Healthy'}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {cleanupStatus.recommendation.action}
          </div>
        </div>

        {/* Database Counts */}
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Log Queue Entries</span>
            <span className="text-sm font-mono">
              {cleanupStatus.counts.log_queue_sample.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Recent Log Entries</span>
            <span className="text-sm font-mono">
              {cleanupStatus.counts.recent_log_entries_sample.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Total Recent Activity</span>
            <span className="text-sm font-mono">
              {cleanupStatus.recentActivity.totalRecentSample.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Cleanup Actions */}
        <div className="space-y-3 border-t pt-4">
          <div className="grid gap-3">
            {/* Safe Cleanup */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Safe Cleanup</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Remove expired logs and entries older than 1 hour
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSafeCleanup}
                disabled={isRunning}
              >
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Run Safe Cleanup'}
              </Button>
            </div>

            {/* Force Cleanup */}
            <div className="flex items-center justify-between p-3 border rounded-lg border-destructive/20">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Emergency Cleanup</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Remove ALL logs regardless of age (testing/emergency only)
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={isRunning}
                  >
                    Emergency Clean
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Confirm Emergency Cleanup
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete ALL log entries regardless of age. 
                      This action cannot be undone and should only be used for testing 
                      or emergency situations.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleForceCleanup}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete All Logs
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Recent Activity Summary */}
        {cleanupStatus.recentActivity.topMessages.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Top Recent Messages</h4>
            <div className="space-y-1">
              {cleanupStatus.recentActivity.topMessages.slice(0, 3).map(([message, count]: [string, number], index: number) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="truncate max-w-[200px]">{message}</span>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results History */}
        {results.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Recent Cleanup Results</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <Alert key={index} className="py-2">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant={result.type === 'force' ? 'destructive' : 'default'} className="mr-2">
                          {result.type === 'force' ? 'Force' : 'Safe'}
                        </Badge>
                        {result.totalDeleted !== undefined ? 
                          `Deleted ${result.totalDeleted} entries` :
                          `Deleted ${result.deletedCount || 0} entries`
                        }
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          {cleanupStatus.counts.note}
        </div>
      </CardContent>
    </Card>
  );
}