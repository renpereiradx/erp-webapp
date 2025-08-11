import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: [
      'dist',
      'dev-tools/**',
      'docs/**',
      'public/**',
      'specs/**',
      'test-*.js',
      'docs/api/**',
      'src/utils/themeUtils_broken.js',
      'src/utils/themeUtils_backup.js',
    ],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
  // Relajar algunas reglas para facilitar desarrollo en módulos legacy/dev-tools
  'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
  'no-prototype-builtins': 'warn',
  'no-undef': 'warn',
  'no-extra-boolean-cast': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Reconocer globals de Vitest en archivos de prueba para reducir warnings de lint
  {
    files: ['**/*.{test,spec}.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
  ...globals.browser,
  ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      // En pruebas, relajar algunas reglas verbosas
      'no-unused-expressions': 'off',
    },
  },
]
