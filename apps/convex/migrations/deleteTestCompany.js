/**
 * ONE-TIME MIGRATION: Delete test company created during testing
 *
 * Company: david@ideasmen.com.au (davidideasmencomau)
 * ID: kd71qswpqc6etcxzfd46xb81nd7s54ke
 *
 * DELETE THIS FILE AFTER RUNNING
 */

import { internalMutation } from '../_generated/server.js';

export default internalMutation(async (ctx) => {
  const testCompanyId = "kd71qswpqc6etcxzfd46xb81nd7s54ke";

  // Get the company
  const company = await ctx.db.get(testCompanyId);

  if (!company) {
    console.log(`Company ${testCompanyId} not found`);
    return {
      success: false,
      message: `Company ${testCompanyId} not found`,
    };
  }

  console.log('Found company:', {
    id: company._id,
    name: company.name,
    slug: company.slug,
    status: company.status
  });

  // Delete the company
  await ctx.db.delete(testCompanyId);

  console.log('Deleted test company');

  return {
    success: true,
    message: `Deleted test company: ${company.name} (${company.slug})`,
    companyId: testCompanyId,
    companyName: company.name,
  };
});
