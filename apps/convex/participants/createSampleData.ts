import { mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Create sample participant data for testing purposes
 * Requires SAMPLE_DATA permission (system_admin only)
 */
export const createSampleParticipants = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has sample data permission
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.SAMPLE_DATA,
        { errorMessage: 'Sample data access required' }
      );

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company to create sample participants');
      }

      // Get a site from the user's company to associate participants with
      const site = await ctx.db
        .query("sites")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .first();

      if (!site) {
        throw new ConvexError('No sites found in company. Please create a site first before adding sample participants.');
      }

      const now = Date.now();

      // Sample participant data
      const sampleParticipants = [
        {
          first_name: 'Emma',
          last_name: 'Johnson',
          date_of_birth: '1995-03-15',
          ndis_number: '123456001',
          contact_phone: '0412 345 678',
          emergency_contact: 'Mary Johnson (Mother) - 0423 456 789',
          support_level: 'medium' as const,
          care_notes: 'Requires assistance with daily living activities. Responds well to routine and clear communication.',
          status: 'active' as const,
        },
        {
          first_name: 'Michael',
          last_name: 'Chen',
          date_of_birth: '1988-07-22',
          ndis_number: '123456002',
          contact_phone: '0434 567 890',
          emergency_contact: 'Susan Chen (Sister) - 0445 678 901',
          support_level: 'high' as const,
          care_notes: 'Complex needs requiring 24/7 supervision. Has mobility issues and requires wheelchair assistance.',
          status: 'active' as const,
        },
        {
          first_name: 'Sarah',
          last_name: 'Williams',
          date_of_birth: '1990-11-08',
          ndis_number: '123456003',
          contact_phone: '0456 789 012',
          emergency_contact: 'David Williams (Father) - 0467 890 123',
          support_level: 'low' as const,
          care_notes: 'Independent living with minimal support. Attends day programs and social activities.',
          status: 'active' as const,
        },
        {
          first_name: 'James',
          last_name: 'Brown',
          date_of_birth: '1992-01-30',
          ndis_number: '123456004',
          contact_phone: '0478 901 234',
          emergency_contact: 'Lisa Brown (Partner) - 0489 012 345',
          support_level: 'medium' as const,
          care_notes: 'Autism spectrum disorder. Benefits from structured environments and visual supports.',
          status: 'active' as const,
        },
        {
          first_name: 'Rachel',
          last_name: 'Davis',
          date_of_birth: '1985-09-14',
          ndis_number: '123456005',
          contact_phone: '0490 123 456',
          emergency_contact: 'Tom Davis (Brother) - 0401 234 567',
          support_level: 'high' as const,
          care_notes: 'Intellectual disability with challenging behaviors. Requires specialized behavioral support.',
          status: 'inactive' as const,
        },
        {
          first_name: 'Anthony',
          last_name: 'Martinez',
          date_of_birth: '1983-05-20',
          ndis_number: '123456006',
          contact_phone: '0401 555 123',
          emergency_contact: 'Maria Martinez (Wife) - 0412 666 234',
          support_level: 'low' as const,
          care_notes: 'Services completed successfully. Transitioned to independent living. No longer requires ongoing support.',
          status: 'discharged' as const,
        }
      ];

      // Check if sample participants already exist
      const existingParticipants = await ctx.db
        .query("participants")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .collect();

      // Check if any of our sample NDIS numbers already exist
      const existingSampleNdis = existingParticipants.filter(p => 
        sampleParticipants.some(sp => sp.ndis_number === p.ndis_number)
      );

      if (existingSampleNdis.length > 0) {
        return {
          success: false,
          message: 'Sample participants already exist',
          existingCount: existingSampleNdis.length,
          correlationId,
        };
      }

      // Create sample participants
      const createdParticipants = [];
      for (const participantData of sampleParticipants) {
        const participantId = await ctx.db.insert("participants", {
          company_id: user.company_id,
          site_id: site._id,
          ...participantData,
          created_at: now,
          created_by: user._id,
          updated_at: now,
          updated_by: user._id,
        });

        createdParticipants.push(participantId);
      }

      console.log('🧪 SAMPLE PARTICIPANTS CREATED', {
        companyId: user.company_id,
        createdBy: user._id,
        participantCount: createdParticipants.length,
        participantIds: createdParticipants,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Successfully created ${createdParticipants.length} sample participants`,
        participantIds: createdParticipants,
        correlationId,
      };
    } catch (error) {
      console.error('Error creating sample participants:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to create sample participants: ${(error as Error).message}`);
    }
  },
});

/**
 * Delete all participants for the current company (careful!)
 * Used for testing - requires SAMPLE_DATA permission
 */
export const clearAllParticipants = mutation({
  args: {
    sessionToken: v.string(),
    confirmAction: v.string(), // Must be "DELETE_ALL_PARTICIPANTS" to confirm
  },
  handler: async (ctx, args) => {
    try {
      // Verify user has sample data permission
      const { user, correlationId } = await requirePermission(
        ctx,
        args.sessionToken,
        PERMISSIONS.SAMPLE_DATA,
        { errorMessage: 'Sample data access required for this operation' }
      );

      if (args.confirmAction !== 'DELETE_ALL_PARTICIPANTS') {
        throw new ConvexError('Invalid confirmation string. This is a destructive operation.');
      }

      if (!user.company_id) {
        throw new ConvexError('User must be associated with a company');
      }

      // Get all participants for the company
      const participants = await ctx.db
        .query("participants")
        .withIndex("by_company", (q) => q.eq("company_id", user.company_id))
        .collect();

      // Delete all participants
      const deletedIds = [];
      for (const participant of participants) {
        await ctx.db.delete(participant._id);
        deletedIds.push(participant._id);
      }

      console.log('🗑️ ALL PARTICIPANTS CLEARED', {
        companyId: user.company_id,
        deletedBy: user._id,
        participantCount: deletedIds.length,
        correlationId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Deleted ${deletedIds.length} participants from company`,
        deletedCount: deletedIds.length,
        correlationId,
      };
    } catch (error) {
      console.error('Error clearing participants:', error);
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError(`Failed to clear participants: ${(error as Error).message}`);
    }
  },
});