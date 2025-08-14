// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePermission, PERMISSIONS } from './permissions';

/**
 * Reset incident capture status for testing purposes
 * This allows testing AI functionality on completed incidents
 * DEVELOPMENT/TESTING ONLY - should not be exposed in production
 */
export const resetIncidentCaptureStatus = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    new_status: v.optional(v.union(v.literal("in_progress"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    // Get the incident
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check permissions - only allow users with access to edit their own incidents
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
      {
        resourceOwnerId: incident.created_by || undefined,
        companyId: incident.company_id,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    const newStatus = args.new_status || "in_progress";

    // Update incident status
    await ctx.db.patch(args.incident_id, {
      capture_status: newStatus,
      updated_at: Date.now(),
    });

    console.log('🔄 INCIDENT CAPTURE STATUS RESET', {
      incidentId: args.incident_id,
      oldStatus: incident.capture_status,
      newStatus: newStatus,
      userId: user._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return { 
      success: true, 
      old_status: incident.capture_status,
      new_status: newStatus,
      incident_id: args.incident_id
    };
  },
});

/**
 * Batch reset multiple incidents to in_progress status
 * Useful for resetting test data quickly
 */
export const resetMultipleIncidentStatuses = mutation({
  args: {
    sessionToken: v.string(),
    incident_ids: v.array(v.id("incidents")),
    new_status: v.optional(v.union(v.literal("in_progress"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const newStatus = args.new_status || "in_progress";
    const results = [];

    for (const incident_id of args.incident_ids) {
      try {
        const result = await ctx.runMutation("testingHelpers:resetIncidentCaptureStatus", {
          sessionToken: args.sessionToken,
          incident_id,
          new_status: newStatus,
        });
        results.push({ incident_id, success: true, ...result });
      } catch (error) {
        results.push({ 
          incident_id, 
          success: false, 
          error: error instanceof ConvexError ? error.message : "Unknown error" 
        });
      }
    }

    console.log('🔄 BATCH INCIDENT STATUS RESET', {
      totalIncidents: args.incident_ids.length,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
      newStatus: newStatus,
      timestamp: new Date().toISOString(),
    });

    return { 
      success: true,
      results,
      summary: {
        total: args.incident_ids.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    };
  },
});

/**
 * Get recent completed incidents that can be reset for testing
 */
export const getCompletedIncidentsForTesting = mutation({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check basic permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
      {}
    );

    // Get completed incidents from user's company
    const incidents = await ctx.db
      .query("incidents")
      .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
      .filter((q) => q.eq(q.field("capture_status"), "completed"))
      .order("desc")
      .take(args.limit || 10);

    console.log('📋 COMPLETED INCIDENTS FOR TESTING', {
      companyId: user.company_id,
      incidentCount: incidents.length,
      userId: user._id,
      timestamp: new Date().toISOString(),
    });

    return {
      incidents: incidents.map(incident => ({
        _id: incident._id,
        participant_name: incident.participant_name,
        reporter_name: incident.reporter_name,
        location: incident.location,
        event_datetime: incident.event_datetime,
        capture_status: incident.capture_status,
        created_at: incident.created_at,
      })),
      total: incidents.length,
    };
  },
});