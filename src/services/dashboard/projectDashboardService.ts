import { RiskLevel } from '@/config/riskThresholds'
import { ApiResponse } from '@/types/common'
import {
  ModuleRiskHeatMap,
  ProjectChartAnalytics,
  ProjectDashboardResponse,
  ProjectKloc,
  ReleaseAnalyticsData,
  SeverityBreakdownData,
} from '@/types/dashboard'
import { apiRequest, fail, ok } from '../apiClient'

type Json = Record<string, any>
const num = (...values: unknown[]) => Number(values.find((value) => value !== undefined && value !== null) ?? 0)
const nullableNumber = (value: unknown) => value === undefined || value === null ? null : Number(value)
const str = (...values: unknown[]) => String(values.find((value) => value !== undefined && value !== null) ?? '')
const risk = (value: unknown): RiskLevel => {
  const normalized = str(value).toUpperCase()
  return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalized) ? normalized as RiskLevel : 'NOT_AVAILABLE'
}
const availability = (item: Json) => ({
  calculationAvailable: Boolean(item.calculationAvailable),
  reason: item.reason ? String(item.reason) : null,
})

export const projectDashboardService = {
  async getProjectDashboard(projectId: string): Promise<ApiResponse<ProjectDashboardResponse>> {
    const response = await apiRequest<Json>(`/projects/${encodeURIComponent(projectId)}/dashboard`)
    if (!response.success) return fail(response.message)
    const data = response.data
    const project = data.project ?? {}
    const density = data.defectDensity ?? {}
    const severity = data.severityIndex ?? {}
    const rate = data.confirmedDefectRate ?? data.defectToRemarkRatio ?? {}
    const release = data.currentRelease
    const execution = data.testExecutionProgress
    return ok({
      project: {
        projectId: str(project.projectId, project.id, projectId),
        projectName: str(project.projectName, project.name),
        status: project.status,
        startDate: str(project.startDate),
        endDate: str(project.endDate),
        projectManagerId: project.projectManagerId == null ? null : String(project.projectManagerId),
        projectManagerName: project.projectManagerName == null ? null : String(project.projectManagerName),
      },
      overallRisk: risk(data.overallRisk?.risk ?? data.overallRisk),
      defectDensity: { ...availability(density), value: nullableNumber(density.value), kloc: nullableNumber(density.kloc), totalConfirmedDefects: num(density.totalConfirmedDefects), risk: risk(density.risk) },
      severityIndex: { ...availability(severity), value: nullableNumber(severity.value), maximumPossibleValue: nullableNumber(severity.maximumPossibleValue), normalizedPercentage: nullableNumber(severity.normalizedPercentage), totalConfirmedDefects: num(severity.totalConfirmedDefects), risk: risk(severity.risk) },
      confirmedDefectRate: { ...availability(rate), value: nullableNumber(rate.value), confirmedDefects: num(rate.confirmedDefects), nonConfirmedDefects: num(rate.nonConfirmedDefects, rate.nonConfirmedRemarks), totalReportedDefects: num(rate.totalReportedDefects, rate.totalRemarks), risk: risk(rate.risk) },
      currentRelease: release ? { releaseId: str(release.releaseId, release.id), releaseName: str(release.releaseName, release.name), version: str(release.version), releaseDate: str(release.releaseDate) } : null,
      testExecutionProgress: execution ? { totalAllocatedTestCases: num(execution.totalAllocatedTestCases), executedTestCases: num(execution.executedTestCases), passedTestCases: num(execution.passedTestCases), failedTestCases: num(execution.failedTestCases), percentage: nullableNumber(execution.percentage) } : null,
      counts: {
        totalReportedDefects: num(data.counts?.totalReportedDefects),
        confirmedDefects: num(data.counts?.confirmedDefects),
        openDefects: num(data.counts?.openDefects),
        closedDefects: num(data.counts?.closedDefects),
        criticalOpenDefects: num(data.counts?.criticalOpenDefects),
        reopenedDefects: num(data.counts?.reopenedDefects),
      },
      lastUpdatedAt: str(data.lastUpdatedAt),
    }, response.message)
  },

  async getSeverityBreakdown(projectId: string): Promise<ApiResponse<SeverityBreakdownData>> {
    const response = await apiRequest<Json>(`/projects/${encodeURIComponent(projectId)}/dashboard/severity-breakdown`)
    if (!response.success) return fail(response.message)
    const groups = Array.isArray(response.data?.groups) ? response.data.groups : []
    return ok({
      totalReportedDefects: num(response.data?.totalReportedDefects),
      totalConfirmedDefects: num(response.data?.totalConfirmedDefects),
      groups: groups.map((group: Json) => ({
        severity: str(group.severity, group.name),
        color: str(group.color) || '#8B96AC',
        weight: num(group.weight),
        totalDefects: num(group.totalDefects),
        statusCounts: (Array.isArray(group.statusCounts) ? group.statusCounts : []).map((status: Json) => ({
          status: str(status.status, status.name),
          count: num(status.count),
          color: str(status.color) || '#8B96AC',
        })),
      })),
    }, response.message)
  },
  async getChartAnalytics(projectId: string): Promise<ApiResponse<ProjectChartAnalytics>> {
    const response = await apiRequest<Json>(`/projects/${encodeURIComponent(projectId)}/dashboard/chart-analytics`)
    if (!response.success) return fail(response.message)
    const data = response.data ?? {}
    return ok({
      defectTypeDistribution: Array.isArray(data.defectTypeDistribution) ? data.defectTypeDistribution : [],
      defectsByModule: Array.isArray(data.defectsByModule) ? data.defectsByModule : [],
      severityStatusStack: Array.isArray(data.severityStatusStack) ? data.severityStatusStack : [],
      defectTrend: Array.isArray(data.defectTrend) ? data.defectTrend : [],
      reopenedBuckets: Array.isArray(data.reopenedBuckets) ? data.reopenedBuckets : [],
    }, response.message)
  },
  async getModuleRisk(projectId: string): Promise<ApiResponse<ModuleRiskHeatMap>> {
    const response = await apiRequest<Json>(`/projects/${encodeURIComponent(projectId)}/dashboard/module-risk`)
    if (!response.success) return fail(response.message)
    const data = response.data ?? {}
    return ok({
      modules: Array.isArray(data.modules) ? data.modules : [],
      severities: Array.isArray(data.severities) ? data.severities : [],
      cells: Array.isArray(data.cells) ? data.cells : [],
    }, response.message)
  },
  getReleaseAnalytics(projectId: string, releaseId: string): Promise<ApiResponse<ReleaseAnalyticsData>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/dashboard/releases/${encodeURIComponent(releaseId)}`)
  },
  getProjectKloc(projectId: string): Promise<ApiResponse<ProjectKloc>> {
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/kloc`)
  },
  updateProjectKloc(projectId: string, kloc: number): Promise<ApiResponse<ProjectKloc>> {
    if (!Number.isFinite(kloc) || kloc <= 0) return Promise.resolve(fail('KLOC must be greater than zero.'))
    return apiRequest(`/projects/${encodeURIComponent(projectId)}/kloc`, { method: 'PUT', body: { kloc } })
  },
}
