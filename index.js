'use strict';

const assign = require('lodash/assign');
const some = require('lodash/some');

function isKeywordMatch(keywords, key) {
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
function redact(target, keywords, replaceVal) {
  const replace = replaceVal || '[ REDACTED ]';
  const targetCopy = assign({}, target);
  for (const x in targetCopy) {
    const isMatch = isKeywordMatch(keywords, x);
    if (isMatch) {
      targetCopy[x] = replace;
    } else if (targetCopy[x] === Object(targetCopy[x])) {
      targetCopy[x] = redact(targetCopy[x], keywords, replaceVal);
    }
  }

  return targetCopy;
}

module.exports = redact;
