import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/coverage/**',
        '**/dist/**',
        '**/.next/**',
        '**/public/**',
        '**/*.config.{js,ts}',
        '**/dev-tools/**',
        '**/examples/**'
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // Specific thresholds for critical components
        'src/store/**': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/hooks/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/services/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
});
