/**
 * Postman to Bruno Collection Converter
 * Adapted from bruno-converters/src/postman/postman-to-bruno.js
 */

const _ = require('lodash');
const postmanTranslation = require('./postman-translations');
const { uuid } = require('../utils/common');

const AUTH_TYPES = Object.freeze({
  BASIC: 'basic',
  BEARER: 'bearer',
  AWSV4: 'awsv4',
  APIKEY: 'apikey',
  DIGEST: 'digest',
  OAUTH2: 'oauth2',
  NOAUTH: 'noauth',
  NONE: 'none'
});

// Regex for invalid variable characters
const invalidVariableCharacterRegex = /[^a-zA-Z0-9_]/g;

const parseGraphQLRequest = (graphqlSource) => {
  try {
    let queryResultObject = { query: '', variables: '' };
    if (typeof graphqlSource === 'string') {
      graphqlSource = JSON.parse(graphqlSource);
    }
    if (graphqlSource.hasOwnProperty('variables') && graphqlSource.variables !== '') {
      queryResultObject.variables = graphqlSource.variables;
    }
    if (graphqlSource.hasOwnProperty('query') && graphqlSource.query !== '') {
      queryResultObject.query = graphqlSource.query;
    }
    return queryResultObject;
  } catch (e) {
    return { query: '', variables: '' };
  }
};

const transformDescription = (description) => {
  if (!description) return '';
  if (typeof description === 'string') return description;
  if (typeof description === 'object' && description.hasOwnProperty('content')) {
    return description.content;
  }
  return '';
};

const isItemAFolder = (item) => !item.request;

const convertV21Auth = (array) => {
  return array.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
};

const constructUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string') return url;
  if (typeof url === 'object') {
    const { raw, protocol = 'http', host, path, port, query } = url;
    if (raw && typeof raw === 'string') {
      return raw.includes('#') ? raw.split('#')[0] : raw;
    }
    const hostStr = Array.isArray(host) ? host.filter(Boolean).join('.') : host || '';
    const pathStr = Array.isArray(path) ? path.filter(Boolean).join('/') : path || '';
    const portStr = port ? `:${port}` : '';
    const queryStr = query && Array.isArray(query) && query.length > 0
      ? `?${query.filter((q) => q && q.key).map((q) => `${q.key}=${q.value || ''}`).join('&')}`
      : '';
    return `${protocol}://${hostStr}${portStr}${pathStr ? `/${pathStr}` : ''}${queryStr}`;
  }
  return '';
};

const importScriptsFromEvents = (events, requestObject) => {
  events.forEach((event) => {
    if (event.script && event.script.exec) {
      if (event.listen === 'prerequest') {
        if (!requestObject.script) requestObject.script = {};
        if (event.script.exec && event.script.exec.length > 0) {
          requestObject.script.req = postmanTranslation(event.script.exec);
        } else {
          requestObject.script.req = '';
        }
      }
      if (event.listen === 'test') {
        if (!requestObject.script) requestObject.script = {};
        if (event.script.exec && event.script.exec.length > 0) {
          requestObject.script.res = postmanTranslation(event.script.exec);
        } else {
          requestObject.script.res = '';
        }
      }
    }
  });
};

const importCollectionLevelVariables = (variables, requestObject) => {
  const vars = variables.filter(v => !(v.key == null && v.value == null)).map((v) => ({
    uid: uuid(),
    name: (v.key ?? '').replace(invalidVariableCharacterRegex, '_'),
    value: v.value ?? '',
    enabled: true
  }));
  requestObject.vars.req = vars;
};

const processAuth = (auth, requestObject, isCollection = false) => {
  if (isCollection && !auth) return;
  if (!auth) return;
  if (auth.type === AUTH_TYPES.NOAUTH) {
    requestObject.auth.mode = AUTH_TYPES.NONE;
    return;
  }

  let authValues = auth[auth.type] ?? [];
  if (Array.isArray(authValues)) {
    authValues = convertV21Auth(authValues);
  }

  requestObject.auth.mode = auth.type;

  switch (auth.type) {
    case AUTH_TYPES.BASIC:
      requestObject.auth.basic = {
        username: authValues.username || '',
        password: authValues.password || ''
      };
      break;
    case AUTH_TYPES.BEARER:
      requestObject.auth.bearer = { token: authValues.token || '' };
      break;
    case AUTH_TYPES.AWSV4:
      requestObject.auth.awsv4 = {
        accessKeyId: authValues.accessKey || '',
        secretAccessKey: authValues.secretKey || '',
        sessionToken: authValues.sessionToken || '',
        service: authValues.service || '',
        region: authValues.region || '',
        profileName: ''
      };
      break;
    case AUTH_TYPES.APIKEY:
      requestObject.auth.apikey = {
        key: authValues.key || '',
        value: authValues.value?.toString() || '',
        placement: 'header'
      };
      break;
    case AUTH_TYPES.DIGEST:
      requestObject.auth.digest = {
        username: authValues.username || '',
        password: authValues.password || ''
      };
      break;
    case AUTH_TYPES.OAUTH2:
      const findValue = (key) => authValues[key] || '';
      const grantTypeMaps = {
        authorization_code_with_pkce: 'authorization_code',
        authorization_code: 'authorization_code',
        client_credentials: 'client_credentials',
        password_credentials: 'password'
      };
      const grantType = grantTypeMaps[findValue('grant_type')] || 'client_credentials';
      requestObject.auth.oauth2 = {
        grantType,
        accessTokenUrl: findValue('accessTokenUrl'),
        clientId: findValue('clientId'),
        clientSecret: findValue('clientSecret'),
        scope: findValue('scope'),
        ...(grantType === 'authorization_code' && {
          authorizationUrl: findValue('authUrl'),
          callbackUrl: findValue('redirect_uri'),
          pkce: findValue('grant_type') === 'authorization_code_with_pkce'
        }),
        ...(grantType === 'password' && {
          username: findValue('username'),
          password: findValue('password')
        })
      };
      break;
    default:
      requestObject.auth.mode = AUTH_TYPES.NONE;
      break;
  }
};

// Export for use in other modules
module.exports = {
  AUTH_TYPES,
  parseGraphQLRequest,
  transformDescription,
  isItemAFolder,
  convertV21Auth,
  constructUrl,
  importScriptsFromEvents,
  importCollectionLevelVariables,
  processAuth,
  invalidVariableCharacterRegex
};

