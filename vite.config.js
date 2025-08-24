import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
// Wave 3: Import bundle splitting configuration
import { bundleSplittingConfig } from './src/config/bundleSplitting.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  
  // Wave 3: Enhanced build configuration with bundle splitting
  build: {
    ...bundleSplittingConfig.build,
    rollupOptions: {
      ...bundleSplittingConfig.build.rollupOptions,
      output: {
        ...bundleSplittingConfig.build.rollupOptions.output,
        // Merge existing chunks with Wave 3 optimizations
        manualChunks: {
          // Original chunks (sin react duplicado)
          router: ['react-router-dom'],
          radix: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip'
          ],
          virtuoso: ['react-virtuoso'],
          lucide: ['lucide-react'],
          
          // Wave 3: Enhanced chunks
          ...bundleSplittingConfig.build.rollupOptions.output.manualChunks
        }
      }
    }
  },
  
  // Wave 3: Performance optimizations
  ...bundleSplittingConfig.optimizeDeps && { optimizeDeps: bundleSplittingConfig.optimizeDeps },
  ...bundleSplittingConfig.server && { server: bundleSplittingConfig.server },
  
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Exclude Playwright E2E tests so vitest does not attempt to execute them
    // also exclude node_modules and build outputs to avoid running dependency tests
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**', '**/e2e/**', '**/*.e2e.*'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  }
})
