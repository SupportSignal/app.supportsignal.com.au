import { internalMutation } from '../_generated/server';

/**
 * Migration: Create "Primary" site for all existing companies
 *
 * Story 7.3 - Site Management
 * This migration ensures all companies have at least one site (Primary) before
 * participants and incidents are linked to sites in future stories.
 *
 * Idempotent: Can be run multiple times safely, will skip companies that already have sites.
 */
export const createPrimarySitesForExistingCompanies = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log('🔧 MIGRATION START: Creating Primary sites for existing companies');

    // Get all companies
    const allCompanies = await ctx.db.query('companies').collect();
    console.log(`📊 Found ${allCompanies.length} total companies`);

    let createdCount = 0;
    let skippedCount = 0;
    const timestamp = Date.now();

    for (const company of allCompanies) {
      // Check if company already has sites
      const existingSites = await ctx.db
        .query('sites')
        .withIndex('by_company', (q) => q.eq('company_id', company._id))
        .first();

      if (existingSites) {
        skippedCount++;
        console.log(`⏭️  Company "${company.name}" already has sites, skipping`);
        continue;
      }

      // Create Primary site for this company
      // Use system user (created_by) - get first system_admin user
      const systemAdmin = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('role'), 'system_admin'))
        .first();

      if (!systemAdmin) {
        console.error(`❌ No system admin found to create site for company ${company.name}`);
        continue;
      }

      const siteId = await ctx.db.insert('sites', {
        company_id: company._id,
        name: 'Primary',
        created_at: timestamp,
        created_by: systemAdmin._id,
      });

      createdCount++;
      console.log(`✅ Created Primary site for company "${company.name}" (site: ${siteId})`);
    }

    console.log(`🔧 MIGRATION COMPLETE: Created ${createdCount} sites, skipped ${skippedCount} companies`);

    return {
      success: true,
      totalCompanies: allCompanies.length,
      created: createdCount,
      skipped: skippedCount,
    };
  },
});
