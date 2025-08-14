/**
 * DeveloperToolsBar Component
 * 
 * Consolidated developer tools bar positioned below the WorkflowWizard
 * Contains all sample data manipulation and workflow management buttons
 * Only visible to users with sample_data permissions (system_admin, demo_admin)
 */

"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@starter/ui/button';
import { Separator } from '@starter/ui/separator';
import { 
  Download, 
  Upload, 
  FileText, 
  MessageSquare, 
  Users,
  ChevronDown,
  ChevronUp,
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeveloperToolsBarProps, ToolsBarButtonStates } from '@/types/workflowData';
import { WorkflowExportButton } from './WorkflowExportButton';
import { WorkflowImportButton } from './WorkflowImportButton';

/**
 * Check if user has sample data permissions based on role
 */
const hasSampleDataPermissions = (userRole?: string): boolean => {
  return userRole ? ['system_admin', 'demo_admin'].includes(userRole) : false;
};

/**
 * Calculate which buttons should be active based on current workflow context
 */
const calculateButtonStates = (currentStep: number, hasIncidentId: boolean): ToolsBarButtonStates => {
  return {
    fillForm: currentStep === 1,           // Step 1: Metadata form
    fillNarrative: currentStep === 2,      // Step 2: Narrative grid
    fillQA: currentStep >= 3 && currentStep <= 6, // Steps 3-6: Clarification phases
    exportWorkflow: hasIncidentId,         // Active when workflow has progress
    importWorkflow: true,                  // Always active
  };
};

export function DeveloperToolsBar({
  user,
  currentStep,
  incidentId,
  onExportComplete,
  onImportComplete,
  onStepNavigate,
  onFillForm,
  onFillNarrative,
  onFillQA
}: DeveloperToolsBarProps & {
  onFillForm?: () => void;
  onFillNarrative?: () => void;
  onFillQA?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Check permissions - return null if no access
  if (!user || !hasSampleDataPermissions(user.role)) {
    return null;
  }

  // Calculate button states
  const buttonStates = useMemo(() => 
    calculateButtonStates(currentStep, !!incidentId), 
    [currentStep, incidentId]
  );

  // Common button styling
  const buttonClassName = cn(
    "h-7 text-xs text-gray-500 hover:text-white hover:bg-ss-teal",
    "border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal",
    "transition-all duration-200 px-3 gap-1.5"
  );

  // Disabled button styling
  const disabledButtonClassName = cn(
    buttonClassName,
    "opacity-50 cursor-not-allowed hover:text-gray-500 hover:bg-transparent hover:border-gray-300"
  );

  // Sample data handlers - now connected to parent component functionality
  const handleFillForm = () => {
    onFillForm?.();
  };

  const handleFillNarrative = () => {
    onFillNarrative?.();
  };

  const handleFillQA = () => {
    onFillQA?.();
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50/50 px-4 py-2">
      {/* Header with collapse toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Settings className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Developer Tools</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400">Step {currentStep} of 8</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
        >
          {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sample Data Section */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 font-medium mr-1">Sample Data:</span>
            
            {/* Fill Form Button - Active on Step 1 */}
            <Button
              variant="ghost"
              size="sm"
              className={buttonStates.fillForm ? buttonClassName : disabledButtonClassName}
              onClick={buttonStates.fillForm ? handleFillForm : undefined}
              disabled={!buttonStates.fillForm}
            >
              <Users className="h-3 w-3" />
              Fill Form
            </Button>

            {/* Fill Narrative Button - Active on Step 2 */}
            <Button
              variant="ghost"
              size="sm"
              className={buttonStates.fillNarrative ? buttonClassName : disabledButtonClassName}
              onClick={buttonStates.fillNarrative ? handleFillNarrative : undefined}
              disabled={!buttonStates.fillNarrative}
            >
              <FileText className="h-3 w-3" />
              Fill Narrative
            </Button>

            {/* Fill Q&A Button - Active on Steps 3-6 */}
            <Button
              variant="ghost"
              size="sm"
              className={buttonStates.fillQA ? buttonClassName : disabledButtonClassName}
              onClick={buttonStates.fillQA ? handleFillQA : undefined}
              disabled={!buttonStates.fillQA}
            >
              <MessageSquare className="h-3 w-3" />
              Fill Q&A
            </Button>
          </div>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Workflow Management Section */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 font-medium mr-1">Workflow:</span>
            
            {/* Export Workflow Button */}
            <WorkflowExportButton
              user={user}
              incidentId={incidentId}
              currentStep={currentStep}
              onExportComplete={onExportComplete}
              disabled={!buttonStates.exportWorkflow}
              className={buttonStates.exportWorkflow ? buttonClassName : disabledButtonClassName}
            />

            {/* Import Workflow Button */}
            <WorkflowImportButton
              user={user}
              onImportComplete={onImportComplete}
              onStepNavigate={onStepNavigate}
              className={buttonClassName}
            />
          </div>

          {/* Status Information */}
          {incidentId && (
            <>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>ID:</span>
                <code className="bg-gray-100 px-1 rounded text-xs">
                  {incidentId.slice(-8)}...
                </code>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="ml-auto text-xs text-gray-400 hidden md:block">
            💡 Quick testing tools for development
          </div>
        </div>
      )}
    </div>
  );
}

export type { DeveloperToolsBarProps, ToolsBarButtonStates };