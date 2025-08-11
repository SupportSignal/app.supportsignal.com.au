#!/usr/bin/env node

/**
 * Incident Capture Workflow Testing Script
 * 
 * This script provides targeted testing for the incident capture workflow,
 * including reproduction of the "No active prompt template found" error.
 * 
 * Usage:
 *   node scripts/test-incident-workflow.js [test-type]
 * 
 * Test types:
 *   - all: Run all workflow tests
 *   - convex: Run Convex backend tests only
 *   - components: Run React component tests only
 *   - integration: Run end-to-end integration tests
 *   - ai-error: Focus on AI clarification error scenarios
 */

const { execSync } = require('child_process');
const path = require('path');

const testType = process.argv[2] || 'all';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}[RUNNING]${colors.reset} ${description}`);
  log(`${colors.blue}Command:${colors.reset} ${command}`);
  
  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    log(`${colors.green}[SUCCESS]${colors.reset} ${description}`);
    
    // Show test results
    const lines = output.split('\n');
    const summaryLines = lines.filter(line => 
      line.includes('Tests:') || 
      line.includes('passed') || 
      line.includes('failed') ||
      line.includes('Test Suites:') ||
      line.includes('Time:')
    );
    
    if (summaryLines.length > 0) {
      log(`${colors.yellow}Results:${colors.reset}`);
      summaryLines.forEach(line => log(`  ${line}`));
    }
    
    return true;
  } catch (error) {
    log(`${colors.red}[FAILED]${colors.reset} ${description}`);
    log(`${colors.red}Error:${colors.reset} ${error.message}`);
    
    // Show error output for debugging
    if (error.stdout) {
      log(`${colors.yellow}Output:${colors.reset}`);
      console.log(error.stdout);
    }
    
    if (error.stderr) {
      log(`${colors.red}Error Details:${colors.reset}`);
      console.log(error.stderr);
    }
    
    return false;
  }
}

// Test configurations
const testConfigs = {
  convex: {
    command: 'npx jest --config=jest.config.js --testPathPattern="tests/convex/incidents|tests/convex/ai" --verbose',
    description: 'Convex Backend Tests (Incident capture workflow and AI clarification system)'
  },
  
  components: {
    command: 'npx jest --config=jest.config.web.js --testPathPattern="tests/web/components/incidents" --verbose',
    description: 'React Component Tests (Workflow navigation and UI state management)'
  },
  
  integration: {
    command: 'npx jest --config=jest.config.js --testPathPattern="tests/integration" --verbose',
    description: 'Integration Tests (End-to-end workflow scenarios)'
  },
  
  'ai-error': {
    command: 'npx jest --config=jest.config.js --testPathPattern="tests/convex/ai/clarification-system.test.ts" --testNamePattern="missing prompt template" --verbose',
    description: 'AI Error Reproduction (Focus on "No active prompt template found" error)'
  },
  
  workflow: {
    command: 'npx jest --config=jest.config.js --testPathPattern="incident-capture-workflow.test.ts" --verbose',
    description: 'Incident Capture Workflow Tests (Complete workflow validation)'
  }
};

function main() {
  log(`${colors.bright}🧪 Incident Capture Workflow Test Runner${colors.reset}`);
  log(`${colors.cyan}Test Type:${colors.reset} ${testType}\n`);
  
  const startTime = Date.now();
  let testsRun = 0;
  let testsPassed = 0;
  
  if (testType === 'all') {
    log(`${colors.bright}Running all incident workflow tests...${colors.reset}`);
    
    // Run tests in logical order
    const testOrder = ['convex', 'components', 'integration'];
    
    for (const test of testOrder) {
      testsRun++;
      if (runCommand(testConfigs[test].command, testConfigs[test].description)) {
        testsPassed++;
      }
    }
  } else if (testConfigs[testType]) {
    testsRun++;
    if (runCommand(testConfigs[testType].command, testConfigs[testType].description)) {
      testsPassed++;
    }
  } else {
    log(`${colors.red}[ERROR]${colors.reset} Unknown test type: ${testType}`);
    log(`\n${colors.yellow}Available test types:${colors.reset}`);
    Object.keys(testConfigs).forEach(key => {
      log(`  ${colors.cyan}${key}${colors.reset}: ${testConfigs[key].description}`);
    });
    log(`  ${colors.cyan}all${colors.reset}: Run all workflow tests`);
    process.exit(1);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  log(`\n${colors.bright}=== Test Summary ===${colors.reset}`);
  log(`${colors.cyan}Tests Run:${colors.reset} ${testsRun}`);
  log(`${colors.green}Tests Passed:${colors.reset} ${testsPassed}`);
  log(`${colors.red}Tests Failed:${colors.reset} ${testsRun - testsPassed}`);
  log(`${colors.yellow}Total Time:${colors.reset} ${duration}s`);
  
  if (testsPassed === testsRun) {
    log(`\n${colors.green}${colors.bright}✅ All tests passed!${colors.reset}`);
  } else {
    log(`\n${colors.red}${colors.bright}❌ Some tests failed!${colors.reset}`);
    
    // Provide debugging guidance
    log(`\n${colors.yellow}Debugging Tips:${colors.reset}`);
    log(`1. For AI clarification errors, check if prompt templates are seeded:`);
    log(`   ${colors.cyan}node scripts/test-incident-workflow.js ai-error${colors.reset}`);
    log(`2. For component tests, ensure all mocks are properly configured`);
    log(`3. For integration tests, verify database schema is up-to-date`);
    log(`4. Run individual test suites to isolate issues:`);
    Object.keys(testConfigs).forEach(key => {
      log(`   ${colors.cyan}node scripts/test-incident-workflow.js ${key}${colors.reset}`);
    });
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runCommand, testConfigs };
