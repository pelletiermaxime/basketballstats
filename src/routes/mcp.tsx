import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mcp')({
  component: McpDocs,
  head: () => ({
    meta: [{ title: 'MCP Server | Basketball Stats' }],
  }),
})

function McpDocs() {
  return (
    <main className="page-wrap px-4 pb-8 pt-8">
      <section className="island-shell rise-in p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🔌</span>
          <div>
            <p className="island-kicker mb-1">MCP Integration</p>
            <h1 className="text-2xl font-bold text-[var(--ink)]">MCP Server</h1>
          </div>
        </div>
        <p className="text-[var(--ink-soft)]">
          Connect AI assistants to NBA player statistics via the Model Context Protocol (MCP).
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <section className="island-shell rise-in p-6" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <span>⚙️</span> Configuration
          </h2>

          <p className="text-sm text-[var(--ink-soft)] mb-2">
            Add to your MCP client configuration:
          </p>
          <pre className="bg-[var(--paper-2)] p-3 rounded text-sm overflow-x-auto">
            <code>{`{
  "mcpServers": {
    "basketball-stats": {
      "url": "https://basketballstats-neon.vercel.app/api/mcp"
    }
  }
}`}</code>
          </pre>
        </section>

        {/* Available Tools */}
        <section className="island-shell rise-in p-6" style={{ animationDelay: '200ms' }}>
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-4 flex items-center gap-2">
            <span>🛠️</span> Available Tools
          </h2>

          <div className="space-y-4">
            <div className="border border-[var(--edge)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-[var(--ink)]">list_top_scorers</h3>
                <span className="text-xs bg-[var(--paper-3)] px-2 py-1 rounded">
                  Default: 50 players
                </span>
              </div>
              <p className="text-sm text-[var(--ink-soft)] mb-3">
                Get top NBA scorers for a season, ranked by points per game.
              </p>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-[var(--ink)]">Parameters:</span>
                </div>
                <ul className="text-sm text-[var(--ink-soft)] space-y-1 ml-4">
                  <li>
                    <code className="bg-[var(--paper-3)] px-1 rounded">year</code>
                    <span className="text-[var(--ink-muted)]"> (number, required)</span>
                    <br />
                    <span className="text-xs">The NBA season year (e.g., 2024)</span>
                  </li>
                  <li>
                    <code className="bg-[var(--paper-3)] px-1 rounded">limit</code>
                    <span className="text-[var(--ink-muted)]"> (number, optional)</span>
                    <br />
                    <span className="text-xs">
                      Number of players to return (1-100, default: 50)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--edge)]">
                <div className="text-sm">
                  <span className="font-medium text-[var(--ink)]">Returns:</span>
                </div>
                <ul className="text-sm text-[var(--ink-soft)] space-y-1 ml-4 mt-1">
                  <li>• Player name & position</li>
                  <li>• Team (city, name, abbreviation)</li>
                  <li>• Games played</li>
                  <li>• Points per game (PPG)</li>
                  <li>• Rebounds per game (RPG)</li>
                  <li>• Assists per game (APG)</li>
                  <li>• Steals per game (SPG)</li>
                  <li>• Blocks per game (BPG)</li>
                  <li>• Field goal, 3PT, and FT percentages</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
