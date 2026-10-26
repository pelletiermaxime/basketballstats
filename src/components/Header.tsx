import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center justify-between gap-3 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--ink)] no-underline shadow-[0_8px_24px_rgba(249,115,22,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#f97316,#fb923c)]" />
            Basketball Stats
          </Link>
        </h2>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <Link
            to="/"
            className="nav-link text-sm"
            activeOptions={{ exact: true }}
            activeProps={{ className: 'is-active' }}
          >
            Players
          </Link>
          <Link to="/compare" className="nav-link text-sm" activeProps={{ className: 'is-active' }}>
            Compare
          </Link>
          <Link
            to="/mcp"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--ink)] no-underline hover:bg-[var(--paper-2)] transition-colors"
          >
            <span className="text-sm">🔌</span>
            <span className="hidden sm:inline">MCP</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
