import shaunburdick from 'eslint-config-shaunburdick';

export default [
    ...shaunburdick.config.js,
    ...shaunburdick.config.ts,
    {
        // ... your other ESLint configurations ...
        ignores: [
            'dist/**',
            'jest.config.js'
        ],
    }
];
