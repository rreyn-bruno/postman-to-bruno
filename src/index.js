/**
 * Postman to Bruno Converter - Main Entry Point
 * Standalone solution for enterprise-scale Postman to Bruno migrations
 */

const _ = require('lodash');
const { uuid } = require('./utils/common');
const {
  transformDescription,
  importScriptsFromEvents,
  importCollectionLevelVariables,
  processAuth
} = require('./converters/postman-to-bruno');
const { importPostmanV2CollectionItem } = require('./converters/collection-converter');

/**
 * Parse and convert a Postman collection to Bruno format
 * @param {Object} collection - Postman collection object
 * @returns {Object} - Bruno collection object
 */
const parsePostmanCollection = (collection) => {
  const schema = _.get(collection, 'info.schema');
  
  const v2Schemas = [
    'https://schema.getpostman.com/json/collection/v2.0.0/collection.json',
    'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    'https://schema.postman.com/json/collection/v2.0.0/collection.json',
    'https://schema.postman.com/json/collection/v2.1.0/collection.json'
  ];

  if (!v2Schemas.includes(schema)) {
    throw new Error('Unsupported Postman schema version. Only Postman Collection v2.0 and v2.1 are supported.');
  }

  return importPostmanV2Collection(collection);
};

/**
 * Import a Postman v2.x collection
 * @param {Object} collection - Postman collection object
 * @returns {Object} - Bruno collection object
 */
const importPostmanV2Collection = (collection) => {
  const brunoCollection = {
    name: collection.info.name || 'Untitled Collection',
    uid: uuid(),
    version: '1',
    items: [],
    environments: [],
    root: {
      docs: transformDescription(collection.info.description),
      meta: {
        name: collection.info.name || 'Untitled Collection'
      },
      request: {
        auth: {
          mode: 'none',
          basic: null,
          bearer: null,
          awsv4: null,
          apikey: null,
          oauth2: null,
          digest: null
        },
        headers: [],
        script: {},
        tests: '',
        vars: {}
      }
    }
  };

  // Process collection-level events (scripts)
  if (collection.event) {
    importScriptsFromEvents(collection.event, brunoCollection.root.request);
  }

  // Process collection-level variables
  if (collection.variable) {
    importCollectionLevelVariables(collection.variable, brunoCollection.root.request);
  }

  // Process collection-level auth
  processAuth(collection.auth, brunoCollection.root.request, true);

  // Process all items (folders and requests)
  if (collection.item && collection.item.length) {
    importPostmanV2CollectionItem(brunoCollection, collection.item);
  }

  return brunoCollection;
};

/**
 * Main conversion function
 * @param {Object} postmanCollection - Postman collection JSON
 * @returns {Object} - Bruno collection object
 */
const postmanToBruno = (postmanCollection) => {
  try {
    const brunoCollection = parsePostmanCollection(postmanCollection);
    return brunoCollection;
  } catch (err) {
    throw new Error(`Import collection failed: ${err.message}`);
  }
};

module.exports = {
  postmanToBruno,
  parsePostmanCollection,
  importPostmanV2Collection
};

