import shaunburdick from 'eslint-config-shaunburdick';

export default [
    ...shaunburdick.config.js,
    ...shaunburdick.config.ts,
    {
        files: ['**/*.ts', '**/*.tsx'],
        settings: {
            'import-x/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
            },
        },
    },
    {
        // `export =` can only carry types through a namespace, so the declaration is required here.
        // Scoped to this file: a runtime namespace anywhere else is still an error.
        files: ['src/index.ts'],
        rules: {
            '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
            // The public contract hands back the caller's own value (target is any) and passes
            // arbitrary values to a replacer; unknown would force every consumer to narrow.
            'llm-core/no-type-system-bypass': 'off',
        },
    },
    {
        // Tests import the build output, which does not exist on a clean checkout.
        // `npm test` builds before linting, and the test run proves the import resolves.
        files: ['test/**/*.mjs'],
        rules: {
            'import-x/no-unresolved': ['error', { ignore: [String.raw`^\.\./dist/`] }],
        },
    },
    {
        ignores: [
            'dist/**',
            'coverage/**'
        ],
    }
];
