import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'

interface Team {
  _id: string
  name: string
  city: string
  abbreviation: string
  conference: string
}

interface PlayerStat {
  _id: string
  playerId: string
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

interface PlayerStatsTableProps {
  stats: PlayerStat[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}

const columnHelper = createColumnHelper<PlayerStat>()

const formatNumber = (value: number, decimals = 1) => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(decimals)
}

const formatPct = (value: number) => `${(value * 100).toFixed(1)}%`

export default function PlayerStatsTable({
  stats,
  sorting,
  onSortingChange,
}: PlayerStatsTableProps) {
  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater
    onSortingChange(newSorting)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullName', {
        header: 'Player',
        cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'team',
        header: 'Team',
        cell: (info) => {
          const team = info.row.original.team
          if (!team) return <span>-</span>
          const isEast = team.conference === 'East'
          return (
            <span
              className={isEast ? 'badge-east' : 'badge-west'}
              title={`${team.city} ${team.name}`}
            >
              {team.abbreviation}
            </span>
          )
        },
      }),
      columnHelper.accessor('position', {
        header: 'Pos',
        cell: (info) => <span className="text-xs text-[var(--ink-muted)]">{info.getValue()}</span>,
      }),
      columnHelper.accessor('gamesPlayed', {
        header: 'GP',
        cell: (info) => <span className="numeric">{info.getValue()}</span>,
      }),
      columnHelper.accessor('minutes', {
        header: 'MIN',
        cell: (info) => <span className="numeric">{formatNumber(info.getValue())}</span>,
      }),
      columnHelper.accessor('points', {
        header: 'PTS',
        cell: (info) => (
          <span className="numeric font-semibold">{formatNumber(info.getValue())}</span>
        ),
      }),
      columnHelper.accessor('rebounds', {
        header: 'REB',
        cell: (info) => <span className="numeric">{formatNumber(info.getValue())}</span>,
      }),
      columnHelper.accessor('assists', {
        header: 'AST',
        cell: (info) => <span className="numeric">{formatNumber(info.getValue())}</span>,
      }),
      columnHelper.accessor('steals', {
        header: 'STL',
        cell: (info) => <span className="numeric">{formatNumber(info.getValue())}</span>,
      }),
      columnHelper.accessor('blocks', {
        header: 'BLK',
        cell: (info) => <span className="numeric">{formatNumber(info.getValue())}</span>,
      }),
      columnHelper.accessor('turnovers', {
        header: 'TO',
        cell: (info) => <span className="numeric">{formatNumber(info.getValue())}</span>,
      }),
      columnHelper.accessor('fieldGoalPct', {
        header: 'FG%',
        cell: (info) => <span className="numeric">{formatPct(info.getValue())}</span>,
      }),
      columnHelper.accessor('threePointPct', {
        header: '3P%',
        cell: (info) => <span className="numeric">{formatPct(info.getValue())}</span>,
      }),
      columnHelper.accessor('freeThrowPct', {
        header: 'FT%',
        cell: (info) => <span className="numeric">{formatPct(info.getValue())}</span>,
      }),
    ],
    [],
  )

  const table = useReactTable({
    data: stats,
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={header.column.getIsSorted() ? 'text-[var(--hoops-orange-deep)]' : ''}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
