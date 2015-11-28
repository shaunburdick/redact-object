# Redactor
A javascript object redactor. So I like to output any configurations when my app starts up. Problem is if you have any passwords or other info you don't want in the log you have to clear it out beforehand.

## Usage
Pass in an object and an array of members you want to redact. It will recursively travel the object redacting any matching members.

```
const redactor = require('redactor');

var obj = {
  foo: 'bar',
  fizz: {
    foo: 'oof',
    key: 'value'
  }
};

/**
 * Results in:
 * {
 *   foo: '[ REDACTED ]',
 *   fizz: {
 *     foo: '[ REDACTED ]',
 *     key: 'value'
 *   }
 * }
 */
console.dir(redactor(obj), ['foo']);
```

## Arguments
- {object}   target     The target object to scan for redactable items
- {string[]} keywords   A list of members to redact
- {string}   replaceVal Optional custom replace value

## Contributing
1. Create a new branch, please don't work in master directly.
2. Add failing tests for the change you want to make. Run `npm test` to see the tests fail.
3. Fix stuff.
4. Run `npm test` to see if the tests pass. Repeat steps 2-4 until done.
5. Check code coverage `npm run coverage` and add test paths as needed.
6. Update the documentation to reflect any changes.
7. Push to your fork and submit a pull request.
