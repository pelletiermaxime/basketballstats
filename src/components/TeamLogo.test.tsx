// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import TeamLogo from './TeamLogo'

const team = {
  _id: 'team-1',
  city: 'Boston',
  name: 'Celtics',
  abbreviation: 'BOS',
  conference: 'East',
}

afterEach(cleanup)

describe('team logos', () => {
  it('uses a local SVG with a full accessible team name at compact and profile sizes', () => {
    const { rerender } = render(<TeamLogo team={team} />)
    const image = screen.getByRole('img', { name: 'Boston Celtics' })
    expect(image.getAttribute('src')).toBe('/team-logos/bos.svg')
    expect(image.getAttribute('width')).toBe('36')
    rerender(<TeamLogo team={team} size="lg" />)
    expect(screen.getByRole('img', { name: 'Boston Celtics' }).getAttribute('width')).toBe('144')
  })

  it('falls back to the team name on failure and loads a different team normally', () => {
    const { rerender } = render(<TeamLogo team={team} />)
    fireEvent.error(screen.getByRole('img', { name: 'Boston Celtics' }))
    expect(screen.getByText('Boston Celtics')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
    rerender(
      <TeamLogo team={{ ...team, city: 'Los Angeles', name: 'Lakers', abbreviation: 'LAL' }} />,
    )
    expect(screen.getByRole('img', { name: 'Los Angeles Lakers' }).getAttribute('src')).toBe(
      '/team-logos/lal.svg',
    )
  })

  it('labels an unavailable team without showing a broken image', () => {
    render(<TeamLogo />)
    expect(screen.getByLabelText('Team unavailable')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })
})
