'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { IncidentMetadataForm } from './IncidentMetadataForm';
import { NarrativeGrid } from './NarrativeGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Main Incident Capture Workflow Component
 * Implements Story 3.1 requirements for Steps 1-2 of incident capture
 * 
 * Features:
 * - Step 1: Metadata collection (reporter, participant, date/time, location)
 * - Step 2: Multi-phase narrative collection (2x2 grid)
 * - Auto-save functionality
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
    setIncidentId(newIncidentId);
    setCurrentStep(2);
  };

  const handleNarrativeComplete = () => {
    // For now, just redirect to incidents list
    // In future stories, this will proceed to Steps 3-7
    router.push('/incidents');
  };

  const handleBackToMetadata = () => {
    setCurrentStep(1);
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

  // Define wizard steps for Story 3.1
  const steps = [
    {
      id: 1,
      title: 'Incident Details',
      description: 'Basic incident information',
      completed: !!incidentId,
      current: currentStep === 1,
    },
    {
      id: 2,
      title: 'Narrative Collection',
      description: 'Detailed incident description',
      completed: false, // Will be set based on narrative completion
      current: currentStep === 2,
    },
    // Steps 3-7 will be added in future stories
    {
      id: 3,
      title: 'AI Questions',
      description: 'Coming in next release',
      completed: false,
      current: false,
      disabled: true,
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
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mt-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-2 ${
                    step.current ? 'text-blue-600' : 
                    step.completed ? 'text-green-600' : 
                    step.disabled ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step.current ? 'bg-blue-100 text-blue-600' :
                      step.completed ? 'bg-green-100 text-green-600' :
                      step.disabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step.completed ? '✓' : step.id}
                    </div>
                    <div className="hidden md:block">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-300 mx-2 hidden md:block"></div>
                  )}
                </div>
              ))}
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

          {/* Step 2: Narrative Grid */}
          {currentStep === 2 && incidentId && (
            <NarrativeGrid
              incidentId={incidentId}
              onComplete={handleNarrativeComplete}
              onBack={handleBackToMetadata}
            />
          )}

          {/* Error State */}
          {currentStep === 2 && !incidentId && (
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