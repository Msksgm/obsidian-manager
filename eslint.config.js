// @ts-check

import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import jsdocPlugin from 'eslint-plugin-jsdoc'
import nPlugin from 'eslint-plugin-n'
import prettierPlugin from 'eslint-plugin-prettier'
// @ts-ignore
import promisePlugin from 'eslint-plugin-promise'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ['./tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        process: 'readonly',
        Bun: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      jsdoc: jsdocPlugin,
      n: nPlugin,
      prettier: prettierPlugin,
      promise: promisePlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      ...(tseslint.configs.recommended?.rules || {}),
      ...importPlugin.configs.recommended.rules,
      ...promisePlugin.configs.recommended.rules,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'import/no-unresolved': 'off',
    },
  },
  eslintConfigPrettier,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.js',
      '*.mjs',
      "*.cjs"
    ]
  }
]
