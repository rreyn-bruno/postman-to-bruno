/**
 * JSON to .bru file generator
 * Vendored and adapted from bruno-lang/v2/src/jsonToBru.js
 */

const _ = require('../vendor/lodash');
const { indentString, getValueString, getKeyString, getValueUrl } = require('../utils/bru-lang-utils');
const jsonToExampleBru = require('./json-to-example-bru');

const enabled = (items = [], key = "enabled") => items.filter((item) => item[key]);
const disabled = (items = [], key = "enabled") => items.filter((item) => !item[key]);

const stripLastLine = (text) => {
  if (!text || !text.length) return text;
  return text.replace(/(\r?\n)$/, '');
};

const jsonToBru = (json) => {
  const { meta, http, params, headers, auth, body, script, tests, vars, assertions, settings, docs, examples } = json;

  let bru = '';

  // Meta block
  if (meta) {
    bru += 'meta {\n';
    const tags = meta.tags;
    delete meta.tags;

    for (const key in meta) {
      bru += `  ${key}: ${meta[key]}\n`;
    }

    if (tags && tags.length) {
      bru += `  tags: [\n`;
      for (const tag of tags) {
        bru += `    ${tag}\n`;
      }
      bru += `  ]\n`;
    }
    bru += '}\n\n';
  }

  // HTTP method block
  if (http?.method) {
    const { method, url, body: httpBody, auth: httpAuth } = http;
    const standardMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace', 'connect']);
    const isStandard = standardMethods.has(method.toLowerCase());

    bru += isStandard ? `${method.toLowerCase()} {` : `http {\n  method: ${method}`;
    bru += `\n  url: ${getValueUrl(url)}`;

    if (httpBody?.length) {
      bru += `\n  body: ${httpBody}`;
    }

    if (httpAuth?.length) {
      bru += `\n  auth: ${httpAuth}`;
    }

    bru += `\n}\n\n`;
  }

  // Query and path params
  if (params && params.length) {
    const queryParams = params.filter((param) => param.type === 'query');
    const pathParams = params.filter((param) => param.type === 'path');

    if (queryParams.length) {
      bru += 'params:query {';
      if (enabled(queryParams).length) {
        bru += `\n${indentString(
          enabled(queryParams)
            .map((item) => `${getKeyString(item.name)}: ${getValueString(item.value)}`)
            .join('\n')
        )}`;
      }
      if (disabled(queryParams).length) {
        bru += `\n${indentString(
          disabled(queryParams)
            .map((item) => `~${getKeyString(item.name)}: ${getValueString(item.value)}`)
            .join('\n')
        )}`;
      }
      bru += '\n}\n\n';
    }

    if (pathParams.length) {
      bru += 'params:path {';
      bru += `\n${indentString(pathParams.map((item) => `${item.name}: ${getValueString(item.value)}`).join('\n'))}`;
      bru += '\n}\n\n';
    }
  }

  // Headers
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
  bru += generateAuthBlock(auth);

  // Body blocks
  bru += generateBodyBlock(body);

  // Variables
  bru += generateVarsBlock(vars);

  // Assertions
  if (assertions && assertions.length) {
    bru += `assert {`;
    if (enabled(assertions).length) {
      bru += `\n${indentString(
        enabled(assertions).map((item) => `${item.name}: ${getValueString(item.value)}`).join('\n')
      )}`;
    }
    if (disabled(assertions).length) {
      bru += `\n${indentString(
        disabled(assertions).map((item) => `~${getKeyString(item.name)}: ${getValueString(item.value)}`).join('\n')
      )}`;
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

  // Settings
  if (settings && Object.keys(settings).length) {
    bru += 'settings {\n';
    for (const key in settings) {
      bru += `  ${key}: ${settings[key]}\n`;
    }
    bru += '}\n\n';
  }

  // Docs
  if (docs && docs.length) {
    bru += `docs {\n${indentString(docs)}\n}\n\n`;
  }

  // Examples
  if (examples && examples.length) {
    examples.forEach((example) => {
      const bruExample = jsonToExampleBru(example);
      bru += `example {\n${indentString(bruExample)}\n}\n\n`;
    });
  }

  return stripLastLine(bru);
};

// Auth block generator
function generateAuthBlock(auth) {
  let bru = '';

  if (auth && auth.awsv4) {
    bru += `auth:awsv4 {\n`;
    bru += `${indentString(`accessKeyId: ${auth.awsv4.accessKeyId || ''}`)}\n`;
    bru += `${indentString(`secretAccessKey: ${auth.awsv4.secretAccessKey || ''}`)}\n`;
    bru += `${indentString(`sessionToken: ${auth.awsv4.sessionToken || ''}`)}\n`;
    bru += `${indentString(`service: ${auth.awsv4.service || ''}`)}\n`;
    bru += `${indentString(`region: ${auth.awsv4.region || ''}`)}\n`;
    bru += `${indentString(`profileName: ${auth.awsv4.profileName || ''}`)}\n}\n\n`;
  }

  if (auth && auth.basic) {
    bru += `auth:basic {\n`;
    bru += `${indentString(`username: ${auth.basic.username || ''}`)}\n`;
    bru += `${indentString(`password: ${auth.basic.password || ''}`)}\n}\n\n`;
  }

  if (auth && auth.bearer) {
    bru += `auth:bearer {\n${indentString(`token: ${auth.bearer.token || ''}`)}\n}\n\n`;
  }

  if (auth && auth.digest) {
    bru += `auth:digest {\n`;
    bru += `${indentString(`username: ${auth.digest.username || ''}`)}\n`;
    bru += `${indentString(`password: ${auth.digest.password || ''}`)}\n}\n\n`;
  }

  if (auth && auth.apikey) {
    bru += `auth:apikey {\n`;
    bru += `${indentString(`key: ${auth.apikey.key || ''}`)}\n`;
    bru += `${indentString(`value: ${auth.apikey.value || ''}`)}\n`;
    bru += `${indentString(`placement: ${auth.apikey.placement || ''}`)}\n}\n\n`;
  }

  if (auth && auth.oauth2) {
    bru += generateOAuth2Block(auth.oauth2);
  }

  return bru;
}

// OAuth2 block generator
function generateOAuth2Block(oauth2) {
  let bru = 'auth:oauth2 {\n';

  switch (oauth2.grantType) {
    case 'password':
      bru += `${indentString('grant_type: password')}\n`;
      bru += `${indentString(`access_token_url: ${oauth2.accessTokenUrl || ''}`)}\n`;
      bru += `${indentString(`username: ${oauth2.username || ''}`)}\n`;
      bru += `${indentString(`password: ${oauth2.password || ''}`)}\n`;
      break;
    case 'authorization_code':
      bru += `${indentString('grant_type: authorization_code')}\n`;
      bru += `${indentString(`callback_url: ${oauth2.callbackUrl || ''}`)}\n`;
      bru += `${indentString(`authorization_url: ${oauth2.authorizationUrl || ''}`)}\n`;
      bru += `${indentString(`access_token_url: ${oauth2.accessTokenUrl || ''}`)}\n`;
      bru += `${indentString(`pkce: ${(oauth2.pkce || false).toString()}`)}\n`;
      break;
    case 'client_credentials':
    default:
      bru += `${indentString('grant_type: client_credentials')}\n`;
      bru += `${indentString(`access_token_url: ${oauth2.accessTokenUrl || ''}`)}\n`;
      break;
  }

  bru += `${indentString(`client_id: ${oauth2.clientId || ''}`)}\n`;
  bru += `${indentString(`client_secret: ${oauth2.clientSecret || ''}`)}\n`;
  bru += `${indentString(`scope: ${oauth2.scope || ''}`)}\n`;
  bru += '}\n\n';

  return bru;
}

// Body block generator
function generateBodyBlock(body) {
  let bru = '';

  if (body && body.json && body.json.length) {
    bru += `body:json {\n${indentString(body.json)}\n}\n\n`;
  }

  if (body && body.text && body.text.length) {
    bru += `body:text {\n${indentString(body.text)}\n}\n\n`;
  }

  if (body && body.xml && body.xml.length) {
    bru += `body:xml {\n${indentString(body.xml)}\n}\n\n`;
  }

  if (body && body.formUrlEncoded && body.formUrlEncoded.length) {
    bru += `body:form-urlencoded {\n`;
    const enabledItems = body.formUrlEncoded.filter(i => i.enabled);
    const disabledItems = body.formUrlEncoded.filter(i => !i.enabled);

    if (enabledItems.length) {
      bru += `${indentString(enabledItems.map(i => `${getKeyString(i.name)}: ${getValueString(i.value)}`).join('\n'))}\n`;
    }
    if (disabledItems.length) {
      bru += `${indentString(disabledItems.map(i => `~${getKeyString(i.name)}: ${getValueString(i.value)}`).join('\n'))}\n`;
    }
    bru += '}\n\n';
  }

  if (body && body.multipartForm && body.multipartForm.length) {
    bru += `body:multipart-form {`;
    const forms = body.multipartForm;
    if (forms.length) {
      bru += `\n${indentString(
        forms.map((item) => {
          const prefix = item.enabled ? '' : '~';
          if (item.type === 'file') {
            const files = Array.isArray(item.value) ? item.value.join('|') : '';
            return `${prefix}${getKeyString(item.name)}: @file(${files})`;
          }
          return `${prefix}${getKeyString(item.name)}: ${getValueString(item.value)}`;
        }).join('\n')
      )}`;
    }
    bru += '\n}\n\n';
  }

  if (body && body.graphql && body.graphql.query) {
    bru += `body:graphql {\n${indentString(body.graphql.query)}\n}\n\n`;
    if (body.graphql.variables) {
      bru += `body:graphql:vars {\n${indentString(body.graphql.variables)}\n}\n\n`;
    }
  }

  return bru;
}

// Variables block generator
function generateVarsBlock(vars) {
  let bru = '';

  const reqvars = _.get(vars, 'req');
  const resvars = _.get(vars, 'res');

  if (reqvars && reqvars.length) {
    bru += `vars:pre-request {`;
    const varsEnabled = _.filter(reqvars, (v) => v.enabled && !v.local);
    const varsDisabled = _.filter(reqvars, (v) => !v.enabled && !v.local);

    if (varsEnabled.length) {
      bru += `\n${indentString(varsEnabled.map((item) => `${item.name}: ${getValueString(item.value)}`).join('\n'))}`;
    }
    if (varsDisabled.length) {
      bru += `\n${indentString(varsDisabled.map((item) => `~${item.name}: ${getValueString(item.value)}`).join('\n'))}`;
    }
    bru += '\n}\n\n';
  }

  if (resvars && resvars.length) {
    bru += `vars:post-response {`;
    const varsEnabled = _.filter(resvars, (v) => v.enabled && !v.local);
    const varsDisabled = _.filter(resvars, (v) => !v.enabled && !v.local);

    if (varsEnabled.length) {
      bru += `\n${indentString(varsEnabled.map((item) => `${item.name}: ${getValueString(item.value)}`).join('\n'))}`;
    }
    if (varsDisabled.length) {
      bru += `\n${indentString(varsDisabled.map((item) => `~${item.name}: ${getValueString(item.value)}`).join('\n'))}`;
    }
    bru += '\n}\n\n';
  }

  return bru;
}

module.exports = jsonToBru;

