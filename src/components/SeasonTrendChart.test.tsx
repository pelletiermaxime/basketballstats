// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import type { PlayerStat } from '../lib/basketball'
import SeasonTrendChart from './SeasonTrendChart'

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

const row = (year: number): PlayerStat => ({ ...base, _id: `stats-${year}`, year })

afterEach(cleanup)

describe('season trend chart', () => {
  it('shows a single season as one point with an explanation and no fabricated line', () => {
    render(<SeasonTrendChart seasons={[base]} metric="points" />)
    expect(screen.getByRole('img', { name: 'Points per game by imported season' })).toBeDefined()
    expect(screen.getAllByTestId('season-trend-point')).toHaveLength(1)
    expect(screen.queryAllByTestId('season-trend-segment')).toHaveLength(0)
    expect(screen.getByText('One imported season is available.', { exact: false })).toBeDefined()
    const circle = screen.getByTestId('season-trend-point')
    expect(Number.isFinite(Number(circle.getAttribute('cx')))).toBe(true)
    expect(Number.isFinite(Number(circle.getAttribute('cy')))).toBe(true)
  })

  it('sorts seasons chronologically and leaves missing years unconnected', () => {
    render(<SeasonTrendChart seasons={[row(2026), row(2023), row(2025)]} metric="assists" />)
    expect(screen.getAllByTestId('season-trend-point')).toHaveLength(3)
    expect(screen.getAllByTestId('season-trend-segment')).toHaveLength(1)
    const points = screen.getAllByTestId('season-trend-point')
    expect(points.map((point) => point.textContent)).toEqual([
      '2023–24: 9.8',
      '2025–26: 9.8',
      '2026–27: 9.8',
    ])
  })

  it('formats shooting ratios as percentages in visible and accessible labels', () => {
    render(<SeasonTrendChart seasons={[base]} metric="fieldGoalPct" />)
    const chart = screen.getByRole('img', { name: 'Field goal percentage by imported season' })
    expect(chart.textContent).toContain('2023–24: 48.7%')
    expect(screen.getByText('48.7%', { selector: 'text' })).toBeDefined()
    expect(screen.getByText('100.0%', { selector: 'text' })).toBeDefined()
  })

  it('handles an empty history without invalid SVG coordinates', () => {
    render(<SeasonTrendChart seasons={[]} metric="points" />)
    expect(screen.getByText('No season history to chart.')).toBeDefined()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
