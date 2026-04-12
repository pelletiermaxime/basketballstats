import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

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
})
