import { formatStat, seasonLabel, type PlayerStat } from '../lib/basketball'

export const TREND_METRICS = {
  points: { label: 'Points per game', percentage: false },
  minutes: { label: 'Minutes per game', percentage: false },
  assists: { label: 'Assists per game', percentage: false },
  fieldGoalPct: { label: 'Field goal percentage', percentage: true },
  threePointPct: { label: 'Three-point percentage', percentage: true },
  freeThrowPct: { label: 'Free throw percentage', percentage: true },
} as const

export type TrendMetric = keyof typeof TREND_METRICS

interface SeasonTrendChartProps {
  seasons: PlayerStat[]
  metric: TrendMetric
}

export default function SeasonTrendChart({ seasons, metric }: SeasonTrendChartProps) {
  const ordered = [...seasons].sort((a, b) => a.year - b.year)
  const definition = TREND_METRICS[metric]
  if (ordered.length === 0) {
    return <p className="text-sm text-[var(--ink-soft)]">No season history to chart.</p>
  }

  const firstYear = ordered[0]!.year
  const lastYear = ordered[ordered.length - 1]!.year
  const maximum = definition.percentage
    ? 1
    : Math.max(1, Math.ceil(Math.max(...ordered.map((row) => row[metric])) * 1.15))
  const x = (year: number) =>
    firstYear === lastYear ? 370 : 58 + ((year - firstYear) / (lastYear - firstYear)) * 624
  const y = (value: number) => 210 - (value / maximum) * 170

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 720 260"
        role="img"
        aria-label={`${definition.label} by imported season`}
        className="block h-auto w-full min-w-[320px] text-[var(--ink-soft)]"
      >
        <title>{definition.label} by imported season</title>
        <desc>
          {ordered
            .map(
              (row) =>
                `${seasonLabel(row.year)}: ${formatStat(row[metric], definition.percentage)}`,
            )
            .join('; ')}
          . Missing seasons are not connected.
        </desc>
        {[0, maximum / 2, maximum].map((tick) => (
          <g key={tick}>
            <line x1="58" x2="682" y1={y(tick)} y2={y(tick)} stroke="var(--line)" />
            <text x="48" y={y(tick) + 4} textAnchor="end" fill="currentColor" fontSize="11">
              {formatStat(tick, definition.percentage)}
            </text>
          </g>
        ))}
        {ordered.slice(1).map((row, index) => {
          const previous = ordered[index]!
          if (row.year !== previous.year + 1) return null
          return (
            <line
              key={`${previous.year}-${row.year}`}
              data-testid="season-trend-segment"
              x1={x(previous.year)}
              y1={y(previous[metric])}
              x2={x(row.year)}
              y2={y(row[metric])}
              stroke="var(--hoops-orange)"
              strokeWidth="3"
            />
          )
        })}
        {ordered.map((row) => (
          <g key={row.year}>
            <circle
              data-testid="season-trend-point"
              cx={x(row.year)}
              cy={y(row[metric])}
              r="5"
              fill="var(--hoops-orange)"
              stroke="var(--surface-strong)"
              strokeWidth="2"
            >
              <title>
                {seasonLabel(row.year)}: {formatStat(row[metric], definition.percentage)}
              </title>
            </circle>
            <text
              x={x(row.year)}
              y={y(row[metric]) - 13}
              textAnchor="middle"
              fill="var(--ink)"
              fontSize="12"
              fontWeight="600"
            >
              {formatStat(row[metric], definition.percentage)}
            </text>
            <text x={x(row.year)} y="238" textAnchor="middle" fill="currentColor" fontSize="12">
              {seasonLabel(row.year)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-xs text-[var(--ink-soft)]">
        {ordered.length === 1
          ? 'One imported season is available. More seasons are needed to show a trend.'
          : 'Only imported seasons are shown. Missing seasons are left unconnected.'}
      </figcaption>
    </figure>
  )
}
