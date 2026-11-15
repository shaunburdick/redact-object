# Agent Development Guide

This guide is for AI coding agents working in the redact-object repository. It contains essential information about commands, code style, and conventions.

## Project Overview

**redact-object** is a TypeScript library for recursively redacting sensitive properties from JavaScript objects. It's published to npm as a CommonJS module with TypeScript type definitions, loaded by `require` or an ESM default import.

## Build, Test, and Lint Commands

### Core Commands
```bash
npm test              # Run linting + unit tests (run this before commits)
npm run test:unit     # Build, then run node:test against dist/
npm run lint          # Check code with ESLint
npm run lint:fix      # Auto-fix ESLint issues
npm run lint:pkg      # Check the packed artefact with publint --strict and attw
npm run build         # Clean and transpile src/index.ts to dist/
npm run smoke:pack    # Pack, install and exercise the tarball in throwaway projects
```

### Running a Single Test

Tests run on Node's built-in runner against `dist/`, so build first:

```bash
# Run a specific test file
npm run build && node --test test/unit.test.mjs

# Run tests matching a pattern
npm run build && node --test --test-name-pattern "should redact values"
```

`node --test` with no arguments discovers both files in `test/`. Don't pass
`test/` as an argument: Node 24 rejects a directory there.

### Pre-Commit Checklist
Before committing, ensure:
1. `npm test` passes (includes lint + build + unit tests)
2. `npm run lint:pkg` passes
3. `npm run smoke:pack` prints the four `pack-smoke:` lines
4. No TypeScript errors: `npx tsc --noEmit`

## Code Style Guidelines

### Module System and Imports
- **Module Format**: CommonJS (`module: "commonjs"`, `"type": "commonjs"`)
- **Export Shape**: `export = redact`, so the package exports the function itself. Never add `export default`: it compiles to `exports.default` and breaks the documented `require` call (issue #21).
- **Types**: `declare namespace redact` carries `ConfigOptions` and `ReplaceFunction`, reached as `redact.ConfigOptions` and `redact.ReplaceFunction`. Root-level named type imports also resolve.
- **Target**: ES5 for broad compatibility
- **Import Style**: Use ES6 import/export syntax for everything except the public export (TypeScript transpiles to CommonJS)
- **Import Order**: External dependencies first, then local modules
```typescript
import externalPackage from 'external-package';
import localModule from './localModule';
```

### TypeScript Configuration
- **Strict Mode**: Enabled (`"strict": true`)
- **Type Safety**: Maximize type safety; avoid `any` unless necessary
- **Explicit Any**: When `any` is required, disable the rule at the top of the file only:
  ```typescript
  /* eslint-disable @typescript-eslint/no-explicit-any */
  ```
- **Type Declarations**: Always export types and interfaces used in public APIs
- **Type Guards**: Use type guards for runtime type checking (see `isObject` function)

### Formatting
- **Indentation**: 4 spaces (configured in `.editorconfig`)
- **Line Endings**: LF (Unix-style)
- **Final Newline**: Always include final newline in files
- **Quotes**: Single quotes for strings
- **Semicolons**: Required

### Naming Conventions
- **Functions**: camelCase (`isKeywordMatch`, `redact`)
- **Interfaces/Types**: PascalCase (`ConfigOptions`, `ReplaceFunction`)
- **Variables**: camelCase (`replaceVal`, `testConfig`)
- **Constants**: camelCase (not SCREAMING_SNAKE_CASE)
- **Special Cases**: Use `// eslint-disable-next-line @typescript-eslint/naming-convention` for non-standard keys like `'auth-token'`

### Function Documentation
Document all exported functions with JSDoc:
```typescript
/**
 * Brief description of what the function does
 *
 * @param  paramName  Description of parameter
 * @param  optional   Optional parameter description
 * @return            What the function returns
 */
export function myFunction(paramName: string, optional?: boolean): ReturnType {
    // implementation
}
```

### Error Handling
- **Validation**: Validate inputs and throw descriptive errors
- **Error Messages**: Include context in error messages:
  ```typescript
  throw new Error(`Unsupported value type for redaction: ${targetType}`);
  ```
- **Type Guards**: Check types before operations to avoid runtime errors

### Testing Conventions
- **Location**: Tests in the `test/` directory
- **Naming**: `*.test.mjs` suffix
- **Framework**: Node's built-in `node:test` with `node:assert/strict`
- **Target**: Import `../dist/index.js`, never `src/`; `test:unit` builds first so the tests always see current output
- **Import interop**: Use `createRequire(import.meta.url)` when a test needs CommonJS `require`; a `.cjs` test file does not pass the shared lint config
- **Structure**: Use `describe` blocks to group related tests
- **Assertions**: Use descriptive test names: `it('should redact values of foo', ...)`
- **Test Data**: Define test fixtures at the top of test files
- **Immutability**: Always test that original objects are not mutated

### Code Organization
- **Main Export**: `export = redact` — the package exports one function
- **Types**: `ConfigOptions` and `ReplaceFunction` live in the `redact` declaration namespace
- **File Structure**: Keep related functions in same file; extract to separate modules when file exceeds 200 lines
- **Recursion**: Use recursion for tree traversal (as in `redact` function)

### ESLint Configuration
- **Base Config**: Uses `eslint-config-shaunburdick` (v6.0.2)
- **Applies To**: JavaScript, TypeScript and `.mjs` files
- **Ignores**: `dist/**`, `coverage/**`
- **Namespaces**: `src/index.ts` allows declaration-only namespaces, which `export =` needs; a runtime namespace is still an error everywhere
- **Never Disable Rules**: Fix code to comply with rules; don't disable linters inline unless absolutely necessary and documented

### Common Patterns in This Codebase

#### Type Narrowing with Guards
```typescript
function isObject(value: unknown): value is Record<string, unknown> {
    const type = typeof value;
    return value !== null && (type === 'object' || type === 'function');
}
```

#### Recursive Processing
The `redact` function demonstrates proper recursive pattern:
- Check primitives (base case)
- Handle arrays (map over elements)
- Handle objects (reduce over keys)
- Throw on unsupported types (unless `ignoreUnknown`)

#### Configuration with Defaults
```typescript
const partial = Object.prototype.hasOwnProperty.call(config, 'partial') 
    ? config.partial : true;
```

#### Functional Transformations
Prefer `map`, `reduce`, `filter` over imperative loops for immutable transformations.

## Dependencies

### Production
- `lodash.isplainobject`: ^4.0.6 (minimal lodash for plain object detection)

### Development
- TypeScript 5.9.3+
- `node:test` with `node:assert/strict` (no test framework dependency)
- ESLint 9.39.2+ with shaunburdick config
- publint and `@arethetypeswrong/cli` for the packed package
- Node.js: ^20.9.0 || >=22.0.0 (tests run on 20.9.0, 20.x, 22.x, 24.x, 26.x)
- The 20.9.0 cell runs the build and tests without lint: eslint-plugin-unicorn, pulled in by eslint-config-shaunburdick, needs Node >= 20.10

## Git Workflow
- **Main Branch**: `main` (not `master`)
- **Branch Strategy**: Create feature branches for changes
- **Commits**: Follow conventional commits (e.g., `feat:`, `fix:`, `docs:`)
- **PRs**: All changes via pull requests to `main`

## Notes for Agents
- This is a **library**, not an application - there's no CLI or server to run
- The public API is minimal: one exported function with a declaration namespace for its types
- The export shape is part of the public API: `require` must return the function, and `default` must stay undefined
- Maintain backward compatibility for minor versions
- When adding features, update both the main function AND the TypeScript types
- Test against all supported Node versions (20.9.0, 22.x, 24.x, 26.x)
- Types are proven from the packed tarball by `smoke:pack`, not from `src/`
- The package is published to npm; breaking changes require major version bump
