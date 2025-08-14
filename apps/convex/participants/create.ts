import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Create a new NDIS participant
 * Implements AC1: Role-based access control for participant creation
 * Implements AC3: Automatic company association for all new participants
 * Implements AC6: Duplicate detection by NDIS number within company scope
 */
export const createParticipant = mutation({
  args: {
    sessionToken: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    date_of_birth: v.string(),
    ndis_number: v.string(),
    contact_phone: v.optional(v.string()),
    emergency_contact: v.optional(v.string()),
    support_level: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    care_notes: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("discharged")),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has permission to create participants
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.CREATE_INCIDENT, // Using CREATE_INCIDENT as proxy for participant management
        { errorMessage: 'Insufficient permissions to create participants. Only team leads, company admins, and system admins can create participant records.' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to create participants');
      }

      // Validate input data
      if (args.first_name.length < 2 || args.first_name.length > 50) {
        throw new ConvexError('First name must be between 2 and 50 characters');
      }

      if (args.last_name.length < 2 || args.last_name.length > 50) {
        throw new ConvexError('Last name must be between 2 and 50 characters');
      }

      // Validate NDIS number format (9 digits)
      if (!/^\d{9}$/.test(args.ndis_number)) {
        throw new ConvexError('NDIS number must be exactly 9 digits');
      }

      // Validate date of birth (basic format check and not future date)
      const dobDate = new Date(args.date_of_birth);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        throw new ConvexError('Invalid date of birth or future date not allowed');
      }

      // Validate phone number format if provided
      if (args.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(args.contact_phone)) {
        throw new ConvexError('Invalid phone number format');
      }

      // Validate care notes length if provided
      if (args.care_notes && args.care_notes.length > 500) {
        throw new ConvexError('Care notes must not exceed 500 characters');
      }

      // Check for duplicate NDIS number within company scope
      const existingParticipant = await ctx.db
        .query("participants")
        .withIndex("by_ndis_number", (q) => q.eq("ndis_number", args.ndis_number))
        .filter((q) => q.eq(q.field("company_id"), user.company_id))
        .first();
        
      if (existingParticipant) {
        throw new ConvexError('A participant with this NDIS number already exists in your company');
      }

      // Create participant record
      const participantId = await ctx.db.insert("participants", {
        company_id: user.company_id,
        first_name: args.first_name.trim(),
        last_name: args.last_name.trim(),
        date_of_birth: args.date_of_birth,
        ndis_number: args.ndis_number,
        contact_phone: args.contact_phone?.trim(),
        emergency_contact: args.emergency_contact?.trim(),
        support_level: args.support_level,
        care_notes: args.care_notes?.trim(),
        status: args.status,
        created_at: Date.now(),
        created_by: user._id,
        updated_at: Date.now(),
        updated_by: user._id,
      });

      console.log('👤 PARTICIPANT CREATED', {
        participantId,
        ndisNumber: args.ndis_number,
        name: `${args.first_name} ${args.last_name}`,
        companyId: user.company_id,
        createdBy: user._id,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        participantId,
        correlationId,
      };
    } catch (error) {
      console.error('Error creating participant:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to create participant: ${(error as Error).message}`);
    }
  },
});