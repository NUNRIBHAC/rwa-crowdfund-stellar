import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

// Pragmatic baseline: catch real defects without reformatting the codebase.
// Deliberate `any` casts are common at SDK boundaries and allowed; unused-var
// and empty-block patterns get narrow exceptions instead of mass edits.
export default tseslint.config(
  {
    ignores: [
      '**/dist/',
      '**/node_modules/',
      '**/coverage/',
      'contracts/',
      'docs/',
      'backend/test/fixtures/',
      'infra/media-worker/worker.js',
      'infra/media-worker/worker-v2-rollback.js',
      'infra/media-worker/worker-v3-rollback.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['backend/**/*.ts', 'frontend/**/*.ts', 'frontend/**/*.tsx', '*.mjs', 'backend/**/*.mjs', 'frontend/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-escape': 'off',
      // @eslint/js 10 promotes these three rules into eslint:recommended; keep the
      // version bump lint-neutral. Adopting them (6 existing hits in backend) is
      // tracked as a separate follow-up.
      'no-unassigned-vars': 'off',
      'no-useless-assignment': 'off',
      'preserve-caught-error': 'off',
    },
  },
  {
    files: ['load/**/*.js'],
    languageOptions: { sourceType: 'module', globals: { __ENV: 'readonly' } },
  },
  {
    files: ['frontend/**/*.ts', 'frontend/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' },
  },
);
