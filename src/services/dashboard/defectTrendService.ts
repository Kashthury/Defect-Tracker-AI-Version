import { DASHBOARD_DEFECT_TYPES, DASHBOARD_STATUS_MATRIX } from '@/mock/dashboardConfig'
import { DASHBOARD_DEFECTS, DASHBOARD_MODULES } from '@/mock/dashboardData'
import { getSeverityWeightConfig } from './severityAnalyticsService'
import { STATUS_TYPE_LABELS } from '@/constants/statusTypes'
import { ApiResponse } from '@/types/common'
import { ProjectChartAnalytics } from '@/types/dashboard'
import { mockDelay, ok } from '../apiClient'

const REOPEN_BUCKET_LABELS = ['1 Reopen', '2 Reopens', '3 Reopens', '4+ Reopens']

export const defectTrendService = {
  /**
   * GET /api/dashboard/projects/{projectId}/defect-types
   * GET /api/dashboard/projects/{projectId}/modules
   * GET /api/dashboard/projects/{projectId}/reopened-defects
   * Combined here since all four charts share one date range / filter set.
   */
  async getChartAnalytics(projectId: string): Promise<ApiResponse<ProjectChartAnalytics>> {
    await mockDelay()
    const defects = DASHBOARD_DEFECTS.filter((d) => d.projectId === projectId)
    const total = defects.length

    const defectTypeDistribution = DASHBOARD_DEFECT_TYPES.map((type) => {
      const count = defects.filter((d) => d.defectTypeName === type.name).length
      return { type: type.name, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0, color: type.color }
    }).filter((slice) => slice.count > 0)

    const modules = DASHBOARD_MODULES.filter((m) => m.projectId === projectId)
    const defectsByModule = modules
      .map((m) => ({ moduleName: m.name, count: defects.filter((d) => d.moduleId === m.id).length }))
      .sort((a, b) => b.count - a.count)

    const severityConfig = await getSeverityWeightConfig()
    const severityStatusStack = severityConfig.map((sev) => ({
      severity: sev.name,
      color: sev.color,
      statuses: DASHBOARD_STATUS_MATRIX.map((code) => ({
        status: STATUS_TYPE_LABELS[code],
        count: defects.filter((d) => d.severityName === sev.name && d.statusCode === code).length,
      })),
    }))

    // Created vs Closed trend, grouped by month over the last 8 months.
    const now = new Date('2026-07-17T00:00:00Z')
    const months: { label: string; start: Date; end: Date }[] = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1)
      const end = new Date(now.getFullYear(), now.getMonth() - (7 - i) + 1, 1)
      return { label: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), start, end }
    })
    const defectTrend = months.map(({ label, start, end }) => ({
      label,
      created: defects.filter((d) => {
        const t = new Date(d.reportedAt)
        return t >= start && t < end
      }).length,
      closed: defects.filter((d) => {
        if (!d.closedAt) return false
        const t = new Date(d.closedAt)
        return t >= start && t < end
      }).length,
    }))

    const reopenedBuckets = REOPEN_BUCKET_LABELS.map((bucket, i) => {
      const bucketValue = i + 1
      const count =
        bucketValue === 4
          ? defects.filter((d) => d.reopenCount >= 4).length
          : defects.filter((d) => d.reopenCount === bucketValue).length
      return { bucket, count }
    })

    return ok({ defectTypeDistribution, defectsByModule, severityStatusStack, defectTrend, reopenedBuckets })
  },
}
