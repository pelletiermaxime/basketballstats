/**
 * MCP Server using official SDK
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getTopPlayerStats } from './convex.js'

// Factory function to create a new MCP server instance
export function createServer() {
  const server = new McpServer({
    name: 'basketball-stats',
    version: '1.0.0',
  })

  server.registerTool(
    'list_top_scorers',
    {
      description: 'Get top scorers for an NBA season, ranked by points per game',
      inputSchema: {
        year: z.number().int().min(2000).max(2100).describe('The NBA season year (e.g., 2024)'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .default(50)
          .describe('Number of top scorers to return (default: 50)'),
      },
    },
    async ({ year, limit }) => {
      try {
        const players = await getTopPlayerStats(year, limit)

        if (!players || players.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No player statistics found for the ${year} season.`,
              },
            ],
          }
        }

        const formattedPlayers = players.map((player, index) => {
          const team = player.team
          const teamInfo = team
            ? `${team.city} ${team.name} (${team.abbreviation})`
            : 'Unknown Team'

          return [
            `${index + 1}. ${player.fullName}`,
            `   Position: ${player.position}`,
            `   Team: ${teamInfo}`,
            `   Games Played: ${player.gamesPlayed}`,
            `   Points: ${player.points.toFixed(1)} PPG`,
            `   Rebounds: ${player.rebounds.toFixed(1)} RPG`,
            `   Assists: ${player.assists.toFixed(1)} APG`,
            `   Steals: ${player.steals.toFixed(1)} SPG`,
            `   Blocks: ${player.blocks.toFixed(1)} BPG`,
            `   FG%: ${(player.fieldGoalPct * 100).toFixed(1)}%`,
            `   3PT%: ${(player.threePointPct * 100).toFixed(1)}%`,
            `   FT%: ${(player.freeThrowPct * 100).toFixed(1)}%`,
          ].join('\n')
        })

        const header = `Top ${players.length} Scorers for the ${year} NBA Season:\n\n`
        const text = header + formattedPlayers.join('\n\n')

        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

        return {
          content: [
            {
              type: 'text',
              text: `Error fetching player statistics: ${errorMessage}`,
            },
          ],
          isError: true,
        }
      }
    },
  )

  return server
}
