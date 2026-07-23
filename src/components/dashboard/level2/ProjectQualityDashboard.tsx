import React, { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, RefreshCcw, Settings2 } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { ErrorMessage } from '@/components/common/ErrorMessage'
import { Input } from '@/components/common/Input'
import { Loader } from '@/components/common/Loader'
import { Modal } from '@/components/common/Modal'
import { ProjectSelector } from '@/components/projects/ProjectSelector'
import { RiskBadge } from '@/components/dashboard/shared/RiskBadge'
import { DashboardSectionBoundary } from '@/components/dashboard/shared/DashboardSectionBoundary'
import { PRIV } from '@/constants/privileges'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/hooks/useAuth'
import { useProject } from '@/hooks/useProject'
import { projectDashboardService } from '@/services/dashboard/projectDashboardService'
import { ProjectDashboardResponse, ProjectKloc } from '@/types/dashboard'
import { isKlocNotConfiguredMessage } from '@/utils/dashboard'
import { formatDate, formatDateTime } from '@/utils/format'
import { SeverityBreakdownPanel } from './SeverityBreakdownPanel'
import { ChartAnalyticsSection } from './ChartAnalyticsSection'
import { ModuleRiskHeatMapSection } from './ModuleRiskHeatMapSection'

const Metric: React.FC<{ title: string; available?: boolean; reason?: string | null; children: React.ReactNode }> = ({ title, available = true, reason, children }) =>
  <Card title={title} className={!available ? 'bg-ink-50' : undefined}>{available ? children : <div><p className="text-lg font-semibold text-ink-500">Not configured</p><p className="mt-1 text-xs text-ink-400">{reason || 'This metric is not available.'}</p></div>}</Card>

export const ProjectQualityDashboard: React.FC<{ projectId: string; onBackToPortfolio: () => void }> = ({ projectId, onBackToPortfolio }) => {
  const { hasPrivilege } = useAuth()
  const { setSelectedProject } = useProject()
  const toast = useToast()
  const [data, setData] = useState<ProjectDashboardResponse | null>(null)
  const [kloc, setKloc] = useState<ProjectKloc | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [klocError, setKlocError] = useState<string | null>(null)
  const [klocNotConfiguredReason, setKlocNotConfiguredReason] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isKlocOpen, setIsKlocOpen] = useState(false)
  const [klocValue, setKlocValue] = useState('')
  const [klocSubmitError, setKlocSubmitError] = useState<string | undefined>()
  const [isSavingKloc, setIsSavingKloc] = useState(false)

  const loadSummary = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await projectDashboardService.getProjectDashboard(projectId)
      if (result.success) {
        setData(result.data)
        setSelectedProject({ projectId: result.data.project.projectId, projectName: result.data.project.projectName, status: result.data.project.status })
      } else setError(result.message)
    } catch {
      setError('The Project dashboard could not be loaded. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, setSelectedProject])

  const loadKloc = useCallback(async () => {
    setKlocError(null)
    setKlocNotConfiguredReason(null)
    try {
      const result = await projectDashboardService.getProjectKloc(projectId)
      if (result.success) {
        setKloc(result.data)
      } else if (isKlocNotConfiguredMessage(result.message)) {
        setKloc(null)
        setKlocNotConfiguredReason('KLOC has not been configured for this Project.')
      } else {
        setKloc(null)
        setKlocError(result.message)
      }
    } catch {
      setKloc(null)
      setKlocError('KLOC information could not be loaded. The rest of the dashboard is still available.')
    }
  }, [projectId])

  useEffect(() => {
    setData(null)
    setKloc(null)
    setIsKlocOpen(false)
    setRefreshToken(0)
    void loadSummary()
    void loadKloc()
  }, [loadKloc, loadSummary, projectId])

  const refresh = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    await Promise.all([loadSummary(), loadKloc()])
    setRefreshToken((value) => value + 1)
    setIsRefreshing(false)
  }

  const saveKloc = async () => {
    if (isSavingKloc) return
    const value = Number(klocValue.trim())
    if (!Number.isFinite(value) || value <= 0) {
      setKlocSubmitError('KLOC must be a number greater than zero.')
      return
    }
    setIsSavingKloc(true)
    const result = await projectDashboardService.updateProjectKloc(projectId, value)
    setIsSavingKloc(false)
    if (!result.success) {
      setKlocSubmitError(result.message)
      return
    }
    toast.success(result.message)
    setIsKlocOpen(false)
    await Promise.all([loadKloc(), loadSummary()])
  }

  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={onBackToPortfolio}>Back to Portfolio</Button>
      <div className="flex flex-wrap items-end gap-2"><ProjectSelector className="w-64" /><Button variant="outline" size="sm" leftIcon={<RefreshCcw className="h-4 w-4" />} onClick={refresh} isLoading={isRefreshing}>Refresh</Button></div>
    </div>

    {isLoading ? <div className="flex h-60 items-center justify-center"><Loader label="Loading Project dashboard..." /></div> : error || !data ? <ErrorMessage message={error ?? 'Project dashboard unavailable.'} onRetry={loadSummary} /> : <>
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-ink-900">{data.project.projectName}</h1><Badge tone={data.project.status === 'ACTIVE' ? 'success' : data.project.status === 'ON_HOLD' ? 'medium' : 'neutral'}>{data.project.status.replace('_', ' ')}</Badge><RiskBadge risk={data.overallRisk} /></div><p className="mt-2 text-sm text-ink-500">Manager: {data.project.projectManagerName || 'Not assigned'} · {formatDate(data.project.startDate)} – {formatDate(data.project.endDate)}</p></div><p className="text-xs text-ink-400">Last updated {formatDateTime(data.lastUpdatedAt)}</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Metric title="Defect Density" available={data.defectDensity.calculationAvailable} reason={data.defectDensity.reason}><p className="text-2xl font-bold">{data.defectDensity.value} defects/KLOC</p><RiskBadge risk={data.defectDensity.risk} size="sm" /><p className="mt-2 text-xs text-ink-500">{data.defectDensity.totalConfirmedDefects} confirmed defects · {data.defectDensity.kloc} KLOC</p></Metric>
        <Metric title="Defect Severity Index" available={data.severityIndex.calculationAvailable} reason={data.severityIndex.reason}><p className="text-2xl font-bold">{data.severityIndex.value} / {data.severityIndex.maximumPossibleValue}</p><RiskBadge risk={data.severityIndex.risk} size="sm" /><div className="mt-2 h-2 overflow-hidden rounded bg-ink-100"><div className="h-full bg-brand-500" style={{ width: `${Math.min(100, Math.max(0, data.severityIndex.normalizedPercentage ?? 0))}%` }} /></div><p className="mt-1 text-xs text-ink-500">{data.severityIndex.normalizedPercentage}% · {data.severityIndex.totalConfirmedDefects} confirmed</p></Metric>
        <Metric title="Confirmed Defect Rate" available={data.confirmedDefectRate.calculationAvailable} reason={data.confirmedDefectRate.reason}><p className="text-2xl font-bold">{data.confirmedDefectRate.value}%</p><RiskBadge risk={data.confirmedDefectRate.risk} size="sm" /><p className="mt-2 text-xs text-ink-500">{data.confirmedDefectRate.confirmedDefects} confirmed · {data.confirmedDefectRate.nonConfirmedDefects} rejected/duplicate/cancelled · {data.confirmedDefectRate.totalReportedDefects} total</p></Metric>
        <Metric title="Open Defects"><p className="text-2xl font-bold">{data.counts.openDefects}</p><p className="text-xs text-ink-500">{data.counts.closedDefects} closed</p></Metric>
        <Metric title="Critical Open Defects"><p className="text-2xl font-bold text-signal-critical">{data.counts.criticalOpenDefects}</p></Metric>
        <Metric title="Reopened Defects"><p className="text-2xl font-bold">{data.counts.reopenedDefects}</p></Metric>
        <Metric title="Active Release Test Execution">{!data.currentRelease || !data.testExecutionProgress ? <p className="text-sm text-ink-500">No active release</p> : <><p className="font-semibold">{data.currentRelease.releaseName} · {data.currentRelease.version}</p><p className="text-2xl font-bold">{data.testExecutionProgress.percentage ?? '—'}%</p><p className="text-xs text-ink-500">{data.testExecutionProgress.executedTestCases}/{data.testExecutionProgress.totalAllocatedTestCases} executed · {data.testExecutionProgress.passedTestCases} passed · {data.testExecutionProgress.failedTestCases} failed</p></>}</Metric>
      </div>

      <Card title="KLOC Management">
        {klocError ? <ErrorMessage message={klocError} onRetry={loadKloc} /> : klocNotConfiguredReason ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Settings2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink-800">KLOC not configured</p>
                  <Badge tone="medium">Setup required</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-600">{klocNotConfiguredReason}</p>
                <p className="mt-1 text-xs text-ink-500">Defect Density remains unavailable until a KLOC value is configured.</p>
              </div>
            </div>
            {hasPrivilege(PRIV.DASHBOARD_KLOC_UPDATE) && <Button leftIcon={<Settings2 className="h-4 w-4" />} onClick={() => { setKlocValue(''); setKlocSubmitError(undefined); setIsKlocOpen(true) }}>Configure KLOC</Button>}
          </div>
        ) : <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xl font-bold">{kloc?.kloc ?? 'Not configured'}</p><p className="text-xs text-ink-500">Source: {kloc?.source || 'Not available'} · Recorded {formatDate(kloc?.recordedDate)} · By {kloc?.recordedBy || 'Not available'}</p><p className="mt-1 text-xs text-ink-400">Repository calculation is not configured.</p></div>{hasPrivilege(PRIV.DASHBOARD_KLOC_UPDATE) && <Button leftIcon={<Settings2 className="h-4 w-4" />} onClick={() => { setKlocValue(kloc?.kloc ? String(kloc.kloc) : ''); setKlocSubmitError(undefined); setIsKlocOpen(true) }}>Update KLOC</Button>}</div>}
      </Card>

      <DashboardSectionBoundary name="Severity breakdown" resetKey={`${projectId}:${refreshToken}`}><SeverityBreakdownPanel projectId={projectId} refreshToken={refreshToken} /></DashboardSectionBoundary>
      <DashboardSectionBoundary name="Chart analytics" resetKey={`${projectId}:${refreshToken}`}><ChartAnalyticsSection projectId={projectId} refreshToken={refreshToken} /></DashboardSectionBoundary>
      <DashboardSectionBoundary name="Module risk heat map" resetKey={`${projectId}:${refreshToken}`}><ModuleRiskHeatMapSection projectId={projectId} refreshToken={refreshToken} /></DashboardSectionBoundary>
    </>}

    <Modal isOpen={isKlocOpen} onClose={() => !isSavingKloc && setIsKlocOpen(false)} title="Update Project KLOC" size="sm" footer={<><Button variant="ghost" onClick={() => setIsKlocOpen(false)} disabled={isSavingKloc}>Cancel</Button><Button onClick={saveKloc} isLoading={isSavingKloc}>Update KLOC</Button></>}>
      <Input label="KLOC" required type="number" min="0.01" step="0.01" value={klocValue} error={klocSubmitError} onChange={(event) => { setKlocValue(event.target.value); setKlocSubmitError(undefined) }} />
    </Modal>
  </div>
}
