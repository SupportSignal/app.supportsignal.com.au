import { mutation, query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

// Note: Using MANAGE_COMPANY (singular) - system admins can manage companies and their sites

/**
 * Site Management - System Admin CRUD Operations
 * Story 7.3 - Site Management (System Admin)
 *
 * System admins can manage sites (physical locations) for service provider companies.
 * Sites are company-scoped and used to organize participants and incidents by location.
 */

/**
 * List all sites for a company with participant counts
 */
export const listSites = query({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_COMPANY
    );

    // Get all sites for the company
    const sites = await ctx.db
      .query('sites')
      .withIndex('by_company', (q) => q.eq('company_id', args.companyId))
      .collect();

    // Get participant counts for each site (Story 7.4 - participants will have site_id)
    // For now, return 0 since participants don't have site_id yet
    const sitesWithCounts = sites.map((site) => ({
      _id: site._id,
      name: site.name,
      created_at: site.created_at,
      created_by: site.created_by,
      updated_at: site.updated_at,
      participant_count: 0, // TODO: Story 7.4 - Count participants by site_id
    }));

    return sitesWithCounts;
  },
});

/**
 * Create a new site for a company
 */
export const createSite = mutation({
  args: {
    sessionToken: v.string(),
    companyId: v.id('companies'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_COMPANY
    );

    // Validate company exists
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new ConvexError({
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND'
      });
    }

    // Validate site name
    if (args.name.trim().length < 2) {
      throw new ConvexError({
        message: 'Site name must be at least 2 characters',
        code: 'INVALID_SITE_NAME'
      });
    }

    // Check for duplicate site name within company
    const existingSite = await ctx.db
      .query('sites')
      .withIndex('by_name', (q) => q.eq('company_id', args.companyId).eq('name', args.name))
      .first();

    if (existingSite) {
      throw new ConvexError({
        message: 'A site with this name already exists for this company',
        code: 'DUPLICATE_SITE_NAME'
      });
    }

    // Create the site
    const timestamp = Date.now();
    const siteId = await ctx.db.insert('sites', {
      company_id: args.companyId,
      name: args.name.trim(),
      created_at: timestamp,
      created_by: user._id,
    });

    console.log('🏢 SITE CREATED', {
      siteId,
      companyId: args.companyId,
      siteName: args.name,
      createdBy: user._id,
      timestamp: new Date(timestamp).toISOString(),
    });

    return { siteId };
  },
});

/**
 * Update a site's name
 */
export const updateSite = mutation({
  args: {
    sessionToken: v.string(),
    siteId: v.id('sites'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_COMPANY
    );

    // Get the site
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new ConvexError({
        message: 'Site not found',
        code: 'SITE_NOT_FOUND'
      });
    }

    // Validate site name
    if (args.name.trim().length < 2) {
      throw new ConvexError({
        message: 'Site name must be at least 2 characters',
        code: 'INVALID_SITE_NAME'
      });
    }

    // Check for duplicate site name within company (excluding current site)
    const existingSite = await ctx.db
      .query('sites')
      .withIndex('by_name', (q) => q.eq('company_id', site.company_id).eq('name', args.name))
      .first();

    if (existingSite && existingSite._id !== args.siteId) {
      throw new ConvexError({
        message: 'A site with this name already exists for this company',
        code: 'DUPLICATE_SITE_NAME'
      });
    }

    // Update the site
    const timestamp = Date.now();
    await ctx.db.patch(args.siteId, {
      name: args.name.trim(),
      updated_at: timestamp,
    });

    console.log('🏢 SITE UPDATED', {
      siteId: args.siteId,
      oldName: site.name,
      newName: args.name,
      updatedBy: user._id,
      timestamp: new Date(timestamp).toISOString(),
    });

    return { success: true };
  },
});

/**
 * Delete a site (with validation)
 */
export const deleteSite = mutation({
  args: {
    sessionToken: v.string(),
    siteId: v.id('sites'),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_COMPANY
    );

    // Get the site
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new ConvexError({
        message: 'Site not found',
        code: 'SITE_NOT_FOUND'
      });
    }

    // Check if this is the last site for the company
    const companySites = await ctx.db
      .query('sites')
      .withIndex('by_company', (q) => q.eq('company_id', site.company_id))
      .collect();

    if (companySites.length === 1) {
      throw new ConvexError({
        message: 'Cannot delete the last site for a company. Each company must have at least one site.',
        code: 'LAST_SITE_DELETE_FORBIDDEN'
      });
    }

    // Check if site has participants (Story 7.4 - when participants have site_id)
    // For now, this validation is a placeholder
    // TODO: Story 7.4 - Check participants.site_id === args.siteId
    const participantCount = 0; // Placeholder

    if (participantCount > 0) {
      throw new ConvexError(`Cannot delete site with ${participantCount} assigned participants. Please reassign participants first.`);
    }

    // Delete the site
    await ctx.db.delete(args.siteId);

    console.log('🏢 SITE DELETED', {
      siteId: args.siteId,
      siteName: site.name,
      companyId: site.company_id,
      deletedBy: user._id,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Get a single site by ID
 */
export const getSiteById = query({
  args: {
    sessionToken: v.string(),
    siteId: v.id('sites'),
  },
  handler: async (ctx, args) => {
    // Authentication: System admin only
    await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.MANAGE_COMPANY
    );

    // Get the site
    const site = await ctx.db.get(args.siteId);
    if (!site) {
      throw new ConvexError({
        message: 'Site not found',
        code: 'SITE_NOT_FOUND'
      });
    }

    return site;
  },
});
