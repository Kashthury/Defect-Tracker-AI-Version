import React from 'react'
import { RISK_COLORS, RiskLevel } from '@/config/riskThresholds'

interface RadialProgressGaugeProps {
  value: number
  max: number
  risk: RiskLevel
  unit?: string
  size?: number
  strokeWidth?: number
}

const R = 54

/**
 * Full-circle radial progress ring. Visually distinct from the semicircular
 * speedometer used for Overall Project Risk — used for Defect Density.
 */
export const RadialProgressGauge: React.FC<RadialProgressGaugeProps> = ({
  value,
  max,
  risk,
  unit = '',
  size = 160,
  strokeWidth = 14,
}) => {
  const circumference = 2 * Math.PI * R
  const progress = Math.max(0, Math.min(1, value / Math.max(max, 1)))
  const offset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 130 130" width={size} height={size} className="-rotate-90">
          <circle cx={65} cy={65} r={R} fill="none" stroke="#EEF1F6" strokeWidth={strokeWidth} />
          <circle
            cx={65}
            cy={65}
            r={R}
            fill="none"
            stroke={RISK_COLORS[risk]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink-900">
            {value}
            <span className="text-xs font-medium text-ink-400">{unit}</span>
          </span>
        </div>
      </div>
      <span className="mt-1.5 text-xs font-semibold" style={{ color: RISK_COLORS[risk] }}>
        {risk.charAt(0) + risk.slice(1).toLowerCase()} Risk
      </span>
    </div>
  )
}
