import { mockProjects } from '@/mock/projects'
import { CONFIRMED_DEFECT_STATUSES } from '@/mock/dashboardConfig'
import { DASHBOARD_DEFECTS } from '@/mock/dashboardData'
import { RISK_LEVELS, RiskLevel } from '@/config/riskThresholds'
import { ApiResponse } from '@/types/common'
import { PortfolioDashboardData, PortfolioProjectCard } from '@/types/dashboard'
import { mockDelay, ok } from '../apiClient'
import { computeProjectQualityMetrics } from './projectDashboardService'

const TODAY = new Date('2026-07-17T00:00:00Z')

function estimateCompletion(projectId: string, status: string): number {
  if (status === 'COMPLETED') return 100
  const defects = DASHBOARD_DEFECTS.filter((d) => d.projectId === projectId)
  if (defects.length === 0) return 8
  const resolvedRatio = defects.filter((d) => d.closedAt).length / defects.length
  return Math.round(Math.min(97, Math.max(8, resolvedRatio * 100)))
}

export const portfolioDashboardService = {
  /** GET /api/dashboard/portfolio */
  async getPortfolioDashboard(): Promise<ApiResponse<PortfolioDashboardData>> {
    await mockDelay()

    const projectCards: PortfolioProjectCard[] = []
    const riskCounts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    let completedProjects = 0
    let delayedProjects = 0

    for (const project of mockProjects) {
      const quality = await computeProjectQualityMetrics(project.id)
      if (!quality) continue

      const risk = quality.overallRisk.risk
      riskCounts[risk] += 1

      const defects = DASHBOARD_DEFECTS.filter((d) => d.projectId === project.id)
      const openDefectCount = defects.filter((d) => CONFIRMED_DEFECT_STATUSES.includes(d.statusCode) && !d.closedAt).length
      const criticalDefectCount = defects.filter((d) => d.severityName === 'Critical' && !d.closedAt).length
      const completionPercentage = estimateCompletion(project.id, project.status)

      const isCompleted = project.status === 'COMPLETED'
      const isDelayed = project.status === 'ACTIVE' && new Date(project.endDate) < TODAY
      if (isCompleted) completedProjects += 1
      if (isDelayed) delayedProjects += 1

      projectCards.push({
        projectId: project.id,
        projectName: project.name,
        risk,
        status: project.status,
        currentRelease: project.currentRelease ?? 'Not scheduled',
        openDefectCount,
        criticalDefectCount,
        completionPercentage,
        lastUpdatedAt: project.updatedAt,
      })
    }

    const totalProjects = projectCards.length
    const riskDistribution = RISK_LEVELS.map((risk) => ({
      risk,
      count: riskCounts[risk],
      percentage: totalProjects > 0 ? Math.round((riskCounts[risk] / totalProjects) * 100) : 0,
    })).filter((slice) => slice.count > 0 || slice.risk !== 'CRITICAL')

    return ok({
      summary: {
        totalProjects,
        lowRiskCount: riskCounts.LOW,
        mediumRiskCount: riskCounts.MEDIUM,
        highRiskCount: riskCounts.HIGH,
        criticalRiskCount: riskCounts.CRITICAL,
        completedProjects,
        delayedProjects,
      },
      riskDistribution,
      projects: projectCards.sort((a, b) => b.openDefectCount - a.openDefectCount),
    })
  },
}
