import { DASHBOARD_ACTIVITY } from '@/mock/dashboardData'
import { ApiResponse } from '@/types/common'
import { ActivityFeedItem } from '@/types/dashboard'
import { mockDelay, ok } from '../apiClient'

export const activityService = {
  /** GET /api/dashboard/projects/{projectId}/activity */
  async getRecentActivity(projectId: string, limit = 12): Promise<ApiResponse<ActivityFeedItem[]>> {
    await mockDelay()
    const items = DASHBOARD_ACTIVITY
      .filter((a) => a.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .map((a) => ({ id: a.id, type: a.type, message: a.message, actorName: a.actorName, timestamp: a.timestamp }))
    return ok(items)
  },
}
