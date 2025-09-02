import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Get current user's company information with users list
 * Used to display company context in forms and UI components
 */
export const getCurrentUserCompany = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user authentication
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for basic authenticated access
        { errorMessage: 'Authentication required to view company information' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company');
      }

      // Get company information
      const company = await ctx.db.get(user.company_id);
      if (!company) {
        throw new ConvexError('Company information not found');
      }

      // Type assertion: we know this is a company record since user.company_id is Id<"companies">
      const companyRecord = company as any;

      // Get all users in the same company (if user has permission)
      let companyUsers: any[] = [];
      try {
        // Check if user can view company users (team_lead+ can view users)
        if (user.role === 'system_admin' || user.role === 'company_admin' || user.role === 'team_lead') {
          // Get all users in this company
          const users = await ctx.db
            .query("users")
            .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
            .collect();
          
          // Filter sensitive data - only return safe fields
          companyUsers = users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,

            profile_image_url: u.profile_image_url,
          }));
        }
      } catch (error) {
        // User doesn't have permission to view other users, that's fine
        console.log('User lacks permission to view company users:', user.email);
        companyUsers = [];
      }

      console.log('🏢 COMPANY INFO ACCESSED', {
        companyId: companyRecord._id,
        companyName: companyRecord.name,
        accessedBy: user._id,
        userRole: user.role,
        companyUsersCount: companyUsers.length,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        company: {
          _id: companyRecord._id,
          name: companyRecord.name,
          contact_email: companyRecord.contact_email,
          status: companyRecord.status,
          created_at: companyRecord.created_at,
          _creationTime: companyRecord._creationTime,
          users: companyUsers,
          userCount: companyUsers.length,
        },
        correlationId,
      };
    } catch (error) {
      console.error('Error getting company information:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get company information: ${(error as Error).message}`);
    }
  },
});