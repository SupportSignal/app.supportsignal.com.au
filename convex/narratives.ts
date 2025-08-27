/**
 * Narrative Management Functions
 * Convex queries and mutations for incident narratives
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { sessionResolver } from "./lib/sessionResolver";

/**
 * Get narrative data for an incident by ID
 * Returns the complete narrative structure for Step 8 summary display
 */
export const getByIncidentId = query({
  args: { 
    sessionToken: v.string(),
    incident_id: v.id("incidents")
  },
  handler: async (ctx, args) => {
    // Validate session and get user context
    const { user } = await sessionResolver(ctx, args.sessionToken);
    
    // Check if user has permission to view this incident's narratives
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new Error("Incident not found");
    }
    
    // Verify user has access to this company's incidents
    if (incident.company_id !== user.company_id) {
      throw new Error("Access denied: Incident belongs to different company");
    }
    
    // Fetch the narrative data from incident_narratives table
    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident_id", (q) => q.eq("incident_id", args.incident_id))
      .first();
    
    if (!narrative) {
      // Return empty structure if no narrative exists yet
      return {
        incident_id: args.incident_id,
        before_event: "",
        during_event: "",
        end_event: "",
        post_event: "",
        before_event_extra: "",
        during_event_extra: "", 
        end_event_extra: "",
        post_event_extra: "",
        created_at: Date.now(),
        updated_at: Date.now(),
        version: 0
      };
    }
    
    // Return the narrative data in the expected format
    return {
      incident_id: narrative.incident_id,
      before_event: narrative.before_event || "",
      during_event: narrative.during_event || "",
      end_event: narrative.end_event || "",
      post_event: narrative.post_event || "",
      before_event_extra: narrative.before_event_extra || "",
      during_event_extra: narrative.during_event_extra || "",
      end_event_extra: narrative.end_event_extra || "",
      post_event_extra: narrative.post_event_extra || "",
      consolidated_narrative: narrative.consolidated_narrative || "",
      created_at: narrative.created_at,
      updated_at: narrative.updated_at,
      enhanced_at: narrative.enhanced_at,
      version: narrative.version || 1
    };
  }
});

/**
 * Get narrative statistics for Step 8 summary
 * Returns question counts and other metrics for each phase
 */
export const getStatsByIncidentId = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents")
  },
  handler: async (ctx, args) => {
    // Validate session and permissions (reuse same logic)
    const { user } = await sessionResolver(ctx, args.sessionToken);
    
    const incident = await ctx.db.get(args.incident_id);
    if (!incident || incident.company_id !== user.company_id) {
      throw new Error("Access denied");
    }
    
    // Count clarification questions for each phase
    const phases = ["before_event", "during_event", "end_event", "post_event"];
    const phaseStats = {};
    
    for (const phase of phases) {
      // Count questions for this phase
      const questions = await ctx.db
        .query("clarification_questions")
        .withIndex("by_incident_phase", (q) => 
          q.eq("incident_id", args.incident_id).eq("phase", phase)
        )
        .collect();
        
      // Count answered questions for this phase
      const answers = await ctx.db
        .query("clarification_answers")
        .withIndex("by_incident_phase", (q) =>
          q.eq("incident_id", args.incident_id).eq("phase", phase)
        )
        .collect();
        
      phaseStats[phase] = {
        questions_total: questions.length,
        questions_answered: answers.filter(a => a.is_complete).length
      };
    }
    
    return {
      incident_id: args.incident_id,
      phase_stats: phaseStats,
      total_questions: Object.values(phaseStats).reduce((sum: number, stats: any) => sum + stats.questions_total, 0),
      total_answered: Object.values(phaseStats).reduce((sum: number, stats: any) => sum + stats.questions_answered, 0)
    };
  }
});