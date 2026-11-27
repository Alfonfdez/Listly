// https://docs.expo.dev/guides/using-eslint/
// ESM on purpose: `@stylistic/eslint-plugin` is ESM-only (`expo lint` accepts
// eslint.config.mjs, .js and .cjs).
import { defineConfig } from 'eslint/config';
// The expo config has no `exports` map (it is CJS), so ESM needs the file path:
// a bare 'eslint-config-expo/flat' is a directory import and Node rejects it.
import expoConfig from 'eslint-config-expo/flat/default.js';
import boundaries from 'eslint-plugin-boundaries';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'constants', pattern: 'src/constants', partialMatch: false },
        { type: 'utils', pattern: 'src/utils', partialMatch: false },
        { type: 'i18n', pattern: 'src/i18n', partialMatch: false },
        { type: 'database', pattern: 'src/database', partialMatch: false },
        { type: 'context', pattern: 'src/context', partialMatch: false },
        { type: 'hooks', pattern: 'src/hooks', partialMatch: false },
        { type: 'components', pattern: 'src/components', partialMatch: false },
        { type: 'screens', pattern: 'src/screens', partialMatch: false },
        { type: 'navigation', pattern: 'src/navigation', partialMatch: false },
      ],
    },
    rules: {
      'boundaries/no-unknown-files': 1,
      'boundaries/dependencies': [2, {
        default: 'disallow',
        policies: [
          {
            from: { element: { type: '*' } },
            allow: { to: { module: { origin: 'external' } } },
          },
          {
            from: { element: { type: 'constants' } },
            allow: { to: { element: { type: 'constants' } } },
          },
          {
            from: { element: { type: 'utils' } },
            allow: { to: { element: { type: ['utils', 'constants', 'i18n'] } } },
          },
          {
            from: { element: { type: 'utils' } },
            allow: { to: { element: { type: 'database' } }, dependency: { kind: 'type' } },
          },
          {
            from: { element: { type: 'i18n' } },
            allow: { to: { element: { type: ['i18n', 'constants'] } } },
          },
          {
            from: { element: { type: 'database' } },
            allow: { to: { element: { type: ['database', 'constants', 'utils'] } } },
          },
          {
            from: { element: { type: 'context' } },
            allow: { to: { element: { type: ['context', 'constants', 'utils', 'i18n', 'database'] } } },
          },
          {
            from: { element: { type: 'hooks' } },
            allow: { to: { element: { type: ['hooks', 'constants', 'utils', 'i18n', 'database', 'context'] } } },
          },
          {
            from: { element: { type: 'components' } },
            allow: { to: { element: { type: ['components', 'constants', 'utils', 'i18n', 'database', 'context', 'hooks'] } } },
          },
          {
            from: { element: { type: 'screens' } },
            allow: { to: { element: { type: ['screens', 'constants', 'utils', 'i18n', 'database', 'context', 'hooks', 'components'] } } },
          },
          {
            from: { element: { type: 'navigation' } },
            allow: { to: { element: { type: ['navigation', 'screens', 'components', 'hooks', 'context', 'database', 'i18n', 'utils', 'constants'] } } },
          },
          // Listly-specific (layers differ slightly from Finly):
          // - quick-colour labels are typed from the i18n `Translations` type
          {
            from: { element: { type: 'constants' } },
            allow: { to: { element: { type: 'i18n' } }, dependency: { kind: 'type' } },
          },
          // - contexts expose/consume hooks (useRequiredContext/useLabels) and render the toast
          {
            from: { element: { type: 'context' } },
            allow: { to: { element: { type: ['hooks', 'components'] } } },
          },
          // - hooks build the header element from the SelectSearchHeader component
          {
            from: { element: { type: 'hooks' } },
            allow: { to: { element: { type: 'components' } } },
          },
        ],
      }],
    },
  },
  {
    // The boundaries plugin classifies `src/` layers; tests, scripts, the local
    // module and root config files are not app layers, so they are not
    // "unknown files" to report.
    files: [
      'tests/**/*',
      'scripts/**/*',
      'modules/**/*',
      'App.tsx',
      'index.ts',
      'metro.config.js',
      'vitest.config.mts',
      'eslint.config.mjs',
    ],
    rules: {
      'boundaries/no-unknown-files': 'off',
    },
  },
  {
    // Formatting lives here so style slips can't pass the gate.
    // `npm run lint:fix` applies every fixer. Every rule below is an error.
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],
      '@stylistic/jsx-indent-props': ['error', 2],
      // `list-style` supersedes the deprecated `object-curly-spacing` /
      // `array-bracket-spacing` pair in @stylistic 6. The defaults are the
      // same policy: no spacing inside arrays/brackets, one space inside
      // single-line object literals, and no forced line breaks.
      '@stylistic/list-style': ['error'],
      '@stylistic/template-curly-spacing': ['error', 'never'],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      }],
      '@stylistic/arrow-spacing': ['error'],
      '@stylistic/keyword-spacing': ['error'],
      '@stylistic/space-before-blocks': ['error'],
      '@stylistic/space-infix-ops': ['error'],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      '@stylistic/padded-blocks': ['error', 'never'],
      '@stylistic/no-trailing-spaces': ['error'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/no-multi-spaces': ['error', { ignoreEOLComments: true }],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1 }],
      // `unicode-bom` stayed in ESLint core: @stylistic has no rule for it.
      'unicode-bom': ['error', 'never'],
    },
  },
  {
    // Node scripts are not app code: they run under Node, not in the bundle.
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // Test-only helper pattern: a probe component that assigns a module-level
    // variable during render (to expose context/state to assertions).
    files: ['tests/**/*.{ts,tsx}'],
    rules: { 'react-hooks/globals': 'off' },
  },
]);
