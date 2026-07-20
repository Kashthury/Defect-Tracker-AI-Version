import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, RefreshCcw } from 'lucide-react'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { Button } from '@/components/common/Button'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { RiskMetricsRow } from './RiskMetricsRow'
import { SeverityBreakdownPanel } from './SeverityBreakdownPanel'
import { ChartAnalyticsSection } from './ChartAnalyticsSection'
import { ReleaseAnalyticsSection } from './ReleaseAnalyticsSection'
import { ModuleRiskHeatMapSection } from './ModuleRiskHeatMapSection'
import { projectDashboardService } from '@/services/dashboard/projectDashboardService'
import { releaseAnalyticsService } from '@/services/dashboard/releaseAnalyticsService'
import { ProjectQualityDashboardData } from '@/types/dashboard'
import { ReleaseRecord } from '@/types/release'

interface ProjectQualityDashboardProps {
  projectId: string
  onBackToPortfolio: () => void
}

export const ProjectQualityDashboard: React.FC<ProjectQualityDashboardProps> = ({ projectId, onBackToPortfolio }) => {
  const [data, setData] = useState<ProjectQualityDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [releases, setReleases] = useState<ReleaseRecord[]>([])
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [dashboardResult, releaseResult] = await Promise.all([
        projectDashboardService.getProjectQualityDashboard(projectId),
        releaseAnalyticsService.getReleasesForProject(projectId),
      ])
      if (dashboardResult.success) setData(dashboardResult.data)
      else setError(dashboardResult.message)

      if (releaseResult.success) {
        setReleases(releaseResult.data)
        setSelectedReleaseId((current) => {
          if (current && releaseResult.data.some((r) => r.id === current)) return current
          const active = releaseResult.data.find((r) => r.status === 'ACTIVE')
          return active?.id ?? releaseResult.data[0]?.id ?? ''
        })
      }
    } catch {
      setError('Unable to load the project quality dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadDashboard()
    setRefreshToken((k) => k + 1)
    setIsRefreshing(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToPortfolio}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Portfolio Dashboard
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectSelector className="w-56" />
          <Button variant="outline" size="sm" leftIcon={<RefreshCcw className="h-3.5 w-3.5" />} onClick={handleRefresh} isLoading={isRefreshing}>
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-72 items-center justify-center"><Loader label="Loading project quality dashboard..." /></div>
      ) : error || !data ? (
        <ErrorMessage message={error ?? 'Project dashboard unavailable.'} onRetry={loadDashboard} />
      ) : (
        <>
          <RiskMetricsRow projectId={projectId} data={data} onDataChanged={setData} />
          <SeverityBreakdownPanel projectId={projectId} refreshToken={refreshToken} />
          <ChartAnalyticsSection projectId={projectId} refreshToken={refreshToken} />
          <ReleaseAnalyticsSection
            projectId={projectId}
            releases={releases}
            releaseId={selectedReleaseId}
            onReleaseChange={setSelectedReleaseId}
          />
          <ModuleRiskHeatMapSection projectId={projectId} refreshToken={refreshToken} />
        </>
      )}
    </div>
  )
}
