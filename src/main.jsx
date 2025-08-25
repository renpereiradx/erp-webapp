import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

// Wave 4: UX & Accessibility imports
import { ThemeProvider } from './themes/ThemeProvider'
import './i18n' // Initialize i18n

// Wave 5: Offline & Circuit Breaker UI - Auto-initialized via hooks

// Wave 6: PWA & Performance Optimization
import { PerformanceMonitor, initializeWebVitals } from './optimization/PerformanceMonitor'
import { initializeCodeSplitting } from './optimization/CodeSplitting'

// ====================================
// WAVE 6: PWA INITIALIZATION
// ====================================

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered: ', registration);
        
        // Update available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New SW available');
              // Notify user about update
              if (window.showUpdateAvailable) {
                window.showUpdateAvailable();
              }
            }
          });
        });
      })
      .catch((registrationError) => {
        console.log('❌ SW registration failed: ', registrationError);
      });
  });
}

// PWA Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  if (window.showPWAInstallPrompt) {
    window.showPWAInstallPrompt();
  }
});

// PWA Install function
window.installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install ${outcome}`);
    deferredPrompt = null;
  }
};

// Initialize performance monitoring
initializeWebVitals();
initializeCodeSplitting();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PerformanceMonitor>
      <ThemeProvider 
        defaultTheme="light"
        enableTransitions={true}
        respectSystemPreference={true}
      >
        <App />
      </ThemeProvider>
    </PerformanceMonitor>
  </StrictMode>,
)
