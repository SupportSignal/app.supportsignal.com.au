// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";

// Get company by ID with proper access control
export const getCompanyById = query({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    const company = await ctx.db.get(args.id);
    if (!company) {
      throw new ConvexError("Company not found");
    }
    return company;
  },
});

// Get company by slug (URL-friendly identifier)
export const getCompanyBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const company = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (!company) {
      throw new ConvexError("Company not found");
    }
    
    return company;
  },
});

// List all active companies (admin only)
export const listActiveCompanies = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Add authentication check for system_admin role
    return await ctx.db
      .query("companies")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

// Create a new company
export const createCompany = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    contactEmail: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("trial"), v.literal("suspended"))),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication check for system_admin role
    
    // Check if slug already exists
    const existingCompany = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existingCompany) {
      throw new ConvexError(`Company with slug '${args.slug}' already exists`);
    }

    const now = Date.now();
    
    return await ctx.db.insert("companies", {
      name: args.name,
      slug: args.slug,
      contact_email: args.contactEmail,
      status: args.status ?? "active",
      created_at: now,
      // created_by will be set when proper auth context is available
    });
  },
});

// Update company status
export const updateCompanyStatus = mutation({
  args: {
    companyId: v.id("companies"),
    status: v.union(v.literal("active"), v.literal("trial"), v.literal("suspended")),
  },
  handler: async (ctx, args) => {
    // TODO: Add authentication check for system_admin role
    
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new ConvexError("Company not found");
    }

    await ctx.db.patch(args.companyId, {
      status: args.status,
    });

    return { success: true };
  },
});

// Get company statistics
export const getCompanyStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    // TODO: Add authentication and permission checks
    
    // Count users in this company
    const userCount = await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("company_id", args.companyId))
      .collect();

    // Count incidents for this company
    const incidentCount = await ctx.db
      .query("incidents")
      .withIndex("by_company", (q) => q.eq("company_id", args.companyId))
      .collect();

    return {
      userCount: userCount.length,
      incidentCount: incidentCount.length,
      activeIncidents: incidentCount.filter(i => i.overall_status !== "completed").length,
    };
  },
});

// Seed both test companies
export const seedTestCompanies = mutation({
  args: {},
  handler: async (ctx) => {
    const results = [];
    
    const companiesData = [
      {
        name: "Support Signal",
        slug: "support-signal",
        contact_email: "admin@supportsignal.com.au",
        description: "Primary application company"
      },
      {
        name: "NDIS Test Company", 
        slug: "ndis-test",
        contact_email: "admin@ndis.com.au",
        description: "Test company for multi-tenant scenarios"
      }
    ];

    for (const companyData of companiesData) {
      try {
        // Check if company already exists
        const existingCompany = await ctx.db
          .query("companies")
          .withIndex("by_slug", (q) => q.eq("slug", companyData.slug))
          .first();

        if (existingCompany) {
          results.push({
            success: true,
            action: "exists",
            message: `${companyData.name} already exists`,
            companyId: existingCompany._id,
            name: existingCompany.name,
            slug: existingCompany.slug
          });
          continue;
        }

        // Create company
        const companyId = await ctx.db.insert("companies", {
          name: companyData.name,
          slug: companyData.slug,
          contact_email: companyData.contact_email,
          status: "active",
          created_at: Date.now(),
        });

        results.push({
          success: true,
          action: "created",
          message: `Created ${companyData.name}`,
          companyId,
          name: companyData.name,
          slug: companyData.slug
        });

      } catch (error) {
        results.push({
          success: false,
          message: `Failed to create ${companyData.name}: ${error.message}`,
          name: companyData.name,
          error: error.message
        });
      }
    }

    return {
      success: true,
      message: "Test companies seed complete",
      results,
      summary: {
        total: results.length,
        created: results.filter(r => r.action === "created").length,
        existed: results.filter(r => r.action === "exists").length,
        failed: results.filter(r => !r.success).length
      }
    };
  },
});

// Individual company seeders for backward compatibility
export const seedSupportSignalCompany = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await ctx.runMutation(api.companies.seedTestCompanies, {});
    const supportSignalResult = result.results.find(r => r.slug === "support-signal");
    return supportSignalResult || { success: false, message: "Support Signal company not found in results" };
  },
});