import React, { useEffect, useState } from 'react'
import { ChartCard } from '@/components/dashboard/shared/ChartCard'
import { TrendLineChart } from '@/components/dashboard/charts/TrendLineChart'
import { Dropdown } from '@/components/common/Dropdown'
import { releaseAnalyticsService } from '@/services/dashboard/releaseAnalyticsService'
import { ReleaseAnalyticsData } from '@/types/dashboard'
import { ReleaseRecord } from '@/types/release'
import { RISK_COLORS } from '@/config/riskThresholds'

interface ReleaseAnalyticsSectionProps {
  projectId: string
  releases: ReleaseRecord[]
  releaseId: string
  onReleaseChange: (releaseId: string) => void
}

const SummaryChip: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-center rounded-lg bg-ink-50 px-3 py-2.5">
    <span className="text-lg font-bold" style={{ color: color ?? '#26314A' }}>{value}</span>
    <span className="text-[11px] text-ink-500">{label}</span>
  </div>
)

export const ReleaseAnalyticsSection: React.FC<ReleaseAnalyticsSectionProps> = ({ projectId, releases, releaseId, onReleaseChange }) => {
  const [data, setData] = useState<ReleaseAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!releaseId) {
      setData(null)
      setIsLoading(false)
      return
    }
    let active = true
    setIsLoading(true)
    setError(null)
    releaseAnalyticsService
      .getReleaseAnalytics(projectId, releaseId)
      .then((result) => {
        if (!active) return
        if (result.success) setData(result.data)
        else setError(result.message)
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Unable to load release analytics.')
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectId, releaseId])

  const findChartData = data?.timeToFind.map((p) => ({ days: `Day ${p.days}`, defects: p.defectCount })) ?? []
  const fixChartData = data?.timeToFix.map((p) => ({ days: `Day ${p.days}`, defects: p.defectCount })) ?? []

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">Release Analytics</h3>
          <p className="mt-0.5 text-xs text-ink-500">Time to find & fix defects for the selected release</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Dropdown
            aria-label="Select release"
            value={releaseId}
            onChange={(e) => onReleaseChange(e.target.value)}
            options={releases.map((r) => ({ value: r.id, label: `${r.name} (${r.version})` }))}
            placeholder="Select release"
            className="w-52"
          />
          {data && (
            <div className="flex flex-wrap gap-2">
              <SummaryChip label="Avg. Find" value={data.summary.averageTimeToFind} />
              <SummaryChip label="Median Find" value={data.summary.medianTimeToFind} />
              <SummaryChip label="Avg. Fix" value={data.summary.averageTimeToFix} />
              <SummaryChip label="Median Fix" value={data.summary.medianTimeToFix} />
              <SummaryChip label="Total Defects" value={data.summary.totalDefects} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Time to Find Defects"
          subtitle="Days taken to find defects vs. defect count"
          isLoading={isLoading}
          error={error}
          isEmpty={!releaseId || findChartData.length === 0}
          emptyLabel={!releaseId ? 'Select a release to view this chart.' : 'No defects found for the selected release.'}
        >
          <TrendLineChart data={findChartData} categoryKey="days" series={[{ key: 'defects', color: '#2E8FC9', label: 'Defects Found' }]} height={240} />
        </ChartCard>

        <ChartCard
          title="Time to Fix Defects"
          subtitle="Days taken to fix defects vs. defect count"
          isLoading={isLoading}
          error={error}
          isEmpty={!releaseId || fixChartData.length === 0}
          emptyLabel={!releaseId ? 'Select a release to view this chart.' : 'No fixed defects for the selected release.'}
        >
          <TrendLineChart data={fixChartData} categoryKey="days" series={[{ key: 'defects', color: '#3E8E64', label: 'Defects Fixed' }]} height={240} />
        </ChartCard>
      </div>

      {data && (
        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          <SummaryChip label="Open" value={data.summary.openCount} />
          <SummaryChip label="Closed" value={data.summary.closedCount} color={RISK_COLORS.LOW} />
          <SummaryChip label="Critical" value={data.summary.criticalCount} color={RISK_COLORS.CRITICAL} />
          <SummaryChip label="Fixed" value={data.summary.fixedCount} color={RISK_COLORS.LOW} />
          <SummaryChip label="Pending" value={data.summary.pendingCount} color={RISK_COLORS.MEDIUM} />
          <SummaryChip label="Reopened" value={data.summary.reopenedCount} color={RISK_COLORS.HIGH} />
        </div>
      )}
    </div>
  )
}
