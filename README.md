# Redact Object

[![Build Status](https://travis-ci.org/shaunburdick/redact-object.svg?branch=master)](https://travis-ci.org/shaunburdick/redact-object) [![Coverage Status](https://coveralls.io/repos/github/shaunburdick/redact-object/badge.svg?branch=master)](https://coveralls.io/github/shaunburdick/redact-object?branch=master) [![npm version](https://badge.fury.io/js/redact-object.svg)](https://badge.fury.io/js/redact-object) [![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

A javascript object redactor. So I like to output any configurations when my app starts up. Problem is if you have any passwords or other info you don't want in the log you have to clear it out beforehand.

## Usage

Pass in an object and an array of members you want to redact. It will recursively travel the object redacting any matching members.

```javascript
const redact = require('redact-object');

var obj = {
  foo: 'bar',
  fizz: {
    foo: 'oof',
    key: 'value'
  },
  buzz: [
    // it can do arrays too
    { foo: 'bar' },
    22
  ]
};

/**
 * Results in:
 * {
 *   foo: '[ REDACTED ]',
 *   fizz: {
 *     foo: '[ REDACTED ]',
 *     key: 'value'
 *   },
 *   buzz: [
 *     // it can do arrays too
 *     { foo: '[ REDACTED ]' },
 *     22
 *   ]
 * }
 */
console.dir(redact(obj, ['foo']));
```

## Arguments

- {object}          `target`     The target object to scan for redactable items
- {string[]}        `keywords`   A list of members to redact
- {string|Function} `replaceVal` Optional custom replace value, or function that returns replace value. Default value is **[ REDACTED ]**
- {object}          `config`     Option object of config settings:
  - partial: boolean, will do partial matching if true, Default _false_
  - strict:  boolean, will do strict comparison (case sensitive) if true, Default _true_
  - ignoreUnknown:  boolean, will do strict comparison (case sensitive) if true, Default _false_

### Replace Function

`replaceVal` can be a function. This function will get two arguments `(value, key)`:

- `value`: The value of the object
- `key`: The matched key

Your function's return will replace the value on the new object

#### Example

```javascript
const obj = {
   firstname: 'Han',
   lastname: 'Solo',
};

const replacer =  val => `[ REDACTED (${val.length}) ]`;
const redacted = redact(obj, ['firstname', 'lastname'], replacer);

/**
 * Results in:
 * {
 *   firstname: '[ REDACTED (3) ]',
 *   lastname: '[ REDACTED (4) ]',
 * };
 */
```

## Contributing

1. Create a new branch, please don't work in master directly.
2. Add failing tests for the change you want to make. Run `npm test` to see the tests fail.
3. Fix stuff.
4. Run `npm test` to see if the tests pass. Repeat steps 2-4 until done.
5. Update the documentation to reflect any changes.
6. Push to your fork and submit a pull request.
