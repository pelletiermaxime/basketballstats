import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { convexAction } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { seasonLabel } from '../lib/basketball'

type PlayerSeason = { _id: Id<'playerStats'>; year: number }

const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'America/New_York',
})

const GAME_COLUMNS = [
  ['minutes', 'MIN'],
  ['points', 'PTS'],
  ['rebounds', 'REB'],
  ['assists', 'AST'],
  ['steals', 'STL'],
  ['blocks', 'BLK'],
  ['turnovers', 'TO'],
  ['fieldGoals', 'FG'],
  ['threePointers', '3PT'],
  ['freeThrows', 'FT'],
] as const

export default function PlayerGameHistory({ seasons }: { seasons: PlayerSeason[] }) {
  const [seasonId, setSeasonId] = useState<Id<'playerStats'>>()
  const ordered = [...seasons].sort((a, b) => b.year - a.year)
  const selected = ordered.find((season) => season._id === seasonId) ?? ordered[0]!
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    ...convexAction(api.playerGameLogs.load, { playerSeasonId: selected._id }),
    staleTime: 0,
    retry: false,
  })

  return (
    <section className="island-shell mb-6 p-4 sm:p-6" aria-labelledby="game-history-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="game-history-heading" className="text-lg font-semibold">
          Game history
        </h2>
        <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          Game log season
          <select
            className="select"
            value={selected._id}
            onChange={(event) => setSeasonId(event.target.value as Id<'playerStats'>)}
          >
            {ordered.map((season) => (
              <option key={season._id} value={season._id}>
                {seasonLabel(season.year)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mb-3 text-sm text-[var(--ink-soft)]">
        Games are listed newest first, with dates in Eastern Time.
      </p>
      {isPending && <p role="status">Loading game history…</p>}
      {(isError || data?.stale) && (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <p role="status">
            {data?.games.length
              ? 'Game history could not be refreshed. Showing the last saved results.'
              : 'Game history is temporarily unavailable.'}
          </p>
          <button
            type="button"
            className="font-semibold text-[var(--hoops-orange-deep)] hover:underline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      )}
      {!isError && data?.games.length === 0 && (
        <p role="status">No game history is available for this season.</p>
      )}
      {data && data.games.length > 0 && (
        <div
          className="table-container max-h-[32rem] overflow-auto"
          role="region"
          aria-label="Game log"
          tabIndex={0}
        >
          <table className="data-table whitespace-nowrap">
            <caption className="sr-only">
              Game log for the {seasonLabel(selected.year)} season
            </caption>
            <thead className="sticky top-0">
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Matchup</th>
                <th scope="col">Stage</th>
                <th scope="col">Result</th>
                {GAME_COLUMNS.map(([key, label]) => (
                  <th key={key} scope="col" className="numeric">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.games.map((game) => (
                <tr key={game.eventId}>
                  <td>
                    <time dateTime={new Date(game.tipoff).toISOString()}>
                      {dateFormat.format(game.tipoff)}
                    </time>
                  </td>
                  <td>
                    {game.team} {game.venue} <abbr title={game.opponentName}>{game.opponent}</abbr>
                  </td>
                  <td>{game.phase}</td>
                  <td className="tabular-nums">
                    {game.result} {game.score}
                  </td>
                  {GAME_COLUMNS.map(([key]) => (
                    <td key={key} className="numeric">
                      {game[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
