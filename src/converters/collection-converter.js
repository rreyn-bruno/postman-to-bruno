/**
 * Main Collection Converter
 * Converts Postman collections to Bruno format
 */

const _ = require('../vendor/lodash');
const { uuid } = require('../utils/common');
const {
  AUTH_TYPES,
  parseGraphQLRequest,
  transformDescription,
  isItemAFolder,
  constructUrl,
  importScriptsFromEvents,
  importCollectionLevelVariables,
  processAuth
} = require('./postman-to-bruno');
const postmanTranslation = require('./postman-translations');
const { processRequestBody } = require('./body-converter');

const importPostmanV2CollectionItem = (brunoParent, items) => {
  brunoParent.items = brunoParent.items || [];
  const folderMap = {};
  const requestMap = {};

  items.forEach((item, index) => {
    if (isItemAFolder(item)) {
      // Handle folder
      const baseFolderName = item.name || 'Untitled Folder';
      let folderName = baseFolderName;
      let count = 1;
      while (folderMap[folderName]) {
        folderName = `${baseFolderName}_${count}`;
        count++;
      }

      const brunoFolderItem = {
        uid: uuid(),
        name: folderName,
        type: 'folder',
        items: [],
        seq: index + 1,
        root: {
          docs: transformDescription(item.description),
          meta: { name: folderName },
          request: {
            auth: { mode: 'inherit', basic: null, bearer: null, awsv4: null, apikey: null, oauth2: null, digest: null },
            headers: [],
            script: {},
            tests: '',
            vars: {}
          }
        }
      };

      brunoParent.items.push(brunoFolderItem);
      processAuth(item.auth, brunoFolderItem.root.request);

      if (item.item && item.item.length) {
        importPostmanV2CollectionItem(brunoFolderItem, item.item);
      }

      if (item.event) {
        importScriptsFromEvents(item.event, brunoFolderItem.root.request);
      }

      folderMap[folderName] = brunoFolderItem;
    } else if (item.request) {
      // Handle request
      const method = item?.request?.method?.toUpperCase();
      if (!method || typeof method !== 'string' || !method.trim()) {
        console.warn('Missing or invalid request.method', method);
        return;
      }

      const baseRequestName = item.name || 'Untitled Request';
      let requestName = baseRequestName;
      let count = 1;
      while (requestMap[requestName]) {
        requestName = `${baseRequestName}_${count}`;
        count++;
      }

      const url = constructUrl(item.request.url);

      const brunoRequestItem = {
        uid: uuid(),
        name: requestName,
        type: 'http-request',
        seq: index + 1,
        request: {
          url: url,
          method: method,
          auth: { mode: 'inherit', basic: null, bearer: null, awsv4: null, apikey: null, oauth2: null, digest: null },
          headers: [],
          params: [],
          body: { mode: 'none', json: null, text: null, xml: null, formUrlEncoded: [], multipartForm: [] },
          docs: transformDescription(item.request.description)
        }
      };

      // Settings
      brunoRequestItem.settings = {
        encodeUrl: item.protocolProfileBehavior?.disableUrlEncoding !== true
      };

      brunoParent.items.push(brunoRequestItem);

      // Process scripts
      if (item.event) {
        item.event.forEach((event) => {
          if (event.listen === 'prerequest' && event.script && event.script.exec) {
            if (!brunoRequestItem.request.script) brunoRequestItem.request.script = {};
            brunoRequestItem.request.script.req = event.script.exec.length > 0 
              ? postmanTranslation(event.script.exec) : '';
          }
          if (event.listen === 'test' && event.script && event.script.exec) {
            if (!brunoRequestItem.request.script) brunoRequestItem.request.script = {};
            brunoRequestItem.request.script.res = event.script.exec.length > 0 
              ? postmanTranslation(event.script.exec) : '';
          }
        });
      }

      // Process body
      const bodyMode = _.get(item, 'request.body.mode');
      if (bodyMode) {
        processRequestBody(item.request.body, brunoRequestItem.request.body, item.request.header);
      }

      // Process headers
      (item.request.header || []).forEach((header) => {
        brunoRequestItem.request.headers.push({
          uid: uuid(),
          name: header.key,
          value: header.value,
          description: transformDescription(header.description),
          enabled: !header.disabled
        });
      });

      // Process auth
      processAuth(item.request.auth, brunoRequestItem.request);

      // Process query params
      _.get(item, 'request.url.query', []).forEach((param) => {
        brunoRequestItem.request.params.push({
          uid: uuid(),
          name: param.key,
          value: param.value,
          description: transformDescription(param.description),
          type: 'query',
          enabled: !param.disabled
        });
      });

      // Process path params
      _.get(item, 'request.url.variable', []).forEach((param) => {
        if (!param.key) return;
        brunoRequestItem.request.params.push({
          uid: uuid(),
          name: param.key,
          value: param.value ?? '',
          description: transformDescription(param.description),
          type: 'path',
          enabled: true
        });
      });

      requestMap[requestName] = brunoRequestItem;
    }
  });
};

// Export main function
module.exports = { importPostmanV2CollectionItem };

