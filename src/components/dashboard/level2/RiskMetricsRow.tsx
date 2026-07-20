import React, { useState } from 'react'
import { GitBranch } from 'lucide-react'
import { riskRank } from '@/config/riskThresholds'
import { GaugeChart } from '@/components/dashboard/charts/GaugeChart'
import { RadialProgressGauge } from '@/components/dashboard/charts/RadialProgressGauge'
import { LinearZoneMeter } from '@/components/dashboard/charts/LinearZoneMeter'
import { PercentageRatioBar } from '@/components/dashboard/charts/PercentageRatioBar'
import { RiskBadge } from '@/components/dashboard/shared/RiskBadge'
import { KlocRepositoryModal } from './KlocRepositoryModal'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { projectDashboardService } from '@/services/dashboard/projectDashboardService'
import { ProjectQualityDashboardData } from '@/types/dashboard'
import { formatNumber } from '@/utils/format'

interface RiskMetricsRowProps {
  projectId: string
  data: ProjectQualityDashboardData
  onDataChanged: (data: ProjectQualityDashboardData) => void
}

const SectionShell: React.FC<{ title: string; subtitle: string; actions?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
  children,
}) => (
  <div className="flex flex-col rounded-xl border border-ink-100 bg-white p-5 shadow-panel">
    <div className="mb-2 flex items-start justify-between gap-2">
      <div>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
        <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>
      </div>
    </div>
    <div className="flex flex-1 flex-col items-center justify-center">{children}</div>
    {actions && <div className="mt-3">{actions}</div>}
  </div>
)

export const RiskMetricsRow: React.FC<RiskMetricsRowProps> = ({ projectId, data, onDataChanged }) => {
  const [klocInput, setKlocInput] = useState(String(data.defectDensity.kloc))
  const [isUpdatingKloc, setIsUpdatingKloc] = useState(false)
  const [klocError, setKlocError] = useState<string | null>(null)
  const [klocSuccess, setKlocSuccess] = useState<string | null>(null)
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false)

  const handleUpdateKloc = async () => {
    setKlocError(null)
    setKlocSuccess(null)
    const parsed = Number(klocInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setKlocError('Enter a valid KLOC value greater than zero.')
      return
    }
    setIsUpdatingKloc(true)
    try {
      const result = await projectDashboardService.updateKloc({ projectId, kloc: parsed })
      if (result.success) {
        onDataChanged(result.data)
        setKlocSuccess('Defect Density refreshed.')
      } else {
        setKlocError(result.message)
      }
    } catch {
      setKlocError('Unable to update KLOC right now.')
    } finally {
      setIsUpdatingKloc(false)
    }
  }

  const handleRepoCalculated = async (newKloc: number) => {
    setKlocInput(String(newKloc))
    const result = await projectDashboardService.getProjectQualityDashboard(projectId)
    if (result.success) onDataChanged(result.data)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {/* Overall Project Risk — semicircular speedometer gauge */}
      <SectionShell title="Overall Project Risk" subtitle="Auto-refreshes from density, severity index & remark ratio">
        <GaugeChart
          value={riskRank(data.overallRisk.risk) + 1}
          max={4}
          zones={[
            { risk: 'LOW', upTo: 1 },
            { risk: 'MEDIUM', upTo: 2 },
            { risk: 'HIGH', upTo: 3 },
            { risk: 'CRITICAL', upTo: null },
          ]}
          risk={data.overallRisk.risk}
          hideValue
        />
        <div className="mt-3 flex w-full flex-col gap-1.5">
          {data.overallRisk.contributingMetrics.map((m) => (
            <div key={m.label} className="flex items-center justify-between text-xs">
              <span className="text-ink-500">{m.label}</span>
              <RiskBadge risk={m.risk} size="sm" dot={false} />
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Defect Density — full-circle radial progress ring */}
      <SectionShell
        title="Defect Density"
        subtitle="Confirmed defects &divide; KLOC"
        actions={
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                aria-label="KLOC value"
                type="number"
                min={0}
                value={klocInput}
                onChange={(e) => setKlocInput(e.target.value)}
                className="h-8 text-xs"
              />
              <Button size="sm" variant="secondary" isLoading={isUpdatingKloc} onClick={handleUpdateKloc}>Update</Button>
            </div>
            <Button size="sm" variant="outline" leftIcon={<GitBranch className="h-3.5 w-3.5" />} onClick={() => setIsRepoModalOpen(true)}>
              Calculate KLOC from Git Repository
            </Button>
            {klocError && <p className="text-[11px] text-signal-critical">{klocError}</p>}
            {klocSuccess && <p className="text-[11px] text-signal-low">{klocSuccess}</p>}
          </div>
        }
      >
        <RadialProgressGauge value={data.defectDensity.value} max={40} risk={data.defectDensity.risk} unit="/KLOC" />
        <div className="mt-1 flex w-full justify-between text-xs text-ink-500">
          <span>{formatNumber(data.defectDensity.totalConfirmedDefects)} defects</span>
          <span>{data.defectDensity.kloc} KLOC</span>
        </div>
      </SectionShell>

      {/* Defect Severity Index — horizontal segmented meter with pointer */}
      <SectionShell title="Defect Severity Index" subtitle="Weighted by configured severity weight">
        <LinearZoneMeter value={data.severityIndex.value} max={100} zones={data.severityIndex.zones} risk={data.severityIndex.risk} />
        <p className="mt-2 text-xs text-ink-500">{formatNumber(data.severityIndex.totalConfirmedDefects)} confirmed defects weighted</p>
      </SectionShell>

      {/* Defect-to-Remark Ratio — stacked percentage fill bar */}
      <SectionShell title="Defect-to-Remark Ratio" subtitle="Confirmed defects &divide; total reported remarks">
        <PercentageRatioBar
          value={data.defectToRemarkRatio.value}
          risk={data.defectToRemarkRatio.risk}
          confirmed={data.defectToRemarkRatio.confirmedDefects}
          nonConfirmed={data.defectToRemarkRatio.nonConfirmedRemarks}
          total={data.defectToRemarkRatio.totalRemarks}
        />
      </SectionShell>

      <KlocRepositoryModal
        isOpen={isRepoModalOpen}
        projectId={projectId}
        onClose={() => setIsRepoModalOpen(false)}
        onCalculated={handleRepoCalculated}
      />
    </div>
  )
}
