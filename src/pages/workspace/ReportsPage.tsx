import React, { useEffect, useState } from 'react'
import { Boxes, Bug, ClipboardList, Gauge, Rocket } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Loader } from '@/components/common/Loader'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjectModuleGate } from '@/components/projects/ProjectSelectionGate'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { useProjectScope } from '@/hooks/useProjectScope'
import { projectService } from '@/services/projectService'
import { ProjectSummary } from '@/types/project'
import { formatNumber } from '@/utils/format'

export const ReportsPage: React.FC = () => {
  const { projectId, isProjectRoute } = useProjectScope()
  const [report, setReport] = useState<ProjectSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!projectId) {
      setReport(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let active = true
    setIsLoading(true)
    setError(null)
    projectService
      .getProjectSummary(projectId)
      .then((result) => {
        if (!active) return
        if (result.success) setReport(result.data)
        else setError(result.message)
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setReport(null)
        setError('Unable to load project reports.')
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectId, reloadKey])

  const reportContent = isLoading ? (
    <div className="flex h-52 items-center justify-center"><Loader label="Loading project reports..." /></div>
  ) : error || !report ? (
    <div className="py-10"><ErrorMessage message={error || 'Project reports are unavailable.'} onRetry={() => setReloadKey((key) => key + 1)} /></div>
  ) : (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Modules', value: report.moduleCount, icon: Boxes },
          { label: 'Releases', value: report.releaseCount, icon: Rocket },
          { label: 'Test Cases', value: report.testCaseCount, icon: ClipboardList },
          { label: 'Defects', value: report.defectCount, icon: Bug },
          { label: 'Utilization', value: `${report.allocationSummary.averageUtilizationPercentage}%`, icon: Gauge },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-lg border border-ink-100 bg-white p-4 shadow-panel">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-ink-500">{item.label}</p>
                <Icon className="h-4 w-4 text-ink-400" />
              </div>
              <p className="mt-2 text-xl font-semibold text-ink-900">
                {typeof item.value === 'number' ? formatNumber(item.value) : item.value}
              </p>
            </div>
          )
        })}
      </div>

      <Card title="Project Report Summary" subtitle={report.project.name}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-ink-400">Active Allocations</p><p className="mt-1 text-sm font-semibold text-ink-800">{formatNumber(report.allocationSummary.activeAllocationCount)}</p></div>
          <div><p className="text-xs text-ink-400">Total Allocation</p><p className="mt-1 text-sm font-semibold text-ink-800">{report.allocationSummary.totalAllocatedPercentage}%</p></div>
          <div><p className="text-xs text-ink-400">Manager Allocation</p><p className="mt-1 text-sm font-semibold text-ink-800">{report.allocationSummary.managerAllocationPercentage}%</p></div>
          <div><p className="text-xs text-ink-400">Date Warnings</p><p className="mt-1 text-sm font-semibold text-ink-800">{formatNumber(report.allocationDateWarnings.length)}</p></div>
        </div>
      </Card>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Project delivery, quality, and allocation reporting."
        actions={!isProjectRoute ? <ProjectSelector /> : undefined}
      />
      <ProjectModuleGate isProjectRoute={isProjectRoute}>{reportContent}</ProjectModuleGate>
    </div>
  )
}
