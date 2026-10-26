import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { formatStat, seasonLabel, type PlayerStat } from '../lib/basketball'
import { selectionKey } from '../lib/comparison'
import TeamLogo from './TeamLogo'
import SeasonTrendChart, { TREND_METRICS, type TrendMetric } from './SeasonTrendChart'

const SEASON_COLUMNS = [
  { key: 'minutes', label: 'MIN', percentage: false },
  { key: 'points', label: 'PTS', percentage: false },
  { key: 'rebounds', label: 'REB', percentage: false },
  { key: 'assists', label: 'AST', percentage: false },
  { key: 'steals', label: 'STL', percentage: false },
  { key: 'blocks', label: 'BLK', percentage: false },
  { key: 'turnovers', label: 'TO', percentage: false },
  { key: 'fieldGoalPct', label: 'FG%', percentage: true },
  { key: 'threePointPct', label: '3P%', percentage: true },
  { key: 'freeThrowPct', label: 'FT%', percentage: true },
] as const

export default function PlayerHistory({ seasons }: { seasons: PlayerStat[] }) {
  const [metric, setMetric] = useState<TrendMetric>('points')
  const ordered = [...seasons].sort((a, b) => a.year - b.year)

  return (
    <>
      <section className="island-shell p-4 sm:p-6" aria-labelledby="season-trends-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="island-kicker mb-1">Season history</p>
            <h2 id="season-trends-heading" className="text-lg font-semibold">
              How the numbers changed
            </h2>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
            Chart statistic
            <select
              className="select max-w-full"
              value={metric}
              onChange={(event) => setMetric(event.target.value as TrendMetric)}
            >
              {Object.entries(TREND_METRICS).map(([key, definition]) => (
                <option key={key} value={key}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <SeasonTrendChart seasons={ordered} metric={metric} />
        </div>
      </section>

      <section className="mt-6" aria-labelledby="season-statistics-heading">
        <h2 id="season-statistics-heading" className="mb-2 text-lg font-semibold">
          Season statistics
        </h2>
        <p className="mb-3 text-sm text-[var(--ink-soft)]">
          {ordered.length} imported {ordered.length === 1 ? 'season' : 'seasons'}. Statistics are
          regular-season per-game averages; shooting columns show percentages. Traded players show
          season totals across teams, with their final team as the badge.
        </p>
        <div className="table-container">
          <table className="data-table">
            <caption className="sr-only">Imported season statistics and comparison links</caption>
            <thead>
              <tr>
                <th scope="col">Season</th>
                <th scope="col">Team</th>
                <th scope="col">GP</th>
                {SEASON_COLUMNS.map((column) => (
                  <th scope="col" key={column.key}>
                    {column.label}
                  </th>
                ))}
                <th scope="col">Compare</th>
              </tr>
            </thead>
            <tbody>
              {[...ordered].reverse().map((row) => (
                <tr key={row.year}>
                  <th scope="row">{seasonLabel(row.year)}</th>
                  <td>
                    <TeamLogo team={row.team} />
                  </td>
                  <td className="numeric">{row.gamesPlayed}</td>
                  {SEASON_COLUMNS.map((column) => (
                    <td className="numeric" key={column.key}>
                      {formatStat(row[column.key], column.percentage)}
                    </td>
                  ))}
                  <td>
                    <Link
                      to="/compare"
                      search={{ players: selectionKey(row) }}
                      className="font-semibold text-[var(--hoops-orange-deep)] hover:underline"
                      aria-label={`Compare ${row.fullName}, ${seasonLabel(row.year)}`}
                    >
                      Compare
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
