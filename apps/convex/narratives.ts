// @ts-nocheck
import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePermission, PERMISSIONS } from './permissions';
import { Id } from './_generated/dataModel';
import { internal } from './_generated/api';

/**
 * Create initial narrative content for new incident
 * Implements automatic narrative initialization when incident is created
 */
export const create = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Check if narrative already exists
    const existingNarrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    if (existingNarrative) {
      // Return existing narrative ID instead of throwing error (idempotent operation)
      console.log('📝 NARRATIVE ALREADY EXISTS', {
        narrativeId: existingNarrative._id,
        incidentId: args.incident_id,
        timestamp: new Date().toISOString(),
      });
      return existingNarrative._id;
    }

    // Get the incident to validate access
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check permissions - users can create narratives for incidents they have access to
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

    const now = Date.now();

    const narrativeId = await ctx.db.insert("incident_narratives", {
      incident_id: args.incident_id,
      
      // Initialize with empty narratives
      before_event: "",
      during_event: "",
      end_event: "",
      post_event: "",
      
      // Enhanced narratives start empty
      before_event_extra: undefined,
      during_event_extra: undefined,
      end_event_extra: undefined,
      post_event_extra: undefined,
      
      // Consolidated narrative starts empty
      consolidated_narrative: undefined,
      
      // Metadata
      created_at: now,
      updated_at: now,
      enhanced_at: undefined,
      version: 1,
    });

    console.log('📝 NARRATIVE CREATED', {
      narrativeId,
      incidentId: args.incident_id,
      userId: user._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return narrativeId;
  },
});

/**
 * Update narrative phase content with auto-save capability
 * Supports partial updates and version tracking
 */
export const update = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    before_event: v.optional(v.string()),
    during_event: v.optional(v.string()),
    end_event: v.optional(v.string()),
    post_event: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate that at least one field is being updated
    if (!args.before_event && !args.during_event && !args.end_event && !args.post_event) {
      throw new ConvexError("At least one narrative phase must be provided");
    }

    // Get the incident to validate access
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check permissions - users can update narratives for incidents they have access to
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

    // Check if capture phase is still editable
    if (incident.capture_status === "completed") {
      throw new ConvexError("Cannot edit narrative: capture phase is completed");
    }

    // Get existing narrative
    const existingNarrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    if (!existingNarrative) {
      throw new ConvexError("Narrative not found. Create narrative first.");
    }

    // Build update object with only provided fields
    const updates: any = {
      updated_at: Date.now(),
      version: existingNarrative.version + 1,
    };

    if (args.before_event !== undefined) {
      updates.before_event = args.before_event;
    }
    if (args.during_event !== undefined) {
      updates.during_event = args.during_event;
    }
    if (args.end_event !== undefined) {
      updates.end_event = args.end_event;
    }
    if (args.post_event !== undefined) {
      updates.post_event = args.post_event;
    }

    await ctx.db.patch(existingNarrative._id, updates);

    console.log('✏️ NARRATIVE UPDATED', {
      narrativeId: existingNarrative._id,
      incidentId: args.incident_id,
      userId: user._id,
      version: updates.version,
      fieldsUpdated: Object.keys(updates).filter(k => k !== 'updated_at' && k !== 'version'),
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return { success: true, version: updates.version };
  },
});

/**
 * Apply AI-enhanced content to narratives
 * This is an action because it might involve external AI service calls
 */
export const enhance = action({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    enhanced_before: v.optional(v.string()),
    enhanced_during: v.optional(v.string()),
    enhanced_end: v.optional(v.string()),
    enhanced_post: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the incident to validate access
    const incident = await ctx.runQuery("incidents:getById", { 
      sessionToken: args.sessionToken,
      id: args.incident_id 
    });

    if (!incident) {
      throw new ConvexError("Incident not found or access denied");
    }

    // Validate that at least one enhancement is provided
    if (!args.enhanced_before && !args.enhanced_during && !args.enhanced_end && !args.enhanced_post) {
      throw new ConvexError("At least one enhanced narrative phase must be provided");
    }

    // Get existing narrative
    const existingNarrative = await ctx.runQuery("narratives:getConsolidated", {
      sessionToken: args.sessionToken,
      incident_id: args.incident_id,
    });

    if (!existingNarrative) {
      throw new ConvexError("Narrative not found. Create narrative first.");
    }

    // Build enhancement updates
    const enhancements: any = {
      enhanced_at: Date.now(),
    };

    if (args.enhanced_before) {
      enhancements.before_event_extra = args.enhanced_before;
    }
    if (args.enhanced_during) {
      enhancements.during_event_extra = args.enhanced_during;
    }
    if (args.enhanced_end) {
      enhancements.end_event_extra = args.enhanced_end;
    }
    if (args.enhanced_post) {
      enhancements.post_event_extra = args.enhanced_post;
    }

    // Update narrative with enhancements
    await ctx.runMutation("narratives:applyEnhancements", {
      sessionToken: args.sessionToken,
      narrative_id: existingNarrative._id,
      enhancements,
    });

    // Mark incident as narrative enhanced
    await ctx.runMutation("incidents:markNarrativeEnhanced", {
      incident_id: args.incident_id,
    });

    return { success: true };
  },
});

/**
 * Internal mutation to apply enhancements
 */
export const applyEnhancements = mutation({
  args: {
    sessionToken: v.string(),
    narrative_id: v.id("incident_narratives"),
    enhancements: v.any(),
  },
  handler: async (ctx, args) => {
    // Get narrative to validate access
    const narrative = await ctx.db.get(args.narrative_id);
    if (!narrative) {
      throw new ConvexError("Narrative not found");
    }

    // Get incident for permission checking
    const incident = await ctx.db.get(narrative.incident_id);
    if (!incident) {
      throw new ConvexError("Associated incident not found");
    }

    // Check permissions 
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.ACCESS_LLM_FEATURES, // Enhanced narratives require LLM access
      {
        companyId: incident.company_id,
      }
    );

    await ctx.db.patch(args.narrative_id, args.enhancements);

    console.log('🤖 NARRATIVE ENHANCED', {
      narrativeId: args.narrative_id,
      incidentId: narrative.incident_id,
      userId: user._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Retrieve complete narrative for analysis with consolidated view
 * Combines original and enhanced content for comprehensive analysis
 */
export const getConsolidated = query({
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

    // Check permissions - users can view narratives they have access to
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS, // Try company-wide first
      {
        companyId: incident.company_id,
        resourceOwnerId: incident.created_by || undefined,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    // Get narrative
    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    if (!narrative) {
      return null;
    }

    // Create consolidated narrative if it doesn't exist
    let consolidatedNarrative = narrative.consolidated_narrative;
    if (!consolidatedNarrative && (narrative.before_event || narrative.during_event || narrative.end_event || narrative.post_event)) {
      // Generate consolidated view
      const sections = [
        narrative.before_event && `**Before Event**: ${narrative.before_event}`,
        narrative.during_event && `**During Event**: ${narrative.during_event}`,
        narrative.end_event && `**End Event**: ${narrative.end_event}`,
        narrative.post_event && `**Post Event**: ${narrative.post_event}`,
      ].filter(Boolean);

      consolidatedNarrative = sections.join('\n\n');

      // Update the narrative with consolidated version
      await ctx.db.patch(narrative._id, {
        consolidated_narrative: consolidatedNarrative,
      });
    }

    console.log('📖 NARRATIVE ACCESSED', {
      narrativeId: narrative._id,
      incidentId: args.incident_id,
      userId: user._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      ...narrative,
      consolidated_narrative: consolidatedNarrative,
    };
  },
});

/**
 * Get narrative by incident ID (simpler version for internal use)
 */
export const getByIncident = query({
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

    // Check permissions
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
      {
        companyId: incident.company_id,
        resourceOwnerId: incident.created_by || undefined,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    return narrative;
  },
});

/**
 * Real-time subscription to narrative updates
 * Enables collaborative narrative editing with live updates
 */
export const subscribeToNarrative = query({
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
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
      {
        companyId: incident.company_id,
        resourceOwnerId: incident.created_by || undefined,
      }
    );

    // Validate user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    // Generate consolidated narrative if it exists
    let consolidatedNarrative = null;
    if (narrative && (narrative.before_event || narrative.during_event || narrative.end_event || narrative.post_event)) {
      const sections = [
        narrative.before_event && `**Before Event**: ${narrative.before_event}`,
        narrative.during_event && `**During Event**: ${narrative.during_event}`,
        narrative.end_event && `**End Event**: ${narrative.end_event}`,
        narrative.post_event && `**Post Event**: ${narrative.post_event}`,
      ].filter(Boolean);

      consolidatedNarrative = sections.join('\n\n');
    }

    console.log('📝 REAL-TIME NARRATIVE SUBSCRIPTION', {
      incidentId: args.incident_id,
      narrativeId: narrative?._id,
      userId: user._id,
      hasContent: !!(narrative && (narrative.before_event || narrative.during_event || narrative.end_event || narrative.post_event)),
      version: narrative?.version || 0,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      incident_id: args.incident_id,
      narrative: narrative ? {
        ...narrative,
        consolidated_narrative: consolidatedNarrative,
      } : null,
      subscribedAt: Date.now(),
      correlationId,
    };
  },
});

/**
 * Real-time subscription to narrative editing activity
 * Shows who is currently editing which narrative sections
 */
export const subscribeToNarrativeActivity = query({
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
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
      {
        companyId: incident.company_id,
        resourceOwnerId: incident.created_by || undefined,
      }
    );

    // In production, this would query a user_activity or edit_sessions table
    // For now, we'll return mock activity data
    const mockActivity = {
      activeEditors: [],
      recentUpdates: [{
        userId: user._id,
        section: "during_event",
        lastUpdate: Date.now() - 30000, // 30 seconds ago
        action: "typing",
      }],
      editLocks: [], // Sections currently being edited
    };

    console.log('👥 REAL-TIME NARRATIVE ACTIVITY SUBSCRIPTION', {
      incidentId: args.incident_id,
      userId: user._id,
      activeEditorsCount: mockActivity.activeEditors.length,
      recentUpdatesCount: mockActivity.recentUpdates.length,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      incident_id: args.incident_id,
      activity: mockActivity,
      subscribedAt: Date.now(),
      correlationId,
    };
  },
});

/**
 * Internal mutation to update enhanced content for a specific phase
 */
export const updateEnhancedContent = mutation({
  args: {
    sessionToken: v.string(),
    narratives_id: v.id("incident_narratives"),
    phase: v.union(v.literal("before_event"), v.literal("during_event"), v.literal("end_event"), v.literal("post_event")),
    enhanced_content: v.string(),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const user = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken: args.sessionToken,
    });

    if (!user) {
      throw new ConvexError("Authentication required");
    }

    // Get the narratives record
    const narratives = await ctx.db.get(args.narratives_id);
    if (!narratives) {
      throw new ConvexError("Narratives not found");
    }

    // Map phase to enhanced field
    const fieldMap = {
      before_event: "before_event_extra",
      during_event: "during_event_extra", 
      end_event: "end_event_extra",
      post_event: "post_event_extra",
    };

    // Update the enhanced content
    await ctx.db.patch(args.narratives_id, {
      [fieldMap[args.phase]]: args.enhanced_content,
      enhanced_at: Date.now(),
      updated_at: Date.now(),
      version: narratives.version + 1,
    });

    return { success: true };
  },
});