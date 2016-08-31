'use strict';

const redact = require(process.env.PWD + '/index');

const testConfig = {
  foo: 'bar',
  fizz: {
    foo: 'bar',
  },
  derp: 'poo',
  'auth-token': 'foo',
};

const redactVal = '[ REDACTED ]';

describe('Redact Config', () => {
  it('should redact values of foo', () => {
    const redacted = redact(testConfig, ['foo']);
    expect(redacted.foo).toEqual(redactVal);
    expect(redacted.fizz.foo).toEqual(redactVal);
  });

  it('should not redact unmatched keys', () => {
    const redacted = redact(testConfig, ['no-match']);
    expect(redacted).toEqual(testConfig);
  });

  it('should use a custom value', () => {
    const customVal = 'poop';
    const redacted = redact(testConfig, ['foo'], customVal);
    expect(redacted.foo).toEqual(customVal);
  });

  it('should not alter orignal object', () => {
    const origValue = testConfig.foo;
    redact(testConfig, ['foo']);
    expect(testConfig.foo).toEqual(origValue);
  });

  it('match partial strings', () => {
    const redacted = redact(testConfig, ['token']);
    expect(redacted['auth-token']).toEqual(redactVal);
  });

  it('should be case-insensitive', () => {
    const redacted = redact(testConfig, ['FOO']);
    expect(redacted.foo).toEqual(redactVal);
    expect(redacted.fizz.foo).toEqual(redactVal);
  });
});
