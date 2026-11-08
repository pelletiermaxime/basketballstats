// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { afterEach, expect, it, vi } from 'vite-plus/test'
import { api, internal } from './_generated/api'
import schema from './schema'
import sample from './lib/fixtures/espn-2023-sample.json'
import { decodeSeasonPage } from './lib/nbaSeason'

const modules = import.meta.glob(['./**/*.ts', '!./**/*.test.ts'])
const names = [
  'points',
  'minutes',
  'totalRebounds',
  'assists',
  'steals',
  'blocks',
  'turnovers',
  'fieldGoalsMade-fieldGoalsAttempted',
  'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
  'freeThrowsMade-freeThrowsAttempted',
]
const stats = ['21', '33:20', '7', '6', '2', '0', '1', '8-12', '3-5', '2-2']

const event = {
  gameDate: '2024-04-10T01:00:00.000+00:00',
  atVs: '@',
  gameResult: 'L',
  awayTeamScore: '110',
  homeTeamScore: '120',
  team: { abbreviation: 'DAL' },
  opponent: { abbreviation: 'LAL', displayName: 'Los Angeles Lakers' },
}

function response(season = '2024', extraGame = false) {
  return Response.json({
    filters: [{ name: 'season', value: season }],
    names,
    events: {
      '1': event,
      '2': { ...event, team: { abbreviation: 'BKN' }, gameDate: '2024-03-05T01:00:00.000+00:00' },
      '3': { ...event, gameDate: '2024-04-17T01:00:00.000+00:00' },
      '4': { ...event, gameDate: '2024-04-22T01:00:00.000+00:00' },
      '7': { ...event, team: { abbreviation: 'WEST', isAllStar: true } },
      '8': {
        ...event,
        gameDate: '2023-12-10T01:30:00.000+00:00',
        eventNote: 'NBA In-Season Tournament Championship',
      },
      '9': { ...event, gameDate: '2024-04-11T01:00:00.000+00:00' },
    },
    seasonTypes: [
      {
        displayName: '2023-24 Regular Season',
        categories: [
          {
            events: [
              { eventId: '1', stats },
              { eventId: '2', stats },
              { eventId: '5' },
              { eventId: '7', stats },
              { eventId: '8', stats },
              ...(extraGame ? [{ eventId: '9', stats }] : []),
            ],
          },
        ],
      },
      {
        displayName: '2023-24 Preseason',
        categories: [{ events: [{ eventId: '6', stats }] }],
      },
      {
        displayName: '2023-24 Play In Regular Season',
        categories: [{ events: [{ eventId: '3', stats }] }],
      },
      {
        displayName: '2023-24 Postseason',
        categories: [{ events: [{ eventId: '4', stats }] }, {}],
      },
    ],
  })
}

async function setup() {
  const t = convexTest(schema, modules)
  const { teamAbbreviation: _, ...player } = decodeSeasonPage(sample, 2023, 1).players[0]!
  const playerSeasonId = await t.run(async (ctx) => {
    const team_id = await ctx.db.insert('teams', {
      name: 'Mavericks',
      city: 'Dallas',
      abbreviation: 'DAL',
      conference: 'West',
      division: 'Southwest',
      nbaApiId: 1610612742,
    })
    return ctx.db.insert('playerStats', { ...player, year: 2023, gamesPlayed: 2, team_id })
  })
  return { t, player, playerSeasonId }
}

afterEach(() => vi.unstubAllGlobals())

it('reuses an old log when its regular-season game count matches the imported total', async () => {
  const { t, player, playerSeasonId } = await setup()
  const request = vi.fn(() => response())
  vi.stubGlobal('fetch', request)

  const log = await t.action(api.playerGameLogs.load, { playerSeasonId })
  expect(request).toHaveBeenCalledWith(
    expect.stringContaining(`/athletes/${player.playerId}/gamelog?season=2024`),
    expect.any(Object),
  )
  expect(log.games.map(({ eventId, phase, team }) => [eventId, phase, team])).toEqual([
    ['4', 'Playoffs', 'DAL'],
    ['3', 'Play-in', 'DAL'],
    ['1', 'Regular season', 'DAL'],
    ['2', 'Regular season', 'BKN'],
    ['8', 'NBA Cup final', 'DAL'],
  ])
  expect(log.games[2]).toMatchObject({
    score: '110–120',
    opponent: 'LAL',
    minutes: '33:20',
    points: 21,
    fieldGoals: '8-12',
  })
  await t.run(async (ctx) => {
    const cached = await ctx.db.query('playerGameLogs').unique()
    await ctx.db.patch('playerGameLogs', cached!._id, { fetchedAt: 0 })
  })
  expect(await t.action(api.playerGameLogs.load, { playerSeasonId })).toEqual(log)
  expect(request).toHaveBeenCalledTimes(1)
})

it('refreshes after the imported count changes and keeps the saved log if the refresh fails', async () => {
  const { t, playerSeasonId } = await setup()
  const request = vi
    .fn()
    .mockImplementationOnce(() => response())
    .mockImplementationOnce(() => response('2025'))
    .mockImplementationOnce(() => response('2024', true))
  vi.stubGlobal('fetch', request)
  const log = await t.action(api.playerGameLogs.load, { playerSeasonId })
  await t.run(async (ctx) => {
    await ctx.db.patch('playerStats', playerSeasonId, { gamesPlayed: 3 })
  })

  expect(await t.action(api.playerGameLogs.load, { playerSeasonId })).toEqual({
    games: log.games,
    stale: true,
  })
  const refreshed = await t.action(api.playerGameLogs.load, { playerSeasonId })
  expect(refreshed.stale).toBe(false)
  expect(refreshed.games).toHaveLength(log.games.length + 1)
  expect(refreshed.games).toContainEqual(expect.objectContaining({ eventId: '9' }))
  expect(await t.action(api.playerGameLogs.load, { playerSeasonId })).toEqual(refreshed)
  expect(
    await t.mutation(internal.playerGameLogs.saveGameLog, {
      playerSeasonId,
      fetchedAt: 0,
      games: [],
    }),
  ).toEqual(refreshed.games)
  expect(request).toHaveBeenCalledTimes(3)
})

it('distinguishes an unavailable upstream log from a failed request', async () => {
  const { t, playerSeasonId } = await setup()
  const request = vi
    .fn()
    .mockResolvedValueOnce(new Response('', { status: 503 }))
    .mockResolvedValueOnce(Response.json({ filters: [{ name: 'league', value: 'nba' }] }))
  vi.stubGlobal('fetch', request)

  await expect(t.action(api.playerGameLogs.load, { playerSeasonId })).rejects.toThrow('503')
  expect(await t.action(api.playerGameLogs.load, { playerSeasonId })).toEqual({
    games: [],
    stale: false,
  })
})
