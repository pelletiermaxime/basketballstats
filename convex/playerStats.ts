import { query, action, internalAction, internalMutation } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

interface PlayerStatsApi {
  id: string
  first_name: string
  last_name: string
  display_name: string
  team_alias: string
  position: string
  games_played: number
  minutes_average: number
  points_per_game: number
  rebounds_per_game: number
  assists_per_game: number
  steals_per_game: number
  blocks_per_game: number
  turnovers_per_game: number
  field_goals_pct: string
  three_point_goals_pct: string
  free_throw_pct: string
}

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

export const syncPlayerStatsAction = action({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const url = `https://stats-api.sportsnet.ca/web_player_table?league=nba&season_year=${args.year}&season_type=reg`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch player stats: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const apiPlayerStats: PlayerStatsApi[] = data.data?.player_stats?.players || []

    const playerStats = apiPlayerStats.map((s) => ({
      playerId: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      fullName: s.display_name,
      teamAbbreviation: s.team_alias,
      position: s.position || '',
      gamesPlayed: s.games_played || 0,
      minutes: s.minutes_average || 0,
      points: s.points_per_game || 0,
      rebounds: s.rebounds_per_game || 0,
      assists: s.assists_per_game || 0,
      steals: s.steals_per_game || 0,
      blocks: s.blocks_per_game || 0,
      turnovers: s.turnovers_per_game || 0,
      fieldGoalPct: Number.parseFloat(s.field_goals_pct || '0') / 100,
      threePointPct: Number.parseFloat(s.three_point_goals_pct || '0') / 100,
      freeThrowPct: Number.parseFloat(s.free_throw_pct || '0') / 100,
    }))

    await ctx.runMutation(internal.playerStats.syncPlayerStats, {
      year: args.year,
      playerStats,
    })

    return { count: playerStats.length }
  },
})

export const syncPlayerStatsInternalAction = internalAction({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    const url = `https://stats-api.sportsnet.ca/web_player_table?league=nba&season_year=${args.year}&season_type=reg`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch player stats: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const apiPlayerStats: PlayerStatsApi[] = data.data?.player_stats?.players || []

    const playerStats = apiPlayerStats.map((s) => ({
      playerId: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      fullName: s.display_name,
      teamAbbreviation: s.team_alias,
      position: s.position || '',
      gamesPlayed: s.games_played || 0,
      minutes: s.minutes_average || 0,
      points: s.points_per_game || 0,
      rebounds: s.rebounds_per_game || 0,
      assists: s.assists_per_game || 0,
      steals: s.steals_per_game || 0,
      blocks: s.blocks_per_game || 0,
      turnovers: s.turnovers_per_game || 0,
      fieldGoalPct: Number.parseFloat(s.field_goals_pct || '0') / 100,
      threePointPct: Number.parseFloat(s.three_point_goals_pct || '0') / 100,
      freeThrowPct: Number.parseFloat(s.free_throw_pct || '0') / 100,
    }))

    await ctx.runMutation(internal.playerStats.syncPlayerStats, {
      year: args.year,
      playerStats,
    })

    return { count: playerStats.length }
  },
})

export const syncPlayerStats = internalMutation({
  args: {
    year: v.number(),
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
    const allTeams = await ctx.db.query('teams').collect()
    const teamMapByAbbrev = new Map(allTeams.map((t) => [t.abbreviation, t._id]))

    const existingPlayerStats = await ctx.db
      .query('playerStats')
      .withIndex('year', (q) => q.eq('year', args.year))
      .collect()
    const existingMap = new Map(existingPlayerStats.map((s) => [s.playerId, s._id]))

    let inserted = 0
    let updated = 0

    for (const playerStat of args.playerStats) {
      const teamId = teamMapByAbbrev.get(playerStat.teamAbbreviation)

      if (!teamId) {
        continue
      }

      const existingId = existingMap.get(playerStat.playerId)

      const playerStatsData = {
        playerId: playerStat.playerId,
        firstName: playerStat.firstName,
        lastName: playerStat.lastName,
        fullName: playerStat.fullName,
        team_id: teamId,
        position: playerStat.position,
        year: args.year,
        gamesPlayed: playerStat.gamesPlayed,
        minutes: playerStat.minutes,
        points: playerStat.points,
        rebounds: playerStat.rebounds,
        assists: playerStat.assists,
        steals: playerStat.steals,
        blocks: playerStat.blocks,
        turnovers: playerStat.turnovers,
        fieldGoalPct: playerStat.fieldGoalPct,
        threePointPct: playerStat.threePointPct,
        freeThrowPct: playerStat.freeThrowPct,
      }

      if (existingId) {
        await ctx.db.patch(existingId, playerStatsData)
        updated++
      } else {
        await ctx.db.insert('playerStats', playerStatsData)
        inserted++
      }
    }

    return { inserted, updated }
  },
})
