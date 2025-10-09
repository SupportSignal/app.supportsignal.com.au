#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';

/**
 * Import Path Cleanup Script
 * Converts relative imports to @/ path aliases
 *
 * Usage:
 *   bun run scripts/migrations/import-path-cleanup.ts <directory> [--dry-run]
 *
 * Examples:
 *   bun run scripts/migrations/import-path-cleanup.ts apps/web --dry-run
 *   bun run scripts/migrations/import-path-cleanup.ts apps/web
 */

interface ImportReplacement {
  file: string;
  oldImport: string;
  newImport: string;
  line: number;
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '_generated') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function convertRelativeToAlias(filePath: string, importPath: string): string | null {
  // Only convert imports that go up directories (../)
  if (!importPath.startsWith('.')) return null;

  // Calculate the absolute path of the import
  const fileDir = path.dirname(filePath);
  const absoluteImportPath = path.resolve(fileDir, importPath);

  // Find the apps/web root
  const webRoot = filePath.split('apps/web')[0] + 'apps/web';

  // Get relative path from web root
  let relativePath = path.relative(webRoot, absoluteImportPath);

  // Normalize path separators for cross-platform
  relativePath = relativePath.split(path.sep).join('/');

  // Only convert if it goes through common directories
  if (relativePath.match(/^(components|lib|types|hooks|convex|app)/)) {
    return `@/${relativePath}`;
  }

  return null;
}

function processFile(filePath: string, dryRun: boolean): ImportReplacement[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const replacements: ImportReplacement[] = [];
  let newContent = content;

  lines.forEach((line, index) => {
    // Match import statements with relative paths
    const importMatch = line.match(/from\s+['"](\.\.[^'"]+)['"]/);
    if (importMatch) {
      const oldImport = importMatch[1];
      const newImport = convertRelativeToAlias(filePath, oldImport);

      if (newImport) {
        replacements.push({
          file: filePath,
          oldImport,
          newImport,
          line: index + 1
        });

        newContent = newContent.replace(
          new RegExp(`from\\s+['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
          `from '${newImport}'`
        );
      }
    }
  });

  if (replacements.length > 0 && !dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return replacements;
}

// Main execution
const args = process.argv.slice(2);
const targetDir = args[0] || 'apps/web';
const dryRun = args.includes('--dry-run');

console.log(`🔍 Scanning for relative imports in: ${targetDir}\n`);

const files = getAllFiles(targetDir);
const allReplacements: ImportReplacement[] = [];

files.forEach(file => {
  const replacements = processFile(file, dryRun);
  allReplacements.push(...replacements);
});

// Group by file for reporting
const fileGroups = new Map<string, ImportReplacement[]>();
allReplacements.forEach(r => {
  if (!fileGroups.has(r.file)) {
    fileGroups.set(r.file, []);
  }
  fileGroups.get(r.file)!.push(r);
});

if (allReplacements.length === 0) {
  console.log('✅ No relative imports found that need conversion');
} else {
  if (dryRun) {
    console.log('🔍 DRY-RUN MODE - No changes will be made\n');
  }

  console.log('📝 Import path conversions:\n');

  let fileCount = 0;
  fileGroups.forEach((replacements, file) => {
    fileCount++;
    const shortPath = file.replace(process.cwd() + '/', '');
    console.log(`  ${fileCount}. ${shortPath} (${replacements.length} imports)`);

    // Show first few examples
    replacements.slice(0, 3).forEach(r => {
      console.log(`     ${r.oldImport} → ${r.newImport}`);
    });

    if (replacements.length > 3) {
      console.log(`     ... and ${replacements.length - 3} more`);
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 IMPORT CLEANUP SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Files updated: ${fileGroups.size}`);
  console.log(`Imports converted: ${allReplacements.length}`);
  console.log(`Mode: ${dryRun ? 'DRY-RUN (no changes made)' : 'EXECUTED'}`);
  console.log('═══════════════════════════════════════════════════════════');

  if (dryRun) {
    console.log('\nℹ️  Run without --dry-run to execute the conversion');
  } else {
    console.log('\n✅ Import path cleanup complete!');
    console.log('   Run validation: bun run typecheck && bun run lint');
  }
}
