/**
 * WorkflowImportButton Component
 * 
 * Imports complete workflow data from JSON file or text input
 * Validates data structure before database import
 * Used within DeveloperToolsBar for rapid workflow state recreation
 */

"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@starter/ui/button';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@starter/ui/alert-dialog';
import { Textarea } from '@starter/ui/textarea';
import { Label } from '@starter/ui/label';
import { Upload, Loader2, CheckCircle, AlertTriangle, FileText, X } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { WorkflowImportResult } from '@/types/workflowData';

interface WorkflowImportButtonProps {
  user: {
    sessionToken?: string;
    role: string;
  };
  onImportComplete?: (result: WorkflowImportResult) => void;
  onStepNavigate?: (step: number) => void;
  className?: string;
}

/**
 * Parse JSON safely with helpful error messages
 */
const parseJsonSafely = (jsonString: string) => {
  try {
    return { success: true, data: JSON.parse(jsonString) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format'
    };
  }
};

export function WorkflowImportButton({
  user,
  onImportComplete,
  onStepNavigate,
  className
}: WorkflowImportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [jsonInput, setJsonInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importWorkflowData = useAction(api.workflowData.importWorkflowData);
  const validateWorkflowData = useAction(api.workflowData.validateWorkflowData);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error("Invalid File Type: Please select a JSON file");
      return;
    }

    try {
      const fileContent = await file.text();
      setJsonInput(fileContent);
      
      // Auto-validate when file is loaded
      await validateJson(fileContent, false);
      
    } catch (error) {
      toast.error("File Read Error: Failed to read the selected file");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateJson = async (jsonString: string, showToast: boolean = true) => {
    if (!jsonString.trim()) {
      setValidationErrors(['JSON input is empty']);
      setValidationWarnings([]);
      return false;
    }

    // Parse JSON first
    const parseResult = parseJsonSafely(jsonString);
    if (!parseResult.success) {
      setValidationErrors([`JSON Parse Error: ${parseResult.error}`]);
      setValidationWarnings([]);
      return false;
    }

    try {
      // Validate structure with backend
      const validation = await validateWorkflowData({
        workflow_data: parseResult.data
      });

      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings);

      if (validation.valid && showToast) {
        toast.success(`Validation Successful: Workflow data is valid (detected step ${validation.detected_step})`);
      } else if (!validation.valid && showToast) {
        toast.error(`Validation Failed: ${validation.errors.length} errors found`);
      }

      return validation.valid;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Validation failed';
      setValidationErrors([errorMsg]);
      setValidationWarnings([]);
      
      if (showToast) {
        toast.error(`Validation Error: ${errorMsg}`);
      }
      
      return false;
    }
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast.error("Import Failed: JSON data is required");
      return;
    }

    setIsImporting(true);
    setImportStatus('idle');

    try {
      // Validate first
      const isValid = await validateJson(jsonInput, false);
      if (!isValid) {
        throw new Error('Validation failed - fix errors before importing');
      }

      // Parse JSON
      const parseResult = parseJsonSafely(jsonInput);
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      // Import the data
      const result = await importWorkflowData({
        workflow_data: parseResult.data
      });

      if (result.success && result.incident_id) {
        setImportStatus('success');
        setIsDialogOpen(false);
        
        toast.success(`Workflow imported successfully (${result.created_step} steps created)`);

        // Navigate to appropriate step
        if (onStepNavigate) {
          // Navigate to next step after the highest imported step
          const navigationStep = Math.min(result.created_step + 1, 8);
          onStepNavigate(navigationStep);
        }

        // Notify parent component
        onImportComplete?.(result);

        // Reset form
        setJsonInput('');
        setValidationErrors([]);
        setValidationWarnings([]);
        
      } else {
        throw new Error(result.errors.join(', ') || 'Import failed');
      }

    } catch (error) {
      console.error('Workflow import failed:', error);
      setImportStatus('error');
      
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      toast.error(`Import Failed: ${errorMessage}`);

      // Reset status after 3 seconds
      setTimeout(() => setImportStatus('idle'), 3000);
    } finally {
      setIsImporting(false);
    }
  };

  const canImport = jsonInput.trim() && validationErrors.length === 0 && !isImporting;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className}
        onClick={() => setIsDialogOpen(true)}
        title="Import workflow data from JSON file"
      >
        <Upload className="h-3 w-3" />
        Import
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Import Workflow Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              Upload a JSON file or paste workflow data to recreate a complete incident workflow.
              The system will validate the data before importing.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            {/* File Upload Section */}
            <div>
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Upload JSON File
              </Label>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-gray-100 file:text-gray-700
                          hover:file:bg-gray-200"
              />
            </div>

            {/* JSON Text Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="json-input" className="text-sm font-medium">
                  Or Paste JSON Data
                </Label>
                {jsonInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setJsonInput('');
                      setValidationErrors([]);
                      setValidationWarnings([]);
                    }}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Textarea
                id="json-input"
                placeholder='Paste workflow JSON data here...'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="min-h-[200px] font-mono text-xs"
              />
            </div>

            {/* Validation Section */}
            {jsonInput && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => validateJson(jsonInput)}
                    className="text-xs"
                  >
                    Validate JSON
                  </Button>
                  
                  {validationErrors.length === 0 && validationWarnings.length === 0 && jsonInput && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Valid JSON format
                    </span>
                  )}
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-sm font-medium text-red-700">Validation Errors</span>
                    </div>
                    <ul className="text-xs text-red-600 space-y-0.5">
                      {validationErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validation Warnings */}
                {validationWarnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm font-medium text-yellow-700">Warnings</span>
                    </div>
                    <ul className="text-xs text-yellow-600 space-y-0.5">
                      {validationWarnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setJsonInput('');
                setValidationErrors([]);
                setValidationWarnings([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!canImport}
              className={cn({
                'bg-green-600 hover:bg-green-700': importStatus === 'success',
                'bg-red-600 hover:bg-red-700': importStatus === 'error'
              })}
            >
              {isImporting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {importStatus === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
              {importStatus === 'error' && <AlertTriangle className="h-3 w-3 mr-1" />}
              
              {isImporting ? 'Importing...' : 
               importStatus === 'success' ? 'Imported!' :
               importStatus === 'error' ? 'Failed' : 'Import Workflow'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}