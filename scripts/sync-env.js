#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * =============================================================================
 * Advanced Environment Sync Script for Monorepo
 * =============================================================================
 * This JavaScript version provides enhanced environment variable management
 * with human-readable source configuration and intelligent config generation.
 * 
 * Features:
 * - Parses human-readable .env.source-of-truth.local format
 * - Generates Next.js and Convex configs with proper commentary
 * - Validates environment variables
 * - Provides detailed logging and error handling
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');

// Auto-detect project name and construct env file path
const PROJECT_NAME = path.basename(ROOT_DIR);
const ENV_CONFIG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.env-configs'
);
const SOURCE_FILE = path.join(ENV_CONFIG_DIR, `${PROJECT_NAME}.env`);
const WEB_ENV_FILE = path.join(ROOT_DIR, 'apps/web/.env.local');
const CONVEX_ENV_FILE = path.join(ROOT_DIR, 'apps/convex/.env.local');
const WORKER_ENV_FILE = path.join(ROOT_DIR, 'apps/workers/log-ingestion/.dev.vars');
const BACKUP_DIR = path.join(ENV_CONFIG_DIR, 'backups', PROJECT_NAME);
const BACKUP_FILE = path.join(BACKUP_DIR, `${PROJECT_NAME}.env.backup`);
const CONVEX_DIR = path.join(ROOT_DIR, 'apps/convex');
const WORKER_DIR = path.join(ROOT_DIR, 'apps/workers/log-ingestion');

// Parse command line arguments
const args = process.argv.slice(2);
const modeArg = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'local';

// Validate mode parameter
const validModes = ['local', 'deploy-dev', 'deploy-prod'];
if (!validModes.includes(modeArg)) {
    console.error('🚨 ERROR: Invalid mode parameter');
    console.error('');
    console.error('Usage:');
    console.error('  bun run sync-env --mode=local         # Generate local .env files (dev values only)');
    console.error('  bun run sync-env --mode=deploy-dev    # Deploy to dev Convex deployment');
    console.error('  bun run sync-env --mode=deploy-prod   # Deploy to prod Convex deployment');
    console.error('');
    console.error('Options:');
    console.error('  --dry-run     Show what would be changed without applying');
    console.error('  --verbose     Show detailed output');
    process.exit(1);
}

const options = {
  dryRun: args.includes('--dry-run'),
  mode: modeArg,
  verbose: args.includes('--verbose'),
  // Derive deployment from mode for backward compatibility
  deployment: modeArg === 'deploy-prod' ? 'production' : 'dev'
};

/**
 * Parses the human-readable environment source file and returns both dev and prod values
 * @param {string} targetEnvironment - 'dev' for local files, 'production' for deployment
 * @returns {Array} Array of environment variable objects
 */
function parseSourceFile(targetEnvironment = 'dev') {
    console.log('📖 Reading environment source file...');

    if (!fs.existsSync(SOURCE_FILE)) {
        console.error(`❌ Source file not found: ${SOURCE_FILE}`);
        console.log('💡 Please create .env.source-of-truth.local with your environment configuration');
        process.exit(1);
    }

    const content = fs.readFileSync(SOURCE_FILE, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('|---'));

    const envVars = [];

    for (const line of lines) {
        if (line.startsWith('|') && line.includes('|')) {
            const parts = line.split('|').map(part => part.trim()).filter(part => part);

            if (parts.length >= 4 && parts[0] !== 'TARGET') { // Skip header row
                const targets = parts[0].split(',').map(t => t.trim().toUpperCase());
                const group = parts[1].trim();
                const key = parts[2].trim();

                // Handle both old format (4 columns) and new format (5 columns)
                let value, devValue, prodValue;
                if (parts.length === 5) {
                    // New format with DEV_VALUE and PROD_VALUE
                    devValue = parts[3].trim();
                    prodValue = parts[4].trim();

                    // CRITICAL FIX: Local files ALWAYS use dev values
                    if (options.mode === 'local') {
                        value = devValue;
                    } else {
                        // Only for deployment modes, select based on target environment
                        value = targetEnvironment === 'production' ? prodValue : devValue;
                    }
                } else {
                    // Old format with single VALUE column (backward compatibility)
                    value = parts[3].trim();
                    devValue = value;
                    prodValue = value;
                }

                envVars.push({
                    key: key,
                    value: value,
                    devValue: devValue,
                    prodValue: prodValue,
                    group: group,
                    targets: targets,
                    // Backward compatibility
                    nextjs: targets.includes('NEXTJS'),
                    convex: targets.includes('CONVEX'),
                    logWorker: targets.includes('LOG_WORKER')
                });
            }
        }
    }

    console.log(`✅ Parsed ${envVars.length} environment variables from source (target: ${targetEnvironment})`);
    return envVars;
}

/**
 * Groups environment variables by their group for organized output
 */
function groupVariables(envVars) {
    const groups = {};
    
    envVars.forEach(envVar => {
        if (!groups[envVar.group]) {
            groups[envVar.group] = [];
        }
        groups[envVar.group].push(envVar);
    });
    
    return groups;
}

/**
 * Generates Next.js environment file with commentary
 */
function generateNextjsEnv(envVars) {
    console.log('🔧 Generating Next.js environment configuration...');
    
    const nextjsVars = envVars.filter(envVar => envVar.nextjs);
    const groups = groupVariables(nextjsVars);
    
    let content = '';
    content += '# =============================================================================\n';
    content += '# Next.js Environment Configuration\n';
    content += '# =============================================================================\n';
    content += '# Auto-generated from .env.source-of-truth.local - DO NOT EDIT MANUALLY\n';
    content += '# Run \'npm run sync-env\' or \'bun run sync-env\' to regenerate this file\n';
    content += '#\n';
    content += '# This file contains environment variables specific to the Next.js application.\n';
    content += '# Variables prefixed with NEXT_PUBLIC_ are exposed to the browser.\n';
    content += '# =============================================================================\n\n';
    
    Object.keys(groups).sort().forEach(groupName => {
        content += `# ${groupName}\n`;
        content += `# ${'-'.repeat(groupName.length + 2)}\n`;
        
        groups[groupName].forEach(envVar => {
            if (envVar.key.startsWith('NEXT_PUBLIC_')) {
                content += `# ⚠️  PUBLIC: This variable is exposed to the browser\n`;
            }
            content += `${envVar.key}=${envVar.value}\n`;
        });
        
        content += '\n';
    });
    
    // Ensure the web directory exists
    const webDir = path.dirname(WEB_ENV_FILE);
    if (!fs.existsSync(webDir)) {
        fs.mkdirSync(webDir, { recursive: true });
    }
    
    fs.writeFileSync(WEB_ENV_FILE, content);
    console.log(`✅ Next.js environment file generated: ${WEB_ENV_FILE}`);
    return nextjsVars.length;
}

/**
 * Generates Convex environment file with commentary
 */
function generateConvexEnv(envVars) {
    console.log('🔧 Generating Convex environment configuration...');
    
    const convexVars = envVars.filter(envVar => envVar.convex);
    
    if (convexVars.length === 0) {
        console.log('ℹ️  No Convex-specific variables found, skipping Convex env generation');
        return 0;
    }
    
    const groups = groupVariables(convexVars);
    
    let content = '';
    content += '# =============================================================================\n';
    content += '# Convex Backend Environment Configuration\n';
    content += '# =============================================================================\n';
    content += '# Auto-generated from .env.source-of-truth.local - DO NOT EDIT MANUALLY\n';
    content += '# Run \'npm run sync-env\' or \'bun run sync-env\' to regenerate this file\n';
    content += '#\n';
    content += '# This file contains environment variables specific to the Convex backend.\n';
    content += '# These variables are used for server-side operations and API integrations.\n';
    content += '# =============================================================================\n\n';
    
    Object.keys(groups).sort().forEach(groupName => {
        content += `# ${groupName}\n`;
        content += `# ${'-'.repeat(groupName.length + 2)}\n`;
        
        groups[groupName].forEach(envVar => {
            content += `${envVar.key}=${envVar.value}\n`;
        });
        
        content += '\n';
    });
    
    // Ensure the convex directory exists
    const convexDir = path.dirname(CONVEX_ENV_FILE);
    if (!fs.existsSync(convexDir)) {
        fs.mkdirSync(convexDir, { recursive: true });
    }
    
    fs.writeFileSync(CONVEX_ENV_FILE, content);
    console.log(`✅ Convex environment file generated: ${CONVEX_ENV_FILE}`);
    return convexVars.length;
}

/**
 * Generates Worker .dev.vars file for local development
 */
function generateWorkerEnv(envVars) {
    console.log('🔧 Generating Worker development environment configuration...');
    
    const workerVars = envVars.filter(envVar => envVar.logWorker);
    
    if (workerVars.length === 0) {
        console.log('ℹ️  No Worker-specific variables found, skipping Worker env generation');
        return 0;
    }
    
    const groups = groupVariables(workerVars);
    
    let content = '';
    content += '# =============================================================================\n';
    content += '# Cloudflare Worker Development Environment Configuration\n';
    content += '# =============================================================================\n';
    content += '# Auto-generated from .env.source-of-truth.local - DO NOT EDIT MANUALLY\n';
    content += '# Run \'npm run sync-env\' or \'bun run sync-env\' to regenerate this file\n';
    content += '#\n';
    content += '# This file contains environment variables for local Worker development.\n';
    content += '# For production deployment, use: wrangler secret put VARIABLE_NAME\n';
    content += '# =============================================================================\n\n';
    
    Object.keys(groups).sort().forEach(groupName => {
        content += `# ${groupName}\n`;
        content += `# ${'-'.repeat(groupName.length + 2)}\n`;
        
        groups[groupName].forEach(envVar => {
            content += `${envVar.key}=${envVar.value}\n`;
        });
        
        content += '\n';
    });
    
    // Ensure the worker directory exists
    const workerDir = path.dirname(WORKER_ENV_FILE);
    if (!fs.existsSync(workerDir)) {
        fs.mkdirSync(workerDir, { recursive: true });
    }
    
    fs.writeFileSync(WORKER_ENV_FILE, content);
    console.log(`✅ Worker environment file generated: ${WORKER_ENV_FILE}`);
    return workerVars.length;
}

/**
 * Validates environment variables for common issues
 */
function validateEnvironmentVariables(envVars) {
    console.log('🔍 Validating environment variables...');
    
    const warnings = [];
    const errors = [];
    
    envVars.forEach(envVar => {
        // Check for empty values
        if (!envVar.value || envVar.value.trim() === '') {
            warnings.push(`Empty value for ${envVar.key}`);
        }
        
        // Check for potential secrets in public variables
        if (envVar.key.startsWith('NEXT_PUBLIC_')) {
            const suspiciousPatterns = ['secret', 'key', 'token', 'password'];
            const lowerKey = envVar.key.toLowerCase();
            const lowerValue = envVar.value.toLowerCase();
            
            if (suspiciousPatterns.some(pattern => 
                lowerKey.includes(pattern) || lowerValue.includes(pattern))) {
                errors.push(`🚨 SECURITY: ${envVar.key} appears to contain sensitive data but is marked as public`);
            }
        }
        
        // Check for required Convex variables
        if (envVar.key === 'CONVEX_DEPLOYMENT' && (!envVar.convex || !envVar.nextjs)) {
            warnings.push(`CONVEX_DEPLOYMENT should typically be available to both Next.js and Convex`);
        }
    });
    
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(error => console.log(`   • ${error}`));
        console.log('\n🛑 Please fix the above errors before proceeding');
        process.exit(1);
    }
    
    if (warnings.length === 0 && errors.length === 0) {
        console.log('✅ All environment variables validated successfully');
    }
}

/**
 * Validates deployment target for safety
 */
function validateDeployment(deployment) {
    console.log(`🎯 Target deployment: ${deployment}`);
    
    // Hard block on production
    if (deployment.includes('prod') || deployment.includes('production')) {
        console.error('🚨 SECURITY: Production deployments must be managed manually for security');
        console.error('   Use manual commands: bunx convex env set --prod VARIABLE value');
        process.exit(1);
    }
    
    // Warn on preview deployments
    if (deployment.includes('preview')) {
        console.warn('⚠️  Targeting preview deployment - ensure this is intentional');
    }
    
    return deployment;
}

/**
 * Executes a Convex command safely
 */
function execConvexCommand(command, cmdOptions = {}) {
    try {
        const result = execSync(command, {
            cwd: CONVEX_DIR,
            encoding: 'utf8',
            stdio: cmdOptions.silent ? 'pipe' : 'inherit',
            ...cmdOptions
        });
        return result;
    } catch (error) {
        if (!cmdOptions.allowFailure) {
            console.error(`❌ Convex command failed: ${command}`);
            console.error(error.message);
            process.exit(1);
        }
        return null;
    }
}

/**
 * Executes a Wrangler command safely
 */
function execWranglerCommand(command, cmdOptions = {}) {
    try {
        const result = execSync(command, {
            cwd: WORKER_DIR,
            encoding: 'utf8',
            stdio: cmdOptions.silent ? 'pipe' : 'inherit',
            ...cmdOptions
        });
        return result;
    } catch (error) {
        if (!cmdOptions.allowFailure) {
            console.error(`❌ Wrangler command failed: ${command}`);
            console.error(error.message);
            process.exit(1);
        }
        return null;
    }
}

/**
 * Backs up current Convex environment variables
 */
function backupConvexEnvironment(deployment) {
    console.log('💾 Creating automatic backup of current environment...');
    
    try {
        const envList = execConvexCommand('bunx convex env list', { silent: true });
        
        if (!envList) {
            console.warn('⚠️  No environment variables found to backup');
            return false;
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Ensure backup directory exists
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        
        const timestampedBackupFile = path.join(BACKUP_DIR, `${PROJECT_NAME}.env.backup.${timestamp}`);
        
        const backupContent = [
            '# =============================================================================',
            '# Convex Environment Backup',
            '# =============================================================================',
            `# Created: ${new Date().toISOString()}`,
            `# Deployment: ${deployment}`,
            `# Source: bunx convex env list`,
            '# =============================================================================',
            '',
            envList.trim(),
            ''
        ].join('\n');
        
        // Save timestamped backup
        fs.writeFileSync(timestampedBackupFile, backupContent);
        // Also save to generic backup file for easy access
        fs.writeFileSync(BACKUP_FILE, backupContent);
        
        console.log(`✅ Environment backup saved to: ${timestampedBackupFile}`);
        console.log(`   (Also available as: ${BACKUP_FILE})`);
        
        // Show existing backups for developer awareness
        showExistingBackups();
        
        return true;
    } catch (error) {
        console.warn('⚠️  Failed to create backup:', error.message);
        return false;
    }
}

/**
 * Shows existing backup files for developer awareness
 */
function showExistingBackups() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return;
        }
        
        const backupPattern = new RegExp(`^${PROJECT_NAME}\\.env\\.backup\\..+$`);
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => backupPattern.test(file))
            .map(file => ({
                name: file,
                path: path.join(BACKUP_DIR, file),
                stat: fs.statSync(path.join(BACKUP_DIR, file))
            }))
            .sort((a, b) => b.stat.mtime - a.stat.mtime);
        
        if (files.length > 1) { // More than just the current one
            console.log(`📚 You have ${files.length} backup files:`);
            files.slice(0, 3).forEach((file, index) => { // Show first 3
                const age = new Date() - file.stat.mtime;
                const ageStr = age < 60000 ? 'just now' : 
                              age < 3600000 ? `${Math.floor(age/60000)}m ago` :
                              age < 86400000 ? `${Math.floor(age/3600000)}h ago` :
                              `${Math.floor(age/86400000)}d ago`;
                console.log(`   ${index === 0 ? '📄' : '📃'} ${file.name} (${ageStr})`);
            });
            if (files.length > 3) {
                console.log(`   ... and ${files.length - 3} more`);
            }
            console.log(`💡 To clean up old backups: rm ~/.env-configs/backups/${PROJECT_NAME}/${PROJECT_NAME}.env.backup.*`);
        }
    } catch (error) {
        // Silently ignore backup listing errors
    }
}

/**
 * Gets current Convex environment variables
 */
function getCurrentConvexEnvironment(deployment) {
    try {
        const envList = execConvexCommand('bunx convex env list', { silent: true });
        if (!envList) return {};
        
        const currentEnv = {};
        envList.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                currentEnv[match[1]] = match[2];
            }
        });
        
        return currentEnv;
    } catch (error) {
        console.warn('⚠️  Failed to get current environment:', error.message);
        return {};
    }
}

/**
 * Calculates the difference between source and current environment
 */
function getConvexEnvironmentDiff(envVars, deployment) {
    console.log('🔍 Calculating environment differences...');
    
    const sourceVars = envVars.filter(envVar => envVar.convex);
    const currentEnv = getCurrentConvexEnvironment(deployment);
    
    const diff = {
        toAdd: [],
        toUpdate: [],
        toRemove: [],
        unchanged: []
    };
    
    // Check what needs to be added or updated
    sourceVars.forEach(envVar => {
        if (!(envVar.key in currentEnv)) {
            diff.toAdd.push(envVar);
        } else if (currentEnv[envVar.key] !== envVar.value) {
            diff.toUpdate.push({
                ...envVar,
                oldValue: currentEnv[envVar.key],
                newValue: envVar.value
            });
        } else {
            diff.unchanged.push(envVar);
        }
    });
    
    // Check what needs to be removed (variables in current but not in source)
    const sourceKeys = new Set(sourceVars.map(v => v.key));
    Object.keys(currentEnv).forEach(key => {
        if (!sourceKeys.has(key)) {
            diff.toRemove.push({ key, value: currentEnv[key] });
        }
    });
    
    return diff;
}

/**
 * Displays the environment diff in a readable format
 */
function displayEnvironmentDiff(diff) {
    const hasChanges = diff.toAdd.length > 0 || diff.toUpdate.length > 0 || diff.toRemove.length > 0;
    
    if (!hasChanges) {
        console.log('✅ No changes needed - environment is already in sync');
        return false;
    }
    
    console.log('\n📋 Environment Changes Summary:');
    console.log('=' .repeat(50));
    
    if (diff.toAdd.length > 0) {
        console.log(`\n➕ Variables to ADD (${diff.toAdd.length}):`);
        diff.toAdd.forEach(envVar => {
            const valuePreview = envVar.value.length > 50 
                ? envVar.value.substring(0, 47) + '...' 
                : envVar.value;
            console.log(`   • ${envVar.key} = ${valuePreview}`);
        });
    }
    
    if (diff.toUpdate.length > 0) {
        console.log(`\n🔄 Variables to UPDATE (${diff.toUpdate.length}):`);
        diff.toUpdate.forEach(envVar => {
            const oldPreview = envVar.oldValue.length > 30 
                ? envVar.oldValue.substring(0, 27) + '...' 
                : envVar.oldValue;
            const newPreview = envVar.newValue.length > 30 
                ? envVar.newValue.substring(0, 27) + '...' 
                : envVar.newValue;
            console.log(`   • ${envVar.key}`);
            console.log(`     OLD: ${oldPreview}`);
            console.log(`     NEW: ${newPreview}`);
        });
    }
    
    if (diff.toRemove.length > 0) {
        console.log(`\n➖ Variables to REMOVE (${diff.toRemove.length}):`);
        diff.toRemove.forEach(envVar => {
            console.log(`   • ${envVar.key}`);
        });
    }
    
    if (diff.unchanged.length > 0) {
        console.log(`\n✓ Variables unchanged: ${diff.unchanged.length}`);
        if (options.verbose) {
            diff.unchanged.forEach(envVar => {
                console.log(`   • ${envVar.key}`);
            });
        }
    }
    
    console.log('\n' + '='.repeat(50));
    return true;
}

/**
 * Applies environment changes to Convex deployment
 */
function applyConvexEnvironmentChanges(diff, deployment) {
    console.log('🔧 Applying environment changes to Convex deployment...');
    
    let successCount = 0;
    let failureCount = 0;
    
    // Add new variables
    diff.toAdd.forEach(envVar => {
        try {
            console.log(`➕ Adding: ${envVar.key}`);
            execConvexCommand(`bunx convex env set ${envVar.key} -- "${envVar.value}"`, { silent: !options.verbose });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to add ${envVar.key}:`, error.message);
            failureCount++;
        }
    });
    
    // Update existing variables
    diff.toUpdate.forEach(envVar => {
        try {
            console.log(`🔄 Updating: ${envVar.key}`);
            execConvexCommand(`bunx convex env set ${envVar.key} -- "${envVar.newValue}"`, { silent: !options.verbose });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to update ${envVar.key}:`, error.message);
            failureCount++;
        }
    });
    
    // Remove variables (with confirmation)
    diff.toRemove.forEach(envVar => {
        try {
            console.log(`➖ Removing: ${envVar.key}`);
            execConvexCommand(`bunx convex env remove ${envVar.key}`, { silent: !options.verbose });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to remove ${envVar.key}:`, error.message);
            failureCount++;
        }
    });
    
    // Summary
    console.log(`\n📊 Sync Results:`);
    console.log(`   ✅ Successful operations: ${successCount}`);
    if (failureCount > 0) {
        console.log(`   ❌ Failed operations: ${failureCount}`);
    }
    
    return { successCount, failureCount };
}

/**
 * Syncs Convex environment variables with source file
 */
function syncConvexDeploymentEnv(envVars, deployment) {
    console.log('🔗 Syncing Convex deployment environment...');
    
    // Validate deployment target
    validateDeployment(deployment);
    
    // Create automatic backup
    backupConvexEnvironment(deployment);
    
    // Calculate differences
    const diff = getConvexEnvironmentDiff(envVars, deployment);
    
    // Display changes
    const hasChanges = displayEnvironmentDiff(diff);
    
    if (!hasChanges) {
        console.log('🎉 Environment is already synchronized!');
        return 0;
    }
    
    // Dry run mode - just show what would happen
    if (options.dryRun) {
        console.log('\n🔍 DRY RUN MODE - No changes will be applied');
        console.log('   Run without --dry-run to apply these changes');
        return 0;
    }
    
    // Apply changes
    const results = applyConvexEnvironmentChanges(diff, deployment);
    
    // Verify changes were applied
    if (results.failureCount === 0) {
        console.log('\n✅ All environment variables synchronized successfully!');
        
        // Double-check by comparing again
        const finalDiff = getConvexEnvironmentDiff(envVars, deployment);
        const finalChanges = finalDiff.toAdd.length + finalDiff.toUpdate.length + finalDiff.toRemove.length;
        
        if (finalChanges > 0) {
            console.warn('⚠️  Warning: Some changes may not have been applied correctly');
            console.warn('   Run the sync command again or check manually with: bunx convex env list');
        }
    } else {
        console.error(`\n❌ Sync completed with ${results.failureCount} failures`);
        console.error('   Check the errors above and run the sync command again');
        return 1;
    }
    
    return results.failureCount;
}

/**
 * Gets current Worker secrets (limited - wrangler doesn't expose secret values)
 */
function getCurrentWorkerSecrets() {
    try {
        const secretList = execWranglerCommand('wrangler secret list', { silent: true, allowFailure: true });
        if (!secretList) return [];
        
        // Parse the secret names (values are not exposed)
        const secrets = [];
        secretList.split('\n').forEach(line => {
            const match = line.match(/^([A-Z_][A-Z0-9_]*)/);
            if (match) {
                secrets.push(match[1]);
            }
        });
        
        return secrets;
    } catch (error) {
        console.warn('⚠️  Failed to get current Worker secrets:', error.message);
        return [];
    }
}

/**
 * Syncs Worker secrets with wrangler secret put commands
 */
function syncWorkerSecrets(envVars, deployment) {
    console.log('🔗 Syncing Worker secrets...');
    
    // Validate deployment target
    validateDeployment(deployment);
    
    const workerVars = envVars.filter(envVar => envVar.logWorker);
    
    if (workerVars.length === 0) {
        console.log('ℹ️  No Worker secrets to sync');
        return 0;
    }
    
    console.log(`📋 Worker Secrets to Sync (${workerVars.length}):`);
    workerVars.forEach(envVar => {
        const valuePreview = envVar.value.length > 50 
            ? envVar.value.substring(0, 47) + '...' 
            : envVar.value;
        console.log(`   • ${envVar.key} = ${valuePreview}`);
    });
    
    // Get current secrets
    const currentSecrets = getCurrentWorkerSecrets();
    console.log(`ℹ️  Current Worker has ${currentSecrets.length} secrets configured`);
    
    // Dry run mode - just show what would happen
    if (options.dryRun) {
        console.log('\n🔍 DRY RUN MODE - No secrets will be updated');
        console.log('   Run without --dry-run to apply these changes');
        return 0;
    }
    
    let successCount = 0;
    let failureCount = 0;
    
    // Set each secret
    workerVars.forEach(envVar => {
        try {
            console.log(`🔐 Setting Worker secret: ${envVar.key}`);
            // Use echo to pipe the value to avoid exposing it in process list
            execWranglerCommand(`echo "${envVar.value}" | wrangler secret put ${envVar.key}`, { silent: !options.verbose });
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to set Worker secret ${envVar.key}:`, error.message);
            failureCount++;
        }
    });
    
    // Summary
    console.log(`\n📊 Worker Secrets Sync Results:`);
    console.log(`   ✅ Successful operations: ${successCount}`);
    if (failureCount > 0) {
        console.log(`   ❌ Failed operations: ${failureCount}`);
    }
    
    return failureCount;
}

/**
 * Main execution function
 */
function main() {
    console.log('🚀 Starting advanced environment sync...');
    console.log('=' .repeat(60));

    // Show command line options
    if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - No changes will be applied to deployments');
    }
    console.log(`🎯 Mode: ${options.mode}`);
    console.log('');

    try {
        if (options.mode === 'local') {
            // LOCAL MODE: Generate local .env files with dev values only
            console.log('📁 LOCAL MODE: Generating local development environment files...');
            console.log('   (Local files always use development values for localhost)');
            console.log('');

            const envVars = parseSourceFile('dev');
            validateEnvironmentVariables(envVars);

            const nextjsCount = generateNextjsEnv(envVars);
            const convexCount = generateConvexEnv(envVars);
            const workerCount = generateWorkerEnv(envVars);

            console.log('\n' + '='.repeat(60));
            console.log('✅ Local environment files generated successfully!');
            console.log('');
            console.log('📊 Summary:');
            console.log(`   • Total variables processed: ${envVars.length}`);
            console.log(`   • Next.js variables: ${nextjsCount}`);
            console.log(`   • Convex local variables: ${convexCount}`);
            console.log(`   • Worker local variables: ${workerCount}`);
            console.log('');
            console.log('📁 Files generated (development values):');
            console.log(`   • ${WEB_ENV_FILE}`);
            if (convexCount > 0) {
                console.log(`   • ${CONVEX_ENV_FILE}`);
            }
            if (workerCount > 0) {
                console.log(`   • ${WORKER_ENV_FILE}`);
            }

        } else {
            // DEPLOYMENT MODE: Deploy to cloud platforms
            const targetEnv = options.mode === 'deploy-prod' ? 'production' : 'dev';
            console.log(`🚀 DEPLOYMENT MODE: Deploying to ${targetEnv} environment...`);
            console.log('   (Local files are not modified in deployment mode)');
            console.log('');

            const envVars = parseSourceFile(targetEnv);
            validateEnvironmentVariables(envVars);

            // Deploy to Convex
            console.log('\n' + '='.repeat(60));
            const deploymentResult = syncConvexDeploymentEnv(envVars, options.deployment);

            // Deploy to Worker
            console.log('\n' + '='.repeat(60));
            const workerResult = syncWorkerSecrets(envVars, options.deployment);

            console.log('\n' + '='.repeat(60));
            console.log(`✅ ${targetEnv.toUpperCase()} deployment completed!`);
            console.log('');
            console.log('📊 Summary:');
            console.log(`   • Total variables processed: ${envVars.length}`);
            console.log(`   • Convex deployment sync: ${deploymentResult === 0 ? 'Success' : 'Failed'}`);
            console.log(`   • Worker secrets sync: ${workerResult === 0 ? 'Success' : 'Failed'}`);

            // Exit with appropriate code
            const finalResult = Math.max(deploymentResult, workerResult);
            process.exit(finalResult);
        }

        console.log('');
        console.log('🔒 Security reminders:');
        console.log('   • Never commit .env.local files to version control');
        console.log('   • Local files always contain development values');
        console.log('   • Production values are deployed directly to cloud platforms');
        console.log('   • Use NEXT_PUBLIC_ prefix only for non-sensitive data');
        console.log('   • Keep .env.source-of-truth.local secure and update as needed');

    } catch (error) {
        console.error('❌ Environment sync failed:', error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateConvexEnv, generateNextjsEnv, generateWorkerEnv, parseSourceFile, validateEnvironmentVariables };
