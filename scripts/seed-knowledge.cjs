#!/usr/bin/env node

/**
 * Knowledge seeding script to process project documents and source code
 * Implements AC 5: Process documents in /docs and key source code files
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');

// File patterns to include
const INCLUDE_PATTERNS = [
  /\.md$/,           // Markdown files
  /\.ts$/,           // TypeScript files
  /\.tsx$/,          // TypeScript React files
  /\.js$/,           // JavaScript files
  /\.jsx$/,          // JavaScript React files
  /\.json$/,         // JSON configuration files (selective)
];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.turbo',
  '.convex',
  'build',
  'dist',
  'out',
  'coverage',
  'storybook-static',
  '.git',
];

// Files to exclude
const EXCLUDE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  '.DS_Store',
  'Thumbs.db',
];

/**
 * Get file type from extension
 */
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    '.md': 'markdown',
    '.ts': 'typescript',
    '.tsx': 'typescript-react',
    '.js': 'javascript',
    '.jsx': 'javascript-react',
    '.json': 'json',
  };
  return typeMap[ext] || 'unknown';
}

/**
 * Check if file should be included
 */
function shouldIncludeFile(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  // Skip excluded files
  if (EXCLUDE_FILES.includes(fileName)) {
    return false;
  }

  // Skip files in excluded directories
  if (EXCLUDE_DIRS.some(dir => relativePath.includes(dir))) {
    return false;
  }

  // Check if file matches include patterns
  return INCLUDE_PATTERNS.some(pattern => pattern.test(fileName));
}

/**
 * Check if file is too large (skip binary or very large files)
 */
function isFileTooLarge(filePath, maxSizeBytes = 1024 * 1024) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size > maxSizeBytes;
  } catch (error) {
    console.warn(`Warning: Could not get file stats for ${filePath}`);
    return true; // Skip if we can't read stats
  }
}

/**
 * Recursively find files to process
 */
function findFilesToProcess(dirPath) {
  const files = [];

  function walkDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(PROJECT_ROOT, fullPath);

        if (entry.isDirectory()) {
          // Skip excluded directories
          if (!EXCLUDE_DIRS.includes(entry.name)) {
            walkDir(fullPath);
          }
        } else if (entry.isFile()) {
          if (shouldIncludeFile(fullPath) && !isFileTooLarge(fullPath)) {
            const stats = fs.statSync(fullPath);
            files.push({
              filePath: fullPath,
              relativePath,
              fileType: getFileType(fullPath),
              size: stats.size,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${currentPath}:`, error.message);
    }
  }

  walkDir(dirPath);
  return files;
}

/**
 * Read file content with error handling
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Generate SHA-256 hash of content for change detection
 */
function generateContentHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Check if document needs processing based on content hash
 */
async function needsProcessing(client, filePath, contentHash) {
  try {
    // Query existing document by file path
    const existingDoc = await client.query('knowledgeMutations:getDocumentByPath', { filePath });
    
    if (!existingDoc) {
      return { needsProcessing: true, reason: 'new_file' };
    }
    
    if (existingDoc.content_hash !== contentHash) {
      return { needsProcessing: true, reason: 'content_changed' };
    }
    
    return { needsProcessing: false, reason: 'unchanged', documentId: existingDoc._id };
  } catch (error) {
    // If query fails, assume we need to process
    console.warn(`Warning: Could not check existing document for ${filePath}:`, error.message);
    return { needsProcessing: true, reason: 'check_failed' };
  }
}

/**
 * Process a single file with hash-based change detection
 */
async function processFile(client, file, stats) {
  try {
    console.log(`Checking: ${file.relativePath} (${file.size} bytes)`);

    const content = readFileContent(file.filePath);
    if (!content) {
      stats.skippedFiles++;
      return;
    }

    // Skip very small files (likely not useful)
    if (content.trim().length < 50) {
      console.log(`  Skipping (too small): ${file.relativePath}`);
      stats.skippedFiles++;
      return;
    }

    // Generate content hash for change detection
    const contentHash = generateContentHash(content);
    
    // Check if processing is needed
    const processingCheck = await needsProcessing(client, file.relativePath, contentHash);
    
    if (!processingCheck.needsProcessing) {
      console.log(`  ⏭️  Skipping (${processingCheck.reason}): ${file.relativePath}`);
      stats.skippedFiles++;
      return;
    }

    console.log(`  🔄 Processing (${processingCheck.reason}): ${file.relativePath}`);

    // Process document with knowledge ingestion action
    const result = await client.action('knowledgeActions:addDocument', {
      content,
      source: file.relativePath,
      metadata: {
        file_path: file.relativePath,
        file_type: file.fileType,
        modified_at: Date.now(),
      },
    });

    console.log(`  ✅ ${result.status}: ${result.chunksCreated} chunks created`);
    stats.processedFiles++;
    stats.totalChunks += result.chunksCreated;

  } catch (error) {
    console.error(`  ❌ Error processing ${file.relativePath}:`, error.message);
    stats.errorFiles++;
  }
}

/**
 * Display processing statistics
 */
function displayStats(stats) {
  console.log('\\n📊 Processing Statistics:');
  console.log('─'.repeat(40));
  console.log(`Total files found:     ${stats.totalFiles}`);
  console.log(`Successfully processed: ${stats.processedFiles}`);
  console.log(`Skipped files:         ${stats.skippedFiles} (including unchanged)`);
  console.log(`Error files:           ${stats.errorFiles}`);
  console.log(`Total chunks created:  ${stats.totalChunks}`);
  console.log(`Processing time:       ${(stats.processingTime / 1000).toFixed(2)}s`);
  
  const successRate = stats.totalFiles > 0 ? (stats.processedFiles / stats.totalFiles * 100).toFixed(1) : '0';
  const skipRate = stats.totalFiles > 0 ? (stats.skippedFiles / stats.totalFiles * 100).toFixed(1) : '0';
  console.log(`Success rate:          ${successRate}%`);
  console.log(`Skip rate (efficiency): ${skipRate}%`);
  
  if (stats.processedFiles > 0) {
    const avgChunksPerFile = (stats.totalChunks / stats.processedFiles).toFixed(1);
    console.log(`Avg chunks per file:   ${avgChunksPerFile}`);
  }
}

/**
 * Main seeding function
 */
async function seedKnowledge() {
  const { ConvexHttpClient } = await import('convex/browser');
  
  console.log('🌱 Knowledge Seeding Script');
  console.log('═'.repeat(40));

  // Validate environment
  const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!CONVEX_URL) {
    console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL environment variable is required');
    process.exit(1);
  }

  const startTime = Date.now();
  const stats = {
    totalFiles: 0,
    processedFiles: 0,
    skippedFiles: 0,
    errorFiles: 0,
    totalChunks: 0,
    processingTime: 0,
  };

  try {
    // Initialize Convex client
    const client = new ConvexHttpClient(CONVEX_URL);

    // Find files to process
    console.log('🔍 Scanning for files to process...');
    
    const docsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'docs'));
    const appsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'apps'));
    const packagesFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'packages'));
    
    const allFiles = [...docsFiles, ...appsFiles, ...packagesFiles];
    stats.totalFiles = allFiles.length;

    console.log(`Found ${stats.totalFiles} files to process`);
    console.log(`  Documentation: ${docsFiles.length} files`);
    console.log(`  Applications: ${appsFiles.length} files`);
    console.log(`  Packages: ${packagesFiles.length} files`);

    if (stats.totalFiles === 0) {
      console.log('No files found to process.');
      return;
    }

    // Process files with progress tracking
    console.log('\\n📄 Processing files:');
    console.log('─'.repeat(40));

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      const progress = `[${i + 1}/${allFiles.length}]`;
      
      console.log(`${progress} Processing: ${file.relativePath}`);
      await processFile(client, file, stats);

      // Small delay to avoid overwhelming the API
      if (i < allFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    stats.processingTime = Date.now() - startTime;
    displayStats(stats);

    if (stats.errorFiles > 0) {
      console.log('\\n⚠️  Some files had errors. Check the logs above for details.');
      process.exit(1);
    } else {
      console.log('\\n✅ Knowledge seeding completed successfully!');
    }

  } catch (error) {
    console.error('❌ Fatal error during knowledge seeding:', error.message);
    process.exit(1);
  }
}

/**
 * CLI argument parsing
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };
}

// Execute if run directly
if (require.main === module) {
  const { dryRun, verbose } = parseArgs();
  
  if (dryRun) {
    console.log('🔍 Dry run mode - listing files that would be processed:');
    const docsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'docs'));
    const appsFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'apps'));
    const packagesFiles = findFilesToProcess(path.join(PROJECT_ROOT, 'packages'));
    
    const allFiles = [...docsFiles, ...appsFiles, ...packagesFiles];
    
    console.log(`\\nFound ${allFiles.length} files:`);
    allFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.relativePath} (${file.fileType}, ${file.size} bytes)`);
    });
  } else {
    seedKnowledge().catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
  }
}

module.exports = {
  seedKnowledge,
  findFilesToProcess,
};