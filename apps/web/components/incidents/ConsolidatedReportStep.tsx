"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@starter/ui/tabs';
import { 
  FileText, 
  CheckCircle, 
  Eye, 
  Download, 
  Send,
  Calendar,
  MapPin,
  User,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { IncidentSummaryDisplay } from './IncidentSummaryDisplay';
import { CompletionChecklist } from './CompletionChecklist';
import { ExportPreview } from './ExportPreview';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

interface ConsolidatedReportStepProps {
  incident_id: Id<"incidents">;
  onComplete: (data: { success: boolean; handoff_id?: string }) => void;
  onPrevious: () => void;
}

export function ConsolidatedReportStep({ 
  incident_id, 
  onComplete, 
  onPrevious 
}: ConsolidatedReportStepProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("summary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch incident data
  const incident = useQuery(
    api.incidents.getById,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      id: incident_id 
    } : "skip"
  );

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

  // Debug logging for data fetching
  React.useEffect(() => {
    console.log('ConsolidatedReportStep - Data status:', {
      incident: !!incident,
      incident_id,
      userSessionToken: !!user?.sessionToken,
      enhancedNarrative: {
        loading: enhancedNarrative === undefined,
        exists: !!enhancedNarrative,
        data: enhancedNarrative
      },
      workflowValidation: {
        loading: workflowValidation === undefined,
        exists: !!workflowValidation,
        data: workflowValidation
      }
    });
  }, [incident, enhancedNarrative, workflowValidation, user?.sessionToken, incident_id]);

  // Mutations
  const submitForAnalysis = useMutation(api.aiEnhancement.submitIncidentForAnalysis);

  const handleSubmitForAnalysis = async () => {
    console.log('Submit for Analysis button clicked');
    console.log('User session token:', !!user?.sessionToken);
    console.log('Enhanced narrative:', {
      exists: !!enhancedNarrative,
      id: enhancedNarrative?._id,
      userEdited: enhancedNarrative?.user_edited,
      version: enhancedNarrative?.enhancement_version
    });
    console.log('Workflow validation:', workflowValidation);
    console.log('Incident handoff status:', incident?.handoff_status);

    if (!user?.sessionToken || !enhancedNarrative) {
      console.error('Submit failed: Missing authentication or enhancement');
      toast.error("Cannot submit - missing authentication or enhancement");
      return;
    }

    // Validate completion before submitting
    if (!workflowValidation?.all_complete) {
      console.error('Submit failed: Workflow not complete', {
        all_complete: workflowValidation?.all_complete,
        missingRequirements: workflowValidation?.missing_requirements
      });
      toast.error("Cannot submit - workflow not complete");
      return;
    }

    console.log('Starting submission process...');
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

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Loading state
  if (!incident || !workflowValidation) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-sm text-muted-foreground">Loading complete incident report...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Complete Incident Report</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of all captured information and workflow completion status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={workflowValidation.all_complete ? "default" : "secondary"}>
            {workflowValidation.all_complete ? "Complete" : "Incomplete"}
          </Badge>
          <Badge variant="outline">
            {incident.handoff_status || "draft"}
          </Badge>
        </div>
      </div>

      {/* Incident Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Incident Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Reporter:</span>
                <span>{incident.reporter_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Participant:</span>
                <span>{incident.participant_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date/Time:</span>
                <span>{incident.event_date_time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{incident.location}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span>{formatDistanceToNow(incident.created_at)} ago</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Status:</span>
                <Badge variant="outline" className="text-xs">
                  {incident.overall_status}
                </Badge>
              </div>
              {incident.workflow_completed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Completed:</span>
                  <span>{formatDateTime(incident.workflow_completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content Views */}
      <Tabs value={activeTab} onValueChange={(tab) => {
        console.log('Tab changed from', activeTab, 'to', tab);
        setActiveTab(tab);
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="completion" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completion
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Export Preview
          </TabsTrigger>
          <TabsTrigger value="handoff" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Handoff
          </TabsTrigger>
        </TabsList>

        {/* Incident Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Incident Information</CardTitle>
              <CardDescription>
                All captured narratives, clarifications, and enhancements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IncidentSummaryDisplay 
                incident_id={incident_id}
                incident={incident}
                enhancedNarrative={enhancedNarrative}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completion Checklist Tab */}
        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Completion Status</CardTitle>
              <CardDescription>
                Verification of all required workflow steps and data quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompletionChecklist 
                validation={workflowValidation}
                incident_id={incident_id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Workflow Preview</CardTitle>
              <CardDescription>
                How this incident will appear in the analysis workflow system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enhancedNarrative ? (
                <ExportPreview 
                  incident_id={incident_id}
                  enhancedNarrative={enhancedNarrative}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Enhanced narrative not available for preview
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Handoff Information Tab */}
        <TabsContent value="handoff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Workflow Handoff</CardTitle>
              <CardDescription>
                Information about transitioning this incident to the analysis workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowValidation.all_complete ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="h-5 w-5" />
                      <h4 className="font-medium">Ready for Analysis Workflow</h4>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                      All required information has been captured and validated. This incident is ready to be 
                      handed off to the analysis workflow where team leaders will conduct detailed analysis.
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                      <FileText className="h-5 w-5" />
                      <h4 className="font-medium">Workflow Incomplete</h4>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                      Some required steps are missing. Please complete all workflow requirements before 
                      submitting for analysis.
                    </p>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Missing:</p>
                      <ul className="text-sm text-orange-700 dark:text-orange-300 list-disc list-inside mt-1">
                        {workflowValidation.missing_requirements.map((req: string, index: number) => (
                          <li key={index}>{req.replace('_', ' ')}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {incident.handoff_status === "ready_for_analysis" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Send className="h-5 w-5" />
                      <h4 className="font-medium">Submitted for Analysis</h4>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                      This incident has been submitted and is waiting for team leader review in the analysis workflow.
                    </p>
                    {incident.submitted_at && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Submitted: {formatDateTime(incident.submitted_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          Previous: Enhanced Review
        </Button>

        <div className="flex items-center gap-2">
          {incident.handoff_status !== "ready_for_analysis" && (
            <Button
              variant="outline"
              onClick={() => {
                console.log('Review Completion button clicked, switching to completion tab');
                console.log('Current active tab:', activeTab);
                console.log('Workflow validation status:', workflowValidation);
                setActiveTab("completion");
              }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Review Completion
            </Button>
          )}
          
          <Button
            onClick={handleSubmitForAnalysis}
            disabled={!workflowValidation.all_complete || !enhancedNarrative || isSubmitting || incident.handoff_status === "ready_for_analysis"}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : incident.handoff_status === "ready_for_analysis" ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Already Submitted
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