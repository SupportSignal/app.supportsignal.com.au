#!/usr/bin/env node

/**
 * Seed AI Prompt Templates Script
 * 
 * This script seeds the required AI prompt templates for the incident capture workflow,
 * specifically addressing the "No active prompt template found for clarification questions" error.
 * 
 * Usage:
 *   node scripts/seed-ai-prompts.js
 *   
 * This should be run after deploying the application to ensure the AI clarification
 * system has the necessary prompt templates.
 */

import { execSync } from 'child_process';

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

function runConvexMutation(mutation, args = {}) {
  const argsStr = Object.keys(args).length > 0 ? ` '${JSON.stringify(args)}'` : '';
  const command = `bunx convex run ${mutation}${argsStr}`;
  
  log(`${colors.cyan}Running:${colors.reset} ${command}`);
  
  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

function main() {
  log(`${colors.bright}🌱 Seeding AI Prompt Templates${colors.reset}`);
  log(`${colors.yellow}Purpose:${colors.reset} Fix "No active prompt template found for clarification questions" error\n`);
  
  // Check if Convex is available
  try {
    execSync('bunx convex --version', { stdio: 'pipe' });
  } catch (error) {
    log(`${colors.red}[ERROR]${colors.reset} Convex CLI not available. Please ensure Convex is installed and configured.`);
    log(`${colors.yellow}Install Convex:${colors.reset} npm install -g convex`);
    log(`${colors.yellow}Configure:${colors.reset} bunx convex dev`);
    process.exit(1);
  }
  
  log(`${colors.cyan}Step 1:${colors.reset} Seeding clarification questions prompt template...`);
  
  const result = runConvexMutation('lib/ai/promptManager:seedPromptTemplates');
  
  if (result.success) {
    log(`${colors.green}[SUCCESS]${colors.reset} AI prompt templates seeded successfully`);
    
    // Parse output to show what was created
    try {
      const lines = result.output.split('\n').filter(line => line.trim());
      const lastLine = lines[lines.length - 1];
      
      if (lastLine.includes('already exist')) {
        log(`${colors.yellow}[INFO]${colors.reset} Prompt templates already exist - no changes needed`);
      } else if (lastLine.includes('Successfully seeded')) {
        log(`${colors.green}[INFO]${colors.reset} New prompt templates created`);
      }
    } catch (parseError) {
      // Output parsing failed, but operation succeeded
      log(`${colors.green}[INFO]${colors.reset} Operation completed successfully`);
    }
    
    log(`\n${colors.cyan}Step 2:${colors.reset} Verifying prompt template availability...`);
    
    const verifyResult = runConvexMutation('lib/ai/promptManager:getActivePrompt', {
      prompt_name: 'generate_clarification_questions',
      subsystem: 'incidents'
    });
    
    if (verifyResult.success) {
      const output = verifyResult.output.trim();
      if (output === 'null' || output.includes('null')) {
        log(`${colors.red}[WARNING]${colors.reset} Prompt template not found after seeding`);
        log(`${colors.yellow}This may indicate a configuration issue.${colors.reset}`);
        
        // Provide debugging information
        log(`\n${colors.yellow}Debugging Steps:${colors.reset}`);
        log(`1. Check the database for ai_prompts table:`);
        log(`   ${colors.cyan}bunx convex run -h${colors.reset} (to see available functions)`);
        log(`2. Verify the prompt was inserted:`);
        log(`   ${colors.cyan}bunx convex dashboard${colors.reset} (check ai_prompts table)`);
        log(`3. Check for any database schema issues`);
        
        process.exit(1);
      } else {
        log(`${colors.green}[SUCCESS]${colors.reset} Prompt template verified and available`);
        
        // Extract key information from the prompt
        try {
          const promptData = JSON.parse(output);
          log(`${colors.cyan}Template Details:${colors.reset}`);
          log(`  Name: ${promptData.prompt_name}`);
          log(`  Version: ${promptData.prompt_version}`);
          log(`  AI Model: ${promptData.ai_model}`);
          log(`  Status: ${promptData.is_active ? 'Active' : 'Inactive'}`);
        } catch (parseError) {
          log(`${colors.cyan}Template found and active${colors.reset}`);
        }
      }
    } else {
      log(`${colors.red}[ERROR]${colors.reset} Failed to verify prompt template`);
      log(`Error: ${verifyResult.error}`);
      if (verifyResult.output) {
        log(`Output: ${verifyResult.output}`);
      }
      process.exit(1);
    }
    
    log(`\n${colors.bright}✅ AI Prompt Templates Setup Complete!${colors.reset}`);
    log(`\n${colors.green}The "No active prompt template found" error should now be resolved.${colors.reset}`);
    log(`\n${colors.yellow}Next Steps:${colors.reset}`);
    log(`1. Test the incident capture workflow`);
    log(`2. Navigate to Step 3+ clarification questions`);
    log(`3. Verify questions are generated successfully`);
    
    log(`\n${colors.cyan}Testing Commands:${colors.reset}`);
    log(`  ${colors.cyan}node scripts/test-incident-workflow.js ai-error${colors.reset}`);
    log(`  ${colors.cyan}node scripts/test-incident-workflow.js workflow${colors.reset}`);
    
  } else {
    log(`${colors.red}[ERROR]${colors.reset} Failed to seed AI prompt templates`);
    log(`Error: ${result.error}`);
    if (result.output) {
      log(`Output: ${result.output}`);
    }
    
    log(`\n${colors.yellow}Troubleshooting:${colors.reset}`);
    log(`1. Ensure Convex development server is running:`);
    log(`   ${colors.cyan}bunx convex dev${colors.reset}`);
    log(`2. Check database connection and schema`);
    log(`3. Verify the promptManager functions exist in your Convex functions`);
    log(`4. Check for any compilation errors in your Convex functions`);
    
    process.exit(1);
  }
}

main();
