import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Omit the scheduled job in deployments where automatic sync is disabled.
if (process.env.DISABLE_NBA_STATS_CRON !== 'true') {
  crons.cron(
    'sync NBA player stats',
    // Approximately midnight, 02:00, 06:00, and 10:00 in Toronto.
    '0 4,6,10,14 * * *',
    internal.playerStats.syncPlayerStatsInternalAction,
    { year: 2026 },
  )
}

export default crons
