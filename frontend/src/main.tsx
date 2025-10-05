import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { MusicProvider } from './contexts/MusicContext.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MusicProvider>
        <App />
      </MusicProvider>
    </ErrorBoundary>
  </StrictMode>,
)