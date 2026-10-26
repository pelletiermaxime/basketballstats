// @vitest-environment jsdom

import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import type { PlayerStat } from '../lib/basketball'
import PlayerHistory from './PlayerHistory'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    search,
    ...props
  }: {
    children: ReactNode
    to: string
    search: { players: string }
  }) => (
    <a href={`${to}?players=${search.players}`} {...props}>
      {children}
    </a>
  ),
}))

const base: PlayerStat = {
  _id: 'stats-1',
  playerId: '3945274',
  year: 2023,
  firstName: 'Luka',
  lastName: 'Doncic',
  fullName: 'Luka Doncic',
  position: 'G',
  gamesPlayed: 70,
  minutes: 37.5,
  points: 33.9,
  rebounds: 9.2,
  assists: 9.8,
  steals: 1.4,
  blocks: 0.5,
  turnovers: 4,
  fieldGoalPct: 0.4867,
  threePointPct: 0.3817,
  freeThrowPct: 0.7862,
}

afterEach(cleanup)

describe('player history', () => {
  it('switches among scoring, minutes, playmaking, and shooting history', () => {
    render(<PlayerHistory seasons={[base]} />)
    const selector = screen.getByLabelText('Chart statistic')
    for (const [metric, name] of [
      ['points', 'Points per game'],
      ['minutes', 'Minutes per game'],
      ['assists', 'Assists per game'],
      ['fieldGoalPct', 'Field goal percentage'],
      ['threePointPct', 'Three-point percentage'],
      ['freeThrowPct', 'Free throw percentage'],
    ]) {
      fireEvent.change(selector, { target: { value: metric } })
      expect(screen.getByRole('img', { name: `${name} by imported season` })).toBeDefined()
    }
  })

  it('shows newest seasons first with sample sizes, shooting percentages and season-specific compare links', () => {
    render(
      <PlayerHistory seasons={[base, { ...base, _id: 'stats-2', year: 2025, gamesPlayed: 60 }]} />,
    )
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    expect(rows[0]?.textContent).toContain('2025–26')
    expect(rows[1]?.textContent).toContain('2023–24')
    expect(within(rows[0]!).getByText('60')).toBeDefined()
    expect(within(rows[1]!).getByText('48.7%')).toBeDefined()
    expect(
      screen.getByRole('link', { name: 'Compare Luka Doncic, 2023–24' }).getAttribute('href'),
    ).toBe('/compare?players=3945274:2023')
    expect(screen.getByText('2 imported seasons.', { exact: false })).toBeDefined()
  })
})
