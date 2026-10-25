import { describe, expect, it, vi } from 'vite-plus/test'
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

  it('rejects duplicates across pages', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(page(1, 0)))
      .mockResolvedValueOnce(Response.json(page(2, 0)))
    await expect(fetchSeasonPlayerStats(2023, request)).rejects.toThrow('Duplicate ESPN player')
  })

  it('rejects an advertised count larger than the returned player list', async () => {
    const response = { ...sample, athletes: sample.athletes.slice(0, 1) }
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(response))
    await expect(fetchSeasonPlayerStats(2023, request)).rejects.toThrow('Incomplete ESPN season')
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
