import { query } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { requirePermission, PERMISSIONS } from '../permissions';

/**
 * Story 7.6: List sites for authenticated user's company
 * Used by incident creation form for site selection
 *
 * Any authenticated user can list sites for their company
 * Sites are company-scoped physical locations
 */
export const listCompanySites = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Basic authentication - any logged-in user can list sites for their company
    const { user } = await requirePermission(
      ctx,
      args.sessionToken,
      PERMISSIONS.CREATE_INCIDENT // Minimal permission - anyone who can create incidents can see sites
    );

    // Get all sites for user's company
    const sites = await ctx.db
      .query('sites')
      .withIndex('by_company', (q) => q.eq('company_id', user.company_id))
      .order('asc') // Order by creation time
      .collect();

    // Return simple site data for dropdown selection
    return sites.map((site) => ({
      _id: site._id,
      name: site.name,
      company_id: site.company_id,
    }));
  },
});
