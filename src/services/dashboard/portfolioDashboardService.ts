import { RiskLevel } from '@/config/riskThresholds'
import { ApiResponse } from '@/types/common'
import {
  ActiveReleaseSummary,
  PortfolioDashboardResponse,
  PortfolioProject,
  TestExecutionProgress,
} from '@/types/dashboard'
import { apiRequest, fail, ok } from '../apiClient'

type Json = Record<string, any>
const num = (...values: unknown[]) => Number(values.find((value) => value !== undefined && value !== null) ?? 0)
const str = (...values: unknown[]) => String(values.find((value) => value !== undefined && value !== null) ?? '')
const risk = (value: unknown): RiskLevel => {
  const normalized = str(value).toUpperCase()
  return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(normalized) ? normalized as RiskLevel : 'NOT_AVAILABLE'
}
const release = (value: unknown): ActiveReleaseSummary | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Json
  return {
    releaseId: str(item.releaseId, item.id),
    releaseName: str(item.releaseName, item.name),
    version: str(item.version),
    releaseDate: str(item.releaseDate),
  }
}
const progress = (value: unknown): TestExecutionProgress | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Json
  return {
    totalAllocatedTestCases: num(item.totalAllocatedTestCases),
    executedTestCases: num(item.executedTestCases),
    passedTestCases: num(item.passedTestCases),
    failedTestCases: num(item.failedTestCases),
    percentage: item.percentage === null || item.percentage === undefined ? null : Number(item.percentage),
  }
}
const project = (item: Json): PortfolioProject => ({
  projectId: str(item.projectId, item.id),
  projectName: str(item.projectName, item.name),
  status: item.status,
  risk: risk(item.risk),
  openDefectCount: num(item.openDefectCount, item.openDefects),
  criticalDefectCount: num(item.criticalDefectCount, item.criticalOpenDefects),
  currentRelease: release(item.currentRelease),
  testExecutionProgress: progress(item.testExecutionProgress),
  lastUpdatedAt: str(item.lastUpdatedAt, item.updatedAt),
  delayed: item.delayed === true,
})

export const portfolioDashboardService = {
  async getPortfolioDashboard(): Promise<ApiResponse<PortfolioDashboardResponse>> {
    const response = await apiRequest<Json>('/dashboard/portfolio')
    if (!response.success) return fail(response.message)
    const data = response.data
    const summary = data.summary ?? {}
    return ok({
      summary: {
        totalProjects: num(summary.totalProjects),
        activeProjects: num(summary.activeProjects),
        onHoldProjects: num(summary.onHoldProjects),
        completedProjects: num(summary.completedProjects),
        delayedProjects: num(summary.delayedProjects),
        lowRiskCount: num(summary.lowRiskCount, summary.lowRiskProjects),
        mediumRiskCount: num(summary.mediumRiskCount, summary.mediumRiskProjects),
        highRiskCount: num(summary.highRiskCount, summary.highRiskProjects),
        criticalRiskCount: num(summary.criticalRiskCount),
      },
      riskDistribution: Array.isArray(data.riskDistribution)
        ? data.riskDistribution.map((item: Json) => ({ risk: risk(item.risk) as Exclude<RiskLevel, 'NOT_AVAILABLE'>, count: num(item.count) })).filter((item: { risk: RiskLevel }) => item.risk !== 'NOT_AVAILABLE')
        : [],
      projects: (Array.isArray(data.projects) ? data.projects : data.projectCards ?? []).map(project),
    }, response.message)
  },
}
