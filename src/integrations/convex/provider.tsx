import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL
if (!CONVEX_URL) {
  console.error('missing envar CONVEX_URL')
}

const convexClient = new ConvexReactClient(CONVEX_URL)
const convexQueryClient = new ConvexQueryClient(convexClient)

// Create a QueryClient for React Query with SSR support
// Wire up the Convex query client as the default query function
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryFn: convexQueryClient.queryFn() as any,
    },
  },
})

// Connect the Convex query client to the QueryClient
convexQueryClient.connect(queryClient)

export { queryClient, convexQueryClient, convexClient }

export default function AppConvexProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProvider>
  )
}
