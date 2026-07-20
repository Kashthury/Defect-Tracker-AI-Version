import { STATUS_TYPE_CODES } from '@/constants/statusTypes'
import { mockReleases } from '@/mock/releases'
import { DASHBOARD_DEFECTS } from '@/mock/dashboardData'
import { ApiResponse } from '@/types/common'
import { ReleaseAnalyticsData } from '@/types/dashboard'
import { ReleaseRecord } from '@/types/release'
import { mockDelay, ok } from '../apiClient'

function average(values: number[]): number {
  if (values.length === 0) return 0
  return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1))
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1))
}

function groupByDay(values: { days: number }[]): { days: number; defectCount: number }[] {
  const counts = new Map<number, number>()
  values.forEach(({ days }) => counts.set(days, (counts.get(days) ?? 0) + 1))
  return Array.from(counts, ([days, defectCount]) => ({ days, defectCount })).sort((a, b) => a.days - b.days)
}

export const releaseAnalyticsService = {
  /** GET /api/dashboard/projects/{projectId}/releases (used to populate the Release dropdown) */
  async getReleasesForProject(projectId: string): Promise<ApiResponse<ReleaseRecord[]>> {
    await mockDelay(150)
    return ok(mockReleases.filter((r) => r.projectId === projectId))
  },

  /**
   * GET /api/dashboard/projects/{projectId}/releases/{releaseId}/time-to-find
   * GET /api/dashboard/projects/{projectId}/releases/{releaseId}/time-to-fix
   * Combined here since both charts and the release summary share one filter.
   */
  async getReleaseAnalytics(projectId: string, releaseId: string): Promise<ApiResponse<ReleaseAnalyticsData>> {
    await mockDelay()
    const defects = DASHBOARD_DEFECTS.filter((d) => d.projectId === projectId && d.releaseId === releaseId)

    const timeToFind = groupByDay(defects.map((d) => ({ days: d.daysToFind })))
    const fixedDefects = defects.filter((d) => d.daysToFix !== null)
    const timeToFix = groupByDay(fixedDefects.map((d) => ({ days: d.daysToFix as number })))

    const summary = {
      averageTimeToFind: average(defects.map((d) => d.daysToFind)),
      medianTimeToFind: median(defects.map((d) => d.daysToFind)),
      averageTimeToFix: average(fixedDefects.map((d) => d.daysToFix as number)),
      medianTimeToFix: median(fixedDefects.map((d) => d.daysToFix as number)),
      totalDefects: defects.length,
      openCount: defects.filter((d) => d.statusCode === STATUS_TYPE_CODES.OPEN).length,
      closedCount: defects.filter((d) => d.statusCode === STATUS_TYPE_CODES.CLOSED).length,
      criticalCount: defects.filter((d) => d.severityName === 'Critical').length,
      fixedCount: defects.filter((d) => d.statusCode === STATUS_TYPE_CODES.FIXED).length,
      pendingCount: defects.filter((d) => d.statusCode === STATUS_TYPE_CODES.PENDING).length,
      reopenedCount: defects.filter((d) => d.statusCode === STATUS_TYPE_CODES.REOPENED).length,
    }

    return ok({ releaseId, timeToFind, timeToFix, summary })
  },
}
