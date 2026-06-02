import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const hideSplash = () => {
  const splash = document.getElementById('app-splash')

  if (!splash) return

  splash.classList.add('splash-hide')

  window.setTimeout(() => {
    splash.remove()
  }, 500)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

const splashStartedAt = window.__appSplashStartedAt || performance.now()
const splashElapsed = performance.now() - splashStartedAt
const minSplashDelay = Math.max(700 - splashElapsed, 0)
const maxSplashDelay = Math.max(1600 - splashElapsed, 0)

window.setTimeout(hideSplash, minSplashDelay)
window.setTimeout(hideSplash, maxSplashDelay)
