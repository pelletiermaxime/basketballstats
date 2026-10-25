// @vitest-environment jsdom

import { useState, type ComponentProps } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import type { SortingState } from '@tanstack/react-table'
import PlayerStatsTable from './PlayerStatsTable'

type PlayerStat = ComponentProps<typeof PlayerStatsTable>['stats'][number]

const baseStat: PlayerStat = {
  _id: '1',
  playerId: '1',
  firstName: 'Alex',
  lastName: 'Adams',
  fullName: 'Alex Adams',
  position: 'G',
  gamesPlayed: 70,
  minutes: 32.5,
  points: 9.5,
  rebounds: 5,
  assists: 7.2,
  steals: 1,
  blocks: 0.5,
  turnovers: 2,
  fieldGoalPct: 0.512,
  threePointPct: 0.4,
  freeThrowPct: 0.875,
}

const stats: PlayerStat[] = [
  baseStat,
  {
    ...baseStat,
    _id: '2',
    playerId: '2',
    fullName: 'Blake Brown',
    points: 30,
    team: {
      _id: 'team-1',
      city: 'Boston',
      name: 'Celtics',
      abbreviation: 'BOS',
      conference: 'East',
    },
  },
]

function ControlledTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'points', desc: true }])
  return <PlayerStatsTable stats={stats} sorting={sorting} onSortingChange={setSorting} />
}

function playerOrder() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0]?.textContent)
}

afterEach(cleanup)

describe('PlayerStatsTable', () => {
  it('sorts points numerically and responds to controlled sorting changes', () => {
    render(<ControlledTable />)
    expect(playerOrder()).toEqual(['Blake Brown', 'Alex Adams'])

    fireEvent.click(screen.getByRole('columnheader', { name: 'PTS' }))
    expect(playerOrder()).toEqual(['Alex Adams', 'Blake Brown'])

    fireEvent.click(screen.getByRole('columnheader', { name: 'PTS' }))
    fireEvent.click(screen.getByRole('columnheader', { name: 'PTS' }))
    expect(playerOrder()).toEqual(['Blake Brown', 'Alex Adams'])
  })

  it('sorts player names alphabetically', () => {
    render(<ControlledTable />)
    fireEvent.click(screen.getByRole('columnheader', { name: 'Player' }))
    expect(playerOrder()).toEqual(['Alex Adams', 'Blake Brown'])
    fireEvent.click(screen.getByRole('columnheader', { name: 'Player' }))
    expect(playerOrder()).toEqual(['Blake Brown', 'Alex Adams'])
  })

  it('preserves stat formatting and handles a player without a team', () => {
    render(<ControlledTable />)
    const row = screen.getByText('Alex Adams').closest('tr')!
    const cells = within(row).getAllByRole('cell')
    expect(cells[1]?.textContent).toBe('-')
    expect(cells[4]?.textContent).toBe('32.5')
    expect(cells[5]?.textContent).toBe('9.5')
    expect(cells[11]?.textContent).toBe('51.2%')
    expect(cells[13]?.textContent).toBe('87.5%')
    expect(screen.getByTitle('Boston Celtics').textContent).toBe('BOS')
  })
})
