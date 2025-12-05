/**
 * JSON to Example BRU format converter
 * Vendored from bruno-lang/v2/src/example/jsonToBru.js
 */

const stripLastLine = (text) => {
  if (!text || !text.length) return text;
  return text.replace(/(\r?\n)$/, '');
};

const quoteKey = (key) => {
  const quotableChars = [':', '"', '{', '}', ' '];
  return quotableChars.some((char) => key.includes(char)) ? ('"' + key.replaceAll('"', '\\"') + '"') : key;
};

const indentStringCustom = (str, spaces = 4) => {
  if (!str || !str.length) {
    return str || '';
  }
  const indent = ' '.repeat(spaces);
  return str
    .split(/\r\n|\r|\n/)
    .map((line) => indent + line)
    .join('\n');
};

const jsonToExampleBru = (json) => {
  const { name, description, request, response } = json;
  const { url, method, params, headers, body } = request || {};
  const { headers: responseHeaders, status: responseStatus, statusText: responseStatusText, body: responseBody } = response || {};

  let bru = '';

  if (name) {
    bru += `name: ${name}\n`;
  }

  if (description) {
    bru += `description: ${description}\n`;
  }

  // Request block
  bru += '\nrequest: {\n';
  bru += `  url: ${url}\n`;
  bru += `  method: ${method}\n`;

  if (request && request.body && request.body.mode) {
    bru += `  mode: ${request.body.mode}\n`;
  }

  if (params && params.length) {
    const queryParams = params.filter((param) => param.type === 'query');
    const pathParams = params.filter((param) => param.type === 'path');

    if (queryParams.length) {
      bru += '  params:query: {\n';
      bru += `${indentStringCustom(queryParams
        .map((item) => `${item.enabled ? '' : '~'}${quoteKey(item.name)}: ${item.value}`)
        .join('\n'), 4)}`;
      bru += '\n  }\n\n';
    }

    if (pathParams.length) {
      bru += '  params:path: {\n';
      bru += `${indentStringCustom(pathParams
        .map((item) => `${item.enabled ? '' : '~'}${quoteKey(item.name)}: ${item.value}`)
        .join('\n'), 4)}`;
      bru += '\n  }\n\n';
    }
  }

  if (headers && headers.length) {
    bru += '  headers: {\n';
    bru += `${indentStringCustom(headers
      .map((item) => `${item.enabled ? '' : '~'}${quoteKey(item.name)}: ${item.value}`)
      .join('\n'), 4)}`;
    bru += '\n  }\n\n';
  }

  // Body types
  if (body && body.json) {
    bru += `  body:json: {\n${indentStringCustom(body.json, 4)}\n  }\n\n`;
  }
  if (body && body.text) {
    bru += `  body:text: {\n${indentStringCustom(body.text, 4)}\n  }\n\n`;
  }
  if (body && body.xml) {
    bru += `  body:xml: {\n${indentStringCustom(body.xml, 4)}\n  }\n\n`;
  }
  if (body && body.formUrlEncoded && body.formUrlEncoded.length) {
    bru += `  body:form-urlencoded: {\n`;
    const enabledVals = body.formUrlEncoded.filter((i) => i.enabled).map((i) => `${quoteKey(i.name)}: ${i.value}`).join('\n');
    const disabledVals = body.formUrlEncoded.filter((i) => !i.enabled).map((i) => `~${quoteKey(i.name)}: ${i.value}`).join('\n');
    if (enabledVals) bru += `${indentStringCustom(enabledVals, 4)}\n`;
    if (disabledVals) bru += `${indentStringCustom(disabledVals, 4)}\n`;
    bru += '  }\n\n';
  }
  if (body && body.multipartForm && body.multipartForm.length) {
    bru += `  body:multipart-form: {\n`;
    bru += `${indentStringCustom(body.multipartForm.map((item) => {
      const prefix = item.enabled ? '' : '~';
      if (item.type === 'file') {
        const files = Array.isArray(item.value) ? item.value.join('|') : '';
        return `${prefix}${quoteKey(item.name)}: @file(${files})`;
      }
      return `${prefix}${quoteKey(item.name)}: ${item.value}`;
    }).join('\n'), 4)}\n`;
    bru += '  }\n\n';
  }

  if (bru.endsWith('\n\n')) {
    bru = stripLastLine(bru);
  }
  bru += '}\n\n';

  // Response block
  if (response) {
    bru += 'response: {\n';

    if (responseHeaders && responseHeaders.length) {
      bru += '  headers: {\n';
      bru += `${indentStringCustom(responseHeaders.map((i) => `${quoteKey(i.name)}: ${i.value}`).join('\n'), 4)}`;
      bru += '\n  }\n\n';
    }

    if (responseStatus || responseStatusText) {
      bru += '  status: {\n';
      if (responseStatus !== undefined) bru += `    code: ${responseStatus}\n`;
      if (responseStatusText !== undefined) bru += `    text: ${responseStatusText}\n`;
      bru += '  }\n\n';
    }

    if (responseBody) {
      bru += '  body: {\n';
      if (responseBody.type) bru += `    type: ${responseBody.type}\n`;
      if (responseBody.content !== undefined) {
        let content = typeof responseBody.content === 'string' ? responseBody.content : JSON.stringify(responseBody.content, null, 2);
        bru += `    content: '''\n${indentStringCustom(content, 6)}\n    '''\n`;
      }
      bru += '  }\n\n';
    }

    bru = stripLastLine(bru);
    bru += '}';
  }

  while (bru.endsWith('\n')) {
    bru = stripLastLine(bru);
  }

  return bru;
};

module.exports = jsonToExampleBru;

