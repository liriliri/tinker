import App from './App'
import { createRoot } from 'react-dom/client'
import './index.css'

function renderApp() {
  const container: HTMLElement = document.getElementById('app') as HTMLElement

  createRoot(container).render(<App />)
}

;(async function () {
  renderApp()
})()
