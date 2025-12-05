/**
 * File Writer Module
 * Writes Bruno collection structure to file system
 * Fully standalone - no external dependencies on @usebruno/filestore
 */

const fs = require('fs');
const path = require('path');
const jsonToBru = require('./json-to-bru');
const jsonToCollectionBru = require('./json-to-collection-bru');
const { sanitizeName, sanitizeDirectoryName } = require('../utils/common');

/**
 * Stringify a request object to .bru file content
 * @param {Object} requestObj - Bruno request object
 * @returns {string} - .bru file content
 */
function stringifyRequest(requestObj) {
  const bruJson = {
    meta: {
      name: requestObj.name,
      type: requestObj.type === 'graphql-request' ? 'graphql' : 'http',
      seq: requestObj.seq
    },
    http: {
      method: requestObj.request.method.toLowerCase(),
      url: requestObj.request.url,
      body: requestObj.request.body?.mode || 'none',
      auth: requestObj.request.auth?.mode || 'inherit'
    },
    params: requestObj.request.params || [],
    headers: requestObj.request.headers || [],
    body: requestObj.request.body || { mode: 'none' },
    auth: requestObj.request.auth || { mode: 'inherit' },
    script: requestObj.request.script || {},
    vars: requestObj.request.vars || {},
    assertions: requestObj.request.assertions || [],
    tests: requestObj.request.tests || '',
    docs: requestObj.request.docs || '',
    settings: requestObj.settings || {},
    examples: requestObj.examples || []
  };

  return jsonToBru(bruJson);
}

/**
 * Stringify a collection root to collection.bru content
 * @param {Object} collectionRoot - Collection root object
 * @returns {string} - collection.bru file content
 */
function stringifyCollection(collectionRoot) {
  return jsonToCollectionBru(collectionRoot, false);
}

/**
 * Stringify a folder root to folder.bru content
 * @param {Object} folderRoot - Folder root object
 * @returns {string} - folder.bru file content
 */
function stringifyFolder(folderRoot) {
  return jsonToCollectionBru(folderRoot, true);
}

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Recursively write collection items to file system
 * @param {Array} items - Array of collection items
 * @param {string} currentPath - Current directory path
 * @param {Object} options - Options (verbose, etc.)
 */
function writeItems(items, currentPath, options = {}) {
  if (!items || !Array.isArray(items)) return;

  for (const item of items) {
    try {
      if (item.type === 'http-request' || item.type === 'graphql-request') {
        // Write request file
        const filename = sanitizeName(`${item.name}.bru`);
        const filePath = path.join(currentPath, filename);
        const content = stringifyRequest(item);
        fs.writeFileSync(filePath, content, 'utf8');
        if (options.verbose) {
          console.log(`  ✓ Created request: ${filename}`);
        }
      } else if (item.type === 'folder') {
        // Create folder directory
        const folderName = sanitizeDirectoryName(item.name);
        const folderPath = path.join(currentPath, folderName);
        ensureDir(folderPath);
        if (options.verbose) {
          console.log(`  ✓ Created folder: ${folderName}/`);
        }

        // Write folder.bru if folder has root metadata
        if (item.root) {
          const folderBruPath = path.join(folderPath, 'folder.bru');
          const folderContent = stringifyFolder(item.root);
          fs.writeFileSync(folderBruPath, folderContent, 'utf8');
        }

        // Recursively write folder items
        if (item.items && item.items.length > 0) {
          writeItems(item.items, folderPath, options);
        }
      }
    } catch (error) {
      console.error(`  ✗ Error processing item "${item.name}":`, error.message);
    }
  }
}

/**
 * Write a Bruno collection to file system
 * @param {Object} brunoCollection - Bruno collection object
 * @param {string} outputDir - Output directory path
 * @param {Object} options - Options (verbose, etc.)
 */
function writeCollection(brunoCollection, outputDir, options = {}) {
  // Create output directory
  ensureDir(outputDir);

  // Write bruno.json
  const brunoConfig = {
    version: "1",
    name: brunoCollection.name,
    type: "collection",
    ignore: ["node_modules", ".git"]
  };
  fs.writeFileSync(
    path.join(outputDir, 'bruno.json'),
    JSON.stringify(brunoConfig, null, 2),
    'utf8'
  );
  if (options.verbose) {
    console.log('  ✓ Created bruno.json');
  }

  // Write collection.bru
  if (brunoCollection.root) {
    const collectionContent = stringifyCollection(brunoCollection.root);
    fs.writeFileSync(path.join(outputDir, 'collection.bru'), collectionContent, 'utf8');
    if (options.verbose) {
      console.log('  ✓ Created collection.bru');
    }
  }

  // Write items
  if (brunoCollection.items && brunoCollection.items.length > 0) {
    writeItems(brunoCollection.items, outputDir, options);
  }
}

module.exports = {
  stringifyRequest,
  stringifyCollection,
  stringifyFolder,
  writeItems,
  writeCollection,
  ensureDir
};

