/**
 * JSON to collection.bru and folder.bru generator
 * Adapted from bruno-lang/v2/src/jsonToCollectionBru.js
 */

const _ = require('../vendor/lodash');
const { indentString, getValueString, getKeyString } = require('../utils/bru-lang-utils');

const enabled = (items = []) => items.filter((item) => item.enabled);
const disabled = (items = []) => items.filter((item) => !item.enabled);

const jsonToCollectionBru = (json, isFolder = false) => {
  const { meta, headers, auth, script, vars, docs, tests } = json;

  let bru = '';

  // Meta block
  if (meta) {
    bru += 'meta {\n';
    for (const key in meta) {
      bru += `  ${key}: ${meta[key]}\n`;
    }
    bru += '}\n\n';
  }

  // Headers block
  if (headers && headers.length) {
    bru += 'headers {';
    if (enabled(headers).length) {
      bru += `\n${indentString(
        enabled(headers)
          .map((item) => `${getKeyString(item.name)}: ${getValueString(item.value)}`)
          .join('\n')
      )}`;
    }
    if (disabled(headers).length) {
      bru += `\n${indentString(
        disabled(headers)
          .map((item) => `~${getKeyString(item.name)}: ${getValueString(item.value)}`)
          .join('\n')
      )}`;
    }
    bru += '\n}\n\n';
  }

  // Auth blocks
  if (auth) {
    if (auth.awsv4) {
      bru += `auth:awsv4 {\n`;
      bru += `${indentString(`accessKeyId: ${auth.awsv4.accessKeyId || ''}`)}\n`;
      bru += `${indentString(`secretAccessKey: ${auth.awsv4.secretAccessKey || ''}`)}\n`;
      bru += `${indentString(`sessionToken: ${auth.awsv4.sessionToken || ''}`)}\n`;
      bru += `${indentString(`service: ${auth.awsv4.service || ''}`)}\n`;
      bru += `${indentString(`region: ${auth.awsv4.region || ''}`)}\n`;
      bru += `${indentString(`profileName: ${auth.awsv4.profileName || ''}`)}\n}\n\n`;
    }

    if (auth.basic) {
      bru += `auth:basic {\n`;
      bru += `${indentString(`username: ${auth.basic.username || ''}`)}\n`;
      bru += `${indentString(`password: ${auth.basic.password || ''}`)}\n}\n\n`;
    }

    if (auth.bearer) {
      bru += `auth:bearer {\n${indentString(`token: ${auth.bearer.token || ''}`)}\n}\n\n`;
    }

    if (auth.digest) {
      bru += `auth:digest {\n`;
      bru += `${indentString(`username: ${auth.digest.username || ''}`)}\n`;
      bru += `${indentString(`password: ${auth.digest.password || ''}`)}\n}\n\n`;
    }

    if (auth.apikey) {
      bru += `auth:apikey {\n`;
      bru += `${indentString(`key: ${auth.apikey.key || ''}`)}\n`;
      bru += `${indentString(`value: ${auth.apikey.value || ''}`)}\n`;
      bru += `${indentString(`placement: ${auth.apikey.placement || ''}`)}\n}\n\n`;
    }

    if (auth.oauth2) {
      const oauth2 = auth.oauth2;
      bru += 'auth:oauth2 {\n';
      bru += `${indentString(`grant_type: ${oauth2.grantType || 'client_credentials'}`)}\n`;
      bru += `${indentString(`access_token_url: ${oauth2.accessTokenUrl || ''}`)}\n`;
      bru += `${indentString(`client_id: ${oauth2.clientId || ''}`)}\n`;
      bru += `${indentString(`client_secret: ${oauth2.clientSecret || ''}`)}\n`;
      bru += `${indentString(`scope: ${oauth2.scope || ''}`)}\n`;
      bru += '}\n\n';
    }
  }

  // Vars blocks
  const reqvars = _.get(vars, 'req');
  if (reqvars && reqvars.length) {
    bru += `vars:pre-request {`;
    const varsEnabled = _.filter(reqvars, (v) => v.enabled);
    const varsDisabled = _.filter(reqvars, (v) => !v.enabled);
    if (varsEnabled.length) {
      bru += `\n${indentString(varsEnabled.map((item) => `${item.name}: ${getValueString(item.value)}`).join('\n'))}`;
    }
    if (varsDisabled.length) {
      bru += `\n${indentString(varsDisabled.map((item) => `~${item.name}: ${getValueString(item.value)}`).join('\n'))}`;
    }
    bru += '\n}\n\n';
  }

  // Scripts
  if (script && script.req && script.req.length) {
    bru += `script:pre-request {\n${indentString(script.req)}\n}\n\n`;
  }

  if (script && script.res && script.res.length) {
    bru += `script:post-response {\n${indentString(script.res)}\n}\n\n`;
  }

  // Tests
  if (tests && tests.length) {
    bru += `tests {\n${indentString(tests)}\n}\n\n`;
  }

  // Docs
  if (docs && docs.length) {
    bru += `docs {\n${indentString(docs)}\n}\n\n`;
  }

  // Remove trailing newline
  if (bru.endsWith('\n\n')) {
    bru = bru.slice(0, -1);
  }

  return bru;
};

module.exports = jsonToCollectionBru;

