/**
 * Entry point de la aplicación - Patrón MVP
 * Sin providers problemáticos, usando Zustand theme store
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
