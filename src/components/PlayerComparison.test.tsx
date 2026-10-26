// @vitest-environment jsdom

import type { ReactNode } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import type { PlayerStat } from '../lib/basketball'
import PlayerComparison from './PlayerComparison'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params }: { children: ReactNode; params: { playerId: string } }) => (
    <a href={`/players/${params.playerId}`}>{children}</a>
  ),
}))

const base: PlayerStat = {
  _id: 'a',
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
}

afterEach(cleanup)

describe('PlayerComparison', () => {
  it('compares seasons side by side with sample sizes and correctly directed highlights', () => {
    render(
      <PlayerComparison
        players={[
          base,
          { ...base, _id: 'b', year: 2025, points: 30, turnovers: 4, gamesPlayed: 50 },
          null,
        ]}
      />,
    )
    expect(screen.getAllByRole('link', { name: 'Alex Adams' })).toHaveLength(2)
    expect(screen.getByText(/2026–27/)).toBeTruthy()
    expect(screen.getByText(/2025–26/)).toBeTruthy()
    const pointCells = within(screen.getByRole('row', { name: /Points per game/ })).getAllByRole(
      'cell',
    )
    expect(pointCells[0]?.textContent).toBe('20.0')
    expect(pointCells[1]?.textContent).toContain('30.0 (comparison leader)')
    const turnoverCells = within(
      screen.getByRole('row', { name: /Turnovers per game/ }),
    ).getAllByRole('cell')
    expect(turnoverCells[0]?.textContent).toContain('2.0 (comparison leader)')
    expect(turnoverCells[1]?.textContent).toBe('4.0')
    const percentageCells = within(
      screen.getByRole('row', { name: /Field goal percentage/ }),
    ).getAllByRole('cell')
    expect(percentageCells[0]?.textContent).toBe('50.0%')
    expect(screen.getByText('Unavailable season')).toBeTruthy()
    expect(screen.getByText(/sample size/)).toBeTruthy()
  })

  it('prompts for two available player seasons before showing a comparison', () => {
    render(<PlayerComparison players={[base, null]} />)
    expect(screen.getByRole('heading', { name: 'Choose at least two player seasons' })).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
