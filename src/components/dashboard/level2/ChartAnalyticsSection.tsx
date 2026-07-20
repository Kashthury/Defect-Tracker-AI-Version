import React, { useEffect, useState } from 'react'
import { ChartCard } from '@/components/dashboard/shared/ChartCard'
import { DonutChart } from '@/components/dashboard/charts/DonutChart'
import { HorizontalBarChart } from '@/components/dashboard/charts/HorizontalBarChart'
import { StackedBarChart } from '@/components/dashboard/charts/StackedBarChart'
import { TrendLineChart } from '@/components/dashboard/charts/TrendLineChart'
import { defectTrendService } from '@/services/dashboard/defectTrendService'
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
    defectTrendService
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
      <ChartCard title="Defect Distribution by Type" subtitle="Functional, UI, Performance, Security & more" isLoading={isLoading} error={error} isEmpty={!!data && data.defectTypeDistribution.length === 0}>
        {data && <DonutChart data={data.defectTypeDistribution.map((s) => ({ name: s.type, value: s.count, color: s.color }))} />}
      </ChartCard>

      <ChartCard title="Defects by Module" subtitle="Sorted from highest to lowest defect count" isLoading={isLoading} error={error} isEmpty={!!data && data.defectsByModule.length === 0}>
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

      <ChartCard title="Defects Created vs Closed" subtitle="Monthly trend over the last 8 months" isLoading={isLoading} error={error} isEmpty={!!data && data.defectTrend.every((p) => p.created === 0 && p.closed === 0)}>
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

      <ChartCard title="Defects Reopened Multiple Times" subtitle="Grouped by number of reopen cycles" isLoading={isLoading} error={error} isEmpty={!!data && data.reopenedBuckets.every((b) => b.count === 0)}>
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
