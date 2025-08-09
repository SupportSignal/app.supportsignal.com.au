import { internalMutation } from "../_generated/server";

// Migration to remove the 'slug' field from existing company records
export const cleanupCompanySlugField = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all companies that might have the old slug field
    const companies = await ctx.db.query("companies").collect();
    
    let updateCount = 0;
    
    for (const company of companies) {
      // Check if the company has a slug field (this will be present in the raw document)
      const companyDoc = company as any;
      
      if ('slug' in companyDoc) {
        // Remove the slug field by patching with only the valid fields
        await ctx.db.patch(company._id, {
          name: company.name,
          contact_email: company.contact_email,
          status: company.status,
          created_at: company.created_at,
          ...(company.created_by && { created_by: company.created_by })
        });
        updateCount++;
        console.log(`Updated company ${company.name} (${company._id}) - removed slug field`);
      }
    }
    
    console.log(`Migration completed. Updated ${updateCount} companies.`);
    return { success: true, updatedCount: updateCount };
  },
});