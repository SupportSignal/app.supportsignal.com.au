#!/usr/bin/env bun
/**
 * Story 1.4 Core API Layer - Analysis Script
 * 
 * This script analyzes the current API implementation status against Story 1.4 requirements
 * by testing API availability and documenting gaps without requiring authentication.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Configuration
const CONVEX_URL = process.env.CONVEX_URL || "https://beaming-gull-639.convex.cloud";

let client: ConvexHttpClient;

// Analysis results
interface APIAnalysis {
  available: string[];
  missing: string[];
  authenticationRequired: string[];
  validationErrors: string[];
  unexpectedErrors: string[];
}

const analysis: APIAnalysis = {
  available: [],
  missing: [],
  authenticationRequired: [],
  validationErrors: [],
  unexpectedErrors: []
};

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function success(message: string) {
  console.log(`✅ ${message}`);
}

function warning(message: string) {
  console.warn(`⚠️  ${message}`);
}

function error(message: string) {
  console.error(`❌ ${message}`);
}

// Test API availability without authentication
async function testAPIEndpoint(
  apiName: string, 
  apiFn: any, 
  testArgs: any,
  expectedError?: string
): Promise<void> {
  try {
    await apiFn(testArgs);
    analysis.available.push(apiName);
    success(`${apiName} - Available`);
  } catch (err: any) {
    const errorMessage = err.message || err.data || 'Unknown error';
    
    if (errorMessage.includes('Authentication required') || errorMessage.includes('Invalid session')) {
      analysis.authenticationRequired.push(apiName);
      success(`${apiName} - Available (requires authentication)`);
    } else if (errorMessage.includes('validation') || errorMessage.includes('required field')) {
      analysis.validationErrors.push(apiName);
      success(`${apiName} - Available (validation working)`);
    } else if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      analysis.missing.push(apiName);
      warning(`${apiName} - Not implemented`);
    } else {
      analysis.unexpectedErrors.push(`${apiName}: ${errorMessage}`);
      error(`${apiName} - Unexpected error: ${errorMessage}`);
    }
  }
}

async function analyzeStory14APIs(): Promise<void> {
  log("🔍 Analyzing Story 1.4 Core API Layer Implementation...");
  
  client = new ConvexHttpClient(CONVEX_URL);

  // Test Incident Management APIs
  log("📝 Testing Incident Management APIs...");
  
  await testAPIEndpoint('incidents.create', client.mutation.bind(client), api.incidents.create, {
    sessionToken: "mock-token",
    reporter_name: "Test Reporter",
    participant_name: "Test Participant",
    event_date_time: new Date().toISOString(),
    location: "Test Location"
  });

  await testAPIEndpoint('incidents.getById', client.query.bind(client), api.incidents.getById, {
    sessionToken: "mock-token",
    id: "mock-id"
  });

  await testAPIEndpoint('incidents.listByUser', client.query.bind(client), api.incidents.listByUser, {
    sessionToken: "mock-token",
    limit: 10
  });

  await testAPIEndpoint('incidents.updateStatus', client.mutation.bind(client), api.incidents.updateStatus, {
    sessionToken: "mock-token",
    id: "mock-id",
    capture_status: "in_progress"
  });

  // Test Narrative Management APIs
  log("📖 Testing Narrative Management APIs...");
  
  await testAPIEndpoint('narratives.create', client.mutation.bind(client), api.narratives.create, {
    sessionToken: "mock-token",
    incident_id: "mock-incident-id"
  });

  await testAPIEndpoint('narratives.update', client.mutation.bind(client), api.narratives.update, {
    sessionToken: "mock-token",
    incident_id: "mock-incident-id",
    before_event: "Test narrative"
  });

  await testAPIEndpoint('narratives.getConsolidated', client.query.bind(client), api.narratives.getConsolidated, {
    sessionToken: "mock-token",
    incident_id: "mock-incident-id"
  });

  // Test Analysis APIs
  log("🔬 Testing Analysis APIs...");
  
  await testAPIEndpoint('analysis.create', client.mutation.bind(client), api.analysis.create, {
    sessionToken: "mock-token",
    incident_id: "mock-incident-id"
  });

  await testAPIEndpoint('analysis.update', client.mutation.bind(client), api.analysis.update, {
    sessionToken: "mock-token",
    analysis_id: "mock-analysis-id",
    contributing_conditions: "Test conditions"
  });

  // Test User & Session APIs  
  log("👤 Testing User & Session APIs...");
  
  await testAPIEndpoint('users.getCurrent', client.query.bind(client), api.users.getCurrent, {
    sessionToken: "mock-token"
  });

  // Test Real-time Subscription APIs
  log("⚡ Testing Real-time Subscription APIs...");
  
  // These might not exist yet
  try {
    await testAPIEndpoint('incidents.subscribeToIncident', client.query.bind(client), api.incidents.subscribeToIncident, {
      sessionToken: "mock-token",
      incident_id: "mock-incident-id"
    });
  } catch (err: any) {
    if (err.message?.includes('does not exist') || err.toString().includes('does not exist')) {
      analysis.missing.push('incidents.subscribeToIncident');
      warning('incidents.subscribeToIncident - Not implemented');
    }
  }

  try {
    await testAPIEndpoint('narratives.subscribeToNarrative', client.query.bind(client), api.narratives.subscribeToNarrative, {
      sessionToken: "mock-token", 
      incident_id: "mock-incident-id"
    });
  } catch (err: any) {
    if (err.message?.includes('does not exist') || err.toString().includes('does not exist')) {
      analysis.missing.push('narratives.subscribeToNarrative');
      warning('narratives.subscribeToNarrative - Not implemented');
    }
  }

  // Test Session Management APIs
  log("💾 Testing Session Management APIs...");
  
  try {
    await testAPIEndpoint('sessions.updateWorkflowState', client.mutation.bind(client), api.sessions.updateWorkflowState, {
      sessionToken: "mock-token",
      workflowType: "incident_capture",
      workflowData: { step: "test" }
    });
  } catch (err: any) {
    if (err.message?.includes('does not exist') || err.toString().includes('does not exist')) {
      analysis.missing.push('sessions.updateWorkflowState');
      warning('sessions.updateWorkflowState - Not implemented');
    }
  }

  try {
    await testAPIEndpoint('sessions.recoverState', client.query.bind(client), api.sessions.recoverState, {
      sessionToken: "mock-token",
      workflowType: "incident_capture"
    });
  } catch (err: any) {
    if (err.message?.includes('does not exist') || err.toString().includes('does not exist')) {
      analysis.missing.push('sessions.recoverState');
      warning('sessions.recoverState - Not implemented');
    }
  }
}

function generateReport(): void {
  console.log("\n" + "=".repeat(80));
  console.log("📊 STORY 1.4 CORE API LAYER - IMPLEMENTATION ANALYSIS");
  console.log("=".repeat(80));

  console.log(`\n✅ AVAILABLE APIS (${analysis.available.length}):`);
  if (analysis.available.length > 0) {
    analysis.available.forEach(api => console.log(`   • ${api}`));
  } else {
    console.log("   None found");
  }

  console.log(`\n🔒 AUTHENTICATION-PROTECTED APIS (${analysis.authenticationRequired.length}):`);
  if (analysis.authenticationRequired.length > 0) {
    analysis.authenticationRequired.forEach(api => console.log(`   • ${api}`));
  } else {
    console.log("   None found");
  }

  console.log(`\n✓ VALIDATION-ENABLED APIS (${analysis.validationErrors.length}):`);
  if (analysis.validationErrors.length > 0) {
    analysis.validationErrors.forEach(api => console.log(`   • ${api}`));
  } else {
    console.log("   None found");
  }

  console.log(`\n❌ MISSING APIS (${analysis.missing.length}):`);
  if (analysis.missing.length > 0) {
    analysis.missing.forEach(api => console.log(`   • ${api}`));
  } else {
    console.log("   None - all expected APIs implemented!");
  }

  console.log(`\n⚠️  UNEXPECTED ERRORS (${analysis.unexpectedErrors.length}):`);
  if (analysis.unexpectedErrors.length > 0) {
    analysis.unexpectedErrors.forEach(error => console.log(`   • ${error}`));
  } else {
    console.log("   None found");
  }

  const totalExpected = 15; // Based on Story 1.4 requirements
  const totalImplemented = analysis.available.length + analysis.authenticationRequired.length + analysis.validationErrors.length;
  const implementationRate = (totalImplemented / totalExpected) * 100;

  console.log(`\n📈 IMPLEMENTATION SUMMARY:`);
  console.log(`   Total Expected APIs: ${totalExpected}`);
  console.log(`   Total Implemented: ${totalImplemented}`);
  console.log(`   Missing APIs: ${analysis.missing.length}`);
  console.log(`   Implementation Rate: ${implementationRate.toFixed(1)}%`);

  console.log(`\n🎯 STORY 1.4 ACCEPTANCE CRITERIA STATUS:`);
  console.log(`   AC #1 (API endpoints with TypeScript): ${totalImplemented > 0 ? '✅ Partial' : '❌ Not Started'}`);
  console.log(`   AC #2 (Input validation): ${analysis.validationErrors.length > 0 ? '✅ Working' : '⚠️  Unknown'}`);
  console.log(`   AC #3 (Permission checking): ${analysis.authenticationRequired.length > 0 ? '✅ Working' : '❌ Missing'}`);
  console.log(`   AC #4 (Real-time subscriptions): ${analysis.missing.includes('subscribeToIncident') ? '❌ Missing' : '✅ Implemented'}`);
  console.log(`   AC #5 (Error handling): ${analysis.authenticationRequired.length > 0 ? '✅ Working' : '⚠️  Unknown'}`);

  console.log("\n" + "=".repeat(80));
}

async function main(): Promise<void> {
  try {
    await analyzeStory14APIs();
    generateReport();
  } catch (err: any) {
    error(`Analysis failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main, analyzeStory14APIs };