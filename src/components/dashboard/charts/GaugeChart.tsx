import React from 'react'
import { RISK_COLORS, RiskLevel } from '@/config/riskThresholds'

interface GaugeZone {
  risk: RiskLevel
  upTo: number | null
}

interface GaugeChartProps {
  value: number
  max: number
  zones: GaugeZone[]
  risk: RiskLevel
  unit?: string
  size?: number
  hideValue?: boolean
}

const CX = 100
const CY = 100
const R = 78
const STROKE = 20

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 180) * Math.PI) / 180
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
}

function arcPath(startAngle: number, endAngle: number) {
  const start = polarToCartesian(CX, CY, R, endAngle)
  const end = polarToCartesian(CX, CY, R, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ value, max, zones, risk, unit = '', size = 200, hideValue = false }) => {
  const clampedMax = Math.max(max, 1)
  const boundaries = zones.map((z) => (z.upTo === null ? clampedMax : Math.min(z.upTo, clampedMax)))
  let previous = 0
  const segments = zones.map((zone, i) => {
    const from = previous
    const to = boundaries[i]
    previous = to
    return { risk: zone.risk, startAngle: (from / clampedMax) * 180, endAngle: (to / clampedMax) * 180 }
  })

  const needleAngle = (Math.min(value, clampedMax) / clampedMax) * 180
  const needleTip = polarToCartesian(CX, CY, R - STROKE / 2 - 6, needleAngle)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" width={size} height={size * 0.6} role="img" aria-label={`Gauge showing ${value}${unit}, ${risk} risk`}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(seg.startAngle, seg.endAngle)}
            fill="none"
            stroke={RISK_COLORS[seg.risk]}
            strokeWidth={STROKE}
            strokeLinecap={i === 0 || i === segments.length - 1 ? 'round' : 'butt'}
            opacity={0.92}
          />
        ))}
        <line x1={CX} y1={CY} x2={needleTip.x} y2={needleTip.y} stroke="#1A2338" strokeWidth={3} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={6} fill="#1A2338" />
      </svg>
      <div className="-mt-4 flex flex-col items-center">
        {!hideValue && (
          <span className="text-2xl font-bold text-ink-900">
            {value}
            <span className="text-sm font-medium text-ink-400">{unit}</span>
          </span>
        )}
        <span className="text-xs font-semibold" style={{ color: RISK_COLORS[risk] }}>
          {risk.charAt(0) + risk.slice(1).toLowerCase()} Risk
        </span>
      </div>
    </div>
  )
}
