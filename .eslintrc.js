module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  env: {
    es6: true,
    node: true,
  },
};