import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Advanced search for participants with multiple criteria
 * Implements AC4: Advanced search functionality for participant management
 */
export const searchParticipants = query({
  args: {
    sessionToken: v.string(),
    query: v.optional(v.string()),
    status: v.optional(v.string()),
    support_level: v.optional(v.string()),
    age_range: v.optional(v.object({
      min_age: v.optional(v.number()),
      max_age: v.optional(v.number()),
    })),
    sort_by: v.optional(v.union(
      v.literal("name"),
      v.literal("ndis_number"),
      v.literal("created_date"),
      v.literal("updated_date")
    )),
    sort_order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user authentication
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for basic authenticated access
        { errorMessage: 'Authentication required to search participants' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to search participants');
      }

      // Start with company-scoped query for multi-tenant isolation
      let query = ctx.db
        .query("participants")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id));
      
      // Apply status filter if provided
      if (args.status && args.status !== 'all') {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }

      // Apply support level filter if provided
      if (args.support_level && args.support_level !== 'all') {
        query = query.filter((q) => q.eq(q.field("support_level"), args.support_level));
      }

      // Get all participants that match basic filters
      const allParticipants = await query.collect();
      
      // Apply text search if provided
      let filteredParticipants = allParticipants;
      if (args.query && args.query.trim().length > 0) {
        const searchLower = args.query.toLowerCase().trim();
        filteredParticipants = allParticipants.filter(p => 
          p.first_name.toLowerCase().includes(searchLower) ||
          p.last_name.toLowerCase().includes(searchLower) ||
          p.ndis_number.toLowerCase().includes(searchLower) ||
          (p.contact_phone && p.contact_phone.toLowerCase().includes(searchLower)) ||
          (p.emergency_contact && p.emergency_contact.toLowerCase().includes(searchLower)) ||
          (p.care_notes && p.care_notes.toLowerCase().includes(searchLower))
        );
      }

      // Apply age range filter if provided
      if (args.age_range && (args.age_range.min_age || args.age_range.max_age)) {
        const currentDate = new Date();
        filteredParticipants = filteredParticipants.filter(p => {
          const birthDate = new Date(p.date_of_birth);
          if (isNaN(birthDate.getTime())) return false;
          
          const age = Math.floor((currentDate.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          
          if (args.age_range!.min_age !== undefined && age < args.age_range!.min_age) return false;
          if (args.age_range!.max_age !== undefined && age > args.age_range!.max_age) return false;
          
          return true;
        });
      }

      // Apply sorting
      const sortBy = args.sort_by || 'name';
      const sortOrder = args.sort_order || 'asc';
      
      filteredParticipants.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
            break;
          case 'ndis_number':
            comparison = a.ndis_number.localeCompare(b.ndis_number);
            break;
          case 'created_date':
            comparison = a.created_at - b.created_at;
            break;
          case 'updated_date':
            comparison = a.updated_at - b.updated_at;
            break;
          default:
            comparison = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const offset = args.offset || 0;
      const limit = args.limit || filteredParticipants.length;
      const paginatedParticipants = filteredParticipants.slice(offset, offset + limit);

      console.log('🔍 PARTICIPANTS SEARCHED', {
        companyId: user.company_id,
        searchedBy: user._id,
        searchQuery: args.query,
        filters: {
          status: args.status,
          support_level: args.support_level,
          age_range: args.age_range,
        },
        sorting: { sort_by: sortBy, sort_order: sortOrder },
        pagination: { offset, limit },
        resultsFound: filteredParticipants.length,
        resultsReturned: paginatedParticipants.length,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        participants: paginatedParticipants.map(p => ({
          _id: p._id,
          first_name: p.first_name,
          last_name: p.last_name,
          date_of_birth: p.date_of_birth,
          ndis_number: p.ndis_number,
          contact_phone: p.contact_phone,
          emergency_contact: p.emergency_contact,
          support_level: p.support_level,
          care_notes: p.care_notes,
          status: p.status,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })),
        totalCount: filteredParticipants.length,
        returnedCount: paginatedParticipants.length,
        hasMore: offset + limit < filteredParticipants.length,
        correlationId,
      };
    } catch (error) {
      console.error('Error searching participants:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to search participants: ${(error as Error).message}`);
    }
  },
});