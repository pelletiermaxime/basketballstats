import { query, action, internalAction, internalMutation } from './_generated/server'
import type { ActionCtx, QueryCtx } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { fetchSeasonPlayerStats, MAX_SEASON_PLAYERS } from './lib/nbaSeason'

async function fetchPlayerStatsWithTeams(ctx: QueryCtx, year: number, limit?: number) {
  const statsQuery = ctx.db
    .query('playerStats')
    .withIndex('year_points', (q) => q.eq('year', year))
    .order('desc')

  const playerStats = limit ? await statsQuery.take(limit) : await statsQuery.collect()

  const teams = await ctx.db.query('teams').collect()
  const teamMap = new Map(teams.map((t) => [t._id.toString(), t]))

  return playerStats.map((stat) => {
    const team = teamMap.get(stat.team_id.toString())
    return {
      ...stat,
      team,
    }
  })
}

export const getTopPlayerStatsWithTeams = query({
  args: { year: v.number(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return fetchPlayerStatsWithTeams(ctx, args.year, args.limit ?? 100)
  },
})

interface SyncResult {
  count: number
  inserted: number
  updated: number
  unchanged: number
  dryRun: boolean
}

async function syncSeason(ctx: ActionCtx, year: number, dryRun = false): Promise<SyncResult> {
  const playerStats = await fetchSeasonPlayerStats(year)
  const result = await ctx.runMutation(internal.playerStats.syncPlayerStats, {
    year,
    playerStats,
    dryRun,
  })
  return { count: playerStats.length, ...result }
}

export const syncPlayerStatsAction = action({
  args: { year: v.number() },
  handler: (ctx, args): Promise<SyncResult> => syncSeason(ctx, args.year),
})

export const syncPlayerStatsInternalAction = internalAction({
  args: { year: v.number(), dryRun: v.optional(v.boolean()) },
  handler: (ctx, args): Promise<SyncResult> => syncSeason(ctx, args.year, args.dryRun),
})

export const syncPlayerStats = internalMutation({
  args: {
    year: v.number(),
    dryRun: v.optional(v.boolean()),
    playerStats: v.array(
      v.object({
        playerId: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        fullName: v.string(),
        teamAbbreviation: v.string(),
        position: v.string(),
        gamesPlayed: v.number(),
        minutes: v.number(),
        points: v.number(),
        rebounds: v.number(),
        assists: v.number(),
        steals: v.number(),
        blocks: v.number(),
        turnovers: v.number(),
        fieldGoalPct: v.number(),
        threePointPct: v.number(),
        freeThrowPct: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const allTeams = await ctx.db.query('teams').take(100)
    const teamMapByAbbrev = new Map(allTeams.map((team) => [team.abbreviation, team._id]))
    const existingPlayerStats = await ctx.db
      .query('playerStats')
      .withIndex('year', (q) => q.eq('year', args.year))
      .take(MAX_SEASON_PLAYERS + 1)
    if (
      existingPlayerStats.length > MAX_SEASON_PLAYERS ||
      args.playerStats.length > MAX_SEASON_PLAYERS
    ) {
      throw new Error('Season exceeds the supported player limit')
    }
    const byPlayerId = new Map(existingPlayerStats.map((row) => [row.playerId, row]))
    if (byPlayerId.size !== existingPlayerStats.length) {
      throw new Error('Duplicate existing player ID')
    }
    const incomingIds = new Set<string>()
    const plan = args.playerStats.map(({ teamAbbreviation, ...playerStat }) => {
      if (incomingIds.has(playerStat.playerId)) throw new Error('Duplicate incoming player')
      incomingIds.add(playerStat.playerId)
      const teamId = teamMapByAbbrev.get(teamAbbreviation)
      if (!teamId) throw new Error(`Unknown NBA team: ${teamAbbreviation}`)
      const existing = byPlayerId.get(playerStat.playerId)
      const data = { ...playerStat, team_id: teamId, year: args.year }
      const changed =
        !existing ||
        Object.entries(data).some(
          ([key, value]) => existing[key as keyof typeof existing] !== value,
        )
      return { existing, data, changed }
    })
    if (existingPlayerStats.some((row) => !incomingIds.has(row.playerId))) {
      throw new Error('Source is missing existing players')
    }
    let inserted = 0
    let updated = 0
    let unchanged = 0
    for (const { existing, data, changed } of plan) {
      if (!changed) {
        unchanged++
      } else if (existing) {
        if (!args.dryRun) await ctx.db.patch(existing._id, data)
        updated++
      } else {
        if (!args.dryRun) await ctx.db.insert('playerStats', data)
        inserted++
      }
    }
    return { inserted, updated, unchanged, dryRun: args.dryRun ?? false }
  },
})
