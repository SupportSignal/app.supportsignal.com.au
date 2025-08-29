"use client";

import React, { useState } from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { Badge } from '@starter/ui/badge';
import { Separator } from '@starter/ui/separator';
import { Button } from '@starter/ui/button';
import { Checkbox } from '@starter/ui/checkbox';
import { CalendarDays, MapPin, User, FileText, Clock, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';

// CENTRALIZED PDF SECTION CONFIGURATION
import { 
  getDefaultSections,
  type PDFSectionKey 
} from '@/shared/pdf-sections';

interface ExportPreviewProps {
  incident_id: Id<"incidents">;
  enhancedNarrative: {
    _id: Id<"enhanced_narratives">;
    enhanced_content: string;
    user_edited: boolean;
    user_edits?: string;
    created_at: number;
    updated_at: number;
    enhancement_version: number;
  };
}

export function ExportPreview({ 
  incident_id, 
  enhancedNarrative 
}: ExportPreviewProps) {
  
  const { user } = useAuth();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  // Initialize PDF sections using centralized configuration (all sections enabled by default)
  const [pdfSections, setPdfSections] = useState(() => {
    const defaultSections = getDefaultSections();
    return defaultSections.reduce((acc, section) => {
      acc[section] = true;
      return acc;
    }, {} as Record<PDFSectionKey, boolean>);
  });
  
  // Fetch incident details
  const incident = useQuery(
    api.incidents.getById,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      id: incident_id as Id<"incidents">
    } : "skip"
  );

  // PDF generation actions
  const generatePDF = useAction(api.pdfGeneration.generateIncidentPDF);
  const downloadPDF = useAction(api.pdfGeneration.downloadPDF);
  

  if (!incident) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading incident details...
      </div>
    );
  }

  const finalNarrative = enhancedNarrative.user_edited 
    ? enhancedNarrative.user_edits 
    : enhancedNarrative.enhanced_content;


  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return format(date, 'PPP p');
    } catch {
      return dateTimeString;
    }
  };

  // Handle PDF section toggles
  const handleSectionToggle = (section: keyof typeof pdfSections) => {
    setPdfSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    if (!user?.sessionToken) {
      toast.error("Authentication required to generate PDF");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const selectedSections = Object.entries(pdfSections)
        .filter(([_, enabled]) => enabled)
        .map(([section, _]) => section);

      // Step 1: Generate PDF and store in Convex storage
      const generateResult = await generatePDF({
        sessionToken: user.sessionToken,
        incident_id,
        sections: selectedSections
      });

      // Step 2: Download PDF from storage
      const downloadResult = await downloadPDF({
        sessionToken: user.sessionToken,
        storageId: generateResult.storageId
      });

      // Validate download URL
      if (!downloadResult.downloadUrl) {
        throw new Error('No download URL received from server');
      }

      // Fetch the PDF from the URL and create a proper blob download
      const response = await fetch(downloadResult.downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      const pdfBlob = await response.blob();
      
      // Create blob URL for download
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = generateResult.filename;
      document.body.appendChild(link);
      
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);

      toast.success("PDF downloaded successfully!");

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('PDF generation failed:', error);
      toast.error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
          <h3 className="font-semibold">Analysis Workflow Export Preview</h3>
          <p className="text-sm text-muted-foreground">
            How this incident will appear in the team leader&apos;s analysis dashboard
          </p>
        </div>
        <Badge variant="outline">Ready for Analysis</Badge>
      </div>

      {/* Incident Summary Card (as it would appear in analysis workflow) */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Incident Report</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                ID: {incident_id.slice(-8)}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                Enhanced v{enhancedNarrative.enhancement_version}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Basic Information */}
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
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Date & Time:</span>
                <span>{formatDateTime(incident.event_date_time)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{incident.location}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Enhanced Narrative */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-semibold">Enhanced Incident Narrative</h4>
              {enhancedNarrative.user_edited && (
                <Badge variant="outline">
                  User Modified
                </Badge>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="p-4 bg-background border rounded-lg">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {typeof finalNarrative === 'string' 
                    ? finalNarrative 
                    : typeof finalNarrative === 'object' 
                      ? JSON.stringify(finalNarrative, null, 2)
                      : 'Unable to display narrative content'
                  }
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Enhanced: {format(enhancedNarrative.created_at, 'MMM d, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Status: Ready for Analysis
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>
                Version: {enhancedNarrative.enhancement_version}
              </span>
            </div>
          </div>

          {/* Analysis Placeholder */}
          <div className="p-4 bg-muted/30 border border-dashed rounded-lg">
            <div className="text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Analysis Section</p>
              <p className="text-sm">
                Contributing conditions and analysis will be added by team leaders in the analysis workflow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            PDF Export Options
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate a comprehensive PDF report with customizable sections
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PDF Section Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="basic_information"
                checked={pdfSections.basic_information}
                onCheckedChange={() => handleSectionToggle('basic_information')}
              />
              <label
                htmlFor="basic_information"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Basic Information
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incident_narratives"
                checked={pdfSections.incident_narratives}
                onCheckedChange={() => handleSectionToggle('incident_narratives')}
              />
              <label
                htmlFor="incident_narratives"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Incident Narratives
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="clarification_qa"
                checked={pdfSections.clarification_qa}
                onCheckedChange={() => handleSectionToggle('clarification_qa')}
              />
              <label
                htmlFor="clarification_qa"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Clarification Q&A
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enhanced_narrative"
                checked={pdfSections.enhanced_narrative}
                onCheckedChange={() => handleSectionToggle('enhanced_narrative')}
              />
              <label
                htmlFor="enhanced_narrative"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enhanced Narrative
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="participant_details"
                checked={pdfSections.participant_details}
                onCheckedChange={() => handleSectionToggle('participant_details')}
              />
              <label
                htmlFor="participant_details"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Participant Details
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="metadata"
                checked={pdfSections.metadata}
                onCheckedChange={() => handleSectionToggle('metadata')}
              />
              <label
                htmlFor="metadata"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Metadata & Timestamps
              </label>
            </div>
          </div>

          {/* Generate PDF Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || !user?.sessionToken}
              className="w-full md:w-auto"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Notes */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Export Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• This incident will be available for team leader analysis</li>
          <li>• All original content is preserved for audit purposes</li>
          <li>• Enhancement version tracking enables change history</li>
          <li>• Handoff notifications will alert appropriate team leaders</li>
        </ul>
      </div>
    </div>
  );
}