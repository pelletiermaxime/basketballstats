import { v } from 'convex/values'
import { internal } from './_generated/api'
import { action, internalMutation, internalQuery, type QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { fetchPlayerGameLog, MAX_PLAYER_GAMES, type PlayerGame } from './lib/nbaGameLog'
import { playerGame } from './schema'

async function findCachedLog(ctx: QueryCtx, playerSeasonId: Id<'playerStats'>) {
  return ctx.db
    .query('playerGameLogs')
    .withIndex('by_playerSeasonId', (q) => q.eq('playerSeasonId', playerSeasonId))
    .unique()
}

export const getSource = internalQuery({
  args: { playerSeasonId: v.id('playerStats') },
  handler: async (ctx, { playerSeasonId }) => ({
    season: await ctx.db.get('playerStats', playerSeasonId),
    cached: await findCachedLog(ctx, playerSeasonId),
  }),
})

export const saveGameLog = internalMutation({
  args: { playerSeasonId: v.id('playerStats'), fetchedAt: v.number(), games: v.array(playerGame) },
  handler: async (ctx, args) => {
    if (args.games.length > MAX_PLAYER_GAMES) throw new Error('Game log exceeds the season limit')
    const cached = await findCachedLog(ctx, args.playerSeasonId)
    if (cached && cached.fetchedAt >= args.fetchedAt) return cached.games
    if (cached) await ctx.db.replace('playerGameLogs', cached._id, args)
    else await ctx.db.insert('playerGameLogs', args)
    return args.games
  },
})

export const load = action({
  args: { playerSeasonId: v.id('playerStats') },
  handler: async (ctx, { playerSeasonId }): Promise<{ games: PlayerGame[]; stale: boolean }> => {
    const { season, cached } = await ctx.runQuery(internal.playerGameLogs.getSource, {
      playerSeasonId,
    })
    if (!season || !/^\d{1,16}$/.test(season.playerId)) return { games: [], stale: false }

    if (
      cached &&
      cached.games.filter((game) => game.phase === 'Regular season').length === season.gamesPlayed
    ) {
      return { games: cached.games, stale: false }
    }

    const fetchedAt = Date.now()
    let games: PlayerGame[]
    try {
      games = await fetchPlayerGameLog(season.playerId, season.year)
      if (cached?.games.length && games.length === 0) {
        throw new Error('ESPN returned an empty game log after a successful import')
      }
    } catch (error) {
      if (cached?.games.length) return { games: cached.games, stale: true }
      throw error
    }
    return {
      games: await ctx.runMutation(internal.playerGameLogs.saveGameLog, {
        playerSeasonId,
        fetchedAt,
        games,
      }),
      stale: false,
    }
  },
})
