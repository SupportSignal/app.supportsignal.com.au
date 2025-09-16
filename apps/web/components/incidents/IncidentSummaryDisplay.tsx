// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Button } from '@starter/ui/button';
import { Checkbox } from '@starter/ui/checkbox';
import { 
  FileText, 
  MessageSquare, 
  Bot, 
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  Edit,
  ArrowLeft,
  Mail,
  Printer,
  Save,
  Plus,
  List,
  Download,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { useViewport } from '@/hooks/mobile/useViewport';
import { cn } from '@/lib/utils';
import type { Id } from '@/convex/_generated/dataModel';

// CENTRALIZED PDF SECTION CONFIGURATION
import { 
  getAllSectionKeys, 
  PDF_SECTION_UI_CONFIG 
} from '@/shared/pdf-sections';

interface IncidentSummaryDisplayProps {
  incident_id: Id<"incidents">;
  incident: any;
  enhancedNarrative: any;
  onNavigateToStep?: (step: number) => void;
}

export function IncidentSummaryDisplay({ 
  incident_id, 
  incident,
  enhancedNarrative,
  onNavigateToStep 
}: IncidentSummaryDisplayProps) {
  const { user } = useAuth();
  const viewport = useViewport();

  // PDF generation state using centralized configuration
  const [pdfSections, setPdfSections] = useState<string[]>(
    getAllSectionKeys()
  );
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch narratives
  const narratives = useQuery(
    api.narratives.getByIncidentId,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      incident_id 
    } : "skip"
  );

  // PDF generation actions
  const generatePDF = useAction(api.pdfGeneration.generateIncidentPDF);
  const downloadPDF = useAction(api.pdfGeneration.downloadPDF);

  // Fetch narrative statistics (question counts, etc)
  const narrativeStats = useQuery(
    api.narratives.getStatsByIncidentId,
    user?.sessionToken ? {
      sessionToken: user.sessionToken,
      incident_id
    } : "skip"
  );

  // Handle navigation to specific workflow steps
  const handleNavigateToStep = (step: number) => {
    if (onNavigateToStep) {
      onNavigateToStep(step);
    }
  };

  // PDF Section options using centralized configuration
  const pdfSectionOptions = PDF_SECTION_UI_CONFIG;

  // Handle PDF section toggle
  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setPdfSections(prev => [...prev, sectionId]);
    } else {
      setPdfSections(prev => prev.filter(id => id !== sectionId));
    }
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    if (!user?.sessionToken) {
      toast.error("Authentication required");
      return;
    }

    console.log('📋 IncidentSummaryDisplay: Starting PDF generation with sections:', pdfSections);
    setIsGeneratingPDF(true);
    
    try {
      // Step 1: Generate PDF and store in Convex storage
      const generateResult = await generatePDF({
        sessionToken: user.sessionToken,
        incident_id,
        sections: pdfSections
      });

      console.log('📋 IncidentSummaryDisplay: PDF generation completed, result:', {
        filename: generateResult.filename,
        storageId: generateResult.storageId,
        fileSize: generateResult.fileSize,
        generatedAt: generateResult.generatedAt
      });

      // Step 2: Download PDF from storage
      console.log('📋 IncidentSummaryDisplay: Starting PDF download from storage...');
      const downloadResult = await downloadPDF({
        sessionToken: user.sessionToken,
        storageId: generateResult.storageId
      });

      console.log('📋 IncidentSummaryDisplay: PDF download completed:', {
        hasDownloadUrl: !!downloadResult.downloadUrl,
        contentType: downloadResult.contentType,
        fileSize: downloadResult.fileSize
      });

      // Validate download URL
      if (!downloadResult.downloadUrl) {
        throw new Error('No download URL received from server');
      }

      // Fetch the PDF from the URL and create a proper blob download
      console.log('📋 IncidentSummaryDisplay: Fetching PDF from Convex storage URL for proper download...');
      
      const response = await fetch(downloadResult.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      const pdfBlob = await response.blob();
      console.log('📋 IncidentSummaryDisplay: PDF blob fetched:', {
        size: pdfBlob.size,
        type: pdfBlob.type
      });
      
      // Create blob URL for download (this stays in same origin)
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = generateResult.filename;
      document.body.appendChild(link);
      
      console.log('📋 IncidentSummaryDisplay: Triggering file download...');
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);

      toast.success("PDF report downloaded successfully!");
      console.log('📋 IncidentSummaryDisplay: PDF download process completed successfully');
      
    } catch (error) {
      console.error("📋 IncidentSummaryDisplay: PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Format date for display
  const formatEventDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return format(date, 'EEEE, do MMMM yyyy, h:mm a');
    } catch {
      return dateTimeString;
    }
  };

  // Get question count for a phase
  const getPhaseQuestionCount = (phase: string) => {
    if (!narrativeStats?.phases?.[phase]) return 0;
    return narrativeStats.phases[phase].question_count || 0;
  };

  return (
    <div className={cn(
      "mx-auto space-y-6",
      viewport.isMobile ? "px-4 max-w-full" : "max-w-4xl"
    )}>
      {/* Header - Completion Status */}
      <Card className={cn(
        "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800",
        viewport.isMobile ? "border-0 shadow-sm" : ""
      )}>
        <CardHeader className={cn(
          "text-center",
          viewport.isMobile ? "px-3 py-4" : ""
        )}>
          <div className={cn(
            "flex items-center gap-3 mb-2",
            viewport.isMobile ? "flex-col" : "justify-center"
          )}>
            <CheckCircle className={cn(
              "text-green-600",
              viewport.isMobile ? "h-6 w-6" : "h-8 w-8"
            )} />
            <CardTitle className={cn(
              "font-bold text-green-800 dark:text-green-200",
              viewport.isMobile ? "text-lg text-center" : "text-2xl"
            )}>
              INCIDENT DOCUMENTATION COMPLETE
            </CardTitle>
          </div>
          <p className={cn(
            "font-medium text-green-700 dark:text-green-300",
            viewport.isMobile ? "text-base" : "text-lg"
          )}>
            &ldquo;{incident.participant_name} - {incident.location} incident&rdquo;
          </p>
          <p className={cn(
            "text-green-600 dark:text-green-400",
            viewport.isMobile ? "text-xs" : "text-sm"
          )}>
            Ready for review and action planning
          </p>
        </CardHeader>
      </Card>

      {/* What Happened - Incident Metadata */}
      <Card className={cn(
        viewport.isMobile ? "border-0 shadow-sm" : ""
      )}>
        <CardHeader className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            viewport.isMobile ? "justify-center text-base" : ""
          )}>
            <FileText className="h-5 w-5" />
            📋 WHAT HAPPENED
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <div className={cn(
            viewport.isMobile ? "space-y-3" : "space-y-4"
          )}>
            <div className={cn(
              "gap-6",
              viewport.isMobile ? "grid grid-cols-1 space-y-3" : "grid grid-cols-2"
            )}>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Participant</label>
                <p className={cn(
                  "font-medium mt-1",
                  viewport.isMobile ? "text-sm" : "text-base"
                )}>{incident.participant_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reported by</label>
                <p className={cn(
                  "font-medium mt-1",
                  viewport.isMobile ? "text-sm" : "text-base"
                )}>{incident.reporter_name}</p>
              </div>
            </div>
            <div className={cn(
              "gap-6",
              viewport.isMobile ? "grid grid-cols-1 space-y-3" : "grid grid-cols-2"
            )}>
              <div>
                <label className="text-sm font-medium text-muted-foreground">When</label>
                <p className={cn(
                  "font-medium mt-1",
                  viewport.isMobile ? "text-xs" : "text-base"
                )}>{formatEventDateTime(incident.event_date_time)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Where</label>
                <p className={cn(
                  "font-medium mt-1",
                  viewport.isMobile ? "text-sm" : "text-base"
                )}>{incident.location}</p>
              </div>
            </div>
            <div className={cn(
              "pt-2",
              viewport.isMobile ? "flex justify-center" : "flex justify-end"
            )}>
              <Button 
                variant="outline" 
                size={viewport.isMobile ? "default" : "sm"}
                onClick={() => handleNavigateToStep(1)}
                className={cn(
                  "flex items-center gap-2",
                  viewport.isMobile ? "h-12 w-full text-xs" : ""
                )}
              >
                <Edit className="h-4 w-4" />
                {viewport.isMobile ? "Update details - Back to Step 1" : "Update details if needed - Back to Step 1"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Incident Story - Four Phase Summary */}
      <Card className={cn(
        viewport.isMobile ? "border-0 shadow-sm" : ""
      )}>
        <CardHeader className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            viewport.isMobile ? "justify-center text-base" : ""
          )}>
            <MessageSquare className="h-5 w-5" />
            🔍 FULL INCIDENT STORY
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <div className={cn(
            viewport.isMobile ? "space-y-4" : "space-y-6"
          )}>
            {/* Before Event Phase */}
            <div className={cn(
              "border-l-4 border-blue-200 py-2",
              viewport.isMobile ? "pl-2" : "pl-4"
            )}>
              <div className={cn(
                "flex items-center gap-2 mb-2",
                viewport.isMobile ? "justify-center" : ""
              )}>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className={cn(
                  "font-semibold",
                  viewport.isMobile ? "text-sm" : "text-base"
                )}>Before the incident</h3>
              </div>
              <p className={cn(
                "text-muted-foreground mb-2",
                viewport.isMobile ? "text-xs text-center" : "text-sm"
              )}>
                {narratives?.before_event 
                  ? (narratives.before_event.length > 150 
                      ? narratives.before_event.substring(0, 150) + '...' 
                      : narratives.before_event)
                  : 'No details recorded'}
              </p>
              <div className={cn(
                "flex items-center",
                viewport.isMobile ? "flex-col space-y-2" : "justify-between"
              )}>
                <span className={cn(
                  "text-muted-foreground flex items-center gap-1",
                  viewport.isMobile ? "text-xs" : "text-xs"
                )}>
                  💬 {getPhaseQuestionCount('before_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size={viewport.isMobile ? "default" : "sm"}
                  onClick={() => handleNavigateToStep(3)}
                  className={cn(
                    viewport.isMobile ? "h-10 w-full text-xs" : "text-xs"
                  )}
                >
                  🔗 {viewport.isMobile ? "Step 3" : "See story & questions - Back to Step 3"}
                </Button>
              </div>
            </div>

            {/* During Event Phase */}
            <div className={cn(
              "border-l-4 border-red-200 py-2",
              viewport.isMobile ? "pl-2" : "pl-4"
            )}>
              <div className={cn(
                "flex items-center gap-2 mb-2",
                viewport.isMobile ? "justify-center" : ""
              )}>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className={cn(
                  "font-semibold",
                  viewport.isMobile ? "text-sm" : "text-base"
                )}>During the incident</h3>
              </div>
              <p className={cn(
                "text-muted-foreground mb-2",
                viewport.isMobile ? "text-xs text-center" : "text-sm"
              )}>
                {narratives?.during_event 
                  ? (narratives.during_event.length > 150 
                      ? narratives.during_event.substring(0, 150) + '...' 
                      : narratives.during_event)
                  : 'No details recorded'}
              </p>
              <div className={cn(
                "flex items-center",
                viewport.isMobile ? "flex-col space-y-2" : "justify-between"
              )}>
                <span className={cn(
                  "text-muted-foreground flex items-center gap-1",
                  viewport.isMobile ? "text-xs" : "text-xs"
                )}>
                  💬 {getPhaseQuestionCount('during_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size={viewport.isMobile ? "default" : "sm"}
                  onClick={() => handleNavigateToStep(4)}
                  className={cn(
                    viewport.isMobile ? "h-10 w-full text-xs" : "text-xs"
                  )}
                >
                  🔗 {viewport.isMobile ? "Step 4" : "See story & questions - Back to Step 4"}
                </Button>
              </div>
            </div>

            {/* End Event Phase */}
            <div className={cn(
              "border-l-4 border-orange-200 py-2",
              viewport.isMobile ? "pl-2" : "pl-4"
            )}>
              <div className={cn(
                "flex items-center gap-2 mb-2",
                viewport.isMobile ? "justify-center" : ""
              )}>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className={cn(
                  "font-semibold",
                  viewport.isMobile ? "text-sm" : "text-base"
                )}>How it ended</h3>
              </div>
              <p className={cn(
                "text-muted-foreground mb-2",
                viewport.isMobile ? "text-xs text-center" : "text-sm"
              )}>
                {narratives?.end_event 
                  ? (narratives.end_event.length > 150 
                      ? narratives.end_event.substring(0, 150) + '...' 
                      : narratives.end_event)
                  : 'No details recorded'}
              </p>
              <div className={cn(
                "flex items-center",
                viewport.isMobile ? "flex-col space-y-2" : "justify-between"
              )}>
                <span className={cn(
                  "text-muted-foreground flex items-center gap-1",
                  viewport.isMobile ? "text-xs" : "text-xs"
                )}>
                  💬 {getPhaseQuestionCount('end_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size={viewport.isMobile ? "default" : "sm"}
                  onClick={() => handleNavigateToStep(5)}
                  className={cn(
                    viewport.isMobile ? "h-10 w-full text-xs" : "text-xs"
                  )}
                >
                  🔗 {viewport.isMobile ? "Step 5" : "See story & questions - Back to Step 5"}
                </Button>
              </div>
            </div>

            {/* Post Event Phase */}
            <div className={cn(
              "border-l-4 border-purple-200 py-2",
              viewport.isMobile ? "pl-2" : "pl-4"
            )}>
              <div className={cn(
                "flex items-center gap-2 mb-2",
                viewport.isMobile ? "justify-center" : ""
              )}>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className={cn(
                  "font-semibold",
                  viewport.isMobile ? "text-sm" : "text-base"
                )}>After the incident</h3>
              </div>
              <p className={cn(
                "text-muted-foreground mb-2",
                viewport.isMobile ? "text-xs text-center" : "text-sm"
              )}>
                {narratives?.post_event 
                  ? (narratives.post_event.length > 150 
                      ? narratives.post_event.substring(0, 150) + '...' 
                      : narratives.post_event)
                  : 'No details recorded'}
              </p>
              <div className={cn(
                "flex items-center",
                viewport.isMobile ? "flex-col space-y-2" : "justify-between"
              )}>
                <span className={cn(
                  "text-muted-foreground flex items-center gap-1",
                  viewport.isMobile ? "text-xs" : "text-xs"
                )}>
                  💬 {getPhaseQuestionCount('post_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size={viewport.isMobile ? "default" : "sm"}
                  onClick={() => handleNavigateToStep(6)}
                  className={cn(
                    viewport.isMobile ? "h-10 w-full text-xs" : "text-xs"
                  )}
                >
                  🔗 {viewport.isMobile ? "Step 6" : "See story & questions - Back to Step 6"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Narrative Section */}
      <Card className={cn(
        viewport.isMobile ? "border-0 shadow-sm" : ""
      )}>
        <CardHeader className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            viewport.isMobile ? "justify-center text-base" : ""
          )}>
            <Bot className="h-5 w-5" />
            🤖 PROFESSIONAL NARRATIVE
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <p className={cn(
            "text-muted-foreground mb-3",
            viewport.isMobile ? "text-xs text-center" : "text-sm"
          )}>
            Complete professional write-up ready for reports.
          </p>
          <div className={cn(
            viewport.isMobile ? "flex justify-center" : "flex justify-end"
          )}>
            <Button
              variant="outline"
              size={viewport.isMobile ? "default" : "sm"}
              onClick={() => handleNavigateToStep(7)}
              className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "h-12 w-full text-xs" : ""
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              🔗 {viewport.isMobile ? "Step 7" : "Review full narrative - Back to Step 7"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDF Download Section */}
      <Card className={cn(
        viewport.isMobile ? "border-0 shadow-sm" : ""
      )}>
        <CardHeader className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            viewport.isMobile ? "justify-center text-base" : ""
          )}>
            <Download className="h-5 w-5" />
            📄 COMPLETE DOCUMENTATION EXPORT
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <div className={cn(
            viewport.isMobile ? "space-y-3" : "space-y-4"
          )}>
            <p className={cn(
              "text-muted-foreground",
              viewport.isMobile ? "text-xs text-center" : "text-sm"
            )}>
              Generate a professional PDF report with all incident data, ready for supervisors, 
              case managers, and compliance requirements.
            </p>

            <div className={cn(
              viewport.isMobile ? "space-y-2" : "space-y-3"
            )}>
              <h4 className={cn(
                "font-medium",
                viewport.isMobile ? "text-xs text-center" : "text-sm"
              )}>Select sections to include:</h4>
              <div className={cn(
                "gap-3",
                viewport.isMobile ? "grid grid-cols-1 space-y-2" : "grid grid-cols-1 md:grid-cols-2"
              )}>
                {pdfSectionOptions.map((section) => (
                  <div key={section.id} className={cn(
                    "flex items-center space-x-2",
                    viewport.isMobile ? "justify-center" : ""
                  )}>
                    <Checkbox
                      id={section.id}
                      checked={pdfSections.includes(section.id)}
                      onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                    />
                    <label 
                      htmlFor={section.id} 
                      className={cn(
                        "cursor-pointer flex items-center gap-1",
                        viewport.isMobile ? "text-xs" : "text-sm"
                      )}
                    >
                      <span>{section.icon}</span>
                      {section.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn(
              "pt-4 border-t",
              viewport.isMobile ? "pt-3" : ""
            )}>
              <Button 
                onClick={handleGeneratePDF} 
                disabled={isGeneratingPDF || pdfSections.length === 0}
                className={cn(
                  "flex items-center gap-2",
                  viewport.isMobile ? "w-full h-12 text-sm" : "w-full md:w-auto"
                )}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    📋 {viewport.isMobile ? "Generate PDF" : "Generate Complete PDF Report"}
                  </>
                )}
              </Button>
              
              {pdfSections.length === 0 && (
                <p className={cn(
                  "text-muted-foreground mt-2",
                  viewport.isMobile ? "text-xs text-center" : "text-xs"
                )}>
                  Select at least one section to generate the report
                </p>
              )}
            </div>

            <div className={cn(
              "text-muted-foreground bg-muted/30 rounded-md",
              viewport.isMobile ? "text-xs p-2" : "text-xs p-3"
            )}>
              <strong>Report includes:</strong>
              <ul className={cn(
                "list-disc mt-1",
                viewport.isMobile ? "list-inside space-y-0" : "list-inside space-y-1"
              )}>
                <li>Complete incident narrative with AI enhancements</li>
                <li>All questions and answers from clarification workflow</li>
                <li>Participant information and care notes</li>
                <li>Processing timestamps and system information</li>
                <li>Professional formatting ready for official use</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next - Actions */}
      <Card className={cn(
        viewport.isMobile ? "border-0 shadow-sm" : ""
      )}>
        <CardHeader className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            viewport.isMobile ? "justify-center text-base" : ""
          )}>
            <FileText className="h-5 w-5" />
            📤 WHAT&apos;S NEXT
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(
          viewport.isMobile ? "px-3 pb-3" : ""
        )}>
          <div className={cn(
            viewport.isMobile ? "space-y-3" : "space-y-4"
          )}>
            <div>
              <h3 className={cn(
                "font-medium mb-3",
                viewport.isMobile ? "text-sm text-center" : ""
              )}>📋 Share this incident:</h3>
              <div className={cn(
                "flex gap-2",
                viewport.isMobile ? "flex-col" : "flex-wrap"
              )}>
                <Button 
                  variant="outline" 
                  size={viewport.isMobile ? "default" : "sm"} 
                  className={cn(
                    "flex items-center gap-2",
                    viewport.isMobile ? "h-12 w-full" : ""
                  )}
                >
                  <Mail className="h-4 w-4" />
                  📧 Email to team
                </Button>
                <Button 
                  variant="outline" 
                  size={viewport.isMobile ? "default" : "sm"} 
                  className={cn(
                    "flex items-center gap-2",
                    viewport.isMobile ? "h-12 w-full" : ""
                  )}
                >
                  <Printer className="h-4 w-4" />
                  📄 Print report
                </Button>
                <Button 
                  variant="outline" 
                  size={viewport.isMobile ? "default" : "sm"} 
                  className={cn(
                    "flex items-center gap-2",
                    viewport.isMobile ? "h-12 w-full" : ""
                  )}
                >
                  <Save className="h-4 w-4" />
                  💾 Save to file
                </Button>
              </div>
            </div>
            
            <hr className={cn(
              viewport.isMobile ? "my-3" : "my-4"
            )} />
            
            <div className={cn(
              "flex gap-2",
              viewport.isMobile ? "flex-col" : "flex-wrap"
            )}>
              <Button className={cn(
                "flex items-center gap-2",
                viewport.isMobile ? "h-12 w-full" : ""
              )}>
                <Plus className="h-4 w-4" />
                🆕 Report new incident
              </Button>
              <Button 
                variant="outline" 
                className={cn(
                  "flex items-center gap-2",
                  viewport.isMobile ? "h-12 w-full" : ""
                )}
              >
                <List className="h-4 w-4" />
                📋 View all incidents
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}