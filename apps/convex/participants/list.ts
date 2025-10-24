import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * List participants with company-scoped access and search functionality
 * Implements AC4: Searchable participant list scoped to user's company
 * Implements AC3: Multi-tenant isolation - users only see participants from their company
 */
export const listParticipants = query({
  args: {
    sessionToken: v.string(),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
    support_level: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user authentication - any authenticated user can view participants from their company
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for basic authenticated access
        { errorMessage: 'Authentication required to view participants' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to view participants');
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

      // Get participants (up to limit if specified)
      const allParticipants = args.limit 
        ? await query.take(args.limit)
        : await query.collect();

      // Get company information for display
      const company = await ctx.db.get(user.company_id);
      if (!company) {
        throw new ConvexError('Company information not found');
      }

      // Type assertion: we know this is a company record since user.company_id is Id<"companies">
      const companyRecord = company as any;
      
      // Apply search filter if provided
      let participants = allParticipants;
      if (args.search && args.search.trim().length > 0) {
        const searchLower = args.search.toLowerCase().trim();
        participants = allParticipants.filter(p => 
          p.first_name.toLowerCase().includes(searchLower) ||
          p.last_name.toLowerCase().includes(searchLower) ||
          p.ndis_number.toLowerCase().includes(searchLower) ||
          (p.contact_phone && p.contact_phone.toLowerCase().includes(searchLower))
        );
      }

      // Sort by last name, then first name for consistent ordering
      participants.sort((a, b) => {
        const lastNameCompare = a.last_name.localeCompare(b.last_name);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.first_name.localeCompare(b.first_name);
      });

      console.log('👥 PARTICIPANTS LISTED', {
        companyId: user.company_id,
        requestedBy: user._id,
        totalCount: participants.length,
        filters: {
          search: args.search,
          status: args.status,
          support_level: args.support_level,
        },
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        participants: participants.map(p => ({
          _id: p._id,
          company_id: p.company_id,
          first_name: p.first_name,
          last_name: p.last_name,
          date_of_birth: p.date_of_birth,
          ndis_number: p.ndis_number,
          contact_phone: p.contact_phone,
          emergency_contact: p.emergency_contact,
          support_level: p.support_level,
          care_notes: p.care_notes,
          status: p.status,
          site_id: p.site_id, // Story 7.6: Include site_id for auto-population
          created_at: p.created_at,
          updated_at: p.updated_at,
        })),
        company: {
          _id: companyRecord._id,
          name: companyRecord.name,
          contact_email: companyRecord.contact_email,
        },
        totalCount: participants.length,
        correlationId,
      };
    } catch (error) {
      console.error('Error listing participants:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to list participants: ${(error as Error).message}`);
    }
  },
});