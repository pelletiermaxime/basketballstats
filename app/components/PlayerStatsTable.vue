<script setup lang="ts">
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
  team?: {
    _id: string
    name: string
    city: string
    abbreviation: string
    conference: string
  }
}

defineProps<{
  stats: PlayerStat[]
}>()

interface Column {
  key: keyof PlayerStat | 'teamAbbreviation'
  label: string
  format?: (value: number) => string
}

const columns: Column[] = [
  { key: 'fullName', label: 'Player' },
  { key: 'teamAbbreviation', label: 'Team' },
  { key: 'position', label: 'Pos' },
  { key: 'gamesPlayed', label: 'GP' },
  { key: 'minutes', label: 'MIN', format: (v: number) => v.toFixed(1) },
  { key: 'points', label: 'PTS', format: (v: number) => v.toFixed(1) },
  { key: 'rebounds', label: 'REB', format: (v: number) => v.toFixed(1) },
  { key: 'assists', label: 'AST', format: (v: number) => v.toFixed(1) },
  { key: 'steals', label: 'STL', format: (v: number) => v.toFixed(1) },
  { key: 'blocks', label: 'BLK', format: (v: number) => v.toFixed(1) },
  { key: 'fieldGoalPct', label: 'FG%', format: (v: number) => (v * 100).toFixed(1) + '%' },
  { key: 'threePointPct', label: '3P%', format: (v: number) => (v * 100).toFixed(1) + '%' },
  { key: 'freeThrowPct', label: 'FT%', format: (v: number) => (v * 100).toFixed(1) + '%' }
]

function getCellValue(stat: PlayerStat, column: Column): string {
  if (column.key === 'teamAbbreviation') {
    return stat.team?.abbreviation || '-'
  }
  const value = stat[column.key]
  if (typeof value === 'number' && column.format) {
    return column.format(value)
  }
  if (typeof value === 'number') {
    return value.toFixed(1)
  }
  return String(value || '')
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm text-left">
      <thead class="text-xs uppercase bg-gray-100 dark:bg-gray-800">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key as string"
            class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="stat in stats"
          :key="stat._id"
          class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <td
            v-for="column in columns"
            :key="column.key as string"
            class="px-4 py-3"
          >
            <span
              v-if="column.key === 'fullName'"
              class="font-medium"
            >
              {{ stat.fullName }}
            </span>
            <span v-else-if="column.key === 'teamAbbreviation'">
              {{ getCellValue(stat, column) }}
            </span>
            <span
              v-else
              class="tabular-nums"
            >
              {{ getCellValue(stat, column) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
