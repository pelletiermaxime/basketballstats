import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import PlayerStatsTable from '../components/PlayerStatsTable'
import type { SortingState } from '@tanstack/react-table'

const CURRENT_YEAR = 2025
const YEAR_OPTIONS = [2025, 2024, 2023]

const PLAYER_LIMIT = 100

// SSR Loader - fetches data on the server
export const Route = createFileRoute('/')({
  component: Home,
  head: () => ({
    meta: [{ title: 'NBA Player Statistics | Basketball Stats' }],
  }),
  loader: async () => {
    // Return the year for SSR - data will be fetched via useSuspenseQuery
    return { year: CURRENT_YEAR }
  },
  staleTime: 60_000,
})

function Home() {
  const navigate = useNavigate()
  const loaderData = Route.useLoaderData()
  const [selectedYear, setSelectedYear] = useState(loaderData.year)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'points', desc: true }])
  const [isSyncing, setIsSyncing] = useState(false)

  // Use suspense query for SSR - this will fetch data and support SSR hydration
  const { data: playerStats } = useSuspenseQuery(
    convexQuery(api.playerStats.getTopPlayerStatsWithTeams, {
      year: selectedYear,
      limit: PLAYER_LIMIT,
    }),
  )

  const syncAction = useAction(api.playerStats.syncPlayerStatsAction)

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    void navigate({
      to: '/',
      search: { year },
    })
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncAction({ year: selectedYear })
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8">
      <section className="island-shell rise-in p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="island-kicker mb-1">NBA Statistics</p>
            <h1 className="text-2xl font-bold text-[var(--ink)]">
              Top {PLAYER_LIMIT} Player Statistics
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-1">
              Per-game averages for the {selectedYear}-{selectedYear + 1} season
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="select"
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}-{year + 1} Season
                </option>
              ))}
            </select>

            {import.meta.env.DEV && (
              <button onClick={handleSync} disabled={isSyncing} className="btn btn-primary">
                {isSyncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  'Sync Data'
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rise-in" style={{ animationDelay: '100ms' }}>
        {playerStats.length === 0 ? (
          <div className="island-shell p-12 text-center">
            <div className="text-5xl mb-4">🏀</div>
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-2">No data available</h3>
            <p className="text-[var(--ink-soft)] mb-4">
              No player statistics found for the {selectedYear}-{selectedYear + 1} season.
            </p>
            {import.meta.env.DEV && (
              <button onClick={handleSync} disabled={isSyncing} className="btn btn-primary">
                {isSyncing ? 'Syncing...' : 'Sync Data Now'}
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--ink-muted)] mb-2">
              Showing top {playerStats.length} players by points per game
            </p>
            <PlayerStatsTable stats={playerStats} sorting={sorting} onSortingChange={setSorting} />
          </>
        )}
      </section>
    </main>
  )
}
