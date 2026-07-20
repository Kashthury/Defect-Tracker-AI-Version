import { getRiskLevel } from '@/config/riskThresholds'
import { DASHBOARD_DEFECTS, DASHBOARD_MODULES } from '@/mock/dashboardData'
import { getSeverityWeightConfig } from './severityAnalyticsService'
import { ApiResponse } from '@/types/common'
import { ModuleRiskHeatMap } from '@/types/dashboard'
import { mockDelay, ok } from '../apiClient'

/** Cell-level thresholds: defect count per module/severity combination. */
const CELL_ZONES = { low: 3, medium: 8, high: 15 }

export const moduleRiskService = {
  /** GET /api/dashboard/projects/{projectId}/module-risk */
  async getModuleRiskHeatMap(projectId: string): Promise<ApiResponse<ModuleRiskHeatMap>> {
    await mockDelay()
    const defects = DASHBOARD_DEFECTS.filter((d) => d.projectId === projectId)
    const modules = DASHBOARD_MODULES.filter((m) => m.projectId === projectId).map((m) => m.name)
    const severityConfig = await getSeverityWeightConfig()
    const severities = severityConfig.map((s) => s.name)

    const cells = modules.flatMap((moduleName) =>
      severities.map((severity) => {
        const count = defects.filter((d) => d.moduleName === moduleName && d.severityName === severity).length
        return { moduleName, severity, count, risk: getRiskLevel(count, CELL_ZONES) }
      }),
    )

    return ok({ modules, severities, cells })
  },
}
