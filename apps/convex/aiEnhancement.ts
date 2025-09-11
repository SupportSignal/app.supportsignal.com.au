// @ts-nocheck
// AI Enhancement functions for Story 3.3: Narrative Enhancement & Completion

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { ConvexError } from "convex/values";
import { requirePermission, PERMISSIONS } from './permissions';
import { internal } from './_generated/api';
import { api } from './_generated/api';



/**
 * Get enhanced narrative by incident ID
 */
export const getEnhancedNarrative = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Get user first to obtain company context
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT // Basic permission to get user info
    );

    // Get the incident to check if user can access it (either owns it or has company-wide access)
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError('Incident not found');
    }

    // Check if user can access this incident (owns it OR has company-wide permissions)
    const canAccessIncident = 
      incident.created_by === user._id || // User owns the incident
      (user.company_id === incident.company_id && // Same company AND
       (user.role === 'team_lead' || user.role === 'company_admin' || user.role === 'system_admin')); // Has elevated role

    if (!canAccessIncident) {
      throw new ConvexError('Insufficient permissions to enhance this incident');
    }
    
    // Get enhanced narrative content from the incident_narratives table
    // Enhanced content is stored as *_extra fields in this table
    const narratives = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();
    
    // Check if enhanced content exists in the *_extra fields
    const hasEnhancedContent = narratives && (
      narratives.before_event_extra || 
      narratives.during_event_extra || 
      narratives.end_event_extra || 
      narratives.post_event_extra
    );
    
    // Return enhanced narrative data if it exists
    if (hasEnhancedContent) {
      return {
        _id: narratives._id,
        incident_id: narratives.incident_id,
        enhanced_content: {
          before_event_extra: narratives.before_event_extra,
          during_event_extra: narratives.during_event_extra,
          end_event_extra: narratives.end_event_extra,
          post_event_extra: narratives.post_event_extra
        },
        original_content: {
          before_event: narratives.before_event,
          during_event: narratives.during_event,
          end_event: narratives.end_event,
          post_event: narratives.post_event
        },
        user_edited: false, // Not tracking this for *_extra fields yet
        created_at: narratives.created_at,
        updated_at: narratives.updated_at,
      };
    }
    
    return null;
  },
});

/**
 * Validate workflow completion status
 */
export const validateWorkflowCompletion = query({
  args: { 
    sessionToken: v.string(),
    incident_id: v.id("incidents") 
  },
  handler: async (ctx, args) => {
    // Check permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS
    );
    
    // Get incident
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }
    
    // Get narratives
    const narratives = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();
    
    // Get clarification answers
    const clarificationAnswers = await ctx.db
      .query("clarification_answers")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .collect();
    
    // Check for enhanced narrative content in the narratives data
    // Enhanced content is stored as *_extra fields in the incident_narratives table
    const hasEnhancedContent = !!(narratives && (
      narratives.before_event_extra || 
      narratives.during_event_extra || 
      narratives.end_event_extra || 
      narratives.post_event_extra
    ));
    
    // Validate completion checklist
    const checklist = {
      metadata_complete: !!(incident.participant_name && incident.location && incident.event_date_time),
      narratives_complete: !!(narratives && 
        narratives.before_event && 
        narratives.during_event && 
        narratives.end_event && 
        narratives.post_event),
      clarifications_complete: clarificationAnswers.length > 0,
      enhancement_complete: hasEnhancedContent,
      validation_passed: true, // Add specific validation logic as needed
    };
    
    const allComplete = Object.values(checklist).every(status => status === true);
    
    return {
      checklist,
      all_complete: allComplete,
      missing_requirements: Object.entries(checklist)
        .filter(([, status]) => !status)
        .map(([requirement]) => requirement),
    };
  },
});

/**
 * Submit incident for analysis workflow handoff
 */
export const submitIncidentForAnalysis = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    // enhanced_narrative_id removed - now using *_extra fields in incident_narratives
  },
  handler: async (ctx, args) => {
    // Check permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE
    );
    
    // Validate workflow completion inline
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Get narratives
    const narratives = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    // Get clarification answers
    const clarificationAnswers = await ctx.db
      .query("clarification_answers")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .collect();

    // Check for enhanced narrative content in the narratives data
    // Enhanced content is stored as *_extra fields in the incident_narratives table
    const hasEnhancedContent = !!(narratives && (
      narratives.before_event_extra || 
      narratives.during_event_extra || 
      narratives.end_event_extra || 
      narratives.post_event_extra
    ));

    // Validate completion checklist
    const checklist = {
      metadata_complete: !!(incident.participant_name && incident.location && incident.event_date_time),
      narratives_complete: !!(narratives && 
        narratives.before_event && 
        narratives.during_event && 
        narratives.end_event && 
        narratives.post_event),
      clarifications_complete: clarificationAnswers.length > 0,
      enhancement_complete: hasEnhancedContent,
      validation_passed: true,
    };

    const validation = {
      checklist,
      all_complete: Object.values(checklist).every(status => status === true),
      missing_requirements: Object.entries(checklist)
        .filter(([, status]) => !status)
        .map(([requirement]) => requirement),
    };
    
    if (!validation.all_complete) {
      throw new ConvexError(`Workflow incomplete. Missing: ${validation.missing_requirements.join(', ')}`);
    }
    
    // Update incident status
    await ctx.db.patch(args.incident_id, {
      enhanced_narrative_id: args.enhanced_narrative_id,
      workflow_completed_at: Date.now(),
      submitted_by: user._id,
      submitted_at: Date.now(),
      handoff_status: "ready_for_analysis",
      completion_checklist: validation.checklist,
      capture_status: "completed",
      updated_at: Date.now(),
    });
    
    // Create handoff notification
    const handoffId = await ctx.db.insert("workflow_handoffs", {
      incident_id: args.incident_id,
      from_workflow: "incident_capture",
      to_workflow: "incident_analysis",
      handoff_data: {
        enhanced_narrative_id: args.enhanced_narrative_id,
        submitted_by: user._id,
        completion_checklist: validation.checklist,
      },
      team_leader_notified: false,
      handoff_accepted: false,
      created_at: Date.now(),
    });
    
    console.log('🚀 INCIDENT SUBMITTED FOR ANALYSIS', {
      incidentId: args.incident_id,
      userId: user._id,
      handoffId,
      timestamp: new Date().toISOString(),
    });
    
    return { 
      success: true,
      handoff_id: handoffId,
      message: "Incident submitted for analysis workflow"
    };
  },
});

/**
 * Enhance a specific narrative phase by combining original narrative with clarification responses
 */
export const enhanceNarrativePhase = action({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    phase: v.union(v.literal("before_event"), v.literal("during_event"), v.literal("end_event"), v.literal("post_event")),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();
    
    try {
      // Authenticate user
      const user = await ctx.runQuery(internal.auth.verifySession, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        throw new ConvexError("Authentication required");
      }

      // Check permissions
      const permissionCheck = await ctx.runQuery(internal.permissions.checkPermission, {
        sessionToken: args.sessionToken,
        permission: PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
      });

      if (!permissionCheck.hasPermission) {
        throw new ConvexError(`Permission required: ${permissionCheck.reason}`);
      }
      
      // Get incident data
      const incident = await ctx.runQuery(internal.incidents.getIncidentById, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
      });
      if (!incident) {
        throw new ConvexError("Incident not found");
      }
      
      // Get narratives
      const narratives = await ctx.runQuery(internal.narratives.getByIncident, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
      });
      
      if (!narratives) {
        throw new ConvexError("Incident narratives not found");
      }
      
      // Get phase-specific original narrative
      const phaseOriginalNarrative = narratives[args.phase] || '';
      if (!phaseOriginalNarrative.trim()) {
        throw new ConvexError(`No original narrative found for phase: ${args.phase}`);
      }
      
      // Get phase-specific clarification responses
      console.log('🔍 Querying clarification answers:', {
        incident_id: args.incident_id,
        phase: args.phase,
        correlationId,
      });
      
      const clarificationAnswers = await ctx.runQuery(internal.aiClarification.getClarificationAnswers, {
        sessionToken: args.sessionToken,
        incident_id: args.incident_id,
        phase: args.phase,
      });
      
      console.log('📋 Clarification answers retrieved:', {
        count: clarificationAnswers?.length || 0,
        phase: args.phase,
        hasAnswers: clarificationAnswers?.length > 0,
        sampleAnswer: clarificationAnswers?.[0] ? {
          question: clarificationAnswers[0].question_text?.substring(0, 50),
          answer: clarificationAnswers[0].answer_text?.substring(0, 50)
        } : 'none',
        correlationId,
      });
      
      // Format clarification responses for this phase
      const phaseClarificationText = clarificationAnswers
        .filter(answer => answer.answer_text && answer.answer_text.trim())
        .map(answer => `Q: ${answer.question_text}\nA: ${answer.answer_text}`)
        .join('\n\n');
      
      // Get active prompt template
      const prompt = await ctx.runQuery(internal.promptManager.getActivePrompt, {
        prompt_name: "enhance_narrative",
        subsystem: "incidents",
      });
      
      let enhancedContent: string;
      let aiSuccess = true;
      let errorMessage: string | undefined;
      
      try {
        // Format clarification responses as question/answer pairs for AI service
        const formattedAnswers = clarificationAnswers.map(answer => ({
          question: answer.question_text || '',
          answer: answer.answer_text || '',
        }));

        // Map phase names to match AI service expectations
        const phaseMapping: Record<string, string> = {
          "before_event": "before_event",
          "during_event": "during_event", 
          "end_event": "end_of_event",
          "post_event": "post_event_support"
        };

        // Call the existing AI service (now works because this is an action)
        const aiResult = await ctx.runAction(api.aiOperations.enhanceNarrativeContent, {
          phase: phaseMapping[args.phase] || args.phase,
          instruction: phaseOriginalNarrative,
          answers: formattedAnswers,
          incident_id: args.incident_id,
          user_id: user._id,
        });

        if (aiResult && (aiResult.output || aiResult.narrative)) {
          enhancedContent = aiResult.narrative || aiResult.output;
          console.log(`✅ AI enhancement successful for ${args.phase}:`, {
            contentLength: enhancedContent.length,
            hasMetadata: !!aiResult.metadata,
            correlationId: aiResult.metadata?.correlation_id
          });
        } else {
          throw new Error(`AI enhancement failed: Invalid response format - ${JSON.stringify(aiResult)}`);
        }
        
      } catch (aiError) {
        console.warn(`AI service failed for ${args.phase}, falling back to enhanced text formatting:`, aiError);
        aiSuccess = false;
        errorMessage = aiError instanceof Error ? aiError.message : "AI service unavailable";
        
        // Generate enhanced fallback (better than mock)
        enhancedContent = generateFallbackEnhancement({
          phase: args.phase,
          original_narrative: phaseOriginalNarrative,
          clarification_responses: phaseClarificationText,
          participant_name: incident.participant_name,
        });
      }
      
      const processingTime = Date.now() - startTime;
      
      // Log the AI request for monitoring
      await ctx.runMutation(api.aiLogging.logAIRequest, {
        correlationId: correlationId,
        operation: `enhanceNarrativePhase-${args.phase}`,
        model: prompt?.ai_model || "mock-service",
        promptTemplate: prompt?.prompt_name || "enhance_narrative",
        inputData: { 
          incident_id: args.incident_id, 
          phase: args.phase,
          original_length: phaseOriginalNarrative.length,
          clarifications_count: clarificationAnswers.length,
        },
        outputData: aiSuccess ? { enhanced_content: enhancedContent } : null,
        processingTimeMs: processingTime,
        tokensUsed: 0, // Not available from this context
        cost: 0, // Not available from this context
        success: aiSuccess,
        error: errorMessage,
        userId: user._id,
        incidentId: args.incident_id,
      });
      
      // Save enhanced content to the incident_narratives table
      await ctx.runMutation(internal.narratives.updateEnhancedContent, {
        sessionToken: args.sessionToken,
        narratives_id: narratives._id,
        phase: args.phase,
        enhanced_content: enhancedContent,
      });

      // Update prompt usage statistics
      if (prompt) {
        await ctx.runMutation(internal.promptManager.updatePromptUsage, {
          prompt_name: prompt.prompt_name,
          response_time_ms: processingTime,
          success: aiSuccess,
        });
      }
      
      return {
        phase: args.phase,
        enhanced_content: enhancedContent,
        original_content: phaseOriginalNarrative,
        clarification_count: clarificationAnswers.length,
        correlation_id: correlationId,
        processing_time_ms: processingTime,
        ai_model_used: prompt?.ai_model || "mock-service",
        success: aiSuccess,
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Log failed request
      try {
        await ctx.runMutation(api.aiLogging.logAIRequest, {
          correlationId: correlationId,
          operation: `enhanceNarrativePhase-${args.phase}`,
          model: "unknown",
          promptTemplate: "enhance_narrative",
          inputData: { incident_id: args.incident_id, phase: args.phase },
          outputData: null,
          processingTimeMs: processingTime,
          tokensUsed: 0,
          cost: 0,
          success: false,
          error: errorMessage,
          userId: undefined,
          incidentId: args.incident_id,
        });
      } catch (logError) {
        console.error("Failed to log AI request error:", logError);
      }
      
      throw error;
    }
  },
});

// Enhanced fallback for when AI service is unavailable - produces properly formatted output
function generateFallbackEnhancement({
  phase,
  original_narrative,
  clarification_responses,
  participant_name,
}: {
  phase: string;
  original_narrative: string;
  clarification_responses: string;
  participant_name: string;
}): string {
  // Start with cleaned original narrative
  let enhanced = original_narrative
    .replace(/\. \. /g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Parse and intelligently integrate clarification responses
  if (clarification_responses && clarification_responses.trim()) {
    const responses = clarification_responses.split('\n\n');
    const additionalDetails: string[] = [];
    
    responses.forEach(response => {
      const answerMatch = response.match(/A: (.+)/s);
      if (answerMatch && answerMatch[1].trim()) {
        let detail = answerMatch[1].trim();
        // Ensure proper sentence structure
        if (!detail.endsWith('.') && !detail.endsWith('!') && !detail.endsWith('?')) {
          detail += '.';
        }
        additionalDetails.push(detail);
      }
    });
    
    if (additionalDetails.length > 0) {
      // Add a natural transition and format as structured content
      enhanced += '\n\n**Additional Context:**\n' + additionalDetails.join(' ');
    }
  }
  
  // Clean up formatting and ensure professional appearance
  enhanced = enhanced
    .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Return properly formatted content without debug prefixes
  return enhanced;
}

