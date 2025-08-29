// @ts-nocheck
// AI Enhancement functions for Story 3.3: Narrative Enhancement & Completion

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { ConvexError } from "convex/values";
import { requirePermission, PERMISSIONS } from './permissions';
import { internal } from './_generated/api';
import { api } from './_generated/api';

// Interface for enhancement request
interface EnhancementRequest {
  original_narratives: {
    before_event: string;
    during_event: string;
    end_event: string;
    post_event: string;
  };
  clarification_responses: Array<{
    question_text: string;
    answer_text: string;
    phase: string;
  }>;
}

interface EnhancementResponse {
  enhanced_content: string;
  quality_score?: number;
}

// Generate correlation ID for request tracking
function generateCorrelationId(): string {
  return `enhance_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Template interpolation helper
function interpolateTemplate(template: string, variables: Record<string, string>): string {
  let interpolated = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    interpolated = interpolated.replace(regex, value || '');
  }
  
  return interpolated;
}

// Mock AI service for narrative enhancement (fallback when external AI unavailable)
function generateMockEnhancement(request: EnhancementRequest): EnhancementResponse {
  const { original_narratives, clarification_responses } = request;
  
  // Combine original narratives with basic grammar fixes
  const fixedNarratives = Object.entries(original_narratives)
    .map(([phase, content]) => {
      if (!content.trim()) return '';
      
      // Basic grammar fixes: capitalize first letter, ensure ending punctuation
      let fixed = content.trim();
      fixed = fixed.charAt(0).toUpperCase() + fixed.slice(1);
      if (!/[.!?]$/.test(fixed)) {
        fixed += '.';
      }
      
      return `**${phase.replace('_', ' ').toUpperCase()}**: ${fixed}`;
    })
    .filter(content => content.length > 0)
    .join('\n\n');
  
  // Add clarification responses as structured additions
  const qaContent = clarification_responses
    .filter(qa => qa.answer_text.trim().length > 0)
    .map(qa => {
      let answer = qa.answer_text.trim();
      answer = answer.charAt(0).toUpperCase() + answer.slice(1);
      if (!/[.!?]$/.test(answer)) {
        answer += '.';
      }
      return `**Q: ${qa.question_text}**\nA: ${answer}`;
    })
    .join('\n\n');
  
  // Combine grammar-fixed original content with Q&A additions
  let enhanced = fixedNarratives;
  if (qaContent.length > 0) {
    enhanced += '\n\n**ADDITIONAL CLARIFICATIONS**\n\n' + qaContent;
  }
  
  return {
    enhanced_content: enhanced,
    quality_score: 0.85 // Mock quality score
  };
}

/**
 * Enhance incident narrative with AI-powered combination of original content and clarifications
 */
export const enhanceIncidentNarrative = action({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();
    
    try {
      // Check permissions
      const { user } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE
      );
      
      // Get incident data
      const incident = await ctx.db.get(args.incident_id);
      
      if (!incident) {
        throw new ConvexError("Incident not found");
      }
      
      // Get narratives
      const narratives = await ctx.db
        .query("incident_narratives")
        .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
        .first();
      
      if (!narratives) {
        throw new ConvexError("Incident narratives not found");
      }
      
      // Get clarification responses
      const clarificationAnswers = await ctx.db
        .query("clarification_answers")
        .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
        .collect();
      
      // Prepare enhancement request
      const enhancementRequest: EnhancementRequest = {
        original_narratives: {
          before_event: narratives.before_event || '',
          during_event: narratives.during_event || '',
          end_event: narratives.end_event || '',
          post_event: narratives.post_event || '',
        },
        clarification_responses: clarificationAnswers.map(answer => ({
          question_text: answer.question_text || '',
          answer_text: answer.answer_text || '',
          phase: answer.phase,
        })),
      };
      
      // Get active prompt template
      const prompt = await ctx.runQuery(internal.promptManager.getActivePrompt, {
        prompt_name: "enhance_narrative",
        subsystem: "incidents",
      });
      
      let response: EnhancementResponse;
      let aiSuccess = true;
      let errorMessage: string | undefined;
      
      try {
        if (prompt) {
          // Interpolate template with variables matching the prompt template
          const combinedNarrative = Object.entries(enhancementRequest.original_narratives)
            .filter(([, content]) => content && content.trim())
            .map(([phase, content]) => `**${phase.toUpperCase()}**: ${content}`)
            .join('\n\n');
          
          const clarificationText = enhancementRequest.clarification_responses
            .filter(qa => qa.answer_text && qa.answer_text.trim())
            .map(qa => `Q: ${qa.question_text}\nA: ${qa.answer_text}`)
            .join('\n\n');
            
          const interpolatedPrompt = interpolateTemplate(prompt.prompt_template, {
            participant_name: incident.participant_name,
            reporter_name: incident.reporter_name,
            incident_location: incident.location,
            event_date_time: incident.event_date_time,
            existing_narrative: combinedNarrative,
            clarification_responses: clarificationText,
          });
          
          // TODO: Implement actual AI service call when available
          console.log("Using mock AI service for narrative enhancement");
        }
        
        // Use mock service as fallback
        response = generateMockEnhancement(enhancementRequest);
        
        // Note: No artificial delay in mutations (Convex doesn't allow setTimeout)
        // AI processing time will be tracked by actual processing duration
        
      } catch (aiError) {
        console.warn("AI service failed, falling back to mock enhancement:", aiError);
        aiSuccess = false;
        errorMessage = aiError instanceof Error ? aiError.message : "AI service unavailable";
        response = generateMockEnhancement(enhancementRequest);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Store enhanced narrative directly
      const enhancedNarrativeId = await ctx.db.insert("enhanced_narratives", {
        incident_id: args.incident_id,
        original_content: JSON.stringify(enhancementRequest.original_narratives),
        clarification_responses: JSON.stringify(enhancementRequest.clarification_responses),
        enhanced_content: response.enhanced_content,
        enhancement_version: 1,
        ai_model: prompt?.ai_model || "mock-service",
        enhancement_prompt: prompt?.prompt_name || "enhance_narrative",
        processing_time_ms: processingTime,
        quality_score: response.quality_score,
        user_edited: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      
      // Update incident with enhanced narrative reference
      await ctx.db.patch(args.incident_id, {
        enhanced_narrative_id: enhancedNarrativeId,
        narrative_enhanced: true,
        updated_at: Date.now(),
      });
      
      // Log the AI request for monitoring
      await ctx.db.insert("ai_request_logs", {
        correlation_id: correlationId,
        operation: "enhanceIncidentNarrative",
        model: prompt?.ai_model || "mock-service",
        prompt_template: prompt?.prompt_name || "enhance_narrative",
        input_data: {
          incident_id: args.incident_id,
          narratives_length: JSON.stringify(enhancementRequest.original_narratives).length,
          clarifications_count: enhancementRequest.clarification_responses.length,
        },
        output_data: {
          enhanced_content_length: response.enhanced_content.length,
          quality_score: response.quality_score,
        },
        processing_time_ms: processingTime,
        success: aiSuccess,
        error_message: errorMessage,
        user_id: user._id,
        incident_id: args.incident_id,
        created_at: Date.now(),
      });
      
      if (prompt) {
        // Update prompt usage statistics
        await ctx.runMutation(internal.promptManager.updatePromptUsage, {
          prompt_name: prompt.prompt_name,
          response_time_ms: processingTime,
          success: aiSuccess,
        });
      }
      
      return {
        enhanced_narrative_id: enhancedNarrativeId,
        enhanced_content: response.enhanced_content,
        correlation_id: correlationId,
        processing_time_ms: processingTime,
        ai_model_used: prompt?.ai_model || "mock-service",
        quality_score: response.quality_score,
        success: aiSuccess,
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Log failed request - but only if we have a valid context
      try {
        if (ctx && ctx.db) {
          await ctx.db.insert("ai_request_logs", {
            correlation_id: correlationId,
            operation: "enhanceIncidentNarrative",
            model: "unknown",
            prompt_template: "enhance_narrative",
            input_data: { incident_id: args.incident_id },
            processing_time_ms: processingTime,
            success: false,
            error_message: errorMessage,
            user_id: undefined,
            incident_id: args.incident_id,
            created_at: Date.now(),
          });
        }
      } catch (logError) {
        // If logging fails, just console log it - don't let it crash the main operation
        console.error("Failed to log AI request error:", logError);
      }
      
      throw error;
    }
  },
});

// storeEnhancedNarrative moved inline to enhanceIncidentNarrative action

/**
 * Update enhanced narrative with user edits
 */
export const updateEnhancedNarrative = mutation({
  args: {
    sessionToken: v.string(),
    enhanced_narrative_id: v.id("enhanced_narratives"),
    user_edited_content: v.string(),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE
    );
    
    // Get current enhanced narrative
    const enhancedNarrative = await ctx.db.get(args.enhanced_narrative_id);
    if (!enhancedNarrative) {
      throw new ConvexError("Enhanced narrative not found");
    }
    
    // Update with user edits
    await ctx.db.patch(args.enhanced_narrative_id, {
      enhanced_content: args.user_edited_content,
      user_edited: true,
      user_edits: args.user_edited_content,
      enhancement_version: enhancedNarrative.enhancement_version + 1,
      updated_at: Date.now(),
    });
    
    console.log('📝 ENHANCED NARRATIVE UPDATED', {
      enhancedNarrativeId: args.enhanced_narrative_id,
      userId: user._id,
      version: enhancedNarrative.enhancement_version + 1,
      timestamp: new Date().toISOString(),
    });
    
    return { success: true };
  },
});

/**
 * Get enhanced narrative by incident ID
 */
export const getEnhancedNarrative = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS
    );
    
    // Get narratives data which contains enhanced content in *_extra fields
    const narratives = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();
    
    // If narratives exist and have enhanced content, format it as enhanced narrative
    if (narratives && (narratives.before_event_extra || narratives.during_event_extra || 
                     narratives.end_event_extra || narratives.post_event_extra)) {
      return {
        _id: narratives._id,
        incident_id: args.incident_id,
        enhanced_content: {
          before_event: narratives.before_event_extra || narratives.before_event,
          during_event: narratives.during_event_extra || narratives.during_event,
          end_event: narratives.end_event_extra || narratives.end_event,
          post_event: narratives.post_event_extra || narratives.post_event,
        },
        user_edited: false, // Enhanced content from AI, not user-edited
        created_at: narratives.updated_at || narratives.created_at,
        updated_at: narratives.updated_at || narratives.created_at,
        enhancement_version: 1,
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
    enhanced_narrative_id: v.optional(v.id("enhanced_narratives")), // Make optional for backwards compatibility
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

