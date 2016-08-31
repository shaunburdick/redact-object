'use strict';

const assign = require('lodash/assign');

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
    if (keywords.indexOf(x) > -1) {
      targetCopy[x] = replace;
    } else if (targetCopy[x] === Object(targetCopy[x])) {
      targetCopy[x] = redact(targetCopy[x], keywords);
    }
  }

  return targetCopy;
}

module.exports = redact;
