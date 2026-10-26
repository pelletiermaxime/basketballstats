import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '@convex/_generated/api'
import { SEASON_YEARS, seasonLabel } from '../lib/basketball'

interface PlayerBrowserHeaderProps {
  year: number
  onYearChange: (year: number) => void
}

export default function PlayerBrowserHeader({ year, onYearChange }: PlayerBrowserHeaderProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const syncAction = useAction(api.playerStats.syncPlayerStatsAction)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncError('')
    try {
      await syncAction({ year })
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unable to sync this season.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="island-kicker mb-1">NBA Statistics</p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Player leaderboard</h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Per-game averages for {seasonLabel(year)}. Browse every player in the season.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink-soft)]">
            Season
            <select
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
              className="select"
            >
              {SEASON_YEARS.map((year) => (
                <option key={year} value={year}>
                  {seasonLabel(year)} Season
                </option>
              ))}
            </select>
          </label>
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="btn btn-primary disabled:opacity-50"
            >
              {isSyncing ? 'Syncing…' : 'Sync Data'}
            </button>
          )}
        </div>
      </div>
      {syncError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {syncError}
        </p>
      )}
    </>
  )
}
