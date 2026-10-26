import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import type { PlayerStat } from '../lib/basketball'
import { selectionKey } from '../lib/comparison'
import TeamLogo from './TeamLogo'
import {
  useTable,
  tableFeatures,
  rowSortingFeature,
  createSortedRowModel,
  sortFns,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'

interface PlayerStatsTableProps {
  stats: PlayerStat[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  page?: number
  pageSize?: number
}

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns,
})

const columnHelper = createColumnHelper<typeof features, PlayerStat>()

const formatNumber = (value: number, decimals = 1) => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(decimals)
}

const formatPct = (value: number) => `${(value * 100).toFixed(1)}%`

export default function PlayerStatsTable({
  stats,
  sorting,
  onSortingChange,
  page = 1,
  pageSize = stats.length || 25,
}: PlayerStatsTableProps) {
  const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater
    onSortingChange(newSorting)
  }

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('fullName', {
          header: 'Player',
          cell: (info) => (
            <Link
              to="/players/$playerId"
              params={{ playerId: info.row.original.playerId }}
              className="font-semibold text-[var(--hoops-orange-deep)] underline-offset-4 hover:underline"
            >
              {info.getValue()}
            </Link>
          ),
        }),
        columnHelper.display({
          id: 'team',
          header: 'Team',
          cell: (info) => <TeamLogo team={info.row.original.team} />,
        }),
        columnHelper.accessor('position', {
          header: 'Pos',
          cell: (info) => (
            <span className="text-xs text-[var(--ink-muted)]">{info.getValue()}</span>
          ),
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
        columnHelper.display({
          id: 'compare',
          header: 'Compare',
          cell: (info) => (
            <Link
              to="/compare"
              search={{ players: selectionKey(info.row.original) }}
              aria-label={`Compare ${info.row.original.fullName}`}
              className="text-xs font-semibold text-[var(--hoops-orange-deep)] underline-offset-4 hover:underline"
            >
              Compare
            </Link>
          ),
        }),
      ]),
    [],
  )

  const table = useTable({
    features,
    data: stats,
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    enableSortingRemoval: false,
  })

  return (
    <div className="table-container">
      <table className="data-table">
        <caption className="sr-only">
          Per-game player statistics; games played is a season total.
        </caption>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  aria-sort={
                    header.column.getIsSorted() === 'asc'
                      ? 'ascending'
                      : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : undefined
                  }
                  className={header.column.getIsSorted() ? 'text-[var(--hoops-orange-deep)]' : ''}
                >
                  {header.column.getCanSort() ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex w-full items-center gap-1 text-left"
                    >
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
                    </button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table
            .getRowModel()
            .rows.slice((page - 1) * pageSize, page * pageSize)
            .map((row) => (
              <tr key={row.id}>
                {row.getAllCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
