import { z } from 'zod'
import type { Infer } from 'convex/values'
import type { playerGame } from '../schema'

export type PlayerGame = Infer<typeof playerGame>
export const MAX_PLAYER_GAMES = 128

const ENDPOINT = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes'

const eventId = z.string().regex(/^\d{1,16}$/)
const count = z
  .string()
  .regex(/^\d{1,3}$/)
  .transform(Number)
const shooting = z.string().regex(/^\d{1,3}-\d{1,3}$/)
const minutes = z.string().regex(/^\d{1,3}(?::[0-5]\d)?$/)
const team = z.object({ abbreviation: z.string().min(1).max(8) })
const eventSchema = z.object({
  gameDate: z.iso.datetime({ offset: true }),
  atVs: z.enum(['@', 'vs']),
  gameResult: z.enum(['W', 'L']),
  homeTeamScore: count,
  awayTeamScore: count,
  team: team.extend({ isAllStar: z.boolean().optional() }),
  opponent: team.extend({ displayName: z.string().min(1).max(100) }),
  eventNote: z.string().optional(),
})

const responseSchema = z.object({
  filters: z.array(z.object({ name: z.string(), value: z.string() })),
  names: z.array(z.string()).optional(),
  events: z.record(z.string(), z.unknown()).optional(),
  seasonTypes: z
    .array(
      z.object({
        displayName: z.string(),
        categories: z.array(
          z.object({
            events: z
              .array(z.object({ eventId, stats: z.array(z.string()).optional() }))
              .optional(),
          }),
        ),
      }),
    )
    .optional(),
})

export function decodePlayerGameLog(raw: unknown, year: number): PlayerGame[] {
  const { filters, names, events, seasonTypes } = responseSchema.parse(raw)
  const selectedSeason = filters.find((filter) => filter.name === 'season')
  // ESPN sends only the league filter when a player has no log for the season.
  if (!selectedSeason && !names && !events && !seasonTypes) return []
  if (selectedSeason?.value !== String(year + 1) || !names || !events || !seasonTypes) {
    throw new Error('Unexpected season or missing ESPN game log data')
  }

  const season = `${year}-${String(year + 1).slice(-2)}`
  const phases = new Map<string, PlayerGame['phase']>([
    [`${season} Regular Season`, 'Regular season'],
    [`${season} Play In Regular Season`, 'Play-in'],
    [`${season} Postseason`, 'Playoffs'],
  ])
  const games = new Map<string, PlayerGame>()
  for (const { displayName, categories } of seasonTypes) {
    const phase = phases.get(displayName)
    if (!phase) continue
    for (const category of categories) {
      for (const row of category.events ?? []) {
        if (!row.stats?.length) continue
        const event = eventSchema.parse(events[row.eventId])
        if (event.team.isAllStar) continue
        const stats = row.stats
        if (stats.length !== names.length) throw new Error('Invalid ESPN game stat columns')
        const stat = (name: string) => stats[names.indexOf(name)]
        const [teamScore, opponentScore] =
          event.atVs === '@'
            ? [event.awayTeamScore, event.homeTeamScore]
            : [event.homeTeamScore, event.awayTeamScore]
        games.set(row.eventId, {
          eventId: row.eventId,
          tipoff: Date.parse(event.gameDate),
          phase: /NBA (Cup|In-Season Tournament).*Championship/i.test(event.eventNote ?? '')
            ? 'NBA Cup final'
            : phase,
          team: event.team.abbreviation,
          opponent: event.opponent.abbreviation,
          opponentName: event.opponent.displayName,
          venue: event.atVs,
          result: event.gameResult,
          score: `${teamScore}–${opponentScore}`,
          minutes: minutes.parse(stat('minutes')),
          points: count.parse(stat('points')),
          rebounds: count.parse(stat('totalRebounds')),
          assists: count.parse(stat('assists')),
          steals: count.parse(stat('steals')),
          blocks: count.parse(stat('blocks')),
          turnovers: count.parse(stat('turnovers')),
          fieldGoals: shooting.parse(stat('fieldGoalsMade-fieldGoalsAttempted')),
          threePointers: shooting.parse(
            stat('threePointFieldGoalsMade-threePointFieldGoalsAttempted'),
          ),
          freeThrows: shooting.parse(stat('freeThrowsMade-freeThrowsAttempted')),
        })
      }
    }
  }
  if (games.size > MAX_PLAYER_GAMES) throw new Error('ESPN game log exceeds the season limit')
  return [...games.values()].sort((a, b) => b.tipoff - a.tipoff)
}

export async function fetchPlayerGameLog(playerId: string, year: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(`${ENDPOINT}/${playerId}/gamelog?season=${year + 1}`, {
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`ESPN game log fetch failed: ${response.status}`)
    return decodePlayerGameLog(await response.json(), year)
  } finally {
    clearTimeout(timeout)
  }
}
