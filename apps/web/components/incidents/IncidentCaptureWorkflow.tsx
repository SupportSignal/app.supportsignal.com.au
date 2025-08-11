'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { IncidentMetadataForm } from './IncidentMetadataForm';
import { NarrativeGrid } from './NarrativeGrid';
import { ClarificationStep } from './ClarificationStep';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { ClarificationPhase } from '@/types/clarification';
import { cn } from '@/lib/utils';

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
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleMetadataComplete = (newIncidentId: Id<"incidents">) => {
    console.log('🐛 Metadata complete, setting incident ID:', newIncidentId);
    setIncidentId(newIncidentId);
    setCurrentStep(2);
  };

  const handleNarrativeComplete = () => {
    // Proceed to clarification questions (Step 3)
    setCurrentStep(3);
  };

  const handleBackToMetadata = () => {
    console.log('🐛 Going back to metadata with incident ID:', incidentId);
    setCurrentStep(1);
  };

  const handleBackToNarrative = () => {
    setCurrentStep(2);
  };

  const handleClarificationNext = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      // All clarification steps completed, redirect to incidents list
      // In future stories (3.3), this will go to Step 7 (review)
      router.push('/incidents');
    }
  };

  const handleClarificationPrevious = () => {
    if (currentStep > 3) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentStep(2); // Back to narrative
    }
  };

  // Get clarification phase for current step
  const getCurrentClarificationPhase = (): ClarificationPhase => {
    switch (currentStep) {
      case 3: return "before_event";
      case 4: return "during_event";
      case 5: return "end_event";
      case 6: return "post_event";
      default: return "before_event";
    }
  };

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

  // Define wizard steps for Stories 3.1 & 3.2
  const steps = [
    {
      id: 1,
      title: 'Incident Details',
      description: '',
      completed: !!incidentId,
      current: currentStep === 1,
    },
    {
      id: 2,
      title: 'Narrative Collection',
      description: '',
      completed: currentStep > 2,
      current: currentStep === 2,
    },
    {
      id: 3,
      title: 'Before Event',
      description: '',
      completed: currentStep > 3,
      current: currentStep === 3,
      disabled: currentStep < 3,
    },
    {
      id: 4,
      title: 'During Event',
      description: '',
      completed: currentStep > 4,
      current: currentStep === 4,
      disabled: currentStep < 4,
    },
    {
      id: 5,
      title: 'End Event',
      description: '',
      completed: currentStep > 5,
      current: currentStep === 5,
      disabled: currentStep < 5,
    },
    {
      id: 6,
      title: 'Post-Event',
      description: '',
      completed: currentStep > 6,
      current: currentStep === 6,
      disabled: currentStep < 6,
    },
  ];

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

        {/* Workflow Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              🚨 Incident Capture Workflow
            </CardTitle>
            <p className="text-gray-600">
              Report a new incident with detailed documentation
            </p>
            
            {/* Chevron-Style Progress Steps */}
            <div className="flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-lg overflow-hidden mt-6">
              {steps.map((step, index) => {
                const isLast = index === steps.length - 1;
                const stepNumber = String(step.id).padStart(2, '0');
                
                return (
                  <div key={step.id} className="flex items-center flex-1 relative">
                    {/* Step Container */}
                    <div className={cn(
                      'flex items-center justify-center px-4 py-3 min-h-[60px] relative flex-1 group transition-all duration-200',
                      {
                        'bg-emerald-500 text-white': step.completed,
                        'bg-blue-500 text-white': step.current,
                        'bg-gray-100 text-gray-600': !step.completed && !step.current,
                      }
                    )}>
                      {/* Step Content */}
                      <div className="flex items-center justify-center space-x-3 relative z-10">
                        {/* Step Number/Icon */}
                        <div className={cn(
                          'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                          {
                            'bg-white bg-opacity-20': step.completed || step.current,
                            'bg-gray-300': !step.completed && !step.current
                          }
                        )}>
                          {step.completed ? '✓' : stepNumber}
                        </div>
                        
                        {/* Step Title */}
                        <span className="font-medium text-sm whitespace-nowrap">
                          {step.title}
                        </span>
                      </div>
                      
                      {/* Chevron Arrow (except for last step) */}
                      {!isLast && (
                        <div className="absolute right-0 top-0 h-full w-0 z-20">
                          <div className={cn(
                            'absolute right-0 top-0 h-full w-4 transform translate-x-2',
                            'border-l-[30px] border-t-[30px] border-b-[30px]',
                            'border-t-transparent border-b-transparent',
                            {
                              'border-l-emerald-500': step.completed,
                              'border-l-blue-500': step.current,
                              'border-l-gray-100': !step.completed && !step.current
                            }
                          )} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardHeader>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Metadata Form */}
          {currentStep === 1 && (
            <IncidentMetadataForm
              user={user as any} // Type assertion for now
              onComplete={handleMetadataComplete}
              existingIncidentId={incidentId}
            />
          )}
          
          {/* Debug info */}
          <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded opacity-50">
            Step: {currentStep} | IncidentId: {incidentId || 'none'}
          </div>

          {/* Step 2: Narrative Grid */}
          {currentStep === 2 && incidentId && (
            <NarrativeGrid
              incidentId={incidentId}
              onComplete={handleNarrativeComplete}
              onBack={handleBackToMetadata}
            />
          )}

          {/* Steps 3-6: Clarification Questions */}
          {(currentStep >= 3 && currentStep <= 6) && incidentId && (
            <ClarificationStep
              incident_id={incidentId}
              phase={getCurrentClarificationPhase()}
              onNext={handleClarificationNext}
              onPrevious={handleClarificationPrevious}
              canProceed={true}
            />
          )}

          {/* Error State - Missing Incident */}
          {(currentStep === 2 || (currentStep >= 3 && currentStep <= 6)) && !incidentId && (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Missing Incident Data
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please complete the incident details first.
                </p>
                <Button onClick={handleBackToMetadata}>
                  Back to Incident Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}