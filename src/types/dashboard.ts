import { RiskLevel } from '@/config/riskThresholds'
import { Project, ProjectStatus } from './project'

/* ---------------------------------------------------------------------- */
/* Level 1 — Portfolio Risk Dashboard                                     */
/* ---------------------------------------------------------------------- */

export interface PortfolioSummary {
  totalProjects: number
  lowRiskCount: number
  mediumRiskCount: number
  highRiskCount: number
  criticalRiskCount: number
  completedProjects: number
  delayedProjects: number
}

export interface PortfolioRiskSlice {
  risk: RiskLevel
  count: number
  percentage: number
}

export interface PortfolioProjectCard {
  projectId: string
  projectName: string
  risk: RiskLevel
  status: ProjectStatus
  currentRelease: string
  openDefectCount: number
  criticalDefectCount: number
  completionPercentage: number
  lastUpdatedAt: string
}

export interface PortfolioDashboardData {
  summary: PortfolioSummary
  riskDistribution: PortfolioRiskSlice[]
  projects: PortfolioProjectCard[]
}

/* ---------------------------------------------------------------------- */
/* Level 2 — Project Quality Dashboard                                    */
/* ---------------------------------------------------------------------- */

export interface GaugeMetric {
  value: number
  risk: RiskLevel
  zones: { risk: RiskLevel; upTo: number | null }[]
}

export interface OverallProjectRisk extends GaugeMetric {
  contributingMetrics: { label: string; risk: RiskLevel }[]
}

export interface DefectDensityMetric extends GaugeMetric {
  totalConfirmedDefects: number
  kloc: number
}

export interface SeverityWeightConfigEntry {
  severityId: string
  name: string
  weight: number
  color: string
  order: number
}

export interface SeverityIndexMetric extends GaugeMetric {
  totalWeighted: number
  totalConfirmedDefects: number
  breakdown: { severity: string; count: number; weight: number; contribution: number }[]
}

export interface DefectToRemarkMetric extends GaugeMetric {
  totalRemarks: number
  confirmedDefects: number
  nonConfirmedRemarks: number
}

export interface SeverityStatusCount {
  status: string
  count: number
  color?: string
}

export interface SeverityBreakdownGroup {
  severity: string
  color: string
  weight: number
  totalDefects: number
  statusCounts: SeverityStatusCount[]
}

export interface SeverityBreakdownData {
  totalReportedRemarks: number
  totalConfirmedDefects: number
  groups: SeverityBreakdownGroup[]
}

export interface DefectTypeSlice {
  type: string
  count: number
  percentage: number
  color: string
}

export interface ModuleDefectCount {
  moduleName: string
  count: number
}

export interface StackedSeverityStatus {
  severity: string
  color: string
  statuses: SeverityStatusCount[]
}

export interface DefectTrendPoint {
  label: string
  created: number
  closed: number
}

export interface ReopenedBucket {
  bucket: string
  count: number
}

export interface ProjectChartAnalytics {
  defectTypeDistribution: DefectTypeSlice[]
  defectsByModule: ModuleDefectCount[]
  severityStatusStack: StackedSeverityStatus[]
  defectTrend: DefectTrendPoint[]
  reopenedBuckets: ReopenedBucket[]
}

export interface TimeToFindPoint {
  days: number
  defectCount: number
}

export interface TimeToFixPoint {
  days: number
  defectCount: number
}

export interface ReleaseAnalyticsSummary {
  averageTimeToFind: number
  medianTimeToFind: number
  averageTimeToFix: number
  medianTimeToFix: number
  totalDefects: number
  openCount: number
  closedCount: number
  criticalCount: number
  fixedCount: number
  pendingCount: number
  reopenedCount: number
}

export interface ReleaseAnalyticsData {
  releaseId: string
  timeToFind: TimeToFindPoint[]
  timeToFix: TimeToFixPoint[]
  summary: ReleaseAnalyticsSummary
}

export interface ModuleRiskCell {
  moduleName: string
  severity: string
  count: number
  risk: RiskLevel
}

export interface ModuleRiskHeatMap {
  modules: string[]
  severities: string[]
  cells: ModuleRiskCell[]
}

export type ActivityType =
  | 'DEFECT_CREATED' | 'DEFECT_ASSIGNED' | 'DEFECT_STATUS_CHANGED' | 'DEFECT_FIXED'
  | 'DEFECT_REOPENED' | 'RELEASE_UPDATED' | 'KLOC_UPDATED' | 'PROJECT_RISK_RECALCULATED'

export interface ActivityFeedItem {
  id: string
  type: ActivityType
  message: string
  actorName: string
  timestamp: string
}

export interface ProjectQualityDashboardData {
  project: Project
  overallRisk: OverallProjectRisk
  defectDensity: DefectDensityMetric
  severityIndex: SeverityIndexMetric
  defectToRemarkRatio: DefectToRemarkMetric
}

/* ---------------------------------------------------------------------- */
/* Git / KLOC calculation                                                 */
/* ---------------------------------------------------------------------- */

export interface CalculateKlocFromRepoPayload {
  projectId: string
  repositoryUrl: string
  branch: string
  username?: string
  personalAccessToken?: string
}

export interface CalculateKlocResult {
  projectId: string
  kloc: number
  linesOfCode: number
}

export interface UpdateKlocPayload {
  projectId: string
  kloc: number
}
