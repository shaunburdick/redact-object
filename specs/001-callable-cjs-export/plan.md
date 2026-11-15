# Plan: Callable CommonJS entry point (v5.0.0)

> Feature: `specs/001-callable-cjs-export/spec.md`
> Branch: `fix/21-callable-cjs-export`

## Technical context

- Node floor `^20.9.0 || >=22.0.0`; CI matrix 20.9.0, 22.x, 24.x, 26.x.
- TypeScript 5.9.3, `target: es5`, `module: commonjs`, `strict`, `declaration`, `esModuleInterop`.
- Build: `tsc` to `dist/`; published files are `dist/index.js` and `dist/index.d.ts`.
- Lint: eslint 9 with `eslint-config-shaunburdick` 6.0.3 (same version as the sketch).
- Packaging gates: `publint` 0.3.25 (`--strict`) and `@arethetypeswrong/cli` 0.18.5.
- Tests: `node:test` + `node:assert/strict`, plain `.mjs`, importing the built `dist/`.
- Single runtime dependency: `lodash.isplainobject@^4.0.6`.

## Constraints this change must respect

No constitution file: this is a single-function library, and the constraints
that bind this change are:

1. The published artifact is the product. Every claim is checked against a
   packed install, not only against `dist/` in the working tree.
2. The Node floor, the ES5 emit and the single runtime dependency do not move.
3. Behaviour does not change; only how the module is exported changes.
4. No inline lint suppressions are added. The one existing `any` disable on
   `ReplaceFunction` moves with the type; the namespace rule is configured in
   `eslint.config.mjs`, not silenced in code.

## Project structure

```
eslint.config.mjs                  namespace override; drop stale ignores
package.json, package-lock.json    type, main, types, exports, version, scripts, devDeps
tsconfig.json                      files: ["src/index.ts"]; build target
tsconfig.build.json, jest.config.js, src/__tests__/index.test.ts   deleted
src/index.ts                       export = function + namespace
test/unit.test.mjs, test/cjs-interop.test.mjs   behaviour suite + require check
scripts/pack-smoke.mjs             packed-install gate
.github/workflows/test.yml, publish.yml   matrix + package job; publish needs both
README.md, AGENTS.md               usage/migration; commands, testing, export shape
```

`specs/001-callable-cjs-export/` holds this plan, the spec and the tasks.

## Key decisions

| # | Decision | Alternatives rejected | Why |
|---|---|---|---|
| 1 | `function redact(...)` merged with `declare namespace redact` and `export = redact` | Document `.default` (does not fix #21); a separate `module.exports` interop export (needs ESM-only and Node 22.12) | Emits `module.exports = redact`; one artifact serves `require` and `import` on the current floor |
| 2 | One CJS build, `"type": "commonjs"`, and an `exports` map with `types`/`require`/`import`/`default` all pointing at it | Dual ESM/CJS build | A single function gains nothing from two builds; dual layout doubles the type surface and the failure modes; `type` states the format and clears publint's suggestion for it |
| 3 | `node:test` against `dist/` | Keep Jest + ts-jest (tests import `src/`, so the published artifact is never exercised); Vitest (extra dependency, same gap) | Removes three devDependencies and tests exactly what ships |
| 4 | Packaging gates in a separate `package` CI job on Node 24; build/tests on 20.9.0/22/24/26 | Gates in every matrix cell (four tarball installs per run); no gates (#21 shipped because nothing checked the packed artifact) | Resolution and packaging do not vary by engine, so one cell is enough; the spec's *Done when* says Node 24 for these two commands, and the matrix still runs the tests on all four |
| 5 | `main` + `types` + `files: [dist/index.js, dist/index.d.ts]`; `typings` replaced by `types` | Keeping both `types` and `typings` | `types` is the canonical field; same file, no consumer impact |
| 6 | `test`: `npm run lint && npm run test:unit`, `pretest`: `npm run build`, `test:unit`: `node --test` | `node --test test/` (the sketch's script; fails on Node 24 with `MODULE_NOT_FOUND`); explicit file globs (shell-dependent on Windows) | Bare `--test` discovers `test/*.test.mjs` on Node 20 and later |
| 7 | Drop `tsconfig.build.json`; `tsconfig.json` gains `files: ["src/index.ts"]` | Two configs that differ only by an `exclude` that matches nothing | One build config; the declaration and JS emit stay in `dist/` |
| 8 | Smoke script also compiles two type consumers with the repository's `tsc` | Rely on attw alone | attw proves resolution, not that `redact.ConfigOptions` is reachable; the namespace is the new public type surface |

## Ownership and release gating

`scripts/pack-smoke.mjs` and the two packaging devDependencies belong to the
repository maintainer: a Dependabot bump that reddens either gate is fixed or
pinned before the next publish, like a red test. Publish runs the
20.9.0/22/24/26 matrix in its `test` job, so any red cell blocks the
merge-triggered publish; `package` stays on Node 24 and `publish` needs both;
a main push runs the matrix twice, the price of not publishing past a red cell.

## Verified premises

Checked in a scratch copy of the target shape (outside the repository) before
writing these criteria:

- `publint 0.3.25 --strict` → `All good!` (exit 0).
- `attw 0.18.5 --pack` → `No problems found`; node10, node16 (CJS), node16 (ESM) and bundler all green.
- TypeScript 5.9.3 resolves `redact.ConfigOptions` and `redact.ReplaceFunction` from `import redact from 'redact-object'` in node10, node16, nodenext and bundler modes, and from `import redact = require('redact-object')` in the CJS modes (node10, node16; it is TS1202 under bundler).
- TypeScript 5.9.3 **still accepts** `import type { ConfigOptions } from 'redact-object'` in all of those modes. The brief's statement that root-level named type imports stop working is not true; see *Planning decisions*.
- TypeScript 5.9.3 default import: `esModuleInterop: false` with node10 reports TS1259; with `allowSyntheticDefaultImports: true` it compiles, emits `.default(...)`, and fails at runtime; under `nodenext` it compiles and works.
- `node --test test/` fails with `Cannot find module .../test` on Node 24.21; bare `node --test` discovers both files. Node 20 prints TAP when piped, Node 24 prints spec, so criteria use the exit status or force `--test-reporter=tap`.
- The packed tarball installs into throwaway `.cjs` and `.mjs` projects; both reproductions print the expected object, `require(...).default` is `undefined`, and both type consumers compile.
- The sketch's suite has four cases; the repository suite has eleven. The port follows the repository suite, not the sketch.

## Planning decisions not covered by the brief

1. **Named type imports do not break.** The migration text says they still
   resolve and points readers at `redact.ConfigOptions`. The major version is
   justified by removing the accidental `.default` export and by the typed
   default-import path changing: without `esModuleInterop` it errors in CJS
   resolution, and with only `allowSyntheticDefaultImports` it compiles to
   `.default(...)` and fails at runtime.
2. **`typings` becomes `types`** (same file, canonical field).
3. **AGENTS.md is updated** with the new commands, test layout and export
   shape. Leaving it naming Jest would point future agents at deleted tooling.
4. **No `research.md`** (the eight premises above cover it), `data-model.md`,
   `contracts/` (the entry point is covered by AC-006/AC-007),
   `quickstart.md`, or `changelog.md` (first version of this spec).
5. **Deep imports are not preserved.** The `exports` map exposes only the
   package root, so `require('redact-object/dist/index.js')` stops resolving.
   No subpath export is added; the spec records this under *Not doing*.

## Verification before publish

Run in order from a clean checkout of the release branch; every step is
binary.

1. `git status --porcelain` → empty; `git branch --show-current` → not `main`.
2. `npm ci` → exit 0 (lockfile agrees with `package.json`).
3. `npm run build && ls dist` → `index.d.ts`, `index.js`.
4. `npm test` → exit 0; `node --test --test-reporter=tap | grep -E '^# (tests|fail) '` → `# tests 12`, `# fail 0`.
5. `npm run lint:pkg` → exit 0; publint `All good!`, attw `No problems found` with four green columns.
6. `npm run smoke:pack` → `pack-smoke: cjs ok`, `esm ok`, `types ok`, `ok`.
7. `npm pack --dry-run` → tarball holds `package.json`, `README.md`, `LICENSE`, `dist/index.js`, `dist/index.d.ts`, nothing else.
8. CI on the branch: `Test` workflow green on 20.9.0, 22.x, 24.x and 26.x, with the `package` job green.
9. After merge: the `Publish` workflow's 20.9.0/22/24/26 `test` matrix and its `package` job pass before `publish`; then `npm install redact-object@5.0.0` in a temp directory and run the issue's `repro.cjs` and `repro.mjs` → `function` and `{ foo: 'bar', secret: '[ REDACTED ]' }` from both.

## Rollback

- **Before merge**: close the branch; nothing is published.
- **After merge, before publish**: revert the merge commit on `main`. The
  publish workflow's version check means a failed gate never publishes.
- **After 5.0.0 is on npm**: publish 5.0.1 from a revert commit, and
  `npm deprecate redact-object@5.0.0 "<reason>"` so installs steer to 5.0.1.
  Do not unpublish: it is time-limited and breaks lockfiles that already
  reference the version. `redact-object@4.0.4` remains installable for anyone
  who needs the old entry point.
- The change reverts as one unit at the merge commit; no data or external
  state is involved.
