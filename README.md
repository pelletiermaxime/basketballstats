# Basketball Stats

NBA player statistics by season, built with TanStack Start, React, and Convex.
Search and filter every player in a season, compare two to four player seasons,
and explore individual season histories with charts. The leaderboard is also
available through the MCP endpoint at `/api/mcp`.

[Live app](https://basketballstats-neon.vercel.app)

## Development

Requires [Vite+](https://viteplus.dev) (`vp`) and Node.js 24, pinned in `.nvmrc`.

```bash
vp install
vp exec convex dev --once
vp run dev
```

On first setup, select the Convex project when prompted. The Convex CLI configures
`CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL` in `.env.local`.

The app runs at `http://localhost:4412`. `vp run dev` starts both Vite and Convex;
use `vp run dev:vite` for the frontend alone. Set `PORT` to use another port.

## Commands

| Command       | Purpose                              |
| ------------- | ------------------------------------ |
| `vp check`    | Formatting, linting, and type checks |
| `vp test run` | Component and isolated Convex tests  |
| `vp build`    | Production build                     |
| `vp preview`  | Preview the production build         |

The MCP integration tests need a running frontend and a configured Convex backend:

```bash
vp run dev:vite
# In another terminal:
vp run test:integration
```

Set `MCP_URL` to test an endpoint other than `http://localhost:4412/api/mcp`.

## Season sync

Stats come from ESPN's regular-season feed, including players below qualification
thresholds. Season years use the starting year: `2026` means 2026–27.
The daily production job syncs that season at 08:00 UTC. Earlier seasons remain
available in the selector.

The sync validates every page before writing, uses full-season totals for traded
players, identifies players by ESPN ID, and skips unchanged records. All players
are available through the paginated leaderboard. The MCP tool returns up to 100.

Preview a production import without writing player data:

```bash
vp exec convex run playerStats:syncPlayerStatsInternalAction '{"year":2026,"dryRun":true}' --prod
```

Omit `dryRun` to apply it. The result reports fetched, inserted, updated, and
unchanged player counts.

To disable scheduled syncs on your configured development deployment:

```bash
vp exec convex env set DISABLE_NBA_STATS_CRON true
vp exec convex dev --once
```

Cron definitions are evaluated on deployment, so redeploy after changing this
flag. Leave it unset in production. Manual syncs remain available.

## Deployment

Vercel automatically deploys the frontend when `main` is pushed. Configure
`VITE_CONVEX_URL` in Vercel to point to the production Convex deployment.
Deploy backend changes separately:

```bash
vp exec convex deploy
```

For a manual frontend deployment, use `vp run deploy`.

## License

[MIT](LICENSE)
