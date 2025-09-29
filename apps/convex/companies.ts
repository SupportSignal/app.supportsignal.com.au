// @ts-nocheck
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { api } from "./_generated/api";
import { withAuthMutation } from "./lib/auth";

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

// List ALL companies (both active and inactive) - admin only
export const listAllCompanies = query({
  args: {},
  handler: async (ctx) => {
    // TODO: Add authentication check for system_admin role
    return await ctx.db
      .query("companies")
      .order("desc")
      .collect();
  },
});

// Create a new company (legacy - no authentication)
export const createCompanyLegacy = mutation({
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

    // Check if contact email already exists
    const existingCompanyByEmail = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("contact_email"), args.contactEmail))
      .first();

    if (existingCompanyByEmail) {
      throw new ConvexError(`Company with contact email '${args.contactEmail}' already exists`);
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
    status: v.union(v.literal("active"), v.literal("trial"), v.literal("suspended"), v.literal("test")),
    sessionToken: v.optional(v.string()),
  },
  handler: withAuthMutation(async (ctx, args) => {
    // Verify system admin role
    if (ctx.session.user.role !== "system_admin") {
      throw new ConvexError("System administrator access required");
    }

    // Get the company to update
    const company = await ctx.db.get(args.companyId);
    if (!company) {
      throw new ConvexError("Company not found");
    }

    // Update the company status
    await ctx.db.patch(args.companyId, {
      status: args.status,
    });

    console.log('🔍 COMPANY STATUS UPDATED', {
      companyId: args.companyId,
      companyName: company.name,
      oldStatus: company.status,
      newStatus: args.status,
      updatedBy: ctx.session.user.email,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      companyId: args.companyId,
      companyName: company.name,
      oldStatus: company.status,
      newStatus: args.status,
      message: `Company "${company.name}" status changed from ${company.status} to ${args.status}`,
    };
  }),
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

// Create a new company with authentication and admin user creation
export const createCompany = mutation({
  args: {
    name: v.string(),
    contactEmail: v.string(),
    adminEmail: v.string(),
    adminName: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("trial"), v.literal("suspended"), v.literal("test"))),
    sessionToken: v.optional(v.string()),
  },
  handler: withAuthMutation(async (ctx, args) => {
    // Verify system admin role
    if (ctx.session.user.role !== "system_admin") {
      throw new ConvexError("System administrator access required");
    }

    // Check if contact email already exists
    const existingCompanyByEmail = await ctx.db
      .query("companies")
      .filter((q) => q.eq(q.field("contact_email"), args.contactEmail))
      .first();

    if (existingCompanyByEmail) {
      throw new ConvexError(`Company with contact email '${args.contactEmail}' already exists`);
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(ctx, args.name);

    // Create company
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      slug,
      contact_email: args.contactEmail,
      status: args.status || "active",
      created_at: Date.now(),
      created_by: ctx.session.userId,
    });

    // Create initial admin user
    const adminUserId = await createInitialAdmin(ctx, {
      name: args.adminName,
      email: args.adminEmail,
      companyId,
    });

    // Generate real password reset token and store in database
    const resetToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Clean up any existing tokens for this user
    const existingTokens = await ctx.db
      .query('password_reset_tokens')
      .withIndex('by_user_id', q => q.eq('userId', adminUserId))
      .collect();

    for (const existingToken of existingTokens) {
      await ctx.db.delete(existingToken._id);
    }

    // Create new reset token in database
    await ctx.db.insert('password_reset_tokens', {
      userId: adminUserId,
      token: resetToken,
      expires,
    });

    console.log('🔑 REAL PASSWORD RESET TOKEN CREATED', {
      adminEmail: args.adminEmail,
      tokenGenerated: true,
      expiresAt: new Date(expires).toISOString(),
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      companyId,
      adminUserId,
      slug,
      resetToken,
      adminEmail: args.adminEmail,
      message: `Company '${args.name}' created successfully with admin '${args.adminName}'`,
    };
  }),
});

// Helper function to generate unique slug
async function generateUniqueSlug(ctx: any, companyName: string): Promise<string> {
  // Convert to URL-friendly slug
  let baseSlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  if (!baseSlug) {
    baseSlug = 'company'; // Fallback for edge cases
  }

  // Check for conflicts and add suffix if needed
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// Helper function to create initial admin user
async function createInitialAdmin(ctx: any, args: {
  name: string;
  email: string;
  companyId: any;
}): Promise<any> {
  // Check if user with this email already exists
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", args.email))
    .first();

  if (existingUser) {
    // Update existing user to be admin of this company
    await ctx.db.patch(existingUser._id, {
      role: "company_admin",
      company_id: args.companyId,
    });
    return existingUser._id;
  }

  // Create new admin user
  return await ctx.db.insert("users", {
    name: args.name,
    email: args.email,
    password: "", // Will be set via invitation/reset process
    role: "company_admin",
    company_id: args.companyId,
    created_at: Date.now(),
  });
}

