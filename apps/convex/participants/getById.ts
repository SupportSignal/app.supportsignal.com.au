import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Get a specific participant by ID
 * Implements company isolation - users can only access participants from their company
 */
export const getParticipantById = query({
  args: {
    sessionToken: v.string(),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user authentication
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for basic authenticated access
        { errorMessage: 'Authentication required to view participant details' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to view participants');
      }

      // Get participant
      const participant = await ctx.db.get(args.participantId);
      if (!participant) {
        throw new ConvexError('Participant not found');
      }

      // Verify company isolation - user can only access participants from their company
      if (participant.company_id !== user.company_id) {
        throw new ConvexError('Access denied: Participant belongs to a different company');
      }

      // Get company information for display
      const company = await ctx.db.get(user.company_id);
      if (!company) {
        throw new ConvexError('Company information not found');
      }

      // Type assertion: we know this is a company record since user.company_id is Id<"companies">
      const companyRecord = company as any;

      console.log('👤 PARTICIPANT ACCESSED', {
        participantId: args.participantId,
        ndisNumber: participant.ndis_number,
        name: `${participant.first_name} ${participant.last_name}`,
        companyId: user.company_id,
        accessedBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        participant: {
          _id: participant._id,
          company_id: participant.company_id,
          first_name: participant.first_name,
          last_name: participant.last_name,
          date_of_birth: participant.date_of_birth,
          ndis_number: participant.ndis_number,
          contact_phone: participant.contact_phone,
          emergency_contact: participant.emergency_contact,
          support_level: participant.support_level,
          care_notes: participant.care_notes,
          status: participant.status,
          created_at: participant.created_at,
          updated_at: participant.updated_at,
        },
        company: {
          _id: companyRecord._id,
          name: companyRecord.name,
          contact_email: companyRecord.contact_email,
        },
        correlationId,
      };
    } catch (error) {
      console.error('Error getting participant:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to get participant: ${(error as Error).message}`);
    }
  },
});