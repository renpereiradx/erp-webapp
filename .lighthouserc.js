# Wave 8: Lighthouse CI Configuration
# Performance and PWA auditing

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      startServerCommand: 'pnpm run preview',
      startServerReadyPattern: 'Local:   http://localhost:4173/',
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.9 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'first-input-delay': ['warn', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        
        // PWA specific
        'service-worker': 'error',
        'installable-manifest': 'error',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'content-width': 'warn',
        
        // Performance budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 250000 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 100000 }],
        'resource-summary:total:size': ['warn', { maxNumericValue: 500000 }],
        
        // Network
        'server-response-time': ['warn', { maxNumericValue: 500 }],
        'redirects': ['warn', { maxNumericValue: 0 }],
        
        // Security
        'is-on-https': 'error',
        'uses-http2': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9009
    }
  }
};
