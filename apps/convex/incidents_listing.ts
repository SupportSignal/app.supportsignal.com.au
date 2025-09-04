// @ts-nocheck
/**
 * Story 4.1: Incident Listing API
 * Multi-tenant incident listing with permission-based access control
 */
import { query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission, PERMISSIONS } from './permissions';
import { Id } from './_generated/dataModel';

// Story 4.1: Incident Listing Types
interface IncidentFilter {
  status?: string;
  dateRange?: { start: number; end: number };
  participantId?: Id<"participants">;
  userId?: Id<"users">;
  searchText?: string;
}

/**
 * Story 4.1: Get all incidents within a company for users with VIEW_ALL_COMPANY_INCIDENTS permission
 * Supports filtering, sorting, and pagination
 */
export const getAllCompanyIncidents = query({
  args: {
    sessionToken: v.string(),
    filters: v.optional(v.object({
      status: v.optional(v.string()),
      dateRange: v.optional(v.object({
        start: v.number(),
        end: v.number()
      })),
      participantId: v.optional(v.id("participants")),
      userId: v.optional(v.id("users")), // Filter by worker (if user has permission)
      searchText: v.optional(v.string())
    })),
    pagination: v.optional(v.object({
      limit: v.number(),
      offset: v.number()
    })),
    sorting: v.optional(v.object({
      field: v.union(
        v.literal("date"), 
        v.literal("status"), 
        v.literal("participant"), 
        v.literal("reporter"),
        v.literal("updated")
      ),
      direction: v.union(v.literal("asc"), v.literal("desc"))
    }))
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    console.log('🔍 CONVEX - getAllCompanyIncidents START', {
      hasSessionToken: !!args.sessionToken,
      sessionTokenLength: args.sessionToken?.length || 0,
      filters: args.filters,
      pagination: args.pagination,
      sorting: args.sorting,
      timestamp: new Date().toISOString()
    });

    try {
      // CRITICAL: Use permission-based access control
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS
      );

      console.log('🔍 CONVEX - getAllCompanyIncidents PERMISSION CHECK PASSED', {
        correlationId,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id
        },
        requiredPermission: PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS,
        timestamp: new Date().toISOString()
      });
    
      // MUST filter by companyId - NO exceptions
      let query = ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id));
      
      console.log('🔍 CONVEX - getAllCompanyIncidents QUERYING DATABASE', {
        correlationId,
        queryCompanyId: user.company_id,
        index: "by_company",
        timestamp: new Date().toISOString()
      });
      
      const incidents = await query.collect();
      let filteredIncidents = incidents;
      
      console.log('🔍 CONVEX - getAllCompanyIncidents INITIAL QUERY RESULT', {
        correlationId,
        rawIncidentCount: incidents.length,
        queryCompanyId: user.company_id,
        sampleIncident: incidents.length > 0 ? {
          id: incidents[0]._id,
          company_id: incidents[0].company_id,
          participant_name: incidents[0].participant_name,
          overall_status: incidents[0].overall_status
        } : null,
        timestamp: new Date().toISOString()
      });
    
    // Apply filters
    if (args.filters) {
      const { status, dateRange, participantId, userId, searchText } = args.filters;
      
      // Status filter
      if (status) {
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.overall_status === status
        );
      }
      
      // Date range filter
      if (dateRange) {
        filteredIncidents = filteredIncidents.filter(incident => {
          const incidentTime = incident.created_at;
          return incidentTime >= dateRange.start && incidentTime <= dateRange.end;
        });
      }
      
      // Participant filter
      if (participantId) {
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.participant_id === participantId
        );
      }
      
      // User/Reporter filter
      if (userId) {
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.created_by === userId
        );
      }
      
      // Text search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.participant_name.toLowerCase().includes(searchLower) ||
          incident.reporter_name.toLowerCase().includes(searchLower) ||
          incident.location.toLowerCase().includes(searchLower)
        );
      }
    }
    
    // Apply sorting
    if (args.sorting) {
      const { field, direction } = args.sorting;
      filteredIncidents.sort((a, b) => {
        let aVal, bVal;
        
        switch (field) {
          case "date":
            aVal = a.created_at;
            bVal = b.created_at;
            break;
          case "updated":
            aVal = a.updated_at;
            bVal = b.updated_at;
            break;
          case "status":
            aVal = a.overall_status;
            bVal = b.overall_status;
            break;
          case "participant":
            aVal = a.participant_name;
            bVal = b.participant_name;
            break;
          case "reporter":
            aVal = a.reporter_name;
            bVal = b.reporter_name;
            break;
          default:
            aVal = a.created_at;
            bVal = b.created_at;
        }
        
        if (direction === "desc") {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        } else {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
      });
    } else {
      // Default sort by created_at desc (newest first)
      filteredIncidents.sort((a, b) => b.created_at - a.created_at);
    }
    
      // Apply pagination
      const pagination = args.pagination || { limit: 50, offset: 0 };
      const totalCount = filteredIncidents.length;
      const paginatedIncidents = filteredIncidents.slice(
        pagination.offset, 
        pagination.offset + pagination.limit
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('🔍 CONVEX - getAllCompanyIncidents SUCCESS RESULT', {
        correlationId,
        totalCount,
        paginatedCount: paginatedIncidents.length,
        hasMore: pagination.offset + pagination.limit < totalCount,
        pagination,
        duration: `${duration}ms`,
        userCompanyId: user.company_id,
        userRole: user.role,
        userName: user.name,
        timestamp: new Date().toISOString()
      });
      
      return {
        incidents: paginatedIncidents,
        totalCount,
        hasMore: pagination.offset + pagination.limit < totalCount,
        correlationId
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('🔍 CONVEX - getAllCompanyIncidents ERROR', {
        error: error.message,
        errorType: error.constructor.name,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
});

/**
 * Story 4.1: Get incidents for the current user (their own incidents only)
 * Used by frontline workers and others without company-wide access
 */
export const getMyIncidents = query({
  args: {
    sessionToken: v.string(),
    includeCompleted: v.optional(v.boolean()),
    filters: v.optional(v.object({
      status: v.optional(v.string()),
      dateRange: v.optional(v.object({
        start: v.number(),
        end: v.number()
      })),
      searchText: v.optional(v.string())
    })),
    pagination: v.optional(v.object({
      limit: v.number(),
      offset: v.number()
    })),
    sorting: v.optional(v.object({
      field: v.union(
        v.literal("date"), 
        v.literal("status"), 
        v.literal("participant"), 
        v.literal("reporter"),
        v.literal("updated")
      ),
      direction: v.union(v.literal("asc"), v.literal("desc"))
    }))
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    console.log('🔍 CONVEX - getMyIncidents START', {
      hasSessionToken: !!args.sessionToken,
      sessionTokenLength: args.sessionToken?.length || 0,
      includeCompleted: args.includeCompleted,
      filters: args.filters,
      pagination: args.pagination,
      timestamp: new Date().toISOString()
    });

    try {
      // Users need basic incident creation permission to view their own incidents
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT
      );

      console.log('🔍 CONVEX - getMyIncidents PERMISSION CHECK PASSED', {
        correlationId,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id
        },
        requiredPermission: PERMISSIONS.CREATE_INCIDENT,
        timestamp: new Date().toISOString()
      });
    
      // Query MUST be scoped to user + company
      let query = ctx.db
        .query("incidents")
        .withIndex("by_company_user", (q) => 
          q.eq("company_id", user.company_id).eq("created_by", user._id)
        );
      
      console.log('🔍 CONVEX - getMyIncidents QUERYING DATABASE', {
        correlationId,
        queryCompanyId: user.company_id,
        queryUserId: user._id,
        index: "by_company_user",
        timestamp: new Date().toISOString()
      });
      
      const incidents = await query.collect();
      let filteredIncidents = incidents;
      
      console.log('🔍 CONVEX - getMyIncidents INITIAL QUERY RESULT', {
        correlationId,
        rawIncidentCount: incidents.length,
        queryCompanyId: user.company_id,
        queryUserId: user._id,
        sampleIncident: incidents.length > 0 ? {
          id: incidents[0]._id,
          company_id: incidents[0].company_id,
          created_by: incidents[0].created_by,
          participant_name: incidents[0].participant_name,
          overall_status: incidents[0].overall_status
        } : null,
        timestamp: new Date().toISOString()
      });
    
    // Apply filters
    if (args.filters) {
      const { status, dateRange, searchText } = args.filters;
      
      // Status filter
      if (status) {
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.overall_status === status
        );
      }
      
      // Date range filter
      if (dateRange) {
        filteredIncidents = filteredIncidents.filter(incident => {
          const incidentTime = incident.created_at;
          return incidentTime >= dateRange.start && incidentTime <= dateRange.end;
        });
      }
      
      // Text search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filteredIncidents = filteredIncidents.filter(incident => 
          incident.participant_name.toLowerCase().includes(searchLower) ||
          incident.reporter_name.toLowerCase().includes(searchLower) ||
          incident.location.toLowerCase().includes(searchLower)
        );
      }
    }
    
    // Filter out completed incidents if not requested
    if (!args.includeCompleted) {
      filteredIncidents = filteredIncidents.filter(incident => 
        incident.overall_status !== "completed"
      );
    }
    
      // Apply sorting
      if (args.sorting) {
        const { field, direction } = args.sorting;
        filteredIncidents.sort((a, b) => {
          let aVal, bVal;
          
          switch (field) {
            case "date":
              aVal = a.created_at;
              bVal = b.created_at;
              break;
            case "updated":
              aVal = a.updated_at;
              bVal = b.updated_at;
              break;
            case "status":
              aVal = a.overall_status;
              bVal = b.overall_status;
              break;
            case "participant":
              aVal = a.participant_name;
              bVal = b.participant_name;
              break;
            case "reporter":
              aVal = a.reporter_name;
              bVal = b.reporter_name;
              break;
            default:
              aVal = a.created_at;
              bVal = b.created_at;
          }
          
          if (direction === "desc") {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          } else {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          }
        });
      } else {
        // Default sort by created_at desc (newest first)
        filteredIncidents.sort((a, b) => b.created_at - a.created_at);
      }
      
      // Apply pagination
      const pagination = args.pagination || { limit: 50, offset: 0 };
      const totalCount = filteredIncidents.length;
      const paginatedIncidents = filteredIncidents.slice(
        pagination.offset, 
        pagination.offset + pagination.limit
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('🔍 CONVEX - getMyIncidents SUCCESS RESULT', {
        correlationId,
        totalCount,
        paginatedCount: paginatedIncidents.length,
        hasMore: pagination.offset + pagination.limit < totalCount,
        pagination,
        includeCompleted: args.includeCompleted,
        duration: `${duration}ms`,
        userCompanyId: user.company_id,
        userId: user._id,
        userRole: user.role,
        userName: user.name,
        timestamp: new Date().toISOString()
      });
      
      return {
        incidents: paginatedIncidents,
        totalCount,
        hasMore: pagination.offset + pagination.limit < totalCount,
        correlationId
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('🔍 CONVEX - getMyIncidents ERROR', {
        error: error.message,
        errorType: error.constructor.name,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
});

/**
 * Story 4.1: Get incident counts by status for dashboard widgets
 * Adapts based on user permissions
 */
export const getIncidentCounts = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    let incidents;
    let scope = "personal";
    
    // Try broad permission first for company-wide counts
    try {
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.VIEW_ALL_COMPANY_INCIDENTS
      );
      
      // Return counts by status for all company incidents
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .collect();
      scope = "company";
      
    } catch (error) {
      // Fall back to personal incident counts only
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT
      );
      
      // Return counts for user's own incidents within company
      incidents = await ctx.db
        .query("incidents")
        .withIndex("by_company_user", (q) => 
          q.eq("company_id", user.company_id).eq("created_by", user._id)
        )
        .collect();
    }
    
    // Calculate counts by status
    const counts = {
      capture_pending: 0,
      analysis_pending: 0,
      completed: 0,
      total: incidents.length
    };
    
    incidents.forEach(incident => {
      if (incident.overall_status === "capture_pending") {
        counts.capture_pending++;
      } else if (incident.overall_status === "analysis_pending") {
        counts.analysis_pending++;
      } else if (incident.overall_status === "completed") {
        counts.completed++;
      }
    });
    
    return {
      ...counts,
      scope // "personal" or "company"
    };
  }
});

/**
 * Story 4.1: Get incomplete incidents for workflow continuation modal (Story 4.2 preparation)
 */
export const getMyIncompleteIncidents = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const { user, correlationId } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT
    );
    
    console.log(`📋 BACKEND: getMyIncompleteIncidents called for user ${user.email} (ID: ${user._id})`);
    console.log(`📋 BACKEND: Company ID: ${user.company_id}`);
    
    // Get total count of incomplete incidents
    const allIncompleteIncidents = await ctx.db
      .query("incidents")
      .withIndex("by_company_user", (q) => 
        q.eq("company_id", user.company_id).eq("created_by", user._id)
      )
      .filter((q) => q.neq(q.field("overall_status"), "completed"))
      .collect();
    
    // Get top 5 most recent for display
    const recentIncidents = await ctx.db
      .query("incidents")
      .withIndex("by_company_user", (q) => 
        q.eq("company_id", user.company_id).eq("created_by", user._id)
      )
      .filter((q) => q.neq(q.field("overall_status"), "completed"))
      .order("desc")
      .take(5); // Show top 5 for modal display
    
    const totalCount = allIncompleteIncidents.length;
    console.log(`📋 BACKEND: Found ${totalCount} total incomplete incidents, showing top ${recentIncidents.length}`);
    console.log(`📋 BACKEND: Recent incidents:`, recentIncidents.map(i => ({
      id: i._id,
      participant: i.participant_name,
      overall_status: i.overall_status,
      capture_status: i.capture_status,
      created_at: i.created_at
    })));
    
    return {
      incidents: recentIncidents,
      count: recentIncidents.length,
      totalCount: totalCount,
      correlationId
    };
  }
});