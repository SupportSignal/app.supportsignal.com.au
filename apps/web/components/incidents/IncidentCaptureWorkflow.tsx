'use client';

import React, { useState, useMemo } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { IncidentMetadataForm } from './IncidentMetadataForm';
import { NarrativeGrid } from './NarrativeGrid';
import { ClarificationStep } from './ClarificationStep';
import { EnhancedReviewStepNew } from './EnhancedReviewStepNew';
import { ConsolidatedReportStep } from './ConsolidatedReportStep';
import { WorkflowWizard, WizardStep } from '@/components/user/workflow-wizard';
import { Card, CardContent } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { ClarificationPhase } from '@/types/clarification';
import { DeveloperToolsBar } from './DeveloperToolsBar';
import { WorkflowImportResult } from '@/types/workflowData';

/**
 * Main Incident Capture Workflow Component
 * Implements Story 3.1 & 3.2 requirements for complete incident capture workflow
 * 
 * Features:
 * - Step 1: Metadata collection (reporter, participant, date/time, location)
 * - Step 2: Multi-phase narrative collection (2x2 grid)  
 * - Step 3: Before Event clarification questions
 * - Step 4: During Event clarification questions
 * - Step 5: End Event clarification questions
 * - Step 6: Post-Event Support clarification questions
 * - Step 7: Enhanced Review - AI narrative enhancement and quality review
 * - Step 8: Consolidated Report - Complete incident overview and workflow submission
 * - Auto-save functionality throughout
 * - AI-powered question generation
 * - Real-time validation
 * - Responsive design
 */
export function IncidentCaptureWorkflow() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0); // 0-based indexing for WorkflowWizard
  const [incidentId, setIncidentId] = useState<Id<"incidents"> | null>(null);
  
  // Convex action for batch question generation
  const generateAllQuestions = useAction(api.aiClarification.generateAllClarificationQuestions);

  // Check authentication and authorization
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login');
    } else if (user && !['system_admin', 'company_admin', 'team_lead', 'frontline_worker'].includes(user.role)) {
      // All authenticated users can create incidents
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Track step completion states
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Incident-specific business logic handlers
  const handleMetadataComplete = (newIncidentId: Id<"incidents">) => {
    console.log('🐛 Metadata complete, setting incident ID:', newIncidentId);
    setIncidentId(newIncidentId);
    setCompletedSteps(prev => new Set(prev).add('metadata'));
    // Auto-advance to next step
    setCurrentStep(1);
  };

  const handleNarrativeComplete = async (narrativeData: {
    before_event: string;
    during_event: string;
    end_event: string;
    post_event: string;
  }) => {
    console.log('🐛 Narrative collection completed');
    setCompletedSteps(prev => new Set(prev).add('narrative'));

    // 🚀 Proactive Question Generation (Story 3.2.5)
    if (user?.sessionToken && incidentId) {
      console.log('🤖 Starting proactive question generation for all phases...');
      try {
        const result = await generateAllQuestions({
          sessionToken: user.sessionToken,
          incident_id: incidentId,
          narrative: narrativeData,
        });

        console.log('✅ Proactive question generation completed:', {
          success: result.success,
          total_questions: result.total_questions_generated,
          successful_phases: result.successful_phases,
          failed_phases: result.failed_phases,
        });

        if (result.success) {
          console.log('🎯 Questions will appear automatically as user navigates to Steps 3-6');
        } else {
          console.warn('⚠️ Some or all question generation failed - manual fallback will be available');
        }
      } catch (error) {
        console.error('❌ Proactive question generation failed:', error);
        console.log('🔧 Manual generation buttons will be available as fallback');
      }
    }

    // Auto-advance to next step
    setCurrentStep(2);
  };

  // Get clarification phase for step index
  const getClarificationPhase = (stepIndex: number): ClarificationPhase => {
    switch (stepIndex) {
      case 2: return "before_event";  // Step 3 in 1-based indexing
      case 3: return "during_event";  // Step 4 in 1-based indexing  
      case 4: return "end_event";     // Step 5 in 1-based indexing
      case 5: return "post_event";    // Step 6 in 1-based indexing
      default: return "before_event";
    }
  };

  // Handle step completion for WorkflowWizard
  const handleStepComplete = (stepId: string) => {
    console.log('🐛 Step completed:', stepId);
    setCompletedSteps(prev => new Set(prev).add(stepId));
    
    // Auto-advance logic for clarification and review steps
    if (['before_event', 'during_event', 'end_event', 'post_event'].includes(stepId)) {
      const stepIndex = wizardSteps.findIndex(step => step.id === stepId);
      if (stepIndex < wizardSteps.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
    }
  };

  // Handle enhanced review completion (Step 7)
  const handleEnhancedReviewComplete = (data: { success: boolean; handoff_id?: string }) => {
    console.log('🐛 Enhanced review completed:', data);
    if (data.success) {
      setCompletedSteps(prev => new Set(prev).add('enhanced_review'));
      // Advance to consolidated report step
      setCurrentStep(7); // Step 8 (0-based indexing)
    }
  };

  // Handle consolidated report completion (Step 8)
  const handleConsolidatedReportComplete = (data: { success: boolean; handoff_id?: string }) => {
    console.log('🐛 Consolidated report completed:', data);
    if (data.success) {
      setCompletedSteps(prev => new Set(prev).add('consolidated_report'));
      // Complete workflow and redirect
      handleWorkflowComplete();
    }
  };

  // Handle workflow completion
  const handleWorkflowComplete = () => {
    console.log('🐛 Workflow completed, redirecting to dashboard');
    router.push('/dashboard');
  };

  // Developer Tools Bar handlers
  const handleExportComplete = (filename: string) => {
    console.log('🚀 Workflow exported successfully:', filename);
  };

  const handleImportComplete = (result: WorkflowImportResult) => {
    console.log('🚀 Workflow imported successfully:', result);
    if (result.success && result.incident_id) {
      setIncidentId(result.incident_id);
      // Update completed steps based on import
      const importedSteps = new Set<string>();
      if (result.created_step >= 1) importedSteps.add('metadata');
      if (result.created_step >= 2) importedSteps.add('narrative');
      if (result.created_step >= 3) importedSteps.add('before_event');
      if (result.created_step >= 4) importedSteps.add('during_event');
      if (result.created_step >= 5) importedSteps.add('end_event');
      if (result.created_step >= 6) importedSteps.add('post_event');
      if (result.created_step >= 7) importedSteps.add('enhanced_review');
      if (result.created_step >= 8) importedSteps.add('consolidated_report');
      setCompletedSteps(importedSteps);
    }
  };

  const handleStepNavigate = (step: number) => {
    // Convert 1-based step to 0-based index
    setCurrentStep(step - 1);
  };

  // Convex action for Q&A sample data  
  const generateMockAnswers = useAction(api.aiClarification.generateMockAnswers);

  // Sample data handlers for Developer Tools Bar
  const handleFillForm = () => {
    // Navigate to step 1 if not already there
    if (currentStep !== 0) {
      setCurrentStep(0);
    }
    // The form component will handle its own sample data generation via existing functionality
    // We trigger it by dispatching a custom event that the form can listen to
    window.dispatchEvent(new CustomEvent('triggerSampleData', { detail: { type: 'form' } }));
  };

  const handleFillNarrative = () => {
    // Navigate to step 2 if not already there
    if (currentStep !== 1) {
      setCurrentStep(1);
    }
    // Use the same approach as the form - dispatch an event for the narrative component to handle
    window.dispatchEvent(new CustomEvent('triggerSampleData', { detail: { type: 'narrative' } }));
  };

  const handleFillQA = async () => {
    if (!user?.sessionToken || !incidentId) {
      console.warn('Cannot fill Q&A: missing session token or incident ID');
      return;
    }

    // Navigate to current Q&A step (3-6) or first Q&A step if not in range
    if (currentStep < 2 || currentStep > 5) {
      setCurrentStep(2); // Go to first Q&A step (before_event)
    }

    try {
      const currentPhase = getCurrentPhase();
      const result = await generateMockAnswers({
        sessionToken: user.sessionToken,
        incident_id: incidentId,
        phase: currentPhase
      });

      if (result.success) {
        console.log('✅ Mock answers generated for phase:', currentPhase, result);
        // The Q&A component will automatically refresh via useQuery
      } else {
        console.error('❌ Failed to generate mock answers:', result);
      }
    } catch (error) {
      console.error('❌ Error generating mock answers:', error);
    }
  };

  // Helper to get current phase for Q&A
  const getCurrentPhase = (): ClarificationPhase => {
    switch (currentStep) {
      case 2: return 'before_event';
      case 3: return 'during_event';
      case 4: return 'end_event';
      case 5: return 'post_event';
      default: return 'before_event';
    }
  };

  // Transform incident state into generic wizard steps (created fresh each render)
  const wizardSteps: WizardStep[] = [
    {
      id: 'metadata',
      title: 'Incident Details',
      description: 'Capture basic incident information including reporter, participants, and location',
      component: user ? (
        <IncidentMetadataForm
          user={user as any}
          onComplete={handleMetadataComplete}
          existingIncidentId={incidentId}
        />
      ) : null,
      isComplete: completedSteps.has('metadata'),
      canNavigateBack: false,
      validation: () => completedSteps.has('metadata') || 'Please complete the incident details first',
    },
    {
      id: 'narrative',
      title: 'Narrative Collection', 
      description: 'Document what happened before, during, at the end, and after the incident',
      component: incidentId ? (
        <NarrativeGrid
          incidentId={incidentId}
          onComplete={handleNarrativeComplete}
          onBack={() => setCurrentStep(0)}
        />
      ) : null,
      isComplete: completedSteps.has('narrative'),
      canNavigateBack: true,
      validation: () => completedSteps.has('narrative') || 'Please complete the narrative collection',
      dependencies: ['metadata'],
    },
    {
      id: 'before_event',
      title: 'Before Event',
      description: 'AI-generated clarification questions about events before the incident',
      component: incidentId ? (
        <ClarificationStep
          incident_id={incidentId}
          phase="before_event"
          onNext={() => handleStepComplete('before_event')}
          onPrevious={() => setCurrentStep(1)} // Go back to narrative step
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('before_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('before_event') || 'Please complete the before event questions',
      dependencies: ['narrative'],
    },
    {
      id: 'during_event',
      title: 'During Event',
      description: 'AI-generated clarification questions about the incident itself',
      component: incidentId ? (
        <ClarificationStep
          incident_id={incidentId}
          phase="during_event"
          onNext={() => handleStepComplete('during_event')}
          onPrevious={() => setCurrentStep(2)} // Go back to before_event step
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('during_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('during_event') || 'Please complete the during event questions',
      dependencies: ['before_event'],
    },
    {
      id: 'end_event',
      title: 'End Event',
      description: 'AI-generated clarification questions about how the incident concluded',
      component: incidentId ? (
        <ClarificationStep
          incident_id={incidentId}
          phase="end_event"
          onNext={() => handleStepComplete('end_event')}
          onPrevious={() => setCurrentStep(3)} // Go back to during_event step
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('end_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('end_event') || 'Please complete the end event questions',
      dependencies: ['during_event'],
    },
    {
      id: 'post_event',
      title: 'Post-Event',
      description: 'AI-generated clarification questions about support and follow-up actions',
      component: incidentId ? (
        <ClarificationStep
          incident_id={incidentId}
          phase="post_event"
          onNext={() => handleStepComplete('post_event')}
          onPrevious={() => setCurrentStep(4)} // Go back to end_event step
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('post_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('post_event') || 'Please complete the post-event questions',
      dependencies: ['end_event'],
    },
    {
      id: 'enhanced_review',
      title: 'Enhanced Review',
      description: 'AI-enhanced narrative review and quality assessment',
      component: incidentId ? (
        <EnhancedReviewStepNew
          incident_id={incidentId}
          onComplete={handleEnhancedReviewComplete}
          onPrevious={() => setCurrentStep(5)} // Go back to post_event step
        />
      ) : null,
      isComplete: completedSteps.has('enhanced_review'),
      canNavigateBack: true,
      validation: () => completedSteps.has('enhanced_review') || 'Please complete the enhanced review',
      dependencies: ['post_event'],
    },
    {
      id: 'consolidated_report',
      title: 'Complete Report',
      description: 'Comprehensive incident overview and final submission for analysis workflow',
      component: incidentId ? (
        <ConsolidatedReportStep
          incident_id={incidentId}
          onComplete={handleConsolidatedReportComplete}
          onPrevious={() => setCurrentStep(6)} // Go back to enhanced_review step
        />
      ) : null,
      isComplete: completedSteps.has('consolidated_report'),
      canNavigateBack: true,
      validation: () => completedSteps.has('consolidated_report') || 'Please review and submit the complete incident report',
      dependencies: ['enhanced_review'],
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <span className="mr-1">←</span>
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm text-gray-900 dark:text-white">New Incident Report</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.name}
            </span>
          </div>
        </div>

        {/* Generic WorkflowWizard Implementation */}
        <WorkflowWizard
          title="🚨 Incident Capture Workflow"
          description="Report a new incident with detailed documentation"
          steps={wizardSteps}
          currentStepIndex={currentStep}
          onStepChange={setCurrentStep}
          onComplete={handleWorkflowComplete}
          onStepComplete={handleStepComplete}
          showProgress={true}
          showEstimates={false}
          showHelp={true}
          allowNonLinear={false}
          autoSave={false}
        />

        {/* Developer Tools Bar - Only visible to authorized users */}
        <DeveloperToolsBar
          user={user}
          currentStep={currentStep + 1} // Convert to 1-based for display
          incidentId={incidentId}
          onExportComplete={handleExportComplete}
          onImportComplete={handleImportComplete}
          onStepNavigate={handleStepNavigate}
          onFillForm={handleFillForm}
          onFillNarrative={handleFillNarrative}
          onFillQA={handleFillQA}
        />

        {/* Debug info */}
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-50">
          Step: {currentStep + 1} | IncidentId: {incidentId || 'none'}
        </div>
      </div>
    </div>
  );
}