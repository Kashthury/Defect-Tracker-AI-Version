import React, { useEffect, useMemo, useState } from 'react'
import { AlertOctagon, CheckCircle2, Clock, FolderKanban, ShieldAlert, ShieldCheck } from 'lucide-react'
import { RISK_COLORS, RiskLevel } from '@/config/riskThresholds'
import { MetricCard } from '@/components/dashboard/shared/MetricCard'
import { RiskBadge } from '@/components/dashboard/shared/RiskBadge'
import { ChartCard } from '@/components/dashboard/shared/ChartCard'
import { DonutChart } from '@/components/dashboard/charts/DonutChart'
import { Loader } from '@/components/common/Loader'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { portfolioDashboardService } from '@/services/dashboard/portfolioDashboardService'
import { PortfolioDashboardData, PortfolioProjectCard } from '@/types/dashboard'
import { formatDate, formatNumber } from '@/utils/format'
import { cn } from '@/utils/cn'

type RiskTab = 'HIGH' | 'MEDIUM' | 'LOW'

interface PortfolioDashboardProps {
  onSelectProject: (project: PortfolioProjectCard) => void
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ onSelectProject }) => {
  const [data, setData] = useState<PortfolioDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<RiskTab>('HIGH')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    portfolioDashboardService
      .getPortfolioDashboard()
      .then((result) => {
        if (!active) return
        if (result.success) setData(result.data)
        else setError(result.message)
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Unable to load the portfolio dashboard.')
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const projectsForTab = useMemo(() => {
    if (!data) return []
    const risks: Record<RiskTab, RiskLevel[]> = { HIGH: ['HIGH', 'CRITICAL'], MEDIUM: ['MEDIUM'], LOW: ['LOW'] }
    return data.projects.filter((p) => risks[activeTab].includes(p.risk))
  }, [data, activeTab])

  if (isLoading) {
    return <div className="flex h-72 items-center justify-center"><Loader label="Loading portfolio risk dashboard..." /></div>
  }
  if (error || !data) {
    return <div className="py-10"><ErrorMessage message={error ?? 'Portfolio data unavailable.'} onRetry={() => setReloadKey((k) => k + 1)} /></div>
  }

  const { summary, riskDistribution } = data
  const donutData = riskDistribution.map((slice) => ({
    name: `${slice.risk.charAt(0)}${slice.risk.slice(1).toLowerCase()} Risk`,
    value: slice.count,
    color: RISK_COLORS[slice.risk],
  }))

  const tabCounts: Record<RiskTab, number> = {
    HIGH: summary.highRiskCount + summary.criticalRiskCount,
    MEDIUM: summary.mediumRiskCount,
    LOW: summary.lowRiskCount,
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total Projects" value={formatNumber(summary.totalProjects)} icon={<FolderKanban className="h-5 w-5" />} tint="bg-brand-50" accent="#12507F" />
        <MetricCard label="Low Risk" value={formatNumber(summary.lowRiskCount)} icon={<ShieldCheck className="h-5 w-5" />} tint="bg-emerald-50" accent={RISK_COLORS.LOW} />
        <MetricCard label="Medium Risk" value={formatNumber(summary.mediumRiskCount)} icon={<ShieldAlert className="h-5 w-5" />} tint="bg-amber-50" accent={RISK_COLORS.MEDIUM} />
        <MetricCard label="High Risk" value={formatNumber(summary.highRiskCount + summary.criticalRiskCount)} icon={<AlertOctagon className="h-5 w-5" />} tint="bg-orange-50" accent={RISK_COLORS.HIGH} />
        <MetricCard label="Completed" value={formatNumber(summary.completedProjects)} icon={<CheckCircle2 className="h-5 w-5" />} tint="bg-ink-100" accent="#26314A" />
        <MetricCard label="Delayed" value={formatNumber(summary.delayedProjects)} icon={<Clock className="h-5 w-5" />} tint="bg-red-50" accent={RISK_COLORS.CRITICAL} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <ChartCard title="Portfolio Risk Distribution" subtitle="Share of active projects by risk category" className="xl:col-span-2" height={300}>
          <DonutChart data={donutData} centerValue={String(summary.totalProjects)} centerLabel="Projects" />
        </ChartCard>

        <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-panel xl:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink-900">Projects by Risk Category</h3>
            <div className="flex rounded-lg bg-ink-50 p-1">
              {(['HIGH', 'MEDIUM', 'LOW'] as RiskTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    activeTab === tab ? 'bg-white shadow-panel' : 'text-ink-500 hover:text-ink-700',
                  )}
                  style={activeTab === tab ? { color: RISK_COLORS[tab] } : undefined}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()} ({tabCounts[tab]})
                </button>
              ))}
            </div>
          </div>

          {projectsForTab.length === 0 ? (
            <p className="py-10 text-center text-xs text-ink-500">No projects fall under this risk category.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {projectsForTab.map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  onClick={() => onSelectProject(project)}
                  className="flex w-full flex-col gap-2.5 rounded-lg border border-ink-100 p-3.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: RISK_COLORS[project.risk] }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{project.projectName}</p>
                      <p className="text-xs text-ink-500">Release: {project.currentRelease} &middot; Updated {formatDate(project.lastUpdatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-4 text-xs sm:gap-5">
                    <div className="text-center">
                      <p className="font-semibold text-ink-900">{project.openDefectCount}</p>
                      <p className="text-ink-400">Open</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold" style={{ color: RISK_COLORS.CRITICAL }}>{project.criticalDefectCount}</p>
                      <p className="text-ink-400">Critical</p>
                    </div>
                    <div className="w-24">
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${project.completionPercentage}%` }} />
                      </div>
                      <p className="mt-1 text-center text-ink-400">{project.completionPercentage}% done</p>
                    </div>
                    <RiskBadge risk={project.risk} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
