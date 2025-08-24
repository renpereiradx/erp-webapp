import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

// Wave 4: UX & Accessibility imports
import { ThemeProvider } from './themes/ThemeProvider'
import './i18n' // Initialize i18n

// Wave 5: Offline & Circuit Breaker UI - Auto-initialized via hooks

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider 
      defaultTheme="light"
      enableTransitions={true}
      respectSystemPreference={true}
    >
      <App />
    </ThemeProvider>
  </StrictMode>,
)
