import { nextJsConfig } from '@repo/eslint-config/next-js';

const sourceFiles = ['**/*.{js,mjs,cjs,jsx,ts,tsx}'];
const typescriptFiles = ['**/*.{ts,tsx}'];

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig.map((config) =>
    'ignores' in config ? config : { ...config, files: sourceFiles },
  ),
  {
    files: typescriptFiles,
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
    },
  },
];
