// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Seed initial data for SupportSignal multi-tenant system
export const seedInitialData = mutation({
  args: {
    force: v.optional(v.boolean()), // Force reseed even if data exists
    sessionToken: v.string(), // Required for authenticated seeding operations
  },
  handler: async (ctx, args) => {
    console.log("🌱 Starting seed process for SupportSignal multi-tenant database...");

    // Check if Support Signal company already exists
    const existingCompany = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", "support-signal"))
      .first();

    let supportSignalCompanyId;

    if (existingCompany && !args.force) {
      console.log("✅ Support Signal company already exists, using existing");
      supportSignalCompanyId = existingCompany._id;
    } else {
      if (existingCompany && args.force) {
        console.log("🔄 Force flag set, recreating company data...");
        // In a real system, you'd want to handle this more carefully
        // For now, we'll just use the existing company
        supportSignalCompanyId = existingCompany._id;
      } else {
        // Create Support Signal company
        console.log("📊 Creating Support Signal company...");
        supportSignalCompanyId = await ctx.db.insert("companies", {
          name: "Support Signal",
          slug: "support-signal",
          contact_email: "david@ideasmen.com.au",
          status: "active",
          created_at: Date.now(),
          // created_by is optional in schema, so we can omit it for seed data
        });
        console.log(`✅ Created Support Signal company with ID: ${supportSignalCompanyId}`);
      }
    }

    // Check if david@ideasmen.com.au user exists
    const existingDavid = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "david@ideasmen.com.au"))
      .first();

    let davidUserId;

    if (existingDavid && !args.force) {
      console.log("✅ David user already exists, updating role and company...");
      // Update existing user to ensure correct role and company
      await ctx.db.patch(existingDavid._id, {
        role: "system_admin",
        company_id: supportSignalCompanyId,
      });
      davidUserId = existingDavid._id;
    } else {
      if (existingDavid && args.force) {
        console.log("🔄 Force flag set, updating david@ideasmen.com.au user...");
        await ctx.db.patch(existingDavid._id, {
          role: "system_admin",
          company_id: supportSignalCompanyId,
        });
        davidUserId = existingDavid._id;
      } else {
        // Create David as system_admin
        console.log("👤 Creating david@ideasmen.com.au as system_admin...");
        davidUserId = await ctx.db.insert("users", {
          name: "David Cruwys",
          email: "david@ideasmen.com.au",
          password: "", // Will be set separately via auth system
          role: "system_admin",
          company_id: supportSignalCompanyId,
        });
        console.log(`✅ Created David user with ID: ${davidUserId}`);
      }
    }

    // Create sample AI prompts for the system
    console.log("🤖 Creating AI prompt templates...");
    
    // Delegate prompt template seeding to promptManager
    try {
      await ctx.runMutation(api.promptManager.seedPromptTemplates, {
        sessionToken: args.sessionToken
      });
      console.log("✅ AI prompt templates seeded successfully");
    } catch (error) {
      console.log("ℹ️ AI prompt templates already exist or seeding failed:", error);
    }

    // Create a sample incident for testing (optional)
    if (args.force) {
      console.log("🔍 Creating sample incident for testing...");
      
      const sampleIncidentId = await ctx.db.insert("incidents", {
        company_id: supportSignalCompanyId,
        reporter_name: "Jane Smith",
        participant_name: "John Doe",
        event_date_time: "2025-01-15T14:30:00",
        location: "Day Program - Activity Room",
        
        capture_status: "draft",
        analysis_status: "not_started",
        overall_status: "capture_pending",
        
        created_at: Date.now(),
        created_by: davidUserId,
        updated_at: Date.now(),
        
        questions_generated: false,
        narrative_enhanced: false,
        analysis_generated: false,
      });

      console.log(`✅ Created sample incident with ID: ${sampleIncidentId}`);
    }

    console.log("🎉 Seed process completed successfully!");
    
    return {
      success: true,
      supportSignalCompanyId,
      davidUserId,
      message: "Multi-tenant database seeded with Support Signal company and system admin user"
    };
  },
});

// Quick seed without force flag for development
export const quickSeed = mutation({
  args: {},
  handler: async (ctx) => {
    // Just call the seed function with force: false
    console.log("🌱 Running quick seed...");
    
    // Check if Support Signal company already exists
    const existingCompany = await ctx.db
      .query("companies")
      .withIndex("by_slug", (q) => q.eq("slug", "support-signal"))
      .first();

    if (existingCompany) {
      console.log("✅ Data already seeded, skipping");
      return { success: true, message: "Data already exists" };
    }

    // Call the main seed function with force: false
    const now = Date.now();
    
    // Create Support Signal company
    const supportSignalCompanyId = await ctx.db.insert("companies", {
      name: "Support Signal",
      slug: "support-signal",
      contact_email: "david@ideasmen.com.au",
      status: "active",
      created_at: now,
      // created_by is optional, omit for seed data
    });

    // Create David as system_admin
    const davidUserId = await ctx.db.insert("users", {
      name: "David Cruwys",
      email: "david@ideasmen.com.au",
      password: "",
      role: "system_admin",
      company_id: supportSignalCompanyId,
    });

    console.log("✅ Quick seed completed");
    
    return {
      success: true,
      supportSignalCompanyId,
      davidUserId,
      message: "Quick seed completed"
    };
  },
});