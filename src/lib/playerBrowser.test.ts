import { describe, expect, it } from 'vite-plus/test'
import type { PlayerStat } from './basketball'
import {
  filterPlayers,
  pagination,
  parseBrowserSearch,
  qualificationMinimum,
} from './playerBrowser'

const base: PlayerStat = {
  _id: '1',
  playerId: '1',
  year: 2026,
  firstName: 'Luka',
  lastName: 'Dončić',
  fullName: 'Luka Dončić',
  position: 'PG',
  gamesPlayed: 70,
  minutes: 35,
  points: 30,
  rebounds: 8,
  assists: 9,
  steals: 1,
  blocks: 0.5,
  turnovers: 3,
  fieldGoalPct: 0.5,
  threePointPct: 0.35,
  freeThrowPct: 0.8,
  team: { _id: 'dal', city: 'Dallas', name: 'Mavericks', abbreviation: 'DAL', conference: 'West' },
}
const players: PlayerStat[] = [
  base,
  {
    ...base,
    _id: '2',
    playerId: '2',
    fullName: 'Daniel Gafford',
    position: 'F-C',
    gamesPlayed: 50,
    minutes: 24,
  },
  {
    ...base,
    _id: '3',
    playerId: '3',
    fullName: 'Alex Adams',
    position: 'G',
    gamesPlayed: 3,
    minutes: 5,
    team: { _id: 'bos', city: 'Boston', name: 'Celtics', abbreviation: 'BOS', conference: 'East' },
  },
]

function matches(search: Record<string, unknown>) {
  return filterPlayers(players, parseBrowserSearch(search)).map((player) => player.playerId)
}

describe('player browsing', () => {
  it('searches all players without requiring exact accents, case, or name order', () => {
    expect(matches({ q: '  DONCIC luka ' })).toEqual(['1'])
    expect(matches({ q: 'alex' })).toEqual(['3'])
    expect(matches({ q: 'unknown' })).toEqual([])
  })

  it('combines team, broad position, minimum games, and minutes filters', () => {
    expect(matches({ team: 'dal', position: 'C', minGames: 40, minMinutes: 20 })).toEqual(['2'])
    expect(matches({ position: 'F' })).toEqual(['2'])
    expect(matches({ position: 'G', minGames: 10, minMinutes: 30 })).toEqual(['1'])
    expect(matches({ team: 'BOS', minMinutes: 10 })).toEqual([])
  })

  it('qualifies relative to season games before other filters and respects stricter minimums', () => {
    expect(qualificationMinimum(players)).toBe(49)
    expect(matches({ qualified: true })).toEqual(['1', '2'])
    expect(matches({ qualified: true, minGames: 60 })).toEqual(['1'])
    expect(matches({ qualified: true, team: 'BOS' })).toEqual([])
    expect(qualificationMinimum([])).toBe(0)
  })

  it('validates URL values and rejects invalid season, sort, and pagination parameters', () => {
    expect(
      parseBrowserSearch({
        year: '2023',
        page: '3',
        pageSize: '50',
        desc: 'false',
        qualified: 'true',
      }),
    ).toMatchObject({
      year: 2023,
      page: 3,
      pageSize: 50,
      desc: false,
      qualified: true,
    })
    expect(
      parseBrowserSearch({
        year: 1900,
        page: -5,
        pageSize: 999,
        minGames: 'NaN',
        minMinutes: -2,
        sort: 'notAColumn',
        position: 'QB',
      }),
    ).toMatchObject({
      year: 2026,
      page: 1,
      pageSize: 25,
      minGames: 0,
      minMinutes: 0,
      sort: 'points',
      position: '',
    })
  })

  it('clamps out-of-range pages after results change and handles empty results', () => {
    expect(pagination(572, 23, 25)).toEqual({ page: 23, pageCount: 23, first: 551, last: 572 })
    expect(pagination(30, 23, 25)).toEqual({ page: 2, pageCount: 2, first: 26, last: 30 })
    expect(pagination(0, 5, 25)).toEqual({ page: 1, pageCount: 1, first: 0, last: 0 })
  })
})
