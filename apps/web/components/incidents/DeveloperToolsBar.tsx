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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@starter/ui/dropdown-menu';
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
import { PromptTestingPanel } from '../developer/PromptTestingPanel';

// Narrative scenario options that match backend createSampleData scenarios
const NARRATIVE_SCENARIOS = [
  {
    type: 'medication_error',
    icon: '💊',
    name: 'Medication Error',
    participant: 'Emma Johnson',
    description: 'Medication administration error with monitoring protocol',
    severity: 'medium'
  },
  {
    type: 'injury',
    icon: '🩹',
    name: 'Injury/Fall',
    participant: 'Michael Chen',
    description: 'Participant fall with head injury requiring hospital assessment',
    severity: 'high'
  },
  {
    type: 'behavioral',
    icon: '😤',
    name: 'Behavioral',
    participant: 'Sarah Williams',
    description: 'Verbal aggression incident with de-escalation response',
    severity: 'medium'
  },
  {
    type: 'environmental',
    icon: '🚰',
    name: 'Environmental',
    participant: 'James Brown',
    description: 'Water pipe burst causing accommodation disruption',
    severity: 'medium'
  },
  {
    type: 'medical_emergency',
    icon: '🚨',
    name: 'Medical Emergency',
    participant: 'Rachel Davis',
    description: 'Seizure incident with established medical protocols',
    severity: 'high'
  },
  {
    type: 'ai_stress_test',
    icon: '🧪',
    name: 'AI Stress Test',
    participant: 'Alex Thompson',
    description: 'Edge case scenarios for stress testing AI question generation system',
    severity: 'medium'
  },
] as const;

/**
 * Check if user has sample data permissions based on multiple criteria
 */
const hasSampleDataPermissions = (userRole?: string, userEmail?: string): boolean => {
  // Admin roles always have access
  if (userRole && ['system_admin', 'demo_admin'].includes(userRole)) {
    return true;
  }
  
  // Allow specific email addresses (from env var)
  const allowedEmails = process.env.NEXT_PUBLIC_SAMPLE_DATA_EMAILS?.split(',').map(e => e.trim()) || [];
  if (userEmail && allowedEmails.includes(userEmail)) {
    return true;
  }
  
  // Allow specific email domains (from env var)
  const allowedDomains = process.env.NEXT_PUBLIC_SAMPLE_DATA_DOMAINS?.split(',').map(d => d.trim()) || [];
  if (userEmail && allowedDomains.some(domain => userEmail.endsWith(`@${domain}`))) {
    return true;
  }
  
  // Allow team_lead and company_admin in development
  if (process.env.NODE_ENV === 'development' && userRole && ['team_lead', 'company_admin'].includes(userRole)) {
    return true;
  }
  
  return false;
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
  onFillNarrative?: (scenarioType?: string) => void;
  onFillQA?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNarrativeDropdownOpen, setIsNarrativeDropdownOpen] = useState(false);
  
  // Calculate button states (must be before conditional returns)
  const buttonStates = useMemo(() => 
    calculateButtonStates(currentStep, !!incidentId), 
    [currentStep, incidentId]
  );
  
  // Check permissions - return null if no access
  if (!user || !hasSampleDataPermissions(user.role, user.email)) {
    return null;
  }

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

  const handleFillNarrative = (scenarioType?: string) => {
    onFillNarrative?.(scenarioType);
    setIsNarrativeDropdownOpen(false); // Close dropdown after selection
  };

  const handleFillQA = () => {
    onFillQA?.();
  };

  // Severity color mapping
  const severityColors = {
    low: "text-green-600",
    medium: "text-yellow-600", 
    high: "text-red-600",
  } as const;

  return (
    <>
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

            {/* Fill Narrative Dropdown - Active on Step 2 */}
            <DropdownMenu open={isNarrativeDropdownOpen} onOpenChange={setIsNarrativeDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={buttonStates.fillNarrative ? buttonClassName : disabledButtonClassName}
                  disabled={!buttonStates.fillNarrative}
                >
                  <FileText className="h-3 w-3" />
                  Fill Narrative
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  Select Incident Scenario
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {NARRATIVE_SCENARIOS.map((scenario) => (
                  <DropdownMenuItem
                    key={scenario.type}
                    onClick={() => handleFillNarrative(scenario.type)}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    disabled={!buttonStates.fillNarrative}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-base">{scenario.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{scenario.name}</span>
                          <span className={cn("text-xs font-medium", severityColors[scenario.severity as keyof typeof severityColors])}>
                            {scenario.severity}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                          {scenario.participant} - {scenario.description}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  💡 Scenarios populate all narrative phases with realistic incident data
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
    
    {/* Prompt Testing Panel */}
    <PromptTestingPanel
      user={user}
      incidentId={incidentId || undefined}
      currentStep={currentStep}
      contextData={{
        currentStep,
        incidentId: incidentId || undefined,
      }}
    />
    </>
  );
}

export type { DeveloperToolsBarProps, ToolsBarButtonStates };