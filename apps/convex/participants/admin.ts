/**
 * Participant Administration Functions (Story 7.4)
 *
 * System admin CRUD operations for managing participants within companies.
 * Participants must be assigned to sites (physical locations).
 */

import { query, mutation } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';
import { Id } from '../_generated/dataModel';

/**
 * List all participants for a company with optional site filtering
 */
export const listParticipants = query({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
    siteId: v.optional(v.id('sites')),
  },
  handler: async (ctx, args) => {
    // Verify system admin permission
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Build query based on whether site filter is provided
    let participants;
    if (args.siteId) {
      // Filter by company and site
      const siteId = args.siteId; // Type narrowing
      participants = await ctx.db
        .query('participants')
        .withIndex('by_company_and_site', (q) =>
          q.eq('company_id', args.companyId).eq('site_id', siteId)
        )
        .collect();
    } else {
      // Filter by company only
      participants = await ctx.db
        .query('participants')
        .withIndex('by_company', (q) => q.eq('company_id', args.companyId))
        .collect();
    }

    // Sort by last name, first name
    participants.sort((a, b) => {
      const lastNameCompare = a.last_name.localeCompare(b.last_name);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.first_name.localeCompare(b.first_name);
    });

    // Enrich with site information
    const enrichedParticipants = await Promise.all(
      participants.map(async (participant) => {
        const site = await ctx.db
          .query("sites")
          .filter((q) => q.eq(q.field("_id"), participant.site_id))
          .first();
        return {
          ...participant,
          site: site
            ? {
                _id: site._id,
                name: site.name,
                company_id: site.company_id,
              }
            : null,
        };
      })
    );

    return enrichedParticipants;
  },
});

/**
 * Get a single participant by ID with site information
 */
export const getParticipantById = query({
  args: {
    sessionToken: v.string(),
    participantId: v.id('participants'),
  },
  handler: async (ctx, args) => {
    // Verify system admin permission
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new ConvexError({
        message: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND',
      });
    }

    // Get site information
    let site = null;
    if (participant.site_id) {
      site = await ctx.db
        .query("sites")
        .filter((q) => q.eq(q.field("_id"), participant.site_id))
        .first();
    }

    return {
      ...participant,
      site: site
        ? {
            _id: site._id,
            name: site.name,
            company_id: site.company_id,
          }
        : null,
    };
  },
});

/**
 * Create a new participant
 */
export const createParticipant = mutation({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
    siteId: v.id('sites'),
    firstName: v.string(),
    lastName: v.string(),
    ndisNumber: v.string(),
    dateOfBirth: v.string(),
    supportLevel: v.union(
      v.literal('high'),
      v.literal('medium'),
      v.literal('low')
    ),
    contactPhone: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    careNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify system admin permission
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Validate required fields
    if (!args.firstName.trim()) {
      throw new ConvexError({
        message: 'First name is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!args.lastName.trim()) {
      throw new ConvexError({
        message: 'Last name is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    if (!args.ndisNumber.trim()) {
      throw new ConvexError({
        message: 'NDIS number is required',
        code: 'MISSING_REQUIRED_FIELD',
      });
    }

    // Validate NDIS number format (9 digits)
    const ndisPattern = /^\d{9}$/;
    if (!ndisPattern.test(args.ndisNumber.trim())) {
      throw new ConvexError({
        message: 'NDIS number must be 9 digits',
        code: 'INVALID_NDIS_NUMBER',
        field: 'ndis_number',
      });
    }

    // Check NDIS uniqueness within company
    const existingParticipant = await ctx.db
      .query('participants')
      .withIndex('by_company', (q) => q.eq('company_id', args.companyId))
      .filter((q) => q.eq(q.field('ndis_number'), args.ndisNumber.trim()))
      .first();

    if (existingParticipant) {
      throw new ConvexError({
        message: `NDIS number ${args.ndisNumber} is already registered to another participant in this company`,
        code: 'DUPLICATE_NDIS_NUMBER',
        field: 'ndis_number',
      });
    }

    // Validate site belongs to company
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new ConvexError({
        message: 'Site not found',
        code: 'INVALID_SITE',
      });
    }

    if (site.company_id !== args.companyId) {
      throw new ConvexError({
        message: 'Site does not belong to this company',
        code: 'INVALID_SITE',
      });
    }

    // Create participant
    const now = Date.now();
    const participantId = await ctx.db.insert('participants', {
      company_id: args.companyId,
      site_id: args.siteId,
      first_name: args.firstName.trim(),
      last_name: args.lastName.trim(),
      ndis_number: args.ndisNumber.trim(),
      date_of_birth: args.dateOfBirth,
      support_level: args.supportLevel,
      contact_phone: args.contactPhone?.trim(),
      emergency_contact: args.emergencyContact?.trim(),
      care_notes: args.careNotes?.trim(),
      status: 'active',
      created_at: now,
      created_by: user._id,
      updated_at: now,
      updated_by: user._id,
    });

    return { participantId };
  },
});

/**
 * Update an existing participant
 */
export const updateParticipant = mutation({
  args: {
    sessionToken: v.string(),
    participantId: v.id('participants'),
    siteId: v.optional(v.id('sites')),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    ndisNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    supportLevel: v.optional(
      v.union(v.literal('high'), v.literal('medium'), v.literal('low'))
    ),
    contactPhone: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    careNotes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('active'),
        v.literal('inactive'),
        v.literal('discharged')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Verify system admin permission
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Get existing participant
    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new ConvexError({
        message: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND',
      });
    }

    // Build update object
    const updates: any = {
      updated_at: Date.now(),
      updated_by: user._id,
    };

    // Validate and add fields if provided
    if (args.firstName !== undefined) {
      if (!args.firstName.trim()) {
        throw new ConvexError({
          message: 'First name cannot be empty',
          code: 'INVALID_INPUT',
        });
      }
      updates.first_name = args.firstName.trim();
    }

    if (args.lastName !== undefined) {
      if (!args.lastName.trim()) {
        throw new ConvexError({
          message: 'Last name cannot be empty',
          code: 'INVALID_INPUT',
        });
      }
      updates.last_name = args.lastName.trim();
    }

    if (args.ndisNumber !== undefined) {
      const ndisNumber = args.ndisNumber; // Type narrowing
      const ndisPattern = /^\d{9}$/;
      if (!ndisPattern.test(ndisNumber.trim())) {
        throw new ConvexError({
          message: 'NDIS number must be 9 digits',
          code: 'INVALID_NDIS_NUMBER',
          field: 'ndis_number',
        });
      }

      // Check NDIS uniqueness within company (exclude current participant)
      const existingParticipant = await ctx.db
        .query('participants')
        .withIndex('by_company', (q) => q.eq('company_id', participant.company_id))
        .filter((q) => q.eq(q.field('ndis_number'), ndisNumber.trim()))
        .first();

      if (existingParticipant && existingParticipant._id !== args.participantId) {
        throw new ConvexError({
          message: `NDIS number ${ndisNumber} is already registered to another participant in this company`,
          code: 'DUPLICATE_NDIS_NUMBER',
          field: 'ndis_number',
        });
      }

      updates.ndis_number = ndisNumber.trim();
    }

    if (args.siteId !== undefined) {
      const site = await ctx.db.get(args.siteId);
      if (!site) {
        throw new ConvexError({
          message: 'Site not found',
          code: 'INVALID_SITE',
        });
      }

      if (site.company_id !== participant.company_id) {
        throw new ConvexError({
          message: 'Site does not belong to participant company',
          code: 'INVALID_SITE',
        });
      }

      updates.site_id = args.siteId;
    }

    if (args.dateOfBirth !== undefined) {
      updates.date_of_birth = args.dateOfBirth;
    }

    if (args.supportLevel !== undefined) {
      updates.support_level = args.supportLevel;
    }

    if (args.contactPhone !== undefined) {
      updates.contact_phone = args.contactPhone?.trim();
    }

    if (args.emergencyContact !== undefined) {
      updates.emergency_contact = args.emergencyContact?.trim();
    }

    if (args.careNotes !== undefined) {
      updates.care_notes = args.careNotes?.trim();
    }

    if (args.status !== undefined) {
      updates.status = args.status;
    }

    // Update participant
    await ctx.db.patch(args.participantId, updates);

    return { success: true };
  },
});

/**
 * Delete a participant
 */
export const deleteParticipant = mutation({
  args: {
    sessionToken: v.string(),
    participantId: v.id('participants'),
  },
  handler: async (ctx, args) => {
    // Verify system admin permission
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_ALL_COMPANIES
    );

    // Get participant
    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new ConvexError({
        message: 'Participant not found',
        code: 'PARTICIPANT_NOT_FOUND',
      });
    }

    // Check if participant has associated incidents
    const incidents = await ctx.db
      .query('incidents')
      .withIndex('by_company', (q) => q.eq('company_id', participant.company_id))
      .filter((q) => q.eq(q.field('participant_id'), args.participantId))
      .first();

    if (incidents) {
      throw new ConvexError({
        message:
          'Cannot delete participant with associated incidents. Please discharge the participant instead.',
        code: 'PARTICIPANT_HAS_INCIDENTS',
      });
    }

    // Delete participant
    await ctx.db.delete(args.participantId);

    return { success: true };
  },
});
