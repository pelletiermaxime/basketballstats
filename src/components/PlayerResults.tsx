import type { SortingState } from '@tanstack/react-table'
import type { PlayerStat } from '../lib/basketball'
import { seasonLabel } from '../lib/basketball'
import { pagination, type PlayerBrowserSearch } from '../lib/playerBrowser'
import PlayerStatsTable from './PlayerStatsTable'

interface PlayerResultsProps {
  players: PlayerStat[]
  totalPlayers: number
  search: PlayerBrowserSearch
  onChange: (patch: Partial<PlayerBrowserSearch>, replace?: boolean) => void
}

export default function PlayerResults({
  players,
  totalPlayers,
  search,
  onChange,
}: PlayerResultsProps) {
  const pages = pagination(players.length, search.page, search.pageSize)
  const sorting: SortingState = [{ id: search.sort, desc: search.desc }]

  const handleSortingChange = (next: SortingState) => {
    const first = next[0]
    onChange({
      sort: (first?.id as PlayerBrowserSearch['sort']) ?? 'points',
      desc: first?.desc ?? true,
    })
  }

  return (
    <section className="rise-in" style={{ animationDelay: '100ms' }} aria-label="Player results">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-[var(--ink-soft)]">
          Showing {pages.first}–{pages.last} of {players.length} players
          {players.length !== totalPlayers && ` (${totalPlayers} in this season)`}
        </p>
        <label className="flex items-center gap-2 text-sm">
          Rows per page
          <select
            value={search.pageSize}
            onChange={(event) => onChange({ pageSize: Number(event.target.value) })}
            className="select"
          >
            {[25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      {players.length === 0 ? (
        <div className="island-shell p-10 text-center">
          <h2 className="text-lg font-semibold">
            {totalPlayers === 0 ? 'No data available' : 'No players match your filters'}
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {totalPlayers === 0
              ? `No player statistics found for ${seasonLabel(search.year)}.`
              : 'Try another name, lower the minimums, or reset the filters.'}
          </p>
        </div>
      ) : (
        <>
          <PlayerStatsTable
            stats={players}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            page={pages.page}
            pageSize={search.pageSize}
          />
          <nav
            aria-label="Player pagination"
            className="mt-4 flex flex-wrap items-center justify-between gap-3"
          >
            <button
              type="button"
              disabled={pages.page === 1}
              onClick={() => onChange({ page: pages.page - 1 })}
              className="btn border border-[var(--line)] bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--ink-soft)]">
              Page {pages.page} of {pages.pageCount}
            </span>
            <button
              type="button"
              disabled={pages.page === pages.pageCount}
              onClick={() => onChange({ page: pages.page + 1 })}
              className="btn border border-[var(--line)] bg-[var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  )
}
