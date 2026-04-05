# Basketball Stats

A modern basketball statistics tracking application built with TanStack Router, Vite Plus, and Convex.

## Features

- Player statistics tracking
- Team analytics
- Game-by-game data recording
- Real-time updates via Convex
- Dark/light theme support

## Getting Started

### Prerequisites

- Node.js (managed via Vite Plus)
- pnpm

### Installation

Install dependencies using Vite Plus:

```bash
vp install
```

### Development

Start the development server:

```bash
vp dev
```

The app will be available at `http://localhost:3000`.

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
vp test
```

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
vp dlx convex dev
```

## Deployment

This project is configured for Cloudflare deployment:

```bash
vp build && wrangler deploy
```

## License

MIT
