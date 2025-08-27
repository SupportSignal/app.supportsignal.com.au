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
import type { Id } from '@/convex/_generated/dataModel';

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

  // PDF generation state
  const [pdfSections, setPdfSections] = useState<string[]>([
    'overview',
    'participant', 
    'brief_narratives',
    'detailed_narratives',
    'questions_answers',
    'processing_info'
  ]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch narratives
  const narratives = useQuery(
    api.narratives.getByIncidentId,
    user?.sessionToken ? { 
      sessionToken: user.sessionToken, 
      incident_id 
    } : "skip"
  );

  // PDF generation action
  const generatePDF = useAction(api.pdfGeneration.generateIncidentPDF);

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

  // PDF Section options
  const pdfSectionOptions = [
    { id: 'overview', label: 'Incident Overview & Metadata', icon: '📋' },
    { id: 'participant', label: 'Participant Information', icon: '👤' },
    { id: 'brief_narratives', label: 'Brief Narrative Summaries', icon: '📝' },
    { id: 'detailed_narratives', label: 'Detailed Enhanced Narratives', icon: '📖' },
    { id: 'questions_answers', label: 'Questions & Answers (All Phases)', icon: '❓' },
    { id: 'processing_info', label: 'Processing & System Information', icon: '📊' }
  ];

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

    setIsGeneratingPDF(true);
    
    try {
      const result = await generatePDF({
        sessionToken: user.sessionToken,
        incident_id,
        sections: pdfSections
      });

      // Convert array back to Uint8Array then to blob
      const pdfArray = new Uint8Array(result.pdfData);
      const blob = new Blob([pdfArray], { type: 'application/pdf' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF report downloaded successfully!");
      
    } catch (error) {
      console.error("PDF generation failed:", error);
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
    if (!narrativeStats?.phase_stats?.[phase]) return 0;
    return narrativeStats.phase_stats[phase].questions_answered || 0;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header - Completion Status */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <CardTitle className="text-2xl font-bold text-green-800 dark:text-green-200">
              INCIDENT DOCUMENTATION COMPLETE
            </CardTitle>
          </div>
          <p className="text-lg font-medium text-green-700 dark:text-green-300">
            &ldquo;{incident.participant_name} - {incident.location} incident&rdquo;
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Ready for review and action planning
          </p>
        </CardHeader>
      </Card>

      {/* What Happened - Incident Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            📋 WHAT HAPPENED
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Participant</label>
                <p className="text-base font-medium mt-1">{incident.participant_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Reported by</label>
                <p className="text-base font-medium mt-1">{incident.reporter_name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">When</label>
                <p className="text-base font-medium mt-1">{formatEventDateTime(incident.event_date_time)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Where</label>
                <p className="text-base font-medium mt-1">{incident.location}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigateToStep(1)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Update details if needed - Back to Step 1
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Incident Story - Four Phase Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            🔍 FULL INCIDENT STORY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Before Event Phase */}
            <div className="border-l-4 border-blue-200 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-base">Before the incident</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {narratives?.before_event 
                  ? (narratives.before_event.length > 150 
                      ? narratives.before_event.substring(0, 150) + '...' 
                      : narratives.before_event)
                  : 'No details recorded'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  💬 {getPhaseQuestionCount('before_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateToStep(3)}
                  className="text-xs"
                >
                  🔗 See story & questions - Back to Step 3
                </Button>
              </div>
            </div>

            {/* During Event Phase */}
            <div className="border-l-4 border-red-200 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-base">During the incident</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {narratives?.during_event 
                  ? (narratives.during_event.length > 150 
                      ? narratives.during_event.substring(0, 150) + '...' 
                      : narratives.during_event)
                  : 'No details recorded'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  💬 {getPhaseQuestionCount('during_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateToStep(4)}
                  className="text-xs"
                >
                  🔗 See story & questions - Back to Step 4
                </Button>
              </div>
            </div>

            {/* End Event Phase */}
            <div className="border-l-4 border-orange-200 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-base">How it ended</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {narratives?.end_event 
                  ? (narratives.end_event.length > 150 
                      ? narratives.end_event.substring(0, 150) + '...' 
                      : narratives.end_event)
                  : 'No details recorded'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  💬 {getPhaseQuestionCount('end_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateToStep(5)}
                  className="text-xs"
                >
                  🔗 See story & questions - Back to Step 5
                </Button>
              </div>
            </div>

            {/* Post Event Phase */}
            <div className="border-l-4 border-purple-200 pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-base">After the incident</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {narratives?.post_event 
                  ? (narratives.post_event.length > 150 
                      ? narratives.post_event.substring(0, 150) + '...' 
                      : narratives.post_event)
                  : 'No details recorded'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  💬 {getPhaseQuestionCount('post_event')} follow-up questions answered
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavigateToStep(6)}
                  className="text-xs"
                >
                  🔗 See story & questions - Back to Step 6
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Narrative Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            🤖 PROFESSIONAL NARRATIVE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Complete professional write-up ready for reports.
          </p>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigateToStep(7)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              🔗 Review full narrative - Back to Step 7
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDF Download Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            📄 COMPLETE DOCUMENTATION EXPORT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a professional PDF report with all incident data, ready for supervisors, 
              case managers, and compliance requirements.
            </p>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Select sections to include:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pdfSectionOptions.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={section.id}
                      checked={pdfSections.includes(section.id)}
                      onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                    />
                    <label 
                      htmlFor={section.id} 
                      className="text-sm cursor-pointer flex items-center gap-1"
                    >
                      <span>{section.icon}</span>
                      {section.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={handleGeneratePDF} 
                disabled={isGeneratingPDF || pdfSections.length === 0}
                className="w-full md:w-auto flex items-center gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    📋 Generate Complete PDF Report
                  </>
                )}
              </Button>
              
              {pdfSections.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Select at least one section to generate the report
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
              <strong>Report includes:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            📤 WHAT&apos;S NEXT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-3">📋 Share this incident:</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  📧 Email to team
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  📄 Print report
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  💾 Save to file
                </Button>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <div className="flex flex-wrap gap-2">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                🆕 Report new incident
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
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