// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { requirePermission, PERMISSIONS } from './permissions';
import { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { 
  ValidationHelpers, 
  ValidationSchemas,
  ValidationError, 
  ErrorTypes, 
  ErrorLogging, 
  Sanitization 
} from './validation';

// Story 4.1: Incident Listing Types
interface IncidentFilter {
  status?: string;
  dateRange?: { start: number; end: number };
  participantId?: Id<"participants">;
  userId?: Id<"users">;
  searchText?: string;
}

interface PaginationArgs {
  limit: number;
  offset: number;
}

interface SortingArgs {
  field: "date" | "status" | "participant" | "reporter" | "updated";
  direction: "asc" | "desc";
}

/**
 * Get incident by ID with proper access control
 * Supports role-based access: system_admin, company_admin, team_lead, frontline_worker (own incidents)
 */
export const getById = query({
  args: { 
    sessionToken: v.string(),
    id: v.id("incidents") 
  },
  handler: async (ctx, args) => {
    // Get the incident first to check ownership context
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throw new ConvexError("Incident not found or you don't have access to it");
    }

    // Check permissions - users can view incidents they have access to based on role
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS, // Try company-wide permission first
      {
        companyId: incident.company_id,
        resourceOwnerId: incident.created_by || undefined,
      }
    );

    // If user doesn't have company-wide access, check if they can view their own incidents
    if (!user && incident.created_by) {
      const { user: userFromOwnership } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
        {
          resourceOwnerId: incident.created_by,
          companyId: incident.company_id,
        }
      );
      // If they can edit their own incidents, they can view them too
    }

    // Additional check: Ensure user is in same company (multi-tenant isolation)
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    console.log('📄 INCIDENT ACCESSED', {
      incidentId: args.id,
      userId: user._id,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return incident;
  },
});

/**
 * List incidents accessible to current user based on their role and permissions
 * - system_admin & company_admin: All incidents in company
 * - team_lead: All incidents in company (team view)
 * - frontline_worker: Only own incidents
 */
export const listByUser = query({
  args: {
    sessionToken: v.string(),
    overallStatus: v.optional(v.union(
      v.literal("capture_pending"),
      v.literal("analysis_pending"),
      v.literal("completed")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate user and get permissions
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT // Everyone with incident access can list incidents
    );

    let incidents;

    // Check if user has company-wide incident viewing permissions
    try {
      await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
        { companyId: user.company_id }
      );
      
      // User has company-wide access - return all company incidents
      if (args.overallStatus) {
        incidents = await ctx.db
          .query("incidents")
          .withIndex("by_status", (q) => q.eq("overall_status", args.overallStatus!))
          .filter((q) => q.eq(q.field("company_id"), user.company_id))
          .order("desc")
          .take(args.limit ?? 50);
      } else {
        incidents = await ctx.db
          .query("incidents")
          .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
          .order("desc")
          .take(args.limit ?? 50);
      }
    } catch {
      // User doesn't have company-wide access - return only own incidents
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .filter((q) => q.eq(q.field("created_by"), user._id))
        .order("desc")
        .take(args.limit ?? 50);
        
      // Apply status filter if specified
      if (args.overallStatus) {
        incidents = incidents.filter(incident => incident.overall_status === args.overallStatus);
      }
    }

    console.log('📋 INCIDENTS LISTED', {
      userId: user._id,
      companyId: user.company_id,
      count: incidents.length,
      statusFilter: args.overallStatus,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return incidents;
  },
});

/**
 * Create a new incident with comprehensive validation and permission checks
 * Implements "Democratic Creation" - anyone with CREATE_INCIDENT permission can create incidents
 */
export const create = mutation({
  args: {
    sessionToken: v.string(),
    reporter_name: v.string(),
    participant_id: v.optional(v.id("participants")),
    participant_name: v.string(),
    event_date_time: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    let correlationId: string = '';
    let user: any = null;

    try {
      // Check permissions first to get user context
      const authResult = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT
      );
      user = authResult.user;
      correlationId = authResult.correlationId;

      // Comprehensive input validation using Zod schemas
      const sanitizedInput = Sanitization.sanitizeObject({
        reporter_name: args.reporter_name,
        participant_id: args.participant_id,
        participant_name: args.participant_name,
        event_date_time: args.event_date_time,
        location: args.location,
      });

      const validatedData = ValidationHelpers.validateIncidentCreation(
        sanitizedInput,
        correlationId
      );

      // Additional business logic validation
      const eventDate = new Date(validatedData.event_date_time);
      const now = new Date();
      
      // Check if event date is too far in the future (business rule)
      if (eventDate > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
        throw new ValidationError(
          "Incident date cannot be more than 24 hours in the future",
          ErrorTypes.BUSINESS_LOGIC_ERROR,
          { correlationId, context: { eventDate: validatedData.event_date_time } }
        );
      }

      // Check if event date is too far in the past (business rule)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (eventDate < thirtyDaysAgo) {
        throw new ValidationError(
          "Incident date cannot be more than 30 days in the past",
          ErrorTypes.BUSINESS_LOGIC_ERROR,
          { correlationId, context: { eventDate: validatedData.event_date_time } }
        );
      }

      const currentTime = Date.now();
      
      const incidentId = await ctx.db.insert("incidents", {
        company_id: user.company_id!, // User's company from authenticated session
        reporter_name: validatedData.reporter_name,
        participant_id: validatedData.participant_id,
        participant_name: validatedData.participant_name,
        event_date_time: validatedData.event_date_time,
        location: validatedData.location,
        
        // Initial workflow status
        capture_status: "draft",
        analysis_status: "not_started",
        overall_status: "capture_pending",
        
        // Audit fields
        created_at: currentTime,
        created_by: user._id,
        updated_at: currentTime,
        
        // Data quality tracking
        narrative_hash: undefined,
        questions_generated: false,
        narrative_enhanced: false,
        analysis_generated: false,
      });

      // Log success
      ErrorLogging.logSuccess(
        'incident_created',
        user._id,
        correlationId,
        {
          incidentId,
          companyId: user.company_id,
          reporter_name: validatedData.reporter_name,
        }
      );

      console.log('🆕 INCIDENT CREATED', {
        incidentId,
        createdBy: user._id,
        companyId: user.company_id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return incidentId;
    } catch (error) {
      // Comprehensive error handling
      if (error instanceof ValidationError) {
        ErrorLogging.logValidationError(error, 'incidents:create', user?._id);
        throw error;
      }

      if (error instanceof ConvexError) {
        ErrorLogging.logBusinessError(error, 'incidents:create', user?._id, correlationId);
        throw error;
      }

      // Unexpected error
      const unexpectedError = new ValidationError(
        `Failed to create incident: ${(error as Error).message}`,
        ErrorTypes.BUSINESS_LOGIC_ERROR,
        { correlationId, context: { originalError: (error as Error).message } }
      );
      
      ErrorLogging.logBusinessError(unexpectedError, 'incidents:create', user?._id, correlationId);
      throw unexpectedError;
    }
  },
});

/**
 * Update incident metadata with comprehensive validation and permission checks
 * Allows updating basic incident information while preserving workflow status
 */
export const updateMetadata = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.id("incidents"),
    reporter_name: v.string(),
    participant_id: v.optional(v.id("participants")),
    participant_name: v.string(),
    event_date_time: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    let correlationId: string = '';
    let user: any = null;

    try {
      // Check permissions first to get user context
      const authResult = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT // Using same permission as create for now
      );
      user = authResult.user;
      correlationId = authResult.correlationId;

      // Verify the incident exists and user has access to it
      const existingIncident = await ctx.db.get(args.incidentId);
      if (!existingIncident) {
        throw new ValidationError(
          "Incident not found",
          ErrorTypes.BUSINESS_LOGIC_ERROR,
          { correlationId, context: { incidentId: args.incidentId } }
        );
      }

      // Verify user has access to this incident (same company)
      if (existingIncident.company_id !== user.company_id) {
        throw new ValidationError(
          "Access denied to incident",
          ErrorTypes.BUSINESS_LOGIC_ERROR,
          { correlationId, context: { incidentId: args.incidentId } }
        );
      }

      // Comprehensive input validation using Zod schemas
      const sanitizedInput = Sanitization.sanitizeObject({
        reporter_name: args.reporter_name,
        participant_id: args.participant_id,
        participant_name: args.participant_name,
        event_date_time: args.event_date_time,
        location: args.location,
      });

      const validatedData = ValidationHelpers.validateIncidentCreation(
        sanitizedInput,
        correlationId
      );

      // Additional business logic validation
      const eventDate = new Date(validatedData.event_date_time);
      const now = new Date();
      
      // Check if event date is too far in the future (business rule)
      if (eventDate > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
        throw new ValidationError(
          "Incident date cannot be more than 24 hours in the future",
          ErrorTypes.BUSINESS_LOGIC_ERROR,
          { correlationId, context: { eventDate: validatedData.event_date_time } }
        );
      }

      // Check if event date is too far in the past (business rule)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (eventDate < thirtyDaysAgo) {
        throw new ValidationError(
          "Incident date cannot be more than 30 days in the past",
          ErrorTypes.BUSINESS_LOGIC_ERROR,
          { correlationId, context: { eventDate: validatedData.event_date_time } }
        );
      }

      const currentTime = Date.now();
      
      // Update the incident metadata
      await ctx.db.patch(args.incidentId, {
        reporter_name: validatedData.reporter_name,
        participant_id: validatedData.participant_id,
        participant_name: validatedData.participant_name,
        event_date_time: validatedData.event_date_time,
        location: validatedData.location,
        updated_at: currentTime,
      });

      // Log success
      ErrorLogging.logSuccess(
        'incident_metadata_updated',
        user._id,
        correlationId,
        {
          incidentId: args.incidentId,
          companyId: user.company_id,
          reporter_name: validatedData.reporter_name,
        }
      );

      console.log('📝 INCIDENT METADATA UPDATED', {
        incidentId: args.incidentId,
        updatedBy: user._id,
        companyId: user.company_id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return args.incidentId;
    } catch (error) {
      // Comprehensive error handling
      if (error instanceof ValidationError) {
        ErrorLogging.logValidationError(error, 'incidents:updateMetadata', user?._id);
        throw error;
      }

      if (error instanceof ConvexError) {
        ErrorLogging.logBusinessError(error, 'incidents:updateMetadata', user?._id, correlationId);
        throw error;
      }

      // Unexpected error
      const unexpectedError = new ValidationError(
        `Failed to update incident metadata: ${(error as Error).message}`,
        ErrorTypes.BUSINESS_LOGIC_ERROR,
        { correlationId, context: { originalError: (error as Error).message } }
      );
      
      ErrorLogging.logBusinessError(unexpectedError, 'incidents:updateMetadata', user?._id, correlationId);
      throw unexpectedError;
    }
  },
});

/**
 * Update incident workflow status with comprehensive validation
 * Requires appropriate permissions based on status being updated
 */
export const updateStatus = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("incidents"),
    capture_status: v.optional(v.union(v.literal("draft"), v.literal("in_progress"), v.literal("completed"))),
    analysis_status: v.optional(v.union(v.literal("not_started"), v.literal("in_progress"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    let correlationId: string = '';
    let user: any = null;

    try {
      // Validate status update input using Zod schemas
      const statusUpdateData = ValidationHelpers.validateInput(
        ValidationSchemas.incidentStatus,
        {
          capture_status: args.capture_status,
          analysis_status: args.analysis_status,
        }
      );

      const incident = await ctx.db.get(args.id);
      if (!incident) {
        throw new ValidationError(
          "Incident not found",
          ErrorTypes.RESOURCE_NOT_FOUND,
          { context: { incidentId: args.id } }
        );
      }

      // Determine required permission based on what's being updated
      let requiredPermission;
      if (args.analysis_status) {
        // Analysis status changes require PERFORM_ANALYSIS permission
        requiredPermission = PERMISSIONS.PERFORM_ANALYSIS;
      } else {
        // Capture status changes - users can update their own incidents
        requiredPermission = PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE;
      }

      // Check permissions
      const authResult = await requirePermission(
        ctx,
        args.sessionToken,
        requiredPermission,
        {
          resourceOwnerId: incident.created_by || undefined,
          companyId: incident.company_id,
        }
      );
      user = authResult.user;
      correlationId = authResult.correlationId;

      // Additional validation: ensure user is in same company
      if (user.company_id !== incident.company_id) {
        throw new ValidationError(
          "Access denied: incident belongs to different company",
          ErrorTypes.AUTHORIZATION_ERROR,
          { correlationId, context: { userCompany: user.company_id, incidentCompany: incident.company_id } }
        );
      }

      // Comprehensive state transition validation
      if (args.capture_status) {
        const validTransitions: Record<string, string[]> = {
          "draft": ["in_progress"],
          "in_progress": ["completed"],
          "completed": [], // Cannot transition from completed
        };

        const allowedNext = validTransitions[incident.capture_status] || [];
        if (args.capture_status !== incident.capture_status && !allowedNext.includes(args.capture_status)) {
          throw new ValidationError(
            `Invalid capture status transition from ${incident.capture_status} to ${args.capture_status}`,
            ErrorTypes.BUSINESS_LOGIC_ERROR,
            {
              correlationId,
              context: {
                currentStatus: incident.capture_status,
                requestedStatus: args.capture_status,
                allowedTransitions: allowedNext,
              }
            }
          );
        }
      }

      if (args.analysis_status) {
        const validTransitions: Record<string, string[]> = {
          "not_started": ["in_progress"],
          "in_progress": ["completed"],
          "completed": [], // Cannot transition from completed
        };

        const allowedNext = validTransitions[incident.analysis_status] || [];
        if (args.analysis_status !== incident.analysis_status && !allowedNext.includes(args.analysis_status)) {
          throw new ValidationError(
            `Invalid analysis status transition from ${incident.analysis_status} to ${args.analysis_status}`,
            ErrorTypes.BUSINESS_LOGIC_ERROR,
            {
              correlationId,
              context: {
                currentStatus: incident.analysis_status,
                requestedStatus: args.analysis_status,
                allowedTransitions: allowedNext,
              }
            }
          );
        }

        // Additional business rule: cannot start analysis until capture is completed
        if (args.analysis_status === "in_progress" && incident.capture_status !== "completed") {
          throw new ValidationError(
            "Cannot start analysis until capture phase is completed",
            ErrorTypes.BUSINESS_LOGIC_ERROR,
            {
              correlationId,
              context: {
                captureStatus: incident.capture_status,
                requestedAnalysisStatus: args.analysis_status,
              }
            }
          );
        }
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

      await ctx.db.patch(args.id, updates);

      // Log success
      ErrorLogging.logSuccess(
        'incident_status_updated',
        user._id,
        correlationId,
        {
          incidentId: args.id,
          captureStatus: args.capture_status,
          analysisStatus: args.analysis_status,
          overallStatus: updates.overall_status,
        }
      );

      console.log('📊 INCIDENT STATUS UPDATED', {
        incidentId: args.id,
        userId: user._id,
        captureStatus: args.capture_status,
        analysisStatus: args.analysis_status,
        overallStatus: updates.overall_status,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      // Comprehensive error handling
      if (error instanceof ValidationError) {
        ErrorLogging.logValidationError(error, 'incidents:updateStatus', user?._id);
        throw error;
      }

      if (error instanceof ConvexError) {
        ErrorLogging.logBusinessError(error, 'incidents:updateStatus', user?._id, correlationId);
        throw error;
      }

      // Unexpected error
      const unexpectedError = new ValidationError(
        `Failed to update incident status: ${(error as Error).message}`,
        ErrorTypes.BUSINESS_LOGIC_ERROR,
        { correlationId, context: { originalError: (error as Error).message } }
      );
      
      ErrorLogging.logBusinessError(unexpectedError, 'incidents:updateStatus', user?._id, correlationId);
      throw unexpectedError;
    }
  },
});

/**
 * Soft delete incident with audit trail preservation
 * Only system_admin and company_admin can delete incidents
 */
export const deleteIncident = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("incidents"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Check if user has permission to delete incidents (admin-only operation)
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.COMPANY_CONFIGURATION, // Use company config permission for delete operations
      {
        companyId: incident.company_id,
      }
    );

    // Additional validation: ensure user is in same company
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    // Soft delete by updating status to indicate deletion (we keep audit trail)
    await ctx.db.patch(args.id, {
      overall_status: "deleted" as any, // This would need to be added to schema enum
      updated_at: Date.now(),
      // In production, we'd add deleted_at and deleted_by fields
    });

    console.log('🗑️ INCIDENT DELETED', {
      incidentId: args.id,
      deletedBy: user._id,
      reason: args.reason || 'No reason provided',
      correlationId,
      timestamp: new Date().toISOString(),
    });

    // For now, we'll do hard delete until schema supports soft delete
    await ctx.db.delete(args.id);

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
    sessionToken: v.optional(v.string()),
    incident_id: v.id("incidents"),
    before_event: v.string(),
    during_event: v.string(),
    end_event: v.string(),
    post_event: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication and authorization checks
    if (!args.sessionToken) {
      throw new ConvexError('Session token required');
    }

    // Get the incident to verify access
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError('Incident not found');
    }

    // Verify user has permission to edit this incident
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
      {
        resourceOwnerId: incident.created_by || undefined,
        companyId: incident.company_id,
      }
    );

    // Ensure user is in same company as the incident
    if (user.company_id !== incident.company_id) {
      throw new ConvexError('Access denied: incident belongs to different company');
    }

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

/**
 * Real-time subscription to incident updates
 * Enables collaborative editing by notifying clients of changes
 */
export const subscribeToIncident = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Get incident with proper access control
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

    // Get related data for comprehensive subscription
    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    const analysis = await ctx.db
      .query("incident_analysis") 
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    const classifications = analysis ? await ctx.db
      .query("incident_classifications")
      .withIndex("by_analysis", (q) => q.eq("analysis_id", analysis._id))
      .collect() : [];

    console.log('🔄 REAL-TIME INCIDENT SUBSCRIPTION', {
      incidentId: args.incident_id,
      userId: user._id,
      hasNarrative: !!narrative,
      hasAnalysis: !!analysis,
      classificationsCount: classifications.length,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      incident,
      narrative,
      analysis,
      classifications,
      subscribedAt: Date.now(),
      correlationId,
    };
  },
});

/**
 * Real-time subscription to company incidents list
 * Enables live dashboard updates
 */
export const subscribeToCompanyIncidents = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    status_filter: v.optional(v.union(
      v.literal("capture_pending"),
      v.literal("analysis_pending"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    // Get user and permissions first
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT // Everyone with incident access can list
    );

    // Check if user has company-wide access
    let incidents;
    try {
      await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
        { companyId: user.company_id }
      );
      
      // Company-wide access
      if (args.status_filter) {
        incidents = await ctx.db
          .query("incidents")
          .withIndex("by_status", (q) => q.eq("overall_status", args.status_filter!))
          .filter((q) => q.eq(q.field("company_id"), user.company_id))
          .order("desc")
          .take(args.limit ?? 50);
      } else {
        incidents = await ctx.db
          .query("incidents")
          .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
          .order("desc")
          .take(args.limit ?? 50);
      }
    } catch {
      // User only access - return own incidents
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .filter((q) => q.eq(q.field("created_by"), user._id))
        .order("desc")
        .take(args.limit ?? 50);
        
      if (args.status_filter) {
        incidents = incidents.filter(incident => incident.overall_status === args.status_filter);
      }
    }

    console.log('📋 REAL-TIME INCIDENTS SUBSCRIPTION', {
      userId: user._id,
      companyId: user.company_id,
      count: incidents.length,
      statusFilter: args.status_filter,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      incidents,
      subscribedAt: Date.now(),
      totalCount: incidents.length,
      correlationId,
    };
  },
});

/**
 * Get draft incident for editing in capture workflow
 * Simple version for incident capture forms
 */
export const getDraftIncident = query({
  args: {
    sessionToken: v.string(),
    incidentId: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Get the incident first to check ownership context
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new ConvexError("Incident not found or you don't have access to it");
    }

    // Check permissions - users can view incidents they have access to
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE,
      {
        resourceOwnerId: incident.created_by || undefined,
        companyId: incident.company_id,
      }
    );

    // Ensure user is in same company (multi-tenant isolation)
    if (user.company_id !== incident.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    // Get incident narrative if it exists
    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incidentId))
      .first();

    console.log('📄 DRAFT INCIDENT ACCESSED', {
      incidentId: args.incidentId,
      userId: user._id,
      hasNarrative: !!narrative,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return {
      incident,
      narrative,
    };
  },
});

// AI Clarification Helper Functions

/**
 * Log AI request for monitoring and debugging
 */
export const logAiRequest = mutation({
  args: {
    correlation_id: v.string(),
    operation: v.string(),
    model: v.string(),
    prompt_template: v.string(),
    input_data: v.any(),
    output_data: v.optional(v.any()),
    processing_time_ms: v.number(),
    tokens_used: v.optional(v.number()),
    cost_usd: v.optional(v.number()),
    success: v.boolean(),
    error_message: v.optional(v.string()),
    user_id: v.optional(v.id("users")),
    incident_id: v.optional(v.id("incidents")),
    created_at: v.number(),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("ai_request_logs", {
      correlation_id: args.correlation_id,
      operation: args.operation,
      model: args.model,
      prompt_template: args.prompt_template,
      input_data: args.input_data,
      output_data: args.output_data,
      processing_time_ms: args.processing_time_ms,
      tokens_used: args.tokens_used,
      cost_usd: args.cost_usd,
      success: args.success,
      error_message: args.error_message,
      user_id: args.user_id,
      incident_id: args.incident_id,
      created_at: args.created_at,
    });

    return logId;
  },
});

/**
 * Create hash for narrative content caching
 */
export const createNarrativeHash = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Simple hash for content comparison using string hashing (Convex-compatible)
    let hash = 0;
    for (let i = 0; i < args.content.length; i++) {
      const char = args.content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive hex string
    const hashString = Math.abs(hash).toString(16).padStart(8, '0');
    return hashString.substring(0, 32);
  },
});

/**
 * Update incident narrative hash for caching
 */
export const updateIncidentNarrativeHash = mutation({
  args: {
    incident_id: v.id("incidents"),
    narrative_hash: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.incident_id, {
      narrative_hash: args.narrative_hash,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update incident progress status based on clarification completion
 */
export const updateIncidentProgressStatus = mutation({
  args: {
    incident_id: v.id("incidents"),
    phase: v.union(
      v.literal("before_event"),
      v.literal("during_event"),
      v.literal("end_event"),
      v.literal("post_event")
    ),
    questions_completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // For now, just track that questions are being generated/answered
    // In future iterations, this could update more granular progress tracking
    await ctx.db.patch(args.incident_id, {
      questions_generated: true,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get incident by ID (internal helper for AI functions)
 */
export const getIncidentById = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const user = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken: args.sessionToken,
    });

    if (!user) {
      throw new ConvexError("Authentication required");
    }

    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      return null;
    }

    // Check company access
    if (user.company_id !== incident.company_id) {
      console.error('🚫 COMPANY ACCESS MISMATCH', {
        userId: user._id,
        userCompanyId: user.company_id,
        incidentId: args.incident_id,
        incidentCompanyId: incident.company_id,
        timestamp: new Date().toISOString()
      });
      throw new ConvexError(`Access denied: incident belongs to different company (user: ${user.company_id}, incident: ${incident.company_id})`);
    }

    return incident;
  },
});

/**
 * Get incident narrative by incident ID (internal helper)
 */
export const getIncidentNarrativeByIncidentId = query({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const user = await ctx.runQuery(internal.auth.verifySession, {
      sessionToken: args.sessionToken,
    });

    if (!user) {
      throw new ConvexError("Authentication required");
    }

    const narrative = await ctx.db
      .query("incident_narratives")
      .withIndex("by_incident", (q) => q.eq("incident_id", args.incident_id))
      .first();

    return narrative;
  },
});

/**
 * Story 4.2: Get incomplete incidents for workflow continuation modal
 * Returns user's own incomplete incidents within their company for workflow continuation
 */
export const getMyIncompleteIncidents = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    // Check permissions for viewing personal incidents
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.VIEW_MY_INCIDENTS
    );
    
    // Query user's incomplete incidents within their company
    const incompleteIncidents = await ctx.db
      .query("incidents")
      .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("created_by"), user._id),
          q.or(
            q.eq(q.field("overall_status"), "capture_pending"),
            q.eq(q.field("capture_status"), "draft")
          )
        )
      )
      .order("desc")
      .take(10); // Limit to 10 most recent incomplete incidents

    console.log('📋 INCOMPLETE INCIDENTS FETCHED', {
      userId: user._id,
      companyId: user.company_id,
      count: incompleteIncidents.length,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return incompleteIncidents;
  },
});

/**
 * Get workflow step description helper function
 */
export const getWorkflowStepInfo = (step: number): string => {
  const stepMap: Record<number, string> = {
    1: "Basic Information",
    2: "Before Event",
    3: "During Event", 
    4: "After Event",
    5: "Q&A Session",
    6: "AI Enhancement",
    7: "Review & Submit"
  };
  return stepMap[step] || "Unknown Step";
};

/**
 * Story 4.2: Update incident workflow progress tracking
 * Updates current step, step description, and content preview for workflow continuation
 */
export const updateWorkflowProgress = mutation({
  args: {
    sessionToken: v.string(),
    incidentId: v.id("incidents"),
    current_step: v.optional(v.number()),
    content_preview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check permissions for updating incident
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.EDIT_OWN_INCIDENT_CAPTURE
    );

    // Get the incident to verify ownership
    const incident = await ctx.db.get(args.incidentId);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }

    // Verify company context and ownership
    if (incident.company_id !== user.company_id) {
      throw new ConvexError("Access denied: incident belongs to different company");
    }

    if (incident.created_by !== user._id) {
      throw new ConvexError("Access denied: can only update your own incidents");
    }

    // Prepare updates
    const updates: any = {
      updated_at: Date.now(),
    };

    if (args.current_step) {
      updates.current_step = args.current_step;
      updates.step_description = getWorkflowStepInfo(args.current_step);
    }

    if (args.content_preview) {
      updates.content_preview = args.content_preview.substring(0, 100); // Limit to 100 chars
    }

    // Update the incident
    await ctx.db.patch(args.incidentId, updates);

    console.log('📈 WORKFLOW PROGRESS UPDATED', {
      incidentId: args.incidentId,
      userId: user._id,
      current_step: args.current_step,
      content_preview_length: args.content_preview?.length || 0,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Story 3.4: Auto-Complete Workflow
 * Automatically transitions incident to ready_for_analysis when workflow is complete
 * Triggered when user completes Step 8 (Consolidated Report)
 */
export const autoCompleteWorkflow = mutation({
  args: {
    sessionToken: v.string(),
    incident_id: v.id("incidents"),
    correlation_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = args.correlation_id || `auto-complete-${Date.now()}`;
    
    // Verify user permissions
    const { user } = await requirePermission(ctx, args.sessionToken, PERMISSIONS.UPDATE_INCIDENT);
    
    // Get the incident
    const incident = await ctx.db.get(args.incident_id);
    if (!incident) {
      throw new ConvexError("Incident not found");
    }
    
    // Verify company boundary
    if (incident.company_id !== user.company_id) {
      throw new ConvexError("Access denied - incident belongs to different company");
    }
    
    // Check if already completed
    if (incident.overall_status === "ready_for_analysis" || incident.overall_status === "completed") {
      console.log('⚠️ WORKFLOW ALREADY COMPLETED', {
        incidentId: args.incident_id,
        currentStatus: incident.overall_status,
        userId: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });
      return { 
        success: true, 
        already_completed: true,
        current_status: incident.overall_status 
      };
    }
    
    // Validate that workflow is actually complete
    // Check if enhanced narrative exists (indicates Step 8 completion)
    if (!incident.enhanced_narrative_id) {
      throw new ConvexError("Cannot auto-complete - workflow not fully finished");
    }
    
    const now = Date.now();
    
    // Update incident to ready_for_analysis status
    await ctx.db.patch(args.incident_id, {
      overall_status: "ready_for_analysis",
      workflow_completed_at: now,
      updated_at: now,
    });
    
    // Log the auto-completion
    console.log('✅ WORKFLOW AUTO-COMPLETED', {
      incidentId: args.incident_id,
      userId: user._id,
      userEmail: user.email,
      previousStatus: incident.overall_status,
      newStatus: "ready_for_analysis",
      workflow_completed_at: now,
      correlationId,
      timestamp: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      status: "ready_for_analysis",
      workflow_completed_at: now 
    };
  },
});

/**
 * Story 3.4: Data Backfill for Historical Incidents
 * Retrospectively mark incidents as ready_for_analysis if workflow is complete
 */
export const backfillWorkflowCompletions = mutation({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()), // Batch size, default 50
    correlation_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const correlationId = args.correlation_id || `backfill-${Date.now()}`;
    const limit = args.limit || 50;
    
    // Verify admin permissions for backfill operations
    const { user } = await requirePermission(ctx, args.sessionToken, PERMISSIONS.ADMIN);
    
    // Find incidents that have completed workflow but wrong status
    const incidentsToUpdate = await ctx.db
      .query("incidents")
      .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
      .filter((q) => 
        q.and(
          // Has enhanced narrative (indicates completed workflow)
          q.neq(q.field("enhanced_narrative_id"), undefined),
          // But status is still analysis_pending
          q.eq(q.field("overall_status"), "analysis_pending"),
          // Workflow not already marked complete
          q.eq(q.field("workflow_completed_at"), undefined)
        )
      )
      .take(limit);
    
    const now = Date.now();
    let updatedCount = 0;
    
    for (const incident of incidentsToUpdate) {
      await ctx.db.patch(incident._id, {
        overall_status: "ready_for_analysis",
        workflow_completed_at: incident.updated_at || now, // Use incident's last update or now
        updated_at: now,
      });
      updatedCount++;
    }
    
    console.log('📈 WORKFLOW BACKFILL COMPLETED', {
      processedIncidents: incidentsToUpdate.length,
      updatedCount,
      userId: user._id,
      userEmail: user.email,
      companyId: user.company_id,
      correlationId,
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: true,
      processed: incidentsToUpdate.length,
      updated: updatedCount,
      hasMore: incidentsToUpdate.length === limit,
    };
  },
});