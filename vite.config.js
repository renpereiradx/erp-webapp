import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Elimina logs de desarrollo del bundle de producción: console.log/debug/info
  // y los groupCollapsed/groupEnd de los bloques de diagnóstico se descartan
  // solo en build (modo 'production'); console.error/warn se conservan.
  const isProduction = mode === 'production';
  return {
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
    // Todos los @radix-ui/react-* importados en src/ van pre-bundeados al
    // arrancar. Si falta uno, se descubre "lazy" al navegar una ruta que lo
    // usa y la re-optimización en caliente puede servir el dep vacío/corrupto
    // (NS_ERROR_CORRUPTED_CONTENT / MIME "" en el navegador — pasó con
    // react-checkbox en /catalogo). Mantener esta lista en sync con los
    // imports de src/.
    include: [
      'react',
      'react-dom',
      'react-day-picker',
      'date-fns',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip'
    ],
    exclude: ['react-day-picker/dist/style.css'],
    force: true, // Force re-optimization on every start
    // 🔧 Solo escanear archivos relevantes para evitar errores con specs/temp
    entries: [
      'index.html',
      'src/main.tsx'
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
    host: true,
    strictPort: true,
    watch: {
      usePolling: true
    },
    fs: {
      strict: false
    },
    // Enable HMR but with overlay for errors
    hmr: {
      overlay: true,
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
    // Proxy /api de origen único (RN-DEPLOY-001): disponible para probar el
    // contrato productivo en dev. Dormant por defecto — .env.development usa
    // VITE_API_URL=http://localhost:5050 (URL directa, CORS del backend para
    // :5173); si un dev cambia a VITE_API_URL=/api, este proxy lo resuelve.
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '')
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
          lucide: ['lucide-react'],
          // H5 (audit react): recharts solo lo cargan las páginas BI lazy —
          // vendor aparte y cacheable entre páginas del módulo.
          recharts: ['recharts']
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Exclude Playwright E2E tests so vitest does not attempt to execute them.
    // Start from vitest defaults (configDefaults.exclude already covers **/node_modules/**
    // for NESTED node_modules like .opencode/node_modules, plus dist and config files)
    // and add tooling dirs that must never be scanned.
    exclude: [
      ...configDefaults.exclude,
      'tests/e2e/**',
      '**/e2e/**',
      '**/*.e2e.*',
      '**/.opencode/**',
      '**/.zcode/**',
    ],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    // Worker stability: one fork accumulates several jsdom environments per run and
    // the default V8 heap (~4GB) OOMs ("Worker exited unexpectedly" / tinypool crash).
    // Raise per-fork heap, cap parallelism so each fork handles fewer files, and expose
    // GC so vitest.setup.ts can force a collection between test files.
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 8,
        minForks: 1,
        execArgv: ['--max-old-space-size=8192', '--expose-gc'],
      },
    },
  },
  esbuild: {
    pure: isProduction
      ? ['console.log', 'console.debug', 'console.info', 'console.groupCollapsed', 'console.groupEnd']
      : [],
  },
  };
})
