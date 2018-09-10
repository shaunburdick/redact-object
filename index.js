'use strict';

const isPlainObject = require('lodash.isplainobject');

// Yoinked from lodash to save dependencies
function isObject (value) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

/**
 * Checks for match
 * @param  {string[]} keywords A list of keywords to look for
 * @param  {string}   key      The string to check
 * @param  {boolean}  strict   Use strict case if true
 * @param  {boolean}  partial  Use partial matching if true
 * @return {boolean}           True for match or false
 */
function isKeywordMatch (keywords, key, strict, partial) {
  return keywords.some(keyword => {
    const keyMatch = strict ? key : key.toLowerCase();
    const keywordMatch = strict ? keyword : keyword.toLowerCase();

    return partial
      ? keyMatch.indexOf(keywordMatch) !== -1
      : keyMatch === keywordMatch;
  });
}

/**
 * Parses an object and redacts any keys listed in keywords
 *
 * @param  {object}            target     The target object to scan for redactable items
 * @param  {string[]}          keywords   A list of members to redact
 * @param  {string|function}   replaceVal Optional custom replace value or function replacer
 * @param  {object}            config     Optional config
 *                                        {
 *                                          partial: boolean, do partial matches, default false
 *                                          strict: boolean, do strict key matching, default true
 *                                          ignoreUnknown: boolean, ignore unknown types instead of error, default false
 *                                        }
 * @return {object}                       the new redacted object
 */
function redact (target, keywords, replaceVal, config) {
  config = config || {};
  const partial = config.hasOwnProperty('partial') ? config.partial : true;
  const strict = config.hasOwnProperty('strict') ? config.strict : true;
  const ignoreUnknown = config.hasOwnProperty('ignoreUnknown') ? config.ignoreUnknown : false;

  if (!isObject(target)) {
    // If it's not an object then it's a primitive. Nothing to redact.
    return target;
  } else if (Array.isArray(target)) {
    // Create a new array with each value having been redacted
    // Redact each value of the array.
    return target.map(val => redact(val, keywords, replaceVal, config));
  } else if (isPlainObject(target)) {
    return Object.keys(target).reduce((newObj, key) => {
      const isMatch = isKeywordMatch(keywords, key, strict, partial);
      if (isMatch) {
        newObj[key] =
          typeof replaceVal === 'function'
            ? replaceVal(target[key], key)
            : replaceVal || '[ REDACTED ]';
      } else {
        newObj[key] = redact(target[key], keywords, replaceVal, config);
      }
      return newObj;
    }, {});
  }
  // Redaction only works on arrays, plain objects, and primitives.
  if (ignoreUnknown) {
    // ignore the unknown type instead of throwing an error
    return target;
  } else {
    throw new Error('Unsupported value for redaction');
  }
}

module.exports = redact;
