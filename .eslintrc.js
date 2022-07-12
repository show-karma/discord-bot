module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaVersion: 2020
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true
  },
  ignorePatterns: ['.eslintrc.js', 'ormconfig.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    semi: [2, 'always'],
    'object-shorthand': ['error', 'always'],
    'prettier/prettier': 'error',
    'dot-notation': 'error',
    'max-lines': ['error', 400],
    'no-console': 'error',
    'max-lines-per-function': ['error', 100],
    'constructor-super': 'error',
    'no-cond-assign': ['error', 'always']
  }
};
