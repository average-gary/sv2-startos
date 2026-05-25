import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Shell } from './layouts/Shell'
import { ErrorBoundary } from './ErrorBoundary'
import { SERVICE } from '~/lib/service'
import { PoolDashboard } from '~/views/pool/PoolDashboard'
import { TranslatorDashboard } from '~/views/translator/TranslatorDashboard'
import { JdcDashboard } from '~/views/jdc/JdcDashboard'
import { ConfigViewer } from '~/views/config/ConfigViewer'

const dashboard = {
  pool: <PoolDashboard />,
  translator: <TranslatorDashboard />,
  jdc: <JdcDashboard />,
}[SERVICE]

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <ErrorBoundary>{dashboard}</ErrorBoundary> },
      {
        path: 'config',
        element: (
          <ErrorBoundary>
            <ConfigViewer />
          </ErrorBoundary>
        ),
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
