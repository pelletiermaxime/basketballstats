import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.cron(
  'sync NBA player stats',
  '0 8 * * *',
  internal.playerStats.syncPlayerStatsInternalAction,
  { year: 2025 },
)

export default crons
