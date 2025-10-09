'use client';

import { useState, useEffect } from 'react';
import { ConsoleLogger } from '@/lib/console-override';

export function LoggingStatus() {
  const [status, setStatus] = useState<{
    initialized: boolean;
    enabled: boolean;
    traceId: string;
    userId: string;
  } | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showFullTrace, setShowFullTrace] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const updateStatus = () => setStatus(ConsoleLogger.getStatus());

    // Initial status
    updateStatus();

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleNewTrace = () => {
    // Generate new trace ID
    if (ConsoleLogger.newTrace) {
      ConsoleLogger.newTrace();
    } else {
      // Fallback: refresh the page to get new trace
      window.location.reload();
    }
    setStatus(ConsoleLogger.getStatus());
  };

  const copyTraceId = () => {
    if (status?.traceId) {
      navigator.clipboard.writeText(status.traceId);
      // Could add a toast notification here
    }
  };

  // Don't render in production
  if (process.env.NODE_ENV !== 'development' || !status) {
    return null;
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded shadow-lg font-mono z-50 cursor-pointer hover:bg-gray-700"
           onClick={() => setIsMinimized(false)}>
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${
              status.enabled && status.initialized ? 'bg-green-400' : 'bg-red-400'
            }`}
          ></div>
          <span>Logs</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-3 rounded shadow-lg font-mono z-50 max-w-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Claude Logging Status</div>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white px-1"
            title="Minimize"
          >
            −
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white px-1"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="flex items-center mb-2">
        <div
          className={`w-2 h-2 rounded-full inline-block mr-2 ${
            status.enabled && status.initialized ? 'bg-green-400' : 'bg-red-400'
          }`}
        ></div>
        <span>
          {status.enabled && status.initialized ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span>Trace:</span>
          <button
            onClick={() => setShowFullTrace(!showFullTrace)}
            className="text-blue-400 hover:text-blue-300 underline"
            title="Toggle full trace ID"
          >
            {showFullTrace ? 'Hide' : 'Show Full'}
          </button>
        </div>
        
        <div 
          className="bg-gray-700 p-1 rounded cursor-pointer hover:bg-gray-600 break-all"
          onClick={copyTraceId}
          title="Click to copy trace ID"
        >
          {showFullTrace ? status.traceId : `${status.traceId.substring(0, 12)}...`}
        </div>
        
        <div>User: {status.userId}</div>
      </div>

      <div className="flex space-x-1 mt-2">
        <button
          onClick={handleNewTrace}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs flex-1"
        >
          New Trace
        </button>
        <button
          onClick={copyTraceId}
          className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          title="Copy trace ID"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
