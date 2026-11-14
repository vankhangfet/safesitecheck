/**
 * Jest configuration. The 80% line floor is a defined quality target (Testing Contract,
 * NFR7.2). It applies whenever Jest runs with --coverage. Never lower it to pass a run.
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
    '^.+\\.html$': '<rootDir>/scripts/jestHtmlTransform.cjs',
  },
  moduleFileExtensions: ['ts', 'js', 'cjs', 'json', 'html', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/test-support/**',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { lines: 80 },
  },
};
