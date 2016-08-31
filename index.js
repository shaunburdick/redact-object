'use strict';

const some = require('lodash/some');
const isArray = require('lodash/isArray');
const isPlainObject = require('lodash/isPlainObject');
const isObject = require('lodash/isObject');

function isKeywordMatch (keywords, key) {
  return some(keywords, (keyword) =>
    key.toLowerCase().indexOf(keyword.toLowerCase()) !== -1
  );
}

/**
 * Parses an object and redacts any keys listed in keywords
 *
 * @param  {object}   target     The target object to scan for redactable items
 * @param  {string[]} keywords   A list of members to redact
 * @param  {string}   replaceVal Optional custom replace value
 * @return {object}              the new redacted object
 */
function redact (target, keywords, replaceVal) {
  if (!isObject(target)) {
    // If it's not an object then it's a primitive. Nothing to redact.
    return target;
  } else if (isArray(target)) {
    // Create a new array with each value having been redacted
    // Redact each value of the array.
    return target.map((val) => redact(val, keywords, replaceVal));
  } else if (isPlainObject(target)) {
    return Object.keys(target).reduce((newObj, key) => {
      const isMatch = isKeywordMatch(keywords, key);
      if (isMatch) {
        newObj[key] = replaceVal || '[ REDACTED ]';
      } else {
        newObj[key] = redact(target[key], keywords, replaceVal);
      }
      return newObj;
    }, {});
  }
  // Redaction only works on arrays, plain objects, and primitives.
  throw new Error('Unsupported value for redaction');
}

module.exports = redact;
