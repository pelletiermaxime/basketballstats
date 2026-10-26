// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vite-plus/test'
import { api } from './_generated/api'
import schema from './schema'
import sample from './lib/fixtures/espn-2023-sample.json'
import { decodeSeasonPage } from './lib/nbaSeason'

const modules = import.meta.glob(['./**/*.ts', '!./**/*.test.ts'])
const players = decodeSeasonPage(sample, 2023, 1).players

async function setup() {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) => {
    const dallas = await ctx.db.insert('teams', {
      name: 'Mavericks',
      city: 'Dallas',
      abbreviation: 'DAL',
      conference: 'West',
      division: 'Southwest',
      nbaApiId: 1610612742,
    })
    const losAngeles = await ctx.db.insert('teams', {
      name: 'Lakers',
      city: 'Los Angeles',
      abbreviation: 'LAL',
      conference: 'West',
      division: 'Pacific',
      nbaApiId: 1610612747,
    })
    for (const { teamAbbreviation: _, ...player } of players) {
      await ctx.db.insert('playerStats', { ...player, year: 2023, team_id: dallas })
    }
    const { teamAbbreviation: _, ...luka } = players[0]!
    for (let index = 0; index < 110; index++) {
      await ctx.db.insert('playerStats', {
        ...luka,
        playerId: String(800000 + index),
        fullName: `Bench ${index}`,
        points: index / 10,
        year: 2023,
        team_id: dallas,
      })
    }
    await ctx.db.insert('playerStats', {
      ...luka,
      year: 2025,
      team_id: losAngeles,
      points: 29,
      gamesPlayed: 63,
    })
  })
  return t
}

describe('player browsing queries', () => {
  it('returns the complete season beyond the original top 100', async () => {
    const t = await setup()
    const all = await t.query(api.playerStats.getSeasonPlayerStatsWithTeams, { year: 2023 })
    expect(all).toHaveLength(113)
    expect(all.some((player) => player.fullName === 'Bench 0')).toBe(true)
    expect(all.every((player) => player.team?.abbreviation === 'DAL')).toBe(true)
    expect(all[0]?.playerId).toBe(players[0]!.playerId)
    const top = await t.query(api.playerStats.getTopPlayerStatsWithTeams, { year: 2023 })
    expect(top).toHaveLength(100)
    expect(top.some((player) => player.fullName === 'Bench 0')).toBe(false)
    expect(await t.query(api.playerStats.getSeasonPlayerStatsWithTeams, { year: 2024 })).toEqual([])
  })

  it('joins one ESPN identity across seasons in chronological order', async () => {
    const t = await setup()
    const history = await t.query(api.playerStats.getPlayerHistoryWithTeams, {
      playerId: players[0]!.playerId,
    })
    expect(history.map((row) => [row.year, row.team?.abbreviation, row.points])).toEqual([
      [2023, 'DAL', 2370 / 70],
      [2025, 'LAL', 29],
    ])
    expect(
      await t.query(api.playerStats.getPlayerHistoryWithTeams, { playerId: '999999' }),
    ).toEqual([])
  })

  it('preserves comparison order, cross-season entries, and unavailable slots', async () => {
    const t = await setup()
    const comparison = await t.query(api.playerStats.getPlayerComparisons, {
      selections: [
        { playerId: players[0]!.playerId, year: 2025 },
        { playerId: players[1]!.playerId, year: 2023 },
        { playerId: players[0]!.playerId, year: 2023 },
        { playerId: '999999', year: 2026 },
      ],
    })
    expect(comparison.map((row) => (row ? [row.playerId, row.year] : null))).toEqual([
      [players[0]!.playerId, 2025],
      [players[1]!.playerId, 2023],
      [players[0]!.playerId, 2023],
      null,
    ])
    expect(await t.query(api.playerStats.getPlayerComparisons, { selections: [] })).toEqual([])
  })

  it('looks up opaque string IDs and returns empty results for unknown strings', async () => {
    const t = await setup()
    const playerId = 'provider:player,abcdefghijklmnopqrstuvwxyz'
    await t.run(async (ctx) => {
      const original = await ctx.db.query('playerStats').first()
      const { _id, _creationTime, ...data } = original!
      await ctx.db.insert('playerStats', { ...data, playerId, year: 2026 })
    })
    const history = await t.query(api.playerStats.getPlayerHistoryWithTeams, { playerId })
    expect(history.map((row) => row.playerId)).toEqual([playerId])
    const comparisons = await t.query(api.playerStats.getPlayerComparisons, {
      selections: [
        { playerId, year: 2026 },
        { playerId: 'unknown-player', year: 2026 },
      ],
    })
    expect(comparisons[0]?.playerId).toBe(playerId)
    expect(comparisons[1]).toBeNull()
    expect(
      await t.query(api.playerStats.getPlayerHistoryWithTeams, {
        playerId: 'unknown-player',
      }),
    ).toEqual([])
  })

  it('rejects duplicate comparisons, oversized requests, and invalid input', async () => {
    const t = await setup()
    const selection = { playerId: players[0]!.playerId, year: 2023 }
    await expect(
      t.query(api.playerStats.getPlayerComparisons, {
        selections: [selection, selection],
      }),
    ).rejects.toThrow('Duplicate player season')
    await expect(
      t.query(api.playerStats.getPlayerComparisons, {
        selections: Array.from({ length: 5 }, () => selection),
      }),
    ).rejects.toThrow('four')
    await expect(
      t.query(api.playerStats.getSeasonPlayerStatsWithTeams, {
        year: 2023.5,
      }),
    ).rejects.toThrow('Invalid NBA season year')
    await expect(
      t.query(api.playerStats.getTopPlayerStatsWithTeams, {
        year: 2023,
        limit: 101,
      }),
    ).rejects.toThrow('between 1 and 100')
  })
})
