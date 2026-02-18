import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // Add cache busting with timestamp + random
  define: {
    __CACHE_BUST__: JSON.stringify(`${Date.now()}-${Math.random().toString(36)}`)
  },
  plugins: [
    react({
      // Enable React 19 features
      jsxRuntime: 'automatic',
      // DISABLE fast refresh to prevent hook issues
      fastRefresh: false,
      // Include JSX files
      include: /\.(jsx|tsx)$/
    })
  ],
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-day-picker',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip'
    ],
    exclude: ['react-day-picker/dist/style.css'],
    force: true, // Force re-optimization on every start
    // 🔧 Solo escanear archivos relevantes para evitar errores con specs/temp
    entries: [
      'index.html',
      'src/main.jsx'
    ],
    // Add cache invalidation
    esbuildOptions: {
      target: 'esnext'
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    fs: {
      strict: false
    },
    // Enable HMR but with overlay for errors
    hmr: {
      overlay: true,
      // 🔧 Quitamos el puerto fijo para que funcione en Codespaces/Proxies
      clientErrorOverlay: true
    },
    // Aggressive headers to prevent cache specifically for this app
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': 'false',
      'Last-Modified': 'false',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Accept-Encoding, User-Agent'
    },
    // Proxy API requests to avoid CORS issues
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
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
          lucide: ['lucide-react']
        }
      }
    }
  },
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
