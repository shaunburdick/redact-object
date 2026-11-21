import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import redact from '../dist/index.js';

const testConfig = {
    foo: 'bar',
    fizz: {
        foo: 'bar'
    },
    derp: 'poo',
    'auth-token': 'foo',
    array: [
        {
            foo: 'bar'
        },
        5
    ]
};

const redactVal = '[ REDACTED ]';

const func = () => 'not redacted';

describe('Redact Config', () => {
    it('should redact values of foo', () => {
        const redacted = redact(testConfig, ['foo']);
        assert.equal(redacted.foo, redactVal);
        assert.equal(redacted.fizz.foo, redactVal);
        assert.equal(Array.isArray(redacted.array), true);
        assert.deepEqual(redacted.array, [
            {
                foo: redactVal
            },
            5
        ]);
    });

    it('should not redact unmatched keys', () => {
        const redacted = redact(testConfig, ['no-match']);
        assert.deepEqual(redacted, testConfig);
    });

    it('should use a custom value', () => {
        const customVal = 'poop';
        const redacted = redact(testConfig, ['foo'], customVal);
        assert.equal(redacted.foo, customVal);
    });

    it('should not alter original object', () => {
        const origValue = testConfig.foo;
        redact(testConfig, ['foo']);
        assert.equal(testConfig.foo, origValue);
    });

    it('should match partial strings', () => {
        const redacted = redact(testConfig, ['token']);
        assert.equal(redacted['auth-token'], redactVal);
    });

    it('should not match partial strings if configured', () => {
        const origValue = testConfig['auth-token'];
        const redacted = redact(testConfig, ['token'], redactVal, {
            partial: false
        });
        assert.equal(redacted['auth-token'], origValue);
    });

    it('should be case-sensitive', () => {
        const origValue = testConfig.foo;
        const redacted = redact(testConfig, ['FOO']);
        assert.equal(redacted.foo, origValue);
    });

    it('should be case-insensitive if configured', () => {
        const redacted = redact(testConfig, ['FOO'], redactVal, {
            strict: false
        });
        assert.equal(redacted.foo, redactVal);
        assert.equal(redacted.fizz.foo, redactVal);
    });

    it('should throw with non-plain object', () => {
        assert.throws(() => {
            redact(new Map(), ['FOO']);
        }, { message: 'Unsupported value type for redaction: object (not plain)' });
    });

    it('should not throw with function and `ignoreUnknown` is true', () => {
        const redacted = redact(func, ['FOO'], 'REDACTED', {
            ignoreUnknown: true
        });
        assert.equal(redacted, func);
    });

    it('should accept a function to replace value', () => {
        const redacted = redact(testConfig, ['foo'], (value, key) => `Redacted ${key} (${value.length})`);
        assert.equal(redacted.foo, 'Redacted foo (3)');
    });
});
