import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  // Render a helpful error message instead of crashing silently
  const root = document.getElementById('root')!
  root.innerHTML = `
    <div style="
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #fff;
      background: #1a1a2e;
      font-family: system-ui, sans-serif;
      padding: 2rem;
      text-align: center;
    ">
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">⚠️ Chybí Clerk klíč</h1>
      <p style="max-width: 500px; line-height: 1.6; color: #aaa;">
        Aplikace potřebuje <code style="color: #e2b714;">VITE_CLERK_PUBLISHABLE_KEY</code>
        v souboru <code style="color: #e2b714;">client/.env</code>.
      </p>
      <p style="margin-top: 1rem; color: #888;">
        Vytvořte soubor <code style="color: #e2b714;">client/.env</code> s obsahem:<br />
        <code style="display: inline-block; margin-top: 0.5rem; padding: 0.5rem 1rem; background: #111; border-radius: 6px; color: #4fc3f7;">
          VITE_CLERK_PUBLISHABLE_KEY=pk_test_váš_klíč_zde
        </code>
      </p>
      <p style="margin-top: 1.5rem; color: #666; font-size: 0.85rem;">
        Klíč získáte na <a href="https://dashboard.clerk.com" style="color: #4fc3f7;" target="_blank">dashboard.clerk.com</a>
      </p>
    </div>
  `
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>,
  )
}
