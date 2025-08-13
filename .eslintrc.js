module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  rules: {
    // TypeScript规则 - 放宽用于Github准备
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off', 
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/require-await': 'off',
    
    // 通用规则 - 放宽用于Github准备
    'no-console': 'warn',
    'prefer-const': 'off',
    'no-var': 'error',
    'no-case-declarations': 'off',
    'no-constant-condition': 'off',
    'no-prototype-builtins': 'off',
    
    // 代码风格 - 放宽用于Github准备
    'indent': 'off',
    'quotes': 'off',
    'semi': 'off',
    'comma-trailing': 'off',
    
    // 注释要求（中文注释规范）
    'spaced-comment': ['error', 'always'],
  },
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '!jest.config.js',
    '!.eslintrc.js'
  ],
};