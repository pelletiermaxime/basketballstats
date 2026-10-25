// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vite-plus/test'
import { internal } from './_generated/api'
import schema from './schema'
import sample from './lib/fixtures/espn-2023-sample.json'
import { decodeSeasonPage } from './lib/nbaSeason'

const modules = import.meta.glob(['./**/*.ts', '!./**/*.test.ts'])
const players = decodeSeasonPage(sample, 2023, 1).players.slice(0, 2)

async function setup() {
  const t = convexTest(schema, modules)
  await t.run((ctx) =>
    ctx.db.insert('teams', {
      name: 'Mavericks',
      city: 'Dallas',
      abbreviation: 'DAL',
      conference: 'West',
      division: 'Southwest',
      nbaApiId: 1610612742,
    }),
  )
  return t
}

describe('season sync writes', () => {
  it('inserts players by ESPN ID and skips unchanged writes', async () => {
    const t = await setup()
    expect(
      await t.mutation(internal.playerStats.syncPlayerStats, { year: 2023, playerStats: players }),
    ).toEqual({ inserted: 2, updated: 0, unchanged: 0, dryRun: false })
    expect(
      await t.mutation(internal.playerStats.syncPlayerStats, { year: 2023, playerStats: players }),
    ).toEqual({ inserted: 0, updated: 0, unchanged: 2, dryRun: false })
    const rows = await t.run((ctx) => ctx.db.query('playerStats').take(10))
    expect(rows.map((row) => row.playerId).sort()).toEqual(
      players.map((player) => player.playerId).sort(),
    )
  })

  it('updates stats and names from the source without creating another player', async () => {
    const t = await setup()
    await t.mutation(internal.playerStats.syncPlayerStats, { year: 2023, playerStats: players })
    const corrected = players.map((player, index) =>
      index === 0 ? { ...player, fullName: 'Luka Dončić', points: player.points + 1 } : player,
    )
    expect(
      await t.mutation(internal.playerStats.syncPlayerStats, {
        year: 2023,
        playerStats: corrected,
      }),
    ).toEqual({ inserted: 0, updated: 1, unchanged: 1, dryRun: false })
    const rows = await t.run((ctx) => ctx.db.query('playerStats').take(10))
    expect(rows).toHaveLength(2)
    expect(rows.find((row) => row.playerId === corrected[0]!.playerId)).toMatchObject({
      fullName: 'Luka Dončić',
      points: corrected[0]!.points,
    })
  })

  it('validates a dry run without writing records', async () => {
    const t = await setup()
    expect(
      await t.mutation(internal.playerStats.syncPlayerStats, {
        year: 2023,
        playerStats: players,
        dryRun: true,
      }),
    ).toEqual({ inserted: 2, updated: 0, unchanged: 0, dryRun: true })
    expect(await t.run((ctx) => ctx.db.query('playerStats').take(10))).toHaveLength(0)
  })

  it('refuses unknown teams before writing any players', async () => {
    const t = await setup()
    await expect(
      t.mutation(internal.playerStats.syncPlayerStats, {
        year: 2023,
        playerStats: [players[0]!, { ...players[1]!, teamAbbreviation: 'UNKNOWN' }],
      }),
    ).rejects.toThrow('Unknown NBA team')
    expect(await t.run((ctx) => ctx.db.query('playerStats').take(10))).toHaveLength(0)
  })

  it('refuses incomplete source data without changing existing records', async () => {
    const t = await setup()
    await t.mutation(internal.playerStats.syncPlayerStats, { year: 2023, playerStats: players })
    await expect(
      t.mutation(internal.playerStats.syncPlayerStats, {
        year: 2023,
        playerStats: [players[1]!],
      }),
    ).rejects.toThrow('Source is missing existing players')
    expect(await t.run((ctx) => ctx.db.query('playerStats').take(10))).toHaveLength(2)
  })
})
