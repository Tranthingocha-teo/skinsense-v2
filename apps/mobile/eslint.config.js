const expoConfig = require('eslint-config-expo/flat.js');

module.exports = [
  ...expoConfig,
  {
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/display-name': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'import/no-named-as-default': 'off',
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    ignores: ['dist/*', 'android/*', 'ios/*', 'node_modules/*'],
  },
];
