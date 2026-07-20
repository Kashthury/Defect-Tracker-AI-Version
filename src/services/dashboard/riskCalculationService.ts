import { getOverallRisk, getRiskLevel, RISK_THRESHOLDS } from '@/config/riskThresholds'
import {
  DefectDensityMetric,
  DefectToRemarkMetric,
  GaugeMetric,
  OverallProjectRisk,
  SeverityIndexMetric,
} from '@/types/dashboard'

function buildZones(zones: { low: number; medium: number; high: number }): GaugeMetric['zones'] {
  return [
    { risk: 'LOW', upTo: zones.low },
    { risk: 'MEDIUM', upTo: zones.medium },
    { risk: 'HIGH', upTo: zones.high },
    { risk: 'CRITICAL', upTo: null },
  ]
}

/**
 * Pure calculation helpers for the four Level 2 risk metrics. Every method
 * accepts already-aggregated numbers so it stays independent of the mock
 * data layer — swapping the data source for a live API requires no changes
 * here, only in the service that gathers the raw counts.
 */
export const riskCalculationService = {
  calculateDefectDensity(totalConfirmedDefects: number, kloc: number): DefectDensityMetric {
    const value = kloc > 0 ? Number((totalConfirmedDefects / kloc).toFixed(2)) : 0
    return {
      value,
      risk: getRiskLevel(value, RISK_THRESHOLDS.defectDensity),
      zones: buildZones(RISK_THRESHOLDS.defectDensity),
      totalConfirmedDefects,
      kloc,
    }
  },

  calculateSeverityIndex(
    breakdown: { severity: string; count: number; weight: number }[],
  ): SeverityIndexMetric {
    const totalConfirmedDefects = breakdown.reduce((sum, row) => sum + row.count, 0)
    const totalWeighted = breakdown.reduce((sum, row) => sum + row.count * row.weight, 0)
    const value = totalConfirmedDefects > 0 ? Number((totalWeighted / totalConfirmedDefects).toFixed(2)) : 0
    return {
      value,
      risk: getRiskLevel(value, RISK_THRESHOLDS.severityIndex),
      zones: buildZones(RISK_THRESHOLDS.severityIndex),
      totalWeighted,
      totalConfirmedDefects,
      breakdown: breakdown.map((row) => ({ ...row, contribution: row.count * row.weight })),
    }
  },

  calculateDefectToRemarkRatio(confirmedDefects: number, totalRemarks: number): DefectToRemarkMetric {
    const value = totalRemarks > 0 ? Number(((confirmedDefects / totalRemarks) * 100).toFixed(1)) : 0
    return {
      value,
      risk: getRiskLevel(value, RISK_THRESHOLDS.defectToRemarkRatio),
      zones: buildZones(RISK_THRESHOLDS.defectToRemarkRatio),
      totalRemarks,
      confirmedDefects,
      nonConfirmedRemarks: Math.max(0, totalRemarks - confirmedDefects),
    }
  },

  calculateOverallRisk(metrics: { label: string; risk: DefectDensityMetric['risk'] }[]): OverallProjectRisk {
    const overall = getOverallRisk(metrics.map((m) => m.risk))
    return {
      value: metrics.length,
      risk: overall,
      zones: [
        { risk: 'LOW', upTo: null },
        { risk: 'MEDIUM', upTo: null },
        { risk: 'HIGH', upTo: null },
        { risk: 'CRITICAL', upTo: null },
      ],
      contributingMetrics: metrics,
    }
  },
}
