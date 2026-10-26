import { renderToString } from 'react-dom/server'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vite-plus/test'
import AppConvexProvider from './provider'

afterEach(() => vi.unstubAllEnvs())

it('isolates Convex query clients and cached data between server requests', () => {
  vi.stubEnv('VITE_CONVEX_URL', 'https://test.convex.cloud')
  const clients: QueryClient[] = []
  function Probe() {
    clients.push(useQueryClient())
    return <span>Server request</span>
  }
  renderToString(
    <AppConvexProvider>
      <Probe />
    </AppConvexProvider>,
  )
  clients[0]!.setQueryData(['request-scope'], 'first request')
  renderToString(
    <AppConvexProvider>
      <Probe />
    </AppConvexProvider>,
  )
  expect(clients).toHaveLength(2)
  expect(clients[0]).not.toBe(clients[1])
  expect(clients[1]!.getQueryData(['request-scope'])).toBeUndefined()
  expect(clients[0]!.getDefaultOptions().queries?.queryFn).not.toBe(
    clients[1]!.getDefaultOptions().queries?.queryFn,
  )
})
