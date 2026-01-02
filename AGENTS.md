# Agent Development Guide

This guide is for AI coding agents working in the redact-object repository. It contains essential information about commands, code style, and conventions.

## Project Overview

**redact-object** is a TypeScript library for recursively redacting sensitive properties from JavaScript objects. It's published to npm and supports CommonJS with TypeScript type definitions.

## Build, Test, and Lint Commands

### Core Commands
```bash
npm test              # Run linting + unit tests (run this before commits)
npm run test:unit     # Run unit tests only with Jest
npm run lint          # Check code with ESLint
npm run lint:fix      # Auto-fix ESLint issues
npm run build         # Clean and transpile TypeScript to dist/
```

### Running a Single Test
```bash
# Run a specific test file
npx jest src/__tests__/index.test.ts

# Run tests matching a pattern
npx jest -t "should redact values"

# Run in watch mode for active development
npx jest --watch
```

### Pre-Commit Checklist
Before committing, ensure:
1. `npm test` passes (includes lint + unit tests)
2. `npm run build` succeeds
3. No TypeScript errors: `npx tsc --noEmit`

## Code Style Guidelines

### Module System and Imports
- **Module Format**: CommonJS (`module: "commonjs"`)
- **Target**: ES5 for broad compatibility
- **Import Style**: Use ES6 import/export syntax (TypeScript transpiles to CommonJS)
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
- **Location**: Tests in `src/__tests__/` directory
- **Naming**: `*.test.ts` suffix
- **Framework**: Jest with ts-jest preset
- **Coverage**: Coverage collection enabled by default
- **Structure**: Use `describe` blocks to group related tests
- **Assertions**: Use descriptive test names: `it('should redact values of foo', ...)`
- **Test Data**: Define test fixtures at the top of test files
- **Immutability**: Always test that original objects are not mutated

### Code Organization
- **Main Export**: Default export for primary function
- **Named Exports**: Types and interfaces as named exports
- **File Structure**: Keep related functions in same file; extract to separate modules when file exceeds 200 lines
- **Recursion**: Use recursion for tree traversal (as in `redact` function)

### ESLint Configuration
- **Base Config**: Uses `eslint-config-shaunburdick` (v5.0.0)
- **Applies To**: JavaScript and TypeScript files
- **Ignores**: `dist/**`, `jest.config.js`
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
- Jest 30.2.0+ with ts-jest
- ESLint 9.39.2+ with shaunburdick config
- Node.js: Tests run on 18.x, 20.x, 22.x

## Git Workflow
- **Main Branch**: `main` (not `master`)
- **Branch Strategy**: Create feature branches for changes
- **Commits**: Follow conventional commits (e.g., `feat:`, `fix:`, `docs:`)
- **PRs**: All changes via pull requests to `main`

## Notes for Agents
- This is a **library**, not an application - there's no CLI or server to run
- The public API is minimal: one default export function with type exports
- Maintain backward compatibility for minor versions
- When adding features, update both the main function AND the TypeScript types
- Test against all supported Node versions (18+, 20+, 22+)
- The package is published to npm; breaking changes require major version bump
