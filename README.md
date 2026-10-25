# Basketball Stats

A modern basketball statistics tracking application built with TanStack Router, Vite Plus, and Convex.

**Live Demo:** [https://basketballstats-neon.vercel.app](https://basketballstats-neon.vercel.app)

## Features

- Player statistics tracking
- Team analytics
- Game-by-game data recording
- Real-time updates via Convex
- Dark/light theme support

## Getting Started

### Prerequisites

- Vite+ (`vp`)
- Node.js 24 (managed via Vite+, using `.nvmrc`)

### Installation

Install dependencies using Vite Plus:

```bash
vp install
```

### Development

Start the development server:

```bash
vp run dev
```

This starts both the Vite frontend and the Convex development process. Portless
prints the frontend URL and proxies it to port 4412. To start only the frontend
against an already configured Convex deployment, use `vp run dev:vite`.

### Building

Build for production:

```bash
vp build
```

Preview the production build:

```bash
vp preview
```

### Testing

Run tests:

```bash
vp test run
```

The default suite runs component tests without a backend. The MCP integration
suite reads from the configured Convex deployment and requires the frontend
server to be running:

```bash
# In one terminal (uses the existing Convex deployment from .env.local)
vp dev --port 4412

# In another terminal
vp run test:integration
```

Set `MCP_URL` to test an MCP endpoint other than `http://localhost:4412/api/mcp`.

### Code Quality

Run linting, formatting, and type checks:

```bash
vp check
```

## Technologies

- **Vite Plus** - Unified toolchain for development, building, and testing
- **TanStack Router** - Type-safe routing with file-based routes
- **TanStack Start** - Full-stack React framework
- **Convex** - Real-time backend with reactive database
- **Tailwind CSS** - Utility-first CSS framework

## Configuration

### Environment Variables

Create a `.env.local` file with:

```env
VITE_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_convex_deployment
```

### Convex

To start the Convex development server:

```bash
vp run dev:convex
```

## Deployment

This project is configured for Vercel deployment:

```bash
# Deploy to production
vp run deploy
```

The app will be built automatically on Vercel's infrastructure. Make sure to set up your environment variables (Convex URL, etc.) in the Vercel dashboard.

## License

MIT
