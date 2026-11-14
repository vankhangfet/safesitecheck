import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const nodeGlobals = {
  require: 'readonly',
  module: 'writable',
  process: 'readonly',
  console: 'readonly',
  __dirname: 'readonly',
  Buffer: 'readonly',
};

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '.tmp-jest-out/', 'aidlc/', '.kiro/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    rules: {
      eqeqeq: 'error',
      'no-console': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variableLike',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
    },
  },
  {
    // The one place that may write to the console: it accepts only error kinds and timings.
    files: ['src/shared/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: nodeGlobals },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
);
