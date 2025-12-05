#!/usr/bin/env node

/**
 * Postman to Bruno CLI
 * Standalone converter for enterprise-scale migrations
 */

const fs = require('fs');
const path = require('path');
const { postmanToBruno } = require('../src/index');
const { writeCollection } = require('../src/generators/file-writer');

const VERSION = '1.0.0';

function printUsage() {
  console.log(`
Postman to Bruno Converter v${VERSION}
=====================================

Usage:
  postman-to-bruno <input.json> [output-dir] [options]

Arguments:
  input.json    Path to Postman collection JSON file (v2.0 or v2.1)
  output-dir    Output directory (default: ./<collection-name>)

Options:
  -v, --verbose    Show detailed output
  -h, --help       Show this help message
  --version        Show version number

Examples:
  postman-to-bruno my-collection.json
  postman-to-bruno my-collection.json ./output
  postman-to-bruno my-collection.json ./output --verbose
`);
}

function main() {
  const args = process.argv.slice(2);
  
  // Parse options
  const options = {
    verbose: args.includes('-v') || args.includes('--verbose'),
    help: args.includes('-h') || args.includes('--help'),
    version: args.includes('--version')
  };

  // Filter out option flags
  const positionalArgs = args.filter(a => !a.startsWith('-'));

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  if (options.version) {
    console.log(`v${VERSION}`);
    process.exit(0);
  }

  if (positionalArgs.length < 1) {
    console.error('Error: Missing input file argument');
    printUsage();
    process.exit(1);
  }

  const inputFile = positionalArgs[0];

  // Check input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  // Read and parse Postman collection
  let postmanCollection;
  try {
    const rawData = fs.readFileSync(inputFile, 'utf8');
    postmanCollection = JSON.parse(rawData);
  } catch (err) {
    console.error(`Error: Failed to parse input file: ${err.message}`);
    process.exit(1);
  }

  // Validate Postman collection structure
  if (!postmanCollection.info || !postmanCollection.info.name) {
    console.error('Error: Invalid Postman collection - missing info.name');
    process.exit(1);
  }

  console.log(`\n🔄 Converting: ${postmanCollection.info.name}`);
  console.log(`   Schema: ${postmanCollection.info.schema || 'unknown'}`);

  // Determine output directory
  const collectionName = postmanCollection.info.name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  const outputDir = positionalArgs[1] || path.join(process.cwd(), collectionName);

  // Convert collection
  let brunoCollection;
  try {
    brunoCollection = postmanToBruno(postmanCollection);
  } catch (err) {
    console.error(`Error: Conversion failed: ${err.message}`);
    process.exit(1);
  }

  // Count items
  const countItems = (items) => {
    let count = { requests: 0, folders: 0 };
    for (const item of items || []) {
      if (item.type === 'folder') {
        count.folders++;
        const subCount = countItems(item.items);
        count.requests += subCount.requests;
        count.folders += subCount.folders;
      } else {
        count.requests++;
      }
    }
    return count;
  };

  const itemCounts = countItems(brunoCollection.items);
  console.log(`   Found: ${itemCounts.requests} requests, ${itemCounts.folders} folders\n`);

  // Write to file system
  try {
    console.log(`📁 Writing to: ${outputDir}\n`);
    writeCollection(brunoCollection, outputDir, options);
    console.log(`\n✅ Conversion complete!`);
    console.log(`   Output: ${outputDir}`);
  } catch (err) {
    console.error(`Error: Failed to write output: ${err.message}`);
    process.exit(1);
  }
}

main();

