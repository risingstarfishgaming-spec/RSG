import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './stores/authStore'
import { useStaffAuthStore } from './stores/staffAuthStore'

useAuthStore.getState().initFromStorage()
useStaffAuthStore.getState().initFromStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
