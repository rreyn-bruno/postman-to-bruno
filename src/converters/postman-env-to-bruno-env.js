/**
 * Postman Environment to Bruno Environment Converter
 * Adapted from bruno-converters/src/postman/postman-env-to-bruno-env.js
 */

const fs = require('fs');
const path = require('path');
const { uuid } = require('../utils/common');

/**
 * Convert a Postman environment to Bruno environment format
 * @param {Object} postmanEnv - Postman environment object
 * @returns {Object} - Bruno environment object
 */
const postmanEnvToBrunoEnv = (postmanEnv) => {
  const brunoEnv = {
    name: postmanEnv.name || 'Untitled Environment',
    variables: []
  };

  // Handle Postman v2.1 format (array of objects)
  const values = postmanEnv.values || [];
  
  for (const variable of values) {
    if (!variable.key && !variable.value) continue;
    
    brunoEnv.variables.push({
      uid: uuid(),
      name: variable.key || '',
      value: variable.value || '',
      type: variable.type === 'secret' ? 'secret' : 'text',
      enabled: variable.enabled !== false
    });
  }

  return brunoEnv;
};

/**
 * Write Bruno environment to file
 * @param {Object} brunoEnv - Bruno environment object
 * @param {string} outputPath - Output file path
 */
const writeBrunoEnv = (brunoEnv, outputPath) => {
  const envContent = {
    name: brunoEnv.name,
    variables: brunoEnv.variables.map(v => ({
      name: v.name,
      value: v.value,
      enabled: v.enabled,
      secret: v.type === 'secret'
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(envContent, null, 2), 'utf8');
};

/**
 * Convert Postman environment file to Bruno environment
 * @param {string} inputFile - Path to Postman environment JSON
 * @param {string} outputDir - Output directory for Bruno environment
 * @param {Object} options - Conversion options
 * @returns {Object} - Result object with status and details
 */
const convertEnvironment = (inputFile, outputDir, options = {}) => {
  try {
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const postmanEnv = JSON.parse(rawData);

    // Validate Postman environment structure
    if (!postmanEnv.name && !postmanEnv.values) {
      throw new Error('Invalid Postman environment file');
    }

    const brunoEnv = postmanEnvToBrunoEnv(postmanEnv);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write environment file
    const envFileName = `${brunoEnv.name.replace(/[<>:"/\\|?*]/g, '-')}.bru`;
    const outputPath = path.join(outputDir, 'environments', envFileName);
    
    // Ensure environments directory exists
    const envsDir = path.join(outputDir, 'environments');
    if (!fs.existsSync(envsDir)) {
      fs.mkdirSync(envsDir, { recursive: true });
    }

    writeBrunoEnv(brunoEnv, outputPath);

    if (options.verbose) {
      console.log(`  ✓ Created environment: ${envFileName}`);
      console.log(`    Variables: ${brunoEnv.variables.length}`);
    }

    return {
      success: true,
      name: brunoEnv.name,
      variableCount: brunoEnv.variables.length,
      outputPath
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * Batch convert multiple Postman environment files
 * @param {string} inputDir - Directory containing Postman environment files
 * @param {string} outputDir - Output directory
 * @param {Object} options - Conversion options
 */
const convertEnvironmentsBatch = (inputDir, outputDir, options = {}) => {
  const results = {
    successful: [],
    failed: []
  };

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(inputDir, file);
    const result = convertEnvironment(filePath, outputDir, options);
    
    if (result.success) {
      results.successful.push({ file, ...result });
    } else {
      results.failed.push({ file, error: result.error });
    }
  }

  return results;
};

module.exports = {
  postmanEnvToBrunoEnv,
  writeBrunoEnv,
  convertEnvironment,
  convertEnvironmentsBatch
};

