import { mockSeverities, mockStatusTypes } from '@/mock/configuration'
import { CONFIRMED_DEFECT_STATUSES, DASHBOARD_STATUS_MATRIX, NON_CONFIRMED_DEFECT_STATUSES } from '@/mock/dashboardConfig'
import { DASHBOARD_DEFECTS } from '@/mock/dashboardData'
import { STATUS_TYPE_LABELS } from '@/constants/statusTypes'
import { ApiResponse } from '@/types/common'
import { SeverityBreakdownData, SeverityWeightConfigEntry } from '@/types/dashboard'
import { mockDelay, ok } from '../apiClient'

/**
 * GET /api/dashboard/severity-config equivalent — severity name, weight,
 * color and display order come from here rather than being hardcoded in
 * dashboard components.
 */
export async function getSeverityWeightConfig(): Promise<SeverityWeightConfigEntry[]> {
  return [...mockSeverities]
    .sort((a, b) => b.weight - a.weight)
    .map((s, index) => ({ severityId: s.id, name: s.name, weight: s.weight, color: s.color, order: index }))
}

export const severityAnalyticsService = {
  /** GET /api/dashboard/projects/{projectId}/severity-breakdown */
  async getSeverityBreakdown(projectId: string): Promise<ApiResponse<SeverityBreakdownData>> {
    await mockDelay()
    const defects = DASHBOARD_DEFECTS.filter((d) => d.projectId === projectId)
    const severityConfig = await getSeverityWeightConfig()

    const totalReportedRemarks = defects.length
    const totalConfirmedDefects = defects.filter((d) => CONFIRMED_DEFECT_STATUSES.includes(d.statusCode)).length

    const groups = severityConfig.map((sev) => {
      const severityDefects = defects.filter((d) => d.severityName === sev.name)
      const statusCounts = DASHBOARD_STATUS_MATRIX.map((code) => ({
        status: STATUS_TYPE_LABELS[code],
        count: severityDefects.filter((d) => d.statusCode === code).length,
        color: mockStatusTypes.find((status) => status.code === code)?.color ?? '#8B96AC',
      }))
      return {
        severity: sev.name,
        color: sev.color,
        weight: sev.weight,
        totalDefects: severityDefects.length,
        statusCounts,
      }
    })

    return ok({ totalReportedRemarks, totalConfirmedDefects, groups })
  },
}

export const _severityStatusOrder = [...CONFIRMED_DEFECT_STATUSES, ...NON_CONFIRMED_DEFECT_STATUSES]
