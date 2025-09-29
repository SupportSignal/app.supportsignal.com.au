// @ts-nocheck
import { query } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { withAuth } from "../lib/auth";

// Get current user's company information
export const getCurrentUserCompany = query({
  args: {
    sessionToken: v.string(),
  },
  handler: withAuth(async (ctx, args) => {
    const user = ctx.session.user;

    console.log('🔍 GET CURRENT USER COMPANY', {
      userId: user._id,
      userEmail: user.email,
      companyId: user.company_id,
      timestamp: new Date().toISOString()
    });

    // Get the user's company
    if (!user.company_id) {
      throw new ConvexError("User is not associated with any company");
    }

    const company = await ctx.db.get(user.company_id);
    if (!company) {
      throw new ConvexError("Company not found");
    }

    console.log('🔍 COMPANY FOUND', {
      companyId: company._id,
      companyName: company.name,
      companyStatus: company.status,
      timestamp: new Date().toISOString()
    });

    return {
      ...company,
      _id: company._id,
      name: company.name,
      slug: company.slug,
      contact_email: company.contact_email,
      status: company.status,
      created_at: company.created_at,
    };
  }),
});

// Get company by ID with proper access control
export const getCompanyById = query({
  args: {
    id: v.id("companies"),
    sessionToken: v.string(),
  },
  handler: withAuth(async (ctx, args) => {
    const user = ctx.session.user;

    const company = await ctx.db.get(args.id);
    if (!company) {
      throw new ConvexError("Company not found");
    }

    // Ensure user can only access their own company unless they're system admin
    if (user.role !== "system_admin" && user.company_id !== args.id) {
      throw new ConvexError("Access denied: You can only view your own company");
    }

    console.log('🔍 GET COMPANY BY ID', {
      companyId: company._id,
      companyName: company.name,
      requestedBy: user.email,
      timestamp: new Date().toISOString()
    });

    return company;
  }),
});