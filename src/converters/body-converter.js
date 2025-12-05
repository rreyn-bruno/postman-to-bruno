/**
 * Body Converter
 * Handles conversion of Postman request bodies to Bruno format
 */

const _ = require('lodash');
const { uuid } = require('../utils/common');
const { transformDescription, parseGraphQLRequest } = require('./postman-to-bruno');

const searchLanguageByHeader = (headers = []) => {
  let contentType;
  headers.forEach((header) => {
    if (header.key && header.key.toLowerCase() === 'content-type' && !header.disabled) {
      if (typeof header.value === 'string' && /^[\w\-]+\/([\w\-]+\+)?json/.test(header.value)) {
        contentType = 'json';
      } else if (typeof header.value === 'string' && /^[\w\-]+\/([\w\-]+\+)?xml/.test(header.value)) {
        contentType = 'xml';
      }
    }
  });
  return contentType;
};

/**
 * Process request body from Postman format to Bruno format
 * @param {Object} postmanBody - Postman body object
 * @param {Object} brunoBody - Bruno body object to populate
 * @param {Array} headers - Request headers for content-type detection
 */
const processRequestBody = (postmanBody, brunoBody, headers = []) => {
  const bodyMode = postmanBody?.mode;
  if (!bodyMode) return;

  if (bodyMode === 'formdata') {
    brunoBody.mode = 'multipartForm';
    (postmanBody.formdata || []).forEach((param) => {
      const isFile = param.type === 'file';
      let value, type;

      if (isFile) {
        value = Array.isArray(param.src) ? param.src : typeof param.src === 'string' ? [param.src] : null;
        type = 'file';
      } else {
        value = param.value;
        type = 'text';
      }

      brunoBody.multipartForm.push({
        uid: uuid(),
        type: type,
        name: param.key,
        value: value,
        description: transformDescription(param.description),
        enabled: !param.disabled
      });
    });
  }

  if (bodyMode === 'urlencoded') {
    brunoBody.mode = 'formUrlEncoded';
    (postmanBody.urlencoded || []).forEach((param) => {
      brunoBody.formUrlEncoded.push({
        uid: uuid(),
        name: param.key,
        value: param.value,
        description: transformDescription(param.description),
        enabled: !param.disabled
      });
    });
  }

  if (bodyMode === 'raw') {
    let language = _.get(postmanBody, 'options.raw.language');
    if (!language) {
      language = searchLanguageByHeader(headers);
    }
    if (language === 'json') {
      brunoBody.mode = 'json';
      brunoBody.json = postmanBody.raw;
    } else if (language === 'xml') {
      brunoBody.mode = 'xml';
      brunoBody.xml = postmanBody.raw;
    } else {
      brunoBody.mode = 'text';
      brunoBody.text = postmanBody.raw;
    }
  }

  if (bodyMode === 'graphql') {
    brunoBody.mode = 'graphql';
    brunoBody.graphql = parseGraphQLRequest(postmanBody.graphql);
  }
};

module.exports = {
  processRequestBody,
  searchLanguageByHeader
};

