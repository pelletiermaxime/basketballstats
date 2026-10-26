export const CURRENT_YEAR = 2026
export const SEASON_YEARS = [2026, 2025, 2024, 2023]

export interface Team {
  _id: string
  name: string
  city: string
  abbreviation: string
  conference: string
}

export interface PlayerStat {
  _id: string
  playerId: string
  year: number
  firstName: string
  lastName: string
  fullName: string
  position: string
  gamesPlayed: number
  minutes: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fieldGoalPct: number
  threePointPct: number
  freeThrowPct: number
  team?: Team
}

export function seasonLabel(year: number) {
  return `${year}–${String(year + 1).slice(-2)}`
}

export function formatStat(value: number, percentage = false) {
  return percentage ? `${(value * 100).toFixed(1)}%` : value.toFixed(1)
}
