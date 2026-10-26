import { useState } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function createClients() {
  const convexClient = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)
  const convexQueryClient = new ConvexQueryClient(convexClient)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)
  return { convexClient, queryClient }
}

let browserClients: ReturnType<typeof createClients> | undefined

function getClients() {
  // Consistent Convex reads expire after 30 seconds. Each SSR request needs
  // fresh clients; browser navigation can keep reusing its cache and connection.
  if (typeof window === 'undefined') return createClients()
  return (browserClients ??= createClients())
}

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  const [{ convexClient, queryClient }] = useState(getClients)
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProvider>
  )
}
