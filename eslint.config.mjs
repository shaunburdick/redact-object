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
        ignores: [
            'dist/**',
            'jest.config.js'
        ],
    }
];
