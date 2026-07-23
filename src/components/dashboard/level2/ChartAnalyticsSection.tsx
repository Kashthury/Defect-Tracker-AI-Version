import React, { useEffect, useState } from 'react'
import { ChartCard } from '@/components/dashboard/shared/ChartCard'
import { DonutChart } from '@/components/dashboard/charts/DonutChart'
import { HorizontalBarChart } from '@/components/dashboard/charts/HorizontalBarChart'
import { StackedBarChart } from '@/components/dashboard/charts/StackedBarChart'
import { TrendLineChart } from '@/components/dashboard/charts/TrendLineChart'
import { projectDashboardService } from '@/services/dashboard/projectDashboardService'
import { ProjectChartAnalytics } from '@/types/dashboard'

interface ChartAnalyticsSectionProps {
  projectId: string
  refreshToken: number
}

export const ChartAnalyticsSection: React.FC<ChartAnalyticsSectionProps> = ({ projectId, refreshToken }) => {
  const [data, setData] = useState<ProjectChartAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    projectDashboardService
      .getChartAnalytics(projectId)
      .then((result) => {
        if (!active) return
        if (result.success) setData(result.data)
        else setError(result.message)
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Unable to load chart analytics.')
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectId, refreshToken])

  const reopenColors = ['#6FB6DE', '#C99A2E', '#D97A3F', '#7A1E2E']
  const stackedData =
    data?.severityStatusStack[0]?.statuses.map((status, i) => {
      const row: Record<string, string | number> = { status: status.status }
      data.severityStatusStack.forEach((sev) => {
        row[sev.severity] = sev.statuses[i]?.count ?? 0
      })
      return row
    }) ?? []

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard title="Defect Distribution by Type" subtitle="Backend-reported Defect Type distribution" isLoading={isLoading} error={error} isEmpty={!!data && data.defectTypeDistribution.length === 0} emptyLabel="No Defect Type data is available for this Project.">
        {data && <DonutChart data={data.defectTypeDistribution.map((s) => ({ name: s.type, value: s.count, color: s.color }))} />}
      </ChartCard>

      <ChartCard title="Defects by Module" subtitle="Backend-reported Module counts" isLoading={isLoading} error={error} isEmpty={!!data && data.defectsByModule.length === 0} emptyLabel="No Module defect data is available for this Project.">
        {data && <HorizontalBarChart data={data.defectsByModule.map((m) => ({ label: m.moduleName, value: m.count }))} />}
      </ChartCard>

      <ChartCard title="Severity Distribution by Status" subtitle="Every severity broken down by current status" isLoading={isLoading} error={error} isEmpty={!!data && stackedData.length === 0} className="xl:col-span-2">
        {data && (
          <StackedBarChart
            data={stackedData}
            categoryKey="status"
            series={data.severityStatusStack.map((sev) => ({ key: sev.severity, color: sev.color }))}
          />
        )}
      </ChartCard>

      <ChartCard title="Defects Created vs Closed" subtitle="Monthly trend in backend-provided order" isLoading={isLoading} error={error} isEmpty={!!data && data.defectTrend.length === 0} emptyLabel="Defect history is not available for this chart.">
        {data && (
          <TrendLineChart
            data={data.defectTrend}
            categoryKey="label"
            series={[
              { key: 'created', color: '#2E8FC9', label: 'Created' },
              { key: 'closed', color: '#3E8E64', label: 'Closed' },
            ]}
          />
        )}
      </ChartCard>

      <ChartCard title="Defects Reopened Multiple Times" subtitle="Grouped by backend reopen buckets" isLoading={isLoading} error={error} isEmpty={!!data && (data.reopenedBuckets.length === 0 || data.reopenedBuckets.every((b) => b.count === 0))} emptyLabel="No Defects have been reopened.">
        {data && (
          <HorizontalBarChart
            data={data.reopenedBuckets.map((b) => ({ label: b.bucket, value: b.count }))}
            colorForValue={(_, i) => reopenColors[i] ?? '#7A1E2E'}
          />
        )}
      </ChartCard>
    </div>
  )
}
