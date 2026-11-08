// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vite-plus/test'
import type { Id } from '@convex/_generated/dataModel'
import PlayerGameHistory from './PlayerGameHistory'

const load = vi.fn()

const olderSeason = { _id: 'older' as Id<'playerStats'>, year: 2024 }
const latestSeason = { _id: 'latest' as Id<'playerStats'>, year: 2026 }
const game = {
  eventId: '401909289',
  tipoff: Date.parse('2026-11-07T00:30:00.000Z'),
  team: 'PHI',
  venue: '@',
  opponent: 'CLE',
  opponentName: 'Cleveland Cavaliers',
  phase: 'Regular season',
  result: 'L',
  score: '95–119',
  points: 8,
}

function renderHistory() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, queryFn: ({ queryKey }) => load(queryKey[2]) },
    },
  })
  render(
    <QueryClientProvider client={client}>
      <PlayerGameHistory seasons={[olderSeason, latestSeason]} />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  load.mockReset()
})

it('loads the latest season first and switches to the selected season', async () => {
  load.mockImplementation(async ({ playerSeasonId }) => ({
    games: playerSeasonId === latestSeason._id ? [game] : [],
    stale: false,
  }))
  renderHistory()

  expect(await screen.findByText('Nov 6, 2026')).toBeDefined()
  expect(screen.queryByRole('link')).toBeNull()
  expect(screen.getByText('L 95–119')).toBeDefined()
  expect(load).toHaveBeenCalledWith({ playerSeasonId: latestSeason._id })

  fireEvent.change(screen.getByLabelText('Game log season'), { target: { value: olderSeason._id } })
  expect(await screen.findByText('No game history is available for this season.')).toBeDefined()
  expect(load).toHaveBeenLastCalledWith({ playerSeasonId: olderSeason._id })
  expect(screen.queryByRole('table')).toBeNull()
})

it('lets the user retry an upstream failure', async () => {
  load
    .mockRejectedValueOnce(new Error('Feed unavailable'))
    .mockResolvedValueOnce({ games: [game], stale: false })
  renderHistory()

  expect(await screen.findByText('Game history is temporarily unavailable.')).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(
    await screen.findByRole('table', { name: 'Game log for the 2026–27 season' }),
  ).toBeDefined()
})
