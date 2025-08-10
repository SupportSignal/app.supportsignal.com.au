#!/usr/bin/env node

/**
 * =============================================================================
 * Environment Setup and Migration Helper
 * =============================================================================
 * This script helps migrate from repository-based environment files to a
 * centralized, secure configuration system in ~/.env-configs/
 * 
 * Features:
 * - Creates centralized environment directory structure
 * - Migrates existing environment files with secure permissions
 * - Generates example configurations for new projects
 * - Creates organized backup directory structure
 */

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');
const PROJECT_NAME = path.basename(ROOT_DIR);
const HOME_DIR = process.env.HOME || process.env.USERPROFILE;
const ENV_CONFIG_DIR = path.join(HOME_DIR, '.env-configs');
const BACKUP_DIR = path.join(ENV_CONFIG_DIR, 'backups', PROJECT_NAME);

// File paths
const OLD_ENV_FILE = path.join(ROOT_DIR, '.env.source-of-truth.local');
const TARGET_ENV_FILE = path.join(ENV_CONFIG_DIR, `${PROJECT_NAME}.env`);

/**
 * Creates the centralized environment directory structure
 */
function createDirectoryStructure() {
    console.log('📁 Creating centralized environment directory structure...');
    
    // Create main config directory
    if (!fs.existsSync(ENV_CONFIG_DIR)) {
        fs.mkdirSync(ENV_CONFIG_DIR, { recursive: true, mode: 0o700 });
        console.log(`✅ Created: ${ENV_CONFIG_DIR}`);
    } else {
        console.log(`✓ Already exists: ${ENV_CONFIG_DIR}`);
    }
    
    // Create backup directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 });
        console.log(`✅ Created backup directory: ${BACKUP_DIR}`);
    } else {
        console.log(`✓ Backup directory exists: ${BACKUP_DIR}`);
    }
    
    // Set secure permissions on directories
    fs.chmodSync(ENV_CONFIG_DIR, 0o700);
    fs.chmodSync(BACKUP_DIR, 0o700);
    console.log('✅ Secure directory permissions set (700)');
}

/**
 * Migrates existing environment file to centralized location
 */
function migrateEnvironmentFile() {
    console.log('🚀 Migrating environment file to centralized location...');
    
    if (fs.existsSync(TARGET_ENV_FILE)) {
        console.log('⚠️  Environment file already exists at centralized location');
        console.log(`   File: ${TARGET_ENV_FILE}`);
        console.log('   Use --force to overwrite or manually merge changes');
        return false;
    }
    
    if (fs.existsSync(OLD_ENV_FILE)) {
        console.log('📋 Copying existing .env.source-of-truth.local...');
        
        // Create backup before migration
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `${PROJECT_NAME}.env.pre-migration.${timestamp}`);
        
        // Copy to both centralized location and backup
        fs.copyFileSync(OLD_ENV_FILE, TARGET_ENV_FILE);
        fs.copyFileSync(OLD_ENV_FILE, backupFile);
        
        // Set secure permissions
        fs.chmodSync(TARGET_ENV_FILE, 0o600);
        fs.chmodSync(backupFile, 0o600);
        
        console.log(`✅ Migrated to: ${TARGET_ENV_FILE}`);
        console.log(`✅ Backup created: ${backupFile}`);
        console.log('✅ Secure permissions set (600)');
        
        return true;
    } else {
        console.log('ℹ️  No existing .env.source-of-truth.local found');
        console.log('   Will create example configuration');
        return false;
    }
}

/**
 * Creates an example environment configuration file
 */
function createExampleConfiguration() {
    console.log('📝 Creating example environment configuration...');
    
    const exampleContent = `| TARGET               | GROUP                       | KEY                       | DEV_VALUE                                                                                                  | PROD_VALUE                                                                                                 |
|----------------------|-----------------------------|---------------------------|------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| NEXTJS,CONVEX,GITHUB | Local Development           | NEXT_PUBLIC_APP_URL       | http://localhost:3200                                                                                      | https://app.supportsignal.com.au                                                                          |
| NEXTJS,GITHUB        | Production URL              | NEXT_PUBLIC_PROD_APP_URL  | https://app.supportsignal.com.au                                                                          | https://app.supportsignal.com.au                                                                          |
| NEXTJS,GITHUB        | Repository                  | NEXT_PUBLIC_GITHUB_REPO   | https://github.com/supportsignal/app.supportsignal.com.au                                                 | https://github.com/supportsignal/app.supportsignal.com.au                                                 |
| NEXTJS,CONVEX        | Local Development           | PORT                      | 3200                                                                                                       | 3200                                                                                                       |
| CONVEX               | GitHub OAuth                | GITHUB_CLIENT_ID          | your-github-client-id-here                                                                                 | your-github-client-id-here                                                                                 |
| CONVEX               | GitHub OAuth                | GITHUB_CLIENT_SECRET      | your-github-client-secret-here                                                                             | your-github-client-secret-here                                                                             |
| CONVEX               | Google OAuth                | GOOGLE_CLIENT_ID          | your-google-client-id.apps.googleusercontent.com                                                          | your-google-client-id.apps.googleusercontent.com                                                          |
| CONVEX               | Google OAuth                | GOOGLE_CLIENT_SECRET      | your-google-client-secret-here                                                                             | your-google-client-secret-here                                                                             |
| CONVEX               | OAuth                       | OAUTH_SECRET              | your-base64-oauth-secret-here                                                                              | your-base64-oauth-secret-here                                                                              |
| CONVEX               | LLM Config                  | OPENAI_API_KEY            | your-openai-api-key-here                                                                                   | your-openai-api-key-here                                                                                   |
| CONVEX               | LLM Config                  | OPENROUTER_API_KEY        | your-openrouter-api-key-here                                                                               | your-openrouter-api-key-here                                                                               |
| CONVEX               | LLM Config                  | ANTHROPIC_API_KEY         | your-anthropic-api-key-here                                                                                | your-anthropic-api-key-here                                                                                |
| CONVEX               | LLM Config                  | LLM_MODEL                 | openai/gpt-4o-mini                                                                                         | openai/gpt-4o-mini                                                                                         |
| CONVEX               | LLM Config                  | LLM_FALLBACK_MODEL        | openai/gpt-4o-mini                                                                                         | openai/gpt-4o-mini                                                                                         |
| CONVEX               | Convex                      | CONVEX_DEPLOYMENT         | dev:beaming-gull-639                                                                                       | dev:beaming-gull-639                                                                                       |
| NEXTJS,CONVEX,GITHUB | Convex                      | NEXT_PUBLIC_CONVEX_URL    | https://beaming-gull-639.convex.cloud                                                                      | https://beaming-gull-639.convex.cloud                                                                      |
| CONVEX,GITHUB        | Cloudflare Page & Vector    | CLOUDFLARE_ACCOUNT_ID     | your-cloudflare-account-id-here                                                                            | your-cloudflare-account-id-here                                                                            |
| CONVEX,GITHUB        | Cloudflare Page & Vector    | VECTORIZE_DATABASE_ID     |                                                                                                            |                                                                                                            |
| CONVEX,GITHUB        | Cloudflare Page & Vector    | CLOUDFLARE_API_TOKEN      | your-cloudflare-api-token-here                                                                             | your-cloudflare-api-token-here                                                                             |
| CONVEX,LOG_WORKER    | Upstash Redis               | UPSTASH_REDIS_REST_URL    | https://your-redis-instance.upstash.io                                                                     | https://your-redis-instance.upstash.io                                                                     |
| CONVEX,LOG_WORKER    | Upstash Redis               | UPSTASH_REDIS_REST_TOKEN  | your-upstash-redis-token-here                                                                              | your-upstash-redis-token-here                                                                              |
| LOG_WORKER           | Worker Config               | ALLOWED_ORIGINS           | https://beaming-gull-639.convex.cloud,http://localhost:3200                                                | https://beaming-gull-639.convex.cloud,http://localhost:3200                                                |
| NEXTJS,CONVEX,GITHUB | Logging                     | NEXT_PUBLIC_LOG_WORKER_URL| https://supportsignal-log-ingestion-worker.david-0b1.workers.dev                                           | https://supportsignal-log-ingestion-worker.david-0b1.workers.dev                                           |
| CONVEX               | Logging                     | LOG_WORKER_URL            | https://supportsignal-log-ingestion-worker.david-0b1.workers.dev                                           | https://supportsignal-log-ingestion-worker.david-0b1.workers.dev                                           |
`;

    fs.writeFileSync(TARGET_ENV_FILE, exampleContent);
    fs.chmodSync(TARGET_ENV_FILE, 0o600);
    
    console.log(`✅ Example configuration created: ${TARGET_ENV_FILE}`);
    console.log('✅ Secure permissions set (600)');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Edit the environment file with your actual API keys and secrets');
    console.log('   2. Generate new OAUTH_SECRET: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
    console.log('   3. Run: bun run sync-env --deployment=dev');
    console.log('');
    console.log('🔒 Security Note:');
    console.log('   - This file is outside your repository and has secure permissions (600)');
    console.log('   - Never commit API keys or secrets to version control');
    console.log('   - Generate new keys for production use');
}

/**
 * Shows the current status of the environment setup
 */
function showStatus() {
    console.log('📊 Environment Configuration Status:');
    console.log('=' .repeat(50));
    
    console.log(`Project Name: ${PROJECT_NAME}`);
    console.log(`Config Directory: ${ENV_CONFIG_DIR}`);
    console.log(`Environment File: ${TARGET_ENV_FILE}`);
    console.log(`Backup Directory: ${BACKUP_DIR}`);
    console.log('');
    
    // Check file status
    if (fs.existsSync(TARGET_ENV_FILE)) {
        const stats = fs.statSync(TARGET_ENV_FILE);
        const permissions = (stats.mode & parseInt('777', 8)).toString(8);
        console.log(`✅ Environment file exists (permissions: ${permissions})`);
    } else {
        console.log('❌ Environment file does not exist');
    }
    
    // Check old file status
    if (fs.existsSync(OLD_ENV_FILE)) {
        console.log('⚠️  Old environment file still exists in repository');
        console.log('   Consider removing after successful migration');
    } else {
        console.log('✅ No old environment file in repository');
    }
}

/**
 * Main execution function
 */
function main() {
    const args = process.argv.slice(2);
    const options = {
        force: args.includes('--force'),
        statusOnly: args.includes('--status'),
        help: args.includes('--help') || args.includes('-h')
    };
    
    if (options.help) {
        console.log('Environment Setup and Migration Helper');
        console.log('');
        console.log('Usage:');
        console.log('  bun env:setup              # Setup centralized environment system');
        console.log('  bun env:setup --status     # Show current status');
        console.log('  bun env:setup --force      # Force overwrite existing files');
        console.log('  bun env:setup --help       # Show this help message');
        console.log('');
        console.log('What this script does:');
        console.log('  1. Creates ~/.env-configs/ directory with secure permissions');
        console.log('  2. Migrates .env.source-of-truth.local to centralized location');
        console.log('  3. Creates backup directory structure');
        console.log('  4. Sets secure file permissions (600) on environment files');
        return;
    }
    
    if (options.statusOnly) {
        showStatus();
        return;
    }
    
    console.log('🚀 Environment Setup and Migration');
    console.log('=' .repeat(50));
    console.log(`Project: ${PROJECT_NAME}`);
    console.log(`Target: ${TARGET_ENV_FILE}`);
    console.log('');
    
    try {
        // Step 1: Create directory structure
        createDirectoryStructure();
        console.log('');
        
        // Step 2: Migrate existing file or create example
        const migrated = migrateEnvironmentFile();
        if (!migrated) {
            createExampleConfiguration();
        }
        console.log('');
        
        // Step 3: Show final status
        showStatus();
        console.log('');
        
        console.log('✅ Environment setup completed successfully!');
        console.log('');
        console.log('🔄 Next Steps:');
        console.log('   • Edit your environment file with actual API keys');
        console.log('   • Run: bun env:validate to check the file exists');
        console.log('   • Run: bun run sync-env --deployment=dev to generate local configs');
        
    } catch (error) {
        console.error('❌ Environment setup failed:', error.message);
        process.exit(1);
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { createDirectoryStructure, migrateEnvironmentFile, createExampleConfiguration };