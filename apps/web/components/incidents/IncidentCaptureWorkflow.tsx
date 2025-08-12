'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { IncidentMetadataForm } from './IncidentMetadataForm';
import { NarrativeGrid } from './NarrativeGrid';
import { ClarificationStep } from './ClarificationStep';
import { WorkflowWizard, WizardStep } from '@/components/user/workflow-wizard';
import { Card, CardContent } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { ClarificationPhase } from '@/types/clarification';

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

  const handleNarrativeComplete = () => {
    console.log('🐛 Narrative collection completed');
    setCompletedSteps(prev => new Set(prev).add('narrative'));
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
    
    // Auto-advance logic for clarification steps
    if (['before_event', 'during_event', 'end_event', 'post_event'].includes(stepId)) {
      const stepIndex = wizardSteps.findIndex(step => step.id === stepId);
      if (stepIndex < wizardSteps.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
    }
  };

  // Handle workflow completion
  const handleWorkflowComplete = () => {
    console.log('🐛 Workflow completed, redirecting to incidents');
    router.push('/incidents');
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
      estimatedTime: 3,
    },
    {
      id: 'narrative',
      title: 'Narrative Collection', 
      description: 'Collect detailed narrative using the 2x2 grid approach',
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
      estimatedTime: 12,
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
          onNext={() => {}} // WorkflowWizard will handle navigation
          onPrevious={() => {}} // WorkflowWizard will handle navigation
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('before_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('before_event') || 'Please complete the before event questions',
      estimatedTime: 4,
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
          onNext={() => {}}
          onPrevious={() => {}}
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('during_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('during_event') || 'Please complete the during event questions',
      estimatedTime: 5,
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
          onNext={() => {}}
          onPrevious={() => {}}
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('end_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('end_event') || 'Please complete the end event questions',
      estimatedTime: 3,
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
          onNext={() => {}}
          onPrevious={() => {}}
          canProceed={true}
        />
      ) : null,
      isComplete: completedSteps.has('post_event'),
      canNavigateBack: true,
      validation: () => completedSteps.has('post_event') || 'Please complete the post-event questions',
      estimatedTime: 4,
      dependencies: ['end_event'],
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
          showEstimates={true}
          showHelp={true}
          allowNonLinear={false}
          autoSave={false}
        />

        {/* Debug info */}
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-50">
          Step: {currentStep + 1} | IncidentId: {incidentId || 'none'}
        </div>
      </div>
    </div>
  );
}