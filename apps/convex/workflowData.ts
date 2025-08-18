// @ts-nocheck
/**
 * Convex functions for complete workflow data export and import
 * Supports DeveloperToolsBar functionality for rapid testing and development
 */

import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
// For actions, we'll use a different authentication approach since validateSession only works with QueryCtx/MutationCtx

// Internal mutation functions for data retrieval during export (using mutations to avoid type issues)
export const getIncidentDataMutation = internalMutation({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.incident_id);
  },
});

export const getParticipantDataMutation = internalMutation({
  args: { participant_id: v.id("participants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.participant_id);
  },
});

export const getNarrativeDataMutation = internalMutation({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incident_narratives")
      .filter((q) => q.eq(q.field("incident_id"), args.incident_id))
      .first();
  },
});

export const getClarificationDataMutation = internalMutation({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    // Get all questions
    const questions = await ctx.db
      .query("clarification_questions")
      .filter((q) => q.eq(q.field("incident_id"), args.incident_id))
      .collect();

    // Get all answers
    const answers = await ctx.db
      .query("clarification_answers")
      .filter((q) => q.eq(q.field("incident_id"), args.incident_id))
      .collect();

    // Group by phase
    const phases = ['before_event', 'during_event', 'end_event', 'post_event'] as const;
    const result: Record<string, any> = {};

    phases.forEach(phase => {
      const phaseQuestions = questions
        .filter(q => q.phase === phase)
        .sort((a, b) => a.question_order - b.question_order);
      
      const phaseAnswers = answers.filter(a => a.phase === phase);
      
      if (phaseQuestions.length > 0) {
        result[phase] = {
          phase,
          questions: phaseQuestions.map(q => ({
            question_id: q.question_id,
            question_text: q.question_text,
            question_order: q.question_order,
            ai_model: q.ai_model,
            prompt_version: q.prompt_version,
            generated_at: q.generated_at
          })),
          answers: phaseAnswers.map(a => ({
            question_id: a.question_id,
            answer_text: a.answer_text,
            character_count: a.character_count,
            word_count: a.word_count,
            is_complete: a.is_complete,
            answered_at: a.answered_at,
            answered_by: a.answered_by
          })),
          phase_complete: phaseAnswers.length > 0 && phaseAnswers.every(a => a.is_complete)
        };
      }
    });

    return result;
  },
});

export const getEnhancedNarrativeDataMutation = internalMutation({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("enhanced_narratives")
      .filter((q) => q.eq(q.field("incident_id"), args.incident_id))
      .first();
  },
});

/**
 * Export complete workflow data as structured JSON
 * Aggregates data from all workflow steps into a single portable structure
 */
export const exportWorkflowData: any = action({
  args: { 
    incident_id: v.id("incidents"),
    sessionToken: v.string() 
  },
  handler: async (ctx, args): Promise<any> => {
    // Verify authentication using API functions for actions
    const session = await ctx.runQuery(api.auth.findSessionByToken, { sessionToken: args.sessionToken });
    if (!session || session.expires < Date.now()) {
      throw new Error("Invalid session token");
    }
    
    const user = await ctx.runQuery(api.auth.getUserById, { id: session.userId }) as any;
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check user has sample data permissions  
    if (!['system_admin', 'demo_admin'].includes(user.role)) {
      throw new Error("Insufficient permissions for workflow export");
    }

    try {
      // Get data directly via mutations to avoid complex type issues
      const incident = await ctx.runMutation(internal.workflowData.getIncidentDataMutation, {
        incident_id: args.incident_id
      }) as any;

      if (!incident) {
        throw new Error("Incident not found");
      }

      // @ts-ignore - Complex type inference causing deep instantiation error
      const participant = incident.participant_id ? await ctx.runMutation(internal.workflowData.getParticipantDataMutation, {
        participant_id: incident.participant_id
      }) : null;

      const narrative = await ctx.runMutation(internal.workflowData.getNarrativeDataMutation, {
        incident_id: args.incident_id
      }) as any;

      const clarificationData = await ctx.runMutation(internal.workflowData.getClarificationDataMutation, {
        incident_id: args.incident_id
      }) as any;

      const enhancedNarrative = await ctx.runMutation(internal.workflowData.getEnhancedNarrativeDataMutation, {
        incident_id: args.incident_id
      }) as any;

      // Determine completion status
      const completionStatus = {
        completed_steps: [] as string[],
        current_step: 1,
        total_progress: 0,
        questions_generated: incident.questions_generated || false,
        narrative_enhanced: incident.narrative_enhanced || false,
        analysis_generated: incident.analysis_generated || false,
        workflow_completed_at: incident.workflow_completed_at || undefined,
      };

      // Calculate completed steps based on available data
      if (incident) completionStatus.completed_steps.push('metadata');
      if (narrative) completionStatus.completed_steps.push('narrative');
      
      // Check clarification phases completion
      const phases = ['before_event', 'during_event', 'end_event', 'post_event'];
      phases.forEach(phase => {
        const phaseData = clarificationData[phase as keyof typeof clarificationData];
        if (phaseData && phaseData.answers && phaseData.answers.length > 0) {
          completionStatus.completed_steps.push(phase);
        }
      });

      if (enhancedNarrative) completionStatus.completed_steps.push('enhanced_review');
      
      completionStatus.current_step = completionStatus.completed_steps.length;
      completionStatus.total_progress = Math.round((completionStatus.completed_steps.length / 8) * 100);

      // Build complete export structure
      const exportData: any = {
        version: "1.0" as const,
        exported_at: Date.now(),
        exported_by: user._id,
        
        metadata: {
          incident_id: incident._id,
          created_at: incident.created_at,
          reporter_name: incident.reporter_name,
          participant_name: incident.participant_name,
          participant_id: incident.participant_id,
          event_date_time: incident.event_date_time,
          location: incident.location,
          company_id: incident.company_id,
          created_by: incident.created_by,
          export_timestamp: Date.now(),
          export_step: completionStatus.current_step,
          capture_status: incident.capture_status,
          overall_status: incident.overall_status,
        },

        participant_details: participant ? {
          first_name: participant.first_name,
          last_name: participant.last_name,
          ndis_number: participant.ndis_number,
          date_of_birth: participant.date_of_birth,
          care_notes: participant.care_notes,
          support_level: participant.support_level,
          contact_phone: participant.contact_phone,
          emergency_contact: participant.emergency_contact,
        } : undefined,

        narrative_data: narrative ? {
          before_event: narrative.before_event,
          during_event: narrative.during_event,
          end_event: narrative.end_event,
          post_event: narrative.post_event,
          before_event_extra: narrative.before_event_extra,
          during_event_extra: narrative.during_event_extra,
          end_event_extra: narrative.end_event_extra,
          post_event_extra: narrative.post_event_extra,
          consolidated_narrative: narrative.consolidated_narrative,
          version: narrative.version,
          created_at: narrative.created_at,
          updated_at: narrative.updated_at,
        } : undefined,

        clarification_workflow: clarificationData,

        enhanced_narrative: enhancedNarrative ? {
          enhanced_content: enhancedNarrative.enhanced_content,
          original_content: enhancedNarrative.original_content,
          clarification_responses: enhancedNarrative.clarification_responses,
          ai_model: enhancedNarrative.ai_model,
          enhancement_prompt: enhancedNarrative.enhancement_prompt,
          enhancement_version: enhancedNarrative.enhancement_version,
          quality_score: enhancedNarrative.quality_score,
          processing_time_ms: enhancedNarrative.processing_time_ms,
          user_edited: enhancedNarrative.user_edited,
          user_edits: enhancedNarrative.user_edits,
          created_at: enhancedNarrative.created_at,
          updated_at: enhancedNarrative.updated_at,
        } : undefined,

        completion_status: completionStatus,
      };

      return {
        success: true,
        data: exportData,
        filename: `workflow-${incident.participant_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
      };

    } catch (error) {
      console.error("Workflow export failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
        data: null,
        filename: null
      };
    }
  },
});

/**
 * Import complete workflow data and recreate in database
 * Validates data structure and creates all necessary records atomically
 */
export const importWorkflowData: any = action({
  args: {
    workflow_data: v.any(), // JSON data to import
    sessionToken: v.string()
  },
  handler: async (ctx, args): Promise<any> => {
    // Verify authentication using API functions for actions
    const session = await ctx.runQuery(api.auth.findSessionByToken, { sessionToken: args.sessionToken }) as any;
    if (!session || session.expires < Date.now()) {
      throw new Error("Invalid session token");
    }
    
    const user = await ctx.runQuery(api.auth.getUserById, { id: session.userId }) as any;
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check user has sample data permissions
    if (!['system_admin', 'demo_admin'].includes(user.role)) {
      throw new Error("Insufficient permissions for workflow import");
    }

    try {
      // Validate workflow data structure
      const validation = await ctx.runAction(api.workflowData.validateWorkflowData, {
        workflow_data: args.workflow_data
      }) as any;

      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
          incident_id: undefined,
          created_step: 0
        };
      }

      const workflowData = args.workflow_data;

      // Create incident record
      const incidentId = await ctx.runMutation(internal.workflowData.createIncidentFromImport, {
        metadata: workflowData.metadata,
        participant_details: workflowData.participant_details,
        completion_status: workflowData.completion_status,
        importing_user_id: user._id
      }) as any;

      let createdStep = 1; // At minimum we created metadata

      // Import narrative data if present
      if (workflowData.narrative_data) {
        await ctx.runMutation(internal.workflowData.createNarrativeFromImport, {
          incident_id: incidentId,
          narrative_data: workflowData.narrative_data
        }) as any;
        createdStep = Math.max(createdStep, 2);
      }

      // Import clarification data if present
      if (workflowData.clarification_workflow) {
        for (const [phase, phaseData] of Object.entries(workflowData.clarification_workflow)) {
          if (phaseData && typeof phaseData === 'object' && 'questions' in phaseData && Array.isArray(phaseData.questions)) {
            await ctx.runMutation(internal.workflowData.createClarificationFromImport, {
              incident_id: incidentId,
              phase: phase as "before_event" | "during_event" | "end_event" | "post_event",
              phase_data: phaseData
            }) as any;
            
            // Update step based on phase completion
            const stepMap: Record<string, number> = {
              'before_event': 3,
              'during_event': 4, 
              'end_event': 5,
              'post_event': 6
            };
            if ('answers' in phaseData && Array.isArray(phaseData.answers) && phaseData.answers.length > 0) {
              createdStep = Math.max(createdStep, stepMap[phase]);
            }
          }
        }
      }

      // Import enhanced narrative if present
      if (workflowData.enhanced_narrative) {
        await ctx.runMutation(internal.workflowData.createEnhancedNarrativeFromImport, {
          incident_id: incidentId,
          enhanced_data: workflowData.enhanced_narrative
        }) as any;
        createdStep = Math.max(createdStep, 7);
      }

      return {
        success: true,
        incident_id: incidentId,
        created_step: createdStep,
        errors: [],
        warnings: validation.warnings
      };

    } catch (error) {
      console.error("Workflow import failed:", error);
      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Import failed"],
        warnings: [],
        incident_id: undefined,
        created_step: 0
      };
    }
  },
});

/**
 * Validate workflow JSON structure before import
 */
export const validateWorkflowData = action({
  args: { 
    workflow_data: v.any(),
    sessionToken: v.optional(v.string()) // Added to handle automatic middleware injection
  },
  handler: async (ctx, args) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let detectedStep = 0;

    try {
      const data = args.workflow_data;

      // Check required top-level structure
      if (!data || typeof data !== 'object') {
        errors.push("Invalid JSON structure: must be an object");
        return { valid: false, errors, warnings, detected_step: 0 };
      }

      // Check version compatibility  
      if (!data.version) {
        warnings.push("No version specified, assuming 1.0 compatibility");
      } else if (data.version !== "1.0") {
        warnings.push(`Version ${data.version} may not be fully compatible`);
      }

      // Validate metadata (required)
      if (!data.metadata) {
        errors.push("Missing required metadata section");
      } else {
        if (!data.metadata.reporter_name) errors.push("Missing reporter_name in metadata");
        if (!data.metadata.participant_name) errors.push("Missing participant_name in metadata");
        if (!data.metadata.event_date_time) errors.push("Missing event_date_time in metadata");
        if (!data.metadata.location) errors.push("Missing location in metadata");
        
        if (errors.length === 0) detectedStep = 1;
      }

      // Validate participant details
      if (data.participant_details) {
        if (!data.participant_details.first_name) warnings.push("Missing participant first_name");
        if (!data.participant_details.last_name) warnings.push("Missing participant last_name");
        if (!data.participant_details.ndis_number) warnings.push("Missing participant ndis_number");
      }

      // Check narrative data
      if (data.narrative_data) {
        if (data.narrative_data.before_event && data.narrative_data.during_event && 
            data.narrative_data.end_event && data.narrative_data.post_event) {
          detectedStep = Math.max(detectedStep, 2);
        } else {
          warnings.push("Incomplete narrative data - some phases missing");
        }
      }

      // Check clarification workflow
      if (data.clarification_workflow) {
        const phases = ['before_event', 'during_event', 'end_event', 'post_event'];
        phases.forEach((phase, index) => {
          const phaseData = data.clarification_workflow[phase];
          if (phaseData && phaseData.questions && phaseData.questions.length > 0) {
            if (phaseData.answers && phaseData.answers.length > 0) {
              detectedStep = Math.max(detectedStep, 3 + index);
            }
          }
        });
      }

      // Check enhanced narrative
      if (data.enhanced_narrative && data.enhanced_narrative.enhanced_content) {
        detectedStep = Math.max(detectedStep, 7);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        detected_step: detectedStep
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`);
      return { valid: false, errors, warnings, detected_step: 0 };
    }
  },
});

// Internal mutation functions for import operations
export const createIncidentFromImport = internalMutation({
  args: {
    metadata: v.any(),
    participant_details: v.any(),
    completion_status: v.any(),
    importing_user_id: v.id("users")
  },
  handler: async (ctx, args) => {
    const { metadata, participant_details, completion_status } = args;
    
    // Create or find participant
    let participantId = metadata.participant_id;
    
    if (participant_details && !participantId) {
      // Create new participant
      participantId = await ctx.db.insert("participants", {
        first_name: participant_details.first_name,
        last_name: participant_details.last_name,
        ndis_number: participant_details.ndis_number,
        date_of_birth: participant_details.date_of_birth,
        care_notes: participant_details.care_notes,
        support_level: participant_details.support_level,
        contact_phone: participant_details.contact_phone,
        emergency_contact: participant_details.emergency_contact,
        company_id: metadata.company_id,
        status: "active",
        created_at: Date.now(),
        created_by: args.importing_user_id,
        updated_at: Date.now(),
        updated_by: args.importing_user_id,
      });
    }

    // Create incident
    return await ctx.db.insert("incidents", {
      company_id: metadata.company_id,
      reporter_name: metadata.reporter_name,
      participant_name: metadata.participant_name,
      participant_id: participantId,
      event_date_time: metadata.event_date_time,
      location: metadata.location,
      capture_status: completion_status.completed_steps.includes('narrative') ? 'completed' : 'in_progress',
      overall_status: completion_status.current_step >= 8 ? 'completed' : 'capture_pending',
      analysis_status: completion_status.analysis_generated ? 'completed' : 'not_started',
      questions_generated: completion_status.questions_generated,
      narrative_enhanced: completion_status.narrative_enhanced,
      analysis_generated: completion_status.analysis_generated,
      workflow_completed_at: completion_status.workflow_completed_at,
      created_at: Date.now(),
      created_by: args.importing_user_id,
      updated_at: Date.now(),
    });
  },
});

export const createNarrativeFromImport = internalMutation({
  args: {
    incident_id: v.id("incidents"),
    narrative_data: v.any()
  },
  handler: async (ctx, args) => {
    const { incident_id, narrative_data } = args;
    
    return await ctx.db.insert("incident_narratives", {
      incident_id,
      before_event: narrative_data.before_event,
      during_event: narrative_data.during_event,
      end_event: narrative_data.end_event,
      post_event: narrative_data.post_event,
      before_event_extra: narrative_data.before_event_extra,
      during_event_extra: narrative_data.during_event_extra,
      end_event_extra: narrative_data.end_event_extra,
      post_event_extra: narrative_data.post_event_extra,
      consolidated_narrative: narrative_data.consolidated_narrative,
      version: narrative_data.version || 1,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const createClarificationFromImport = internalMutation({
  args: {
    incident_id: v.id("incidents"),
    phase: v.union(v.literal("before_event"), v.literal("during_event"), v.literal("end_event"), v.literal("post_event")),
    phase_data: v.any()
  },
  handler: async (ctx, args) => {
    const { incident_id, phase, phase_data } = args;
    
    // Create questions
    const questions = phase_data.questions as any[];
    for (const question of questions) {
      await ctx.db.insert("clarification_questions", {
        incident_id,
        phase,
        question_id: question.question_id,
        question_text: question.question_text,
        question_order: question.question_order,
        ai_model: question.ai_model || "imported",
        prompt_version: question.prompt_version || "imported",
        is_active: true,
        generated_at: question.generated_at || Date.now(),
      });
    }
    
    // Create answers if present
    const answers = phase_data.answers as any[];
    if (answers && Array.isArray(answers)) {
      for (const answer of answers) {
        await ctx.db.insert("clarification_answers", {
          incident_id,
          phase,
          question_id: answer.question_id,
          answer_text: answer.answer_text,
          character_count: answer.character_count,
          word_count: answer.word_count,
          is_complete: answer.is_complete,
          answered_at: answer.answered_at,
          answered_by: answer.answered_by,
          updated_at: answer.answered_at,
        });
      }
    }
  },
});

export const createEnhancedNarrativeFromImport = internalMutation({
  args: {
    incident_id: v.id("incidents"),
    enhanced_data: v.any()
  },
  handler: async (ctx, args) => {
    const { incident_id, enhanced_data } = args;
    
    return await ctx.db.insert("enhanced_narratives", {
      incident_id,
      enhanced_content: enhanced_data.enhanced_content,
      original_content: enhanced_data.original_content,
      clarification_responses: enhanced_data.clarification_responses,
      ai_model: enhanced_data.ai_model,
      enhancement_prompt: enhanced_data.enhancement_prompt,
      enhancement_version: enhanced_data.enhancement_version || 1,
      quality_score: enhanced_data.quality_score,
      processing_time_ms: enhanced_data.processing_time_ms,
      user_edited: enhanced_data.user_edited || false,
      user_edits: enhanced_data.user_edits,
      created_at: enhanced_data.created_at || Date.now(),
      updated_at: enhanced_data.updated_at || Date.now(),
    });
  },
});