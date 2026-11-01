import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import sample from './fixtures/espn-2023-sample.json'
import { decodeSeasonPage, fetchSeasonPlayerStats } from './nbaSeason'

function page(number: number, athleteIndex: number) {
  return {
    ...sample,
    pagination: { count: 2, pages: 2, page: number, limit: 1 },
    athletes: [sample.athletes[athleteIndex]],
  }
}

describe('complete NBA season ingestion', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('uses full-season totals for traded players and includes low-appearance players', () => {
    const players = decodeSeasonPage(sample, 2023, 1).players
    const gafford = players.find((row) => row.fullName === 'Daniel Gafford')!
    expect(gafford).toMatchObject({ gamesPlayed: 74, points: 11, teamAbbreviation: 'DAL' })
    expect(gafford.fieldGoalPct).toBe(348 / 480)
    expect(players.find((row) => row.fullName === 'Luka Doncic')?.points).toBe(2370 / 70)
    expect(players.find((row) => row.fullName === 'Isaiah Thomas')?.gamesPlayed).toBe(6)
  })

  it('fetches every page without qualification filtering and converts the season year', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(Response.json(page(2, 1)))
    const players = await fetchSeasonPlayerStats(2023, request)
    expect(players).toHaveLength(2)
    expect(request).toHaveBeenCalledTimes(2)
    const firstUrl = request.mock.calls[0]![0] as URL
    expect(firstUrl).toBeInstanceOf(URL)
    expect(firstUrl.searchParams.get('season')).toBe('2024')
    expect(firstUrl.searchParams.get('isqualified')).toBe('false')
    expect((request.mock.calls[1]![0] as URL).searchParams.get('page')).toBe('2')
  })

  it('rejects failed later pages instead of importing a partial season', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
    await expect(fetchSeasonPlayerStats(2023, request)).rejects.toThrow('page 2: 503')
  })

  it('retries identical duplicates even when every unique player is present', async () => {
    const secondPage = page(2, 1)
    secondPage.athletes.unshift(sample.athletes[0])
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(Response.json(secondPage))
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(Response.json(page(2, 1)))
    const assertion = expect(fetchSeasonPlayerStats(2023, request)).resolves.toEqual(
      decodeSeasonPage(sample, 2023, 1).players.slice(0, 2),
    )
    await vi.runAllTimersAsync()
    await assertion
    expect(request).toHaveBeenCalledTimes(4)
  })

  it('restarts from page one when a duplicate replaces a missing player', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(Response.json(page(2, 0)))
      .mockResolvedValueOnce(Response.json(page(1, 1)))
      .mockResolvedValueOnce(Response.json(page(2, 2)))
    const assertion = expect(fetchSeasonPlayerStats(2023, request)).resolves.toEqual(
      decodeSeasonPage(sample, 2023, 1).players.slice(1, 3),
    )
    await vi.runAllTimersAsync()
    await assertion
    expect(request.mock.calls.map(([url]) => (url as URL).searchParams.get('page'))).toEqual([
      '1',
      '2',
      '1',
      '2',
    ])
  })

  it('retries when the advertised player count changes between pages', async () => {
    const changedPage = page(2, 1)
    changedPage.pagination = { count: 3, pages: 3, page: 2, limit: 1 }
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(Response.json(changedPage))
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(Response.json(page(2, 1)))
    const assertion = expect(fetchSeasonPlayerStats(2023, request)).resolves.toHaveLength(2)
    await vi.runAllTimersAsync()
    await assertion
    expect(request).toHaveBeenCalledTimes(4)
  })

  it.each([false, true])(
    'rejects persistent duplicates after three attempts (conflicting stats: %s)',
    async (conflicting) => {
      const response = structuredClone(sample)
      const duplicate = structuredClone(response.athletes[0]!)
      if (conflicting) duplicate.categories[0]!.values[0]! += 1
      response.athletes.push(duplicate)
      const request = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(response))
      const assertion = expect(fetchSeasonPlayerStats(2023, request)).rejects.toThrow(
        'Duplicate ESPN player',
      )
      await vi.runAllTimersAsync()
      await assertion
      expect(request).toHaveBeenCalledTimes(3)
    },
  )

  it('rejects an advertised count larger than the returned player list', async () => {
    const response = { ...sample, athletes: sample.athletes.slice(0, 1) }
    const request = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(response))
    const assertion = expect(fetchSeasonPlayerStats(2023, request)).rejects.toThrow(
      'Incomplete ESPN season',
    )
    await vi.runAllTimersAsync()
    await assertion
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('rejects the wrong season and missing stat columns', () => {
    expect(() => decodeSeasonPage(sample, 2024, 1)).toThrow('Unexpected season')
    expect(() => decodeSeasonPage({ ...sample, categories: [] }, 2023, 1)).toThrow(
      'Invalid stat columns',
    )
  })

  it('maps ESPN team abbreviations to the existing team records', () => {
    const response = structuredClone(sample)
    response.athletes[0]!.athlete.teams = [{ abbreviation: 'GS' }]
    expect(decodeSeasonPage(response, 2023, 1).players[0]?.teamAbbreviation).toBe('GSW')
  })
})
