import { describe, expect, it } from 'vite-plus/test'
import type { PlayerStat } from './basketball'
import {
  COMPARISON_METRICS,
  leadingPlayerIndex,
  parseComparisonSearch,
  serializeComparisonSearch,
} from './comparison'

function player(overrides: Partial<PlayerStat> = {}): PlayerStat {
  return {
    _id: 'row',
    playerId: '1',
    year: 2026,
    firstName: 'Alex',
    lastName: 'Adams',
    fullName: 'Alex Adams',
    position: 'G',
    gamesPlayed: 70,
    minutes: 30,
    points: 20,
    rebounds: 4,
    assists: 6,
    steals: 1,
    blocks: 0.5,
    turnovers: 2,
    fieldGoalPct: 0.5,
    threePointPct: 0.4,
    freeThrowPct: 0.8,
    ...overrides,
  }
}

const points = COMPARISON_METRICS.find((metric) => metric.key === 'points')!
const turnovers = COMPARISON_METRICS.find((metric) => metric.key === 'turnovers')!

describe('comparison selections', () => {
  it('preserves distinct seasons for one player while excluding duplicate player seasons', () => {
    const selected = parseComparisonSearch('3945274:2023,3945274:2024,3945274:2023')
    expect(selected).toEqual([
      { playerId: '3945274', year: 2023 },
      { playerId: '3945274', year: 2024 },
    ])
    expect(serializeComparisonSearch(selected)).toBe('3945274:2023,3945274:2024')
  })

  it('drops malformed entries and unavailable seasons and caps selection at four entries', () => {
    expect(parseComparisonSearch('oops,1:1999,1:2026,2:2026,3:2026,4:2026,5:2026')).toEqual([
      { playerId: '1', year: 2026 },
      { playerId: '2', year: 2026 },
      { playerId: '3', year: 2026 },
      { playerId: '4', year: 2026 },
    ])
    expect(parseComparisonSearch(undefined)).toEqual([])
    expect(serializeComparisonSearch([])).toBeUndefined()
  })

  it('round-trips opaque string IDs without numeric or length restrictions', () => {
    const selections = [
      { playerId: 'player-abc', year: 2026 },
      { playerId: '123456789012345678901234567890', year: 2025 },
      { playerId: 'provider:player,with/symbols%', year: 2023 },
    ]
    expect(parseComparisonSearch(serializeComparisonSearch(selections))).toEqual(selections)
  })
})

describe('comparison leaders', () => {
  it('highlights the highest score and the lowest turnovers', () => {
    const players = [player({ points: 10, turnovers: 1 }), player({ points: 30, turnovers: 4 })]
    expect(leadingPlayerIndex(players, points)).toBe(1)
    expect(leadingPlayerIndex(players, turnovers)).toBe(0)
  })

  it('keeps ties neutral and requires two available player seasons', () => {
    expect(leadingPlayerIndex([player(), player({ points: 20 + 1e-10 })], points)).toBe(-1)
    expect(leadingPlayerIndex([null, player()], points)).toBe(-1)
    expect(leadingPlayerIndex([null, player({ points: 30 }), player()], points)).toBe(1)
  })

  it('keeps values that round to the same displayed number neutral', () => {
    expect(
      leadingPlayerIndex([player({ turnovers: 4.02 }), player({ turnovers: 4.04 })], turnovers),
    ).toBe(-1)
    const shooting = COMPARISON_METRICS.find((metric) => metric.key === 'fieldGoalPct')!
    expect(
      leadingPlayerIndex(
        [player({ fieldGoalPct: 0.5001 }), player({ fieldGoalPct: 0.5004 })],
        shooting,
      ),
    ).toBe(-1)
  })
})
