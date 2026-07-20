/**
 * Central risk-threshold configuration.
 *
 * Kept isolated from components and services so that a future Spring Boot
 * backend can own and serve these thresholds (e.g. GET /api/dashboard/risk-config)
 * without any dashboard UI changes. Every risk calculation in the dashboard
 * (Overall Project Risk, Defect Density, Defect Severity Index, Defect-to-Remark
 * Ratio, Portfolio project risk) reads from this single source of truth.
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export const RISK_LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export const RISK_LABELS: Record<RiskLevel, string> = {
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Risk',
}

/** Hex colors used consistently across gauges, badges, charts and heat maps. */
export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#3E8E64',
  MEDIUM: '#C99A2E',
  HIGH: '#D97A3F',
  CRITICAL: '#7A1E2E',
}

export const RISK_SOFT_COLORS: Record<RiskLevel, string> = {
  LOW: '#E7F4ED',
  MEDIUM: '#FBF1DC',
  HIGH: '#FCEADE',
  CRITICAL: '#F5E1E4',
}

export interface MetricZoneThresholds {
  /** Upper bound (inclusive) for each level. CRITICAL has no upper bound. */
  low: number
  medium: number
  high: number
}

export interface RiskThresholdConfig {
  /** Defects per KLOC. */
  defectDensity: MetricZoneThresholds
  /** Weighted severity index, expressed on a 0-100 scale. */
  severityIndex: MetricZoneThresholds
  /** Confirmed defects / total reported remarks, expressed as a percentage. */
  defectToRemarkRatio: MetricZoneThresholds
}

/**
 * Default thresholds. In production this would be fetched from the backend
 * (e.g. GET /api/dashboard/risk-config) and could vary per project or org.
 */
export const RISK_THRESHOLDS: RiskThresholdConfig = {
  defectDensity: { low: 5, medium: 15, high: 30 },
  severityIndex: { low: 25, medium: 50, high: 75 },
  defectToRemarkRatio: { low: 40, medium: 60, high: 80 },
}

export function getRiskLevel(value: number, zones: MetricZoneThresholds): RiskLevel {
  if (value <= zones.low) return 'LOW'
  if (value <= zones.medium) return 'MEDIUM'
  if (value <= zones.high) return 'HIGH'
  return 'CRITICAL'
}

const RISK_RANK: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }

/** Overall risk is the worst (highest) of the contributing metric risk levels. */
export function getOverallRisk(levels: RiskLevel[]): RiskLevel {
  if (levels.length === 0) return 'LOW'
  return levels.reduce((worst, level) => (RISK_RANK[level] > RISK_RANK[worst] ? level : worst), 'LOW' as RiskLevel)
}

export function riskRank(level: RiskLevel): number {
  return RISK_RANK[level]
}
