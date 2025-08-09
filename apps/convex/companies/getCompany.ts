import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Get current user's company information
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

      console.log('🏢 COMPANY INFO ACCESSED', {
        companyId: companyRecord._id,
        companyName: companyRecord.name,
        accessedBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        company: {
          _id: companyRecord._id,
          name: companyRecord.name,
          slug: companyRecord.slug,
          status: companyRecord.status,
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