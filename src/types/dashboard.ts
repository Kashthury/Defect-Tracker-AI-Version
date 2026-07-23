import { RiskLevel } from '@/config/riskThresholds'
import { ProjectStatus } from './project'

/* ---------------------------------------------------------------------- */
/* Level 1 — Portfolio Risk Dashboard                                     */
/* ---------------------------------------------------------------------- */

export interface PortfolioSummary {
  totalProjects: number
  activeProjects: number
  onHoldProjects: number
  completedProjects: number
  delayedProjects: number
  lowRiskCount: number
  mediumRiskCount: number
  highRiskCount: number
  criticalRiskCount: number
}

export interface RiskDistributionItem {
  risk: Exclude<RiskLevel, 'NOT_AVAILABLE'>
  count: number
}

export interface ActiveReleaseSummary {
  releaseId: string
  releaseName: string
  version: string
  releaseDate: string
}

export interface TestExecutionProgress {
  totalAllocatedTestCases: number
  executedTestCases: number
  passedTestCases: number
  failedTestCases: number
  percentage: number | null
}

export interface PortfolioProject {
  projectId: string
  projectName: string
  status: ProjectStatus
  risk: RiskLevel
  openDefectCount: number
  criticalDefectCount: number
  currentRelease: ActiveReleaseSummary | null
  testExecutionProgress: TestExecutionProgress | null
  lastUpdatedAt: string
  delayed?: boolean
}

export interface PortfolioDashboardResponse {
  summary: PortfolioSummary
  riskDistribution: RiskDistributionItem[]
  projects: PortfolioProject[]
}

export type PortfolioProjectCard = PortfolioProject
export type PortfolioDashboardData = PortfolioDashboardResponse

export interface MetricAvailability {
  calculationAvailable: boolean
  reason: string | null
}

export interface DefectDensityMetric extends MetricAvailability {
  value: number | null
  kloc: number | null
  totalConfirmedDefects: number
  risk: RiskLevel
}

export interface SeverityIndexMetric extends MetricAvailability {
  value: number | null
  maximumPossibleValue: number | null
  normalizedPercentage: number | null
  totalConfirmedDefects: number
  risk: RiskLevel
}

export interface ConfirmedDefectRateMetric extends MetricAvailability {
  value: number | null
  confirmedDefects: number
  nonConfirmedDefects: number
  totalReportedDefects: number
  risk: RiskLevel
}

export interface ProjectDashboardCounts {
  totalReportedDefects: number
  confirmedDefects: number
  openDefects: number
  closedDefects: number
  criticalOpenDefects: number
  reopenedDefects: number
}

export interface ProjectDashboardResponse {
  project: {
    projectId: string
    projectName: string
    status: ProjectStatus
    startDate: string
    endDate: string
    projectManagerId: string | null
    projectManagerName: string | null
  }
  overallRisk: RiskLevel
  defectDensity: DefectDensityMetric
  severityIndex: SeverityIndexMetric
  confirmedDefectRate: ConfirmedDefectRateMetric
  currentRelease: ActiveReleaseSummary | null
  testExecutionProgress: TestExecutionProgress | null
  counts: ProjectDashboardCounts
  lastUpdatedAt: string
}

export interface ProjectKloc {
  kloc: number | null
  source?: string | null
  recordedDate?: string | null
  recordedBy?: string | null
}

/* ---------------------------------------------------------------------- */
/* Level 2 — Project Quality Dashboard                                    */
/* ---------------------------------------------------------------------- */

export interface SeverityWeightConfigEntry {
  severityId: string
  name: string
  weight: number
  color: string
  order: number
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
  totalReportedDefects: number
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
  weightedScore?: number
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
