import { useState } from 'react'
import type { Team } from '../lib/basketball'

const sizes = {
  sm: { pixels: 36, className: 'size-9' },
  md: { pixels: 48, className: 'size-12' },
  lg: { pixels: 144, className: 'size-20 sm:size-36' },
}

interface TeamLogoProps {
  team?: Team
  size?: keyof typeof sizes
}

export default function TeamLogo({ team, size = 'sm' }: TeamLogoProps) {
  const [failedSrc, setFailedSrc] = useState<string>()
  if (!team) return <span aria-label="Team unavailable">-</span>

  const name = `${team.city} ${team.name}`
  const src = `/team-logos/${encodeURIComponent(team.abbreviation.toLowerCase())}.svg`
  if (failedSrc === src) return <span title={name}>{name}</span>

  const dimensions = sizes[size]
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center align-middle ${dimensions.className}`}
    >
      <img
        src={src}
        alt={name}
        width={dimensions.pixels}
        height={dimensions.pixels}
        className="h-full w-full object-contain"
        loading={size === 'lg' ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailedSrc(src)}
      />
    </span>
  )
}
