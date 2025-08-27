import { action } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { ConvexError } from 'convex/values';
import jsPDF from 'jspdf';
import type { ActionCtx } from './_generated/server';

// PDF Section types for checkbox selection
const PDF_SECTIONS = {
  overview: 'Incident Overview & Metadata',
  participant: 'Participant Information', 
  brief_narratives: 'Brief Narrative Summaries',
  detailed_narratives: 'Detailed Enhanced Narratives',
  questions_answers: 'Questions & Answers (All Phases)',
  processing_info: 'Processing & System Information'
} as const;

type PDFSection = keyof typeof PDF_SECTIONS;

interface IncidentData {
  incident: any;
  narratives: any;
  participant: any;
  clarificationWorkflow?: any;
}

/**
 * Generate comprehensive incident documentation PDF
 */
export const generateIncidentPDF = action({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    sections: v.optional(v.array(v.string())), // sections to include
  },
  handler: async (ctx, args) => {
    try {
      // Get all required data
      const data = await gatherIncidentData(ctx, args);
      
      // Determine which sections to include (all by default)
      const selectedSections = args.sections || Object.keys(PDF_SECTIONS);
      
      // Generate PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      let currentY = 20;
      
      // Add header
      currentY = addDocumentHeader(doc, data.incident, currentY);
      
      // Add sections based on selection
      if (selectedSections.includes('overview')) {
        currentY = addIncidentOverview(doc, data, currentY);
      }
      
      if (selectedSections.includes('participant')) {
        currentY = addParticipantInformation(doc, data, currentY);
      }
      
      if (selectedSections.includes('brief_narratives')) {
        currentY = addBriefNarratives(doc, data, currentY);
      }
      
      if (selectedSections.includes('detailed_narratives')) {
        currentY = addDetailedNarratives(doc, data, currentY);
      }
      
      if (selectedSections.includes('questions_answers')) {
        currentY = addQuestionsAndAnswers(doc, data, currentY);
      }
      
      if (selectedSections.includes('processing_info')) {
        currentY = addProcessingInformation(doc, data, currentY);
      }
      
      // Add footer
      addDocumentFooter(doc, data.incident);
      
      const pdfBuffer = doc.output('arraybuffer');
      const filename = `incident-${data.incident.participant_name.replace(/\s+/g, '-')}-${data.incident._id}-${Date.now()}.pdf`;
      
      return {
        pdfData: Array.from(new Uint8Array(pdfBuffer)),
        filename,
        generatedAt: Date.now(),
        sections: selectedSections
      };
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ConvexError(`PDF generation failed: ${errorMessage}`);
    }
  }
});

/**
 * Gather all incident data needed for PDF generation
 */
async function gatherIncidentData(ctx: ActionCtx, args: { sessionToken: string; incident_id: any }): Promise<IncidentData> {
  // Get incident data - bypass TypeScript deep inference issues
  // @ts-ignore - TypeScript inference issues with complex internal API types
  const incident: any = await ctx.runQuery(internal.incidents.getById, {
    sessionToken: args.sessionToken,
    incident_id: args.incident_id
  });
  
  if (!incident) {
    throw new ConvexError("Incident not found");
  }
  
  // Get narratives data
  // @ts-ignore - TypeScript inference issues with complex internal API types
  const narratives: any = await ctx.runQuery(internal.narratives.getByIncidentId, {
    sessionToken: args.sessionToken,
    incident_id: args.incident_id
  });
  
  // Get participant data  
  // @ts-ignore - TypeScript inference issues with complex internal API types
  const participant: any = await ctx.runQuery(internal.participants.getById, {
    sessionToken: args.sessionToken,
    participant_id: incident.participant_id
  });
  
  // Try to get clarification workflow data if available - placeholder for now
  let clarificationWorkflow = null;
  try {
    // TODO: This endpoint needs to be implemented if clarification workflow export is needed
    // const workflowData = await ctx.runQuery(internal.workflowData.getByIncident, {
    //   sessionToken: args.sessionToken,
    //   incident_id: args.incident_id
    // });
    // clarificationWorkflow = workflowData?.clarification_workflow;
    console.log('Clarification workflow data not yet implemented');
  } catch (error) {
    console.log('No clarification workflow data found:', error);
  }
  
  return {
    incident,
    narratives,
    participant,
    clarificationWorkflow
  };
}

/**
 * Add document header with title and generation info
 */
function addDocumentHeader(doc: jsPDF, incident: any, startY: number): number {
  let y = startY;
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INCIDENT DOCUMENTATION REPORT', 105, y, { align: 'center' });
  y += 10;
  
  // Generation timestamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const timestamp = new Date().toLocaleString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generated: ${timestamp}`, 105, y, { align: 'center' });
  
  return y + 20;
}

/**
 * Add incident overview section
 */
function addIncidentOverview(doc: jsPDF, data: IncidentData, startY: number): number {
  let y = startY;
  
  // Section header
  y = addSectionHeader(doc, '📋 INCIDENT OVERVIEW', y);
  
  const { incident } = data;
  
  // Format incident date
  const incidentDate = new Date(incident.event_date_time).toLocaleString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const created = new Date(incident.created_at).toLocaleString('en-AU');
  
  const overviewData = [
    [`Incident ID:`, incident._id],
    [`Participant:`, incident.participant_name],
    [`Date & Time:`, incidentDate],
    [`Location:`, incident.location],
    [`Reporter:`, incident.reporter_name],
    [`Created:`, created],
    [`Current Status:`, incident.overall_status?.replace('_', ' ').toUpperCase() || 'Unknown'],
    [`Capture Status:`, incident.capture_status?.replace('_', ' ').toUpperCase() || 'Unknown'],
    [`Questions Generated:`, incident.questions_generated ? 'Yes' : 'No'],
    [`Narrative Enhanced:`, incident.narrative_enhanced ? 'Yes' : 'No'],
    [`Analysis Generated:`, incident.analysis_generated ? 'Yes' : 'No']
  ];
  
  y = addKeyValueTable(doc, overviewData, y);
  
  return y + 10;
}

/**
 * Add participant information section  
 */
function addParticipantInformation(doc: jsPDF, data: IncidentData, startY: number): number {
  let y = startY;
  
  // Section header
  y = addSectionHeader(doc, '👤 PARTICIPANT INFORMATION', y);
  
  const { participant } = data;
  
  if (!participant) {
    doc.setFont('helvetica', 'italic');
    doc.text('Participant information not available', 20, y);
    return y + 15;
  }
  
  // Calculate age if DOB available
  let ageText = 'Unknown';
  if (participant.date_of_birth) {
    const dob = new Date(participant.date_of_birth);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const dobFormatted = dob.toLocaleDateString('en-AU');
    ageText = `${dobFormatted} (Age: ${age})`;
  }
  
  const participantData = [
    [`Full Name:`, `${participant.first_name} ${participant.last_name}`],
    [`Date of Birth:`, ageText],
    [`NDIS Number:`, participant.ndis_number || 'Not provided'],
    [`Support Level:`, participant.support_level?.toUpperCase() || 'Not specified'],
    [`Contact Phone:`, participant.contact_phone || 'Not provided'],
    [`Emergency Contact:`, participant.emergency_contact || 'Not provided']
  ];
  
  y = addKeyValueTable(doc, participantData, y);
  
  // Care notes
  if (participant.care_notes) {
    y = addSubsectionHeader(doc, 'Care Notes:', y);
    y = addWrappedText(doc, participant.care_notes, y);
  }
  
  return y + 10;
}

/**
 * Add brief narratives section
 */
function addBriefNarratives(doc: jsPDF, data: IncidentData, startY: number): number {
  let y = startY;
  
  // Section header
  y = addSectionHeader(doc, '📝 INCIDENT NARRATIVE - BRIEF SUMMARIES', y);
  
  const { narratives } = data;
  
  if (!narratives) {
    doc.setFont('helvetica', 'italic');
    doc.text('Narrative information not available', 20, y);
    return y + 15;
  }
  
  const phases = [
    { key: 'before_event', title: '🕐 BEFORE THE INCIDENT', icon: '🕐' },
    { key: 'during_event', title: '🚨 DURING THE INCIDENT', icon: '🚨' },  
    { key: 'end_event', title: '🏁 INCIDENT CONCLUSION', icon: '🏁' },
    { key: 'post_event', title: '📋 AFTER THE INCIDENT', icon: '📋' }
  ];
  
  for (const phase of phases) {
    const content = narratives[phase.key];
    if (content) {
      y = addSubsectionHeader(doc, phase.title, y);
      y = addWrappedText(doc, content, y);
      y += 5;
    }
  }
  
  return y + 10;
}

/**
 * Add detailed enhanced narratives section
 */
function addDetailedNarratives(doc: jsPDF, data: IncidentData, startY: number): number {
  let y = startY;
  
  // Section header
  y = addSectionHeader(doc, '📝 DETAILED ENHANCED NARRATIVES', y);
  
  const { narratives } = data;
  
  if (!narratives) {
    doc.setFont('helvetica', 'italic');
    doc.text('Enhanced narrative information not available', 20, y);
    return y + 15;
  }
  
  const phases = [
    { key: 'before_event_extra', title: '🕐 BEFORE THE INCIDENT - DETAILED', icon: '🕐' },
    { key: 'during_event_extra', title: '🚨 DURING THE INCIDENT - DETAILED', icon: '🚨' },  
    { key: 'end_event_extra', title: '🏁 INCIDENT CONCLUSION - DETAILED', icon: '🏁' },
    { key: 'post_event_extra', title: '📋 AFTER THE INCIDENT - DETAILED', icon: '📋' }
  ];
  
  for (const phase of phases) {
    const content = narratives[phase.key];
    if (content) {
      y = addSubsectionHeader(doc, phase.title, y);
      y = addWrappedText(doc, content, y);
      y += 10;
    }
  }
  
  return y + 10;
}

/**
 * Add questions and answers section
 */
function addQuestionsAndAnswers(doc: jsPDF, data: IncidentData, startY: number): number {
  let y = startY;
  
  // Section header
  y = addSectionHeader(doc, '❓ QUESTIONS & ANSWERS', y);
  
  const { clarificationWorkflow } = data;
  
  if (!clarificationWorkflow) {
    doc.setFont('helvetica', 'italic');
    doc.text('Questions and answers not available', 20, y);
    return y + 15;
  }
  
  const phases = [
    { key: 'before_event', title: '🕐 BEFORE EVENT - QUESTIONS & ANSWERS' },
    { key: 'during_event', title: '🚨 DURING EVENT - QUESTIONS & ANSWERS' },
    { key: 'end_event', title: '🏁 END EVENT - QUESTIONS & ANSWERS' },
    { key: 'post_event', title: '📋 POST EVENT - QUESTIONS & ANSWERS' }
  ];
  
  for (const phase of phases) {
    const phaseData = clarificationWorkflow[phase.key];
    if (phaseData && phaseData.questions && phaseData.answers) {
      y = addSubsectionHeader(doc, phase.title, y);
      
      // Show question count
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Total Questions: ${phaseData.questions.length}`, 20, y);
      y += 8;
      
      // Add Q&A pairs
      for (let i = 0; i < phaseData.questions.length; i++) {
        const question = phaseData.questions[i];
        const answer = phaseData.answers[i];
        
        if (question && answer) {
          // Question
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          y = addWrappedText(doc, `Q${i+1}: ${question.question_text}`, y);
          y += 3;
          
          // Answer
          doc.setFont('helvetica', 'normal');
          y = addWrappedText(doc, `A${i+1}: ${answer.answer_text}`, y);
          
          // Answer metadata
          if (answer.answered_at) {
            const answerDate = new Date(answer.answered_at).toLocaleString('en-AU');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(`(${answer.word_count} words, answered ${answerDate})`, 25, y);
            y += 5;
          }
          
          y += 5;
        }
      }
      
      y += 10;
    }
  }
  
  return y + 10;
}

/**
 * Add processing information section
 */
function addProcessingInformation(doc: jsPDF, data: IncidentData, startY: number): number {
  let y = startY;
  
  // Section header
  y = addSectionHeader(doc, '📊 PROCESSING INFORMATION', y);
  
  const { narratives } = data;
  
  const processingData = [
    [`Narrative Created:`, narratives?.created_at ? new Date(narratives.created_at).toLocaleString('en-AU') : 'Unknown'],
    [`Last Updated:`, narratives?.updated_at ? new Date(narratives.updated_at).toLocaleString('en-AU') : 'Unknown'],
    [`Narrative Version:`, narratives?.version?.toString() || 'Unknown'],
    [`Enhanced At:`, narratives?.enhanced_at ? new Date(narratives.enhanced_at).toLocaleString('en-AU') : 'Not enhanced']
  ];
  
  if (data.clarificationWorkflow) {
    const totalQuestions = Object.values(data.clarificationWorkflow).reduce((total: number, phase: any) => {
      return total + (phase?.questions?.length || 0);
    }, 0);
    
    const totalAnswers = Object.values(data.clarificationWorkflow).reduce((total: number, phase: any) => {
      return total + (phase?.answers?.length || 0);  
    }, 0);
    
    // Get AI model from first question if available
    const firstPhase = Object.values(data.clarificationWorkflow)[0] as any;
    const aiModel = firstPhase?.questions?.[0]?.ai_model || 'Unknown';
    const promptVersion = firstPhase?.questions?.[0]?.prompt_version || 'Unknown';
    
    processingData.push(
      [`Total Questions:`, totalQuestions.toString()],
      [`Total Answers:`, totalAnswers.toString()],
      [`Questions Generated by:`, aiModel],
      [`Prompt Version:`, promptVersion]
    );
  }
  
  y = addKeyValueTable(doc, processingData, y);
  
  return y + 10;
}

/**
 * Add document footer
 */
function addDocumentFooter(doc: jsPDF, incident: any): void {
  const pageHeight = doc.internal.pageSize.height;
  const y = pageHeight - 30;
  
  // Document metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Document ID: PDF-${incident._id}-${Date.now()}`, 20, y);
  doc.text(`Generated: ${new Date().toISOString()}`, 20, y + 5);
  doc.text('System: SupportSignal Incident Management', 20, y + 10);
  
  // Confidentiality notice
  doc.setFont('helvetica', 'bold');
  doc.text('🔒 Confidential - For authorized personnel only', 105, y + 20, { align: 'center' });
}

/**
 * Helper function to add section headers
 */
function addSectionHeader(doc: jsPDF, title: string, y: number): number {
  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, y);
  
  // Add underline
  doc.setLineWidth(0.5);
  doc.line(20, y + 2, 190, y + 2);
  
  return y + 15;
}

/**
 * Helper function to add subsection headers
 */
function addSubsectionHeader(doc: jsPDF, title: string, y: number): number {
  // Check if we need a new page
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, y);
  
  return y + 8;
}

/**
 * Helper function to add key-value table
 */
function addKeyValueTable(doc: jsPDF, data: string[][], y: number): number {
  doc.setFontSize(10);
  
  for (const [key, value] of data) {
    // Check if we need a new page
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(key, 20, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, y);
    y += 6;
  }
  
  return y;
}

/**
 * Helper function to add wrapped text
 */
function addWrappedText(doc: jsPDF, text: string, y: number, maxWidth: number = 170): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const lines = doc.splitTextToSize(text, maxWidth);
  
  for (const line of lines) {
    // Check if we need a new page
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.text(line, 20, y);
    y += 5;
  }
  
  return y + 5;
}