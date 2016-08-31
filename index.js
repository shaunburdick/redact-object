'use strict';

const some = require('lodash/some');
const isArray = require('lodash/isArray');
const isPlainObject = require('lodash/isPlainObject');
const isObject = require('lodash/isObject');

/**
 * Checks for match
 * @param  {string[]} keywords A list of keywords to look for
 * @param  {string}   key      The string to check
 * @param  {Boolean}  strict   Use strict case if true
 * @param  {Boolean}  partial  Use partial matching if true
 * @return {Boolean}           True for match or false
 */
function isKeywordMatch (keywords, key, strict, partial) {
  return some(keywords, (keyword) => {
    const keyMatch = strict ? key : key.toLowerCase();
    const keywordMatch = strict ? keyword : keyword.toLowerCase();

    return partial ? (keyMatch.indexOf(keywordMatch) !== -1) : (keyMatch === keywordMatch);
  });
}

/**
 * Parses an object and redacts any keys listed in keywords
 *
 * @param  {object}   target     The target object to scan for redactable items
 * @param  {string[]} keywords   A list of members to redact
 * @param  {string}   replaceVal Optional custom replace value
 * @param  {object}   config     Optional config
 *                               {
 *                                 partial: boolean, do partial matches, default false
 *                                 strict: boolean, do strict key matching, default true
 *                               }
 * @return {object}              the new redacted object
 */
function redact (target, keywords, replaceVal, config) {
  config = config || {};
  const partial = config.hasOwnProperty('partial') ? config.partial : true;
  const strict = config.hasOwnProperty('strict') ? config.strict : true;

  if (!isObject(target)) {
    // If it's not an object then it's a primitive. Nothing to redact.
    return target;
  } else if (isArray(target)) {
    // Create a new array with each value having been redacted
    // Redact each value of the array.
    return target.map((val) => redact(val, keywords, replaceVal, config));
  } else if (isPlainObject(target)) {
    return Object.keys(target).reduce((newObj, key) => {
      const isMatch = isKeywordMatch(keywords, key, strict, partial);
      if (isMatch) {
        newObj[key] = replaceVal || '[ REDACTED ]';
      } else {
        newObj[key] = redact(target[key], keywords, replaceVal, config);
      }
      return newObj;
    }, {});
  }
  // Redaction only works on arrays, plain objects, and primitives.
  throw new Error('Unsupported value for redaction');
}

module.exports = redact;
