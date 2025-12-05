/**
 * Common utility functions
 */

/**
 * Generate a UUID v4
 * @returns {string} UUID string
 */
const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Sanitize a name to be safe for file system usage
 * @param {string} name - The name to sanitize
 * @returns {string} - Sanitized name
 */
const sanitizeName = (name) => {
  if (!name) return 'unnamed';
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Sanitize a directory name
 * @param {string} name - The name to sanitize
 * @returns {string} - Sanitized name
 */
const sanitizeDirectoryName = (name) => {
  if (!name) return 'unnamed';
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

module.exports = {
  uuid,
  sanitizeName,
  sanitizeDirectoryName
};

