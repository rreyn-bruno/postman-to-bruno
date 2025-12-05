#!/usr/bin/env node

/**
 * Postman to Bruno Batch Converter
 * Process multiple Postman collections at once
 */

const fs = require('fs');
const path = require('path');
const { postmanToBruno } = require('../src/index');
const { writeCollection } = require('../src/generators/file-writer');

const VERSION = '1.0.0';

function printUsage() {
  console.log(`
Postman to Bruno Batch Converter v${VERSION}
=============================================

Usage:
  postman-to-bruno-batch <input-dir> <output-dir> [options]

Arguments:
  input-dir     Directory containing Postman collection JSON files
  output-dir    Output directory for Bruno collections

Options:
  -v, --verbose    Show detailed output
  -h, --help       Show this help message
  --version        Show version number
  --continue       Continue on error (skip failed collections)

Examples:
  postman-to-bruno-batch ./postman-exports ./bruno-collections
  postman-to-bruno-batch ./postman-exports ./bruno-collections --verbose
  postman-to-bruno-batch ./postman-exports ./bruno-collections --continue
`);
}

function findJsonFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    } else if (entry.isDirectory()) {
      files.push(...findJsonFiles(fullPath));
    }
  }
  
  return files;
}

function main() {
  const args = process.argv.slice(2);
  
  const options = {
    verbose: args.includes('-v') || args.includes('--verbose'),
    help: args.includes('-h') || args.includes('--help'),
    version: args.includes('--version'),
    continueOnError: args.includes('--continue')
  };

  const positionalArgs = args.filter(a => !a.startsWith('-'));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (options.version) {
    console.log(`v${VERSION}`);
    process.exit(0);
  }

  if (positionalArgs.length < 2) {
    console.error('Error: Missing required arguments');
    printUsage();
    process.exit(1);
  }

  const inputDir = positionalArgs[0];
  const outputDir = positionalArgs[1];

  if (!fs.existsSync(inputDir)) {
    console.error(`Error: Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  console.log(`\n🔍 Scanning: ${inputDir}`);
  const jsonFiles = findJsonFiles(inputDir);
  console.log(`   Found ${jsonFiles.length} JSON files\n`);

  if (jsonFiles.length === 0) {
    console.log('No JSON files found.');
    process.exit(0);
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const file of jsonFiles) {
    const relativePath = path.relative(inputDir, file);
    
    try {
      const rawData = fs.readFileSync(file, 'utf8');
      const collection = JSON.parse(rawData);

      // Skip non-Postman files
      if (!collection.info || !collection.info.schema) {
        if (options.verbose) {
          console.log(`⏭️  Skipping (not a Postman collection): ${relativePath}`);
        }
        continue;
      }

      const collectionName = (collection.info.name || 'Untitled')
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      console.log(`🔄 Converting: ${collectionName}`);

      const brunoCollection = postmanToBruno(collection);
      const collectionOutputDir = path.join(outputDir, collectionName);
      
      writeCollection(brunoCollection, collectionOutputDir, { verbose: options.verbose });
      
      console.log(`   ✅ Success: ${collectionOutputDir}\n`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
      errors.push({ file: relativePath, error: err.message });
      errorCount++;
      
      if (!options.continueOnError) {
        console.error('\nAborting batch process. Use --continue to skip errors.');
        process.exit(1);
      }
    }
  }

  console.log('\n========== Summary ==========');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\nFailed files:');
    errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }
}

main();

