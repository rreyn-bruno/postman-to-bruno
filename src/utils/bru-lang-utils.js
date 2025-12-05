/**
 * Bruno Lang Utilities
 * Vendored from bruno-lang/v2/src/utils.js for standalone operation
 */

const safeParseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const indentString = (str, levels = 1) => {
  if (!str || !str.length) {
    return str || '';
  }

  const indent = '  '.repeat(levels);
  return str
    .split(/\r\n|\r|\n/)
    .map((line) => indent + line)
    .join('\n');
};

const outdentString = (str, spaces = 2) => {
  if (!str || !str.length) {
    return str || '';
  }

  const spacesRegex = new RegExp(`^ {${spaces}}`);
  return str
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(spacesRegex, ''))
    .join('\n');
};

const getValueString = (value) => {
  if (!value) {
    return '';
  }

  const hasNewLines = value.includes('\n') || value.includes('\r');

  if (!hasNewLines) {
    return value;
  }

  return `'''\n${indentString(value)}\n'''`;
};

const getKeyString = (key) => {
  const quotableChars = [':', '"', '{', '}', ' '];
  return quotableChars.some((char) => key.includes(char)) ? ('"' + key.replaceAll('"', '\\"') + '"') : key;
};

const getValueUrl = (url) => {
  if (!url) {
    return '';
  }

  const hasNewLines = url.includes('\n') || url.includes('\r');

  if (!hasNewLines) {
    return url;
  }

  return `'''\n${indentString(url, 2)}\n'''`;
};

module.exports = {
  safeParseJson,
  indentString,
  outdentString,
  getValueString,
  getKeyString,
  getValueUrl
};

