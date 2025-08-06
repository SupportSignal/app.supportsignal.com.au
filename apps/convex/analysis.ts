import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Get incident analysis by incident ID
export const getIncidentAnalysis = query({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const analysis = await ctx.db
      .query("incident_analysis")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    return analysis;
  },
});

// Create incident analysis
export const createIncidentAnalysis = mutation({
  args: {
    incident_id: v.id("incidents"),
    contributing_conditions: v.string(),
    ai_analysis_prompt: v.optional(v.string()),
    ai_model: v.optional(v.string()),
    ai_confidence: v.optional(v.number()),
    ai_processing_time: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check if analysis already exists
    const existingAnalysis = await ctx.db
      .query("incident_analysis")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    if (existingAnalysis) {
      throw new ConvexError("Analysis already exists for this incident");
    }

    const now = Date.now();

    const analysisId = await ctx.db.insert("incident_analysis", {
      incident_id: args.incident_id,
      contributing_conditions: args.contributing_conditions,
      conditions_original: args.contributing_conditions, // Store original AI content
      conditions_edited: false,
      
      analyzed_at: now,
      // analyzed_by will be set when proper auth context is available
      updated_at: now,
      
      ai_analysis_prompt: args.ai_analysis_prompt,
      ai_model: args.ai_model,
      ai_confidence: args.ai_confidence,
      ai_processing_time: args.ai_processing_time,
      
      analysis_status: "ai_generated",
      revision_count: 0,
    });

    // Update incident to mark analysis as generated
    await ctx.db.patch(args.incident_id, {
      analysis_generated: true,
      analysis_status: "in_progress",
      updated_at: now,
    });

    return analysisId;
  },
});

// Update incident analysis
export const updateIncidentAnalysis = mutation({
  args: {
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
    // TODO: Add authentication and authorization checks
    
    const analysis = await ctx.db.get(args.analysis_id);
    if (!analysis) {
      throw new ConvexError("Analysis not found");
    }

    const now = Date.now();
    const conditionsEdited = args.contributing_conditions !== analysis.conditions_original;

    const updates: any = {
      contributing_conditions: args.contributing_conditions,
      conditions_edited: conditionsEdited,
      updated_at: now,
      revision_count: analysis.revision_count + 1,
    };

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

    return { success: true };
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
      v.literal("Behavioural"),
      v.literal("Environmental"),
      v.literal("Medical"),
      v.literal("Communication"),
      v.literal("Other")
    ),
    supporting_evidence: v.string(),
    severity: v.union(
      v.literal("Low"),
      v.literal("Medium"),
      v.literal("High")
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
      v.literal("Behavioural"),
      v.literal("Environmental"),
      v.literal("Medical"),
      v.literal("Communication"),
      v.literal("Other")
    )),
    supporting_evidence: v.optional(v.string()),
    severity: v.optional(v.union(
      v.literal("Low"),
      v.literal("Medium"),
      v.literal("High")
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
        Behavioural: classifications.filter(c => c.incident_type === "Behavioural").length,
        Environmental: classifications.filter(c => c.incident_type === "Environmental").length,
        Medical: classifications.filter(c => c.incident_type === "Medical").length,
        Communication: classifications.filter(c => c.incident_type === "Communication").length,
        Other: classifications.filter(c => c.incident_type === "Other").length,
      },
      classificationsBySeverity: {
        Low: classifications.filter(c => c.severity === "Low").length,
        Medium: classifications.filter(c => c.severity === "Medium").length,
        High: classifications.filter(c => c.severity === "High").length,
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