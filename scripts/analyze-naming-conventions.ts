#!/usr/bin/env bun

// Analysis of existing naming conventions in the SupportSignal schema

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m", 
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  dim: "\x1b[2m",
};

console.log(`${colors.blue}╔════════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║                    NAMING CONVENTION ANALYSIS                     ║${colors.reset}`);
console.log(`${colors.blue}║                    SupportSignal Schema Review                    ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════════════════════════════════╝${colors.reset}`);

console.log(`\n${colors.cyan}📋 EXISTING SYSTEM TABLES (Pre-Story 1.1):${colors.reset}`);

const existingTables = [
  {
    category: "Core System",
    tables: [
      { name: "test_messages", convention: "snake_case", source: "Original system" },
      { name: "companies", convention: "camelCase", source: "Pre-existing" },
      { name: "users", convention: "camelCase", source: "Pre-existing" }
    ]
  },
  {
    category: "BetterAuth (Authentication)",
    tables: [
      { name: "sessions", convention: "camelCase", source: "BetterAuth standard" },
      { name: "accounts", convention: "camelCase", source: "BetterAuth standard" },
      { name: "password_reset_tokens", convention: "snake_case", source: "BetterAuth standard" }
    ]
  },
  {
    category: "Application Features",
    tables: [
      { name: "debug_logs", convention: "snake_case", source: "App feature" },
      { name: "chat_sessions", convention: "snake_case", source: "App feature" },
      { name: "chat_messages", convention: "camelCase", source: "App feature" },
      { name: "document_chunks", convention: "snake_case", source: "App feature" }
    ]
  }
];

existingTables.forEach(category => {
  console.log(`\n${colors.magenta}▶ ${category.category}:${colors.reset}`);
  console.log("┌─────────────────────────────┬─────────────────┬─────────────────────┐");
  console.log("│ Table Name                  │ Convention      │ Source              │");
  console.log("├─────────────────────────────┼─────────────────┼─────────────────────┤");
  
  category.tables.forEach(table => {
    const name = table.name.padEnd(27);
    const conv = table.convention.padEnd(15);
    const convColor = table.convention === "snake_case" ? colors.green : colors.yellow;
    const source = table.source.padEnd(19);
    console.log(`│ ${name} │ ${convColor}${conv}${colors.reset} │ ${source} │`);
  });
  
  console.log("└─────────────────────────────┴─────────────────┴─────────────────────┘");
});

console.log(`\n${colors.cyan}🔍 FIELD NAMING ANALYSIS:${colors.reset}`);

const fieldExamples = [
  {
    table: "BetterAuth Tables",
    fields: [
      { name: "userId", convention: "camelCase", standard: "BetterAuth" },
      { name: "sessionToken", convention: "camelCase", standard: "BetterAuth" },
      { name: "providerAccountId", convention: "camelCase", standard: "BetterAuth" },
      { name: "refresh_token", convention: "snake_case", standard: "OAuth Standard" },
      { name: "access_token", convention: "snake_case", standard: "OAuth Standard" },
      { name: "expires_at", convention: "snake_case", standard: "OAuth Standard" },
      { name: "token_type", convention: "snake_case", standard: "OAuth Standard" },
      { name: "id_token", convention: "snake_case", standard: "OAuth Standard" }
    ]
  },
  {
    table: "Application Tables", 
    fields: [
      { name: "contactEmail", convention: "camelCase", standard: "App choice" },
      { name: "hasLLMAccess", convention: "camelCase", standard: "App choice" },
      { name: "companyId", convention: "camelCase", standard: "App choice" },
      { name: "profile_image_url", convention: "snake_case", standard: "App choice" },
      { name: "created_at", convention: "snake_case", standard: "App standard" },
      { name: "updated_at", convention: "snake_case", standard: "App standard" },
      { name: "correlation_id", convention: "snake_case", standard: "App standard" },
      { name: "trace_id", convention: "snake_case", standard: "App standard" },
      { name: "user_id", convention: "snake_case", standard: "App standard" },
      { name: "synced_at", convention: "snake_case", standard: "App standard" }
    ]
  }
];

fieldExamples.forEach(category => {
  console.log(`\n${colors.magenta}▶ ${category.table}:${colors.reset}`);
  console.log("┌─────────────────────────────┬─────────────────┬─────────────────────┐");
  console.log("│ Field Name                  │ Convention      │ Standard/Source     │");
  console.log("├─────────────────────────────┼─────────────────┼─────────────────────┤");
  
  category.fields.forEach(field => {
    const name = field.name.padEnd(27);
    const conv = field.convention.padEnd(15);
    const convColor = field.convention === "snake_case" ? colors.green : colors.yellow;
    const standard = field.standard.padEnd(19);
    console.log(`│ ${name} │ ${convColor}${conv}${colors.reset} │ ${standard} │`);
  });
  
  console.log("└─────────────────────────────┴─────────────────┴─────────────────────┘");
});

console.log(`\n${colors.yellow}📊 CONVENTION PATTERNS SUMMARY:${colors.reset}`);

console.log(`\n${colors.green}✅ snake_case Usage:${colors.reset}`);
console.log("   • Timestamps: created_at, updated_at, synced_at, expires_at");
console.log("   • ID fields: trace_id, user_id, correlation_id");
console.log("   • OAuth tokens: refresh_token, access_token, token_type, id_token");
console.log("   • Multi-word descriptors: profile_image_url");
console.log("   • Some table names: test_messages, password_reset_tokens, debug_logs");

console.log(`\n${colors.yellow}⚠️ camelCase Usage:${colors.reset}`);
console.log("   • BetterAuth core fields: userId, sessionToken, providerAccountId");
console.log("   • Business logic fields: contactEmail, companyId, hasLLMAccess");
console.log("   • Most table names: companies, users, sessions, accounts");

console.log(`\n${colors.cyan}🎯 PATTERN ANALYSIS:${colors.reset}`);

console.log(`\n${colors.dim}1. Table Names:${colors.reset}`);
console.log("   • Mixed convention (both snake_case and camelCase)")
console.log("   • BetterAuth uses camelCase (sessions, accounts)")
console.log("   • App features mixed (chat_sessions vs chat_messages)")

console.log(`\n${colors.dim}2. Field Names:${colors.reset}`);
console.log("   • Timestamps consistently use snake_case (created_at, updated_at)")
console.log("   • OAuth tokens use snake_case (following OAuth spec)")
console.log("   • BetterAuth core fields use camelCase (userId, sessionToken)")
console.log("   • App business logic mixed (contactEmail vs profile_image_url)")

console.log(`\n${colors.dim}3. Foreign Keys:${colors.reset}`);
console.log("   • BetterAuth: userId (camelCase)")
console.log("   • App tables: companyId (camelCase)")
console.log("   • But also: user_id in debug_logs (snake_case)")

console.log(`\n${colors.red}❗ STORY 1.1 ISSUE:${colors.reset}`);
console.log("   • Added 8 new tables using snake_case names");
console.log("   • Added fields mixing both conventions inconsistently");
console.log("   • Created inconsistency with existing BetterAuth patterns");

console.log(`\n${colors.blue}🚀 RECOMMENDATIONS:${colors.reset}`);

console.log(`\n${colors.green}Option 1: Follow BetterAuth + Existing App Pattern${colors.reset}`);
console.log("   • Table names: camelCase (matches companies, users, sessions)");
console.log("   • Timestamp fields: snake_case (created_at, updated_at)");
console.log("   • ID fields: camelCase for foreign keys (userId, companyId)");
console.log("   • OAuth/external standard fields: snake_case");
console.log("   • Business logic fields: camelCase");

console.log(`\n${colors.yellow}Option 2: Full snake_case Migration${colors.reset}`);
console.log("   • Convert ALL tables and fields to snake_case");
console.log("   • Major breaking change requiring migration");
console.log("   • Would conflict with BetterAuth standards");

console.log(`\n${colors.cyan}Option 3: Hybrid Approach (RECOMMENDED)${colors.reset}`);
console.log("   • Keep existing naming as-is (don't break BetterAuth)");
console.log("   • New tables: Follow majority pattern (camelCase)");
console.log("   • Timestamp fields: Always snake_case (created_at, updated_at)");
console.log("   • Traceability fields: snake_case (correlation_id)");
console.log("   • Foreign keys: camelCase (userId, companyId, incidentId)");

process.exit(0);