import redact from '..';

const testConfig = {
    foo: 'bar',
    fizz: {
        foo: 'bar'
    },
    derp: 'poo',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'auth-token': 'foo',
    array: [
        {
            foo: 'bar'
        },
        5
    ]
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class NonPlainObject {}

const redactVal = '[ REDACTED ]';

describe('Redact Config', () => {
    it('should redact values of foo', () => {
        const redacted = redact(testConfig, ['foo']);
        expect(redacted.foo).toEqual(redactVal);
        expect(redacted.fizz.foo).toEqual(redactVal);
        expect(Array.isArray(redacted.array)).toBe(true);
        expect(redacted.array).toEqual([
            {
                foo: redactVal
            },
            5
        ]);
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

    it('should not alter original object', () => {
        const origValue = testConfig.foo;
        redact(testConfig, ['foo']);
        expect(testConfig.foo).toEqual(origValue);
    });

    it('should match partial strings', () => {
        const redacted = redact(testConfig, ['token']);
        expect(redacted['auth-token']).toEqual(redactVal);
    });

    it('should not match partial strings if configured', () => {
        const origValue = testConfig['auth-token'];
        const redacted = redact(testConfig, ['token'], redactVal, {
            partial: false
        });
        expect(redacted['auth-token']).toEqual(origValue);
    });

    it('should be case-sensitive', () => {
        const origValue = testConfig.foo;
        const redacted = redact(testConfig, ['FOO']);
        expect(redacted.foo).toEqual(origValue);
    });

    it('should be case-insensitive if configured', () => {
        const redacted = redact(testConfig, ['FOO'], redactVal, {
            strict: false
        });
        expect(redacted.foo).toEqual(redactVal);
        expect(redacted.fizz.foo).toEqual(redactVal);
    });

    it('should throw with non-plain object', () => {
        expect(() => {
            const nonPlainObject = new NonPlainObject();
            redact(nonPlainObject, ['FOO']);
        }).toThrow('Unsupported value type for redaction: object (not plain)');
    });

    it('should not throw with function and `ignoreUnknown` is true', () => {
        const func = () => undefined;
        const redacted = redact(func, ['FOO'], 'REDACTED', {
            ignoreUnknown: true
        });
        expect(redacted).toEqual(func);
    });

    it('should accept a function to replace value', () => {
        const redacted = redact(testConfig, ['foo'], (value, key) => `Redacted ${key} (${value.length})`);
        expect(redacted.foo).toEqual('Redacted foo (3)');
    });
});
