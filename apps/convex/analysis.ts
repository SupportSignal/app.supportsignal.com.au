import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePermission, PERMISSIONS } from './permissions';
import { Id } from './_generated/dataModel';

/**
 * Get incident analysis by incident ID with proper access control
 * Requires PERFORM_ANALYSIS permission or ownership
 */
export const getByIncident = query({
  args: { 
    sessionToken: v.string(),
    incident_id: v.id("incidents") 
  },
  handler: async (ctx, args) => {
    // Get the incident to validate access
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check permissions for analysis access
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
        resourceOwnerId: incident.created_by || undefined,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }
    
    const analysis = await ctx.db
      .query("incident_analysis")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    console.log('📊 ANALYSIS ACCESSED', {
      analysisId: analysis?._id,
      incidentId: args.incident_id,
      userId: user._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return analysis;
  },
});

/**
 * Initialize analysis workflow for incident
 * Creates initial analysis record and sets up workflow state
 */
export const create = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Get the incident to validate access
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check permissions for analysis creation
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    // Check if analysis already exists
    const existingAnalysis = await ctx.db
      .query("incident_analysis")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    if (existingAnalysis) {
      throw new ConvexError("Analysis already exists for this incident");
    }

    // Ensure capture is complete before starting analysis
    if (incident.capture_status !== "completed") {
      throw new ConvexError("Cannot start analysis: incident capture must be completed first");
    }

    const now = Date.now();

    const analysisId = await ctx.db.insert("incident_analysis", {
      incident_id: args.incident_id,
      contributing_conditions: "", // Start empty, will be filled by AI or user
      conditions_original: undefined,
      conditions_edited: false,
      
      analyzed_at: now,
      analyzed_by: user._id,
      updated_at: now,
      
      ai_analysis_prompt: undefined,
      ai_model: undefined,
      ai_confidence: undefined,
      ai_processing_time: undefined,
      
      analysis_status: "draft",
      revision_count: 0,
      total_edit_time: 0,
    });

    // Update incident to indicate analysis has started
    await ctx.db.patch(args.incident_id, {
      analysis_status: "in_progress",
      updated_at: now,
    });

    console.log('🔍 ANALYSIS CREATED', {
      analysisId,
      incidentId: args.incident_id,
      userId: user._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return analysisId;
  },
});

/**
 * Update contributing conditions analysis with user editing tracking
 * Tracks revisions and edit history for audit purposes
 */
export const update = mutation({
  args: {
    sessionToken: v.string(),
    analysis_id: v.id("incident_analysis"),
    contributing_conditions: v.string(),
    analysis_status: v.optional(v.union(
      v.literal("draft"),
      v.literal("ai_generated"),
      v.literal("user_reviewed"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (!args.contributing_conditions.trim()) {
      throw new ConvexError("Contributing conditions cannot be empty");
    }
    
    const analysis = await ctx.db.get(args.analysis_id);
    if (!analysis) {
      throw new ConvexError("Analysis not found");
    }

    // Get incident for permission checking
    const incident = await ctx.db.get(analysis.incident_id);
    if (!incident) {
      throw new ConvexError("Associated incident not found");
    }

    // Check permissions for analysis updates
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    // Check if analysis is still editable
    if (analysis.analysis_status === "completed") {
      throw new ConvexError("Cannot edit completed analysis");
    }

    const now = Date.now();
    const conditionsEdited = analysis.conditions_original && 
      args.contributing_conditions !== analysis.conditions_original;

    const updates: any = {
      contributing_conditions: args.contributing_conditions.trim(),
      conditions_edited: conditionsEdited,
      updated_at: now,
      revision_count: analysis.revision_count + 1,
    };

    // Store original content if this is the first edit
    if (!analysis.conditions_original && args.contributing_conditions) {
      updates.conditions_original = args.contributing_conditions.trim();
    }

    if (args.analysis_status) {
      updates.analysis_status = args.analysis_status;
    }

    await ctx.db.patch(args.analysis_id, updates);

    // If analysis is completed, update the incident status
    if (args.analysis_status === "completed") {
      await ctx.db.patch(analysis.incident_id, {
        analysis_status: "completed",
        updated_at: now,
      });
    }

    console.log('📝 ANALYSIS UPDATED', {
      analysisId: args.analysis_id,
      incidentId: analysis.incident_id,
      userId: user._id,
      revision: updates.revision_count,
      statusChange: args.analysis_status,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, revision: updates.revision_count };
  },
});

/**
 * Generate AI-powered incident classifications using normalized enum values
 * This is an action because it involves external AI service calls
 */
export const generateClassifications = action({
  args: {
    sessionToken: v.string(),
    analysis_id: v.id("incident_analysis"),
    prompt_override: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get analysis and associated incident
    const analysis = await ctx.runQuery("analysis:getByAnalysisId", {
      sessionToken: args.sessionToken,
      analysis_id: args.analysis_id,
    });

    if (!analysis) {
      throw new ConvexError("Analysis not found or access denied");
    }

    // Validate analysis has content to classify
    if (!analysis.contributing_conditions || analysis.contributing_conditions.trim().length < 10) {
      throw new ConvexError("Contributing conditions must be completed before generating classifications");
    }

    // Get consolidated narrative for context
    const narrative = await ctx.runQuery("narratives:getConsolidated", {
      sessionToken: args.sessionToken,
      incident_id: analysis.incident_id,
    });

    // TODO: Implement actual AI service call here
    // For now, we'll create mock classifications using the normalized enums
    const mockClassifications = [
      {
        classification_id: `cls_${Date.now()}_1`,
        incident_type: "behavioural" as const,
        supporting_evidence: "Analysis indicates behavioral factors contributed to the incident",
        severity: "medium" as const,
        confidence_score: 0.85,
      },
      {
        classification_id: `cls_${Date.now()}_2`,
        incident_type: "environmental" as const,
        supporting_evidence: "Environmental conditions were a contributing factor",
        severity: "low" as const,
        confidence_score: 0.72,
      },
    ];

    // Create classifications in database
    const classificationIds = [];
    for (const classification of mockClassifications) {
      const classificationId = await ctx.runMutation("analysis:createClassification", {
        sessionToken: args.sessionToken,
        incident_id: analysis.incident_id,
        analysis_id: args.analysis_id,
        classification_id: classification.classification_id,
        incident_type: classification.incident_type,
        supporting_evidence: classification.supporting_evidence,
        severity: classification.severity,
        confidence_score: classification.confidence_score,
        ai_generated: true,
        ai_model: "gpt-4o-mini",
        original_ai_classification: JSON.stringify(classification),
      });
      classificationIds.push(classificationId);
    }

    // Update analysis status to indicate AI classifications are generated
    await ctx.runMutation("analysis:updateStatus", {
      sessionToken: args.sessionToken,
      analysis_id: args.analysis_id,
      analysis_status: "ai_generated",
    });

    return {
      success: true,
      classificationsCreated: classificationIds.length,
      classificationIds,
    };
  },
});

/**
 * Finalize analysis and mark incident complete
 * Performs final validation and workflow completion
 */
export const complete = mutation({
  args: {
    sessionToken: v.string(),
    analysis_id: v.id("incident_analysis"),
    completion_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.analysis_id);
    if (!analysis) {
      throw new ConvexError("Analysis not found");
    }

    // Get incident for permission checking
    const incident = await ctx.db.get(analysis.incident_id);
    if (!incident) {
      throw new ConvexError("Associated incident not found");
    }

    // Check permissions for analysis completion
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    // Validate analysis is ready for completion
    if (!analysis.contributing_conditions || analysis.contributing_conditions.trim().length < 10) {
      throw new ConvexError("Contributing conditions must be completed before finalizing analysis");
    }

    // Check if there are any classifications
    const classifications = await ctx.db
      .query("incident_classifications")
      .withIndex("by_analysis", (q) => q.eq("analysis_id", args.analysis_id))
      .collect();

    if (classifications.length === 0) {
      throw new ConvexError("At least one classification must be created before completing analysis");
    }

    const now = Date.now();

    // Update analysis status to completed
    await ctx.db.patch(args.analysis_id, {
      analysis_status: "completed",
      updated_at: now,
    });

    // Update incident to mark analysis as completed
    await ctx.db.patch(analysis.incident_id, {
      analysis_status: "completed",
      overall_status: "completed", // Both capture and analysis are now complete
      updated_at: now,
    });

    console.log('✅ ANALYSIS COMPLETED', {
      analysisId: args.analysis_id,
      incidentId: analysis.incident_id,
      userId: user._id,
      classificationsCount: classifications.length,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      classificationsCount: classifications.length,
      completedAt: now,
    };
  },
});

/**
 * Internal helper query to get analysis by ID (for actions)
 */
export const getByAnalysisId = query({
  args: {
    sessionToken: v.string(),
    analysis_id: v.id("incident_analysis"),
  },
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.analysis_id);
    if (!analysis) {
      throw new ConvexError("Analysis not found");
    }

    // Get incident for permission checking
    const incident = await ctx.db.get(analysis.incident_id);
    if (!incident) {
      throw new ConvexError("Associated incident not found");
    }

    // Check permissions
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    return analysis;
  },
});

/**
 * Update analysis status helper
 */
export const updateStatus = mutation({
  args: {
    sessionToken: v.string(),
    analysis_id: v.id("incident_analysis"),
    analysis_status: v.union(
      v.literal("draft"),
      v.literal("ai_generated"),
      v.literal("user_reviewed"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.analysis_id);
    if (!analysis) {
      throw new ConvexError("Analysis not found");
    }

    // Get incident for permission checking
    const incident = await ctx.db.get(analysis.incident_id);
    if (!incident) {
      throw new ConvexError("Associated incident not found");
    }

    // Check permissions
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    await ctx.db.patch(args.analysis_id, {
      analysis_status: args.analysis_status,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create classification helper for internal use
 */
export const createClassification = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    analysis_id: v.id("incident_analysis"),
    classification_id: v.string(),
    incident_type: v.union(
      v.literal("behavioural"),
      v.literal("environmental"),
      v.literal("medical"),
      v.literal("communication"),
      v.literal("other")
    ),
    supporting_evidence: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    confidence_score: v.number(),
    ai_generated: v.optional(v.boolean()),
    ai_model: v.optional(v.string()),
    original_ai_classification: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get incident for permission checking
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check permissions for classification creation
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    const now = Date.now();

    return await ctx.db.insert("incident_classifications", {
      incident_id: args.incident_id,
      analysis_id: args.analysis_id,
      classification_id: args.classification_id,
      incident_type: args.incident_type,
      supporting_evidence: args.supporting_evidence,
      severity: args.severity,
      confidence_score: args.confidence_score,
      
      user_reviewed: !args.ai_generated, // If not AI-generated, assume user reviewed
      user_modified: false,
      
      created_at: now,
      updated_at: now,
      classified_by: user._id,
      
      ai_generated: args.ai_generated ?? false,
      ai_model: args.ai_model,
      original_ai_classification: args.original_ai_classification,
    });
  },
});

// Get incident classifications by analysis ID
export const getIncidentClassifications = query({
  args: { analysis_id: v.id("incident_analysis") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    return await ctx.db
      .query("incident_classifications")
      .withIndex("by_analysis", (q) => q.eq("analysis_id", args.analysis_id))
      .collect();
  },
});

// Get incident classifications by incident ID
export const getClassificationsByIncident = query({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    return await ctx.db
      .query("incident_classifications")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .collect();
  },
});

// Create incident classification
export const createIncidentClassification = mutation({
  args: {
    incident_id: v.id("incidents"),
    analysis_id: v.id("incident_analysis"),
    classification_id: v.string(),
    incident_type: v.union(
      v.literal("behavioural"),
      v.literal("environmental"),
      v.literal("medical"),
      v.literal("communication"),
      v.literal("other")
    ),
    supporting_evidence: v.string(),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    confidence_score: v.number(),
    ai_generated: v.optional(v.boolean()),
    ai_model: v.optional(v.string()),
    original_ai_classification: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const now = Date.now();

    return await ctx.db.insert("incident_classifications", {
      incident_id: args.incident_id,
      analysis_id: args.analysis_id,
      classification_id: args.classification_id,
      incident_type: args.incident_type,
      supporting_evidence: args.supporting_evidence,
      severity: args.severity,
      confidence_score: args.confidence_score,
      
      user_reviewed: !args.ai_generated, // If not AI-generated, assume user reviewed
      user_modified: false,
      
      created_at: now,
      updated_at: now,
      // classified_by will be set when proper auth context is available
      
      ai_generated: args.ai_generated ?? false,
      ai_model: args.ai_model,
      original_ai_classification: args.original_ai_classification,
    });
  },
});

// Update incident classification
export const updateIncidentClassification = mutation({
  args: {
    classification_id: v.id("incident_classifications"),
    incident_type: v.optional(v.union(
      v.literal("behavioural"),
      v.literal("environmental"),
      v.literal("medical"),
      v.literal("communication"),
      v.literal("other")
    )),
    supporting_evidence: v.optional(v.string()),
    severity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    )),
    confidence_score: v.optional(v.number()),
    review_notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const classification = await ctx.db.get(args.classification_id);
    if (!classification) {
      throw new ConvexError("Classification not found");
    }

    const updates: any = {
      updated_at: Date.now(),
      user_reviewed: true,
    };

    // Check if user modified AI-generated content
    let userModified = classification.user_modified;
    if (classification.ai_generated) {
      if (args.incident_type && args.incident_type !== classification.incident_type) {
        userModified = true;
      }
      if (args.severity && args.severity !== classification.severity) {
        userModified = true;
      }
      if (args.supporting_evidence && args.supporting_evidence !== classification.supporting_evidence) {
        userModified = true;
      }
    }

    updates.user_modified = userModified;

    // Apply updates
    if (args.incident_type) updates.incident_type = args.incident_type;
    if (args.supporting_evidence) updates.supporting_evidence = args.supporting_evidence;
    if (args.severity) updates.severity = args.severity;
    if (args.confidence_score !== undefined) updates.confidence_score = args.confidence_score;
    if (args.review_notes) updates.review_notes = args.review_notes;

    await ctx.db.patch(args.classification_id, updates);
    return { success: true };
  },
});

// Get analysis workflow status for an incident
export const getAnalysisWorkflowStatus = query({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    const analysis = await ctx.db
      .query("incident_analysis")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    const classifications = analysis ? await ctx.db
      .query("incident_classifications")
      .withIndex("by_analysis", (q) => q.eq("analysis_id", analysis._id))
      .collect() : [];

    return {
      incident: {
        _id: incident._id,
        analysis_status: incident.analysis_status,
        overall_status: incident.overall_status,
        analysis_generated: incident.analysis_generated,
      },
      analysis: analysis ? {
        _id: analysis._id,
        analysis_status: analysis.analysis_status,
        conditions_edited: analysis.conditions_edited,
        revision_count: analysis.revision_count,
        analyzed_at: analysis.analyzed_at,
      } : null,
      classifications: classifications.map(c => ({
        _id: c._id,
        incident_type: c.incident_type,
        severity: c.severity,
        confidence_score: c.confidence_score,
        user_reviewed: c.user_reviewed,
        user_modified: c.user_modified,
        ai_generated: c.ai_generated,
      })),
      workflowComplete: incident.analysis_status === "completed" && classifications.length > 0,
    };
  },
});

// Get analysis metrics for a company
export const getAnalysisMetrics = query({
  args: { company_id: v.id("companies") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    // Get all incidents for the company
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_company", (q) => q.eq("company_id", args.company_id))
      .collect();

    const incidentIds = incidents.map(i => i._id);
    
    // Get all analyses for these incidents
    const analyses = await ctx.db
      .query("incident_analysis")
      .collect()
      .then(all => all.filter(a => incidentIds.includes(a.incident_id)));

    // Get all classifications for these analyses
    const classifications = await ctx.db
      .query("incident_classifications")
      .collect()
      .then(all => all.filter(c => incidentIds.includes(c.incident_id)));

    // Calculate metrics
    const metrics = {
      totalIncidents: incidents.length,
      incidentsWithAnalysis: analyses.length,
      analysisCompletion: incidents.length > 0 ? (analyses.length / incidents.length * 100) : 0,
      
      // Analysis status breakdown
      analysisDraft: analyses.filter(a => a.analysis_status === "draft").length,
      analysisAiGenerated: analyses.filter(a => a.analysis_status === "ai_generated").length,
      analysisUserReviewed: analyses.filter(a => a.analysis_status === "user_reviewed").length,
      analysisCompleted: analyses.filter(a => a.analysis_status === "completed").length,
      
      // User modification tracking
      analysesModified: analyses.filter(a => a.conditions_edited).length,
      averageRevisions: analyses.length > 0 ? analyses.reduce((sum, a) => sum + a.revision_count, 0) / analyses.length : 0,
      
      // Classification metrics
      totalClassifications: classifications.length,
      classificationsByType: {
        behavioural: classifications.filter(c => c.incident_type === "behavioural").length,
        environmental: classifications.filter(c => c.incident_type === "environmental").length,
        medical: classifications.filter(c => c.incident_type === "medical").length,
        communication: classifications.filter(c => c.incident_type === "communication").length,
        other: classifications.filter(c => c.incident_type === "other").length,
      },
      classificationsBySeverity: {
        low: classifications.filter(c => c.severity === "low").length,
        medium: classifications.filter(c => c.severity === "medium").length,
        high: classifications.filter(c => c.severity === "high").length,
      },
      
      // AI vs Human metrics
      aiGeneratedClassifications: classifications.filter(c => c.ai_generated).length,
      userModifiedClassifications: classifications.filter(c => c.user_modified).length,
      averageAiConfidence: classifications.length > 0 ? 
        classifications.reduce((sum, c) => sum + c.confidence_score, 0) / classifications.length : 0,
    };

    return metrics;
  },
});

/**
 * Real-time subscription to analysis updates
 * Enables collaborative analysis editing with live classification updates
 */
export const subscribeToAnalysis = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Get the incident to validate access
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      return null;
    }

    // Check permissions
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    // Get analysis
    const analysis = await ctx.db
      .query("incident_analysis")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    // Get classifications if analysis exists
    const classifications = analysis ? await ctx.db
      .query("incident_classifications")
      .withIndex("by_analysis", (q) => q.eq("analysis_id", analysis._id))
      .collect() : [];

    console.log('🔍 REAL-TIME ANALYSIS SUBSCRIPTION', {
      incidentId: args.incident_id,
      analysisId: analysis?._id,
      userId: user._id,
      analysisStatus: analysis?.analysis_status || 'not_started',
      classificationsCount: classifications.length,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      incident_id: args.incident_id,
      analysis,
      classifications,
      workflowStatus: {
        analysisExists: !!analysis,
        classificationsGenerated: classifications.length > 0,
        canComplete: analysis && classifications.length > 0 && analysis.contributing_conditions?.trim().length > 10,
        analysisStatus: analysis?.analysis_status || 'not_started',
      },
      subscribedAt: Date.now(),
      correlationId,
    };
  },
});

/**
 * Real-time subscription to classification updates
 * Monitors AI-generated and user-modified classifications
 */
export const subscribeToClassifications = query({
  args: {
    sessionToken: v.string(),
    analysis_id: v.id("incident_analysis"),
  },
  handler: async (ctx, args) => {
    const analysis = await ctx.db.get(args.analysis_id);
    if (!analysis) {
      return null;
    }

    // Get incident for permission checking
    const incident = await ctx.db.get(analysis.incident_id);
    if (!incident) {
      throw new ConvexError("Associated incident not found");
    }

    // Check permissions
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.PERFORM_ANALYSIS,
      {
        companyId: incident.company_id,
      }
    );

    // Get classifications
    const classifications = await ctx.db
      .query("incident_classifications")
      .withIndex("by_analysis", (q) => q.eq("analysis_id", args.analysis_id))
      .collect();

    // Calculate classification statistics
    const stats = {
      total: classifications.length,
      aiGenerated: classifications.filter(c => c.ai_generated).length,
      userModified: classifications.filter(c => c.user_modified).length,
      userReviewed: classifications.filter(c => c.user_reviewed).length,
      byType: {
        behavioural: classifications.filter(c => c.incident_type === "behavioural").length,
        environmental: classifications.filter(c => c.incident_type === "environmental").length,
        medical: classifications.filter(c => c.incident_type === "medical").length,
        communication: classifications.filter(c => c.incident_type === "communication").length,
        other: classifications.filter(c => c.incident_type === "other").length,
      },
      bySeverity: {
        low: classifications.filter(c => c.severity === "low").length,
        medium: classifications.filter(c => c.severity === "medium").length,
        high: classifications.filter(c => c.severity === "high").length,
      },
    };

    console.log('🏷️ REAL-TIME CLASSIFICATIONS SUBSCRIPTION', {
      analysisId: args.analysis_id,
      incidentId: analysis.incident_id,
      userId: user._id,
      totalClassifications: stats.total,
      aiGenerated: stats.aiGenerated,
      userModified: stats.userModified,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      analysis_id: args.analysis_id,
      incident_id: analysis.incident_id,
      classifications: classifications.map(c => ({
        ...c,
        // Add real-time metadata
        isRecent: (Date.now() - c.created_at) < 300000, // 5 minutes
      })),
      statistics: stats,
      subscribedAt: Date.now(),
      correlationId,
    };
  },
});