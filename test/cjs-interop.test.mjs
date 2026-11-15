import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { it } from 'node:test';

const require = createRequire(import.meta.url);

it('should be callable through require', () => {
    const redact = require('../dist/index.js');
    assert.equal(typeof redact, 'function');
    assert.deepEqual(redact({ foo: 'bar', secret: 'x' }, ['secret']), { foo: 'bar', secret: '[ REDACTED ]' });
    assert.equal(redact.default, undefined);
});
