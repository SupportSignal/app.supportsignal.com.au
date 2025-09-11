"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { Badge } from '@starter/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@starter/ui/collapsible';
import { Loader2, CheckCircle, AlertCircle, FileText, Send, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { EnhancedNarrativeDisplay } from './EnhancedNarrativeDisplay';
import { CompletionChecklist } from './CompletionChecklist';
import { ExportPreview } from './ExportPreview';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

interface EnhancedReviewStepProps {
  incident_id: Id<"incidents">;
  onComplete: (data: { success: boolean; handoff_id?: string }) => void;
  onPrevious: () => void;
}

type Phase = 'before_event' | 'during_event' | 'end_event' | 'post_event';

type PhaseStatus = 'pending' | 'generating' | 'enhanced' | 'error';

interface PhaseInfo {
  key: Phase;
  title: string;
  description: string;
  status: PhaseStatus;
}

export function EnhancedReviewStep({ 
  incident_id, 
  onComplete, 
  onPrevious 
}: EnhancedReviewStepProps) {
  const { user } = useAuth();
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<Phase>>(new Set(['before_event']));
  const [phaseStatuses, setPhaseStatuses] = useState<Record<Phase, PhaseStatus>>({
    before_event: 'pending',
    during_event: 'pending', 
    end_event: 'pending',
    post_event: 'pending'
  });

  // Define phase information
  const phases: PhaseInfo[] = [
    {
      key: 'before_event',
      title: 'Before Event',
      description: 'Context and circumstances leading up to the incident',
      status: phaseStatuses.before_event
    },
    {
      key: 'during_event', 
      title: 'During Event',
      description: 'What happened during the main incident period',
      status: phaseStatuses.during_event
    },
    {
      key: 'end_event',
      title: 'End Event', 
      description: 'How the incident concluded and immediate aftermath',
      status: phaseStatuses.end_event
    },
    {
      key: 'post_event',
      title: 'Post Event',
      description: 'Follow-up actions and support provided after the incident',
      status: phaseStatuses.post_event
    }
  ];

  // Fetch enhanced narratives for all phases
  const enhancedNarratives = useQuery(
    api.aiEnhancement.getEnhancedNarrative,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      incident_id 
    } : "skip"
  );

  // Fetch workflow completion validation
  const workflowValidation = useQuery(
    api.aiEnhancement.validateWorkflowCompletion,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      incident_id 
    } : "skip"
  );

  // Actions - DEPRECATED: enhanceIncidentNarrative function removed
  // const generateEnhancement = useAction(api.aiEnhancement.enhanceIncidentNarrative);

  // Auto-generate first phase enhancement
  useEffect(() => {
    if (workflowValidation && !enhancedNarratives && phaseStatuses.before_event === 'pending') {
      handleGeneratePhaseEnhancement('before_event');
    }
  }, [workflowValidation, enhancedNarratives]);

  const handleGeneratePhaseEnhancement = async (phase: Phase) => {
    if (!user?.sessionToken) {
      toast.error("Authentication required");
      return;
    }

    setPhaseStatuses(prev => ({ ...prev, [phase]: 'generating' }));
    
    try {
      // DEPRECATED: generateEnhancement function removed with enhanced_narratives table
      // This component is no longer used - workflow uses EnhancedReviewStepNew instead
      toast.error("This feature has been deprecated. Please use the new enhancement system.");
      setPhaseStatuses(prev => ({ ...prev, [phase]: 'error' }));
    } catch (error) {
      console.error("Enhancement generation failed:", error);
      setPhaseStatuses(prev => ({ ...prev, [phase]: 'error' }));
      toast.error("Failed to generate enhancement. Please try again.");
    }
  };

  const handleGenerateAllEnhancements = async () => {
    if (!user?.sessionToken) {
      toast.error("Authentication required");
      return;
    }

    for (const phase of phases) {
      if (phase.status === 'pending' || phase.status === 'error') {
        await handleGeneratePhaseEnhancement(phase.key);
      }
    }
  };

  const togglePhase = (phase: Phase) => {
    const newExpanded = new Set(expandedPhases);
    if (expandedPhases.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
      // Generate enhancement when expanding if not already done
      if (phaseStatuses[phase] === 'pending') {
        handleGeneratePhaseEnhancement(phase);
      }
    }
    setExpandedPhases(newExpanded);
  };

  const getStatusBadge = (status: PhaseStatus) => {
    switch (status) {
      case 'enhanced':
        return <Badge variant="default" className="bg-green-100 text-green-800">Enhanced ✓</Badge>;
      case 'generating':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Generating...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const allPhasesEnhanced = phases.every(phase => phase.status === 'enhanced');

  const handleContinueToReport = () => {
    if (!allPhasesEnhanced) {
      toast.error("Please enhance all phases before continuing");
      return;
    }

    toast.success("Enhanced review completed");
    onComplete({ success: true });
  };

  // Loading state
  if (!workflowValidation) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading workflow status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review & Submit - All Phase Enhancements</h2>
          <p className="text-muted-foreground">
            Enhance and review AI-generated narratives for each phase of your incident
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={allPhasesEnhanced ? "default" : "secondary"}>
            {allPhasesEnhanced ? "All Enhanced" : `${phases.filter(p => p.status === 'enhanced').length}/${phases.length} Enhanced`}
          </Badge>
        </div>
      </div>

      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Workflow Completion Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CompletionChecklist 
            validation={workflowValidation}
            incident_id={incident_id}
          />
        </CardContent>
      </Card>

      {/* Enhancement Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Phase Enhancement Progress
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAllEnhancements}
              disabled={allPhasesEnhanced}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Generate All
            </Button>
          </CardTitle>
          <CardDescription>
            Expand each phase to generate and review AI-enhanced narratives
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {phases.map((phase) => (
            <Collapsible 
              key={phase.key}
              open={expandedPhases.has(phase.key)}
              onOpenChange={() => togglePhase(phase.key)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedPhases.has(phase.key) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{phase.title} Enhancement</CardTitle>
                          <CardDescription>{phase.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(phase.status)}
                        {phase.status === 'generating' && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {phase.status === 'pending' && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Click to expand and generate AI enhancement for this phase.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {phase.status === 'generating' && (
                      <div className="flex items-center justify-center p-8 space-y-4">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Generating AI-enhanced narrative for {phase.title.toLowerCase()}...
                          </p>
                        </div>
                      </div>
                    )}

                    {phase.status === 'enhanced' && enhancedNarratives && (
                      <EnhancedNarrativeDisplay 
                        enhancedNarrative={enhancedNarratives}
                        incident_id={incident_id}
                        phase={phase.key}
                      />
                    )}

                    {phase.status === 'error' && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to generate enhancement for this phase.
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-2"
                            onClick={() => handleGeneratePhaseEnhancement(phase.key)}
                          >
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </CardContent>
      </Card>

      {/* Export Preview */}
      {allPhasesEnhanced && (
        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
            <CardDescription>
              Preview how this incident will appear in the final report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowExportPreview(!showExportPreview)}
              className="mb-4"
            >
              {showExportPreview ? "Hide" : "Show"} Export Preview
            </Button>
            
            {showExportPreview && (
              <ExportPreview 
                incident_id={incident_id}
                enhancedNarrative={enhancedNarratives}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          Previous Step
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleContinueToReport}
            disabled={!allPhasesEnhanced}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Continue to Complete Report
          </Button>
        </div>
      </div>
    </div>
  );
}