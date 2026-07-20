import React from 'react'
import { RISK_COLORS, RISK_LABELS, RISK_SOFT_COLORS, RiskLevel } from '@/config/riskThresholds'
import { cn } from '@/utils/cn'

interface RiskBadgeProps {
  risk: RiskLevel
  size?: 'sm' | 'md'
  dot?: boolean
  className?: string
  label?: string
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, size = 'md', dot = true, className, label }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{ backgroundColor: RISK_SOFT_COLORS[risk], color: RISK_COLORS[risk], boxShadow: `inset 0 0 0 1px ${RISK_COLORS[risk]}33` }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RISK_COLORS[risk] }} />}
      {label ?? RISK_LABELS[risk]}
    </span>
  )
}
