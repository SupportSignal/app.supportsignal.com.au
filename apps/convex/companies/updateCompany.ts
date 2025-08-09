import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Update company information
 * Only company_admin and system_admin can update company details
 */
export const updateCompany = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    contact_email: v.string(), 
    status: v.union(v.literal("active"), v.literal("trial"), v.literal("suspended")),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has permission to manage company
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.MANAGE_COMPANY,
        { errorMessage: 'Only company administrators can update company information' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.contact_email)) {
        throw new ConvexError('Invalid email format');
      }

      // Validate company name
      if (args.name.trim().length < 2) {
        throw new ConvexError('Company name must be at least 2 characters long');
      }

      // Get current company to verify it exists
      const currentCompany = await ctx.db.get(user.company_id);
      if (!currentCompany) {
        throw new ConvexError('Company not found');
      }

      // Type assertion for company record
      const companyRecord = currentCompany as any;

      console.log('🏢 COMPANY UPDATE INITIATED', {
        companyId: user.company_id,
        currentName: companyRecord.name,
        newName: args.name,
        currentStatus: companyRecord.status,
        newStatus: args.status,
        updatedBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      // Update company information
      await ctx.db.patch(user.company_id, {
        name: args.name.trim(),
        contact_email: args.contact_email.toLowerCase().trim(),
        status: args.status,
      });

      console.log('✅ COMPANY UPDATED SUCCESSFULLY', {
        companyId: user.company_id,
        name: args.name.trim(),
        contact_email: args.contact_email.toLowerCase().trim(),
        status: args.status,
        updatedBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      // Return updated company info
      const updatedCompany = await ctx.db.get(user.company_id);
      return {
        company: updatedCompany,
        correlationId,
      };
    } catch (error) {
      console.error('Error updating company:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to update company: ${(error as Error).message}`);
    }
  },
});