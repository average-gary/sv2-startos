import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './app/routes'
import { TimeseriesProvider } from './lib/timeseries'
import './styles/tailwind.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TimeseriesProvider>
        <AppRouter />
      </TimeseriesProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
