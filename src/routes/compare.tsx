import { useState } from 'react'
import { createFileRoute, Link, useNavigate, type SearchSchemaInput } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import PlayerComparison from '../components/PlayerComparison'
import TeamLogo from '../components/TeamLogo'
import { CURRENT_YEAR, SEASON_YEARS, seasonLabel } from '../lib/basketball'
import {
  COMPARISON_LIMIT,
  parseComparisonSearch,
  selectionKey,
  serializeComparisonSearch,
  type PlayerSelection,
} from '../lib/comparison'

export const Route = createFileRoute('/compare')({
  validateSearch: (search: Record<string, unknown> & SearchSchemaInput) => ({
    players: serializeComparisonSearch(parseComparisonSearch(search.players)),
  }),
  head: () => ({ meta: [{ title: 'Compare Players | Basketball Stats' }] }),
  component: ComparePage,
})

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function PlayerPicker({
  index,
  selection,
  selections,
  onSelect,
  onRemove,
}: {
  index: number
  selection?: PlayerSelection
  selections: PlayerSelection[]
  onSelect: (selection: PlayerSelection) => void
  onRemove: () => void
}) {
  const [search, setSearch] = useState('')
  const [browseYear, setBrowseYear] = useState(selection?.year ?? CURRENT_YEAR)
  const [editing, setEditing] = useState(!selection)
  const year = editing ? browseYear : (selection?.year ?? browseYear)
  const {
    data: players,
    isPending,
    error,
  } = useQuery(convexQuery(api.playerStats.getSeasonPlayerStatsWithTeams, { year }))
  const selected = players?.find((player) => player.playerId === selection?.playerId)
  const term = normalizeSearch(search)
  const matches = [...(players ?? [])]
    .filter((player) => normalizeSearch(player.fullName).includes(term))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
  const available = matches.filter(
    (player) =>
      !selections.some((entry) => entry.playerId === player.playerId && entry.year === year),
  )

  return (
    <section className="island-shell space-y-3 p-4" aria-label={`Player ${index + 1}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Player {index + 1}</h2>
        {selection && (
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-[var(--ink-soft)] underline"
          >
            Remove player {index + 1}
          </button>
        )}
      </div>
      {selection && !editing ? (
        <>
          <p className="font-semibold text-[var(--ink)]">
            {selected?.fullName ?? (isPending ? 'Loading player…' : 'Player unavailable')}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--ink-soft)]">
            <span>{seasonLabel(selection.year)}</span>
            {selected && (
              <>
                <TeamLogo team={selected.team} />
                <span>{selected.gamesPlayed} games</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn border border-[var(--line)] text-[var(--ink)]"
            onClick={() => {
              setBrowseYear(selection.year)
              setEditing(true)
            }}
          >
            Change player {index + 1}
          </button>
        </>
      ) : (
        <>
          <label className="block text-sm font-medium" htmlFor={`comparison-season-${index}`}>
            Season for player {index + 1}
          </label>
          <select
            id={`comparison-season-${index}`}
            value={year}
            className="select w-full"
            onChange={(event) => {
              setBrowseYear(Number(event.target.value))
              setSearch('')
            }}
          >
            {SEASON_YEARS.map((option) => (
              <option key={option} value={option}>
                {seasonLabel(option)}
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium" htmlFor={`comparison-search-${index}`}>
            Search player {index + 1}
          </label>
          <input
            id={`comparison-search-${index}`}
            value={search}
            type="search"
            placeholder="Search every player"
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--ink)]"
            onChange={(event) => setSearch(event.target.value)}
          />
          {isPending ? (
            <p role="status" className="text-sm text-[var(--ink-soft)]">
              Loading season…
            </p>
          ) : error ? (
            <p role="alert" className="text-sm text-[var(--ink-soft)]">
              Could not load this season. Try another season or reload.
            </p>
          ) : players?.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No player data is available for this season.
            </p>
          ) : (
            <>
              <label className="sr-only" htmlFor={`comparison-player-${index}`}>
                Choose player {index + 1}
              </label>
              <select
                id={`comparison-player-${index}`}
                value=""
                className="select w-full"
                disabled={available.length === 0}
                onChange={(event) => {
                  if (!event.target.value) return
                  onSelect({ playerId: event.target.value, year })
                  setSearch('')
                  setEditing(false)
                }}
              >
                <option value="">
                  {available.length
                    ? `Choose from ${available.length} players`
                    : 'No matching players'}
                </option>
                {available.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.fullName} ·{' '}
                    {player.team ? `${player.team.city} ${player.team.name}` : 'Unknown team'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--ink-soft)]">
                Already selected player seasons are excluded.
              </p>
            </>
          )}
          {selection && (
            <button type="button" className="text-sm underline" onClick={() => setEditing(false)}>
              Cancel change
            </button>
          )}
        </>
      )}
    </section>
  )
}

function ComparePage() {
  const { players: encoded } = Route.useSearch()
  const navigate = useNavigate()
  const selections = parseComparisonSearch(encoded)
  const [extraSlots, setExtraSlots] = useState(0)
  const slots = Math.min(COMPARISON_LIMIT, Math.max(2, selections.length + extraSlots))
  const {
    data: compared,
    isPending,
    error,
  } = useQuery(convexQuery(api.playerStats.getPlayerComparisons, { selections }))

  function updateSelections(next: PlayerSelection[]) {
    void navigate({ to: '/compare', search: { players: serializeComparisonSearch(next) } })
  }

  return (
    <main className="page-wrap space-y-6 px-4 py-8">
      <section className="island-shell space-y-3 p-6">
        <p className="island-kicker">Player comparisons</p>
        <h1 className="text-2xl font-bold">Compare player seasons</h1>
        <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
          Choose two to four player seasons to compare their scoring, shooting, playmaking, and
          defense. You can select the same player in different seasons. Your selections are saved in
          the URL.
        </p>
        <Link
          to="/"
          className="inline-block text-sm font-medium text-[var(--hoops-orange-deep)] hover:underline"
        >
          Browse all players →
        </Link>
      </section>
      <div
        className={`grid gap-4 ${slots > 2 ? 'lg:grid-cols-4 sm:grid-cols-2' : 'sm:grid-cols-2'}`}
      >
        {Array.from({ length: slots }, (_, index) => (
          <PlayerPicker
            key={selections[index] ? selectionKey(selections[index]!) : `empty-${index}`}
            index={index}
            selection={selections[index]}
            selections={selections}
            onSelect={(selection) => {
              const next = [...selections]
              if (index < next.length) next[index] = selection
              else next.push(selection)
              updateSelections(next)
              setExtraSlots(0)
            }}
            onRemove={() => {
              updateSelections(selections.filter((_, position) => position !== index))
              setExtraSlots(0)
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {slots < COMPARISON_LIMIT && (
          <button
            type="button"
            className="btn btn-primary disabled:opacity-50"
            disabled={selections.length < slots}
            onClick={() => setExtraSlots((value) => value + 1)}
          >
            Add another player
          </button>
        )}
        {selections.length > 0 && (
          <button
            type="button"
            className="btn border border-[var(--line)]"
            onClick={() => {
              updateSelections([])
              setExtraSlots(0)
            }}
          >
            Clear comparison
          </button>
        )}
        <p className="text-sm text-[var(--ink-soft)]" aria-live="polite">
          {selections.length} of {COMPARISON_LIMIT} player seasons selected
        </p>
      </div>
      {isPending && selections.length > 0 ? (
        <p role="status">Loading comparison…</p>
      ) : error ? (
        <p role="alert" className="island-shell p-6">
          Could not load the comparison. Reload to try again.
        </p>
      ) : (
        <PlayerComparison players={compared ?? []} />
      )}
    </main>
  )
}
