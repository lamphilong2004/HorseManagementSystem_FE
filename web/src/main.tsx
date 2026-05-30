import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './globals.css'
import './style.css'

async function enableMocks() {
  if (!import.meta.env.DEV) return
  if (import.meta.env.VITE_API_BASE_URL) return
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
  })
}

enableMocks().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
