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
  Tabs,
  TabsList,
  TabsTrigger,
} from '@starter/ui';
import { Textarea } from '@starter/ui';
import { 
  Download, 
  Copy, 
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ExportControlsCardProps {
  refreshTrigger?: number;
}

interface ExportData {
  format: string;
  count: number;
  data: unknown;
}

export function ExportControlsCard({}: ExportControlsCardProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'readable'>('readable');
  const [filterType, setFilterType] = useState<'all' | 'trace' | 'user'>('all');
  const [filterId, setFilterId] = useState('');
  const [exportLimit, setExportLimit] = useState('1000');
  const [chronological, setChronological] = useState(false); // false = newest first, true = oldest first
  const [exportTarget, setExportTarget] = useState<'clipboard' | 'download'>('clipboard'); // Default to clipboard
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Build export query args
  const exportArgs = {
    format: exportFormat,
    limit: parseInt(exportLimit) || 1000,
    chronological,
    ...(filterType === 'trace' && filterId && { trace_id: filterId }),
    ...(filterType === 'user' && filterId && { user_id: filterId })
  };

  // Get preview data for current export settings
  const previewData = useQuery(api.debugLogs.exportLogs, exportArgs);

  const handleExport = async () => {
    if (!previewData) return;
    
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      let content = '';
      
      // Prepare content based on format
      if (exportFormat === 'json') {
        content = JSON.stringify(previewData.data, null, 2);
      } else if (exportFormat === 'csv' || exportFormat === 'readable') {
        content = previewData.data;
      }

      if (exportTarget === 'clipboard') {
        // Copy to clipboard
        await navigator.clipboard.writeText(content);
      } else {
        // Download file
        let mimeType = 'text/plain';
        let filename = `debug-logs-${Date.now()}`;

        if (exportFormat === 'json') {
          mimeType = 'application/json';
          filename += '.json';
        } else if (exportFormat === 'csv') {
          mimeType = 'text/csv';
          filename += '.csv';
        } else if (exportFormat === 'readable') {
          mimeType = 'text/plain';
          filename += '.txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatDescription = () => {
    switch (exportFormat) {
      case 'json':
        return 'Structured JSON with full log context - ideal for programmatic analysis';
      case 'csv':
        return 'Comma-separated values for spreadsheet analysis';
      case 'readable':
        return `Human-readable ${chronological ? 'chronological' : 'reverse chronological'} format - optimized for analysis and debugging`;
      default:
        return '';
    }
  };

  const getPreviewContent = () => {
    if (!previewData) return 'Loading preview...';
    
    if (exportFormat === 'json') {
      const jsonStr = JSON.stringify(previewData.data, null, 2);
      // Show more content for JSON - up to 5000 chars, or full content if less than 2000 chars
      if (jsonStr.length <= 2000) {
        return jsonStr;
      }
      return jsonStr.slice(0, 5000) + '\n\n... (truncated for preview - full export will contain all data)';
    } else if (exportFormat === 'csv' || exportFormat === 'readable') {
      const contentStr = String(previewData.data);
      // Show more content for text/csv - up to 5000 chars, or full content if less than 2000 chars
      if (contentStr.length <= 2000) {
        return contentStr;
      }
      return contentStr.slice(0, 5000) + '\n\n... (truncated for preview - full export will contain all data)';
    }
    
    return 'No preview available';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Controls
        </CardTitle>
        <CardDescription>
          Export debug logs in AI-optimized formats for analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Configuration */}
        <div className="space-y-4">
          {/* Export Destination - Clean tabs interface */}
          <div>
            <label className="text-sm font-medium mb-3 block">Export Destination</label>
            <Tabs 
              value={exportTarget} 
              onValueChange={(value) => setExportTarget(value as 'clipboard' | 'download')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clipboard" className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy to Clipboard
                </TabsTrigger>
                <TabsTrigger value="download" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download File
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Configuration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="readable">Readable Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Filter By</label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Logs</SelectItem>
                  <SelectItem value="trace">Specific Trace</SelectItem>
                  <SelectItem value="user">Specific User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter ID Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {filterType === 'trace' ? 'Trace ID' : filterType === 'user' ? 'User ID' : 'Filter ID'}
              </label>
              <Input
                placeholder={
                  filterType === 'trace' ? 'Enter trace ID...' :
                  filterType === 'user' ? 'Enter user ID...' : 
                  'No filter needed'
                }
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                disabled={filterType === 'all'}
              />
            </div>

            {/* Limit */}
            <div>
              <label className="text-sm font-medium mb-2 block">Limit</label>
              <Input
                type="number"
                placeholder="1000"
                value={exportLimit}
                onChange={(e) => setExportLimit(e.target.value)}
                min="1"
                max="10000"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-sm font-medium mb-2 block">Sort Order</label>
              <Button
                variant="outline"
                onClick={() => setChronological(!chronological)}
                className="w-full justify-start"
                title={chronological ? 'Sort: Oldest First (click for Newest First)' : 'Sort: Newest First (click for Oldest First)'}
              >
                {chronological ? (
                  <ArrowUp className="h-4 w-4 mr-2" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-2" />
                )}
                {chronological ? 'Oldest First' : 'Newest First'}
              </Button>
            </div>
          </div>
        </div>

        {/* Format Description */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>{exportFormat.toUpperCase()}:</strong> {getFormatDescription()}
          </p>
        </div>

        {/* Export Stats Preview */}
        {previewData && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Export Preview
              </h4>
              <Badge variant="outline">
                {previewData.count.toLocaleString()} logs ready
              </Badge>
            </div>
            
            <Textarea
              value={getPreviewContent()}
              readOnly
              className="font-mono text-xs"
              rows={8}
            />
            
            {previewData.count > 500 && (
              <p className="text-xs text-muted-foreground mt-2">
                Preview shows first 500 characters. Full export will include all {previewData.count.toLocaleString()} logs.
              </p>
            )}
          </div>
        )}

        {/* Single Export Action */}
        <div className="flex justify-center">
          <Button
            onClick={handleExport}
            disabled={isExporting || !previewData || previewData.count === 0}
            size="lg"
            className="min-w-48"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {exportTarget === 'clipboard' ? 'Copying to Clipboard...' : 'Preparing Download...'}
              </>
            ) : exportSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                {exportTarget === 'clipboard' ? 'Copied to Clipboard!' : 'Downloaded!'}
              </>
            ) : (
              <>
                {exportTarget === 'clipboard' ? (
                  <Copy className="h-4 w-4 mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {exportTarget === 'clipboard' ? 'Copy to Clipboard' : 'Download File'}
              </>
            )}
          </Button>
        </div>

        {/* Export Success */}
        {exportSuccess && previewData && (
          <div className="border rounded-lg p-4 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                {exportTarget === 'clipboard' ? 'Copied to Clipboard!' : 'File Downloaded!'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <strong>{previewData.count.toLocaleString()}</strong> logs exported in <strong>{exportFormat.toUpperCase()}</strong> format
              </p>
              <p className="text-muted-foreground">
                {exportTarget === 'clipboard' 
                  ? 'Data is now ready for pasting into Claude Code or other analysis tools'
                  : 'File has been saved to your Downloads folder'
                }
              </p>
            </div>
          </div>
        )}

        {/* Readable Format Note */}
        {exportFormat === 'readable' && (
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Readable Text Format</span>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>This readable format is optimized for human analysis with:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{chronological ? 'Chronological' : 'Reverse chronological'} ordering for timeline analysis</li>
                <li>Clear trace correlation markers</li>
                <li>Structured context preservation</li>
                <li>Human-readable timestamps</li>
              </ul>
            </div>
          </div>
        )}

        {/* Usage Instructions */}
        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p>• <strong>Clipboard (default):</strong> Quick access for Claude Code analysis and investigation</p>
          <p>• <strong>Download:</strong> Permanent storage for documentation and sharing</p>
          <p>• <strong>Formats:</strong> JSON (structured), CSV (spreadsheets), Text (human-friendly)</p>
        </div>
      </CardContent>
    </Card>
  );
}