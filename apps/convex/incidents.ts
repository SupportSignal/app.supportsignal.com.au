import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Get incident by ID with proper access control
export const getIncidentById = query({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and company isolation check
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }
    return incident;
  },
});

// Get incidents for a company with filtering options
export const getIncidentsByCompany = query({
  args: {
    company_id: v.id("companies"),
    overallStatus: v.optional(v.union(
      v.literal("capture_pending"),
      v.literal("analysis_pending"),
      v.literal("completed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    if (args.overallStatus) {
      return await ctx.db
        .query("incidents")
        .withIndex("by_status", (q) => q.eq("overall_status", args.overallStatus!))
        .filter((q) => q.eq(q.field("company_id"), args.company_id))
        .order("desc")
        .take(args.limit ?? 50);
    } else {
      return await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", args.company_id))
        .order("desc")
        .take(args.limit ?? 50);
    }
  },
});

// Create a new incident
export const createIncident = mutation({
  args: {
    company_id: v.id("companies"),
    reporter_name: v.string(),
    participant_name: v.string(),
    event_date_time: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    // TODO: Validate user belongs to the company
    
    const now = Date.now();
    
    const incidentId = await ctx.db.insert("incidents", {
      company_id: args.company_id,
      reporter_name: args.reporter_name,
      participant_name: args.participant_name,
      event_date_time: args.event_date_time,
      location: args.location,
      
      // Initial workflow status
      capture_status: "draft",
      analysis_status: "not_started",
      overall_status: "capture_pending",
      
      // Audit fields
      created_at: now,
      // created_by will be set when proper auth context is available
      updated_at: now,
      
      // Data quality tracking
      narrative_hash: undefined,
      questions_generated: false,
      narrative_enhanced: false,
      analysis_generated: false,
    });

    return incidentId;
  },
});

// Update incident status
export const updateIncidentStatus = mutation({
  args: {
    incident_id: v.id("incidents"),
    capture_status: v.optional(v.union(v.literal("draft"), v.literal("in_progress"), v.literal("completed"))),
    analysis_status: v.optional(v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    const updates: any = {
      updated_at: Date.now(),
    };

    if (args.capture_status) {
      updates.capture_status = args.capture_status;
    }

    if (args.analysis_status) {
      updates.analysis_status = args.analysis_status;
    }

    // Auto-calculate overall status based on capture and analysis status
    const captureStatus = args.capture_status ?? incident.capture_status;
    const analysisStatus = args.analysis_status ?? incident.analysis_status;

    if (captureStatus === "completed" && analysisStatus === "completed") {
      updates.overall_status = "completed";
    } else if (captureStatus === "completed") {
      updates.overall_status = "analysis_pending";
    } else {
      updates.overall_status = "capture_pending";
    }

    await ctx.db.patch(args.incident_id, updates);
    return { success: true };
  },
});

// Get incident dashboard stats for a company
export const getIncidentDashboard = query({
  args: { company_id: v.id("companies") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const allIncidents = await ctx.db
      .query("incidents")
      .withIndex("by_company", (q) => q.eq("company_id", args.company_id))
      .collect();

    const stats = {
      totalIncidents: allIncidents.length,
      capturesPending: allIncidents.filter(i => i.overall_status === "capture_pending").length,
      analysisPending: allIncidents.filter(i => i.overall_status === "analysis_pending").length,
      completed: allIncidents.filter(i => i.overall_status === "completed").length,
      
      // Recent activity (last 30 days)
      recentIncidents: allIncidents.filter(i => i.created_at > Date.now() - 30 * 24 * 60 * 60 * 1000).length,
      
      // Workflow progress metrics
      questionsGenerated: allIncidents.filter(i => i.questions_generated).length,
      narrativesEnhanced: allIncidents.filter(i => i.narrative_enhanced).length,
      analysisGenerated: allIncidents.filter(i => i.analysis_generated).length,
    };

    return stats;
  },
});

// Get incident narrative by incident ID
export const getIncidentNarrative = query({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    return narrative;
  },
});

// Create or update incident narrative
export const upsertIncidentNarrative = mutation({
  args: {
    incident_id: v.id("incidents"),
    before_event: v.string(),
    during_event: v.string(),
    end_event: v.string(),
    post_event: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const existingNarrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    const now = Date.now();

    if (existingNarrative) {
      // Update existing narrative
      await ctx.db.patch(existingNarrative._id, {
        before_event: args.before_event,
        during_event: args.during_event,
        end_event: args.end_event,
        post_event: args.post_event,
        updated_at: now,
        version: existingNarrative.version + 1,
      });

      return existingNarrative._id;
    } else {
      // Create new narrative
      return await ctx.db.insert("incident_narratives", {
        incident_id: args.incident_id,
        before_event: args.before_event,
        during_event: args.during_event,
        end_event: args.end_event,
        post_event: args.post_event,
        created_at: now,
        updated_at: now,
        version: 1,
      });
    }
  },
});

// Get clarification questions for an incident
export const getClarificationQuestions = query({
  args: {
    incident_id: v.id("incidents"),
    phase: v.optional(v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    )),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    if (args.phase) {
      return await ctx.db
        .query("clarification_questions")
        .withIndex("by_incident_phase", (q) => 
          q.eq("incident_id", args.incident_id).eq("phase", args.phase!)
        )
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("asc")
        .collect();
    } else {
      return await ctx.db
        .query("clarification_questions")
        .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("asc")
        .collect();
    }
  },
});

// Add clarification question
export const addClarificationQuestion = mutation({
  args: {
    incident_id: v.id("incidents"),
    question_id: v.string(),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
    question_text: v.string(),
    question_order: v.number(),
    ai_model: v.optional(v.string()),
    prompt_version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    return await ctx.db.insert("clarification_questions", {
      incident_id: args.incident_id,
      question_id: args.question_id,
      phase: args.phase,
      question_text: args.question_text,
      question_order: args.question_order,
      generated_at: Date.now(),
      ai_model: args.ai_model,
      prompt_version: args.prompt_version,
      is_active: true,
    });
  },
});

// Submit clarification answer
export const submitClarificationAnswer = mutation({
  args: {
    incident_id: v.id("incidents"),
    question_id: v.string(),
    answer_text: v.string(),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication and authorization checks
    
    const now = Date.now();
    const wordCount = args.answer_text.trim().split(/\s+/).length;
    const characterCount = args.answer_text.length;

    return await ctx.db.insert("clarification_answers", {
      incident_id: args.incident_id,
      question_id: args.question_id,
      answer_text: args.answer_text,
      phase: args.phase,
      answered_at: now,
      // answered_by will be set when proper auth context is available
      updated_at: now,
      is_complete: true,
      character_count: characterCount,
      word_count: wordCount,
    });
  },
});

// Mark incident questions as generated
export const markQuestionsGenerated = mutation({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.incident_id, {
      questions_generated: true,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

// Mark incident narrative as enhanced
export const markNarrativeEnhanced = mutation({
  args: { incident_id: v.id("incidents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.incident_id, {
      narrative_enhanced: true,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});