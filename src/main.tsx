import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

// TON Connect manifest URL - replace with your actual manifest URL in production
const manifestUrl = 'https://telegram-star-miner.vercel.app/tonconnect-manifest.json'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <QueryClientProvider client={queryClient}>
        <BlinkUIProvider theme="linear" darkMode="system">
          <Toaster />
          <App />
        </BlinkUIProvider>
      </QueryClientProvider>
    </TonConnectUIProvider>
  </React.StrictMode>,
)
