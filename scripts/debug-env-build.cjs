#!/usr/bin/env node

/**
 * Environment Variable Debugging Script for Cloudflare Pages Build
 * 
 * This script shows all environment variables available during the build process
 * to help debug why NEXT_PUBLIC_* variables aren't being set correctly.
 */

console.log('🔍 Environment Variable Debug Report');
console.log('=====================================');
console.log(`Build Time: ${new Date().toISOString()}`);
console.log(`Node Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log('');

// Show Cloudflare-specific environment variables
console.log('📊 Cloudflare Pages Variables:');
console.log('-----------------------------');
const cfVars = [
  'CI',
  'CF_PAGES',
  'CF_PAGES_COMMIT_SHA',
  'CF_PAGES_BRANCH',
  'CF_PAGES_URL'
];

cfVars.forEach(key => {
  console.log(`${key}: ${process.env[key] || 'NOT SET'}`);
});
console.log('');

// Show NEXT_PUBLIC_* environment variables specifically
console.log('🔧 NEXT_PUBLIC_* Variables:');
console.log('---------------------------');
const nextPublicVars = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_CONVEX_URL', 
  'NEXT_PUBLIC_LOG_WORKER_URL'
];

nextPublicVars.forEach(key => {
  console.log(`${key}: ${process.env[key] || 'NOT SET'}`);
});
console.log('');

// Show all environment variables that start with NEXT_
console.log('⚙️  All NEXT_* Variables:');
console.log('------------------------');
Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_'))
  .sort()
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });
console.log('');

// Show other relevant variables
console.log('🌍 Other Relevant Variables:');
console.log('----------------------------');
const otherVars = [
  'NODE_ENV',
  'VERCEL',
  'VERCEL_ENV',
  'DEPLOYMENT_URL'
];

otherVars.forEach(key => {
  console.log(`${key}: ${process.env[key] || 'NOT SET'}`);
});
console.log('');

// Check for any .env files that might be present
console.log('📁 Environment File Check:');
console.log('--------------------------');
const fs = require('fs');
const path = require('path');

const envFiles = [
  '.env',
  '.env.local', 
  '.env.production',
  '.env.production.local',
  'apps/web/.env',
  'apps/web/.env.local',
  'apps/web/.env.production',
  'apps/web/.env.production.local'
];

envFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${file}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  if (exists) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').length;
      console.log(`  └─ ${lines} lines`);
    } catch (e) {
      console.log(`  └─ Error reading: ${e.message}`);
    }
  }
});
console.log('');

// Show a count of all environment variables
console.log('📈 Environment Summary:');
console.log('----------------------');
console.log(`Total environment variables: ${Object.keys(process.env).length}`);
console.log(`NEXT_PUBLIC_* variables: ${Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')).length}`);
console.log(`CF_* variables: ${Object.keys(process.env).filter(k => k.startsWith('CF_')).length}`);
console.log('');

console.log('🎯 Key Issues to Check:');
console.log('-----------------------');
console.log('1. Are NEXT_PUBLIC_* variables set in Cloudflare Pages dashboard?');
console.log('2. Are they set for Production environment (not just Preview)?');
console.log('3. Are any .env.local files overriding the dashboard values?');
console.log('4. Is the build happening in the correct directory context?');
console.log('');

console.log('✅ Environment debug complete!');