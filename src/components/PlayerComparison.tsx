import { Link } from '@tanstack/react-router'
import { formatStat, seasonLabel, type PlayerStat } from '../lib/basketball'
import { COMPARISON_METRICS, leadingPlayerIndex } from '../lib/comparison'
import TeamLogo from './TeamLogo'

export default function PlayerComparison({ players }: { players: (PlayerStat | null)[] }) {
  if (players.filter(Boolean).length < 2) {
    return (
      <div className="island-shell p-8 text-center">
        <h2 className="text-lg font-semibold">Choose at least two player seasons</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Compare different players, or the same player across seasons.
        </p>
      </div>
    )
  }

  return (
    <section aria-label="Player comparison" className="space-y-4">
      <p className="text-sm text-[var(--ink-soft)]">
        Highlighted values lead this comparison. Lower turnovers are better; ties stay neutral.
        Per-game averages depend on playing time and sample size—check games and minutes too.
      </p>
      <div className="table-container">
        <table className="data-table">
          <caption className="sr-only">Player season statistics compared side by side</caption>
          <thead>
            <tr>
              <th scope="col">Statistic</th>
              {players.map((player, index) => (
                <th
                  key={player ? `${player.playerId}:${player.year}` : `missing-${index}`}
                  scope="col"
                >
                  {player ? (
                    <>
                      <Link
                        to="/players/$playerId"
                        params={{ playerId: player.playerId }}
                        className="font-semibold text-[var(--ink)] hover:underline"
                      >
                        {player.fullName}
                      </Link>
                      <div className="mt-2 flex items-center gap-2 font-normal normal-case tracking-normal text-[var(--ink-soft)]">
                        <TeamLogo team={player.team} />
                        <span>
                          {seasonLabel(player.year)} · {player.position}
                        </span>
                      </div>
                    </>
                  ) : (
                    'Unavailable season'
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_METRICS.map((metric) => {
              const leader = leadingPlayerIndex(players, metric)
              return (
                <tr key={metric.key}>
                  <th scope="row" className="text-left !normal-case !tracking-normal">
                    {metric.label}
                  </th>
                  {players.map((player, index) => (
                    <td
                      key={player ? `${player.playerId}:${player.year}` : `missing-${index}`}
                      className={`numeric ${index === leader ? 'font-bold text-[var(--hoops-orange-deep)]' : ''}`}
                    >
                      {player ? (
                        <>
                          {metric.key === 'gamesPlayed'
                            ? player.gamesPlayed
                            : formatStat(player[metric.key], 'percentage' in metric)}
                          {index === leader && (
                            <span className="sr-only"> (comparison leader)</span>
                          )}
                        </>
                      ) : (
                        <span aria-label="Not available">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
