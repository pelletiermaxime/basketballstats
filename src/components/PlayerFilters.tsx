import { useMemo } from 'react'
import type { PlayerStat } from '../lib/basketball'
import { qualificationMinimum, type PlayerBrowserSearch } from '../lib/playerBrowser'

interface PlayerFiltersProps {
  players: PlayerStat[]
  search: PlayerBrowserSearch
  onChange: (patch: Partial<PlayerBrowserSearch>, replace?: boolean) => void
  onReset: () => void
}

export default function PlayerFilters({ players, search, onChange, onReset }: PlayerFiltersProps) {
  const teams = useMemo(
    () =>
      [
        ...new Map(
          players.flatMap((player) =>
            player.team ? [[player.team.abbreviation, player.team] as const] : [],
          ),
        ).values(),
      ].sort((a, b) => a.city.localeCompare(b.city)),
    [players],
  )
  const qualificationGames = qualificationMinimum(players)

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="flex flex-col gap-1 text-sm font-medium sm:col-span-2">
        Search players
        <input
          type="search"
          value={search.q}
          onChange={(event) => onChange({ q: event.target.value }, true)}
          placeholder="Search any player…"
          maxLength={100}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--ink)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Team
        <select
          value={search.team}
          onChange={(event) => onChange({ team: event.target.value })}
          className="select"
        >
          <option value="">All teams</option>
          {search.team && !teams.some((team) => team.abbreviation === search.team) && (
            <option value={search.team}>{search.team}</option>
          )}
          {teams.map((team) => (
            <option key={team._id} value={team.abbreviation}>
              {team.city} {team.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Position
        <select
          value={search.position}
          onChange={(event) =>
            onChange({ position: event.target.value as PlayerBrowserSearch['position'] })
          }
          className="select"
        >
          <option value="">All positions</option>
          <option value="G">Guards</option>
          <option value="F">Forwards</option>
          <option value="C">Centers</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Minimum games
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={search.minGames}
          onChange={(event) => onChange({ minGames: Number(event.target.value) }, true)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--ink)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Minimum minutes/game
        <input
          type="number"
          min={0}
          max={60}
          step={0.1}
          value={search.minMinutes}
          onChange={(event) => onChange({ minMinutes: Number(event.target.value) }, true)}
          className="rounded-lg border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-[var(--ink)]"
        />
      </label>
      <div className="flex flex-col justify-center gap-1 sm:col-span-2 lg:col-span-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={search.qualified}
            onChange={(event) => onChange({ qualified: event.target.checked })}
            className="accent-[var(--hoops-orange)]"
            aria-describedby="qualification-description"
          />
          Qualified players only
        </label>
        <p id="qualification-description" className="text-xs text-[var(--ink-soft)]">
          At least {qualificationGames} games: 70% of the most games played in this season. This is
          a browsing filter.
        </p>
      </div>
      <div className="flex items-center lg:justify-end">
        <button
          type="button"
          onClick={onReset}
          className="btn border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
        >
          Reset filters
        </button>
      </div>
    </div>
  )
}
