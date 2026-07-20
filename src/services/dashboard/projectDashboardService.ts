import { mockProjects } from '@/mock/projects'
import { CONFIRMED_DEFECT_STATUSES } from '@/mock/dashboardConfig'
import { DASHBOARD_DEFECTS, KLOC_STORE } from '@/mock/dashboardData'
import { ApiResponse } from '@/types/common'
import { ProjectQualityDashboardData, UpdateKlocPayload } from '@/types/dashboard'
import { fail, mockDelay, ok } from '../apiClient'
import { riskCalculationService } from './riskCalculationService'
import { getSeverityWeightConfig } from './severityAnalyticsService'

/**
 * Computes the Overall Project Risk, Defect Density, Defect Severity Index
 * and Defect-to-Remark Ratio for a project from the current mock dataset.
 * Shared by both the Level 2 dashboard and the Level 1 portfolio dashboard
 * so every risk badge in the app is derived from one calculation path.
 */
export async function computeProjectQualityMetrics(projectId: string): Promise<ProjectQualityDashboardData | null> {
  const project = mockProjects.find((p) => p.id === projectId)
  if (!project) return null

  const defects = DASHBOARD_DEFECTS.filter((d) => d.projectId === projectId)
  const confirmedDefects = defects.filter((d) => CONFIRMED_DEFECT_STATUSES.includes(d.statusCode))
  const kloc = KLOC_STORE.get(projectId) ?? 0

  const defectDensity = riskCalculationService.calculateDefectDensity(confirmedDefects.length, kloc)

  const severityConfig = await getSeverityWeightConfig()
  const severityCounts = severityConfig.map((sev) => ({
    severity: sev.name,
    weight: sev.weight,
    count: confirmedDefects.filter((d) => d.severityName === sev.name).length,
  }))
  const severityIndex = riskCalculationService.calculateSeverityIndex(severityCounts)

  const defectToRemarkRatio = riskCalculationService.calculateDefectToRemarkRatio(
    confirmedDefects.length,
    defects.length,
  )

  const overallRisk = riskCalculationService.calculateOverallRisk([
    { label: 'Defect Density', risk: defectDensity.risk },
    { label: 'Defect Severity Index', risk: severityIndex.risk },
    { label: 'Defect-to-Remark Ratio', risk: defectToRemarkRatio.risk },
  ])

  return { project, overallRisk, defectDensity, severityIndex, defectToRemarkRatio }
}

export const projectDashboardService = {
  /** GET /api/dashboard/projects/{projectId}/risk (and general project quality summary) */
  async getProjectQualityDashboard(projectId: string): Promise<ApiResponse<ProjectQualityDashboardData>> {
    await mockDelay()
    const data = await computeProjectQualityMetrics(projectId)
    if (!data) return fail('Project quality dashboard is unavailable.')
    return ok(data)
  },

  /** PATCH /api/dashboard/projects/{projectId}/kloc */
  async updateKloc(payload: UpdateKlocPayload): Promise<ApiResponse<ProjectQualityDashboardData>> {
    await mockDelay()
    if (!Number.isFinite(payload.kloc) || payload.kloc <= 0) {
      return fail('KLOC must be a positive number.')
    }
    KLOC_STORE.set(payload.projectId, payload.kloc)
    const data = await computeProjectQualityMetrics(payload.projectId)
    if (!data) return fail('Project quality dashboard is unavailable.')
    return ok(data, 'KLOC updated successfully.')
  },

  /** POST /api/dashboard/projects/{projectId}/risk/recalculate */
  async recalculateRisk(projectId: string): Promise<ApiResponse<ProjectQualityDashboardData>> {
    await mockDelay()
    const data = await computeProjectQualityMetrics(projectId)
    if (!data) return fail('Project quality dashboard is unavailable.')
    return ok(data, 'Project risk recalculated.')
  },
}
