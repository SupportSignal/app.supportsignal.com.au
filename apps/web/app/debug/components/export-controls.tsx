'use client';

import { useState } from 'react';
import { Button } from '@starter/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@starter/ui/dropdown-menu';
import { Download, FileText, Code, Bot } from 'lucide-react';

interface ExportControlsProps {
  onExport: (format: 'json' | 'markdown' | 'claude-format') => void;
  traceId: string;
  logCount: number;
}

const EXPORT_OPTIONS = [
  {
    id: 'json' as const,
    label: 'JSON',
    description: 'Structured data format',
    icon: Code,
    filename: (traceId: string) => `debug-${traceId}.json`
  },
  {
    id: 'markdown' as const,
    label: 'Markdown',
    description: 'Human-readable format',
    icon: FileText,
    filename: (traceId: string) => `debug-${traceId}.md`
  },
  {
    id: 'claude-format' as const,
    label: 'Claude Format',
    description: 'Optimized for AI analysis',
    icon: Bot,
    filename: (traceId: string) => `debug-claude-${traceId}.md`
  }
];

export default function ExportControls({ onExport, traceId, logCount }: ExportControlsProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'json' | 'markdown' | 'claude-format') => {
    setExporting(format);
    try {
      await onExport(format);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm text-muted-foreground">
        {logCount} logs
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={logCount === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          {EXPORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isExporting = exporting === option.id;
            
            return (
              <DropdownMenuItem
                key={option.id}
                onClick={() => handleExport(option.id)}
                disabled={isExporting}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">
                    {isExporting ? 'Exporting...' : option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
          
          <div className="px-2 py-1 border-t mt-1">
            <div className="text-xs text-muted-foreground">
              Export filename: debug-{traceId.slice(0, 8)}...
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}