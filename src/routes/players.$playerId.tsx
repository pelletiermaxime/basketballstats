import { Link, createFileRoute } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { useSuspenseQuery } from '@tanstack/react-query'
import { api } from '@convex/_generated/api'
import PlayerHistory from '../components/PlayerHistory'
import TeamLogo from '../components/TeamLogo'
import { formatStat, seasonLabel } from '../lib/basketball'

export const Route = createFileRoute('/players/$playerId')({
  component: PlayerProfile,
  head: ({ params }) => ({
    meta: [{ title: `Player ${params.playerId} season history | Basketball Stats` }],
  }),
})

function PlayerProfile() {
  const { playerId } = Route.useParams()
  const { data: seasons } = useSuspenseQuery(
    convexQuery(api.playerStats.getPlayerHistoryWithTeams, { playerId }),
  )
  const latest = seasons[seasons.length - 1]

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <Link
        to="/"
        className="mb-5 inline-flex text-sm font-semibold text-[var(--hoops-orange-deep)] hover:underline"
      >
        ← All players
      </Link>
      {!latest ? (
        <section className="island-shell p-8 text-center sm:p-12">
          <p className="island-kicker mb-2">Player history</p>
          <h1 className="text-2xl font-bold">Player not found</h1>
          <p className="mt-3 text-[var(--ink-soft)]">
            No imported season statistics are available for this player. Browse the leaderboard to
            find a player with recorded stats.
          </p>
        </section>
      ) : (
        <>
          <section className="island-shell mb-6 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4 sm:gap-6">
              <div className="min-w-0">
                <p className="island-kicker mb-2">Player profile</p>
                <h1 className="text-3xl font-bold tracking-tight">{latest.fullName}</h1>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {latest.position} ·{' '}
                  {latest.team ? `${latest.team.city} ${latest.team.name}` : 'Team unavailable'} ·
                  Latest imported season: {seasonLabel(latest.year)}
                </p>
              </div>
              {latest.team && <TeamLogo team={latest.team} size="lg" />}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Points per game', value: formatStat(latest.points) },
                { label: 'Rebounds per game', value: formatStat(latest.rebounds) },
                { label: 'Assists per game', value: formatStat(latest.assists) },
                { label: 'Games played', value: String(latest.gamesPlayed) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4"
                >
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>
          <PlayerHistory seasons={seasons} />
        </>
      )}
    </main>
  )
}
