import shaunburdick from 'eslint-config-shaunburdick';

export default [
    ...shaunburdick.config.js,
    ...shaunburdick.config.ts,
    {
        ignores: [
            'dist/**',
            'jest.config.js'
        ],
    }
];
