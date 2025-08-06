#!/usr/bin/env bun
import { ConvexClient } from "convex/browser";
import { api } from "../apps/convex/_generated/api";

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

// Get Convex URL from environment or use default
const CONVEX_URL = process.env.CONVEX_URL || "https://beaming-gull-639.convex.cloud";
const client = new ConvexClient(CONVEX_URL);

// Test data patterns to identify what can be safely removed
const TEST_PATTERNS = {
  // Company slugs for test companies
  testCompanySlugs: [
    "test-ndis-provider",
    "abc-ndis-services"
  ],
  
  // Keep these companies (real system data)
  keepCompanySlugs: [
    "support-signal"
  ]
};

async function identifyTestData() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║           Integration Test Data Cleanup Analysis          ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📍 Convex URL: ${CONVEX_URL}`);
  console.log(`🕐 Started: ${new Date().toLocaleString()}\n`);

  try {
    // Get all companies
    const companies = await client.query(api.companies.listActiveCompanies, {});
    
    console.log(`${colors.cyan}📊 Company Analysis:${colors.reset}`);
    console.log("┌─────────────────────────────────┬──────────────────────┬────────────┐");
    console.log("│ Company Name                    │ Slug                 │ Action     │");
    console.log("├─────────────────────────────────┼──────────────────────┼────────────┤");
    
    const testCompanies = [];
    const keepCompanies = [];
    
    companies.forEach(company => {
      const action = TEST_PATTERNS.testCompanySlugs.includes(company.slug) ? "🗑️  DELETE" : "✅ KEEP";
      const actionColor = action.includes("DELETE") ? colors.red : colors.green;
      
      console.log(`│ ${company.name.padEnd(31)} │ ${company.slug.padEnd(20)} │ ${actionColor}${action}${colors.reset}    │`);
      
      if (TEST_PATTERNS.testCompanySlugs.includes(company.slug)) {
        testCompanies.push(company);
      } else {
        keepCompanies.push(company);
      }
    });
    
    console.log("└─────────────────────────────────┴──────────────────────┴────────────┘");

    // Analyze incidents from all companies
    const allIncidents = [];
    for (const company of companies) {
      try {
        const companyIncidents = await client.query(api.incidents.getIncidentsByCompany, { companyId: company._id });
        allIncidents.push(...companyIncidents.map(incident => ({ ...incident, companyName: company.name })));
      } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not access incidents for ${company.name}${colors.reset}`);
      }
    }

    console.log(`\n${colors.cyan}📊 Incident Analysis:${colors.reset}`);
    console.log("┌─────────────────────────────────┬──────────────────────┬────────────┐");
    console.log("│ Incident (Participant - Date)   │ Company              │ Action     │");
    console.log("├─────────────────────────────────┼──────────────────────┼────────────┤");
    
    const testIncidents = [];
    const keepIncidents = [];
    
    allIncidents.forEach(incident => {
      const isTestData = TEST_PATTERNS.testCompanySlugs.some(slug => 
                          testCompanies.find(c => c._id === incident.companyId)?.slug === slug
                        );
      
      const action = isTestData ? "🗑️  DELETE" : "✅ KEEP";
      const actionColor = action.includes("DELETE") ? colors.red : colors.green;
      
      const incidentKey = `${incident.participantName} - ${incident.eventDateTime}`.substring(0, 31);
      const companyName = testCompanies.find(c => c._id === incident.companyId)?.name || "Unknown";
      const companyKey = companyName.substring(0, 20);
      
      console.log(`│ ${incidentKey.padEnd(31)} │ ${companyKey.padEnd(20)} │ ${actionColor}${action}${colors.reset}    │`);
      
      if (isTestData) {
        testIncidents.push(incident);
      } else {
        keepIncidents.push(incident);
      }
    });
    
    console.log("└─────────────────────────────────┴──────────────────────┴────────────┘");

    // Summary
    console.log(`\n${colors.yellow}📈 Cleanup Summary:${colors.reset}`);
    console.log(`${colors.red}🗑️  Test Data to Remove:${colors.reset}`);
    console.log(`   • ${testCompanies.length} test companies`);
    console.log(`   • ${testIncidents.length} test incidents`);
    console.log(`   • Related narratives, questions, answers, analyses, and classifications`);
    
    console.log(`\n${colors.green}✅ Production Data to Keep:${colors.reset}`);
    console.log(`   • ${keepCompanies.length} production companies`);
    console.log(`   • ${keepIncidents.length} production incidents`);
    console.log(`   • All AI prompts (system data)`);

    console.log(`\n${colors.blue}📝 Recommended Schema Changes:${colors.reset}`);
    console.log("   After cleanup, revert these fields to required:");
    console.log("   • incidents.created_by: v.id('users') // Remove optional");
    console.log("   • incident_analysis.analyzedBy: v.id('users') // Remove optional");
    console.log("   • clarification_answers.answeredBy: v.id('users') // Remove optional");
    console.log("   • incident_classifications.classifiedBy: v.id('users') // Remove optional");

    console.log(`\n${colors.cyan}🚀 Next Steps:${colors.reset}`);
    console.log("   1. Review the analysis above");
    console.log("   2. Confirm which data should be kept vs removed");
    console.log("   3. Run cleanup script (to be created)");
    console.log("   4. Revert schema fields to required once auth is implemented");

  } catch (error) {
    console.error(`${colors.red}❌ Error analyzing data: ${error}${colors.reset}`);
  }

  console.log(`\n🏁 Analysis completed: ${new Date().toLocaleString()}`);
}

// Run the analysis
identifyTestData().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});