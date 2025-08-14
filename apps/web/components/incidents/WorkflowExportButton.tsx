/**
 * WorkflowExportButton Component
 * 
 * Exports complete workflow data to clipboard as JSON
 * Integrates with Convex backend for data aggregation
 * Used within DeveloperToolsBar for rapid workflow state capture
 */

"use client";

import React, { useState } from 'react';
import { Button } from '@starter/ui/button';
import { Copy, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkflowExportButtonProps {
  user: {
    sessionToken?: string;
    role: string;
  };
  incidentId: Id<"incidents"> | null;
  currentStep: number;
  onExportComplete?: (filename: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Copy JSON data to clipboard
 */
const copyJsonToClipboard = async (data: any): Promise<void> => {
  const jsonString = JSON.stringify(data, null, 2);
  await navigator.clipboard.writeText(jsonString);
};

export function WorkflowExportButton({
  user,
  incidentId,
  currentStep,
  onExportComplete,
  disabled = false,
  className
}: WorkflowExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const exportWorkflowData = useAction(api.workflowData.exportWorkflowData);

  const handleExport = async () => {
    if (!user.sessionToken || !incidentId || disabled) {
      toast.error("Copy Failed: Missing session token or incident ID");
      return;
    }

    setIsExporting(true);
    setExportStatus('idle');

    try {
      // The ConvexClientProvider automatically injects sessionToken, so we only need to pass incident_id
      const result = await exportWorkflowData({
        incident_id: incidentId
      });

      if (result.success && result.data) {
        // Copy JSON to clipboard
        await copyJsonToClipboard(result.data);
        
        setExportStatus('success');
        
        toast.success("Workflow data copied to clipboard");

        // Notify parent component with a generic success message
        onExportComplete?.("clipboard");

        // Reset status after 2 seconds
        setTimeout(() => setExportStatus('idle'), 2000);
      } else {
        throw new Error(result.error || 'Copy failed');
      }

    } catch (error) {
      console.error('Workflow copy failed:', error);
      setExportStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Copy failed';
      toast.error(`Copy Failed: ${errorMessage}`);

      // Reset status after 3 seconds
      setTimeout(() => setExportStatus('idle'), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Determine button icon and text based on state
  const getButtonContent = () => {
    if (isExporting) {
      return (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Copying...
        </>
      );
    }
    
    if (exportStatus === 'success') {
      return (
        <>
          <CheckCircle className="h-3 w-3 text-green-500" />
          Copied
        </>
      );
    }
    
    if (exportStatus === 'error') {
      return (
        <>
          <AlertTriangle className="h-3 w-3 text-red-500" />
          Failed
        </>
      );
    }

    return (
      <>
        <Copy className="h-3 w-3" />
        Copy ({currentStep}/8)
      </>
    );
  };

  const isDisabled = disabled || isExporting || !incidentId || !user.sessionToken;

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(className, {
        'opacity-50 cursor-not-allowed': isDisabled
      })}
      onClick={handleExport}
      disabled={isDisabled}
      title={
        disabled 
          ? "Complete at least the metadata step to copy"
          : `Copy complete workflow data to clipboard (${currentStep} steps completed)`
      }
    >
      {getButtonContent()}
    </Button>
  );
}