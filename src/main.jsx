/**
 * Entry point de la aplicación - Patrón MVP
 * Sin providers problemáticos, usando Zustand theme store
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './styles/scss/main.scss'
import App from './App.jsx'

// Simple error boundary para hooks
window.addEventListener('error', (event) => {
  if (event.error && event.error.message && 
      (event.error.message.includes('Invalid hook call') || 
       event.error.message.includes('Hooks can only be called'))) {
    console.warn('🚨 Hook error detected, reloading page...')
    // Delay reload to allow error to be seen
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }
})

createRoot(document.getElementById('root')).render(
  // StrictMode temporarily disabled due to React 19 hooks compatibility issues
  <App />
)
