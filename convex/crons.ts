import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Omit the scheduled job in deployments where automatic sync is disabled.
if (process.env.DISABLE_NBA_STATS_CRON !== 'true') {
  crons.cron(
    'sync NBA player stats',
    '0 8 * * *',
    internal.playerStats.syncPlayerStatsInternalAction,
    { year: 2026 },
  )
}

export default crons
