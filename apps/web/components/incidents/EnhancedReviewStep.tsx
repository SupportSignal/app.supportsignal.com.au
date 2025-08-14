"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { Badge } from '@starter/ui/badge';
import { Loader2, CheckCircle, AlertCircle, FileText, Send } from 'lucide-react';
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

export function EnhancedReviewStep({ 
  incident_id, 
  onComplete, 
  onPrevious 
}: EnhancedReviewStepProps) {
  const { user } = useAuth();
  const [isGeneratingEnhancement, setIsGeneratingEnhancement] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch enhanced narrative
  const enhancedNarrative = useQuery(
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

  // Mutations
  const generateEnhancement = useMutation(api.aiEnhancement.enhanceIncidentNarrative);
  const submitForAnalysis = useMutation(api.aiEnhancement.submitIncidentForAnalysis);

  // Auto-generate enhancement if not exists
  useEffect(() => {
    if (workflowValidation && !enhancedNarrative && !isGeneratingEnhancement) {
      handleGenerateEnhancement();
    }
  }, [workflowValidation, enhancedNarrative]);

  const handleGenerateEnhancement = async () => {
    if (!user?.sessionToken) {
      toast.error("Authentication required");
      return;
    }

    setIsGeneratingEnhancement(true);
    
    try {
      const result = await generateEnhancement({
        sessionToken: user.sessionToken,
        incident_id
      });

      if (result.success) {
        toast.success("Narrative enhancement completed");
      } else {
        toast.error(`Enhancement failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Enhancement generation failed:", error);
      toast.error("Failed to generate enhancement. Please try again.");
    } finally {
      setIsGeneratingEnhancement(false);
    }
  };

  const handleSubmitIncident = async () => {
    if (!user?.sessionToken || !enhancedNarrative) {
      toast.error("Cannot submit - missing authentication or enhancement");
      return;
    }

    // Validate completion before submitting
    if (!workflowValidation?.all_complete) {
      toast.error("Cannot submit - workflow not complete");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitForAnalysis({
        sessionToken: user.sessionToken,
        incident_id,
        enhanced_narrative_id: enhancedNarrative._id
      });

      if (result.success) {
        toast.success("Incident submitted for analysis workflow");
        onComplete({ 
          success: true, 
          handoff_id: result.handoff_id 
        });
      } else {
        toast.error("Failed to submit incident");
        onComplete({ success: false });
      }
    } catch (error) {
      console.error("Incident submission failed:", error);
      toast.error("Failed to submit incident. Please try again.");
      onComplete({ success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!workflowValidation || isGeneratingEnhancement) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">
          {isGeneratingEnhancement 
            ? "Generating AI-enhanced narrative..." 
            : "Loading workflow status..."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review & Submit</h2>
          <p className="text-muted-foreground">
            Review the AI-enhanced narrative and complete your incident report
          </p>
        </div>
        <Badge variant={workflowValidation.all_complete ? "default" : "secondary"}>
          {workflowValidation.all_complete ? "Ready to Submit" : "Incomplete"}
        </Badge>
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

      {/* Enhancement Status */}
      {!enhancedNarrative && !isGeneratingEnhancement && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AI narrative enhancement has not been generated yet.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={handleGenerateEnhancement}
            >
              Generate Enhancement
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Narrative Display */}
      {enhancedNarrative && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI-Enhanced Incident Narrative
            </CardTitle>
            <CardDescription>
              Combined and enhanced narrative based on your original content and clarification responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedNarrativeDisplay 
              enhancedNarrative={enhancedNarrative}
              incident_id={incident_id}
            />
          </CardContent>
        </Card>
      )}

      {/* Export Preview */}
      {enhancedNarrative && (
        <Card>
          <CardHeader>
            <CardTitle>Export Preview</CardTitle>
            <CardDescription>
              Preview how this incident will appear in the analysis workflow
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
                enhancedNarrative={enhancedNarrative}
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
          disabled={isSubmitting}
        >
          Previous Step
        </Button>

        <div className="flex items-center gap-2">
          {!workflowValidation.all_complete && (
            <Alert className="mr-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Complete all required steps before submitting
              </AlertDescription>
            </Alert>
          )}
          
          <Button
            onClick={handleSubmitIncident}
            disabled={!workflowValidation.all_complete || !enhancedNarrative || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit for Analysis
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}