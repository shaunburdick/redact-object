import shaunburdick from 'eslint-config-shaunburdick';

export default [
    ...shaunburdick.config.js,
    ...shaunburdick.config.ts,
    {
        files: ['**/*.ts', '**/*.tsx'],
        settings: {
            'import/resolver': {
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
        },
    },
    {
        // Tests import the build output, which does not exist on a clean checkout.
        // `npm test` builds before linting, and the test run proves the import resolves.
        files: ['test/**/*.mjs'],
        rules: {
            'import/no-unresolved': ['error', { ignore: ['^\\.\\./dist/'] }],
        },
    },
    {
        ignores: [
            'dist/**',
            'coverage/**'
        ],
    }
];
