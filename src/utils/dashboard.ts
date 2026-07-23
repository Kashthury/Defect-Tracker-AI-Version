import { RiskLevel } from '@/config/riskThresholds'
import { BadgeTone } from '@/types/common'

export const getRiskTone = (risk: RiskLevel): BadgeTone => {
  if (risk === 'LOW') return 'success'
  if (risk === 'MEDIUM') return 'medium'
  if (risk === 'HIGH') return 'high'
  if (risk === 'CRITICAL') return 'critical'
  return 'neutral'
}

export const formatMetricValue = (value: number | null, suffix = '') =>
  value === null ? 'Not configured' : `${value}${suffix}`

/** A missing KLOC value is an expected configuration state, not a request failure. */
export const isKlocNotConfiguredMessage = (message: string) =>
  /\bKLOC\s+has\s+not\s+been\s+configured\b/i.test(message) ||
  /\b(?:status\s+)?404\b/i.test(message) ||
  /\bnot\s+found\b/i.test(message) ||
  /\bno\s+static\s+resource\b/i.test(message)
