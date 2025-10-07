// @ts-nocheck
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
import { IncidentSummaryDisplay } from './incident-summary-display';
import { CompletionChecklist } from './completion-checklist';
import { ExportPreview } from './export-preview';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useViewport } from '@/hooks/mobile/useViewport';
import { cn } from '@/lib/utils';
import type { Id } from '@/convex/_generated/dataModel';

interface ConsolidatedReportStepProps {
  incident_id: Id<"incidents">;
  onComplete: (data: { success: boolean; handoff_id?: string }) => void;
  onPrevious: () => void;
  onNavigateToStep?: (step: number) => void;
}

export function ConsolidatedReportStep({ 
  incident_id, 
  onComplete, 
  onPrevious,
  onNavigateToStep
}: ConsolidatedReportStepProps) {
  const { user } = useAuth();
  const viewport = useViewport();
  const [activeTab, setActiveTab] = useState("summary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch incident data
  // @ts-ignore - Temporary TypeScript issue with deep type instantiation
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

  // Mutations
  const submitForAnalysis = useMutation(api.aiEnhancement.submitIncidentForAnalysis);
  const autoCompleteWorkflow = useMutation(api.incidents.autoCompleteWorkflow); // Story 3.4

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

  // Story 3.4: Auto-complete workflow when conditions are met
  React.useEffect(() => {
    const shouldAutoComplete = 
      incident && 
      workflowValidation?.all_complete && 
      enhancedNarrative &&
      incident.overall_status === "analysis_pending" &&
      user?.sessionToken &&
      !isSubmitting;

    if (shouldAutoComplete) {
      console.log('🚀 AUTO-COMPLETING WORKFLOW', {
        incident_id,
        workflowComplete: workflowValidation.all_complete,
        hasEnhancedNarrative: !!enhancedNarrative,
        currentStatus: incident.overall_status,
        timestamp: new Date().toISOString()
      });

      // Trigger auto-completion
      autoCompleteWorkflow({
        sessionToken: user.sessionToken!,
        incident_id,
        correlation_id: `auto-complete-step8-${incident_id}-${Date.now()}`
      }).then((result) => {
        console.log('✅ WORKFLOW AUTO-COMPLETED SUCCESS', result);
        
        // Don't call onComplete here - let the user manually submit if they want
        // The auto-completion just changes the status, but doesn't end the workflow UI
      }).catch((error) => {
        console.error('❌ AUTO-COMPLETION FAILED', error);
        // Don't show error to user - this is a background operation
      });
    }
  }, [incident, workflowValidation, enhancedNarrative, user?.sessionToken, isSubmitting, incident_id, autoCompleteWorkflow]);

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
      // Prepare args for submission - enhanced_narrative_id is optional
      const submissionArgs: any = {
        sessionToken: user.sessionToken,
        incident_id,
      };
      
      // enhanced_narrative_id parameter removed - now using *_extra fields validation
      
      const result = await submitForAnalysis(submissionArgs);

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
    <div className={cn(
      "space-y-6",
      viewport.isMobile ? "px-4" : ""
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center",
        viewport.isMobile ? "flex-col space-y-4" : "justify-between"
      )}>
        <div className={cn(
          viewport.isMobile ? "text-center" : ""
        )}>
          <h2 className={cn(
            "font-bold",
            viewport.isMobile ? "text-xl" : "text-2xl"
          )}>Complete Incident Report</h2>
          <p className={cn(
            "text-muted-foreground",
            viewport.isMobile ? "text-sm" : ""
          )}>
            Comprehensive overview of all captured information and workflow completion status
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          viewport.isMobile ? "w-full justify-center" : ""
        )}>
          <Badge variant={workflowValidation.all_complete ? "default" : "secondary"}>
            {workflowValidation.all_complete ? "Complete" : "Incomplete"}
          </Badge>
          <Badge variant="outline">
            {incident.handoff_status || "draft"}
          </Badge>
        </div>
      </div>

      {/* Incident Overview Card */}
      <Card className={cn(
        viewport.isMobile ? "border-0 shadow-sm" : ""
      )}>
        <CardHeader className={cn(
          viewport.isMobile ? "pb-3 px-3" : ""
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            viewport.isMobile ? "text-base justify-center" : ""
          )}>
            <FileText className="h-5 w-5" />
            Incident Overview
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <div className={cn(
            "gap-4",
            viewport.isMobile ? "grid grid-cols-1 space-y-3" : "grid grid-cols-1 md:grid-cols-2"
          )}>
            <div className={cn(
              viewport.isMobile ? "space-y-2" : "space-y-3"
            )}>
              <div className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "text-sm justify-between" : "text-sm"
              )}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Reporter:</span>
                </div>
                <span className={cn(
                  viewport.isMobile ? "text-right" : ""
                )}>{incident.reporter_name}</span>
              </div>
              <div className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "text-sm justify-between" : "text-sm"
              )}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Participant:</span>
                </div>
                <span className={cn(
                  viewport.isMobile ? "text-right" : ""
                )}>{incident.participant_name}</span>
              </div>
              <div className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "text-sm justify-between" : "text-sm"
              )}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date/Time:</span>
                </div>
                <span className={cn(
                  viewport.isMobile ? "text-right text-xs" : ""
                )}>{incident.event_date_time}</span>
              </div>
              <div className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "text-sm justify-between" : "text-sm"
              )}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                </div>
                <span className={cn(
                  viewport.isMobile ? "text-right" : ""
                )}>{incident.location}</span>
              </div>
            </div>
            <div className={cn(
              viewport.isMobile ? "space-y-2" : "space-y-3"
            )}>
              <div className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "text-sm justify-between" : "text-sm"
              )}>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                </div>
                <span className={cn(
                  viewport.isMobile ? "text-right" : ""
                )}>{formatDistanceToNow(incident.created_at)} ago</span>
              </div>
              <div className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "text-sm justify-between" : "text-sm"
              )}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Status:</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {incident.overall_status}
                </Badge>
              </div>
              {incident.workflow_completed_at && (
                <div className={cn(
                  "flex items-center gap-2",
                  viewport.isMobile ? "text-sm justify-between" : "text-sm"
                )}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Completed:</span>
                  </div>
                  <span className={cn(
                    viewport.isMobile ? "text-right text-xs" : ""
                  )}>{formatDateTime(incident.workflow_completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content Views */}
      <Tabs value={activeTab} onValueChange={(tab) => {
        console.log('🔄 Tab changed from', activeTab, 'to', tab);
        if (tab === 'preview') {
          console.log('🎯 NAVIGATED TO EXPORT PREVIEW TAB - ExportPreview component will now render');
        }
        setActiveTab(tab);
      }} className="w-full">
        <TabsList className={cn(
          "grid w-full",
          viewport.isMobile ? "grid-cols-2 h-auto" : "grid-cols-4"
        )}>
          <TabsTrigger 
            value="summary" 
            className={cn(
              "flex items-center gap-2",
              viewport.isMobile ? "h-12 text-xs flex-col gap-1" : ""
            )}
          >
            <FileText className="h-4 w-4" />
            <span className={cn(viewport.isMobile ? "hidden" : "")}>Summary</span>
            {viewport.isMobile && <span>Summary</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="completion" 
            className={cn(
              "flex items-center gap-2",
              viewport.isMobile ? "h-12 text-xs flex-col gap-1" : ""
            )}
          >
            <CheckCircle className="h-4 w-4" />
            <span className={cn(viewport.isMobile ? "hidden" : "")}>Completion</span>
            {viewport.isMobile && <span>Complete</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="preview" 
            className={cn(
              "flex items-center gap-2",
              viewport.isMobile ? "h-12 text-xs flex-col gap-1" : ""
            )}
          >
            <Eye className="h-4 w-4" />
            <span className={cn(viewport.isMobile ? "hidden" : "")}>Export Preview</span>
            {viewport.isMobile && <span>Preview</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="handoff" 
            className={cn(
              "flex items-center gap-2",
              viewport.isMobile ? "h-12 text-xs flex-col gap-1" : ""
            )}
          >
            <Send className="h-4 w-4" />
            <span className={cn(viewport.isMobile ? "hidden" : "")}>Handoff</span>
            {viewport.isMobile && <span>Handoff</span>}
          </TabsTrigger>
        </TabsList>

        {/* Incident Summary Tab */}
        <TabsContent value="summary" className={cn(
          viewport.isMobile ? "space-y-3" : "space-y-4"
        )}>
          <Card className={cn(
            viewport.isMobile ? "border-0 shadow-sm" : ""
          )}>
            <CardHeader className={cn(
              viewport.isMobile ? "pb-3 px-3" : ""
            )}>
              <CardTitle className={cn(
                viewport.isMobile ? "text-base text-center" : ""
              )}>Complete Incident Information</CardTitle>
              <CardDescription className={cn(
                viewport.isMobile ? "text-xs text-center" : ""
              )}>
                All captured narratives, clarifications, and enhancements
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(
              viewport.isMobile ? "px-3 pb-3" : ""
            )}>
              <IncidentSummaryDisplay 
                incident_id={incident_id}
                incident={incident}
                enhancedNarrative={enhancedNarrative}
                onNavigateToStep={onNavigateToStep}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completion Checklist Tab */}
        <TabsContent value="completion" className={cn(
          viewport.isMobile ? "space-y-3" : "space-y-4"
        )}>
          <Card className={cn(
            viewport.isMobile ? "border-0 shadow-sm" : ""
          )}>
            <CardHeader className={cn(
              viewport.isMobile ? "pb-3 px-3" : ""
            )}>
              <CardTitle className={cn(
                viewport.isMobile ? "text-base text-center" : ""
              )}>Workflow Completion Status</CardTitle>
              <CardDescription className={cn(
                viewport.isMobile ? "text-xs text-center" : ""
              )}>
                Verification of all required workflow steps and data quality
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(
              viewport.isMobile ? "px-3 pb-3" : ""
            )}>
              <CompletionChecklist 
                validation={workflowValidation}
                incident_id={incident_id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Preview Tab */}
        <TabsContent value="preview" className={cn(
          viewport.isMobile ? "space-y-3" : "space-y-4"
        )}>
          <Card className={cn(
            viewport.isMobile ? "border-0 shadow-sm" : ""
          )}>
            <CardHeader className={cn(
              viewport.isMobile ? "pb-3 px-3" : ""
            )}>
              <CardTitle className={cn(
                viewport.isMobile ? "text-base text-center" : ""
              )}>Analysis Workflow Preview</CardTitle>
              <CardDescription className={cn(
                viewport.isMobile ? "text-xs text-center" : ""
              )}>
                How this incident will appear in the analysis workflow system
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(
              viewport.isMobile ? "px-3 pb-3" : ""
            )}>
              {(() => {
                console.log('🔍 Export Preview Tab - Enhanced Narrative Check:', {
                  enhancedNarrativeExists: !!enhancedNarrative,
                  enhancedNarrativeType: typeof enhancedNarrative,
                  enhancedNarrativeKeys: enhancedNarrative ? Object.keys(enhancedNarrative) : 'N/A',
                  enhancedNarrativeId: enhancedNarrative?._id,
                  enhancedNarrativeContent: enhancedNarrative?.enhanced_content ? 'Present' : 'Missing'
                });
                
                return enhancedNarrative ? (
                  <ExportPreview 
                    incident_id={incident_id}
                    enhancedNarrative={enhancedNarrative as any}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Enhanced narrative not available for preview
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Handoff Information Tab */}
        <TabsContent value="handoff" className={cn(
          viewport.isMobile ? "space-y-3" : "space-y-4"
        )}>
          <Card className={cn(
            viewport.isMobile ? "border-0 shadow-sm" : ""
          )}>
            <CardHeader className={cn(
              viewport.isMobile ? "pb-3 px-3" : ""
            )}>
              <CardTitle className={cn(
                viewport.isMobile ? "text-base text-center" : ""
              )}>Analysis Workflow Handoff</CardTitle>
              <CardDescription className={cn(
                viewport.isMobile ? "text-xs text-center" : ""
              )}>
                Information about transitioning this incident to the analysis workflow
              </CardDescription>
            </CardHeader>
            <CardContent className={cn(
              viewport.isMobile ? "px-3 pb-3" : ""
            )}>
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

                {(incident.handoff_status === "ready_for_analysis" || incident.overall_status === "ready_for_analysis") && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Send className="h-5 w-5" />
                      <h4 className="font-medium">
                        {incident.handoff_status === "ready_for_analysis" ? "Submitted for Analysis" : "Workflow Completed"}
                      </h4>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                      {incident.handoff_status === "ready_for_analysis" 
                        ? "This incident has been submitted and is waiting for team leader review in the analysis workflow."
                        : "This incident workflow has been automatically completed and is ready for analysis by team leaders."}
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
      <div className={cn(
        "flex items-center pt-6 border-t",
        viewport.isMobile ? "flex-col space-y-3" : "justify-between"
      )}>
        <Button
          variant="outline"
          onClick={onPrevious}
          className={cn(
            viewport.isMobile ? "w-full h-12" : ""
          )}
        >
          Previous: Enhanced Review
        </Button>

        <div className={cn(
          "flex items-center gap-2",
          viewport.isMobile ? "w-full flex-col space-y-2" : ""
        )}>
          {incident.handoff_status !== "ready_for_analysis" && incident.overall_status !== "ready_for_analysis" && (
            <Button
              variant="outline"
              onClick={() => {
                console.log('Review Completion button clicked, switching to completion tab');
                console.log('Current active tab:', activeTab);
                console.log('Workflow validation status:', workflowValidation);
                setActiveTab("completion");
              }}
              className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "w-full h-12" : ""
              )}
            >
              <CheckCircle className="h-4 w-4" />
              {viewport.isMobile ? "Review Completion" : "Review Completion"}
            </Button>
          )}
          
          <Button
            onClick={handleSubmitForAnalysis}
            disabled={!workflowValidation.all_complete || !enhancedNarrative || isSubmitting || incident.handoff_status === "ready_for_analysis" || incident.overall_status === "ready_for_analysis"}
            className={cn(
              "flex items-center gap-2 bg-ss-teal text-white",
              viewport.isMobile ? "w-full h-12" : ""
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (incident.handoff_status === "ready_for_analysis" || incident.overall_status === "ready_for_analysis") ? (
              <>
                <CheckCircle className="h-4 w-4" />
                {incident.handoff_status === "ready_for_analysis" ? 
                  (viewport.isMobile ? "Submitted" : "Already Submitted") : 
                  (viewport.isMobile ? "Complete" : "Workflow Complete")
                }
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {viewport.isMobile ? "Submit for Analysis" : "Submit for Analysis"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}