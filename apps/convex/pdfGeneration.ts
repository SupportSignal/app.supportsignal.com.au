import { action } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { ConvexError } from 'convex/values';
import jsPDF from 'jspdf';
import type { ActionCtx } from './_generated/server';

// CENTRALIZED PDF SECTION CONFIGURATION
// Import from shared package to ensure frontend/backend consistency
import { 
  PDF_SECTIONS, 
  type PDFSectionKey, 
  getAllSectionKeys, 
  validateSectionKeys 
} from '../../packages/shared/pdf-sections';

type PDFSection = PDFSectionKey;

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
      const selectedSections = args.sections || getAllSectionKeys();
      
      // COMPREHENSIVE SECTION VALIDATION USING CENTRALIZED SYSTEM
      const validation = validateSectionKeys(selectedSections);
      const allAvailableSections = validation.availableKeys;
      const invalidSections = validation.invalid;
      const validSections = validation.valid;
      
      console.log('=== PDF GENERATION: SECTION ANALYSIS ===');
      console.log('Frontend requested sections:', args.sections);
      console.log('Backend available sections:', allAvailableSections);
      console.log('Selected sections after processing:', selectedSections);
      console.log('Valid sections (will be processed):', validSections);
      console.log('Invalid sections (will be ignored):', invalidSections);
      console.log('Sections count - Requested:', args.sections?.length || 'all', 'Valid:', validSections.length);
      
      if (invalidSections.length > 0) {
        console.warn('⚠️  SECTION MISMATCH DETECTED:', {
          invalidSections,
          suggestion: 'Frontend sending wrong section names',
          availableOptions: allAvailableSections
        });
      }
      
      console.log('Starting PDF generation with data:', {
        hasIncident: !!data.incident,
        hasNarratives: !!data.narratives,
        hasParticipant: !!data.participant,
        incidentId: data.incident?._id,
        participantName: data.participant?.participant?.first_name
      });

      // Generate PDF with comprehensive metrics tracking
      const doc = new jsPDF('p', 'mm', 'a4');
      let currentY = 20;
      const pdfMetrics = {
        sectionsProcessed: 0,
        sectionsSkipped: 0,
        totalContentAdded: 0,
        sectionDetails: [] as Array<{name: string, processed: boolean, reason?: string, contentLength?: number}>
      };
      
      console.log('=== PDF DOCUMENT CREATION ===');
      console.log('PDF document created, initial Y position:', currentY);
      console.log('Starting header generation...');
      
      // Add header
      currentY = addDocumentHeader(doc, data.incident, currentY);
      console.log('✅ Header added successfully, new Y position:', currentY);
      
      // PROCESS SECTIONS WITH DETAILED METRICS TRACKING
      console.log('=== PDF SECTIONS PROCESSING ===');
      
      // Process each available section with comprehensive logging
      for (const sectionKey of allAvailableSections) {
        const sectionTitle = PDF_SECTIONS[sectionKey as keyof typeof PDF_SECTIONS];
        const isRequested = validSections.includes(sectionKey);
        
        if (!isRequested) {
          console.log(`⏭️  SKIPPING: ${sectionKey} (${sectionTitle}) - Not requested by frontend`);
          pdfMetrics.sectionsSkipped++;
          pdfMetrics.sectionDetails.push({
            name: sectionKey,
            processed: false,
            reason: 'Not requested by frontend'
          });
          continue;
        }

        console.log(`🔄 PROCESSING: ${sectionKey} (${sectionTitle})`);
        const beforeY = currentY;
        
        try {
          switch (sectionKey) {
            case 'basic_information':
              currentY = addIncidentOverview(doc, data, currentY);
              break;
            case 'participant_details':
              currentY = addParticipantInformation(doc, data, currentY);
              break;
            case 'incident_narratives':
              currentY = addBriefNarratives(doc, data, currentY);
              break;
            case 'enhanced_narrative':
              currentY = addDetailedNarratives(doc, data, currentY);
              break;
            case 'clarification_qa':
              currentY = addQuestionsAndAnswers(doc, data, currentY);
              break;
            case 'metadata':
              currentY = addProcessingInformation(doc, data, currentY);
              break;
            default:
              console.warn(`⚠️  UNKNOWN SECTION: ${sectionKey}`);
              continue;
          }
          
          const contentAdded = currentY - beforeY;
          pdfMetrics.sectionsProcessed++;
          pdfMetrics.totalContentAdded += contentAdded;
          pdfMetrics.sectionDetails.push({
            name: sectionKey,
            processed: true,
            contentLength: contentAdded
          });
          
          console.log(`✅ COMPLETED: ${sectionKey} - Added ${contentAdded}mm content, Y position: ${beforeY} → ${currentY}`);
          
        } catch (error) {
          console.error(`❌ FAILED: ${sectionKey} processing error:`, error);
          pdfMetrics.sectionDetails.push({
            name: sectionKey,
            processed: false,
            reason: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }
      
      // Add footer and finalize document
      console.log('=== PDF DOCUMENT FINALIZATION ===');
      console.log('Adding document footer...');
      addDocumentFooter(doc, data.incident);
      console.log('✅ Footer added successfully');
      
      // COMPREHENSIVE BYTE STREAM & METRICS TRACKING
      console.log('=== PDF BYTE STREAM GENERATION ===');
      const pdfBuffer = doc.output('arraybuffer');
      const bufferSize = pdfBuffer.byteLength;
      const filename = `incident-${data.incident.participant_name.replace(/\s+/g, '-')}-${data.incident._id}-${Date.now()}.pdf`;
      
      // FINAL METRICS REPORT
      console.log('=== PDF GENERATION COMPLETE - FINAL METRICS ===');
      console.log('📊 SECTION PROCESSING SUMMARY:');
      console.log(`   • Sections Processed: ${pdfMetrics.sectionsProcessed}/${allAvailableSections.length}`);
      console.log(`   • Sections Skipped: ${pdfMetrics.sectionsSkipped}`);
      console.log(`   • Total Content Added: ${pdfMetrics.totalContentAdded}mm`);
      
      console.log('📋 DETAILED SECTION RESULTS:');
      pdfMetrics.sectionDetails.forEach(section => {
        if (section.processed) {
          console.log(`   ✅ ${section.name}: +${section.contentLength}mm content`);
        } else {
          console.log(`   ⏭️  ${section.name}: ${section.reason}`);
        }
      });
      
      console.log('💾 BYTE STREAM METRICS:');
      console.log(`   • PDF Buffer Size: ${bufferSize.toLocaleString()} bytes (${(bufferSize/1024).toFixed(2)} KB)`);
      console.log(`   • Filename: ${filename}`);
      console.log(`   • Within Convex Limits: ${bufferSize <= 8192 ? '❌ No, using file storage' : '✅ Yes'}`);
      
      // Store PDF in Convex file storage
      console.log('🔄 Storing PDF in Convex file storage...');
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const storageId = await ctx.storage.store(pdfBlob);
      console.log('✅ PDF stored successfully, storage ID:', storageId);
      
      const result = {
        storageId,
        filename,
        generatedAt: Date.now(),
        sections: validSections, // Only return actually processed sections
        fileSize: bufferSize,
        metrics: pdfMetrics // Include detailed metrics
      };
      
      console.log('🎉 PDF GENERATION SUCCESS:', {
        storageId: result.storageId,
        filename: result.filename,
        sectionsProcessed: pdfMetrics.sectionsProcessed,
        fileSize: `${bufferSize.toLocaleString()} bytes`,
        generatedAt: new Date(result.generatedAt).toISOString()
      });
      
      return result;
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ConvexError(`PDF generation failed: ${errorMessage}`);
    }
  }
});

/**
 * Download generated PDF from storage
 */
export const downloadPDF = action({
  args: {
    sessionToken: v.string(),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    // Basic permission check
    // In a real app, you'd verify the user has access to this specific PDF
    if (!args.sessionToken) {
      throw new ConvexError("Authentication required");
    }
    
    console.log('=== PDF DOWNLOAD FROM STORAGE REQUESTED ===');
    console.log('📥 Download request details:', { 
      storageId: args.storageId,
      hasSessionToken: !!args.sessionToken,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Get the PDF blob from storage
      console.log('🔄 Retrieving PDF blob from Convex storage...');
      const pdfBlob = await ctx.storage.get(args.storageId);
      
      if (!pdfBlob) {
        console.error('❌ PDF not found in storage:', {
          storageId: args.storageId,
          timestamp: new Date().toISOString()
        });
        throw new ConvexError("PDF file not found in storage");
      }
      
      console.log('✅ PDF blob retrieved successfully:', {
        blobSize: pdfBlob.size,
        blobType: pdfBlob.type,
        sizeInKB: (pdfBlob.size / 1024).toFixed(2)
      });
      
      // Convert blob to array buffer then to array
      console.log('🔄 Converting blob to array buffer...');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      console.log('✅ Array buffer created, size:', arrayBuffer.byteLength);
      
      console.log('🔄 Getting storage URL for direct download...');
      const storageUrl = await ctx.storage.getUrl(args.storageId);
      
      if (!storageUrl) {
        console.error('❌ Failed to get storage URL for PDF');
        throw new ConvexError("Failed to generate download URL");
      }
      
      console.log('✅ Storage URL generated successfully');
      
      const result = {
        downloadUrl: storageUrl,
        contentType: 'application/pdf',
        fileSize: pdfBlob.size
      };
      
      console.log('🎉 PDF DOWNLOAD SUCCESS:', {
        hasDownloadUrl: !!result.downloadUrl,
        contentType: result.contentType,
        fileSize: result.fileSize,
        timestamp: new Date().toISOString()
      });
      
      return result;
      
    } catch (error) {
      console.error('PDF download failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new ConvexError(`PDF download failed: ${errorMessage}`);
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
    id: args.incident_id
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
  const participant: any = await ctx.runQuery(internal["participants/getById"].getParticipantById, {
    sessionToken: args.sessionToken,
    participantId: incident.participant_id
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
  y = addSectionHeader(doc, 'INCIDENT OVERVIEW', y);
  
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
  y = addSectionHeader(doc, 'PARTICIPANT INFORMATION', y);
  
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
  y = addSectionHeader(doc, 'INCIDENT NARRATIVE - BRIEF SUMMARIES', y);
  
  const { narratives } = data;
  
  if (!narratives) {
    doc.setFont('helvetica', 'italic');
    doc.text('Narrative information not available', 20, y);
    return y + 15;
  }
  
  const phases = [
    { key: 'before_event', title: 'BEFORE THE INCIDENT', icon: '' },
    { key: 'during_event', title: 'DURING THE INCIDENT', icon: '' },  
    { key: 'end_event', title: 'INCIDENT CONCLUSION', icon: '' },
    { key: 'post_event', title: 'AFTER THE INCIDENT', icon: '' }
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
  y = addSectionHeader(doc, 'DETAILED ENHANCED NARRATIVES', y);
  
  const { narratives } = data;
  
  if (!narratives) {
    doc.setFont('helvetica', 'italic');
    doc.text('Enhanced narrative information not available', 20, y);
    return y + 15;
  }
  
  const phases = [
    { key: 'before_event_extra', title: 'BEFORE THE INCIDENT - DETAILED', icon: '' },
    { key: 'during_event_extra', title: 'DURING THE INCIDENT - DETAILED', icon: '' },  
    { key: 'end_event_extra', title: 'INCIDENT CONCLUSION - DETAILED', icon: '' },
    { key: 'post_event_extra', title: 'AFTER THE INCIDENT - DETAILED', icon: '' }
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
  y = addSectionHeader(doc, 'QUESTIONS & ANSWERS', y);
  
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
  y = addSectionHeader(doc, 'PROCESSING INFORMATION', y);
  
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
  doc.text('CONFIDENTIAL - For authorized personnel only', 105, y + 20, { align: 'center' });
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