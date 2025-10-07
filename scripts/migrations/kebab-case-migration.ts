#!/usr/bin/env ts-node
/**
 * File Naming Migration Script: PascalCase → kebab-case
 *
 * Migrates React component files from PascalCase to kebab-case naming while:
 * - Updating all import statements automatically
 * - Handling barrel exports (export * from)
 * - Preserving git history with git mv
 * - Detecting naming conflicts
 * - Comprehensive logging and dry-run mode
 *
 * Usage:
 *   bun run scripts/migrations/kebab-case-migration.ts <directory> [--dry-run]
 *
 * Examples:
 *   bun run scripts/migrations/kebab-case-migration.ts apps/web/components --dry-run
 *   bun run scripts/migrations/kebab-case-migration.ts apps/web/components
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface FileRename {
  oldPath: string;
  newPath: string;
  oldName: string;
  newName: string;
}

interface MigrationResult {
  renames: FileRename[];
  conflicts: string[];
  importsToUpdate: string[];
}

// Convert PascalCase to kebab-case
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Check if filename is PascalCase
function isPascalCase(filename: string): boolean {
  const nameWithoutExt = filename.replace(/\.(tsx?|jsx?)$/, '');
  // Must start with uppercase and contain at least one more uppercase letter
  return /^[A-Z][a-z]*[A-Z]/.test(nameWithoutExt);
}

// Check if file should be excluded
function shouldExclude(filePath: string): boolean {
  const filename = path.basename(filePath);
  const excludedNames = ['page.tsx', 'layout.tsx', 'error.tsx', 'loading.tsx', 'not-found.tsx', 'route.ts'];
  return excludedNames.includes(filename);
}

// Find all PascalCase component files
function findPascalCaseFiles(dir: string): string[] {
  const results: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .next, dist, etc.
        if (!['node_modules', '.next', 'dist', 'build', '_generated'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (['.tsx', '.ts'].includes(ext) && !entry.name.endsWith('.d.ts')) {
          if (isPascalCase(entry.name) && !shouldExclude(fullPath)) {
            results.push(fullPath);
          }
        }
      }
    }
  }

  traverse(dir);
  return results;
}

// Generate rename mapping
function generateRenameMappings(files: string[]): FileRename[] {
  return files.map(oldPath => {
    const dir = path.dirname(oldPath);
    const oldName = path.basename(oldPath);
    const ext = path.extname(oldName);
    const nameWithoutExt = oldName.replace(ext, '');
    const newName = toKebabCase(nameWithoutExt) + ext;
    const newPath = path.join(dir, newName);

    return { oldPath, newPath, oldName, newName };
  });
}

// Check for conflicts (file already exists)
function checkConflicts(renames: FileRename[]): string[] {
  const conflicts: string[] = [];

  for (const rename of renames) {
    if (fs.existsSync(rename.newPath)) {
      conflicts.push(`Conflict: ${rename.newPath} already exists`);
    }
  }

  return conflicts;
}

// Find all files that might have imports to these renamed files
function findFilesWithImports(baseDir: string): string[] {
  const results: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (!['node_modules', '.next', 'dist', 'build', '_generated'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (['.tsx', '.ts', '.jsx', '.js'].includes(ext) && !entry.name.endsWith('.d.ts')) {
          results.push(fullPath);
        }
      }
    }
  }

  traverse(baseDir);
  return results;
}

// Update imports in a file
function updateImportsInFile(filePath: string, renames: FileRename[], dryRun: boolean): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changeCount = 0;

  for (const rename of renames) {
    // Get the old name without extension for import matching
    const oldNameNoExt = rename.oldName.replace(/\.(tsx?|jsx?)$/, '');
    const newNameNoExt = rename.newName.replace(/\.(tsx?|jsx?)$/, '');

    // Pattern 1: import { X } from './OldName'
    // Pattern 2: import { X } from '../path/to/OldName'
    // Pattern 3: import { X } from '@/path/to/OldName'
    const patterns = [
      new RegExp(`(from\\s+['"](\\.\\.?\\/[^'"]*\\/)?)${oldNameNoExt}(['"])`, 'g'),
      new RegExp(`(from\\s+['"]@\\/[^'"]*\\/)${oldNameNoExt}(['"])`, 'g'),
      // Barrel exports: export * from './OldName'
      new RegExp(`(export\\s+\\*\\s+from\\s+['"](\\.\\.?\\/[^'"]*\\/)?)${oldNameNoExt}(['"])`, 'g'),
    ];

    for (const pattern of patterns) {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, `$1${newNameNoExt}$2`);
        changeCount += matches.length;
      }
    }
  }

  if (changeCount > 0 && !dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return changeCount;
}

// Execute git mv for a rename
function executeGitMv(rename: FileRename, dryRun: boolean): void {
  if (dryRun) {
    console.log(`  [DRY-RUN] git mv "${rename.oldPath}" "${rename.newPath}"`);
  } else {
    try {
      execSync(`git mv "${rename.oldPath}" "${rename.newPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`  ❌ Failed to git mv: ${error}`);
      throw error;
    }
  }
}

// Main migration function
function migrateFiles(targetDir: string, dryRun: boolean = false): MigrationResult {
  console.log(`\n🔍 Scanning for PascalCase files in: ${targetDir}\n`);

  // Find all PascalCase files
  const pascalCaseFiles = findPascalCaseFiles(targetDir);
  console.log(`Found ${pascalCaseFiles.length} PascalCase files to rename\n`);

  if (pascalCaseFiles.length === 0) {
    console.log('✅ No files to migrate\n');
    return { renames: [], conflicts: [], importsToUpdate: [] };
  }

  // Generate rename mappings
  const renames = generateRenameMappings(pascalCaseFiles);

  // Check for conflicts
  const conflicts = checkConflicts(renames);
  if (conflicts.length > 0) {
    console.error('❌ CONFLICTS DETECTED:\n');
    conflicts.forEach(c => console.error(`  ${c}`));
    console.error('\nAborting migration due to conflicts\n');
    throw new Error('Naming conflicts detected');
  }

  // Display rename plan
  console.log('📋 RENAME PLAN:\n');
  renames.forEach((r, i) => {
    console.log(`${i + 1}. ${r.oldName} → ${r.newName}`);
    console.log(`   ${r.oldPath}`);
  });
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY-RUN MODE - No changes will be made\n');
  }

  // Execute renames
  console.log('📝 Renaming files with git mv...\n');
  for (const rename of renames) {
    executeGitMv(rename, dryRun);
  }

  // Find all files that might need import updates
  console.log('🔍 Finding files with imports to update...\n');
  const baseDir = targetDir.includes('components') ? 'apps/web' : targetDir;
  const filesToCheck = findFilesWithImports(baseDir);
  console.log(`Checking ${filesToCheck.length} files for import updates\n`);

  // Update imports
  console.log('📝 Updating import statements...\n');
  let totalImportsUpdated = 0;
  const filesUpdated: string[] = [];

  for (const file of filesToCheck) {
    const updateCount = updateImportsInFile(file, renames, dryRun);
    if (updateCount > 0) {
      totalImportsUpdated += updateCount;
      filesUpdated.push(file);
      console.log(`  ✓ ${file} (${updateCount} imports updated)`);
    }
  }

  console.log(`\n✅ Updated ${totalImportsUpdated} imports across ${filesUpdated.length} files\n`);

  return {
    renames,
    conflicts,
    importsToUpdate: filesUpdated,
  };
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: bun run scripts/migrations/kebab-case-migration.ts <directory> [--dry-run]');
    console.error('');
    console.error('Examples:');
    console.error('  bun run scripts/migrations/kebab-case-migration.ts apps/web/components --dry-run');
    console.error('  bun run scripts/migrations/kebab-case-migration.ts apps/web/components');
    process.exit(1);
  }

  const targetDir = args[0];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory not found: ${targetDir}`);
    process.exit(1);
  }

  try {
    const result = migrateFiles(targetDir, dryRun);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Files renamed: ${result.renames.length}`);
    console.log(`Imports updated: ${result.importsToUpdate.length} files`);
    console.log(`Conflicts: ${result.conflicts.length}`);
    console.log(`Mode: ${dryRun ? 'DRY-RUN (no changes made)' : 'EXECUTED'}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (dryRun) {
      console.log('ℹ️  Run without --dry-run to execute the migration\n');
    } else {
      console.log('✅ Migration complete! Run validation:');
      console.log('   bun run typecheck');
      console.log('   bun run lint');
      console.log('   bun test\n');
    }
  } catch (error) {
    console.error(`\n❌ Migration failed: ${error}`);
    process.exit(1);
  }
}

export { migrateFiles, toKebabCase, isPascalCase };
