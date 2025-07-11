import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider 
      attribute="data-theme" 
      defaultTheme="neo-brutalism-light"
      themes={[
        'neo-brutalism-light', 
        'neo-brutalism-dark', 
        'material-light', 
        'material-dark', 
        'fluent-light', 
        'fluent-dark'
      ]}
    >
      <App />
    </ThemeProvider>
  </StrictMode>,
)
