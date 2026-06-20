import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

// Manifest is served from the app's own origin so it works in any deployment.
const manifestUrl =
  typeof window !== 'undefined'
    ? `${window.location.origin}/tonconnect-manifest.json`
    : '/tonconnect-manifest.json'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TonConnectUIProvider manifestUrl={manifestUrl}>
        <BlinkUIProvider theme="linear" darkMode="system">
          <Toaster />
          <App />
        </BlinkUIProvider>
      </TonConnectUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
