// @ts-nocheck
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed initial data for SupportSignal multi-tenant system
export const seedInitialData = mutation({
  args: {
    force: v.optional(v.boolean()), // Force reseed even if data exists
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
          has_llm_access: true, // System admin has full access
        });
        console.log(`✅ Created David user with ID: ${davidUserId}`);
      }
    }

    // Create sample AI prompts for the system
    console.log("🤖 Creating sample AI prompts...");
    
    const existingPrompts = await ctx.db
      .query("ai_prompts")
      .withIndex("by_active", (q) => q.eq("is_active", true))
      .collect();

    if (existingPrompts.length === 0 || args.force) {
      // Generate clarification questions prompt
      await ctx.db.insert("ai_prompts", {
        prompt_name: "generate_clarification_questions",
        prompt_version: "v1.0.0",
        prompt_template: `You are an expert in NDIS incident analysis. Based on the following incident narrative, generate 2-4 clarification questions for the specified phase to gather more detailed information.

Incident Details:
- Reporter: {{reporterName}}
- Participant: {{participantName}}
- Location: {{location}}
- Date/Time: {{eventDateTime}}

Phase: {{phase}}
Narrative: {{narrativeText}}

Generate specific, relevant questions that will help gather more details about this phase. Each question should:
1. Be specific to the {{phase}} phase
2. Help clarify important details
3. Be easy to answer
4. Improve the quality of the incident analysis

Return the questions in this JSON format:
{
  "questions": [
    {
      "questionId": "unique-id",
      "questionText": "Detailed question text",
      "questionOrder": 1
    }
  ]
}`,
        description: "Generates clarification questions for specific incident narrative phases",
        input_schema: JSON.stringify({
          type: "object",
          properties: {
            reporter_name: { type: "string" },
            participant_name: { type: "string" },
            location: { type: "string" },
            event_date_time: { type: "string" },
            phase: { type: "string", enum: ["beforeEvent", "duringEvent", "endEvent", "postEvent"] },
            narrativeText: { type: "string" }
          },
          required: ["reporterName", "participantName", "phase", "narrativeText"]
        }),
        output_schema: JSON.stringify({
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionId: { type: "string" },
                  questionText: { type: "string" },
                  questionOrder: { type: "number" }
                }
              }
            }
          }
        }),
        workflow_step: "clarification_generation",
        subsystem: "incidents",
        ai_model: "openai/gpt-4o-mini",
        max_tokens: 800,
        temperature: 0.7,
        is_active: true,
        created_at: Date.now(),
        created_by: davidUserId,
        usage_count: 0,
      });

      // Incident analysis prompt
      await ctx.db.insert("ai_prompts", {
        prompt_name: "analyze_incident_conditions",
        prompt_version: "v1.0.0",
        prompt_template: `You are an expert NDIS incident analyst. Analyze the following incident information and provide a comprehensive analysis of the contributing conditions.

Incident Information:
- Reporter: {{reporterName}}
- Participant: {{participantName}}
- Location: {{location}}
- Date/Time: {{eventDateTime}}

Complete Narrative:
{{consolidatedNarrative}}

Additional Answers:
{{clarification_answers}}

Provide a detailed analysis of the contributing conditions that led to this incident. Consider:
1. Environmental factors
2. Communication factors
3. Support factors
4. Behavioral factors
5. Medical factors
6. Systemic factors

Focus on identifying root causes rather than symptoms. Be objective and constructive.

Return your analysis as plain text (no JSON formatting needed).`,
        description: "Analyzes incidents to identify contributing conditions and root causes",
        input_schema: JSON.stringify({
          type: "object",
          properties: {
            reporter_name: { type: "string" },
            participant_name: { type: "string" },
            location: { type: "string" },
            event_date_time: { type: "string" },
            consolidatedNarrative: { type: "string" },
            clarification_answers: { type: "string" }
          },
          required: ["consolidatedNarrative"]
        }),
        output_schema: JSON.stringify({
          type: "object",
          properties: {
            analysis: { type: "string" }
          }
        }),
        workflow_step: "incident_analysis",
        subsystem: "incidents",
        ai_model: "gpt-4",
        max_tokens: 1200,
        temperature: 0.3,
        is_active: true,
        created_at: Date.now(),
        created_by: davidUserId,
        usage_count: 0,
      });

      // Incident classification prompt
      await ctx.db.insert("ai_prompts", {
        prompt_name: "classify_incident",
        prompt_version: "v1.0.0",
        prompt_template: `You are an expert NDIS incident classifier. Based on the incident analysis, classify this incident by type and severity.

Analysis:
{{contributingConditions}}

Original Incident:
- Reporter: {{reporterName}}
- Participant: {{participantName}}
- Location: {{location}}

Classify this incident and provide supporting evidence.

Return your classification in this JSON format:
{
  "classifications": [
    {
      "incidentType": "Behavioural|Environmental|Medical|Communication|Other",
      "severity": "Low|Medium|High",
      "supportingEvidence": "Brief explanation of why this classification applies",
      "confidenceScore": 0.85
    }
  ]
}

You may provide multiple classifications if the incident spans multiple types.`,
        description: "Classifies incidents by type and severity based on analysis",
        input_schema: JSON.stringify({
          type: "object",
          properties: {
            contributingConditions: { type: "string" },
            reporter_name: { type: "string" },
            participant_name: { type: "string" },
            location: { type: "string" }
          },
          required: ["contributingConditions"]
        }),
        output_schema: JSON.stringify({
          type: "object",
          properties: {
            classifications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  incidentType: { type: "string" },
                  severity: { type: "string" },
                  supportingEvidence: { type: "string" },
                  confidenceScore: { type: "number" }
                }
              }
            }
          }
        }),
        workflow_step: "incident_classification",
        subsystem: "incidents",
        ai_model: "gpt-4",
        max_tokens: 600,
        temperature: 0.2,
        is_active: true,
        created_at: Date.now(),
        created_by: davidUserId,
        usage_count: 0,
      });

      console.log("✅ Created 3 sample AI prompts");
    } else {
      console.log("✅ AI prompts already exist, skipping creation");
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
      has_llm_access: true,
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