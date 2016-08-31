'use strict';

const assign = require('lodash/assign');
const some = require('lodash/some');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');

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
  if (isArray(target)) {
    return target.map((val) => {
      if (isObject(val))
        return redact(val, keywords, replaceVal);
      }
      return val;
    });
  }

  const replace = replaceVal || '[ REDACTED ]';
  const targetCopy = assign({}, target);
  for (const x in targetCopy) {
    const isMatch = isKeywordMatch(keywords, x);
    if (isMatch) {
      targetCopy[x] = replace;
    } else if (isObject(targetCopy[x]))
      targetCopy[x] = redact(targetCopy[x], keywords, replaceVal);
    }
  }

  return targetCopy;
}

module.exports = redact;
