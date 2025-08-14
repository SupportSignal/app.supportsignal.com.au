import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Update an existing NDIS participant
 * Implements AC5: Full CRUD operations with audit trail and change tracking
 * Implements AC6: Duplicate detection by NDIS number within company scope
 */
export const updateParticipant = mutation({
  args: {
    sessionToken: v.string(),
    participantId: v.id("participants"),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    date_of_birth: v.optional(v.string()),
    ndis_number: v.optional(v.string()),
    contact_phone: v.optional(v.string()),
    emergency_contact: v.optional(v.string()),
    support_level: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"))),
    care_notes: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("discharged"))),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has permission to update participants
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for participant management
        { errorMessage: 'Insufficient permissions to update participants. Only team leads, company admins, and system admins can update participant records.' }
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

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: Date.now(),
        updated_by: user._id,
      };

      // Validate and add fields that are being updated
      if (args.first_name !== undefined) {
        if (args.first_name.length < 2 || args.first_name.length > 50) {
          throw new ConvexError('First name must be between 2 and 50 characters');
        }
        updateData.first_name = args.first_name.trim();
      }

      if (args.last_name !== undefined) {
        if (args.last_name.length < 2 || args.last_name.length > 50) {
          throw new ConvexError('Last name must be between 2 and 50 characters');
        }
        updateData.last_name = args.last_name.trim();
      }

      if (args.date_of_birth !== undefined) {
        const dobDate = new Date(args.date_of_birth);
        if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
          throw new ConvexError('Invalid date of birth or future date not allowed');
        }
        updateData.date_of_birth = args.date_of_birth;
      }

      if (args.ndis_number !== undefined) {
        // Validate NDIS number format (9 digits)
        if (!/^\d{9}$/.test(args.ndis_number)) {
          throw new ConvexError('NDIS number must be exactly 9 digits');
        }

        // Check for duplicate NDIS number within company scope (excluding current participant)
        if (args.ndis_number !== existingParticipant.ndis_number) {
          const duplicateParticipant = await ctx.db
            .query("participants")
            .withIndex("by_ndis_number", (q) => q.eq("ndis_number", args.ndis_number!))
            .filter((q) => q.eq(q.field("company_id"), user.company_id))
            .filter((q) => q.neq(q.field("_id"), args.participantId))
            .first();
            
          if (duplicateParticipant) {
            throw new ConvexError('A participant with this NDIS number already exists in your company');
          }
        }
        updateData.ndis_number = args.ndis_number;
      }

      if (args.contact_phone !== undefined) {
        if (args.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(args.contact_phone)) {
          throw new ConvexError('Invalid phone number format');
        }
        updateData.contact_phone = args.contact_phone?.trim();
      }

      if (args.emergency_contact !== undefined) {
        updateData.emergency_contact = args.emergency_contact?.trim();
      }

      if (args.support_level !== undefined) {
        updateData.support_level = args.support_level;
      }

      if (args.care_notes !== undefined) {
        if (args.care_notes && args.care_notes.length > 500) {
          throw new ConvexError('Care notes must not exceed 500 characters');
        }
        updateData.care_notes = args.care_notes?.trim();
      }

      if (args.status !== undefined) {
        updateData.status = args.status;
      }

      // Update participant record
      await ctx.db.patch(args.participantId, updateData);

      // Get updated participant for audit logging
      const updatedParticipant = await ctx.db.get(args.participantId);

      console.log('👤 PARTICIPANT UPDATED', {
        participantId: args.participantId,
        ndisNumber: updatedParticipant?.ndis_number,
        name: `${updatedParticipant?.first_name} ${updatedParticipant?.last_name}`,
        companyId: user.company_id,
        updatedBy: user._id,
        updatedFields: Object.keys(updateData).filter(k => k !== 'updated_at' && k !== 'updated_by'),
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        participantId: args.participantId,
        correlationId,
      };
    } catch (error) {
      console.error('Error updating participant:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to update participant: ${(error as Error).message}`);
    }
  },
});