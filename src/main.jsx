import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startFirebaseSync } from './utils/firebase'
import { defaultDatabase } from './utils/db'

// Initialize real-time synchronization with Firestore
startFirebaseSync(defaultDatabase);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
