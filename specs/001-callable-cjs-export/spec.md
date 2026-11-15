# Feature 001: Callable CommonJS entry point (v5.0.0)

> Version: 1.0
> Last Updated: 2026-11-15
> Status: In Review
> Dependencies: None

## Problem Statement

`require('redact-object')` returns `{ default: [Function: redact] }`, so the
README's own usage (`const redact = require('redact-object'); redact(...)`)
throws `TypeError: redact is not a function`; Node ESM
`import redact from 'redact-object'` fails the same way (issue #21). The package
is published as a single CommonJS build whose default export is emitted as
`exports.default`. A consumer should receive the function itself from both
`require` and `import`, with the public types still available.

## Done when

A clean checkout passes `npm test` on Node 20.9.0, 22, 24 and 26, and passes
`npm run lint:pkg` plus `npm run smoke:pack` on Node 24; installing the packed
tarball into throwaway CommonJS and ESM projects returns the function from
`require('redact-object')` and from `import redact from 'redact-object'`.

## Functional Requirements

- **FR-001**: `require('redact-object')` returns the redact function itself; calling it redacts with no `.default` step.
- **FR-002**: Node ESM `import redact from 'redact-object'` resolves to the same callable function.
- **FR-003**: The published declarations expose `ConfigOptions` and `ReplaceFunction` as members of the exported function (`redact.ConfigOptions`, `redact.ReplaceFunction`); the call signature and its return type are unchanged from 4.0.4.
- **FR-004**: Redaction behaviour, option defaults and the `[ REDACTED ]` replacement value are unchanged from 4.0.4.
- **FR-005**: The package publishes one CommonJS build, reached through `main`, `types` and an `exports` map whose `types`, `require`, `import` and `default` conditions all point at that build. No ESM build, no dual package, no subpath exports.
- **FR-006**: The Node engine floor stays `^20.9.0 || >=22.0.0` and the only runtime dependency stays `lodash.isplainobject`.
- **FR-007**: Build, lint and behaviour tests run against the built output on Node 20.9.0, 22, 24 and 26.
- **FR-008**: A release is blocked unless strict publint, attw with no ignore rules, and a pack-smoke over the packed tarball all pass.
- **FR-009**: The release is 5.0.0, and the README's usage block plus a migration section, and AGENTS.md's command and testing sections, describe the entry point and commands that now exist.

## Acceptance Criteria

- [ ] **AC-001**: `require` returns the function that redacts. `npm run build && node -e "const r=require('./dist/index.js'); console.log(typeof r, JSON.stringify(r({foo:'bar',secret:'x'},['secret'])))"` → `function {"foo":"bar","secret":"[ REDACTED ]"}`
- [ ] **AC-002**: ESM default import returns the same function. `npm run build && node --input-type=module -e "import r from './dist/index.js'; console.log(typeof r, JSON.stringify(r({foo:'bar',secret:'x'},['secret'])))"` → `function {"foo":"bar","secret":"[ REDACTED ]"}`
- [ ] **AC-003**: `.default` is gone. `npm run build && node -p "require('./dist/index.js').default"` → `undefined`
- [ ] **AC-004**: Behaviour matches 4.0.4 on the README example. `npm run build && node -e "const r=require('./dist/index.js'); const o={foo:'bar',fizz:{foo:'oof',key:'value'},buzz:[{foo:'bar'},22]}; console.log(JSON.stringify(r(o,['foo'])))"` → `{"foo":"[ REDACTED ]","fizz":{"foo":"[ REDACTED ]","key":"value"},"buzz":[{"foo":"[ REDACTED ]"},22]}`
- [ ] **AC-005**: The suite runs on `node:test` against `dist/`, is green, and still reports exactly twelve tests. `npm test; echo "exit $?"` → `exit 0`; `node --test --test-reporter=tap 2>&1 | grep -E '^# (tests|fail) '` → `# tests 12` then `# fail 0` (eleven ported cases plus the CommonJS interop check).
- [ ] **AC-006**: A packed install type-checks for both consumer styles. `npm run build && npm run smoke:pack; echo "exit $?"` prints `pack-smoke: cjs ok`, `pack-smoke: esm ok`, `pack-smoke: types ok`, `pack-smoke: ok`, then `exit 0` (the types step compiles a `import redact = require(...)` consumer and an ESM default-import consumer that name `redact.ConfigOptions` and `redact.ReplaceFunction`).
- [ ] **AC-007**: Packaging gates pass with no ignore rules. `npm run build && test ! -f .attw.json && npm run lint:pkg; echo "exit $?"` → `exit 0`
- [ ] **AC-008**: One build, one entry point. `npm run build && ls dist` → `index.d.ts` then `index.js`; `node -p "Object.keys(require('./package.json').exports['.']).join(',')"` → `types,require,import,default`; `node -p "Object.values(require('./package.json').exports['.']).join(' ')"` → `./dist/index.d.ts ./dist/index.js ./dist/index.js ./dist/index.js`
- [ ] **AC-009**: Version, floor and runtime dependency are as specified. `node -p "require('./package.json').version"` → `5.0.0`; `node -p "JSON.stringify(require('./package.json').engines)"` → `{"node":"^20.9.0 || >=22.0.0"}`; `node -p "JSON.stringify(require('./package.json').dependencies)"` → `{"lodash.isplainobject":"^4.0.6"}`
- [ ] **AC-010**: CI covers the engine matrix and gates the publish on every cell. `grep -c 'node-version: \[20.9.0, 22.x, 24.x, 26.x\]' .github/workflows/test.yml .github/workflows/publish.yml` → `.github/workflows/test.yml:1` then `.github/workflows/publish.yml:1`; `grep -c 'needs: \[test, package\]' .github/workflows/publish.yml` → `1`
- [ ] **AC-011**: A 4.x user is told what changes. `grep -c '^## Migrating from 4.x' README.md` → `1`; `grep -l 'redact.ConfigOptions' README.md AGENTS.md` → `README.md` then `AGENTS.md`; `grep -ric 'jest' README.md AGENTS.md package.json` → `README.md:0`, `AGENTS.md:0`, `package.json:0`

## Not doing

- No ESM build, no dual-package layout, no `module-sync` condition, no `"type": "module"`.
- No engine change; no API addition, option, or signature change; no `[ REDACTED ]` change.
- No `.default` compatibility shim, and no subpath exports: direct deep imports such as `redact-object/dist/index.js` stop resolving.
- No README rewrite beyond the usage block and the migration section; no changelog file.
- No governance documents, and no CI refactor beyond the `package` job and the publish `test` matrix this release gate needs.
- No dependency bump unrelated to the gates; no version bump in this planning pass.

## Edge Cases

- **A 4.x consumer calling `.default`**: breaks on purpose. That removal is the major-version change, and the migration section names it.
- **TypeScript default import without `esModuleInterop`**: in CJS/node10 resolution this reports TS1259; use `import redact = require('redact-object')`. With `allowSyntheticDefaultImports` it compiles, emits `require('redact-object').default(...)`, and fails at runtime because `.default` is gone. Under `nodenext` it compiles and works (ESM import of a CJS module). The migration note names the CJS outcomes.
- **Root-level named type imports**: `import type { ConfigOptions } from 'redact-object'` still type-checks under node10, node16 and bundler resolution; it is not a breaking change. The documented form becomes `redact.ConfigOptions`.
- **Lint before build**: the tests import `../dist/index.js`, so `npm run lint` needs a prior build. `npm test` builds first via `pretest`; CI builds before linting.
- **Node 20 test reporter**: piped output is TAP there and spec on 24+, so criteria assert the exit status or force `--test-reporter=tap`.

## Open Questions

None.
