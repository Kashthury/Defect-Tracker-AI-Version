import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertOctagon, CheckCircle2, Clock, Eye, FolderKanban, PauseCircle, PlayCircle, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { RISK_COLORS, RiskLevel } from '@/config/riskThresholds'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Filter } from '@/components/common/Filter'
import { Loader } from '@/components/common/Loader'
import { Search } from '@/components/common/Search'
import { DonutChart } from '@/components/dashboard/charts/DonutChart'
import { ChartCard } from '@/components/dashboard/shared/ChartCard'
import { MetricCard } from '@/components/dashboard/shared/MetricCard'
import { RiskBadge } from '@/components/dashboard/shared/RiskBadge'
import { portfolioDashboardService } from '@/services/dashboard/portfolioDashboardService'
import { PortfolioDashboardResponse, PortfolioProject } from '@/types/dashboard'
import { formatDateTime, formatNumber } from '@/utils/format'

const STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
]
const RISK_OPTIONS = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
]

export const PortfolioDashboard: React.FC<{ onSelectProject: (project: PortfolioProject) => void }> = ({ onSelectProject }) => {
  const [data, setData] = useState<PortfolioDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [risk, setRisk] = useState('All')
  const [delayedOnly, setDelayedOnly] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await portfolioDashboardService.getPortfolioDashboard()
    if (result.success) setData(result.data)
    else setError(result.message)
    setIsLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  const projects = useMemo(() => data?.projects.filter((project) => {
    if (search && !project.projectName.toLowerCase().includes(search.trim().toLowerCase())) return false
    if (status !== 'All' && project.status !== status) return false
    if (risk !== 'All' && project.risk !== risk) return false
    if (delayedOnly && !project.delayed) return false
    return true
  }) ?? [], [data, delayedOnly, risk, search, status])

  if (isLoading) return <div className="flex h-72 items-center justify-center"><Loader label="Loading portfolio dashboard..." /></div>
  if (error || !data) return <div className="py-10"><ErrorMessage message={error ?? 'Portfolio dashboard unavailable.'} onRetry={load} /></div>

  const summary = data.summary
  const cards = [
    ['Total Projects', summary.totalProjects, FolderKanban, '#12507F'],
    ['Active', summary.activeProjects, PlayCircle, '#3E8E64'],
    ['On Hold', summary.onHoldProjects, PauseCircle, '#C99A2E'],
    ['Completed', summary.completedProjects, CheckCircle2, '#64748B'],
    ['Delayed', summary.delayedProjects, Clock, '#C13B3B'],
  ] as const
  const riskCards = [
    ['Low Risk', summary.lowRiskCount, ShieldCheck, RISK_COLORS.LOW],
    ['Medium Risk', summary.mediumRiskCount, ShieldAlert, RISK_COLORS.MEDIUM],
    ['High Risk', summary.highRiskCount, AlertOctagon, RISK_COLORS.HIGH],
    ['Critical Risk', summary.criticalRiskCount, Activity, RISK_COLORS.CRITICAL],
  ] as const
  const donutData = data.riskDistribution.map((item) => ({
    name: `${item.risk.charAt(0)}${item.risk.slice(1).toLowerCase()} Risk`,
    value: item.count,
    color: RISK_COLORS[item.risk],
  }))

  return <div className="flex flex-col gap-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map(([label, value, Icon, accent]) => <MetricCard key={label} label={label} value={formatNumber(value)} icon={<Icon className="h-5 w-5" />} tint="bg-ink-50" accent={accent} />)}
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {riskCards.map(([label, value, Icon, accent]) => <MetricCard key={label} label={label} value={formatNumber(value)} icon={<Icon className="h-4 w-4" />} tint="bg-white" accent={accent} />)}
    </div>

    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <ChartCard title="Portfolio Risk Distribution" subtitle="Current non-completed Project risk from the backend" height={300}>
        {donutData.length ? <DonutChart data={donutData} centerValue={String(donutData.reduce((sum, item) => sum + item.value, 0))} centerLabel="Projects" /> : <p className="py-20 text-center text-sm text-ink-500">No current risk data is available.</p>}
      </ChartCard>
      <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-panel">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Search value={search} onChange={setSearch} placeholder="Search Project name..." />
          <Filter label="Status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <Filter label="Risk" value={risk} options={RISK_OPTIONS} onChange={setRisk} />
          <label className="inline-flex items-center gap-2 text-sm text-ink-600"><input type="checkbox" checked={delayedOnly} onChange={(event) => setDelayedOnly(event.target.checked)} />Delayed only</label>
          <Button variant="filterClear" size="sm" leftIcon={<X className="h-4 w-4" />} disabled={!search && status === 'All' && risk === 'All' && !delayedOnly} onClick={() => { setSearch(''); setStatus('All'); setRisk('All'); setDelayedOnly(false) }}>Clear Filters</Button>
        </div>
        {projects.length === 0 ? <p className="py-12 text-center text-sm text-ink-500">{data.projects.length ? 'No Projects match the selected filters.' : 'No Projects are available for your account.'}</p> : <div className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => <button key={project.projectId} type="button" onClick={() => onSelectProject(project)} className="rounded-xl border border-ink-100 p-4 text-left transition hover:border-brand-300 hover:bg-brand-50/30">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-ink-900">{project.projectName}</p><Badge tone={project.status === 'ACTIVE' ? 'success' : project.status === 'ON_HOLD' ? 'medium' : 'neutral'}>{project.status.replace('_', ' ')}</Badge></div><RiskBadge risk={project.risk} size="sm" /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-ink-400">Open Defects</p><p className="font-semibold">{project.openDefectCount}</p></div><div><p className="text-ink-400">Critical Open</p><p className="font-semibold text-signal-critical">{project.criticalDefectCount}</p></div></div>
            <div className="mt-3 text-xs text-ink-500"><p>{project.currentRelease ? `${project.currentRelease.releaseName} · ${project.currentRelease.version}` : 'No active release'}</p><p>{project.testExecutionProgress?.percentage == null ? 'Test execution not available' : `${project.testExecutionProgress.percentage}% test execution`}</p><p className="mt-2">Updated {formatDateTime(project.lastUpdatedAt)}</p></div>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600"><Eye className="h-3.5 w-3.5" />View Dashboard</span>
          </button>)}
        </div>}
      </div>
    </div>
  </div>
}
