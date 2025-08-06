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

// Test result tracking
const testResults: { group: string; test: string; status: "PASS" | "FAIL"; notes?: string }[] = [];

// Utility functions
const log = {
  group: (msg: string) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}`),
  test: (msg: string) => console.log(`${colors.cyan}▶ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.dim}ℹ ${msg}${colors.reset}`),
  data: (label: string, data: any) => console.log(`${colors.yellow}📊 ${label}:${colors.reset}`, data),
};

async function recordTest(group: string, test: string, status: "PASS" | "FAIL", notes?: string) {
  testResults.push({ group, test, status, notes });
  if (status === "PASS") {
    log.success(`${test} - PASSED`);
  } else {
    log.error(`${test} - FAILED${notes ? `: ${notes}` : ""}`);
  }
}

// Store IDs for use across tests
let supportSignalCompanyId: string;
let testCompanyId: string;
let abcCompanyId: string;
let testIncidentId: string;
let testNarrativeId: string;
let testAnalysisId: string;
let davidUserId: string;

// Database snapshot tracking
interface DatabaseSnapshot {
  companies: { count: number; records: any[] };
  users: { count: number; records: any[] };
  incidents: { count: number; records: any[] };
  incident_narratives: { count: number; records: any[] };
  clarification_questions: { count: number; records: any[] };
  clarification_answers: { count: number; records: any[] };
  incident_analysis: { count: number; records: any[] };
  incident_classifications: { count: number; records: any[] };
  ai_prompts: { count: number; records: any[] };
}

async function takeDatabaseSnapshot(): Promise<DatabaseSnapshot> {
  // Get all companies first
  const companies = await client.query(api.companies.listActiveCompanies, {});
  
  // Get incidents from all companies
  const allIncidents = [];
  for (const company of companies) {
    try {
      const companyIncidents = await client.query(api.incidents.getIncidentsByCompany, { company_id: company._id });
      allIncidents.push(...companyIncidents);
    } catch (error) {
      // Skip if error accessing company incidents
    }
  }

  const [
    prompts
  ] = await Promise.all([
    client.query(api.prompts.getPromptsBySubsystem, { subsystem: "incidents" }).catch(() => [])
  ]);

  return {
    companies: { 
      count: companies.length, 
      records: companies.map(c => ({ id: c._id, key: `${c.name} (${c.slug})`, status: c.status }))
    },
    users: { count: 0, records: [] }, // Would need utility function
    incidents: { 
      count: allIncidents.length,
      records: allIncidents.map(i => ({ 
        id: i._id, 
        key: `${i.participant_name} - ${i.event_date_time}`, 
        company: i.company_id,
        status: i.overall_status 
      }))
    },
    incident_narratives: { count: 0, records: [] },
    clarification_questions: { count: 0, records: [] },
    clarification_answers: { count: 0, records: [] },
    incident_analysis: { count: 0, records: [] },
    incident_classifications: { count: 0, records: [] },
    ai_prompts: { 
      count: prompts.length,
      records: prompts.map(p => ({ id: p._id, key: p.prompt_name, subsystem: p.subsystem, version: p.prompt_version }))
    }
  };
}

function displayDatabaseSnapshot(snapshot: DatabaseSnapshot, title: string) {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║${title.padStart(32 + Math.floor(title.length/2)).padEnd(62)}║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const tables = [
    { name: 'companies', data: snapshot.companies },
    { name: 'users', data: snapshot.users },
    { name: 'incidents', data: snapshot.incidents },
    { name: 'incident_narratives', data: snapshot.incident_narratives },
    { name: 'clarification_questions', data: snapshot.clarification_questions },
    { name: 'clarification_answers', data: snapshot.clarification_answers },
    { name: 'incident_analysis', data: snapshot.incident_analysis },
    { name: 'incident_classifications', data: snapshot.incident_classifications },
    { name: 'ai_prompts', data: snapshot.ai_prompts }
  ];

  console.log("\n📊 Table Counts:");
  console.log("┌─────────────────────────────┬───────┐");
  console.log("│ Table                       │ Count │");
  console.log("├─────────────────────────────┼───────┤");
  
  tables.forEach(table => {
    console.log(`│ ${table.name.padEnd(27)} │ ${String(table.data.count).padStart(5)} │`);
  });
  
  console.log("└─────────────────────────────┴───────┘");

  // Show records with human-readable keys
  tables.forEach(table => {
    if (table.data.count > 0) {
      console.log(`\n${colors.cyan}📋 ${table.name} Records:${colors.reset}`);
      table.data.records.forEach((record, index) => {
        console.log(`${colors.dim}  ${index + 1}. ${record.key}${colors.reset}`);
        if (record.status) console.log(`${colors.dim}     Status: ${record.status}${colors.reset}`);
        if (record.company) console.log(`${colors.dim}     Company: ${record.company}${colors.reset}`);
        if (record.subsystem) console.log(`${colors.dim}     Subsystem: ${record.subsystem}, Version: ${record.version}${colors.reset}`);
      });
    }
  });
}

async function runUATTests() {
  console.log(`${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     UAT 1.1: Multi-Tenant Database Implementation Tests    ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n📍 Convex URL: ${CONVEX_URL}`);
  console.log(`🕐 Started: ${new Date().toLocaleString()}\n`);

  let beforeSnapshot: DatabaseSnapshot;

  try {
    // Test Group 1: Multi-Tenant Foundation
    log.group("Test Group 1: Multi-Tenant Foundation");

    // UAT-1.1: Company Management
    log.test("UAT-1.1: Company Management");
    
    // Get Support Signal company first
    try {
      const supportSignal = await client.query(api.companies.getCompanyBySlug, { slug: "support-signal" });
      supportSignalCompanyId = supportSignal._id;
      log.info(`Support Signal Company ID: ${supportSignalCompanyId}`);
      await recordTest("1.1", "Support Signal exists", "PASS");
      
      // Take initial database snapshot after we have company ID
      beforeSnapshot = await takeDatabaseSnapshot();
      displayDatabaseSnapshot(beforeSnapshot, "DATABASE STATE - BEFORE TESTS");
      
    } catch (error) {
      await recordTest("1.1", "Support Signal exists", "FAIL", String(error));
    }

    // Create Test Company (or get existing one)
    try {
      try {
        // Try to create new company
        testCompanyId = await client.mutation(api.companies.createCompany, {
          name: "Test NDIS Provider",
          slug: "test-ndis-provider",
          contactEmail: "test@provider.com.au",
        });
        log.data("Created new company ID", testCompanyId);
        await recordTest("1.1", "Create Test Company", "PASS");
      } catch (createError) {
        if (String(createError).includes("already exists")) {
          // Company exists, get its ID
          const existingCompany = await client.query(api.companies.getCompanyBySlug, { 
            slug: "test-ndis-provider" 
          });
          testCompanyId = existingCompany._id;
          log.info(`Using existing company ID: ${testCompanyId}`);
          await recordTest("1.1", "Create Test Company", "PASS", "Used existing company");
        } else {
          throw createError;
        }
      }
    } catch (error) {
      await recordTest("1.1", "Create Test Company", "FAIL", String(error));
      return; // Exit early if we can't get a test company
    }

    // Verify Company Retrieval
    try {
      const company = await client.query(api.companies.getCompanyBySlug, { 
        slug: "test-ndis-provider" 
      });
      log.data("Retrieved company", { name: company.name, status: company.status });
      const isValid = company.name === "Test NDIS Provider" && company.status === "active";
      await recordTest("1.1", "Verify Company Retrieval", isValid ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("1.1", "Verify Company Retrieval", "FAIL", String(error));
    }

    // List Active Companies
    try {
      const companies = await client.query(api.companies.listActiveCompanies, {});
      log.data("Active companies count", companies.length);
      const hasSupport = companies.some(c => c.slug === "support-signal");
      const hasTest = companies.some(c => c.slug === "test-ndis-provider");
      await recordTest("1.1", "List Active Companies", hasSupport && hasTest ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("1.1", "List Active Companies", "FAIL", String(error));
    }

    // Test Group 2: Incident Management Workflow
    log.group("Test Group 2: Incident Management Workflow");

    // UAT-2.1: Basic Incident Creation
    log.test("UAT-2.1: Basic Incident Creation");

    // Create Test Incident
    try {
      testIncidentId = await client.mutation(api.incidents.createIncident, {
        company_id: supportSignalCompanyId,
        reporter_name: "Sarah Johnson",
        participant_name: "Michael Smith",
        event_date_time: "2025-01-15T10:30:00",
        location: "Community Center - Activity Room",
      });
      log.data("Created incident ID", testIncidentId);
      await recordTest("2.1", "Create Test Incident", "PASS");
    } catch (error) {
      await recordTest("2.1", "Create Test Incident", "FAIL", String(error));
    }

    // Retrieve Incident
    try {
      const incident = await client.query(api.incidents.getIncidentById, { 
        incident_id: testIncidentId 
      });
      log.data("Incident status", { 
        capture_status: incident.capture_status,
        overall_status: incident.overall_status 
      });
      const isValid = incident.overall_status === "capture_pending";
      await recordTest("2.1", "Retrieve Incident", isValid ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("2.1", "Retrieve Incident", "FAIL", String(error));
    }

    // List Company Incidents
    try {
      const incidents = await client.query(api.incidents.getIncidentsByCompany, { 
        company_id: supportSignalCompanyId 
      });
      log.data("Company incidents count", incidents.length);
      const hasTestIncident = incidents.some(i => i._id === testIncidentId);
      await recordTest("2.1", "List Company Incidents", hasTestIncident ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("2.1", "List Company Incidents", "FAIL", String(error));
    }

    // UAT-2.2: Incident Workflow Status
    log.test("UAT-2.2: Incident Workflow Status");

    // Update Capture Status
    try {
      await client.mutation(api.incidents.updateIncidentStatus, {
        incident_id: testIncidentId,
        capture_status: "completed",
      });
      const incident = await client.query(api.incidents.getIncidentById, { 
        incident_id: testIncidentId 
      });
      const isValid = incident.overall_status === "analysis_pending";
      log.data("After capture complete", { overall_status: incident.overall_status });
      await recordTest("2.2", "Update Capture Status", isValid ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("2.2", "Update Capture Status", "FAIL", String(error));
    }

    // Test Group 3: Incident Narratives and Questions
    log.group("Test Group 3: Incident Narratives and Questions");

    // UAT-3.1: Incident Narrative Management
    log.test("UAT-3.1: Incident Narrative Management");

    // Create Incident Narrative
    try {
      testNarrativeId = await client.mutation(api.incidents.upsertIncidentNarrative, {
        incident_id: testIncidentId,
        before_event: "Michael was participating in art therapy session.",
        during_event: "Michael became agitated when asked to clean up materials.",
        end_event: "Staff provided calm support and Michael settled down.",
        post_event: "Discussed coping strategies with Michael.",
      });
      log.data("Created narrative ID", testNarrativeId);
      await recordTest("3.1", "Create Incident Narrative", "PASS");
    } catch (error) {
      await recordTest("3.1", "Create Incident Narrative", "FAIL", String(error));
    }

    // Retrieve Narrative
    try {
      const narrative = await client.query(api.incidents.getIncidentNarrative, { 
        incident_id: testIncidentId 
      });
      const hasAllPhases = narrative?.before_event && narrative?.during_event && 
                          narrative?.end_event && narrative?.post_event;
      log.data("Narrative phases", { 
        hasBeforeEvent: !!narrative?.before_event,
        hasDuringEvent: !!narrative?.during_event,
        hasEndEvent: !!narrative?.end_event,
        hasPostEvent: !!narrative?.post_event,
      });
      await recordTest("3.1", "Retrieve Narrative", hasAllPhases ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("3.1", "Retrieve Narrative", "FAIL", String(error));
    }

    // UAT-3.2: Clarification Questions
    log.test("UAT-3.2: Clarification Questions");

    // Add Clarification Question
    try {
      await client.mutation(api.incidents.addClarificationQuestion, {
        incident_id: testIncidentId,
        question_id: "test-q-001",
        phase: "during_event",
        question_text: "What specific trigger caused Michael's agitation?",
        question_order: 1,
      });
      await recordTest("3.2", "Add Clarification Question", "PASS");
    } catch (error) {
      await recordTest("3.2", "Add Clarification Question", "FAIL", String(error));
    }

    // Submit Answer
    try {
      await client.mutation(api.incidents.submitClarificationAnswer, {
        incident_id: testIncidentId,
        question_id: "test-q-001",
        answer_text: "Michael was asked to put away materials before he felt ready to stop.",
        phase: "during_event",
      });
      await recordTest("3.2", "Submit Answer", "PASS");
    } catch (error) {
      await recordTest("3.2", "Submit Answer", "FAIL", String(error));
    }

    // Test Group 4: Analysis and Classification
    log.group("Test Group 4: Analysis and Classification");

    // UAT-4.1: Incident Analysis
    log.test("UAT-4.1: Incident Analysis");

    // Create Analysis
    try {
      testAnalysisId = await client.mutation(api.analysis.createIncidentAnalysis, {
        incident_id: testIncidentId,
        contributing_conditions: "Contributing factors include: 1) Transition difficulties - participant needed more time to process activity change, 2) Communication - request was made without sufficient warning or preparation time",
      });
      log.data("Created analysis ID", testAnalysisId);
      await recordTest("4.1", "Create Analysis", "PASS");
    } catch (error) {
      await recordTest("4.1", "Create Analysis", "FAIL", String(error));
    }

    // UAT-4.2: Incident Classification
    log.test("UAT-4.2: Incident Classification");

    // Create Classification
    try {
      await client.mutation(api.analysis.createIncidentClassification, {
        incident_id: testIncidentId,
        analysis_id: testAnalysisId,
        classification_id: "test-class-001",
        incident_type: "Behavioural",
        supporting_evidence: "Participant showed behavioral response to transition request",
        severity: "Low",
        confidence_score: 0.8,
      });
      await recordTest("4.2", "Create Classification", "PASS");
    } catch (error) {
      await recordTest("4.2", "Create Classification", "FAIL", String(error));
    }

    // Test Group 5: AI Prompts Subsystem
    log.group("Test Group 5: AI Prompts Subsystem");

    // UAT-5.1: Prompt Management
    log.test("UAT-5.1: Prompt Management");

    // Retrieve Active Prompts
    try {
      const prompts = await client.query(api.prompts.getPromptsBySubsystem, { 
        subsystem: "incidents" 
      });
      log.data("Incidents subsystem prompts count", prompts.length);
      await recordTest("5.1", "Retrieve Active Prompts", prompts.length > 0 ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("5.1", "Retrieve Active Prompts", "FAIL", String(error));
    }

    // Test Group 6: Multi-Tenant Data Isolation
    log.group("Test Group 6: Multi-Tenant Data Isolation");

    // UAT-6.1: Company Data Isolation
    log.test("UAT-6.1: Company Data Isolation");

    // Create Second Company (or get existing one)
    try {
      try {
        // Try to create new company
        abcCompanyId = await client.mutation(api.companies.createCompany, {
          name: "ABC NDIS Services",
          slug: "abc-ndis-services",
          contactEmail: "contact@abcndis.com.au",
        });
        log.data("Created ABC company ID", abcCompanyId);
        await recordTest("6.1", "Create Second Company", "PASS");
      } catch (createError) {
        if (String(createError).includes("already exists")) {
          // Company exists, get its ID
          const existingCompany = await client.query(api.companies.getCompanyBySlug, { 
            slug: "abc-ndis-services" 
          });
          abcCompanyId = existingCompany._id;
          log.info(`Using existing ABC company ID: ${abcCompanyId}`);
          await recordTest("6.1", "Create Second Company", "PASS", "Used existing company");
        } else {
          throw createError;
        }
      }
    } catch (error) {
      await recordTest("6.1", "Create Second Company", "FAIL", String(error));
      return; // Exit early if we can't get ABC company
    }

    // Create incident for ABC company
    try {
      const abcIncidentId = await client.mutation(api.incidents.createIncident, {
        company_id: abcCompanyId,
        reporter_name: "Jane Doe",
        participant_name: "John Smith",
        event_date_time: "2025-01-15T14:00:00",
        location: "ABC Center",
      });

      // Test data isolation
      const supportSignalIncidents = await client.query(api.incidents.getIncidentsByCompany, { 
        company_id: supportSignalCompanyId 
      });
      const abcIncidents = await client.query(api.incidents.getIncidentsByCompany, { 
        company_id: abcCompanyId 
      });

      const supportHasAbc = supportSignalIncidents.some(i => i._id === abcIncidentId);
      const abcHasSupport = abcIncidents.some(i => i._id === testIncidentId);
      
      const isIsolated = !supportHasAbc && !abcHasSupport;
      log.data("Data isolation check", { 
        supportHasAbc, 
        abcHasSupport, 
        isIsolated 
      });
      
      await recordTest("6.1", "Multi-Tenant Data Isolation", isIsolated ? "PASS" : "FAIL");
    } catch (error) {
      await recordTest("6.1", "Multi-Tenant Data Isolation", "FAIL", String(error));
    }

  } catch (error) {
    log.error(`Unexpected error: ${error}`);
  }

  // Take final database snapshot
  const afterSnapshot = await takeDatabaseSnapshot();
  displayDatabaseSnapshot(afterSnapshot, "DATABASE STATE - AFTER TESTS");

  // Show changes
  console.log(`\n${colors.yellow}📈 Database Changes:${colors.reset}`);
  console.log("┌─────────────────────────────┬────────┬───────┬─────────┐");
  console.log("│ Table                       │ Before │ After │ Change  │");
  console.log("├─────────────────────────────┼────────┼───────┼─────────┤");
  
  const tables = [
    'companies', 'users', 'incidents', 'incident_narratives',
    'clarification_questions', 'clarification_answers', 
    'incident_analysis', 'incident_classifications', 'ai_prompts'
  ];

  tables.forEach(table => {
    const before = beforeSnapshot[table as keyof DatabaseSnapshot].count;
    const after = afterSnapshot[table as keyof DatabaseSnapshot].count;
    const change = after - before;
    const changeStr = change > 0 ? `+${change}` : String(change);
    const changeColor = change > 0 ? colors.green : (change < 0 ? colors.red : colors.dim);
    
    console.log(`│ ${table.padEnd(27)} │ ${String(before).padStart(6)} │ ${String(after).padStart(5)} │ ${changeColor}${changeStr.padStart(7)}${colors.reset} │`);
  });
  
  console.log("└─────────────────────────────┴────────┴───────┴─────────┘");

  // Print summary
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║                      TEST SUMMARY                          ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const passed = testResults.filter(r => r.status === "PASS").length;
  const failed = testResults.filter(r => r.status === "FAIL").length;
  const total = testResults.length;

  console.log(`\n📊 Results: ${colors.green}${passed} PASSED${colors.reset}, ${colors.red}${failed} FAILED${colors.reset} (Total: ${total})`);
  console.log(`✨ Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  // Detailed results table
  console.log("\n📋 Detailed Results:");
  console.log("┌─────────────┬──────────────────────────────────────┬──────────┐");
  console.log("│ Test Group  │ Test Case                            │ Status   │");
  console.log("├─────────────┼──────────────────────────────────────┼──────────┤");
  
  testResults.forEach(result => {
    const status = result.status === "PASS" 
      ? `${colors.green}✅ PASS${colors.reset}` 
      : `${colors.red}❌ FAIL${colors.reset}`;
    console.log(`│ ${result.group.padEnd(11)} │ ${result.test.padEnd(36)} │ ${status}  │`);
  });
  
  console.log("└─────────────┴──────────────────────────────────────┴──────────┘");

  if (failed > 0) {
    console.log(`\n${colors.red}⚠️  Failed Tests:${colors.reset}`);
    testResults
      .filter(r => r.status === "FAIL")
      .forEach(r => console.log(`   - ${r.group} / ${r.test}: ${r.notes || "No details"}`));
  }

  console.log(`\n🏁 Completed: ${new Date().toLocaleString()}`);

  // Database Schema Documentation
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║                    DATABASE SCHEMA REFERENCE               ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const schemaInfo = [
    {
      table: 'companies',
      description: 'Multi-tenant companies for SupportSignal',
      columns: [
        { name: 'name', type: 'string', description: 'Company display name' },
        { name: 'slug', type: 'string', description: 'URL-friendly identifier' },
        { name: 'contactEmail', type: 'string', description: 'Primary contact email' },
        { name: 'status', type: 'enum', description: 'active | trial | suspended' },
        { name: 'created_at', type: 'number', description: 'Creation timestamp' },
        { name: 'created_by', type: 'Id<users>', description: 'Creator user ID (optional for seed)' }
      ]
    },
    {
      table: 'users', 
      description: 'User authentication with multi-tenant support',
      columns: [
        { name: 'name', type: 'string', description: 'Full name' },
        { name: 'email', type: 'string', description: 'Email address' },
        { name: 'password', type: 'string', description: 'Hashed password' },
        { name: 'profile_image_url', type: 'string?', description: 'Profile image URL' },
        { name: 'role', type: 'enum', description: 'system_admin | company_admin | team_lead | frontline_worker | viewer | support' },
        { name: 'hasLLMAccess', type: 'boolean?', description: 'LLM access permission' },
        { name: 'company_id', type: 'Id<companies>?', description: 'Associated company' }
      ]
    },
    {
      table: 'incidents',
      description: 'Core incident records with workflow status',
      columns: [
        { name: 'company_id', type: 'Id<companies>', description: 'Multi-tenant isolation' },
        { name: 'reporter_name', type: 'string', description: 'Person reporting incident' },
        { name: 'participant_name', type: 'string', description: 'Person involved in incident' },
        { name: 'event_date_time', type: 'string', description: 'When incident occurred' },
        { name: 'location', type: 'string', description: 'Where incident occurred' },
        { name: 'capture_status', type: 'enum', description: 'draft | in_progress | completed' },
        { name: 'analysis_status', type: 'enum', description: 'not_started | in_progress | completed' },
        { name: 'overall_status', type: 'enum', description: 'capture_pending | analysis_pending | completed' },
        { name: 'created_at', type: 'number', description: 'Creation timestamp' },
        { name: 'created_by', type: 'Id<users>', description: 'Creator user ID (optional)' },
        { name: 'updated_at', type: 'number', description: 'Last modification' },
        { name: 'narrative_hash', type: 'string?', description: 'Content hash for change detection' },
        { name: 'questions_generated', type: 'boolean', description: 'AI questions created flag' },
        { name: 'narrative_enhanced', type: 'boolean', description: 'AI enhancement completed flag' },
        { name: 'analysis_generated', type: 'boolean', description: 'AI analysis completed flag' }
      ]
    },
    {
      table: 'incident_narratives',
      description: 'Detailed incident descriptions by timeline phase',
      columns: [
        { name: 'incident_id', type: 'Id<incidents>', description: 'Associated incident' },
        { name: 'before_event', type: 'string', description: 'Context before incident' },
        { name: 'during_event', type: 'string', description: 'What happened during incident' },
        { name: 'end_event', type: 'string', description: 'How incident concluded' },
        { name: 'post_event', type: 'string', description: 'Actions taken after incident' },
        { name: 'created_at', type: 'number', description: 'Creation timestamp' },
        { name: 'updated_at', type: 'number', description: 'Last modification' },
        { name: 'enhanced_at', type: 'number?', description: 'AI enhancement timestamp' },
        { name: 'version', type: 'number', description: 'Version for change tracking' }
      ]
    },
    {
      table: 'clarification_questions',
      description: 'AI-generated questions to improve incident details',
      columns: [
        { name: 'incident_id', type: 'Id<incidents>', description: 'Associated incident' },
        { name: 'question_id', type: 'string', description: 'Unique question identifier' },
        { name: 'phase', type: 'enum', description: 'before_event | during_event | end_event | post_event' },
        { name: 'question_text', type: 'string', description: 'The actual question' },
        { name: 'question_order', type: 'number', description: 'Display order within phase' },
        { name: 'generated_at', type: 'number', description: 'AI generation timestamp' },
        { name: 'ai_model', type: 'string?', description: 'AI model used for generation' },
        { name: 'prompt_version', type: 'string?', description: 'Prompt version used' },
        { name: 'is_active', type: 'boolean', description: 'Question active status' }
      ]
    },
    {
      table: 'clarification_answers',
      description: 'User responses to clarification questions',
      columns: [
        { name: 'incident_id', type: 'Id<incidents>', description: 'Associated incident' },
        { name: 'question_id', type: 'string', description: 'Associated question ID' },
        { name: 'answer_text', type: 'string', description: 'User provided answer' },
        { name: 'phase', type: 'enum', description: 'before_event | during_event | end_event | post_event' },
        { name: 'answered_at', type: 'number', description: 'Answer submission timestamp' },
        { name: 'answered_by', type: 'Id<users>', description: 'User who answered (optional)' },
        { name: 'updated_at', type: 'number', description: 'Last modification' },
        { name: 'is_complete', type: 'boolean', description: 'Answer completeness flag' },
        { name: 'character_count', type: 'number', description: 'Answer length metric' },
        { name: 'word_count', type: 'number', description: 'Answer word count' }
      ]
    },
    {
      table: 'incident_analysis',
      description: 'AI-assisted incident analysis by team leads',
      columns: [
        { name: 'incident_id', type: 'Id<incidents>', description: 'Associated incident' },
        { name: 'contributing_conditions', type: 'string', description: 'Analysis of contributing factors' },
        { name: 'conditions_original', type: 'string?', description: 'Original AI-generated content' },
        { name: 'conditions_edited', type: 'boolean', description: 'User modification flag' },
        { name: 'analyzed_at', type: 'number', description: 'Analysis completion timestamp' },
        { name: 'analyzed_by', type: 'Id<users>', description: 'Analyst user ID (optional)' },
        { name: 'updated_at', type: 'number', description: 'Last modification' },
        { name: 'ai_analysis_prompt', type: 'string?', description: 'AI prompt used' },
        { name: 'ai_model', type: 'string?', description: 'AI model used' },
        { name: 'ai_confidence', type: 'number?', description: 'AI confidence score' },
        { name: 'ai_processing_time', type: 'number?', description: 'AI processing duration' },
        { name: 'analysis_status', type: 'enum', description: 'draft | ai_generated | user_reviewed | completed' },
        { name: 'revision_count', type: 'number', description: 'Number of revisions' },
        { name: 'total_edit_time', type: 'number?', description: 'Total editing time' }
      ]
    },
    {
      table: 'incident_classifications',
      description: 'Incident categorization and severity assessment',
      columns: [
        { name: 'incident_id', type: 'Id<incidents>', description: 'Associated incident' },
        { name: 'analysis_id', type: 'Id<incident_analysis>', description: 'Associated analysis' },
        { name: 'classification_id', type: 'string', description: 'Unique classification ID' },
        { name: 'incident_type', type: 'enum', description: 'Behavioural | Environmental | Medical | Communication | Other' },
        { name: 'supporting_evidence', type: 'string', description: 'Evidence for classification' },
        { name: 'severity', type: 'enum', description: 'Low | Medium | High' },
        { name: 'confidence_score', type: 'number', description: 'Classification confidence' },
        { name: 'user_reviewed', type: 'boolean', description: 'Human review completed flag' },
        { name: 'user_modified', type: 'boolean', description: 'User modification flag' },
        { name: 'review_notes', type: 'string?', description: 'User review comments' },
        { name: 'created_at', type: 'number', description: 'Creation timestamp' },
        { name: 'updated_at', type: 'number', description: 'Last modification' },
        { name: 'classified_by', type: 'Id<users>', description: 'Classifier user ID (optional)' },
        { name: 'ai_generated', type: 'boolean', description: 'AI generation flag' },
        { name: 'ai_model', type: 'string?', description: 'AI model used' },
        { name: 'original_ai_classification', type: 'string?', description: 'Original AI classification' }
      ]
    },
    {
      table: 'ai_prompts',
      description: 'Versioned AI prompts for various subsystems',
      columns: [
        { name: 'prompt_name', type: 'string', description: 'Unique prompt identifier' },
        { name: 'prompt_version', type: 'string', description: 'Version identifier' },
        { name: 'subsystem', type: 'string', description: 'Target subsystem (e.g., incidents)' },
        { name: 'prompt_template', type: 'string', description: 'Template with placeholders' },
        { name: 'description', type: 'string', description: 'Prompt purpose description' },
        { name: 'max_tokens', type: 'number?', description: 'Maximum response tokens' },
        { name: 'temperature', type: 'number?', description: 'AI creativity setting' },
        { name: 'is_active', type: 'boolean', description: 'Current version flag' },
        { name: 'created_at', type: 'number', description: 'Creation timestamp' },
        { name: 'created_by', type: 'Id<users>', description: 'Creator user ID (optional)' },
        { name: 'replaced_at', type: 'number?', description: 'When replaced timestamp' },
        { name: 'replaced_by', type: 'string?', description: 'Replacing version' },
        { name: 'usage_count', type: 'number', description: 'Usage frequency counter' },
        { name: 'average_response_time', type: 'number?', description: 'Performance metric' },
        { name: 'success_rate', type: 'number?', description: 'Success rate percentage' }
      ]
    }
  ];

  schemaInfo.forEach(tableInfo => {
    const tableData = afterSnapshot[tableInfo.table as keyof DatabaseSnapshot];
    const rowCount = tableData ? tableData.count : 0;
    console.log(`\n${colors.cyan}📋 Table: ${colors.reset}${colors.blue}${tableInfo.table}${colors.reset} ${colors.yellow}(${rowCount} rows)${colors.reset}`);
    console.log(`${colors.dim}   ${tableInfo.description}${colors.reset}`);
    console.log("┌─────────────────────────────┬──────────────────────┬─────────────────────────────────────┐");
    console.log("│ Column Name                 │ Type                 │ Description                         │");
    console.log("├─────────────────────────────┼──────────────────────┼─────────────────────────────────────┤");
    
    tableInfo.columns.forEach(col => {
      const name = col.name.padEnd(27);
      const type = col.type.padEnd(20);
      const desc = col.description.length > 35 ? col.description.substring(0, 32) + '...' : col.description.padEnd(35);
      console.log(`│ ${name} │ ${type} │ ${desc} │`);
    });
    
    console.log("└─────────────────────────────┴──────────────────────┴─────────────────────────────────────┘");
  });

  console.log(`\n${colors.yellow}📝 Schema Notes:${colors.reset}`);
  console.log("   • Types ending with '?' are optional fields");
  console.log("   • Id<table> represents foreign key to another table");
  console.log("   • All timestamps are Unix timestamps (number)");
  console.log("   • Enum fields show possible values separated by |");
  console.log(`   • Fields marked "(optional)" are temporarily optional for seed data`);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runUATTests().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});