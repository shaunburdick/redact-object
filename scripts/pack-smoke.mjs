import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const tsc = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const packageName = 'redact-object';
const typesFile = 'consumer.ts';

const cjsRuntime = `const assert = require('node:assert/strict');
const redact = require('${packageName}');

assert.equal(typeof redact, 'function');
assert.deepEqual(redact({ foo: 'bar', secret: 'x' }, ['secret']), { foo: 'bar', secret: '[ REDACTED ]' });
assert.equal(redact.default, undefined);
`;

const esmRuntime = `import assert from 'node:assert/strict';
import redact from '${packageName}';

assert.equal(typeof redact, 'function');
assert.deepEqual(redact({ foo: 'bar', secret: 'x' }, ['secret']), { foo: 'bar', secret: '[ REDACTED ]' });
assert.equal(redact.default, undefined);
`;

const cjsTypes = `import redact = require('${packageName}');

const config: redact.ConfigOptions = { partial: false };
const replacer: redact.ReplaceFunction = (value, key) => \`\${key}:\${String(value)}\`;
const redacted = redact({ foo: 'bar' }, ['foo'], replacer, config);

export = redacted;
`;

const esmTypes = `import redact from '${packageName}';

const config: redact.ConfigOptions = { partial: false };
const replacer: redact.ReplaceFunction = (value, key) => \`\${key}:\${String(value)}\`;
const redacted = redact({ foo: 'bar' }, ['foo'], replacer, config);

export default redacted;
`;

function project(root, name) {
    const directory = path.join(root, name);
    mkdirSync(directory);
    writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name, private: true }));
    return directory;
}

function install(tarball, directory) {
    execFileSync('npm', ['install', '--no-save', '--no-audit', '--no-fund', '--no-package-lock', tarball], {
        cwd: directory,
        stdio: 'ignore',
    });
}

function run(directory, file) {
    execFileSync(process.execPath, [file], { cwd: directory, stdio: 'inherit' });
}

function compile(directory, file, moduleOptions) {
    execFileSync(process.execPath, [tsc, '--noEmit', '--strict', '--skipLibCheck', ...moduleOptions, file], {
        cwd: directory,
        stdio: 'inherit',
    });
}

const workspace = mkdtempSync(path.join(tmpdir(), 'redact-object-pack-smoke-'));

try {
    const tarball = execFileSync('npm', ['pack', '--pack-destination', workspace], {
        cwd: repoRoot,
        encoding: 'utf8',
    }).trim().split('\n').pop();
    const tarballPath = path.join(workspace, tarball);

    const cjs = project(workspace, 'cjs-consumer');
    install(tarballPath, cjs);
    writeFileSync(path.join(cjs, 'consumer.cjs'), cjsRuntime);
    run(cjs, 'consumer.cjs');
    process.stdout.write('pack-smoke: cjs ok\n');

    const esm = project(workspace, 'esm-consumer');
    install(tarballPath, esm);
    writeFileSync(path.join(esm, 'consumer.mjs'), esmRuntime);
    run(esm, 'consumer.mjs');
    process.stdout.write('pack-smoke: esm ok\n');

    writeFileSync(path.join(cjs, typesFile), cjsTypes);
    compile(cjs, typesFile, ['--target', 'es2019', '--module', 'commonjs', '--moduleResolution', 'node']);

    writeFileSync(path.join(esm, typesFile), esmTypes);
    compile(esm, typesFile, ['--target', 'esnext', '--module', 'nodenext', '--moduleResolution', 'nodenext']);

    process.stdout.write('pack-smoke: types ok\n');
    process.stdout.write('pack-smoke: ok\n');
} finally {
    rmSync(workspace, { recursive: true, force: true });
}
