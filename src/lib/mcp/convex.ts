/**
 * Convex client for MCP server
 */

import { ConvexClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api.js'

// Create Convex client using environment variable
const client = new ConvexClient(process.env.VITE_CONVEX_URL || '')

export async function getTopPlayerStats(year: number, limit: number) {
  return client.query(api.playerStats.getTopPlayerStatsWithTeams, { year, limit })
}
