// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { hasDeveloperAccess } from '@/lib/utils/developerAccess';
import { Button } from '@starter/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@starter/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@starter/ui/collapsible';
import { Badge } from '@starter/ui/badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Wand2, 
  FileText,
  Clock,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { useViewport } from '@/hooks/mobile/useViewport';
import { cn } from '@/lib/utils';
import type { Id } from '@/convex/_generated/dataModel';
import type { ClarificationPhase } from '@/types/clarification';

interface EnhancedReviewStepNewProps {
  incident_id: Id<"incidents">;
  onComplete: (data: { success: boolean }) => void;
  onPrevious: () => void;
}

// Simple text formatting function - breaks text into paragraphs with light emphasis
const formatNarrativeText = (text: string): React.ReactNode => {
  if (!text?.trim()) return null;

  // Split into sentences and group into logical paragraphs
  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
  const paragraphs: string[] = [];
  let currentParagraph = '';

  sentences.forEach((sentence, index) => {
    currentParagraph += sentence.trim() + ' ';
    
    // Start new paragraph after 2-3 sentences or at logical breaks
    const shouldBreak = (index + 1) % 3 === 0 || 
      sentence.includes('After') || 
      sentence.includes('During') || 
      sentence.includes('Following') ||
      sentence.includes('Subsequently');
      
    if (shouldBreak || index === sentences.length - 1) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = '';
    }
  });

  return paragraphs.map((paragraph, index) => (
    <p key={index} className="mb-3 last:mb-0">
      {paragraph}
    </p>
  ));
};

interface PhaseEnhancement {
  phase: ClarificationPhase;
  title: string;
  description: string;
  enhanced_content?: string;
  original_content?: string;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

export function EnhancedReviewStepNew({ 
  incident_id, 
  onComplete, 
  onPrevious 
}: EnhancedReviewStepNewProps) {
  const { user } = useAuth();
  const viewport = useViewport();
  const [openPanels, setOpenPanels] = useState<Set<ClarificationPhase>>(new Set());
  const [phaseEnhancements, setPhaseEnhancements] = useState<Record<ClarificationPhase, PhaseEnhancement>>({
    before_event: {
      phase: "before_event",
      title: "Before Event Enhancement",
      description: "Enhanced narrative combining original observations with clarification responses about pre-incident circumstances",
      isLoading: false,
      isComplete: false,
    },
    during_event: {
      phase: "during_event", 
      title: "During Event Enhancement",
      description: "Enhanced narrative combining original observations with clarification responses about the incident occurrence",
      isLoading: false,
      isComplete: false,
    },
    end_event: {
      phase: "end_event",
      title: "End Event Enhancement", 
      description: "Enhanced narrative combining original observations with clarification responses about incident resolution",
      isLoading: false,
      isComplete: false,
    },
    post_event: {
      phase: "post_event",
      title: "Post-Event Enhancement",
      description: "Enhanced narrative combining original observations with clarification responses about post-incident support",
      isLoading: false,
      isComplete: false,
    },
  });

  // Fetch incident narratives to check what content exists
  const narratives = useQuery(
    api.incidents.getIncidentNarrativeByIncidentId,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      incident_id 
    } : "skip"
  );

  // Convex action for phase enhancement
  const enhancePhase = useAction(api.aiEnhancement.enhanceNarrativePhase);

  // Initialize phase data when narratives load
  useEffect(() => {
    if (narratives) {
      setPhaseEnhancements(prev => ({
        before_event: {
          ...prev.before_event,
          original_content: narratives.before_event || '',
          enhanced_content: narratives.before_event_extra || '',
          isComplete: !!(narratives.before_event_extra),
        },
        during_event: {
          ...prev.during_event,
          original_content: narratives.during_event || '',
          enhanced_content: narratives.during_event_extra || '',
          isComplete: !!(narratives.during_event_extra),
        },
        end_event: {
          ...prev.end_event,
          original_content: narratives.end_event || '',
          enhanced_content: narratives.end_event_extra || '',
          isComplete: !!(narratives.end_event_extra),
        },
        post_event: {
          ...prev.post_event,
          original_content: narratives.post_event || '',
          enhanced_content: narratives.post_event_extra || '',
          isComplete: !!(narratives.post_event_extra),
        },
      }));
    }
  }, [narratives]);

  const togglePanel = (phase: ClarificationPhase) => {
    const newOpenPanels = new Set(openPanels);
    if (newOpenPanels.has(phase)) {
      newOpenPanels.delete(phase);
    } else {
      newOpenPanels.add(phase);
    }
    setOpenPanels(newOpenPanels);
  };

  const handleEnhancePhase = async (phase: ClarificationPhase) => {
    if (!user?.sessionToken) {
      toast.error("Authentication required");
      return;
    }

    const enhancement = phaseEnhancements[phase];
    if (!enhancement.original_content?.trim()) {
      toast.error(`No original ${phase.replace('_', ' ')} narrative to enhance`);
      return;
    }

    // Update loading state
    setPhaseEnhancements(prev => ({
      ...prev,
      [phase]: { ...prev[phase], isLoading: true, error: undefined }
    }));

    try {
      const result = await enhancePhase({
        sessionToken: user.sessionToken,
        incident_id,
        phase,
      });

      if (result.success) {
        // Update enhanced content
        setPhaseEnhancements(prev => ({
          ...prev,
          [phase]: {
            ...prev[phase],
            enhanced_content: result.enhanced_content,
            isLoading: false,
            isComplete: true,
            error: undefined,
          }
        }));

        toast.success(`${phase.replace('_', ' ')} narrative enhanced successfully`);
        
        // Auto-expand the panel to show results
        setOpenPanels(prev => new Set([...prev, phase]));
      } else {
        throw new Error("Enhancement failed");
      }
    } catch (error) {
      console.error(`${phase} enhancement failed:`, error);
      const errorMessage = error instanceof Error ? error.message : "Enhancement failed";
      
      setPhaseEnhancements(prev => ({
        ...prev,
        [phase]: {
          ...prev[phase],
          isLoading: false,
          error: errorMessage,
        }
      }));

      toast.error(`Failed to enhance ${phase.replace('_', ' ')} narrative`);
    }
  };

  const handleEnhanceAll = async () => {
    const phasesToEnhance = Object.values(phaseEnhancements)
      .filter(p => p.original_content?.trim() && !p.isComplete)
      .map(p => p.phase);

    if (phasesToEnhance.length === 0) {
      toast.info("All phases are already enhanced or have no content to enhance");
      return;
    }

    // Enhance phases sequentially to avoid overwhelming the system
    for (const phase of phasesToEnhance) {
      await handleEnhancePhase(phase);
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getPhaseStatus = (phase: PhaseEnhancement) => {
    if (phase.isLoading) return { color: "secondary", icon: Loader2, text: "Enhancing..." };
    if (phase.error) return { color: "destructive", icon: AlertCircle, text: "Failed" };
    if (phase.isComplete) return { color: "default", icon: CheckCircle, text: "Enhanced" };
    if (phase.original_content?.trim()) return { color: "outline", icon: Clock, text: "Pending" };
    return { color: "secondary", icon: AlertCircle, text: "No Content" };
  };

  const allPhasesComplete = Object.values(phaseEnhancements).every(p => 
    p.isComplete || !p.original_content?.trim()
  );

  const hasAnyEnhancements = Object.values(phaseEnhancements).some(p => p.isComplete);

  if (!narratives) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading incident narratives...</p>
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
          )}>Enhanced Review</h2>
          <p className={cn(
            "text-muted-foreground",
            viewport.isMobile ? "text-sm" : ""
          )}>
            Review AI-enhanced narratives for each phase of the incident
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2",
          viewport.isMobile ? "w-full justify-center" : ""
        )}>
          <Badge variant={allPhasesComplete ? "default" : "secondary"}>
            {allPhasesComplete ? "Complete" : "In Progress"}
          </Badge>
          <Button
            variant="outline" 
            size={viewport.isMobile ? "default" : "sm"}
            onClick={handleEnhanceAll}
            disabled={allPhasesComplete}
            className={cn(
              "flex items-center gap-2",
              viewport.isMobile ? "h-12 px-4" : ""
            )}
          >
            <Wand2 className="h-4 w-4" />
            Enhance All
          </Button>
        </div>
      </div>

      {/* Phase Enhancement Accordion */}
      <div className={cn(
        viewport.isMobile ? "space-y-3" : "space-y-4"
      )}>
        {Object.values(phaseEnhancements).map((phase) => {
          const status = getPhaseStatus(phase);
          const StatusIcon = status.icon;
          const isOpen = openPanels.has(phase.phase);

          return (
            <Card key={phase.phase} className={cn(
              viewport.isMobile ? "border-0 shadow-sm" : ""
            )}>
              <Collapsible 
                open={isOpen} 
                onOpenChange={() => togglePanel(phase.phase)}
              >
                <CardHeader className={cn(
                  viewport.isMobile ? "pb-3 px-3" : "pb-4"
                )}>
                  <CollapsibleTrigger asChild>
                    <div className={cn(
                      "flex items-center cursor-pointer hover:bg-muted/50 -m-4 p-4 rounded-lg",
                      viewport.isMobile ? "flex-col space-y-3 min-h-[48px] items-start" : "justify-between"
                    )}>
                      <div className={cn(
                        "flex items-center space-x-3",
                        viewport.isMobile ? "w-full justify-between" : ""
                      )}>
                        <div className="flex items-center space-x-3">
                          {isOpen ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className={cn(
                              viewport.isMobile ? "text-base" : "text-lg"
                            )}>{phase.title}</CardTitle>
                            <CardDescription className={cn(
                              "mt-1",
                              viewport.isMobile ? "text-xs" : ""
                            )}>
                              {phase.description}
                            </CardDescription>
                          </div>
                        </div>
                        {viewport.isMobile && (
                          <Badge variant={status.color as any}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.text}
                          </Badge>
                        )}
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        viewport.isMobile ? "w-full justify-center" : ""
                      )}>
                        {!viewport.isMobile && (
                          <Badge variant={status.color as any}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.text}
                          </Badge>
                        )}
                        {!phase.isComplete && phase.original_content?.trim() && (
                          <Button
                            variant="outline"
                            size={viewport.isMobile ? "default" : "sm"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnhancePhase(phase.phase);
                            }}
                            disabled={phase.isLoading}
                            className={cn(
                              "flex items-center gap-2",
                              viewport.isMobile ? "h-12 w-full" : ""
                            )}
                          >
                            {phase.isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3" />
                            )}
                            {phase.isLoading ? "Enhancing..." : "Enhance"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className={cn(
                    "pt-0",
                    viewport.isMobile ? "px-3 pb-3" : ""
                  )}>
                    <div className={cn(
                      viewport.isMobile ? "space-y-3" : "space-y-4"
                    )}>
                      {/* Enhanced Content */}
                      {phase.enhanced_content && (
                        <div>
                          <div className={cn(
                            "flex items-center gap-2 mb-2",
                            viewport.isMobile ? "justify-center" : ""
                          )}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <h4 className={cn(
                              "font-medium",
                              viewport.isMobile ? "text-sm" : ""
                            )}>Enhanced Narrative</h4>
                          </div>
                          <div className={cn(
                            "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg",
                            viewport.isMobile ? "p-3" : "p-4"
                          )}>
                            <div className={cn(
                              "leading-relaxed space-y-3",
                              viewport.isMobile ? "text-sm" : "text-sm"
                            )}>
                              {formatNarrativeText(phase.enhanced_content)}
                            </div>
                          </div>
                          
                          {/* Developer Regenerate Enhancement Button */}
                          {hasDeveloperAccess(user) && (
                            <div className={cn(
                              "mt-3 bg-gray-50 rounded-lg border",
                              viewport.isMobile ? "p-2" : "p-3"
                            )}>
                              <div className={cn(
                                "flex items-center",
                                viewport.isMobile ? "flex-col space-y-2" : "justify-between"
                              )}>
                                <div className={cn(
                                  viewport.isMobile ? "text-center" : ""
                                )}>
                                  <p className="text-xs font-medium text-gray-600">Developer Tools</p>
                                  <p className="text-xs text-gray-500">Regenerate this enhancement</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size={viewport.isMobile ? "default" : "sm"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEnhancePhase(phase.phase);
                                  }}
                                  disabled={phase.isLoading}
                                  className={cn(
                                    "flex items-center gap-1",
                                    viewport.isMobile ? "h-10 w-full" : "h-7 text-xs"
                                  )}
                                >
                                  <RotateCcw className={cn("h-3 w-3", phase.isLoading && "animate-spin")} />
                                  Regenerate
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Original Content */}
                      {phase.original_content && (
                        <div>
                          <div className={cn(
                            "flex items-center gap-2 mb-2",
                            viewport.isMobile ? "justify-center" : ""
                          )}>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h4 className={cn(
                              "font-medium text-muted-foreground",
                              viewport.isMobile ? "text-sm" : ""
                            )}>Original Narrative</h4>
                          </div>
                          <div className={cn(
                            "bg-muted border rounded-lg",
                            viewport.isMobile ? "p-3" : "p-4"
                          )}>
                            <p className="text-sm leading-relaxed text-muted-foreground">{phase.original_content}</p>
                          </div>
                        </div>
                      )}

                      {/* Error State */}
                      {phase.error && (
                        <div className={cn(
                          "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg",
                          viewport.isMobile ? "p-3" : "p-4"
                        )}>
                          <div className={cn(
                            "flex items-center gap-2 text-red-800 dark:text-red-200",
                            viewport.isMobile ? "justify-center" : ""
                          )}>
                            <AlertCircle className="h-4 w-4" />
                            <p className={cn(
                              "font-medium",
                              viewport.isMobile ? "text-sm" : "text-sm"
                            )}>Enhancement Failed</p>
                          </div>
                          <p className={cn(
                            "text-red-700 dark:text-red-300 mt-1",
                            viewport.isMobile ? "text-xs text-center" : "text-sm"
                          )}>{phase.error}</p>
                          <Button
                            variant="outline"
                            size={viewport.isMobile ? "default" : "sm"}
                            onClick={() => handleEnhancePhase(phase.phase)}
                            className={cn(
                              "mt-2 flex items-center gap-2",
                              viewport.isMobile ? "w-full h-12" : ""
                            )}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Retry Enhancement
                          </Button>
                        </div>
                      )}

                      {/* No Content State */}
                      {!phase.original_content?.trim() && (
                        <div className={cn(
                          "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg",
                          viewport.isMobile ? "p-3" : "p-4"
                        )}>
                          <div className={cn(
                            "flex items-center gap-2 text-yellow-800 dark:text-yellow-200",
                            viewport.isMobile ? "justify-center" : ""
                          )}>
                            <AlertCircle className="h-4 w-4" />
                            <p className={cn(
                              "font-medium",
                              viewport.isMobile ? "text-sm" : "text-sm"
                            )}>No Content Available</p>
                          </div>
                          <p className={cn(
                            "text-yellow-700 dark:text-yellow-300 mt-1",
                            viewport.isMobile ? "text-xs text-center" : "text-sm"
                          )}>
                            No original narrative was provided for this phase, so enhancement is not available.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

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
          Previous: Post-Event Questions
        </Button>

        <div className={cn(
          "flex items-center gap-2",
          viewport.isMobile ? "w-full" : ""
        )}>
          <Button
            onClick={() => onComplete({ success: true })}
            disabled={!hasAnyEnhancements}
            className={cn(
              "flex items-center gap-2 bg-ss-teal text-white",
              viewport.isMobile ? "w-full h-12" : ""
            )}
          >
            <CheckCircle className="h-4 w-4" />
            {allPhasesComplete ? 
              (viewport.isMobile ? "Continue to Report" : "Continue to Complete Report") : 
              (viewport.isMobile ? "Continue with Enhancements" : "Continue with Current Enhancements")
            }
          </Button>
        </div>
      </div>
    </div>
  );
}