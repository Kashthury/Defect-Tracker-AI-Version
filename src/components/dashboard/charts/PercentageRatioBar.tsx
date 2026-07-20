import React from 'react'
import { RISK_COLORS, RiskLevel } from '@/config/riskThresholds'

interface PercentageRatioBarProps {
  value: number
  risk: RiskLevel
  confirmed: number
  nonConfirmed: number
  total: number
}

/**
 * A stacked percentage fill bar (confirmed vs non-confirmed remarks) rather
 * than a circular gauge — used for the Defect-to-Remark Ratio, so all four
 * risk metrics read visually differently at a glance.
 */
export const PercentageRatioBar: React.FC<PercentageRatioBarProps> = ({ value, risk, confirmed, nonConfirmed, total }) => {
  const confirmedPct = total > 0 ? (confirmed / total) * 100 : 0
  const nonConfirmedPct = total > 0 ? (nonConfirmed / total) * 100 : 0

  return (
    <div className="flex w-full flex-col items-center">
      <span className="text-2xl font-bold text-ink-900">
        {value}
        <span className="text-sm font-medium text-ink-400">%</span>
      </span>
      <span className="mb-3 text-xs font-semibold" style={{ color: RISK_COLORS[risk] }}>
        {risk.charAt(0) + risk.slice(1).toLowerCase()} Risk
      </span>
      <div className="h-4 w-full max-w-[220px] overflow-hidden rounded-full bg-ink-100">
        <div className="flex h-full">
          <div style={{ width: `${confirmedPct}%`, backgroundColor: RISK_COLORS[risk] }} className="h-full transition-all" />
          <div style={{ width: `${nonConfirmedPct}%` }} className="h-full bg-ink-300" />
        </div>
      </div>
      <div className="mt-2 flex w-full max-w-[220px] justify-between text-[11px] text-ink-500">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: RISK_COLORS[risk] }} />Confirmed {confirmed}</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-ink-300" />Other {nonConfirmed}</span>
      </div>
    </div>
  )
}
