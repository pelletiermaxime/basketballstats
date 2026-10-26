import { useMemo } from 'react'
import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '@convex/_generated/api'
import PlayerBrowserHeader from '../components/PlayerBrowserHeader'
import PlayerFilters from '../components/PlayerFilters'
import PlayerResults from '../components/PlayerResults'
import { filterPlayers, parseBrowserSearch, type PlayerBrowserSearch } from '../lib/playerBrowser'

export const Route = createFileRoute('/')({
  component: Home,
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) =>
    parseBrowserSearch(search),
  head: () => ({
    meta: [{ title: 'NBA Player Statistics | Basketball Stats' }],
  }),
})

function Home() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: playerStats } = useSuspenseQuery(
    convexQuery(api.playerStats.getSeasonPlayerStatsWithTeams, { year: search.year }),
  )
  const filtered = useMemo(() => filterPlayers(playerStats, search), [playerStats, search])

  const updateSearch = (patch: Partial<PlayerBrowserSearch>, replace = false) => {
    void navigate({
      search: (previous) => ({ ...previous, ...patch, page: patch.page ?? 1 }),
      replace,
      resetScroll: false,
    })
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8">
      <section className="island-shell rise-in mb-6 p-5 sm:p-6">
        <PlayerBrowserHeader
          year={search.year}
          onYearChange={(year) => updateSearch({ year, team: '' })}
        />
        <PlayerFilters
          players={playerStats}
          search={search}
          onChange={updateSearch}
          onReset={() => {
            void navigate({
              search: { ...parseBrowserSearch({ year: search.year, pageSize: search.pageSize }) },
              resetScroll: false,
            })
          }}
        />
      </section>
      <PlayerResults
        players={filtered}
        totalPlayers={playerStats.length}
        search={search}
        onChange={updateSearch}
      />
    </main>
  )
}
