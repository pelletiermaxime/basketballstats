import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const playerGame = v.object({
  eventId: v.string(),
  tipoff: v.number(),
  phase: v.union(
    v.literal('Regular season'),
    v.literal('NBA Cup final'),
    v.literal('Play-in'),
    v.literal('Playoffs'),
  ),
  team: v.string(),
  opponent: v.string(),
  opponentName: v.string(),
  venue: v.union(v.literal('@'), v.literal('vs')),
  result: v.union(v.literal('W'), v.literal('L')),
  score: v.string(),
  minutes: v.string(),
  points: v.number(),
  rebounds: v.number(),
  assists: v.number(),
  steals: v.number(),
  blocks: v.number(),
  turnovers: v.number(),
  fieldGoals: v.string(),
  threePointers: v.string(),
  freeThrows: v.string(),
})

export default defineSchema({
  teams: defineTable({
    name: v.string(),
    city: v.string(),
    abbreviation: v.string(),
    conference: v.string(),
    division: v.string(),
    nbaApiId: v.number(),
  })
    .index('abbreviation', ['abbreviation'])
    .index('conference', ['conference'])
    .index('nbaApiId', ['nbaApiId']),

  playerStats: defineTable({
    playerId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    fullName: v.string(),
    team_id: v.id('teams'),
    position: v.string(),
    year: v.number(),
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
  })
    .index('playerId', ['playerId'])
    .index('year', ['year'])
    .index('year_playerId', ['year', 'playerId'])
    .index('year_team_id', ['year', 'team_id'])
    .index('year_points', ['year', 'points'])
    .index('year_gamesPlayed', ['year', 'gamesPlayed'])
    .index('year_rebounds', ['year', 'rebounds'])
    .index('year_assists', ['year', 'assists'])
    .index('year_steals', ['year', 'steals'])
    .index('year_blocks', ['year', 'blocks']),

  // ESPN supplies one bounded season log, which can be refreshed atomically.
  playerGameLogs: defineTable({
    playerSeasonId: v.id('playerStats'),
    fetchedAt: v.number(),
    games: v.array(playerGame),
  }).index('by_playerSeasonId', ['playerSeasonId']),
})
