// eslint.config.js — flat config для ESLint v10
import js from '@eslint/js'
import importX from 'eslint-plugin-import-x'
import prettier from 'eslint-plugin-prettier/recommended'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': importX,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'padding-line-between-statements': [
        'warn',
        {
          blankLine: 'always',
          prev: '*',
          next: [
            'return',
            'block-like',
            'throw',
            'if',
            'default',
            'case',
            'break',
            'class',
            'function',
          ],
        },
        {
          blankLine: 'always',
          prev: ['block-like', 'throw', 'if'],
          next: '*',
        },
      ],
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'unknown',
          ],
          alphabetize: { order: 'asc' },
          'newlines-between': 'always',
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
        },
      ],
      'import-x/no-named-as-default': 'off',
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Механический контроль соглашений из .kodarules
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Правило 2: массивы только как Array<T>
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      'no-restricted-syntax': [
        'error',
        {
          // Правило 4: нативные enum запрещены (erasableSyntaxOnly)
          selector: 'TSEnumDeclaration',
          message:
            'Нативный enum запрещён (erasableSyntaxOnly): union-тип или as const + union',
        },
        {
          // Правило 1: вместо ручного `T | null` — Nullable<T>
          selector: 'TSUnionType > TSNullKeyword',
          message:
            'Используй Nullable<T> из typescript-extended-types вместо `T | null`',
        },
        {
          // Правило 3: вместо сравнения с null — isNullish
          selector: 'BinaryExpression > Literal[value=null]',
          message:
            'Используй isNullish из typescript-extended-types вместо сравнения с null',
        },
        {
          // Правило 3: вместо сравнения с undefined — isNullish
          selector: "BinaryExpression > Identifier[name='undefined']",
          message:
            'Используй isNullish из typescript-extended-types вместо сравнения с undefined',
        },
      ],
    },
  },
  prettier,
)
