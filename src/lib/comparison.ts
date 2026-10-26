import { SEASON_YEARS, formatStat, type PlayerStat } from './basketball'

export interface PlayerSelection {
  playerId: string
  year: number
}

export const COMPARISON_LIMIT = 4

export function selectionKey(selection: PlayerSelection) {
  return `${encodeURIComponent(selection.playerId)}:${selection.year}`
}

export function parseComparisonSearch(value: unknown): PlayerSelection[] {
  if (typeof value !== 'string') return []
  const seen = new Set<string>()
  const selections: PlayerSelection[] = []
  for (const entry of value.split(',')) {
    const match = /^(.*):(\d{4})$/.exec(entry)
    if (!match) continue
    let playerId: string
    try {
      playerId = decodeURIComponent(match[1]!)
    } catch {
      continue
    }
    const selection = { playerId, year: Number(match[2]) }
    const key = selectionKey(selection)
    if (!SEASON_YEARS.includes(selection.year) || seen.has(key)) continue
    selections.push(selection)
    seen.add(key)
    if (selections.length === COMPARISON_LIMIT) break
  }
  return selections
}

export function serializeComparisonSearch(selections: PlayerSelection[]) {
  return selections.map(selectionKey).join(',') || undefined
}

export const COMPARISON_METRICS = [
  { key: 'gamesPlayed', label: 'Games played', shortLabel: 'GP' },
  { key: 'minutes', label: 'Minutes per game', shortLabel: 'MIN' },
  { key: 'points', label: 'Points per game', shortLabel: 'PTS' },
  { key: 'rebounds', label: 'Rebounds per game', shortLabel: 'REB' },
  { key: 'assists', label: 'Assists per game', shortLabel: 'AST' },
  { key: 'steals', label: 'Steals per game', shortLabel: 'STL' },
  { key: 'blocks', label: 'Blocks per game', shortLabel: 'BLK' },
  { key: 'turnovers', label: 'Turnovers per game', shortLabel: 'TO', lowerIsBetter: true },
  { key: 'fieldGoalPct', label: 'Field goal percentage', shortLabel: 'FG%', percentage: true },
  { key: 'threePointPct', label: 'Three-point percentage', shortLabel: '3P%', percentage: true },
  { key: 'freeThrowPct', label: 'Free throw percentage', shortLabel: 'FT%', percentage: true },
] satisfies {
  key: keyof PlayerStat
  label: string
  shortLabel: string
  percentage?: boolean
  lowerIsBetter?: boolean
}[]

export type ComparisonMetric = (typeof COMPARISON_METRICS)[number]

// Compare the displayed precision so equal-looking values stay neutral.
// At least two available entries are needed for comparison.
export function leadingPlayerIndex(players: (PlayerStat | null)[], metric: ComparisonMetric) {
  const values = players.flatMap((player, index) =>
    player
      ? [
          {
            index,
            value: Number(formatStat(player[metric.key], 'percentage' in metric).replace('%', '')),
          },
        ]
      : [],
  )
  if (values.length < 2) return -1
  const best = ('lowerIsBetter' in metric ? Math.min : Math.max)(
    ...values.map((item) => item.value),
  )
  const leaders = values.filter((item) => Math.abs(item.value - best) < 1e-9)
  return leaders.length === 1 ? leaders[0]!.index : -1
}
