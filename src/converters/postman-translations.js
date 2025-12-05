/**
 * Postman Script Translations
 * Converts Postman's pm.* and postman.* APIs to Bruno equivalents
 * Adapted from bruno-converters/src/postman/postman-translations.js
 */

const replacements = {
  'pm\\.environment\\.get\\(': 'bru.getEnvVar(',
  'pm\\.environment\\.set\\(': 'bru.setEnvVar(',
  'pm\\.variables\\.get\\(': 'bru.getVar(',
  'pm\\.variables\\.set\\(': 'bru.setVar(',
  'pm\\.variables\\.replaceIn\\(': 'bru.interpolate(',
  'pm\\.collectionVariables\\.get\\(': 'bru.getVar(',
  'pm\\.collectionVariables\\.set\\(': 'bru.setVar(',
  'pm\\.collectionVariables\\.has\\(': 'bru.hasVar(',
  'pm\\.collectionVariables\\.unset\\(': 'bru.deleteVar(',
  'pm\\.setNextRequest\\(': 'bru.setNextRequest(',
  'pm\\.test\\(': 'test(',
  'pm.response.to.have\\.status\\(': 'expect(res.getStatus()).to.equal(',
  'pm\\.response\\.to\\.have\\.status\\(': 'expect(res.getStatus()).to.equal(',
  'pm\\.response\\.json\\(': 'res.getBody(',
  'pm\\.expect\\(': 'expect(',
  'pm\\.environment\\.has\\(([^)]+)\\)': 'bru.getEnvVar($1) !== undefined && bru.getEnvVar($1) !== null',
  'pm\\.response\\.code': 'res.getStatus()',
  'pm\\.response\\.text\\(\\)': 'JSON.stringify(res.getBody())',
  'pm\\.expect\\.fail\\(': 'expect.fail(',
  'pm\\.response\\.responseTime': 'res.getResponseTime()',
  'pm\\.globals\\.set\\(': 'bru.setGlobalEnvVar(',
  'pm\\.globals\\.get\\(': 'bru.getGlobalEnvVar(',
  'pm\\.response\\.headers\\.get\\(': 'res.getHeader(',
  'pm\\.response\\.to\\.have\\.body\\(': 'expect(res.getBody()).to.equal(',
  'pm\\.response\\.to\\.have\\.header\\(': 'expect(res.getHeaders()).to.have.property(',
  'pm\\.response\\.size\\(\\)': 'res.getSize()',
  'pm\\.response\\.size\\(\\)\\.body': 'res.getSize().body',
  'pm\\.response\\.responseSize': 'res.getSize().body',
  'pm\\.response\\.size\\(\\)\\.header': 'res.getSize().header',
  'pm\\.response\\.size\\(\\)\\.total': 'res.getSize().total',
  'pm\\.environment\\.name': 'bru.getEnvName()',
  'pm\\.response\\.status': 'res.statusText',
  'pm\\.response\\.headers': 'res.getHeaders()',
  "tests\\['([^']+)'\\]\\s*=\\s*([^;]+);": 'test("$1", function() { expect(Boolean($2)).to.be.true; });',
  // Request translations
  'pm\\.request\\.url': 'req.getUrl()',
  'pm\\.request\\.method': 'req.getMethod()',
  'pm\\.request\\.headers': 'req.getHeaders()',
  'pm\\.request\\.body': 'req.getBody()',
  'pm\\.info\\.requestName': 'req.getName()',
  'request\\.url': 'req.getUrl()',
  'request\\.method': 'req.getMethod()',
  'request\\.headers': 'req.getHeaders()',
  'request\\.body': 'req.getBody()',
  'request\\.name': 'req.getName()',
  // Deprecated translations
  'postman\\.setEnvironmentVariable\\(': 'bru.setEnvVar(',
  'postman\\.getEnvironmentVariable\\(': 'bru.getEnvVar(',
  'postman\\.clearEnvironmentVariable\\(': 'bru.deleteEnvVar(',
  'pm\\.execution\\.skipRequest\\(\\)': 'bru.runner.skipRequest()',
  'pm\\.execution\\.skipRequest': 'bru.runner.skipRequest',
  'pm\\.execution\\.setNextRequest\\(null\\)': 'bru.runner.stopExecution()',
  'pm\\.execution\\.setNextRequest\\(\'null\'\\)': 'bru.runner.stopExecution()',
  // Cookie jar translations
  'pm\\.cookies\\.jar\\(\\)': 'bru.cookies.jar()',
  'pm\\.cookies\\.jar\\(\\)\\.get\\(': 'bru.cookies.jar().getCookie(',
  'pm\\.cookies\\.jar\\(\\)\\.set\\(': 'bru.cookies.jar().setCookie(',
  'pm\\.cookies\\.jar\\(\\)\\.unset\\(': 'bru.cookies.jar().deleteCookie(',
  'pm\\.cookies\\.jar\\(\\)\\.clear\\(': 'bru.cookies.jar().deleteCookies(',
  'pm\\.cookies\\.jar\\(\\)\\.getAll\\(': 'bru.cookies.jar().getCookies(',
};

// Add postman.* equivalents
const extendedReplacements = Object.keys(replacements).reduce((acc, key) => {
  const newKey = key.replace(/^pm\\\./, 'postman\\.');
  acc[key] = replacements[key];
  acc[newKey] = replacements[key];
  return acc;
}, {});

// Compile regex patterns
const compiledReplacements = Object.entries(extendedReplacements).map(([pattern, replacement]) => ({
  regex: new RegExp(pattern, 'g'),
  replacement
}));

/**
 * Process regex replacements on code
 * @param {string} code - The script code to process
 * @returns {string} - Processed code
 */
const processRegexReplacement = (code) => {
  for (const { regex, replacement } of compiledReplacements) {
    if (regex.test(code)) {
      code = code.replace(regex, replacement);
    }
  }
  // Comment out any remaining pm.* or postman.* calls that weren't translated
  if (code.includes('pm.') || code.includes('postman.')) {
    code = code.replace(/^(.*(pm\.|postman\.).*)$/gm, '// $1');
  }
  return code;
};

/**
 * Translate Postman scripts to Bruno format
 * @param {string|string[]} script - Script content (string or array of lines)
 * @returns {string} - Translated script
 */
const postmanTranslation = (script) => {
  let modifiedScript = Array.isArray(script) ? script.join('\n') : script;
  
  try {
    return processRegexReplacement(modifiedScript);
  } catch (e) {
    console.warn('Error in postman translation:', e.message);
    return modifiedScript;
  }
};

module.exports = postmanTranslation;

