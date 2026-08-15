import eslint from '@eslint/js';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'docs/archive/**', 'scripts/fabric-editor.js', 'scripts/three-viewer.js', 'scripts/renderers.js'] },
  eslint.configs.recommended,
  {
    files: ['scripts/**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { window: 'readonly', document: 'readonly', navigator: 'readonly', localStorage: 'readonly', requestAnimationFrame: 'readonly', CustomEvent: 'readonly', Blob: 'readonly', TextEncoder: 'readonly', TextDecoder: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', btoa: 'readonly', atob: 'readonly', crypto: 'readonly', console: 'readonly', process: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' } },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error',
      'semi': 'off',
      'quotes': 'off'
    }
  }
];
