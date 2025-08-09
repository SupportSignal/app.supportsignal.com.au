import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Update participant status (active/inactive/discharged)
 * Implements AC5: Status management with audit trail
 * Implements soft delete pattern - participants are never hard deleted, only status changed
 */
export const updateParticipantStatus = mutation({
  args: {
    sessionToken: v.string(),
    participantId: v.id("participants"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("discharged")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has permission to update participant status
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for participant management
        { errorMessage: 'Insufficient permissions to update participant status. Only team leads, company admins, and system admins can change participant status.' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to update participants');
      }

      // Get existing participant
      const existingParticipant = await ctx.db.get(args.participantId);
      if (!existingParticipant) {
        throw new ConvexError('Participant not found');
      }

      // Verify company isolation
      if (existingParticipant.company_id !== user.company_id) {
        throw new ConvexError('Access denied: Participant belongs to a different company');
      }

      // Check if status is actually changing
      if (existingParticipant.status === args.status) {
        return {
          success: true,
          message: 'Participant status is already set to the requested value',
          participantId: args.participantId,
          correlationId,
        };
      }

      // Validate reason if participant is being discharged
      if (args.status === 'discharged' && (!args.reason || args.reason.trim().length === 0)) {
        throw new ConvexError('Reason is required when discharging a participant');
      }

      // Update participant status
      await ctx.db.patch(args.participantId, {
        status: args.status,
        updated_at: Date.now(),
        updated_by: user._id,
      });

      // Enhanced audit logging for status changes
      console.log('📋 PARTICIPANT STATUS CHANGED', {
        participantId: args.participantId,
        ndisNumber: existingParticipant.ndis_number,
        name: `${existingParticipant.first_name} ${existingParticipant.last_name}`,
        companyId: user.company_id,
        statusChange: {
          from: existingParticipant.status,
          to: args.status,
          reason: args.reason,
        },
        changedBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      // Different success messages based on status change
      let message = '';
      switch (args.status) {
        case 'active':
          message = 'Participant has been activated and is now available for incident reporting';
          break;
        case 'inactive':
          message = 'Participant has been set to inactive status';
          break;
        case 'discharged':
          message = 'Participant has been discharged and is no longer available for new incident reports';
          break;
        default:
          message = 'Participant status has been updated successfully';
      }

      return {
        success: true,
        message,
        participantId: args.participantId,
        previousStatus: existingParticipant.status,
        newStatus: args.status,
        correlationId,
      };
    } catch (error) {
      console.error('Error updating participant status:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to update participant status: ${(error as Error).message}`);
    }
  },
});