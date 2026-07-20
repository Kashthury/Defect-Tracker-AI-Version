import React from 'react'
import { RISK_COLORS, RiskLevel } from '@/config/riskThresholds'

interface Zone {
  risk: RiskLevel
  upTo: number | null
}

interface LinearZoneMeterProps {
  value: number
  max: number
  zones: Zone[]
  risk: RiskLevel
  unit?: string
}

/**
 * Horizontal segmented meter with a pointer marker. Visually distinct from
 * the circular gauges — used for Defect Severity Index.
 */
export const LinearZoneMeter: React.FC<LinearZoneMeterProps> = ({ value, max, zones, risk, unit = '' }) => {
  const clampedMax = Math.max(max, 1)
  const boundaries = zones.map((z) => (z.upTo === null ? clampedMax : Math.min(z.upTo, clampedMax)))
  let previous = 0
  const segments = zones.map((zone, i) => {
    const width = ((boundaries[i] - previous) / clampedMax) * 100
    previous = boundaries[i]
    return { risk: zone.risk, width }
  })
  const pointerPosition = Math.max(2, Math.min(98, (Math.min(value, clampedMax) / clampedMax) * 100))

  return (
    <div className="flex w-full flex-col items-center">
      <span className="text-2xl font-bold text-ink-900">
        {value}
        <span className="text-sm font-medium text-ink-400">{unit}</span>
      </span>
      <span className="mb-3 text-xs font-semibold" style={{ color: RISK_COLORS[risk] }}>
        {risk.charAt(0) + risk.slice(1).toLowerCase()} Risk
      </span>
      <div className="relative h-3 w-full max-w-[220px] overflow-visible rounded-full">
        <div className="flex h-full w-full overflow-hidden rounded-full">
          {segments.map((seg, i) => (
            <div key={i} style={{ width: `${seg.width}%`, backgroundColor: RISK_COLORS[seg.risk] }} className="h-full first:rounded-l-full last:rounded-r-full" />
          ))}
        </div>
        <div
          className="absolute -top-1.5 h-6 w-1 -translate-x-1/2 rounded-full bg-ink-900 shadow-[0_0_0_2px_white]"
          style={{ left: `${pointerPosition}%` }}
        />
      </div>
      <div className="mt-1.5 flex w-full max-w-[220px] justify-between text-[10px] text-ink-400">
        <span>0</span>
        <span>{clampedMax}{unit}</span>
      </div>
    </div>
  )
}
