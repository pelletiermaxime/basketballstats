import { z } from 'zod'

export const MAX_SEASON_PLAYERS = 2000
const PAGE_SIZE = 100
const ENDPOINT =
  'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete'

const pageSchema = z.object({
  pagination: z.object({
    count: z.number().int().positive().max(MAX_SEASON_PLAYERS),
    page: z.number().int().positive(),
    pages: z.number().int().positive().max(20),
    limit: z.number().int().positive(),
  }),
  requestedSeason: z.object({
    year: z.number().int(),
    type: z.object({ type: z.literal(2) }),
  }),
  categories: z.array(z.object({ name: z.string(), names: z.array(z.string()) })),
  athletes: z.array(
    z.object({
      athlete: z.object({
        id: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        displayName: z.string().min(1),
        position: z.object({ abbreviation: z.string() }),
        teams: z.array(z.object({ abbreviation: z.string().min(1) })).min(1),
      }),
      categories: z.array(z.object({ name: z.string(), values: z.array(z.number()) })),
    }),
  ),
})

export interface SeasonPlayerStat {
  playerId: string
  firstName: string
  lastName: string
  fullName: string
  position: string
  teamAbbreviation: string
  gamesPlayed: number
  minutes: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fieldGoalPct: number
  threePointPct: number
  freeThrowPct: number
}

const teamCodes: Record<string, string> = {
  GS: 'GSW',
  NO: 'NOP',
  NY: 'NYK',
  SA: 'SAS',
  UTAH: 'UTA',
  WSH: 'WAS',
}

export function decodeSeasonPage(raw: unknown, year: number, page: number) {
  const data = pageSchema.parse(raw)
  if (
    data.requestedSeason.year !== year + 1 ||
    data.pagination.page !== page ||
    data.pagination.pages !== Math.ceil(data.pagination.count / data.pagination.limit)
  ) {
    throw new Error('Unexpected season or pagination in ESPN response')
  }
  const players: SeasonPlayerStat[] = data.athletes.map(({ athlete, categories }) => {
    const stats = new Map<string, number>()
    for (const category of categories) {
      const names = data.categories.find((definition) => definition.name === category.name)?.names
      if (!names || names.length !== category.values.length) {
        throw new Error(`Invalid stat columns for ${athlete.displayName}`)
      }
      names.forEach((name, index) => stats.set(name, category.values[index]!))
    }
    const stat = (name: string) => {
      const value = stats.get(name)
      if (value === undefined || !Number.isFinite(value) || value < 0) {
        throw new Error(`Invalid ${name} for ${athlete.displayName}`)
      }
      return value
    }
    const gamesPlayed = stat('gamesPlayed')
    if (!Number.isInteger(gamesPlayed) || gamesPlayed < 1) {
      throw new Error(`Invalid games played for ${athlete.displayName}`)
    }
    const percentage = (made: string, attempted: string) => {
      const makes = stat(made)
      const attempts = stat(attempted)
      if (makes > attempts) throw new Error(`Invalid shooting totals for ${athlete.displayName}`)
      return attempts === 0 ? 0 : makes / attempts
    }
    // This list belongs to the requested season, in stint order. Stats are the
    // full-season aggregate; the badge uses the final team from that season.
    const team = athlete.teams[athlete.teams.length - 1]!.abbreviation
    return {
      playerId: athlete.id,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      fullName: athlete.displayName,
      position: athlete.position.abbreviation,
      teamAbbreviation: teamCodes[team] ?? team,
      gamesPlayed,
      minutes: stat('avgMinutes'),
      points: stat('points') / gamesPlayed,
      rebounds: stat('rebounds') / gamesPlayed,
      assists: stat('assists') / gamesPlayed,
      steals: stat('steals') / gamesPlayed,
      blocks: stat('blocks') / gamesPlayed,
      turnovers: stat('turnovers') / gamesPlayed,
      fieldGoalPct: percentage('fieldGoalsMade', 'fieldGoalsAttempted'),
      threePointPct: percentage('threePointFieldGoalsMade', 'threePointFieldGoalsAttempted'),
      freeThrowPct: percentage('freeThrowsMade', 'freeThrowsAttempted'),
    }
  })
  return { pagination: data.pagination, players }
}

export async function fetchSeasonPlayerStats(year: number, request: typeof fetch = fetch) {
  if (!Number.isInteger(year) || year < 1946 || year > 2100)
    throw new Error('Invalid NBA season year')
  const players = new Map<string, SeasonPlayerStat>()
  let expectedCount: number | undefined
  let expectedPages = 1
  for (let page = 1; page <= expectedPages; page++) {
    const url = new URL(ENDPOINT)
    url.search = new URLSearchParams({
      season: String(year + 1),
      seasontype: '2',
      isqualified: 'false',
      limit: String(PAGE_SIZE),
      page: String(page),
      sort: 'offensive.avgPoints:desc',
    }).toString()
    const response = await request(url)
    if (!response.ok)
      throw new Error(`ESPN season fetch failed on page ${page}: ${response.status}`)
    const decoded = decodeSeasonPage(await response.json(), year, page)
    if (
      expectedCount !== undefined &&
      (expectedCount !== decoded.pagination.count || expectedPages !== decoded.pagination.pages)
    ) {
      throw new Error('ESPN pagination changed during sync; retry the complete season')
    }
    expectedCount = decoded.pagination.count
    expectedPages = decoded.pagination.pages
    if (decoded.players.length === 0) throw new Error(`Empty ESPN page ${page}`)
    for (const player of decoded.players) {
      if (players.has(player.playerId)) throw new Error(`Duplicate ESPN player ${player.playerId}`)
      players.set(player.playerId, player)
    }
  }
  if (players.size !== expectedCount) {
    throw new Error(
      `Incomplete ESPN season: expected ${expectedCount} players, received ${players.size}`,
    )
  }
  return [...players.values()]
}
