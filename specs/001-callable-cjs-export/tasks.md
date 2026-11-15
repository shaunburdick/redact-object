# Tasks: Callable CommonJS entry point (v5.0.0)

Seven tasks, in dependency order. Each names the files it touches and the
command that proves it on its own commit.

---

## [ ] T001 — Emit the callable export shape

**Files**: `src/index.ts`, `eslint.config.mjs`

Remove `export default`; declare `function redact(...)` with the existing JSDoc
and body unchanged, move `ReplaceFunction` and `ConfigOptions` inside
`declare namespace redact`, and end the file with `export = redact`. Keep the
existing `any` disable comment attached to `ReplaceFunction`. Add one scoped
override in `eslint.config.mjs` for `src/index.ts`:
`'@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }]`,
with the reason as its comment. Non-declaration namespaces must still error.

**Prove**:

```sh
npm run build && node -e "const r=require('./dist/index.js'); console.log(typeof r, JSON.stringify(r({foo:'bar',secret:'x'},['secret'])))"
# function {"foo":"bar","secret":"[ REDACTED ]"}

npm run lint; echo "exit $?"
# exit 0
```

**Covers**: FR-001, FR-002, FR-003, FR-004; AC-001, AC-002, AC-003, AC-004.
**Depends on**: nothing.

---

## [ ] T002 — Run the suite on node:test against dist

**Files**: `test/unit.test.mjs` (new), `test/cjs-interop.test.mjs` (new),
`src/__tests__/index.test.ts` (delete), `jest.config.js` (delete),
`package.json` (`test`, `pretest`, `test:unit` scripts)

Port every case in the deleted Jest file one-for-one, with the same assertions
(eleven cases; the run reports twelve tests with the interop check). Tests
import `../dist/index.js`; `test/cjs-interop.test.mjs` holds exactly one test
and uses `createRequire(import.meta.url)`, not `require()`. Scripts become
`"test": "npm run lint && npm run test:unit"`, `"pretest": "npm run build"`,
`"test:unit": "node --test"`; `jest`, `ts-jest` and `@types/jest` stay in
`package.json` until T003.

**Prove**:

```sh
npm test; echo "exit $?"
# exit 0

node --test --test-reporter=tap 2>&1 | grep -E '^# (tests|fail) '
# # tests 12
# # fail 0
```

**Covers**: FR-007; AC-005.
**Depends on**: T001.

---

## [ ] T003 — Publish one CommonJS package at 5.0.0

**Files**: `package.json`, `package-lock.json`, `tsconfig.json`,
`tsconfig.build.json` (delete), `eslint.config.mjs` (drop the `jest.config.js`
and `coverage/**` ignores)

`package.json`: add `"type": "commonjs"`; replace `typings` with `types`; add
the `exports` map (`types`, `require`, `import`, `default` → the two `dist/`
files, in that order); set `main` to `./dist/index.js` and `types` to
`./dist/index.d.ts`; keep `files`, `engines` and the runtime dependency as they
are; run `npm version 5.0.0 --no-git-tag-version`; remove the Jest devDeps with
`npm uninstall` and add `publint` and `@arethetypeswrong/cli` with
`npm install --save-dev`; add `"lint:pkg": "publint --strict && attw --pack ."`.
`tsconfig.json`: add `"files": ["src/index.ts"]` and `"rootDir": "src"`, point
`build:transpile` at it, delete `tsconfig.build.json`.

**Prove**:

```sh
npm run build && ls dist
# index.d.ts
# index.js

npm test; echo "exit $?"
# exit 0

npm run lint:pkg; echo "exit $?"
# exit 0

node -p "JSON.stringify(require('./package.json').exports['.'])"
# {"types":"./dist/index.d.ts","require":"./dist/index.js","import":"./dist/index.js","default":"./dist/index.js"}
```

**Covers**: FR-003, FR-005, FR-006; AC-007, AC-008, AC-009.
**Depends on**: T001, T002.

---

## [ ] T004 — Add the pack-smoke gate

**Files**: `scripts/pack-smoke.mjs` (new), `package.json` (`smoke:pack`
script)

The script packs to a temp directory, installs the tarball into two throwaway
projects (`.cjs` and `.mjs`), asserts `typeof redact === 'function'`, the
redacted object and `redact.default === undefined` in CommonJS, then compiles
one `import = require` consumer and one ESM default-import consumer with the
repository's `tsc`; both name `redact.ConfigOptions` and
`redact.ReplaceFunction`. It prints one line per check and cleans up in
`finally`. Import `process` from `node:process`: the lint config defines no
Node globals for `.mjs`.

**Prove**:

```sh
npm run build && npm run smoke:pack
# pack-smoke: cjs ok
# pack-smoke: esm ok
# pack-smoke: types ok
# pack-smoke: ok

npm run lint; echo "exit $?"
# exit 0
```

**Covers**: FR-008; AC-006.
**Depends on**: T003.

---

## [ ] T005 — Gate the test workflow

**Files**: `.github/workflows/test.yml`

Set the matrix to `node-version: [20.9.0, 22.x, 24.x, 26.x]` and keep checkout,
setup-node with npm cache, `npm ci`, `npm run build`, `npm test` per cell. Add
a `package` job on Node 24.x running `npm ci`, `npm run build`,
`npm run lint:pkg`, `npm run smoke:pack`.

**Prove**:

```sh
grep -c 'node-version: \[20.9.0, 22.x, 24.x, 26.x\]' .github/workflows/test.yml
# 1

grep -c 'npm run smoke:pack' .github/workflows/test.yml
# 1
```

The authoritative proof is the workflow run on this branch, green in both
jobs (see the plan's verification step 8).

**Covers**: FR-007, FR-008; AC-010.
**Depends on**: T003, T004.

---

## [ ] T006 — Make publish depend on the gates

**Files**: `.github/workflows/publish.yml`

Give the `test` job the same `node-version: [20.9.0, 22.x, 24.x, 26.x]` matrix,
add a `package` job with the same four steps as T005's, and change the publish
job to `needs: [test, package]`. Keep the existing version-check and publish
steps untouched.

**Prove**:

```sh
grep -c 'node-version: \[20.9.0, 22.x, 24.x, 26.x\]' .github/workflows/publish.yml
# 1

grep -c 'needs: \[test, package\]' .github/workflows/publish.yml
# 1

grep -c 'npm run lint:pkg' .github/workflows/publish.yml
# 1
```

**Covers**: FR-008; AC-010.
**Depends on**: T005.

---

## [ ] T007 — Document the migration

**Files**: `README.md`, `AGENTS.md`

README: keep the usage example and add the ESM import line beside the
`require` line; add `## Migrating from 4.x` with the three facts (drop
`.default`; types are reached as `redact.ConfigOptions` /
`redact.ReplaceFunction`, and root-level named type imports still resolve; a
default import without `esModuleInterop` reports TS1259 in CJS resolution —
with `allowSyntheticDefaultImports` it compiles to `.default(...)` and fails
at runtime, while `nodenext` compiles and works — so enable `esModuleInterop`
or use `import = require` when targeting CJS) and
one line saying behaviour and options are unchanged. AGENTS.md: replace the
Jest commands and testing conventions with `node:test` on `dist/`, list
`npm run lint:pkg` and `npm run smoke:pack`, describe the `export =` shape and
namespace types, and update the supported Node versions and ESLint ignores.
No other prose changes.

**Prove**:

```sh
grep -c '^## Migrating from 4.x' README.md
# 1

grep -ric 'jest' README.md AGENTS.md package.json
# README.md:0
# AGENTS.md:0
# package.json:0
```

**Covers**: FR-009; AC-011.
**Depends on**: T003.
