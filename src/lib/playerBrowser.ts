import { CURRENT_YEAR, SEASON_YEARS, type PlayerStat } from './basketball'

export const SORT_COLUMNS = [
  'fullName',
  'position',
  'gamesPlayed',
  'minutes',
  'points',
  'rebounds',
  'assists',
  'steals',
  'blocks',
  'turnovers',
  'fieldGoalPct',
  'threePointPct',
  'freeThrowPct',
] as const

export interface PlayerBrowserSearch {
  year: number
  q: string
  team: string
  position: '' | 'G' | 'F' | 'C'
  minGames: number
  minMinutes: number
  qualified: boolean
  sort: (typeof SORT_COLUMNS)[number]
  desc: boolean
  page: number
  pageSize: number
}

function numberInRange(value: unknown, fallback: number, min: number, max: number) {
  if (typeof value !== 'number' && typeof value !== 'string') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback
}

export function parseBrowserSearch(search: Record<string, unknown>): PlayerBrowserSearch {
  const year = Number(search.year)
  const pageSize = Number(search.pageSize)
  return {
    year: SEASON_YEARS.includes(year) ? year : CURRENT_YEAR,
    q: typeof search.q === 'string' ? search.q.slice(0, 100) : '',
    team: typeof search.team === 'string' ? search.team.toUpperCase().slice(0, 4) : '',
    position:
      search.position === 'G' || search.position === 'F' || search.position === 'C'
        ? search.position
        : '',
    minGames: Math.floor(numberInRange(search.minGames, 0, 0, 100)),
    minMinutes: numberInRange(search.minMinutes, 0, 0, 60),
    qualified: search.qualified === true || search.qualified === 'true',
    sort: SORT_COLUMNS.includes(search.sort as (typeof SORT_COLUMNS)[number])
      ? (search.sort as (typeof SORT_COLUMNS)[number])
      : 'points',
    desc: search.desc !== false && search.desc !== 'false',
    page: Math.floor(numberInRange(search.page, 1, 1, 2000)),
    pageSize: [25, 50, 100].includes(pageSize) ? pageSize : 25,
  }
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function qualificationMinimum(players: PlayerStat[]) {
  return Math.ceil(players.reduce((max, player) => Math.max(max, player.gamesPlayed), 0) * 0.7)
}

export function filterPlayers(players: PlayerStat[], search: PlayerBrowserSearch) {
  const words = normalizeSearch(search.q).split(/\s+/).filter(Boolean)
  const minGames = Math.max(search.minGames, search.qualified ? qualificationMinimum(players) : 0)
  return players.filter((player) => {
    const name = normalizeSearch(player.fullName)
    return (
      words.every((word) => name.includes(word)) &&
      (!search.team || player.team?.abbreviation === search.team) &&
      (!search.position || player.position.toUpperCase().includes(search.position)) &&
      player.gamesPlayed >= minGames &&
      player.minutes >= search.minMinutes
    )
  })
}

export function pagination(total: number, page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, pageCount)
  return {
    page: currentPage,
    pageCount,
    first: total === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    last: Math.min(currentPage * pageSize, total),
  }
}
