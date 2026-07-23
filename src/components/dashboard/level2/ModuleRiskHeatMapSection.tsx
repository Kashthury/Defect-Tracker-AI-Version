import React, { useEffect, useState } from 'react'
import { ChartCard } from '@/components/dashboard/shared/ChartCard'
import { HeatMapGrid } from '@/components/dashboard/charts/HeatMapGrid'
import { projectDashboardService } from '@/services/dashboard/projectDashboardService'
import { ModuleRiskHeatMap } from '@/types/dashboard'

interface ModuleRiskHeatMapSectionProps {
  projectId: string
  refreshToken: number
}

export const ModuleRiskHeatMapSection: React.FC<ModuleRiskHeatMapSectionProps> = ({ projectId, refreshToken }) => {
  const [data, setData] = useState<ModuleRiskHeatMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)
    projectDashboardService
      .getModuleRisk(projectId)
      .then((result) => {
        if (!active) return
        if (result.success) setData(result.data)
        else setError(result.message)
        setIsLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Unable to load module risk heat map.')
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectId, refreshToken])

  return (
    <ChartCard
      title="Module Risk Heat Map"
      subtitle="Modules vs. severities — darker cells indicate higher risk concentration"
      isLoading={isLoading}
      error={error}
      isEmpty={!!data && data.modules.length === 0}
      emptyLabel="No Module risk data is available."
      height={260}
    >
      {data && <HeatMapGrid modules={data.modules} severities={data.severities} cells={data.cells} />}
    </ChartCard>
  )
}
